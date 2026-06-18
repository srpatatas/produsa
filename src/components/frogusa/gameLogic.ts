import {
  CANVAS_W,
  COLS,
  ROWS,
  CELL_W,
  CELL_H,
  PLAYER_START_ROW,
  PLAYER_START_COL,
  GOAL_ROW,
  SAFE_ROWS,
  LIVES_INIT,
  COMODIN_CHANCE,
  COMODIN_SPEED_MULT,
  FLAG_CHANCE,
  FLAG_BONUS,
  FLAG_CODES,
  type Lane,
  type Defender,
  type BonusFlag,
  type FrogusaState,
} from "./gameTypes";

const BASE_SPEED = 0.003;

const LANE_CONFIGS: { row: number; dir: 1 | -1; speedMult: number; count: number }[] = [
  { row: 1,  dir: 1,  speedMult: 1.3, count: 3 },
  { row: 2,  dir: -1, speedMult: 0.8, count: 2 },
  { row: 3,  dir: 1,  speedMult: 1.1, count: 3 },
  { row: 4,  dir: -1, speedMult: 1.5, count: 2 },
  { row: 5,  dir: 1,  speedMult: 0.9, count: 3 },
  // row 6 = safe (midfield)
  { row: 7,  dir: -1, speedMult: 1.0, count: 3 },
  { row: 8,  dir: 1,  speedMult: 1.4, count: 2 },
  { row: 9,  dir: -1, speedMult: 0.7, count: 3 },
  { row: 10, dir: 1,  speedMult: 1.2, count: 2 },
  { row: 11, dir: -1, speedMult: 1.0, count: 3 },
];

function randomFlag(): string {
  return FLAG_CODES[Math.floor(Math.random() * FLAG_CODES.length)];
}

function buildLane(cfg: typeof LANE_CONFIGS[0], level: number): Lane {
  const speed = BASE_SPEED * cfg.speedMult * (1 + (level - 1) * 0.15);
  const extraCount = Math.floor((level - 1) / 3);
  const count = cfg.count + extraCount;

  const defenders: Defender[] = [];
  const spacing = CANVAS_W / count;

  for (let i = 0; i < count; i++) {
    const isComodin = Math.random() < COMODIN_CHANCE;
    defenders.push({
      x: i * spacing + Math.random() * spacing * 0.4,
      row: cfg.row,
      width: isComodin ? CELL_W * 1.4 : CELL_W * 0.9,
      flag: randomFlag(),
      isComodin,
      comodinIdx: isComodin ? Math.floor(Math.random() * 3) : -1,
    });
  }

  return {
    row: cfg.row,
    direction: cfg.dir,
    speed: speed,
    defenders,
  };
}

function buildFlags(level: number): BonusFlag[] {
  const flags: BonusFlag[] = [];
  const laneRows = LANE_CONFIGS.map((c) => c.row);
  for (const row of laneRows) {
    if (Math.random() < FLAG_CHANCE) {
      flags.push({
        col: Math.floor(Math.random() * COLS),
        row,
        code: randomFlag(),
        collected: false,
      });
    }
  }
  return flags;
}

export function createInitialState(): FrogusaState {
  return {
    playerCol: PLAYER_START_COL,
    playerRow: PLAYER_START_ROW,
    lanes: [],
    flags: [],
    score: 0,
    goals: 0,
    lives: LIVES_INIT,
    level: 1,
    status: "idle",
    hitTime: 0,
    scoreTime: 0,
  };
}

export function startGame(): FrogusaState {
  const lanes = LANE_CONFIGS.map((cfg) => buildLane(cfg, 1));
  return {
    ...createInitialState(),
    status: "playing",
    lanes,
    flags: buildFlags(1),
  };
}

