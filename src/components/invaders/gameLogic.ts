import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_W,
  PLAYER_Y,
  BULLET_SPEED,
  INVADER_COLS,
  INVADER_W,
  INVADER_H,
  INVADER_GAP_X,
  INVADER_GAP_Y,
  INVADER_BASE_SPEED,
  INVADER_DROP,
  INVADER_SHOOT_CHANCE,
  BOSS_W,
  BOSS_H,
  BOSS_SPEED,
  BOSS_HP,
  BOSS_SPAWN_CHANCE,
  FLAG_CODES,
  type Invader,
  type Boss,
  type Bullet,
  type InvadersState,
} from "./gameTypes";

const BOSS_SPEED_DIR = { v: BOSS_SPEED };

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Level 1: FIFA (13 cols)
const FORMATION_FIFA: number[][] = [
  [1,1,1,0,1,0,1,1,1,0,0,1,0],
  [1,0,0,0,1,0,1,0,0,0,1,0,1],
  [1,1,0,0,1,0,1,1,0,0,1,1,1],
  [1,0,0,0,1,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,0,1,0,0,0,1,0,1],
];

// Level 2: WC 26 (15 cols)
const FORMATION_WC26: number[][] = [
  [1,0,1,0,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,1,0,1,0,0,0,0,0,1,0,1,0,0],
  [1,1,1,0,1,0,0,0,1,1,1,0,1,1,1],
  [1,0,1,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,0,1,1,1,0,1,1,1,0,1,1,1],
];

// Level 3: Trophy (11 cols)
const FORMATION_TROPHY: number[][] = [
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0],
];

const FORMATIONS = [FORMATION_FIFA, FORMATION_WC26, FORMATION_TROPHY];

function buildInvaders(level: number): Invader[] {
  const flags = shuffled(FLAG_CODES);
  const invaders: Invader[] = [];
  const idx = Math.min(level - 1, FORMATIONS.length - 1);
  const formation = FORMATIONS[idx];
  const cols = formation[0].length;
  const rows = formation.length;

  const maxW = CANVAS_W - 0.04;
  const cellW = Math.min(INVADER_W, (maxW - (cols - 1) * INVADER_GAP_X) / cols);
  const cellH = Math.min(INVADER_H, cellW * 0.65);
  const gap = INVADER_GAP_X;

  const totalW = cols * cellW + (cols - 1) * gap;
  const startX = (CANVAS_W - totalW) / 2;
  const startY = level === 3 ? 0.08 : 0.1;

  let fi = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!formation[r][c]) continue;
      invaders.push({
        x: startX + c * (cellW + gap),
        y: startY + r * (cellH + INVADER_GAP_Y),
        flag: flags[fi % flags.length],
        alive: true,
      });
      fi++;
    }
  }
  return invaders;
}

export function createInitialState(level = 1): InvadersState {
  BOSS_SPEED_DIR.v = BOSS_SPEED;

  let bosses: Boss[] = [];
  let bossMode: "random" | "mandatory" = "random";

  if (level === 3) {
    bossMode = "mandatory";
    bosses = [0, 1, 2].map((i) => ({
      x: 0.1 + i * 0.35,
      y: 0.02,
      hp: BOSS_HP + 2,
      maxHp: BOSS_HP + 2,
      comodinIndex: i,
      dir: i % 2 === 0 ? BOSS_SPEED : -BOSS_SPEED,
    }));
  }

  return {
    player: 0.5,
    bullets: [],
    invaders: buildInvaders(level),
    bosses,
    bossMode,
    direction: 1,
    speed: INVADER_BASE_SPEED + (level - 1) * 0.0004,
    score: 0,
    lives: 3,
    level,
    status: "playing",
    lastShot: 0,
    hitTime: 0,
    bossHitTime: 0,
    bossSpawned: false,
  };
}

