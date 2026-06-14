import { useRef, useEffect, useCallback, useState } from "react";
import {
  CANVAS_W,
  CANVAS_H,
  BALL_R,
  BRICK_H,
  COMODIN_IMAGES,
  POWERUP_LABELS,
  type ArkanoidState,
} from "./gameTypes";
import { createInitialState, gameTick, nextLevel } from "./gameLogic";

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

export function useArkanoidLoop(canvasWidth: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ArkanoidState>(createInitialState());
  const rafRef = useRef(0);
  const flagCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const triondaImg = useRef<HTMLImageElement | null>(null);
  const comodinImgs = useRef<HTMLImageElement[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const clearedAtRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "lost" | "cleared">("loading");

  const scale = canvasWidth / CANVAS_W;
  const canvasHeight = CANVAS_H * scale;

  useEffect(() => {
    Promise.all([
      loadImage("/images/trionda.png").catch(() => null),
      ...COMODIN_IMAGES.map((s) => loadImage(s).catch(() => null)),
    ]).then((results) => {
      triondaImg.current = results[0] as HTMLImageElement | null;
      comodinImgs.current = results.slice(1).filter(Boolean) as HTMLImageElement[];
      setStatus("ready");
    });
  }, []);

  const ensureFlag = useCallback((code: string) => {
    if (!code || flagCache.current.has(code)) return;
    flagCache.current.set(code, null as unknown as HTMLImageElement);
    loadImage(`https://flagcdn.com/w80/${code}.png`)
      .then((img) => flagCache.current.set(code, img))
      .catch(() => {});
  }, []);

  const start = useCallback(() => {
    const s = createInitialState();
    stateRef.current = s;
    confettiRef.current = [];
    clearedAtRef.current = 0;
    setScore(0);
    setLives(3);
    setLevel(1);
    setStatus("playing");
    s.bricks.forEach((b) => { if (b.flag) ensureFlag(b.flag); });
  }, [ensureFlag]);

  const goNextLevel = useCallback(() => {
    const s = nextLevel(stateRef.current);
    stateRef.current = s;
    confettiRef.current = [];
    clearedAtRef.current = 0;
    setScore(s.score);
    setLives(s.lives);
    setLevel(s.level);
    setStatus("playing");
    s.bricks.forEach((b) => { if (b.flag) ensureFlag(b.flag); });
  }, [ensureFlag]);

  const paddleRef = useRef(0.5);

  const movePaddle = useCallback((normalized: number) => {
    const halfW = (stateRef.current.paddleW || 0.15) / 2;
    paddleRef.current = Math.max(halfW, Math.min(1 - halfW, normalized));
  }, []);

  useEffect(() => {
    if (status !== "playing") return;

    const loop = () => {
      stateRef.current.paddle = paddleRef.current;
      const s = gameTick(stateRef.current);
      stateRef.current = s;
      setScore(s.score);
      setLives(s.lives);

      if (s.status === "cleared") {
        clearedAtRef.current = performance.now();
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        confettiRef.current = Array.from({ length: 50 }, () => ({
          x: cx + (Math.random() - 0.5) * canvasWidth * 0.6,
          y: cy + (Math.random() - 0.5) * canvasHeight * 0.2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 1) * 6 - 2,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 3 + Math.random() * 5,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.3,
        }));
        setStatus("cleared");
        return;
      }
      if (s.status === "respawning") {
        stateRef.current = { ...s, status: "playing" };
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (s.status === "lost") {
        setStatus("lost");
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasWidth, canvasHeight]);

  // Render loop
  useEffect(() => {
    if (status !== "playing" && status !== "lost" && status !== "cleared") return;

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

      const s = stateRef.current;

      // Bricks
      for (const b of s.bricks) {
        const bx = b.x * scale;
        const by = b.y * scale;
        const bw = b.w * scale;
        const bh = b.h * scale;
        const rad = 4;

        if (b.isComodin) {
          // Dark background
          ctx.fillStyle = "#1e1b4b";
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, rad);
          ctx.fill();

          // Face image centered as circle
          const img = comodinImgs.current[b.comodinIndex];
          if (img) {
            const circR = Math.min(bw, bh) * 0.4;
            const cx = bx + bw / 2;
            const cy = by + bh / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, circR, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, cx - circR, cy - circR, circR * 2, circR * 2);
            ctx.restore();
            // Ring around face
            ctx.beginPath();
            ctx.arc(cx, cy, circR, 0, Math.PI * 2);
            ctx.strokeStyle = b.hp === 3 ? "#ef4444" : b.hp === 2 ? "#f59e0b" : "#22c55e";
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }

          // Outer border matching HP color
          ctx.strokeStyle = b.hp === 3 ? "#ef4444" : b.hp === 2 ? "#f59e0b" : "#22c55e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, rad);
          ctx.stroke();

          // HP pips at bottom
          for (let i = 0; i < b.hp; i++) {
            ctx.fillStyle = b.hp === 3 ? "#ef4444" : b.hp === 2 ? "#f59e0b" : "#22c55e";
            ctx.beginPath();
            ctx.arc(bx + bw / 2 + (i - (b.hp - 1) / 2) * 8, by + bh - 5, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Flag as the entire brick
          const flagImg = b.flag ? flagCache.current.get(b.flag) : null;
          if (flagImg) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, rad);
            ctx.clip();
            ctx.drawImage(flagImg, bx, by, bw, bh);
            ctx.restore();
          } else {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, rad);
            ctx.fill();
          }

          // Border — thicker for group heads
          if (b.maxHp === 2) {
            ctx.strokeStyle = b.hp === 2 ? "#f59e0b" : "rgba(255,255,255,0.5)";
            ctx.lineWidth = b.hp === 2 ? 2.5 : 1.5;
          } else {
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 1;
          }
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, rad);
          ctx.stroke();

          // Crack effect for 2-hp bricks at 1 hp
          if (b.maxHp === 2 && b.hp === 1) {
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 1.5;
            // Main crack
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.35, by);
            ctx.lineTo(bx + bw * 0.42, by + bh * 0.25);
            ctx.lineTo(bx + bw * 0.52, by + bh * 0.45);
            ctx.lineTo(bx + bw * 0.46, by + bh * 0.7);
            ctx.lineTo(bx + bw * 0.55, by + bh);
            ctx.stroke();
            // Branch crack
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.52, by + bh * 0.45);
            ctx.lineTo(bx + bw * 0.68, by + bh * 0.55);
            ctx.stroke();
            // Dark shadow for depth
            ctx.strokeStyle = "rgba(0,0,0,0.4)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.36, by);
            ctx.lineTo(bx + bw * 0.43, by + bh * 0.25);
            ctx.lineTo(bx + bw * 0.53, by + bh * 0.45);
            ctx.lineTo(bx + bw * 0.47, by + bh * 0.7);
            ctx.lineTo(bx + bw * 0.56, by + bh);
            ctx.stroke();
          }
        }
      }

      // Power-ups — colored pill with emoji
      for (const pu of s.powerUps) {
        const px = pu.x * scale;
        const py = pu.y * scale;
        const pillW = scale * 0.06;
        const pillH = scale * 0.035;
        const bgColor = pu.type === "boot" ? "#f59e0b" : pu.type === "var" ? "#3b82f6" : "#ef4444";

        ctx.save();
        ctx.shadowColor = bgColor;
        ctx.shadowBlur = 12;

        // Pill background
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(px - pillW / 2, py - pillH / 2, pillW, pillH, pillH / 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(px - pillW / 2, py - pillH / 2, pillW, pillH, pillH / 2);
        ctx.stroke();

        // Emoji
        const emojiSize = Math.round(pillH * 0.8);
        ctx.font = `${emojiSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(POWERUP_LABELS[pu.type], px, py);

        ctx.restore();
      }

      // Speech bubbles
      const now = performance.now();
      for (const bubble of s.bubbles) {
        const elapsed = now - bubble.time;
        const alpha = Math.max(0, 1 - elapsed / 1500);
        const rise = elapsed * 0.00003 * scale;
        const bx = bubble.x * scale;
        const by = bubble.y * scale - rise - 10;

        ctx.save();
        ctx.globalAlpha = alpha;

        const fontSize = Math.max(10, Math.round(scale * 0.022));
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        const metrics = ctx.measureText(bubble.text);
        const tw = metrics.width + 12;
        const th = fontSize + 8;

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath();
        ctx.roundRect(bx - tw / 2, by - th / 2, tw, th, 6);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(bx - 4, by + th / 2);
        ctx.lineTo(bx, by + th / 2 + 6);
        ctx.lineTo(bx + 4, by + th / 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(bubble.text, bx, by);
        ctx.restore();
      }

      // Ball (trionda)
      const ballX = s.ball.x * scale;
      const ballY = s.ball.y * scale;
      const ballSize = BALL_R * scale * 2.5;

      ctx.save();
      ctx.shadowColor = "#c5e34a";
      ctx.shadowBlur = 10;
      if (triondaImg.current) {
        ctx.drawImage(triondaImg.current, ballX - ballSize, ballY - ballSize, ballSize * 2, ballSize * 2);
      } else {
        ctx.fillStyle = "#c5e34a";
        ctx.beginPath();
        ctx.arc(ballX, ballY, BALL_R * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Paddle
      const pw = s.paddleW * scale;
      const ph = 0.025 * scale;
      const px = s.paddle * scale - pw / 2;
      const py = (CANVAS_H - 0.04) * scale;

      const padGrad = ctx.createLinearGradient(px, py, px, py + ph);
      padGrad.addColorStop(0, "#6366f1");
      padGrad.addColorStop(1, "#3b82f6");
      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, ph / 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(px + 2, py + 1, pw - 4, 2);

      // VAR slow indicator
      if (s.slowUntil > now) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(now / 200) * 0.2;
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);
        ctx.restore();
      }

      // Life lost flash
      if (s.respawnTime > 0) {
        const rElapsed = now - s.respawnTime;
        if (rElapsed < 1500) {
          const alpha = Math.max(0, 1 - rElapsed / 1500);

          // Red flash on edges
          ctx.save();
          ctx.globalAlpha = alpha * 0.3;
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          ctx.restore();

          // Message
          const bounce = rElapsed < 200 ? 1.2 - (rElapsed / 200) * 0.2 : 1;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(canvasWidth / 2, canvasHeight / 2);
          ctx.scale(bounce, bounce);

          const fontSize = Math.round(scale * 0.06);
          ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.lineWidth = 4;
          ctx.strokeText("PERDISTE UNA VIDA", 0, 0);
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 20;
          ctx.fillStyle = "#ef4444";
          ctx.fillText("PERDISTE UNA VIDA", 0, 0);

          const subSize = Math.round(scale * 0.035);
          ctx.font = `700 ${subSize}px Outfit, sans-serif`;
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#ffffff";
          ctx.fillText("❤️".repeat(s.lives) + "🖤".repeat(3 - s.lives), 0, fontSize * 1.2);

          ctx.restore();
        }
      }

      // Level cleared celebration
      if (status === "cleared") {
        const cElapsed = now - clearedAtRef.current;
        if (cElapsed < 2000) {
          const alpha = Math.max(0, 1 - cElapsed / 2000);

          for (const p of confettiRef.current) {
            p.x += p.vx;
            p.vy += 0.15;
            p.y += p.vy;
            p.rotation += p.spin;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
          }

          const bounce = cElapsed < 300 ? Math.sin((cElapsed / 300) * Math.PI) * 0.3 : 0;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(canvasWidth / 2, canvasHeight / 2);
          ctx.scale(1 + bounce, 1 + bounce);
          const fontSize = Math.round(scale * 0.08);
          ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 4;
          ctx.strokeText("¡GOOOL!", 0, 0);
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 25;
          ctx.fillStyle = "#f59e0b";
          ctx.fillText("¡GOOOL!", 0, 0);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasWidth, canvasHeight, scale]);

  return {
    canvasRef,
    canvasHeight,
    score,
    lives,
    level,
    status,
    start,
    goNextLevel,
    movePaddle,
  };
}
