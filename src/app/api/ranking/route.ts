import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MatchResult } from "@/data/results";

function getActualOutcome(homeScore: number, awayScore: number): "L" | "E" | "V" {
  if (homeScore > awayScore) return "L";
  if (homeScore < awayScore) return "V";
  return "E";
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sql = getDb();

  const [resultsRows, users, predictions, comodines, exactScoreRows, matchSettingsRows, bonusResultRows, bonusPredRows, bonusQuestionRows] = await Promise.all([
    sql`SELECT match_id, home_score, away_score FROM match_results`,
    sql`SELECT id, name, avatar FROM users WHERE pin != 'PENDING' ORDER BY name`,
    sql`SELECT user_id, match_id, outcome FROM planilla_predictions`,
    sql`SELECT user_id, scope, match_id FROM planilla_comodines`,
    sql`SELECT user_id, match_id, home_score, away_score FROM exact_score_predictions`,
    sql`SELECT match_id FROM match_settings WHERE exact_score = true`,
    sql`SELECT question_id, correct_answer, points FROM bonus_results`,
    sql`SELECT user_id, question_id, answer FROM bonus_predictions`,
    sql`SELECT id, source_type FROM bonus_questions`,
  ]);

  const matchResults: Record<string, MatchResult> = {};
  for (const r of resultsRows) {
    matchResults[r.match_id as string] = {
      matchId: r.match_id as string,
      homeScore: r.home_score as number,
      awayScore: r.away_score as number,
    };
  }

  // Build predictions map per user
  const predByUser: Record<number, Record<string, string>> = {};
  for (const p of predictions) {
    const uid = p.user_id as number;
    if (!predByUser[uid]) predByUser[uid] = {};
    predByUser[uid][p.match_id as string] = p.outcome as string;
  }

  // Build comodines map per user: scope → matchId
  const comodinByUser: Record<number, Record<string, string>> = {};
  for (const c of comodines) {
    const uid = c.user_id as number;
    if (!comodinByUser[uid]) comodinByUser[uid] = {};
    comodinByUser[uid][c.scope as string] = c.match_id as string;
  }

  // Build exact score predictions per user
  const exactByUser: Record<number, Record<string, { homeScore: number; awayScore: number }>> = {};
  for (const e of exactScoreRows) {
    const uid = e.user_id as number;
    if (!exactByUser[uid]) exactByUser[uid] = {};
    exactByUser[uid][e.match_id as string] = {
      homeScore: e.home_score as number,
      awayScore: e.away_score as number,
    };
  }

  // Set of matches with exact score enabled
  const exactScoreMatches = new Set(matchSettingsRows.map((r) => r.match_id as string));

  // Bonus question types
  const questionTypes: Record<string, string> = {};
  for (const bq of bonusQuestionRows) {
    questionTypes[bq.id as string] = bq.source_type as string;
  }

  // Bonus results: question → { correctAnswer, points }
  const bonusAnswers: Record<string, { correctAnswer: string; points: number }> = {};
  for (const br of bonusResultRows) {
    bonusAnswers[br.question_id as string] = {
      correctAnswer: (br.correct_answer as string).toLowerCase(),
      points: br.points as number,
    };
  }

  // Bonus predictions per user: questionId → answer
  const bonusPredByUser: Record<number, Record<string, string>> = {};
  for (const bp of bonusPredRows) {
    const uid = bp.user_id as number;
    if (!bonusPredByUser[uid]) bonusPredByUser[uid] = {};
    bonusPredByUser[uid][bp.question_id as string] = bp.answer as string;
  }

  // For exact_value questions: find closest prediction per question
  const exactValueWinners: Record<string, Set<number>> = {};
  for (const [qId, result] of Object.entries(bonusAnswers)) {
    if (questionTypes[qId] !== "exact_value") continue;
    const correctVal = parseFloat(result.correctAnswer);
    if (isNaN(correctVal)) continue;

    let minDiff = Infinity;
    const candidates: { uid: number; diff: number }[] = [];
    for (const user of users) {
      const uid = user.id as number;
      const userAnswer = bonusPredByUser[uid]?.[qId];
      if (!userAnswer) continue;
      const val = parseFloat(userAnswer);
      if (isNaN(val)) continue;
      const diff = Math.abs(val - correctVal);
      candidates.push({ uid, diff });
      if (diff < minDiff) minDiff = diff;
    }

    exactValueWinners[qId] = new Set(
      candidates.filter((c) => c.diff === minDiff).map((c) => c.uid),
    );
  }

  // Compute points per user
  const ranking = users.map((user) => {
    const uid = user.id as number;
    const userPreds = predByUser[uid] ?? {};
    const userComodines = comodinByUser[uid] ?? {};
    const userExact = exactByUser[uid] ?? {};

    let points = 0;
    let correct = 0;
    let wrong = 0;
    let comodinPoints = 0;
    let exactScorePoints = 0;
    let bonusPoints = 0;

    for (const [matchId, result] of Object.entries(matchResults)) {
      const actual = getActualOutcome(result.homeScore, result.awayScore);
      const prediction = userPreds[matchId];

      if (!prediction) {
        wrong++;
        continue;
      }

      if (prediction.includes(actual)) {
        points += 1;
        correct++;

        // Check if comodin was on this match
        for (const comodinMatchId of Object.values(userComodines)) {
          if (comodinMatchId === matchId) {
            points += 2;
            comodinPoints += 2;
            break;
          }
        }
      } else {
        wrong++;
      }

      // Exact score bonus (+2)
      if (exactScoreMatches.has(matchId) && userExact[matchId]) {
        const ex = userExact[matchId];
        if (ex.homeScore === result.homeScore && ex.awayScore === result.awayScore) {
          points += 2;
          exactScorePoints += 2;
        }
      }
    }

    // Bonus points
    const userBonusPreds = bonusPredByUser[uid] ?? {};
    for (const [qId, result] of Object.entries(bonusAnswers)) {
      if (questionTypes[qId] === "exact_value") {
        if (exactValueWinners[qId]?.has(uid)) {
          points += result.points;
          bonusPoints += result.points;
        }
      } else {
        const userAnswer = userBonusPreds[qId];
        if (userAnswer && userAnswer.toLowerCase() === result.correctAnswer) {
          points += result.points;
          bonusPoints += result.points;
        }
      }
    }

    return {
      user: {
        id: uid,
        name: user.name as string,
        avatar: user.avatar as string,
      },
      points,
      correct,
      wrong,
      comodinPoints,
      exactScorePoints,
      bonusPoints,
    };
  });

  ranking.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.wrong - b.wrong;
  });

  return NextResponse.json({ ranking });
}
