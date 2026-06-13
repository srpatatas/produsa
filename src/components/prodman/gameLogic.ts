import {
  CellType,
  Direction,
  DELTA,
  COLS,
  ROWS,
  POWER_DURATION,
  MAX_LIVES,
  parseMaze,
  type ProdmanState,
  type Pos,
  type Ghost,
} from "./gameTypes";

export function createInitialState(): ProdmanState {
  const { grid, playerStart, ghostStarts, totalDots } = parseMaze();

  const ghosts: Ghost[] = ghostStarts.slice(0, 3).map((pos, i) => ({
    pos: { ...pos },
    dir: Direction.UP,
    scared: false,
    eaten: false,
    imageIdx: i,
  }));

  return {
    grid: grid.map((r) => [...r]),
    player: { ...playerStart },
    playerDir: Direction.LEFT,
    nextDir: null,
    ghosts,
    score: 0,
    lives: MAX_LIVES,
    dotsLeft: totalDots,
    powerTimer: 0,
    status: "playing",
    tick: 0,
  };
}

function canMove(grid: CellType[][], pos: Pos, dir: Direction): boolean {
  const d = DELTA[dir];
  let nx = pos.x + d.x;
  let ny = pos.y + d.y;
  if (nx < 0) nx = COLS - 1;
  if (nx >= COLS) nx = 0;
  if (ny < 0 || ny >= ROWS) return false;
  return grid[ny][nx] !== CellType.WALL;
}

function applyMove(pos: Pos, dir: Direction): Pos {
  const d = DELTA[dir];
  let nx = pos.x + d.x;
  let ny = pos.y + d.y;
  if (nx < 0) nx = COLS - 1;
  if (nx >= COLS) nx = 0;
  return { x: nx, y: ny };
}

function ghostDistance(a: Pos, b: Pos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function moveGhost(ghost: Ghost, grid: CellType[][], player: Pos, tick: number): Ghost {
  const dirs = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
  const opposite: Record<Direction, Direction> = {
    [Direction.UP]: Direction.DOWN,
    [Direction.DOWN]: Direction.UP,
    [Direction.LEFT]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.LEFT,
  };

  const possible = dirs.filter(
    (d) => d !== opposite[ghost.dir] && canMove(grid, ghost.pos, d),
  );

  if (possible.length === 0) {
    const fallback = dirs.filter((d) => canMove(grid, ghost.pos, d));
    if (fallback.length === 0) return ghost;
    const dir = fallback[Math.floor(Math.random() * fallback.length)];
    return { ...ghost, pos: applyMove(ghost.pos, dir), dir };
  }

  let chosenDir: Direction;

  if (ghost.scared) {
    const sorted = possible.sort(
      (a, b) => ghostDistance(applyMove(ghost.pos, b), player) - ghostDistance(applyMove(ghost.pos, a), player),
    );
    chosenDir = sorted[0];
  } else {
    if (ghost.imageIdx === 0) {
      const sorted = possible.sort(
        (a, b) => ghostDistance(applyMove(ghost.pos, a), player) - ghostDistance(applyMove(ghost.pos, b), player),
      );
      chosenDir = sorted[0];
    } else if (ghost.imageIdx === 1) {
      const ahead = applyMove(applyMove(player, Direction.UP), Direction.UP);
      const target = { x: ahead.x, y: Math.max(0, ahead.y) };
      const sorted = possible.sort(
        (a, b) => ghostDistance(applyMove(ghost.pos, a), target) - ghostDistance(applyMove(ghost.pos, b), target),
      );
      chosenDir = sorted[0];
    } else {
      if (ghostDistance(ghost.pos, player) > 8) {
        const sorted = possible.sort(
          (a, b) => ghostDistance(applyMove(ghost.pos, a), player) - ghostDistance(applyMove(ghost.pos, b), player),
        );
        chosenDir = sorted[0];
      } else {
        chosenDir = possible[Math.floor(Math.random() * possible.length)];
      }
    }
  }

  return { ...ghost, pos: applyMove(ghost.pos, chosenDir), dir: chosenDir };
}

export function gameTick(state: ProdmanState, inputDir: Direction | null): ProdmanState {
  if (state.status !== "playing") return state;

  let s = { ...state, tick: state.tick + 1 };
  const grid = s.grid.map((r) => [...r]);

  if (inputDir !== null && canMove(grid, s.player, inputDir)) {
    s.playerDir = inputDir;
    s.nextDir = null;
  } else if (inputDir !== null) {
    s.nextDir = inputDir;
  }

  if (s.nextDir !== null && canMove(grid, s.player, s.nextDir)) {
    s.playerDir = s.nextDir;
    s.nextDir = null;
  }

  let newPlayer = s.player;
  if (canMove(grid, s.player, s.playerDir)) {
    newPlayer = applyMove(s.player, s.playerDir);
  }

  let { score, dotsLeft, powerTimer } = s;

  const cell = grid[newPlayer.y][newPlayer.x];
  if (cell === CellType.DOT) {
    grid[newPlayer.y][newPlayer.x] = CellType.EMPTY;
    score += 10;
    dotsLeft--;
  } else if (cell === CellType.POWER) {
    grid[newPlayer.y][newPlayer.x] = CellType.EMPTY;
    score += 50;
    dotsLeft--;
    powerTimer = POWER_DURATION;
  }

  if (powerTimer > 0) powerTimer--;

  let ghosts = s.ghosts.map((g) => ({
    ...g,
    scared: powerTimer > 0 && !g.eaten,
  }));

  ghosts = ghosts.map((g) => {
    if (g.eaten) return g;
    return moveGhost(g, grid, newPlayer, s.tick);
  });

  let lives = s.lives;
  let eatBonus = 0;

  for (let i = 0; i < ghosts.length; i++) {
    const g = ghosts[i];
    if (g.pos.x === newPlayer.x && g.pos.y === newPlayer.y) {
      if (g.scared && !g.eaten) {
        ghosts[i] = { ...g, eaten: true, scared: false };
        eatBonus += 200;
      } else if (!g.eaten) {
        lives--;
        if (lives <= 0) {
          return { ...s, grid, player: newPlayer, ghosts, score: score + eatBonus, lives, dotsLeft, powerTimer, status: "lost" };
        }
        const { playerStart, ghostStarts } = parseMaze();
        return {
          ...s,
          grid,
          player: playerStart,
          playerDir: Direction.LEFT,
          nextDir: null,
          ghosts: ghosts.map((gh, idx) => ({
            ...gh,
            pos: ghostStarts[idx] ? { ...ghostStarts[idx] } : gh.pos,
            dir: Direction.UP,
            scared: false,
            eaten: false,
          })),
          score: score + eatBonus,
          lives,
          dotsLeft,
          powerTimer: 0,
        };
      }
    }
  }

  if (powerTimer === 0) {
    ghosts = ghosts.map((g) => {
      if (g.eaten) {
        const { ghostStarts } = parseMaze();
        return { ...g, eaten: false, pos: ghostStarts[g.imageIdx] ? { ...ghostStarts[g.imageIdx] } : g.pos, dir: Direction.UP };
      }
      return g;
    });
  }

  score += eatBonus;

  if (dotsLeft <= 0) {
    return { ...s, grid, player: newPlayer, ghosts, score, lives, dotsLeft, powerTimer, status: "won" };
  }

  return { ...s, grid, player: newPlayer, ghosts, score, lives, dotsLeft, powerTimer };
}
