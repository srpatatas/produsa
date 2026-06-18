import {
  CANVAS_H,
  BALL_X,
  BALL_RADIUS,
  GRAVITY,
  FLAP_VEL,
  MAX_VEL,
  PIPE_W,
  PIPE_GAP_INIT,
  PIPE_GAP_MIN,
  PIPE_SPEED_INIT,
  PIPE_SPACING,
  COMODIN_CHANCE,
  COMODIN_RADIUS,
  COMODIN_PENALTY,
  COMODIN_MIN_GAP,
  FLAG_CHANCE,
  FLAG_SIZE,
  FLAG_BONUS,
  FLAG_CODES,
  type Pipe,
  type FloatingFlag,
  type PelotusaState,
} from "./gameTypes";

const MAX_GAP_DELTA = 0.25;

function spawnPipe(x: number, gap: number, prevGapY: number | null): Pipe {
  const minGapY = gap / 2 + 0.10;
  const maxGapY = CANVAS_H - gap / 2 - 0.10;

  let lo = minGapY;
  let hi = maxGapY;
  if (prevGapY !== null) {
    lo = Math.max(lo, prevGapY - MAX_GAP_DELTA);
    hi = Math.min(hi, prevGapY + MAX_GAP_DELTA);
  }

  const gapY = lo + Math.random() * (hi - lo);

  // Only spawn comodin if gap is wide enough to dodge
  let comodin: number | null = null;
  let comodinOffY = 0;
  if (gap >= COMODIN_MIN_GAP && Math.random() < COMODIN_CHANCE) {
    comodin = Math.floor(Math.random() * 3);
    // Offset to top or bottom of gap so there's a clear lane on the other side
    const offset = gap * 0.28;
    comodinOffY = Math.random() < 0.5 ? -offset : offset;
  }

  return { x, gapY, gapSize: gap, passed: false, comodin, comodinOffY, comodinHit: false };
}

function spawnFlag(pipeX: number, pipeGapY: number, nextGapY: number | null): FloatingFlag | null {
  if (Math.random() >= FLAG_CHANCE) return null;
  const midX = pipeX + PIPE_SPACING / 2;
  // Place flag between this gap and the next, reachable from both
  const targetY = nextGapY !== null ? (pipeGapY + nextGapY) / 2 : pipeGapY;
  const spread = 0.15;
  const y = targetY + (Math.random() - 0.5) * spread * 2;
  const clamped = Math.max(BALL_RADIUS + 0.05, Math.min(CANVAS_H - BALL_RADIUS - 0.05, y));
  return { x: midX, y: clamped, code: FLAG_CODES[Math.floor(Math.random() * FLAG_CODES.length)], collected: false };
}

export function createInitialState(): PelotusaState {
  return {
    ballY: CANVAS_H / 2,
    ballVel: 0,
    pipes: [],
    flags: [],
    score: 0,
    speed: PIPE_SPEED_INIT,
    gap: PIPE_GAP_INIT,
    status: "idle",
  };
}

export function startGame(): PelotusaState {
  const firstPipe = spawnPipe(1.2, PIPE_GAP_INIT, null);
  const firstFlag = spawnFlag(1.2, firstPipe.gapY, null);
  return {
    ...createInitialState(),
    ballVel: FLAP_VEL,
    status: "playing",
    pipes: [firstPipe],
    flags: firstFlag ? [firstFlag] : [],
  };
}

export function flap(state: PelotusaState): PelotusaState {
  if (state.status !== "playing") return state;
  return { ...state, ballVel: FLAP_VEL };
}

export interface TickResult {
  state: PelotusaState;
  scored: boolean;
  scoredPipeX: number;
  scoredPipeGapY: number;
  comodinHit: boolean;
  comodinX: number;
  comodinY: number;
  comodinIdx: number;
  comodinDodged: boolean;
  dodgeX: number;
  dodgeY: number;
  dodgeIdx: number;
  flagCollected: boolean;
  flagX: number;
  flagY: number;
}

