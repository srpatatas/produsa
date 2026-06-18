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
  WATER_ROWS,
  LIVES_INIT,
  COMODIN_CHANCE,
  COMODIN_SPEED_MULT,
  FLAG_CHANCE,
  FLAG_CODES,
  type Lane,
  type Defender,
  type WaterLane,
  type Platform,
  type BonusFlag,
  type FrogusaState,
} from "./gameTypes";

const BASE_SPEED = 0.003;

// Defender lanes (top half — near the goal, rows 1-5)
const LANE_CONFIGS: { row: number; dir: 1 | -1; speedMult: number; count: number }[] = [
  { row: 1, dir: 1,  speedMult: 1.3, count: 3 },
  { row: 2, dir: -1, speedMult: 0.8, count: 2 },
  { row: 3, dir: 1,  speedMult: 1.1, count: 3 },
  { row: 4, dir: -1, speedMult: 1.4, count: 2 },
  { row: 5, dir: 1,  speedMult: 1.0, count: 3 },
];

// Water/log lanes (bottom half — near the start, rows 8-11)
const WATER_CONFIGS: { row: number; dir: 1 | -1; speedMult: number; platCount: number; platWidth: number }[] = [
  { row: 8,  dir: 1,  speedMult: 0.7, platCount: 2, platWidth: 3 },
  { row: 9,  dir: -1, speedMult: 1.0, platCount: 3, platWidth: 2 },
  { row: 10, dir: 1,  speedMult: 1.2, platCount: 2, platWidth: 3 },
  { row: 11, dir: -1, speedMult: 0.8, platCount: 3, platWidth: 2 },
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

  return { row: cfg.row, direction: cfg.dir, speed, defenders };
}

function buildWaterLane(cfg: typeof WATER_CONFIGS[0], level: number): WaterLane {
  const speed = BASE_SPEED * cfg.speedMult * (1 + (level - 1) * 0.1);
  const platforms: Platform[] = [];
  const platW = cfg.platWidth * CELL_W;
  const spacing = CANVAS_W / cfg.platCount;

  for (let i = 0; i < cfg.platCount; i++) {
    platforms.push({
      x: i * spacing + Math.random() * spacing * 0.2,
      width: platW,
      row: cfg.row,
    });
  }

  return { row: cfg.row, direction: cfg.dir, speed, platforms };
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
    playerX: PLAYER_START_COL * CELL_W,
    lanes: [],
    waterLanes: [],
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
  const waterLanes = WATER_CONFIGS.map((cfg) => buildWaterLane(cfg, 1));
  return {
    ...createInitialState(),
    status: "playing",
    lanes,
    waterLanes,
    flags: buildFlags(1),
  };
}

function resetToStart(state: FrogusaState): FrogusaState {
  const newLevel = state.goals + 1;
  const lanes = LANE_CONFIGS.map((cfg) => buildLane(cfg, newLevel));
  const waterLanes = WATER_CONFIGS.map((cfg) => buildWaterLane(cfg, newLevel));
  return {
    ...state,
    playerCol: PLAYER_START_COL,
    playerRow: PLAYER_START_ROW,
    playerX: PLAYER_START_COL * CELL_W,
    lanes,
    waterLanes,
    flags: buildFlags(newLevel),
    level: newLevel,
    status: "playing",
  };
}

export type Direction = "up" | "down" | "left" | "right";

export function movePlayer(state: FrogusaState, dir: Direction): FrogusaState {
  if (state.status !== "playing") return state;

  let { playerCol, playerRow, playerX } = state;
  if (dir === "up") playerRow = Math.max(0, playerRow - 1);
  else if (dir === "down") playerRow = Math.min(ROWS - 1, playerRow + 1);
  else if (dir === "left") playerCol = Math.max(0, playerCol - 1);
  else if (dir === "right") playerCol = Math.min(COLS - 1, playerCol + 1);

  playerX = playerCol * CELL_W;
  return { ...state, playerCol, playerRow, playerX };
}

export interface TickResult {
  state: FrogusaState;
  scored: boolean;
  hit: boolean;
  hitComodinIdx: number;
  drowned: boolean;
  flagCollected: boolean;
}

