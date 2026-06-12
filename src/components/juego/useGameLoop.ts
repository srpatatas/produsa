import { useRef, useEffect, useCallback, useState } from "react";
import {
  CellState,
  Direction,
  GRID_W,
  GRID_H,
  TICK_MS,
  type GameState,
} from "./gameTypes";
import { createInitialState, movePlayer, moveEnemy, checkEnemyOnTrail, isOnBorder } from "./gameLogic";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function useGameLoop(
  canvasWidth: number,
  canvasHeight: number,
  bgImageUrl: string,
  enemyImageUrl: string,
  playerAvatarUrl: string | null,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const dirRef = useRef<Direction | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const enemyImgRef = useRef<HTMLImageElement | null>(null);
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [revealedPct, setRevealedPct] = useState(0);
  const [lives, setLives] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [enemyScreenPos, setEnemyScreenPos] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "revealing" | "won" | "lost">("loading");
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const loadAll = Promise.all([
      loadImage(bgImageUrl),
      loadImage(enemyImageUrl),
      playerAvatarUrl ? loadImage(playerAvatarUrl).catch(() => null) : Promise.resolve(null),
    ]);
    loadAll.then(([bg, enemy, player]) => {
      if (cancelled) return;
      bgImgRef.current = bg;
      enemyImgRef.current = enemy;
      playerImgRef.current = player;
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setStatus("ready");
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [bgImageUrl, enemyImageUrl, playerAvatarUrl]);

  const start = useCallback(() => {
    stateRef.current = createInitialState();
    dirRef.current = null;
    setRevealedPct(stateRef.current.revealedPct);
    setLives(stateRef.current.lives);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setStatus("playing");
  }, []);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const setDirection = useCallback((dir: Direction | null) => {
    dirRef.current = dir;
  }, []);

  useEffect(() => {
    if (status !== "playing") return;

    tickRef.current = setInterval(() => {
      let s = stateRef.current;
      if (s.status !== "playing") return;

      const dir = dirRef.current;
      if (dir !== null) {
        s = movePlayer(s, dir);
      }
      s = moveEnemy(s);
      s = checkEnemyOnTrail(s);

      stateRef.current = s;
      setRevealedPct(s.revealedPct);
      setLives(s.lives);
      setEnemyScreenPos({
        x: (s.enemy.x / GRID_W) * canvasWidth,
        y: (s.enemy.y / GRID_H) * canvasHeight,
      });
      if (s.status !== "playing") {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
        if (s.status === "won") {
          setStatus("revealing");
          setTimeout(() => setStatus("won"), 2500);
        } else {
          setStatus(s.status);
        }
      }
    }, TICK_MS);

    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "playing" && status !== "revealing" && status !== "won" && status !== "lost") return;

    const cellW = canvasWidth / GRID_W;
    const cellH = canvasHeight / GRID_H;
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

      const s = stateRef.current;

      if (bgImgRef.current) {
        ctx.drawImage(bgImgRef.current, 0, 0, canvasWidth, canvasHeight);
      }

      const showCover = status === "playing" || status === "lost";
      if (showCover) {
        for (let y = 0; y < GRID_H; y++) {
          for (let x = 0; x < GRID_W; x++) {
            const cell = s.grid[y][x];
            const px = x * cellW;
            const py = y * cellH;

            if (cell === CellState.UNCLAIMED) {
              ctx.fillStyle = "#000000";
              ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
            } else if (cell === CellState.TRAIL) {
              ctx.fillStyle = "rgba(244, 63, 94, 0.6)";
              ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
            }
            if ((cell === CellState.CLAIMED || cell === CellState.BORDER) && isOnBorder(s.grid, x, y)) {
              ctx.fillStyle = "rgba(99, 129, 245, 0.25)";
              ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5);
            }
          }
        }
      }

      if (status === "revealing" || status === "won") {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const enemySize = cellW * 5;
      if (enemyImgRef.current) {
        const ex = s.enemy.x * cellW - enemySize / 2 + cellW / 2;
        const ey = s.enemy.y * cellH - enemySize / 2 + cellH / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(ex + enemySize / 2, ey + enemySize / 2, enemySize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(enemyImgRef.current, ex, ey, enemySize, enemySize);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(ex + enemySize / 2, ey + enemySize / 2, enemySize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(244, 63, 94, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const playerSize = cellW * 4;
      const playerX = s.player.x * cellW - playerSize / 2 + cellW / 2;
      const playerY = s.player.y * cellH - playerSize / 2 + cellH / 2;

      ctx.save();
      ctx.shadowColor = "#c5e34a";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(playerX + playerSize / 2, playerY + playerSize / 2, playerSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#c5e34a";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (playerImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(playerX + playerSize / 2, playerY + playerSize / 2, playerSize / 2 - 1, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(playerImgRef.current, playerX, playerY, playerSize, playerSize);
        ctx.restore();
      } else {
        ctx.fillStyle = "#c5e34a";
        ctx.beginPath();
        ctx.arc(playerX + playerSize / 2, playerY + playerSize / 2, playerSize / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasWidth, canvasHeight]);

  return { canvasRef, revealedPct, lives, elapsed, enemyScreenPos, status, start, restart, setDirection };
}
