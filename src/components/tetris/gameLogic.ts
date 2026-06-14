import {
  COLS,
  ROWS,
  SHAPES,
  COLORS,
  POINTS_PER_LINES,
  FLAG_CODES,
  TRIONDA_SHAPE,
  TRIONDA_COLOR,
  TRIONDA_BONUS,
  GARBAGE_ROWS,
  type Board,
  type Cell,
  type Piece,
  type TetrisState,
} from "./gameTypes";

function randomFlag(): string {
  return FLAG_CODES[Math.floor(Math.random() * FLAG_CODES.length)];
}

function randomPiece(): Piece {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[idx],
    color: COLORS[idx],
    flag: randomFlag(),
    pos: { x: Math.floor(COLS / 2) - Math.ceil(SHAPES[idx][0].length / 2), y: 0 },
    isTrionda: false,
  };
}

function triondaPiece(): Piece {
  return {
    shape: TRIONDA_SHAPE,
    color: TRIONDA_COLOR,
    flag: "",
    pos: { x: Math.floor(Math.random() * COLS), y: 0 },
    isTrionda: true,
  };
}

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null) as Cell[]);
}

function garbageBoard(): Board {
  const board = emptyBoard();
  for (let r = ROWS - GARBAGE_ROWS; r < ROWS; r++) {
    const gap = Math.floor(Math.random() * COLS);
    for (let c = 0; c < COLS; c++) {
      if (c === gap) continue;
      board[r][c] = { color: "#374151", flag: randomFlag() };
    }
  }
  return board;
}

export function createInitialState(): TetrisState {
  return {
    board: garbageBoard(),
    current: randomPiece(),
    next: randomPiece(),
    score: 0,
    lines: 0,
    level: 1,
    status: "playing",
    lastClear: 0,
    lastClearTime: 0,
  };
}

function collides(board: Board, piece: Piece): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const x = piece.pos.x + c;
      const y = piece.pos.y + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
  }
  return false;
}

function lockPiece(board: Board, piece: Piece): Board {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const x = piece.pos.x + c;
      const y = piece.pos.y + r;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        newBoard[y][x] = piece.isTrionda
          ? { color: TRIONDA_COLOR, flag: "trionda" }
          : { color: piece.color, flag: piece.flag };
      }
    }
  }
  return newBoard;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((cell) => !cell));
  const cleared = ROWS - kept.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null) as Cell[]);
  return { board: [...empty, ...kept], cleared };
}

function clearTriondaRow(board: Board, piece: Piece): { board: Board; cleared: boolean } {
  const y = piece.pos.y;
  if (y < 0 || y >= ROWS) return { board, cleared: false };
  const hasBlocks = board[y].some((cell) => cell);
  if (!hasBlocks) return { board, cleared: false };
  const newBoard = board.map((row) => [...row]);
  newBoard.splice(y, 1);
  newBoard.unshift(Array(COLS).fill(null) as Cell[]);
  return { board: newBoard, cleared: true };
}

export function rotate(piece: Piece, board: Board): Piece {
  if (piece.isTrionda) return piece;
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;
  const newShape = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => piece.shape[rows - 1 - r][c])
  );
  const rotated = { ...piece, shape: newShape };

  if (!collides(board, rotated)) return rotated;

  for (const kick of [-1, 1, -2, 2]) {
    const kicked = { ...rotated, pos: { ...rotated.pos, x: rotated.pos.x + kick } };
    if (!collides(board, kicked)) return kicked;
  }

  return piece;
}

export function moveLeft(state: TetrisState): TetrisState {
  const moved = { ...state.current, pos: { ...state.current.pos, x: state.current.pos.x - 1 } };
  if (collides(state.board, moved)) return state;
  return { ...state, current: moved };
}

export function moveRight(state: TetrisState): TetrisState {
  const moved = { ...state.current, pos: { ...state.current.pos, x: state.current.pos.x + 1 } };
  if (collides(state.board, moved)) return state;
  return { ...state, current: moved };
}

export function hardDrop(state: TetrisState): TetrisState {
  let piece = state.current;
  while (!collides(state.board, { ...piece, pos: { ...piece.pos, y: piece.pos.y + 1 } })) {
    piece = { ...piece, pos: { ...piece.pos, y: piece.pos.y + 1 } };
  }
  return lockAndSpawn({ ...state, current: piece });
}

function spawnNext(state: TetrisState): Piece {
  const roll = Math.random();
  if (roll < 0.08 && state.lines > 0) return triondaPiece();
  return randomPiece();
}

function lockAndSpawn(state: TetrisState): TetrisState {
  const locked = lockPiece(state.board, state.current);

  let board: Board;
  let cleared: number;
  let score = state.score;

  if (state.current.isTrionda) {
    const result = clearTriondaRow(locked, state.current);
    board = result.board;
    cleared = result.cleared ? 1 : 0;
    if (result.cleared) score += TRIONDA_BONUS * state.level;
  } else {
    const result = clearLines(locked);
    board = result.board;
    cleared = result.cleared;
    score += (POINTS_PER_LINES[cleared] ?? 0) * state.level;
  }

  const lines = state.lines + cleared;
  const level = Math.floor(lines / 10) + 1;
  const next = spawnNext({ ...state, lines });
  const now = typeof performance !== "undefined" ? performance.now() : 0;

  if (collides(board, state.next)) {
    return { ...state, board, score, lines, level, status: "lost", lastClear: cleared, lastClearTime: now };
  }

  return {
    ...state,
    board,
    current: state.next,
    next,
    score,
    lines,
    level,
    lastClear: cleared,
    lastClearTime: cleared > 0 ? now : state.lastClearTime,
  };
}

export function tick(state: TetrisState): TetrisState {
  if (state.status !== "playing") return state;

  const moved = { ...state.current, pos: { ...state.current.pos, y: state.current.pos.y + 1 } };
  if (!collides(state.board, moved)) {
    return { ...state, current: moved };
  }

  return lockAndSpawn(state);
}

export function softDrop(state: TetrisState): TetrisState {
  const moved = { ...state.current, pos: { ...state.current.pos, y: state.current.pos.y + 1 } };
  if (collides(state.board, moved)) return state;
  return { ...state, current: moved };
}

export function getGhostY(board: Board, piece: Piece): number {
  let y = piece.pos.y;
  while (!collides(board, { ...piece, pos: { ...piece.pos, y: y + 1 } })) {
    y++;
  }
  return y;
}
