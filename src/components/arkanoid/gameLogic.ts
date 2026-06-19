import {
  CANVAS_W,
  CANVAS_H,
  PADDLE_W,
  BALL_R,
  BALL_SPEED,
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_H,
  BRICK_GAP,
  BRICK_TOP,
  GROUP_HEADS,
  FLAG_CODES,
  BRICK_COLORS,
  COMODIN_HIT_LINES,
  type Brick,
  type Ball,
  type PowerUp,
  type SpeechBubble,
  type ArkanoidState,
} from "./gameTypes";

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  const totalW = CANVAS_W - BRICK_GAP * 2;
  const brickW = (totalW - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS;
  const flags = shuffled(FLAG_CODES);
  let fi = 0;

  // Place comodins in top rows so they have room for double-height
  const comodinSlots = new Set<string>();
  const blocked = new Set<string>();
  const numComodins = Math.min(3, level);
  while (comodinSlots.size < numComodins) {
    const r = Math.floor(Math.random() * (BRICK_ROWS - 1));
    const c = Math.floor(Math.random() * BRICK_COLS);
    const key = `${r}-${c}`;
    const belowKey = `${r + 1}-${c}`;
    if (comodinSlots.has(key) || blocked.has(key)) continue;
    comodinSlots.add(key);
    blocked.add(key);
    blocked.add(belowKey);
  }

  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const key = `${r}-${c}`;
      if (blocked.has(key) && !comodinSlots.has(key)) continue;

      const x = BRICK_GAP + c * (brickW + BRICK_GAP);
      const y = BRICK_TOP + r * (BRICK_H + BRICK_GAP);

      if (comodinSlots.has(key)) {
        const ci = bricks.filter((b) => b.isComodin).length;
        const doubleH = BRICK_H * 2 + BRICK_GAP;
        bricks.push({
          x, y, w: brickW, h: doubleH,
          hp: 3, maxHp: 3,
          flag: "",
          color: "#1e1b4b",
          isComodin: true,
          comodinIndex: ci % 3,
        });
      } else {
        const flag = flags[fi % flags.length];
        fi++;
        const isHead = GROUP_HEADS.has(flag);
        bricks.push({
          x, y, w: brickW, h: BRICK_H,
          hp: isHead ? 2 : 1,
          maxHp: isHead ? 2 : 1,
          flag,
          color: BRICK_COLORS[(r * BRICK_COLS + c) % BRICK_COLORS.length],
          isComodin: false,
          comodinIndex: -1,
        });
      }
    }
  }
  return bricks;
}

export function createInitialState(level = 1): ArkanoidState {
  return {
    paddle: 0.5,
    ball: {
      x: 0.5,
      y: CANVAS_H - 0.08,
      vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      vy: -BALL_SPEED,
    },
    bricks: buildBricks(level),
    powerUps: [],
    bubbles: [],
    score: 0,
    lives: 3,
    level,
    status: "playing",
    paddleW: PADDLE_W,
    slowUntil: 0,
    respawnTime: 0,
  };
}

export function resetBall(state: ArkanoidState): ArkanoidState {
  const speed = getSpeed(state);
  return {
    ...state,
    ball: {
      x: state.paddle,
      y: CANVAS_H - 0.08,
      vx: speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -speed,
    },
    paddleW: PADDLE_W,
    slowUntil: 0,
  };
}

function getSpeed(state: ArkanoidState): number {
  const base = BALL_SPEED + (state.level - 1) * 0.001;
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  return state.slowUntil > now ? base * 0.5 : base;
}

