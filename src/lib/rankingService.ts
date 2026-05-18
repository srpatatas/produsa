import { MatchResult } from "@/data/results";
import { getOutcome } from "@/lib/outcomeStyles";
import type { NeonQueryFunction } from "@neondatabase/serverless";

export interface RankingUser {
  id: number;
  name: string;
  avatar: string;
}

export interface RankingMaps {
  users: RankingUser[];
  predByUser: Record<number, Record<string, string>>;
  comodinByUser: Record<number, Record<string, string>>;
  exactByUser: Record<number, Record<string, { homeScore: number; awayScore: number }>>;
  exactScoreMatches: Set<string>;
}

export interface BonusMaps {
  questionTypes: Record<string, string>;
  bonusAnswers: Record<string, { correctAnswer: string; points: number }>;
  bonusPredByUser: Record<number, Record<string, string>>;
  exactValueWinners: Record<string, Set<number>>;
}

export async function fetchRankingMaps(sql: NeonQueryFunction<false, false>): Promise<RankingMaps> {
  const [users, predictions, comodines, exactScoreRows, matchSettingsRows] =
    await Promise.all([
      sql`SELECT id, name, avatar FROM users WHERE pin != 'PENDING' ORDER BY name`,
      sql`SELECT user_id, match_id, outcome FROM planilla_predictions`,
      sql`SELECT user_id, scope, match_id FROM planilla_comodines`,
      sql`SELECT user_id, match_id, home_score, away_score FROM exact_score_predictions`,
      sql`SELECT match_id FROM match_settings WHERE exact_score = true`,
    ]);

  const predByUser: Record<number, Record<string, string>> = {};
  for (const p of predictions) {
    const uid = p.user_id as number;
    if (!predByUser[uid]) predByUser[uid] = {};
    predByUser[uid][p.match_id as string] = p.outcome as string;
  }

  const comodinByUser: Record<number, Record<string, string>> = {};
  for (const c of comodines) {
    const uid = c.user_id as number;
    if (!comodinByUser[uid]) comodinByUser[uid] = {};
    comodinByUser[uid][c.scope as string] = c.match_id as string;
  }

  const exactByUser: Record<number, Record<string, { homeScore: number; awayScore: number }>> = {};
  for (const e of exactScoreRows) {
    const uid = e.user_id as number;
    if (!exactByUser[uid]) exactByUser[uid] = {};
    exactByUser[uid][e.match_id as string] = {
      homeScore: e.home_score as number,
      awayScore: e.away_score as number,
    };
  }

  const exactScoreMatches = new Set(matchSettingsRows.map((r) => r.match_id as string));

  return {
    users: users.map((u) => ({ id: u.id as number, name: u.name as string, avatar: u.avatar as string })),
    predByUser,
    comodinByUser,
    exactByUser,
    exactScoreMatches,
  };
}

export async function fetchBonusMaps(
  sql: NeonQueryFunction<false, false>,
  users: RankingUser[],
): Promise<BonusMaps> {
  const [bonusResultRows, bonusPredRows, bonusQuestionRows] = await Promise.all([
    sql`SELECT question_id, correct_answer, points FROM bonus_results`,
    sql`SELECT user_id, question_id, answer FROM bonus_predictions`,
    sql`SELECT id, source_type FROM bonus_questions`,
  ]);

  const questionTypes: Record<string, string> = {};
  for (const bq of bonusQuestionRows) {
    questionTypes[bq.id as string] = bq.source_type as string;
  }

  const bonusAnswers: Record<string, { correctAnswer: string; points: number }> = {};
  for (const br of bonusResultRows) {
    bonusAnswers[br.question_id as string] = {
      correctAnswer: (br.correct_answer as string).toLowerCase(),
      points: br.points as number,
    };
  }

  const bonusPredByUser: Record<number, Record<string, string>> = {};
  for (const bp of bonusPredRows) {
    const uid = bp.user_id as number;
    if (!bonusPredByUser[uid]) bonusPredByUser[uid] = {};
    bonusPredByUser[uid][bp.question_id as string] = bp.answer as string;
  }

  const exactValueWinners: Record<string, Set<number>> = {};
  for (const [qId, result] of Object.entries(bonusAnswers)) {
    if (questionTypes[qId] !== "exact_value") continue;
    const correctVal = parseFloat(result.correctAnswer);
    if (isNaN(correctVal)) continue;

    let minDiff = Infinity;
    const candidates: { uid: number; diff: number }[] = [];
    for (const user of users) {
      const userAnswer = bonusPredByUser[user.id]?.[qId];
      if (!userAnswer) continue;
      const val = parseFloat(userAnswer);
      if (isNaN(val)) continue;
      const diff = Math.abs(val - correctVal);
      candidates.push({ uid: user.id, diff });
      if (diff < minDiff) minDiff = diff;
    }

    exactValueWinners[qId] = new Set(
      candidates.filter((c) => c.diff === minDiff).map((c) => c.uid),
    );
  }

  return { questionTypes, bonusAnswers, bonusPredByUser, exactValueWinners };
}

export interface MatchPointsResult {
  points: number;
  correct: number;
  wrong: number;
  comodinPoints: number;
  exactScorePoints: number;
}

export function computeMatchPoints(
  uid: number,
  matchResults: Record<string, MatchResult>,
  maps: RankingMaps,
  skipMatchIds?: Set<string>,
): MatchPointsResult {
  const userPreds = maps.predByUser[uid] ?? {};
  const userComodines = maps.comodinByUser[uid] ?? {};
  const userExact = maps.exactByUser[uid] ?? {};

  let points = 0;
  let correct = 0;
  let wrong = 0;
  let comodinPoints = 0;
  let exactScorePoints = 0;

  for (const [matchId, result] of Object.entries(matchResults)) {
    if (skipMatchIds?.has(matchId)) continue;
    const actual = getOutcome(result.homeScore, result.awayScore);
    const prediction = userPreds[matchId];

    if (!prediction) {
      wrong++;
      continue;
    }

    if (prediction.includes(actual)) {
      points += 1;
      correct++;

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

    if (maps.exactScoreMatches.has(matchId) && userExact[matchId]) {
      const ex = userExact[matchId];
      if (ex.homeScore === result.homeScore && ex.awayScore === result.awayScore) {
        points += 2;
        exactScorePoints += 2;
      }
    }
  }

  return { points, correct, wrong, comodinPoints, exactScorePoints };
}

export function computeBonusPoints(
  uid: number,
  bonus: BonusMaps,
): number {
  let bonusPoints = 0;
  const userBonusPreds = bonus.bonusPredByUser[uid] ?? {};

  for (const [qId, result] of Object.entries(bonus.bonusAnswers)) {
    if (bonus.questionTypes[qId] === "exact_value") {
      if (bonus.exactValueWinners[qId]?.has(uid)) {
        bonusPoints += result.points;
      }
    } else {
      const userAnswer = userBonusPreds[qId];
      if (userAnswer && userAnswer.toLowerCase() === result.correctAnswer) {
        bonusPoints += result.points;
      }
    }
  }

  return bonusPoints;
}