function resetToStart(state: FrogusaState): FrogusaState {
  const newLevel = state.goals + 1;
  const lanes = LANE_CONFIGS.map((cfg) => buildLane(cfg, newLevel));
  return {
    ...state,
    playerCol: PLAYER_START_COL,
    playerRow: PLAYER_START_ROW,
    lanes,
    flags: buildFlags(newLevel),
    level: newLevel,
    status: "playing",
  };
}

export type Direction = "up" | "down" | "left" | "right";

export function movePlayer(state: FrogusaState, dir: Direction): FrogusaState {
  if (state.status !== "playing") return state;

  let { playerCol, playerRow } = state;
  if (dir === "up") playerRow = Math.max(0, playerRow - 1);
  else if (dir === "down") playerRow = Math.min(ROWS - 1, playerRow + 1);
  else if (dir === "left") playerCol = Math.max(0, playerCol - 1);
  else if (dir === "right") playerCol = Math.min(COLS - 1, playerCol + 1);

  return { ...state, playerCol, playerRow };
}

export interface TickResult {
  state: FrogusaState;
  scored: boolean;
  hit: boolean;
  hitComodinIdx: number;
  flagCollected: boolean;
}

export function gameTick(state: FrogusaState): TickResult {
  const noOp: TickResult = { state, scored: false, hit: false, hitComodinIdx: -1, flagCollected: false };
  if (state.status !== "playing") return noOp;

  let { score, goals, lives } = state;
  const lanes = state.lanes.map((lane) => ({
    ...lane,
    defenders: lane.defenders.map((d) => {
      let nx = d.x + lane.speed * lane.direction * (d.isComodin ? COMODIN_SPEED_MULT : 1);
      if (lane.direction === 1 && nx > CANVAS_W + CELL_W) nx = -d.width;
      if (lane.direction === -1 && nx + d.width < -CELL_W) nx = CANVAS_W;
      return { ...d, x: nx };
    }),
  }));

  let flags = state.flags.map((f) => ({ ...f }));

  // Check goal
  if (state.playerRow === GOAL_ROW) {
    goals++;
    score++;
    const next = resetToStart({ ...state, lanes, flags, score, goals, lives });
    return { state: { ...next, scoreTime: performance.now() }, scored: true, hit: false, hitComodinIdx: -1, flagCollected: false };
  }

  // Check flag collection
  let flagCollected = false;
  for (let i = 0; i < flags.length; i++) {
    const f = flags[i];
    if (!f.collected && f.row === state.playerRow && f.col === state.playerCol) {
      flags[i].collected = true;
      score += FLAG_BONUS;
      flagCollected = true;
    }
  }

  // Check collision with defenders
  if (!SAFE_ROWS.includes(state.playerRow)) {
    const playerLeft = state.playerCol * CELL_W;
    const playerRight = playerLeft + CELL_W;
    const playerCenterY = state.playerRow;

    for (const lane of lanes) {
      if (lane.row !== state.playerRow) continue;
      for (const d of lane.defenders) {
        const dLeft = d.x;
        const dRight = d.x + d.width;
        if (playerRight > dLeft + CELL_W * 0.3 && playerLeft < dRight - CELL_W * 0.3) {
          lives--;
          if (lives <= 0) {
            return {
              state: { ...state, lanes, flags, score, goals, lives: 0, status: "lost", hitTime: performance.now() },
              scored: false, hit: true, hitComodinIdx: d.isComodin ? d.comodinIdx : -1, flagCollected,
            };
          }
          return {
            state: {
              ...state, lanes, flags, score, goals, lives,
              playerCol: PLAYER_START_COL, playerRow: PLAYER_START_ROW,
              status: "hit", hitTime: performance.now(),
            },
            scored: false, hit: true, hitComodinIdx: d.isComodin ? d.comodinIdx : -1, flagCollected,
          };
        }
      }
    }
  }

  return {
    state: { ...state, lanes, flags, score, goals, lives, status: "playing" },
    scored: false, hit: false, hitComodinIdx: -1, flagCollected,
  };
}
