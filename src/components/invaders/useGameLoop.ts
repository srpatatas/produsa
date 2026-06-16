import { useRef, useEffect, useCallback, useState } from "react";
import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_W,
  PLAYER_H,
  PLAYER_Y,
  PLAYER_SPEED,
  BULLET_W,
  BULLET_H,
  INVADER_W,
  INVADER_H,
  BOSS_W,
  BOSS_H,
  COMODIN_IMAGES,
  COMODIN_HIT_LINES,
  type InvadersState,
} from "./gameTypes";
import { createInitialState, gameTick, shoot, nextLevel } from "./gameLogic";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

interface SpeechBubble {
  x: number;
  y: number;
  text: string;
  time: number;
}

interface Confetti {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rotation: number; spin: number;
}

const CONFETTI_COLORS = ["#6366f1", "#f59e0b", "#14b8a6", "#22c55e", "#ef4444", "#3b82f6", "#f97316", "#c5e34a"];

export function useInvadersLoop(canvasWidth: number, playerAvatarUrl: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<InvadersState>(createInitialState());
  const rafRef = useRef(0);
  const keysDown = useRef(new Set<string>());
  const flagCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const triondaImg = useRef<HTMLImageElement | null>(null);
  const playerImg = useRef<HTMLImageElement | null>(null);
  const comodinImgs = useRef<HTMLImageElement[]>([]);
  const bubblesRef = useRef<SpeechBubble[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const clearedAtRef = useRef(0);
  const lastBossHitRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "lost" | "cleared" | "won">("loading");

  const scale = canvasWidth / CANVAS_W;
  const canvasHeight = CANVAS_H * scale;

  useEffect(() => {
    Promise.all([
      loadImage("/images/trionda.png").catch(() => null),
      playerAvatarUrl ? loadImage(playerAvatarUrl).catch(() => null) : Promise.resolve(null),
      ...COMODIN_IMAGES.map((s) => loadImage(s).catch(() => null)),
    ]).then((results) => {
      triondaImg.current = results[0] as HTMLImageElement | null;
      playerImg.current = results[1] as HTMLImageElement | null;
      comodinImgs.current = results.slice(2).filter(Boolean) as HTMLImageElement[];
      setStatus("ready");
    });
  }, [playerAvatarUrl]);

  const ensureFlag = useCallback((code: string) => {
    if (!code || flagCache.current.has(code)) return;
    flagCache.current.set(code, null as unknown as HTMLImageElement);
    loadImage(`https://flagcdn.com/w80/${code}.png`)
      .then((img) => flagCache.current.set(code, img))
      .catch(() => {});
  }, []);

  const start = useCallback(() => {
    const s = createInitialState();
    s.levelStartTime = performance.now();
    stateRef.current = s;
    bubblesRef.current = [];
    confettiRef.current = [];
    clearedAtRef.current = 0;
    setScore(0);
    setLives(3);
    setLevel(1);
    setStatus("playing");
    s.invaders.forEach((inv) => ensureFlag(inv.flag));
  }, [ensureFlag]);

  const goNextLevel = useCallback(() => {
    const s = nextLevel(stateRef.current);
    s.levelStartTime = performance.now();
    stateRef.current = s;
    bubblesRef.current = [];
    confettiRef.current = [];
    clearedAtRef.current = 0;
    setScore(s.score);
    setLives(s.lives);
    setLevel(s.level);
    setStatus("playing");
    s.invaders.forEach((inv) => ensureFlag(inv.flag));
  }, [ensureFlag]);

  // Keyboard
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " ", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        keysDown.current.add(e.key);
      }
    };
    const onUp = (e: KeyboardEvent) => keysDown.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Touch controls ref
  const touchXRef = useRef<number | null>(null);
  const touchShootRef = useRef(false);

  // Game loop
  useEffect(() => {
    if (status !== "playing") return;

    const loop = () => {
      const s = stateRef.current;
      const now = performance.now();

      // Player movement
      let px = s.player;
      if (keysDown.current.has("ArrowLeft")) px -= PLAYER_SPEED;
      if (keysDown.current.has("ArrowRight")) px += PLAYER_SPEED;
      if (touchXRef.current !== null) {
        const target = touchXRef.current / scale;
        const diff = target - px;
        px += diff * 0.15;
      }
      px = Math.max(PLAYER_W / 2, Math.min(CANVAS_W - PLAYER_W / 2, px));
      stateRef.current.player = px;

      // Shooting
      if (keysDown.current.has(" ") || keysDown.current.has("ArrowUp") || touchShootRef.current) {
        stateRef.current = shoot(stateRef.current, now);
        touchShootRef.current = false;
      }

      // Boss speech bubbles on hit
      const prevBosses = stateRef.current.bosses;
      const prevBossHit = lastBossHitRef.current;
      const next = gameTick(stateRef.current, now);

      if (next.bossHitTime > prevBossHit) {
        lastBossHitRef.current = next.bossHitTime;

        // Find which boss was hit or killed by comparing prev vs next
        for (const pb of prevBosses) {
          const nb = next.bosses.find((b) => b.comodinIndex === pb.comodinIndex);
          if (nb && nb.hp < pb.hp) {
            const hitsTaken = nb.maxHp - nb.hp;
            const lines = COMODIN_HIT_LINES[nb.comodinIndex];
            const lineIdx = Math.min(hitsTaken - 1, lines.length - 1);
            if (lines && lineIdx >= 0) {
              bubblesRef.current.push({ x: nb.x + BOSS_W / 2, y: nb.y, text: lines[lineIdx], time: now });
            }
          } else if (!nb) {
            const lines = COMODIN_HIT_LINES[pb.comodinIndex];
            bubblesRef.current.push({ x: pb.x + BOSS_W / 2, y: pb.y, text: lines[lines.length - 1], time: now });
          }
        }
      }

      stateRef.current = next;
      setScore(next.score);
      setLives(next.lives);

      if (next.status === "cleared" || next.status === "won") {
        clearedAtRef.current = now;
        confettiRef.current = Array.from({ length: 40 }, () => ({
          x: canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 0.6,
          y: canvasHeight / 2 + (Math.random() - 0.5) * canvasHeight * 0.2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 1) * 6 - 2,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 3 + Math.random() * 5,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.3,
        }));
        setStatus(next.status as "cleared" | "won");
        return;
      }
      if (next.status === "lost") {
        setStatus("lost");
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, scale, canvasWidth, canvasHeight]);

  // Render
  useEffect(() => {
    if (status !== "playing" && status !== "lost" && status !== "cleared" && status !== "won") return;

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

      // Stars background
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137) % 100) / 100 * canvasWidth;
        const sy = ((i * 211) % 100) / 100 * canvasHeight;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      const s = stateRef.current;
      const now = performance.now();

      // Invaders (flags)
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        const ix = inv.x * scale;
        const iy = inv.y * scale;
        const iw = INVADER_W * scale;
        const ih = INVADER_H * scale;

        const flagImg = flagCache.current.get(inv.flag);
        if (flagImg) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(ix, iy, iw, ih, 3);
          ctx.clip();
          ctx.drawImage(flagImg, ix, iy, iw, ih);
          ctx.restore();
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(ix, iy, iw, ih, 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#6366f1";
          ctx.fillRect(ix, iy, iw, ih);
        }
        ensureFlag(inv.flag);
      }

      // Bosses (comodíns)
      for (const boss of s.bosses) {
        const bx = boss.x * scale;
        const by = boss.y * scale;
        const bw = BOSS_W * scale;
        const bh = BOSS_H * scale;

        ctx.save();
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#1e1b4b";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.restore();

        const img = comodinImgs.current[boss.comodinIndex];
        if (img) {
          const cr = Math.min(bw, bh) * 0.4;
          const cx = bx + bw / 2;
          const cy = by + bh / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, cr, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - cr, cy - cr, cr * 2, cr * 2);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(cx, cy, cr, 0, Math.PI * 2);
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // HP bar
        const barW = bw * 0.8;
        const barH = 3;
        const barX = bx + (bw - barW) / 2;
        const barY = by + bh + 3;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(barX, barY, barW * (boss.hp / boss.maxHp), barH);
      }

      // Bullets
      for (const b of s.bullets) {
        const bx = b.x * scale;
        const by = b.y * scale;

        if (b.fromPlayer) {
          const triSize = scale * 0.02;
          ctx.save();
          ctx.shadowColor = "#c5e34a";
          ctx.shadowBlur = 8;
          if (triondaImg.current) {
            ctx.drawImage(triondaImg.current, bx - triSize, by - triSize, triSize * 2, triSize * 2);
          } else {
            ctx.fillStyle = "#c5e34a";
            ctx.beginPath();
            ctx.arc(bx, by, triSize, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else {
          ctx.save();
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 6;
          ctx.fillStyle = "#ef4444";
          const bw = BULLET_W * scale;
          const bh = BULLET_H * scale;
          ctx.fillRect(bx - bw / 2, by, bw, bh);
          ctx.restore();
        }
      }

      // Player (avatar ship)
      const px = s.player * scale;
      const py = PLAYER_Y * scale;
      const pw = PLAYER_W * scale;
      const ph = PLAYER_H * scale;
      const shipSize = Math.max(pw, ph) * 1.5;

      ctx.save();
      ctx.shadowColor = "#6366f1";
      ctx.shadowBlur = 12;
      if (playerImg.current) {
        ctx.beginPath();
        ctx.arc(px, py + shipSize * 0.4, shipSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(playerImg.current, px - shipSize / 2, py - shipSize * 0.1, shipSize, shipSize);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(px, py + shipSize * 0.4, shipSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#6366f1";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - pw / 2, py + ph);
        ctx.lineTo(px + pw / 2, py + ph);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Level title announcement
      if (s.levelStartTime > 0) {
        const titleElapsed = now - s.levelStartTime;
        if (titleElapsed < 2500) {
          const titleAlpha = titleElapsed < 500
            ? titleElapsed / 500
            : titleElapsed > 2000
              ? 1 - (titleElapsed - 2000) / 500
              : 1;

          const titleScale = titleElapsed < 300
            ? 0.5 + (titleElapsed / 300) * 0.5
            : 1 + Math.sin(titleElapsed / 150) * 0.03;

          const levelLabel = s.level >= 3 ? "FINAL BOSS!" : `NIVEL ${s.level}`;
          const subLabel = s.level === 1 ? "FIFA INVADERS" : s.level === 2 ? "WC 26" : "🏆 × 3";

          ctx.save();
          ctx.globalAlpha = titleAlpha;
          ctx.translate(canvasWidth / 2, canvasHeight * 0.4);
          ctx.scale(titleScale, titleScale);

          // Main title
          const mainSize = Math.round(scale * (s.level >= 3 ? 0.09 : 0.07));
          ctx.font = `900 ${mainSize}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.strokeStyle = "rgba(0,0,0,0.7)";
          ctx.lineWidth = 5;
          ctx.strokeText(levelLabel, 0, 0);

          if (s.level >= 3) {
            ctx.shadowColor = "#ef4444";
            ctx.fillStyle = "#ef4444";
          } else {
            ctx.shadowColor = "#6366f1";
            ctx.fillStyle = "#ffffff";
          }
          ctx.shadowBlur = 20;
          ctx.fillText(levelLabel, 0, 0);

          // Sub label
          const subSize = Math.round(scale * 0.035);
          ctx.font = `700 ${subSize}px Outfit, sans-serif`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#f59e0b";
          ctx.fillStyle = "#f59e0b";
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 3;
          ctx.strokeText(subLabel, 0, mainSize * 0.8);
          ctx.fillText(subLabel, 0, mainSize * 0.8);

          ctx.restore();
        }
      }

      // Speech bubbles
      const activeBubbles = bubblesRef.current.filter((b) => now - b.time < 2000);
      bubblesRef.current = activeBubbles;
      for (const bubble of activeBubbles) {
        const elapsed = now - bubble.time;
        const alpha = Math.max(0, 1 - elapsed / 2000);
        const drift = elapsed * 0.00002 * scale;
        const bx2 = bubble.x * scale;
        const by2 = bubble.y * scale + BOSS_H * scale + 15 + drift;

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
        ctx.roundRect(bx2 - tw / 2, by2 - th / 2, tw, th, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx2 - 4, by2 - th / 2);
        ctx.lineTo(bx2, by2 - th / 2 - 6);
        ctx.lineTo(bx2 + 4, by2 - th / 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(bubble.text, bx2, by2);
        ctx.restore();
      }

      // Cleared celebration
      if (status === "cleared" || status === "won") {
        const cElapsed = now - clearedAtRef.current;
        if (cElapsed < 2000) {
          const alpha = Math.max(0, 1 - cElapsed / 2000);
          for (const p of confettiRef.current) {
            p.x += p.vx; p.vy += 0.15; p.y += p.vy; p.rotation += p.spin;
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
          const fontSize = Math.round(scale * 0.07);
          ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 4;
          const celebText = status === "won" ? "¡CAMPEÓN!" : "¡INVASIÓN ELIMINADA!";
          ctx.strokeText(celebText, 0, 0);
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 25;
          ctx.fillStyle = "#f59e0b";
          ctx.fillText(celebText, 0, 0);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasWidth, canvasHeight, scale, ensureFlag]);

  return {
    canvasRef,
    canvasHeight,
    score,
    lives,
    level,
    status,
    start,
    goNextLevel,
    touchXRef,
    touchShootRef,
  };
}