export function gameTick(state: FrogusaState): TickResult {
  const noOp: TickResult = { state, scored: false, hit: false, hitComodinIdx: -1, drowned: false, flagCollected: false };
  if (state.status !== "playing") return noOp;

  let { score, goals, lives, playerX, playerCol } = state;

  // Move defender lanes
  const lanes = state.lanes.map((lane) => ({
    ...lane,
    defenders: lane.defenders.map((d) => {
      let nx = d.x + lane.speed * lane.direction * (d.isComodin ? COMODIN_SPEED_MULT : 1);
      if (lane.direction === 1 && nx > CANVAS_W + CELL_W) nx = -d.width;
      if (lane.direction === -1 && nx + d.width < -CELL_W) nx = CANVAS_W;
      return { ...d, x: nx };
    }),
  }));

  // Move invasion platforms
  const waterLanes = state.waterLanes.map((lane) => ({
    ...lane,
    platforms: lane.platforms.map((p) => {
      let nx = p.x + lane.speed * lane.direction;
      if (lane.direction === 1 && nx > CANVAS_W + CELL_W) nx = -p.width;
      if (lane.direction === -1 && nx + p.width < -CELL_W) nx = CANVAS_W;
      return { ...p, x: nx };
    }),
  }));

  let flags = state.flags.map((f) => ({ ...f }));

  // Check goal
  if (state.playerRow === GOAL_ROW) {
    goals++;
    score += 5;
    const next = resetToStart({ ...state, lanes, waterLanes, flags, score, goals, lives });
    return { state: { ...next, scoreTime: performance.now() }, scored: true, hit: false, hitComodinIdx: -1, drowned: false, flagCollected: false };
  }

  // Water zone: ride logs or drown
  let drowned = false;
  if (WATER_ROWS.includes(state.playerRow)) {
    const lane = waterLanes.find((l) => l.row === state.playerRow);
    if (lane) {
      const pLeft = playerX;
      const pRight = playerX + CELL_W;
      let onPlatform = false;

      for (const plat of lane.platforms) {
        if (pRight > plat.x + CELL_W * 0.1 && pLeft < plat.x + plat.width - CELL_W * 0.1) {
          onPlatform = true;
          // Ride: carry player with platform
          playerX += lane.speed * lane.direction;
          playerCol = Math.round(playerX / CELL_W);
          playerCol = Math.max(0, Math.min(COLS - 1, playerCol));
          break;
        }
      }

      if (!onPlatform) {
        // Drowned in the crowd!
        lives--;
        drowned = true;
        if (lives <= 0) {
          return {
            state: { ...state, lanes, waterLanes, flags, score, goals, lives: 0, playerX, playerCol, status: "lost", hitTime: performance.now() },
            scored: false, hit: false, hitComodinIdx: -1, drowned: true, flagCollected: false,
          };
        }
        return {
          state: {
            ...state, lanes, waterLanes, flags, score, goals, lives,
            playerCol: PLAYER_START_COL, playerRow: PLAYER_START_ROW,
            playerX: PLAYER_START_COL * CELL_W,
            status: "hit", hitTime: performance.now(),
          },
          scored: false, hit: false, hitComodinIdx: -1, drowned: true, flagCollected: false,
        };
      }

      // Carried off screen
      if (playerX < -CELL_W || playerX > CANVAS_W) {
        lives--;
        drowned = true;
        if (lives <= 0) {
          return {
            state: { ...state, lanes, waterLanes, flags, score, goals, lives: 0, playerX, playerCol, status: "lost", hitTime: performance.now() },
            scored: false, hit: false, hitComodinIdx: -1, drowned: true, flagCollected: false,
          };
        }
        return {
          state: {
            ...state, lanes, waterLanes, flags, score, goals, lives,
            playerCol: PLAYER_START_COL, playerRow: PLAYER_START_ROW,
            playerX: PLAYER_START_COL * CELL_W,
            status: "hit", hitTime: performance.now(),
          },
          scored: false, hit: false, hitComodinIdx: -1, drowned: true, flagCollected: false,
        };
      }
    }
  }

  // Flag collection
  let flagCollected = false;
  for (let i = 0; i < flags.length; i++) {
    const f = flags[i];
    if (!f.collected && f.row === state.playerRow && f.col === state.playerCol) {
      flags[i].collected = true;
      score++;
      flagCollected = true;
    }
  }

  // Defender collision (only in non-safe, non-invasion rows)
  if (!SAFE_ROWS.includes(state.playerRow) && !WATER_ROWS.includes(state.playerRow)) {
    const pLeft = playerX;
    const pRight = playerX + CELL_W;

    for (const lane of lanes) {
      if (lane.row !== state.playerRow) continue;
      for (const d of lane.defenders) {
        const dLeft = d.x;
        const dRight = d.x + d.width;
        if (pRight > dLeft + CELL_W * 0.3 && pLeft < dRight - CELL_W * 0.3) {
          lives--;
          if (lives <= 0) {
            return {
              state: { ...state, lanes, waterLanes, flags, score, goals, lives: 0, playerX, playerCol, status: "lost", hitTime: performance.now() },
              scored: false, hit: true, hitComodinIdx: d.isComodin ? d.comodinIdx : -1, drowned: false, flagCollected,
            };
          }
          return {
            state: {
              ...state, lanes, waterLanes, flags, score, goals, lives,
              playerCol: PLAYER_START_COL, playerRow: PLAYER_START_ROW,
              playerX: PLAYER_START_COL * CELL_W,
              status: "hit", hitTime: performance.now(),
            },
            scored: false, hit: true, hitComodinIdx: d.isComodin ? d.comodinIdx : -1, drowned: false, flagCollected,
          };
        }
      }
    }
  }

  return {
    state: { ...state, lanes, waterLanes, flags, score, goals, lives, playerX, playerCol, status: "playing" },
    scored: false, hit: false, hitComodinIdx: -1, drowned: false, flagCollected,
  };
}
