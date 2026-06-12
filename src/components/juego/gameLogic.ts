import {
  CellState,
  Direction,
  DELTA,
  GRID_W,
  GRID_H,
  WIN_PCT,
  MAX_LIVES,
  type GameState,
  type Pos,
} from "./gameTypes";

export function initGrid(): CellState[][] {
  const grid: CellState[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    const row: CellState[] = [];
    for (let x = 0; x < GRID_W; x++) {
      const isOuterEdge = x === 0 || x === GRID_W - 1 || y === 0 || y === GRID_H - 1;
      const isInnerEdge = x === 1 || x === GRID_W - 2 || y === 1 || y === GRID_H - 2;
      if (isOuterEdge) {
        row.push(CellState.BORDER);
      } else if (isInnerEdge) {
        row.push(CellState.CLAIMED);
      } else {
        row.push(CellState.UNCLAIMED);
      }
    }
    grid.push(row);
  }
  return grid;
}

export function createInitialState(): GameState {
  return {
    grid: initGrid(),
    player: { x: 1, y: 1 },
    trail: [],
    isVenturing: false,
    enemy: { x: Math.floor(GRID_W / 2), y: Math.floor(GRID_H / 2) },
    enemyTick: 0,
    revealedPct: calcRevealedPct(initGrid()),
    lives: MAX_LIVES,
    status: "playing",
  };
}

function isSafe(cell: CellState): boolean {
  return cell === CellState.CLAIMED || cell === CellState.BORDER;
}

export function isOnBorder(grid: CellState[][], x: number, y: number): boolean {
  if (grid[y][x] !== CellState.CLAIMED) return false;
  for (const d of [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]) {
    const delta = DELTA[d];
    const ax = x + delta.x;
    const ay = y + delta.y;
    if (ax < 0 || ax >= GRID_W || ay < 0 || ay >= GRID_H) continue;
    if (grid[ay][ax] === CellState.UNCLAIMED) return true;
  }
  return false;
}

export function movePlayer(state: GameState, dir: Direction): GameState {
  if (state.status !== "playing") return state;

  const d = DELTA[dir];
  const nx = state.player.x + d.x;
  const ny = state.player.y + d.y;

  if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) return state;

  const destCell = state.grid[ny][nx];

  if (destCell === CellState.TRAIL && state.isVenturing && state.trail.length >= 2) {
    const prev = state.trail[state.trail.length - 1];
    if (prev.x === nx && prev.y === ny) {
      const grid = state.grid.map((r) => [...r]);
      grid[state.player.y][state.player.x] = CellState.UNCLAIMED;
      const trail = state.trail.slice(0, -1);
      const backOnSafe = trail.length === 0;
      return {
        ...state,
        grid,
        player: { x: nx, y: ny },
        trail: backOnSafe ? [] : trail,
        isVenturing: !backOnSafe,
      };
    }
    return state;
  }

  if (destCell === CellState.TRAIL) return state;

  const grid = state.grid.map((r) => [...r]);
  let { trail, isVenturing } = state;
  trail = [...trail];

  if (!isVenturing) {
    if (destCell === CellState.UNCLAIMED) {
      isVenturing = true;
      trail = [state.player];
      grid[state.player.y][state.player.x] = CellState.TRAIL;
    } else if (!isSafe(destCell) || !isOnBorder(grid, nx, ny)) {
      return state;
    }
  } else {
    if (isSafe(destCell)) {
      trail.push(state.player);
      grid[state.player.y][state.player.x] = CellState.TRAIL;
      const claimed = claimTerritory(grid, state.enemy);
      const pct = calcRevealedPct(claimed);
      return {
        ...state,
        grid: claimed,
        player: { x: nx, y: ny },
        trail: [],
        isVenturing: false,
        revealedPct: pct,
        status: pct >= WIN_PCT ? "won" : "playing",
      };
    } else {
      trail.push(state.player);
      grid[state.player.y][state.player.x] = CellState.TRAIL;
    }
  }

  return {
    ...state,
    grid,
    player: { x: nx, y: ny },
    trail,
    isVenturing,
  };
}

function claimTerritory(grid: CellState[][], enemyPos: Pos): CellState[][] {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (grid[y][x] === CellState.TRAIL) grid[y][x] = CellState.CLAIMED;
    }
  }

  const reachable = floodFillFromEnemy(grid, enemyPos);

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (grid[y][x] === CellState.UNCLAIMED && !reachable.has(y * GRID_W + x)) {
        grid[y][x] = CellState.CLAIMED;
      }
    }
  }

  return grid;
}

