import {
  Direction,
  DELTA,
  OPPOSITE,
  COLS,
  ROWS,
  MAX_OBSTACLES,
  FLAG_CODES,
  type SnakeState,
  type Pos,
} from "./gameTypes";

function randomPos(exclude: Pos[]): Pos {
  const occupied = new Set(exclude.map((p) => p.y * COLS + p.x));
  let pos: Pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (occupied.has(pos.y * COLS + pos.x));
  return pos;
}

export function createInitialState(): SnakeState {
  const head = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
  const snake = [
    head,
    { x: head.x - 1, y: head.y },
    { x: head.x - 2, y: head.y },
  ];
  const food = randomPos(snake);
  return {
    snake,
    dir: Direction.RIGHT,
    nextDir: Direction.RIGHT,
    food,
    foodType: "flag",
    obstacles: [],
    score: 0,
    length: 3,
    moving: false,
    status: "playing",
  };
}

export function gameTick(state: SnakeState): SnakeState {
  if (state.status !== "playing" || !state.moving) return state;

  const dir = state.nextDir;
  const d = DELTA[dir];
  const head = state.snake[0];
  const newHead = { x: head.x + d.x, y: head.y + d.y };

  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    return { ...state, dir, status: "lost" };
  }

  for (const seg of state.snake) {
    if (seg.x === newHead.x && seg.y === newHead.y) {
      return { ...state, dir, status: "lost" };
    }
  }

  for (const obs of state.obstacles) {
    if (obs.x === newHead.x && obs.y === newHead.y) {
      return { ...state, dir, status: "lost" };
    }
  }

  const ate = newHead.x === state.food.x && newHead.y === state.food.y;
  const newSnake = [newHead, ...state.snake];
  if (!ate) newSnake.pop();

  let { score, length, obstacles } = state;
  let food = state.food;
  let foodType = state.foodType;

  if (ate) {
    score += foodType === "trionda" ? 200 : 50;
    length++;

    const allOccupied = [...newSnake, ...obstacles];
    food = randomPos(allOccupied);
    foodType = Math.random() < 0.15 ? "trionda" : "flag";

    if (length % 3 === 0 && obstacles.length < MAX_OBSTACLES) {
      obstacles = [...obstacles, randomPos([...allOccupied, food])];
    }
  }

  return {
    ...state,
    snake: newSnake,
    dir,
    food,
    foodType,
    obstacles,
    score,
    length,
  };
}

export function setDirection(state: SnakeState, dir: Direction): SnakeState {
  if (dir === OPPOSITE[state.dir]) return state;
  return { ...state, nextDir: dir, moving: true };
}

export function randomFlagCode(): string {
  return FLAG_CODES[Math.floor(Math.random() * FLAG_CODES.length)];
}
