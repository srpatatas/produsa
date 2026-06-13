import { useRef, useEffect, useCallback, useState } from "react";
import {
  Direction,
  COLS,
  ROWS,
  TICK_MS,
  ENEMY_IMAGES,
  type SnakeState,
} from "./gameTypes";
import { createInitialState, gameTick, setDirection as setDir, randomFlagCode } from "./gameLogic";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function useSnakeLoop(canvasSize: number, playerAvatarUrl: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SnakeState>(createInitialState());
  const prevStateRef = useRef<SnakeState>(createInitialState());
  const lastTickTime = useRef(0);
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const ballImgRef = useRef<HTMLImageElement | null>(null);
  const obstacleImgsRef = useRef<HTMLImageElement[]>([]);
  const flagImgRef = useRef<HTMLImageElement | null>(null);
  const currentFlagCode = useRef(randomFlagCode());
  const rafRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "lost">("loading");
  const initialLoadDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const flagSrc = "https://flagcdn.com/w80/" + currentFlagCode.current + ".png";
    Promise.all([
      playerAvatarUrl ? loadImage(playerAvatarUrl).catch(() => null) : Promise.resolve(null),
      loadImage("/images/trionda.png").catch(() => null),
      ...ENEMY_IMAGES.map((s) => loadImage(s).catch(() => null)),
      loadImage(flagSrc).catch(() => null),
    ]).then((results) => {
      if (cancelled) return;
      playerImgRef.current = results[0] as HTMLImageElement | null;
      ballImgRef.current = results[1] as HTMLImageElement | null;
      obstacleImgsRef.current = results.slice(2, 2 + ENEMY_IMAGES.length).filter(Boolean) as HTMLImageElement[];
      flagImgRef.current = results[results.length - 1] as HTMLImageElement | null;
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setStatus("ready");
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [playerAvatarUrl]);

  const loadFlag = useCallback(() => {
    currentFlagCode.current = randomFlagCode();
    const src = "https://flagcdn.com/w80/" + currentFlagCode.current + ".png";
    loadImage(src).then((img) => { flagImgRef.current = img; }).catch(() => {});
  }, []);

  const start = useCallback(() => {
    stateRef.current = createInitialState();
    prevStateRef.current = stateRef.current;
    lastTickTime.current = performance.now();
    setScore(0);
    loadFlag();
    setStatus("playing");
  }, [loadFlag]);

  const setDirection = useCallback((dir: Direction) => {
    stateRef.current = setDir(stateRef.current, dir);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;

    function getSpeed(len: number) {
      return Math.max(80, TICK_MS - Math.floor((len - 3) * 5));
    }

    function tick() {
      prevStateRef.current = stateRef.current;
      lastTickTime.current = performance.now();
      const prev = stateRef.current;
      const s = gameTick(stateRef.current);
      stateRef.current = s;
      setScore(s.score);
      if (s.score > prev.score && s.foodType === "flag") loadFlag();
      if (s.status !== "playing") {
        setStatus(s.status);
        return;
      }
      tickRef.current = setTimeout(tick, getSpeed(s.length));
    }

    tickRef.current = setTimeout(tick, getSpeed(stateRef.current.length));

    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [status, loadFlag]);

  const cellSize = canvasSize / COLS;

  useEffect(() => {
    if (status !== "playing" && status !== "lost") return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    function lerp(a: number, b: number, t: number) {
      const diff = b - a;
      if (Math.abs(diff) > COLS / 2) return b;
      return a + diff * t;
    }

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const t = Math.min(1, (performance.now() - lastTickTime.current) / TICK_MS);

      canvas.width = canvasSize * dpr;
      canvas.height = canvasSize * dpr;
      canvas.style.width = canvasSize + "px";
      canvas.style.height = canvasSize + "px";
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvasSize);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvasSize, y * cellSize);
        ctx.stroke();
      }

      const s = stateRef.current;
      const prev = prevStateRef.current;

      // Obstacles (comodín faces)
      for (let i = 0; i < s.obstacles.length; i++) {
        const obs = s.obstacles[i];
        const img = obstacleImgsRef.current[i % obstacleImgsRef.current.length];
        const ox = obs.x * cellSize;
        const oy = obs.y * cellSize;
        const oSize = cellSize * 0.9;
        const oOff = (cellSize - oSize) / 2;
        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ox + cellSize / 2, oy + cellSize / 2, oSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, ox + oOff, oy + oOff, oSize, oSize);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(ox + cellSize / 2, oy + cellSize / 2, oSize / 2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(244, 63, 94, 0.8)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Food
      const fx = s.food.x * cellSize;
      const fy = s.food.y * cellSize;
      const fSize = cellSize * 0.75;
      const fOff = (cellSize - fSize) / 2;
      if (s.foodType === "trionda" && ballImgRef.current) {
        ctx.drawImage(ballImgRef.current, fx + fOff, fy + fOff, fSize, fSize);
      } else if (flagImgRef.current) {
        const flagW = fSize;
        const flagH = fSize * 0.67;
        const flagX = fx + (cellSize - flagW) / 2;
        const flagY = fy + (cellSize - flagH) / 2;
        const r = 2;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.beginPath();
        ctx.roundRect(flagX, flagY, flagW, flagH, r);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(flagImgRef.current, flagX, flagY, flagW, flagH);
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(flagX, flagY, flagW, flagH, r);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#4ade80";
        ctx.beginPath();
        ctx.arc(fx + cellSize / 2, fy + cellSize / 2, cellSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Snake body
      for (let i = s.snake.length - 1; i >= 1; i--) {
        const seg = s.snake[i];
        const prevSeg = prev.snake[i] || seg;
        const sx = lerp(prevSeg.x, seg.x, t) * cellSize;
        const sy = lerp(prevSeg.y, seg.y, t) * cellSize;
        const bodySize = cellSize * 0.7;
        const bOff = (cellSize - bodySize) / 2;

        const hue = (i * 15) % 360;
        ctx.fillStyle = "hsl(" + hue + ", 70%, 50%)";
        ctx.beginPath();
        ctx.arc(sx + cellSize / 2, sy + cellSize / 2, bodySize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Snake head (player avatar)
      const head = s.snake[0];
      const prevHead = prev.snake[0] || head;
      const hx = lerp(prevHead.x, head.x, t) * cellSize;
      const hy = lerp(prevHead.y, head.y, t) * cellSize;
      const headSize = cellSize * 0.85;
      const hOff = (cellSize - headSize) / 2;

      ctx.save();
      ctx.shadowColor = "#c5e34a";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(hx + cellSize / 2, hy + cellSize / 2, headSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#c5e34a";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (playerImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(hx + cellSize / 2, hy + cellSize / 2, headSize / 2 - 1, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(playerImgRef.current, hx + hOff, hy + hOff, headSize, headSize);
        ctx.restore();
      } else {
        ctx.fillStyle = "#c5e34a";
        ctx.beginPath();
        ctx.arc(hx + cellSize / 2, hy + cellSize / 2, headSize / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasSize, cellSize]);

  return { canvasRef, score, status, start, setDirection };
}