function floodFillFromEnemy(grid: CellState[][], pos: Pos): Set<number> {
  const reachable = new Set<number>();
  const queue: Pos[] = [pos];
  const key = (p: Pos) => p.y * GRID_W + p.x;

  if (grid[pos.y][pos.x] !== CellState.UNCLAIMED) return reachable;

  reachable.add(key(pos));

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const d of [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]) {
      const delta = DELTA[d];
      const nx = cur.x + delta.x;
      const ny = cur.y + delta.y;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      const k = ny * GRID_W + nx;
      if (reachable.has(k)) continue;
      if (grid[ny][nx] === CellState.UNCLAIMED) {
        reachable.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return reachable;
}

function getEnemyTickRate(revealedPct: number): number {
  if (revealedPct < 20) return 3;
  if (revealedPct < 40) return 2;
  if (revealedPct < 60) return 2;
  return 1;
}

export function moveEnemy(state: GameState): GameState {
  if (state.status !== "playing") return state;

  const tick = state.enemyTick + 1;
  const tickRate = getEnemyTickRate(state.revealedPct);
  if (tick % tickRate !== 0) return { ...state, enemyTick: tick };

  const { enemy, grid, isVenturing, player, trail } = state;

  let nextPos: Pos;
  if (isVenturing && trail.length > 0) {
    const nearest = findNearestTrail(grid, enemy, trail);
    if (nearest) {
      const step = bfsPath(grid, enemy, nearest);
      nextPos = step || moveTowardClosingIn(enemy, player, grid);
    } else {
      nextPos = moveTowardClosingIn(enemy, player, grid);
    }
  } else {
    nextPos = randomWalk(grid, enemy);
  }

  return {
    ...state,
    enemy: nextPos,
    enemyTick: tick,
  };
}

function moveTowardClosingIn(from: Pos, to: Pos, grid: CellState[][]): Pos {
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);

  const closingDirs: Direction[] = [];
  if (dy > 0) closingDirs.push(from.y < to.y ? Direction.DOWN : Direction.UP);
  if (dx > 0) closingDirs.push(from.x < to.x ? Direction.RIGHT : Direction.LEFT);
  if (dy <= dx) {
    closingDirs.reverse();
  }

  for (const d of closingDirs) {
    const delta = DELTA[d];
    const nx = from.x + delta.x;
    const ny = from.y + delta.y;
    if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
    if (grid[ny][nx] === CellState.UNCLAIMED || grid[ny][nx] === CellState.TRAIL) {
      return { x: nx, y: ny };
    }
  }

  return randomWalk(grid, from);
}

function findNearestTrail(grid: CellState[][], from: Pos, trail: Pos[]): Pos | null {
  let nearest: Pos | null = null;
  let minDist = Infinity;
  for (const t of trail) {
    const dist = Math.abs(t.x - from.x) + Math.abs(t.y - from.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = t;
    }
  }
  return nearest;
}

function bfsPath(grid: CellState[][], from: Pos, to: Pos): Pos | null {
  const visited = new Set<number>();
  const parent = new Map<number, Pos>();
  const queue: Pos[] = [from];
  const key = (p: Pos) => p.y * GRID_W + p.x;

  visited.add(key(from));

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === to.x && cur.y === to.y) {
      let step = to;
      while (true) {
        const p = parent.get(key(step));
        if (!p || (p.x === from.x && p.y === from.y)) return step;
        step = p;
      }
    }

    for (const d of [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]) {
      const delta = DELTA[d];
      const nx = cur.x + delta.x;
      const ny = cur.y + delta.y;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      const k = ny * GRID_W + nx;
      if (visited.has(k)) continue;
      const cell = grid[ny][nx];
      if (cell === CellState.UNCLAIMED || cell === CellState.TRAIL) {
        visited.add(k);
        parent.set(k, cur);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return null;
}

function randomWalk(grid: CellState[][], pos: Pos): Pos {
  const dirs = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
  const shuffled = dirs.sort(() => Math.random() - 0.5);
  for (const d of shuffled) {
    const delta = DELTA[d];
    const nx = pos.x + delta.x;
    const ny = pos.y + delta.y;
    if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
    if (grid[ny][nx] === CellState.UNCLAIMED) return { x: nx, y: ny };
  }
  return pos;
}

function findBorderSpawn(grid: CellState[][], enemy: Pos): Pos {
  let best: Pos = { x: 2, y: 2 };
  let maxDist = -1;
  const centerX = GRID_W / 2;
  const centerY = GRID_H / 2;
  for (let y = 2; y < GRID_H - 2; y++) {
    for (let x = 2; x < GRID_W - 2; x++) {
      if (!isOnBorder(grid, x, y)) continue;
      const enemyDist = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
      const edgeDist = Math.min(x, y, GRID_W - 1 - x, GRID_H - 1 - y);
      const centerDist = Math.abs(x - centerX) + Math.abs(y - centerY);
      const score = enemyDist * 2 - edgeDist * 3 - centerDist;
      if (score > maxDist) {
        maxDist = score;
        best = { x, y };
      }
    }
  }
  return best;
}

export function checkEnemyOnTrail(state: GameState): GameState {
  if (!state.isVenturing) return state;
  const { enemy, grid } = state;
  if (grid[enemy.y]?.[enemy.x] !== CellState.TRAIL) return state;

  const newLives = state.lives - 1;
  if (newLives <= 0) return { ...state, status: "lost" };

  const newGrid = grid.map((r) => [...r]);
  for (const t of state.trail) {
    if (newGrid[t.y][t.x] === CellState.TRAIL) {
      newGrid[t.y][t.x] = CellState.UNCLAIMED;
    }
  }

  const respawn = findBorderSpawn(newGrid, state.enemy);

  return {
    ...state,
    grid: newGrid,
    player: respawn,
    trail: [],
    isVenturing: false,
    lives: newLives,
  };
}

export function calcRevealedPct(grid: CellState[][]): number {
  let claimed = 0;
  let total = 0;
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      total++;
      if (grid[y][x] === CellState.CLAIMED || grid[y][x] === CellState.BORDER) claimed++;
    }
  }
  return Math.round((claimed / total) * 100);
}
