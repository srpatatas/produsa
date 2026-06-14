import { useRef, useEffect, useCallback, useState } from "react";
import { COLS, ROWS, TICK_MS, FLAG_CODES, CLEAR_LABELS, type TetrisState, type Piece } from "./gameTypes";
import {
  createInitialState,
  tick,
  moveLeft,
  moveRight,
  softDrop,
  hardDrop,
  rotate,
  getGhostY,
} from "./gameLogic";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

interface Confetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  spin: number;
}

const CONFETTI_COLORS = ["#6366f1", "#f59e0b", "#14b8a6", "#22c55e", "#ef4444", "#3b82f6", "#f97316", "#c5e34a"];

function spawnConfetti(canvasW: number, canvasH: number, count: number): Confetti[] {
  const particles: Confetti[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvasW / 2 + (Math.random() - 0.5) * canvasW * 0.6,
      y: canvasH / 2 + (Math.random() - 0.5) * canvasH * 0.2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 1) * 6 - 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
    });
  }
  return particles;
}

export function useTetrisLoop(canvasWidth: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TetrisState>(createInitialState());
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef(0);
  const flagCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const triondaImg = useRef<HTMLImageElement | null>(null);
  const confettiRef = useRef<Confetti[]>([]);
  const lastClearIdRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "lost">("loading");

  const cellSize = canvasWidth / COLS;
  const canvasHeight = cellSize * ROWS;

  useEffect(() => {
    loadImage("/images/trionda.png")
      .then((img) => { triondaImg.current = img; })
      .catch(() => {})
      .finally(() => setStatus("ready"));
  }, []);

  const ensureFlag = useCallback((code: string) => {
    if (flagCache.current.has(code)) return;
    flagCache.current.set(code, null as unknown as HTMLImageElement);
    loadImage(`https://flagcdn.com/w80/${code}.png`)
      .then((img) => flagCache.current.set(code, img))
      .catch(() => {});
  }, []);

  const start = useCallback(() => {
    stateRef.current = createInitialState();
    setScore(0);
    setLines(0);
    setLevel(1);
    setStatus("playing");
    ensureFlag(stateRef.current.current.flag);
    ensureFlag(stateRef.current.next.flag);
  }, [ensureFlag]);

  const act = useCallback((fn: (s: TetrisState) => TetrisState) => {
    const s = fn(stateRef.current);
    stateRef.current = s;
    setScore(s.score);
    setLines(s.lines);
    setLevel(s.level);
    if (s.status === "lost") setStatus("lost");
    if (s.current.flag) ensureFlag(s.current.flag);
    if (s.next.flag) ensureFlag(s.next.flag);
  }, [ensureFlag]);

  const doMoveLeft = useCallback(() => act(moveLeft), [act]);
  const doMoveRight = useCallback(() => act(moveRight), [act]);
  const doSoftDrop = useCallback(() => act(softDrop), [act]);
  const doHardDrop = useCallback(() => act(hardDrop), [act]);
  const doRotate = useCallback(() => {
    act((s) => ({ ...s, current: rotate(s.current, s.board) }));
  }, [act]);

  useEffect(() => {
    if (status !== "playing") return;

    function getSpeed(lvl: number) {
      return Math.max(80, TICK_MS - (lvl - 1) * 80);
    }

    function loop() {
      const prev = stateRef.current;
      const s = tick(stateRef.current);
      stateRef.current = s;
      setScore(s.score);
      setLines(s.lines);
      setLevel(s.level);
      if (s.current.flag) ensureFlag(s.current.flag);
      if (s.next.flag) ensureFlag(s.next.flag);
      if (s.status === "lost") {
        setStatus("lost");
        return;
      }
      tickRef.current = setTimeout(loop, getSpeed(s.level));
    }

    tickRef.current = setTimeout(loop, getSpeed(stateRef.current.level));
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [status, ensureFlag]);

  useEffect(() => {
    if (status !== "playing" && status !== "lost") return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = canvasWidth + "px";
      canvas.style.height = canvasHeight + "px";
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvasWidth, y * cellSize);
        ctx.stroke();
      }

      const s = stateRef.current;

      // Board cells with flags
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = s.board[r][c];
          if (!cell) continue;
          drawFlagBlock(ctx, c, r, cell.color, cell.flag, cellSize, flagCache.current, triondaImg.current);
        }
      }

      // Ghost piece (only levels 1-2)
      if (s.level <= 2) {
        const ghostY = getGhostY(s.board, s.current);
        for (let r = 0; r < s.current.shape.length; r++) {
          for (let c = 0; c < s.current.shape[r].length; c++) {
            if (!s.current.shape[r][c]) continue;
            const gx = s.current.pos.x + c;
            const gy = ghostY + r;
            if (gy >= 0) {
              ctx.fillStyle = "rgba(255,255,255,0.08)";
              ctx.fillRect(gx * cellSize + 1, gy * cellSize + 1, cellSize - 2, cellSize - 2);
              ctx.strokeStyle = "rgba(255,255,255,0.15)";
              ctx.lineWidth = 1;
              ctx.strokeRect(gx * cellSize + 1, gy * cellSize + 1, cellSize - 2, cellSize - 2);
            }
          }
        }
      }

      // Current piece
      for (let r = 0; r < s.current.shape.length; r++) {
        for (let c = 0; c < s.current.shape[r].length; c++) {
          if (!s.current.shape[r][c]) continue;
          const px = s.current.pos.x + c;
          const py = s.current.pos.y + r;
          if (py >= 0) {
            if (s.current.isTrionda) {
              drawTrionda(ctx, px, py, cellSize, triondaImg.current);
            } else {
              drawFlagBlock(ctx, px, py, s.current.color, s.current.flag, cellSize, flagCache.current, null);
            }
          }
        }
      }

      // Spawn confetti on new clears
      const clearId = s.lastClearTime;
      if (s.lastClear > 0 && clearId !== lastClearIdRef.current) {
        lastClearIdRef.current = clearId;
        const count = s.lastClear >= 4 ? 60 : s.lastClear >= 2 ? 30 : 15;
        confettiRef.current = spawnConfetti(canvasWidth, canvasHeight, count);
      }

      // GOOOL flash + confetti
      const now = performance.now();
      const elapsed = now - s.lastClearTime;
      if (s.lastClear > 0 && elapsed < 1500) {
        // Confetti particles
        const particles = confettiRef.current;
        for (const p of particles) {
          p.x += p.vx;
          p.vy += 0.15;
          p.y += p.vy;
          p.rotation += p.spin;
          const pAlpha = Math.max(0, 1 - elapsed / 1500);
          ctx.save();
          ctx.globalAlpha = pAlpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }

        // Text
        const alpha = Math.max(0, 1 - elapsed / 1500);
        const label = CLEAR_LABELS[s.lastClear] || "GOL";
        const bounce = elapsed < 300 ? Math.sin((elapsed / 300) * Math.PI) * 0.3 : 0;
        const scale = 1 + bounce;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.scale(scale, scale);

        const fontSize = Math.round(cellSize * 2.5);
        ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 4;
        ctx.strokeText(label, 0, 0);

        ctx.shadowColor = s.lastClear >= 4 ? "#f59e0b" : "#6366f1";
        ctx.shadowBlur = 25;
        ctx.fillStyle = s.lastClear >= 4 ? "#f59e0b" : "#ffffff";
        ctx.fillText(label, 0, 0);

        if (s.lastClear >= 4) {
          const subSize = Math.round(cellSize * 1.2);
          ctx.font = `900 ${subSize}px Outfit, sans-serif`;
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 15;
          ctx.strokeText("⚽ TETRIS ⚽", 0, cellSize * 2);
          ctx.fillText("⚽ TETRIS ⚽", 0, cellSize * 2);
        }

        ctx.restore();
      }

      // Next piece preview
      const preview = previewRef.current;
      if (preview) {
        const pCtx = preview.getContext("2d");
        if (pCtx) {
          const pCell = cellSize * 0.7;
          const shape = s.next.shape;
          const pw = shape[0].length * pCell;
          const ph = shape.length * pCell;
          preview.width = Math.ceil(pw * dpr) + 1;
          preview.height = Math.ceil(ph * dpr) + 1;
          preview.style.width = pw + "px";
          preview.style.height = ph + "px";
          pCtx.scale(dpr, dpr);
          pCtx.clearRect(0, 0, pw, ph);
          for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
              if (!shape[r][c]) continue;
              if (s.next.isTrionda) {
                drawTrionda(pCtx, c, r, pCell, triondaImg.current);
              } else {
                drawFlagBlock(pCtx, c, r, s.next.color, s.next.flag, pCell, flagCache.current, null);
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasWidth, canvasHeight, cellSize]);

  return {
    canvasRef,
    previewRef,
    canvasHeight,
    score,
    lines,
    level,
    status,
    start,
    moveLeft: doMoveLeft,
    moveRight: doMoveRight,
    softDrop: doSoftDrop,
    hardDrop: doHardDrop,
    rotate: doRotate,
  };
}

function drawFlagBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  flag: string,
  size: number,
  cache: Map<string, HTMLImageElement>,
  triondaImgRef: HTMLImageElement | null,
) {
  const px = x * size;
  const py = y * size;
  const inset = 1;

  if (flag === "trionda") {
    drawTrionda(ctx, x, y, size, triondaImgRef);
    return;
  }

  ctx.fillStyle = color;
  ctx.fillRect(px + inset, py + inset, size - inset * 2, size - inset * 2);

  // Flag overlay
  const flagImg = flag ? cache.get(flag) : null;
  if (flagImg) {
    const flagW = size - inset * 2 - 4;
    const flagH = flagW * 0.65;
    const fx = px + inset + 2;
    const fy = py + (size - flagH) / 2;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.roundRect(fx, fy, flagW, flagH, 1);
    ctx.clip();
    ctx.drawImage(flagImg, fx, fy, flagW, flagH);
    ctx.restore();
  }

  // 3D edges
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(px + inset, py + inset, size - inset * 2, 2);
  ctx.fillRect(px + inset, py + inset, 2, size - inset * 2);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(px + inset, py + size - inset - 2, size - inset * 2, 2);
  ctx.fillRect(px + size - inset - 2, py + inset, 2, size - inset * 2);
}

function drawTrionda(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  img: HTMLImageElement | null,
) {
  const px = x * size;
  const py = y * size;

  ctx.save();
  ctx.shadowColor = "#c5e34a";
  ctx.shadowBlur = 8;

  if (img) {
    const s = size * 0.85;
    const off = (size - s) / 2;
    ctx.drawImage(img, px + off, py + off, s, s);
  } else {
    ctx.fillStyle = "#c5e34a";
    ctx.beginPath();
    ctx.arc(px + size / 2, py + size / 2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
