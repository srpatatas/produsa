import { useRef, useEffect, useCallback, useState } from "react";
import {
  CellType,
  Direction,
  COLS,
  ROWS,
  TICK_MS,
  ENEMY_IMAGES,
  type ProdmanState,
} from "./gameTypes";
import { createInitialState, gameTick } from "./gameLogic";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function useProdmanLoop(
  canvasSize: number,
  playerAvatarUrl: string | null,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ProdmanState>(createInitialState());
  const dirRef = useRef<Direction | null>(null);
  const enemyImgsRef = useRef<HTMLImageElement[]>([]);
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "won" | "lost">("loading");
  const initialLoadDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ...ENEMY_IMAGES.map(loadImage),
      playerAvatarUrl ? loadImage(playerAvatarUrl).catch(() => null) : Promise.resolve(null),
    ]).then((results) => {
      if (cancelled) return;
      const enemies = results.slice(0, ENEMY_IMAGES.length) as HTMLImageElement[];
      const player = results[results.length - 1] as HTMLImageElement | null;
      enemyImgsRef.current = enemies;
      playerImgRef.current = player;
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setStatus("ready");
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [playerAvatarUrl]);

  const start = useCallback(() => {
    stateRef.current = createInitialState();
    dirRef.current = null;
    setScore(0);
    setLives(stateRef.current.lives);
    setStatus("playing");
  }, []);

  const setDirection = useCallback((dir: Direction | null) => {
    dirRef.current = dir;
  }, []);

  useEffect(() => {
    if (status !== "playing") return;

    tickRef.current = setInterval(() => {
      const s = gameTick(stateRef.current, dirRef.current);
      stateRef.current = s;
      setScore(s.score);
      setLives(s.lives);
      if (s.status !== "playing") {
        setStatus(s.status);
      }
    }, TICK_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [status]);

  const cellSize = canvasSize / COLS;
  const canvasHeight = cellSize * ROWS;

  useEffect(() => {
    if (status !== "playing" && status !== "won" && status !== "lost") return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvasSize * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = canvasSize + "px";
      canvas.style.height = canvasHeight + "px";
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvasSize, canvasHeight);

      const s = stateRef.current;

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = s.grid[y][x];
          const px = x * cellSize;
          const py = y * cellSize;

          if (cell === CellType.WALL) {
            ctx.fillStyle = "#1a3a8a";
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
          } else if (cell === CellType.DOT) {
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.12, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === CellType.POWER) {
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.35, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      for (const ghost of s.ghosts) {
        if (ghost.eaten) continue;
        const gx = ghost.pos.x * cellSize;
        const gy = ghost.pos.y * cellSize;
        const gSize = cellSize * 0.9;
        const offset = (cellSize - gSize) / 2;

        if (ghost.scared) {
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath();
          ctx.arc(gx + cellSize / 2, gy + cellSize / 2, gSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = Math.round(gSize * 0.5) + "px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("😨", gx + cellSize / 2, gy + cellSize / 2);
        } else {
          const img = enemyImgsRef.current[ghost.imageIdx];
          if (img) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(gx + cellSize / 2, gy + cellSize / 2, gSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, gx + offset, gy + offset, gSize, gSize);
            ctx.restore();
            ctx.beginPath();
            ctx.arc(gx + cellSize / 2, gy + cellSize / 2, gSize / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(244, 63, 94, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      const playerSize = cellSize * 0.85;
      const pOffset = (cellSize - playerSize) / 2;
      const ppx = s.player.x * cellSize;
      const ppy = s.player.y * cellSize;

      ctx.save();
      ctx.shadowColor = "#c5e34a";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ppx + cellSize / 2, ppy + cellSize / 2, playerSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#c5e34a";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (playerImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ppx + cellSize / 2, ppy + cellSize / 2, playerSize / 2 - 1, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(playerImgRef.current, ppx + pOffset, ppy + pOffset, playerSize, playerSize);
        ctx.restore();
      } else {
        ctx.fillStyle = "#c5e34a";
        ctx.beginPath();
        ctx.arc(ppx + cellSize / 2, ppy + cellSize / 2, playerSize / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasSize, canvasHeight, cellSize]);

  return { canvasRef, canvasHeight, score, lives, status, start, setDirection };
}