export function gameTick(state: ArkanoidState, dt: number = 1): ArkanoidState {
  if (state.status !== "playing") return state;

  const now = typeof performance !== "undefined" ? performance.now() : 0;
  const slow = state.slowUntil > now;
  const speedMult = slow ? 0.5 : 1;

  let { x, y, vx, vy } = state.ball;
  const mag = Math.sqrt(vx * vx + vy * vy);
  const targetSpeed = BALL_SPEED + (state.level - 1) * 0.001;
  const actualSpeed = targetSpeed * speedMult;
  if (mag > 0) {
    vx = (vx / mag) * actualSpeed;
    vy = (vy / mag) * actualSpeed;
  }

  x += vx * dt;
  y += vy * dt;

  // Wall bounces
  if (x - BALL_R <= 0) { x = BALL_R; vx = Math.abs(vx); }
  if (x + BALL_R >= CANVAS_W) { x = CANVAS_W - BALL_R; vx = -Math.abs(vx); }
  if (y - BALL_R <= 0) { y = BALL_R; vy = Math.abs(vy); }

  // Paddle bounce
  const pLeft = state.paddle - state.paddleW / 2;
  const pRight = state.paddle + state.paddleW / 2;
  const pTop = CANVAS_H - 0.04;
  if (vy > 0 && y + BALL_R >= pTop && y - BALL_R < pTop + 0.025 && x >= pLeft && x <= pRight) {
    y = pTop - BALL_R;
    const offset = (x - state.paddle) / (state.paddleW / 2);
    const angle = offset * (Math.PI / 3);
    const speed = Math.sqrt(vx * vx + vy * vy);
    vx = speed * Math.sin(angle);
    vy = -speed * Math.cos(angle);
  }

  // Ball lost
  if (y > CANVAS_H + BALL_R) {
    const lives = state.lives - 1;
    if (lives <= 0) {
      return { ...state, lives: 0, status: "lost" };
    }
    const respawned = resetBall({ ...state, lives });
    return { ...respawned, status: "respawning", respawnTime: now };
  }

  // Brick collisions
  let bricks = [...state.bricks];
  let score = state.score;
  const newPowerUps = [...state.powerUps];
  const newBubbles = [...state.bubbles];
  let hitBrick = false;

  for (let i = bricks.length - 1; i >= 0; i--) {
    const b = bricks[i];
    if (
      x + BALL_R > b.x &&
      x - BALL_R < b.x + b.w &&
      y + BALL_R > b.y &&
      y - BALL_R < b.y + b.h
    ) {
      if (!hitBrick) {
        // Bounce direction
        const overlapLeft = (x + BALL_R) - b.x;
        const overlapRight = (b.x + b.w) - (x - BALL_R);
        const overlapTop = (y + BALL_R) - b.y;
        const overlapBottom = (b.y + b.h) - (y - BALL_R);
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        if (minOverlapX < minOverlapY) {
          vx = -vx;
        } else {
          vy = -vy;
        }
        hitBrick = true;
      }

      bricks[i] = { ...b, hp: b.hp - 1 };

      if (b.isComodin) {
        const hitIndex = b.maxHp - b.hp;
        const lines = COMODIN_HIT_LINES[b.comodinIndex];
        if (lines && hitIndex < lines.length) {
          newBubbles.push({
            x: b.x + b.w / 2,
            y: b.y,
            text: lines[hitIndex],
            time: now,
          });
        }
      }

      if (bricks[i].hp <= 0) {
        const pts = b.isComodin ? 500 : b.maxHp === 2 ? 200 : 100;
        score += pts;
        bricks.splice(i, 1);

        // Power-up drop (20% chance from non-comodin)
        if (!b.isComodin && Math.random() < 0.2) {
          const types: Array<"boot" | "var" | "red"> = ["boot", "var", "red"];
          newPowerUps.push({
            x: b.x + b.w / 2,
            y: b.y + b.h,
            vy: 0.003,
            type: types[Math.floor(Math.random() * types.length)],
          });
        }
        // Comodins always drop a power-up
        if (b.isComodin) {
          newPowerUps.push({
            x: b.x + b.w / 2,
            y: b.y + b.h,
            vy: 0.003,
            type: "boot",
          });
        }
      }
    }
  }

  // Update power-ups
  let paddleW = state.paddleW;
  let slowUntil = state.slowUntil;
  const activePowerUps: PowerUp[] = [];

  for (const pu of newPowerUps) {
    pu.y += pu.vy * dt;
    // Catch with paddle
    if (
      pu.y >= pTop &&
      pu.y <= pTop + 0.04 &&
      pu.x >= pLeft &&
      pu.x <= pRight
    ) {
      switch (pu.type) {
        case "boot":
          paddleW = Math.min(PADDLE_W * 1.8, paddleW + PADDLE_W * 0.3);
          break;
        case "var":
          slowUntil = now + 5000;
          break;
        case "red":
          // Clear the lowest row of bricks
          if (bricks.length > 0) {
            const maxY = Math.max(...bricks.map((b) => b.y));
            const rowBricks = bricks.filter((b) => Math.abs(b.y - maxY) < 0.01);
            score += rowBricks.length * 50;
            bricks = bricks.filter((b) => Math.abs(b.y - maxY) >= 0.01);
          }
          break;
      }
      continue;
    }
    if (pu.y < CANVAS_H + 0.05) {
      activePowerUps.push(pu);
    }
  }

  // Filter old bubbles
  const activeBubbles = newBubbles.filter((b) => now - b.time < 1500);

  // Check cleared
  if (bricks.length === 0) {
    return {
      ...state,
      ball: { x, y, vx, vy },
      bricks,
      powerUps: activePowerUps,
      bubbles: activeBubbles,
      score,
      paddleW,
      slowUntil,
      status: "cleared",
    };
  }

  return {
    ...state,
    ball: { x, y, vx, vy },
    bricks,
    powerUps: activePowerUps,
    bubbles: activeBubbles,
    score,
    paddleW,
    slowUntil,
  };
}

export function nextLevel(state: ArkanoidState): ArkanoidState {
  const next = createInitialState(state.level + 1);
  return {
    ...next,
    score: state.score,
    lives: state.lives,
  };
}