export function nextLevel(state: InvadersState): InvadersState {
  const level = state.level + 1;
  BOSS_SPEED_DIR.v = BOSS_SPEED;

  let bosses: Boss[] = [];
  let bossMode: "random" | "mandatory" = "random";

  if (level === 3) {
    bossMode = "mandatory";
    bosses = [0, 1, 2].map((i) => ({
      x: 0.1 + i * 0.35,
      y: 0.02,
      hp: BOSS_HP + 2,
      maxHp: BOSS_HP + 2,
      comodinIndex: i,
      dir: i % 2 === 0 ? BOSS_SPEED : -BOSS_SPEED,
    }));
  }

  return {
    player: 0.5,
    bullets: [],
    invaders: buildInvaders(level),
    bosses,
    bossMode,
    direction: 1,
    speed: INVADER_BASE_SPEED + (level - 1) * 0.0004,
    score: state.score,
    lives: state.lives,
    level,
    status: "playing",
    lastShot: 0,
    hitTime: 0,
    bossHitTime: 0,
    bossSpawned: false,
  };
}

export function shoot(state: InvadersState, now: number): InvadersState {
  if (state.status !== "playing") return state;
  if (now - state.lastShot < 350) return state;
  const playerBullets = state.bullets.filter((b) => b.fromPlayer);
  if (playerBullets.length >= 3) return state;

  return {
    ...state,
    lastShot: now,
    bullets: [
      ...state.bullets,
      { x: state.player, y: PLAYER_Y - 0.01, fromPlayer: true },
    ],
  };
}