export function gameTick(state: PelotusaState): TickResult {
  const noOp: TickResult = {
    state,
    scored: false, scoredPipeX: 0, scoredPipeGapY: 0,
    comodinHit: false, comodinX: 0, comodinY: 0, comodinIdx: -1,
    comodinDodged: false, dodgeX: 0, dodgeY: 0, dodgeIdx: -1,
    flagCollected: false, flagX: 0, flagY: 0,
  };
  if (state.status !== "playing") return noOp;

  let { ballY, ballVel, score, speed, gap } = state;
  let pipes = state.pipes.map((p) => ({ ...p }));
  let flags = state.flags.map((f) => ({ ...f }));

  // Gravity
  ballVel = Math.min(ballVel + GRAVITY, MAX_VEL);
  ballY += ballVel;

  // Floor / ceiling death
  if (ballY - BALL_RADIUS <= 0 || ballY + BALL_RADIUS >= CANVAS_H) {
    ballY = Math.max(BALL_RADIUS, Math.min(CANVAS_H - BALL_RADIUS, ballY));
    return { ...noOp, state: { ...state, ballY, ballVel, pipes, flags, score, speed, gap, status: "lost" } };
  }

  // Move pipes & flags
  for (const p of pipes) p.x -= speed;
  for (const f of flags) f.x -= speed;

  // Remove off-screen
  pipes = pipes.filter((p) => p.x + PIPE_W > -0.15);
  flags = flags.filter((f) => f.x > -0.1);

  // Spawn new pipe when needed
  let rightmostX = -1;
  let rightmostGapY: number | null = null;
  for (const p of pipes) {
    if (p.x > rightmostX) { rightmostX = p.x; rightmostGapY = p.gapY; }
  }
  if (rightmostX < 1.0) {
    const newPipe = spawnPipe(rightmostX + PIPE_SPACING, gap, rightmostGapY);
    pipes.push(newPipe);
    const newFlag = spawnFlag(rightmostX, rightmostGapY ?? newPipe.gapY, newPipe.gapY);
    if (newFlag) flags.push(newFlag);
  }

  let scored = false;
  let scoredPipeX = 0;
  let scoredPipeGapY = 0;
  let comodinHitResult = false;
  let comodinX = 0;
  let comodinY = 0;
  let comodinIdx = -1;
  let comodinDodged = false;
  let dodgeX = 0;
  let dodgeY = 0;
  let dodgeIdx = -1;
  let flagCollected = false;
  let flagX = 0;
  let flagY = 0;

  const ballLeft = BALL_X - BALL_RADIUS;
  const ballRight = BALL_X + BALL_RADIUS;
  const ballTop = ballY - BALL_RADIUS;
  const ballBottom = ballY + BALL_RADIUS;

  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    const pipeLeft = p.x;
    const pipeRight = p.x + PIPE_W;

    // Scoring
    if (!p.passed && pipeRight < BALL_X) {
      pipes[i].passed = true;
      score++;
      scored = true;
      scoredPipeX = p.x + PIPE_W / 2;
      scoredPipeGapY = p.gapY;

      // Dodged comodin?
      if (p.comodin !== null && !p.comodinHit) {
        comodinDodged = true;
        dodgeX = p.x + PIPE_W / 2;
        dodgeY = p.gapY + p.comodinOffY;
        dodgeIdx = p.comodin;
      }

      if (score % 5 === 0) {
        speed *= 1.12;
        gap = Math.max(gap - 0.015, PIPE_GAP_MIN);
      }
    }

    // Comodin obstacle — hit = lose points
    if (p.comodin !== null && !p.comodinHit) {
      const cx = p.x + PIPE_W / 2;
      const cy = p.gapY + p.comodinOffY;
      const dx = BALL_X - cx;
      const dy = ballY - cy;
      if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS + COMODIN_RADIUS) {
        pipes[i].comodinHit = true;
        score = Math.max(0, score - COMODIN_PENALTY);
        comodinHitResult = true;
        comodinX = cx;
        comodinY = cy;
        comodinIdx = p.comodin;
      }
    }

    // Pipe wall collision
    if (ballRight > pipeLeft && ballLeft < pipeRight) {
      const topPipeBottom = p.gapY - p.gapSize / 2;
      const bottomPipeTop = p.gapY + p.gapSize / 2;

      if (ballTop < topPipeBottom || ballBottom > bottomPipeTop) {
        return {
          ...noOp,
          state: { ...state, ballY, ballVel, pipes, flags, score, speed, gap, status: "lost" },
        };
      }
    }
  }

  // Flag collection
  for (let i = 0; i < flags.length; i++) {
    const f = flags[i];
    if (f.collected) continue;
    const dx = BALL_X - f.x;
    const dy = ballY - f.y;
    if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS + FLAG_SIZE) {
      flags[i].collected = true;
      score += FLAG_BONUS;
      flagCollected = true;
      flagX = f.x;
      flagY = f.y;
    }
  }

  return {
    state: { ballY, ballVel, pipes, flags, score, speed, gap, status: "playing" },
    scored, scoredPipeX, scoredPipeGapY,
    comodinHit: comodinHitResult, comodinX, comodinY, comodinIdx,
    comodinDodged, dodgeX, dodgeY, dodgeIdx,
    flagCollected, flagX, flagY,
  };
}
