import { KnockoutMatch, TeamSlot } from "@/types";

function gp(position: number, group: string): TeamSlot {
  const ordinal = position === 1 ? "1ro" : position === 2 ? "2do" : "3ro";
  return {
    type: "group-position",
    ref: `${position}${group}`,
    label: `${ordinal} Grupo ${group}`,
  };
}

function bt(groups: string): TeamSlot {
  return {
    type: "best-third",
    ref: `3${groups}`,
    label: `3ro Grupo ${groups}`,
  };
}

function kw(matchId: string): TeamSlot {
  return {
    type: "knockout-winner",
    ref: `W-${matchId}`,
    label: `Ganador ${matchId}`,
  };
}

function kl(matchId: string): TeamSlot {
  return {
    type: "knockout-loser",
    ref: `L-${matchId}`,
    label: `Perdedor ${matchId}`,
  };
}

export const knockoutMatches: KnockoutMatch[] = [
  // Round of 32
  { id: "R32-1",  round: "R32", matchNumber: 1,  homeSlot: gp(1, "A"), awaySlot: bt("C/D/E"),  kickoff: "2026-06-28T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-2",  round: "R32", matchNumber: 2,  homeSlot: gp(2, "A"), awaySlot: gp(2, "C"),    kickoff: "2026-06-28T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-3",  round: "R32", matchNumber: 3,  homeSlot: gp(1, "B"), awaySlot: bt("A/D/E"),  kickoff: "2026-06-28T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-4",  round: "R32", matchNumber: 4,  homeSlot: gp(2, "B"), awaySlot: gp(2, "D"),    kickoff: "2026-06-28T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-5",  round: "R32", matchNumber: 5,  homeSlot: gp(1, "C"), awaySlot: bt("B/F/G"),  kickoff: "2026-06-29T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-6",  round: "R32", matchNumber: 6,  homeSlot: gp(2, "E"), awaySlot: gp(2, "G"),    kickoff: "2026-06-29T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-7",  round: "R32", matchNumber: 7,  homeSlot: gp(1, "D"), awaySlot: bt("A/B/F"),  kickoff: "2026-06-29T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-8",  round: "R32", matchNumber: 8,  homeSlot: gp(2, "F"), awaySlot: gp(2, "H"),    kickoff: "2026-06-29T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-9",  round: "R32", matchNumber: 9,  homeSlot: gp(1, "E"), awaySlot: bt("C/G/H"),  kickoff: "2026-06-30T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-10", round: "R32", matchNumber: 10, homeSlot: gp(2, "I"), awaySlot: gp(2, "K"),    kickoff: "2026-06-30T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-11", round: "R32", matchNumber: 11, homeSlot: gp(1, "F"), awaySlot: bt("B/I/J"),  kickoff: "2026-06-30T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-12", round: "R32", matchNumber: 12, homeSlot: gp(2, "J"), awaySlot: gp(2, "L"),    kickoff: "2026-06-30T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-13", round: "R32", matchNumber: 13, homeSlot: gp(1, "G"), awaySlot: bt("D/I/L"),  kickoff: "2026-07-01T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-14", round: "R32", matchNumber: 14, homeSlot: gp(2, "H"), awaySlot: gp(1, "I"),    kickoff: "2026-07-01T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-15", round: "R32", matchNumber: 15, homeSlot: gp(1, "H"), awaySlot: bt("E/J/K"),  kickoff: "2026-07-01T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R32-16", round: "R32", matchNumber: 16, homeSlot: gp(1, "J"), awaySlot: gp(1, "K"),    kickoff: "2026-07-01T20:00:00Z", venue: "TBD", city: "TBD" },

  // Round of 16
  { id: "R16-1", round: "R16", matchNumber: 1, homeSlot: kw("R32-1"),  awaySlot: kw("R32-2"),  kickoff: "2026-07-04T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R16-2", round: "R16", matchNumber: 2, homeSlot: kw("R32-3"),  awaySlot: kw("R32-4"),  kickoff: "2026-07-04T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R16-3", round: "R16", matchNumber: 3, homeSlot: kw("R32-5"),  awaySlot: kw("R32-6"),  kickoff: "2026-07-05T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R16-4", round: "R16", matchNumber: 4, homeSlot: kw("R32-7"),  awaySlot: kw("R32-8"),  kickoff: "2026-07-05T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R16-5", round: "R16", matchNumber: 5, homeSlot: kw("R32-9"),  awaySlot: kw("R32-10"), kickoff: "2026-07-06T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R16-6", round: "R16", matchNumber: 6, homeSlot: kw("R32-11"), awaySlot: kw("R32-12"), kickoff: "2026-07-06T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R16-7", round: "R16", matchNumber: 7, homeSlot: kw("R32-13"), awaySlot: kw("R32-14"), kickoff: "2026-07-07T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "R16-8", round: "R16", matchNumber: 8, homeSlot: kw("R32-15"), awaySlot: kw("R32-16"), kickoff: "2026-07-07T20:00:00Z", venue: "TBD", city: "TBD" },

  // Quarter-finals
  { id: "QF-1", round: "QF", matchNumber: 1, homeSlot: kw("R16-1"), awaySlot: kw("R16-2"), kickoff: "2026-07-10T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "QF-2", round: "QF", matchNumber: 2, homeSlot: kw("R16-3"), awaySlot: kw("R16-4"), kickoff: "2026-07-10T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "QF-3", round: "QF", matchNumber: 3, homeSlot: kw("R16-5"), awaySlot: kw("R16-6"), kickoff: "2026-07-11T16:00:00Z", venue: "TBD", city: "TBD" },
  { id: "QF-4", round: "QF", matchNumber: 4, homeSlot: kw("R16-7"), awaySlot: kw("R16-8"), kickoff: "2026-07-11T20:00:00Z", venue: "TBD", city: "TBD" },

  // Semi-finals
  { id: "SF-1", round: "SF", matchNumber: 1, homeSlot: kw("QF-1"), awaySlot: kw("QF-2"), kickoff: "2026-07-14T20:00:00Z", venue: "TBD", city: "TBD" },
  { id: "SF-2", round: "SF", matchNumber: 2, homeSlot: kw("QF-3"), awaySlot: kw("QF-4"), kickoff: "2026-07-15T20:00:00Z", venue: "TBD", city: "TBD" },

  // Third-place playoff
  { id: "3P", round: "3P", matchNumber: 1, homeSlot: kl("SF-1"), awaySlot: kl("SF-2"), kickoff: "2026-07-18T20:00:00Z", venue: "TBD", city: "TBD" },

  // Final
  { id: "F", round: "F", matchNumber: 1, homeSlot: kw("SF-1"), awaySlot: kw("SF-2"), kickoff: "2026-07-19T20:00:00Z", venue: "MetLife Stadium", city: "Nueva Jersey" },
];

export function getKnockoutMatchesByRound(round: string): KnockoutMatch[] {
  return knockoutMatches.filter((m) => m.round === round);
}

export function isKnockoutMatchLocked(match: KnockoutMatch): boolean {
  return new Date(match.kickoff).getTime() <= Date.now();
}