export function gameTick(state: InvadersState, now: number): InvadersState {
  if (state.status !== "playing") return state;
  let { invaders, bullets, bosses, direction, speed, score, lives, hitTime, bossHitTime, bossSpawned } = state;

  // Move bullets
  bullets = bullets
    .map((b) => ({
      ...b,
      y: b.y + (b.fromPlayer ? -BULLET_SPEED : BULLET_SPEED * 0.6),
    }))
    .filter((b) => b.y > -0.05 && b.y < CANVAS_H + 0.05);

  // Move invaders
  const alive = invaders.filter((inv) => inv.alive);

  if (alive.length > 0) {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const inv of alive) {
      if (inv.x < minX) minX = inv.x;
      if (inv.x + INVADER_W > maxX) maxX = inv.x + INVADER_W;
    }

    let drop = false;
    const edgeMargin = -0.15;
    if (direction === 1 && maxX + speed >= CANVAS_W - edgeMargin) {
      drop = true;
    } else if (direction === -1 && minX - speed <= edgeMargin) {
      drop = true;
    }

    invaders = invaders.map((inv) => {
      if (!inv.alive) return inv;
      return {
        ...inv,
        x: drop ? inv.x : inv.x + speed * direction,
        y: drop ? inv.y + INVADER_DROP : inv.y,
      };
    });

    if (drop) {
      direction = (direction * -1) as 1 | -1;
      speed += 0.0001;
    }
  }

  // Check if invaders reached player
  for (const inv of invaders) {
    if (inv.alive && inv.y + INVADER_H >= PLAYER_Y) {
      return { ...state, invaders, bullets, lives: 0, status: "lost" };
    }
  }

  // Bullet-invader collisions
  const hitBullets = new Set<number>();
  for (let bi = 0; bi < bullets.length; bi++) {
    const b = bullets[bi];
    if (!b.fromPlayer) continue;

    for (let ii = 0; ii < invaders.length; ii++) {
      const inv = invaders[ii];
      if (!inv.alive) continue;
      if (
        b.x >= inv.x &&
        b.x <= inv.x + INVADER_W &&
        b.y >= inv.y &&
        b.y <= inv.y + INVADER_H
      ) {
        invaders = invaders.map((v, i) => i === ii ? { ...v, alive: false } : v);
        score += 100;
        hitBullets.add(bi);
        hitTime = now;
        break;
      }
    }
  }

  // Bullet-boss collisions
  bosses = bosses.map((boss) => ({ ...boss }));
  for (let bi = 0; bi < bullets.length; bi++) {
    if (hitBullets.has(bi)) continue;
    const b = bullets[bi];
    if (!b.fromPlayer) continue;
    for (let boi = 0; boi < bosses.length; boi++) {
      const boss = bosses[boi];
      if (
        b.x >= boss.x &&
        b.x <= boss.x + BOSS_W &&
        b.y >= boss.y &&
        b.y <= boss.y + BOSS_H
      ) {
        hitBullets.add(bi);
        bosses[boi] = { ...boss, hp: boss.hp - 1 };
        bossHitTime = now;
        if (bosses[boi].hp <= 0) {
          score += 1000;
          bosses.splice(boi, 1);
        }
        break;
      }
    }
  }

  // Enemy bullets hit player
  for (let bi = 0; bi < bullets.length; bi++) {
    if (hitBullets.has(bi)) continue;
    const b = bullets[bi];
    if (b.fromPlayer) continue;
    const pLeft = state.player - PLAYER_W / 2;
    const pRight = state.player + PLAYER_W / 2;
    if (b.x >= pLeft && b.x <= pRight && b.y >= PLAYER_Y && b.y <= PLAYER_Y + 0.035) {
      hitBullets.add(bi);
      lives--;
      if (lives <= 0) {
        return { ...state, invaders, bullets, bosses, direction, speed, score, lives: 0, status: "lost", hitTime, bossHitTime, bossSpawned };
      }
    }
  }

  bullets = bullets.filter((_, i) => !hitBullets.has(i));

  // Enemy shooting
  const bottomInvaders = new Map<number, Invader>();
  for (const inv of invaders) {
    if (!inv.alive) continue;
    const col = Math.round(inv.x * 100);
    const existing = bottomInvaders.get(col);
    if (!existing || inv.y > existing.y) {
      bottomInvaders.set(col, inv);
    }
  }

  for (const inv of bottomInvaders.values()) {
    if (Math.random() < INVADER_SHOOT_CHANCE) {
      bullets.push({
        x: inv.x + INVADER_W / 2,
        y: inv.y + INVADER_H,
        fromPlayer: false,
      });
    }
  }

  // Boss movement
  for (let i = 0; i < bosses.length; i++) {
    const boss = bosses[i];
    const newX = boss.x + boss.dir;

    if (state.bossMode === "mandatory") {
      // Level 3: bounce
      if (newX >= 0 && newX + BOSS_W <= CANVAS_W) {
        bosses[i] = { ...boss, x: newX };
      } else if (newX + BOSS_W > CANVAS_W) {
        bosses[i] = { ...boss, x: CANVAS_W - BOSS_W, dir: -Math.abs(boss.dir) };
      } else if (newX < 0) {
        bosses[i] = { ...boss, x: 0, dir: Math.abs(boss.dir) };
      }
    } else {
      // Levels 1 & 2: fly straight across
      bosses[i] = { ...boss, x: newX };
    }

    // Boss shoots back
    if (bosses[i] && Math.random() < 0.006) {
      bullets.push({
        x: bosses[i].x + BOSS_W / 2,
        y: bosses[i].y + BOSS_H,
        fromPlayer: false,
      });
    }
  }

  // Random boss: fly off screen = gone, only spawn once per level
  if (state.bossMode === "random") {
    bosses = bosses.filter((b) => b.x > -BOSS_W - 0.1 && b.x < CANVAS_W + 0.1);
    if (bosses.length === 0 && !state.bossSpawned && Math.random() < BOSS_SPAWN_CHANCE) {
      bosses.push({
        x: -BOSS_W,
        y: 0.02,
        hp: BOSS_HP,
        maxHp: BOSS_HP,
        comodinIndex: Math.floor(Math.random() * 3),
        dir: BOSS_SPEED,
      });
      bossSpawned = true;
    }
  }

  // Check cleared
  const stillAlive = invaders.filter((inv) => inv.alive);
  const allClear = stillAlive.length === 0 && (state.bossMode === "random" || bosses.length === 0);

  if (allClear) {
    const finalStatus = state.level >= 3 ? "won" : "cleared";
    return { ...state, invaders, bullets, bosses, direction, speed, score, lives, status: finalStatus, hitTime, bossHitTime, bossSpawned };
  }

  return { ...state, invaders, bullets, bosses, direction, speed, score, lives, hitTime, bossHitTime, bossSpawned };
}
