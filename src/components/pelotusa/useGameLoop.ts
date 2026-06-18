import { useRef, useEffect, useCallback, useState } from "react";
import {
  CANVAS_W,
  CANVAS_H,
  BALL_X,
  BALL_RADIUS,
  PIPE_W,
  COMODIN_RADIUS,
  COMODIN_IMAGES,
  COMODIN_HIT_PHRASES,
  COMODIN_DODGE_PHRASES,
  FLAG_SIZE,
  FLAG_CODES,
  type PelotusaState,
  type ScorePopup,
} from "./gameTypes";
import { createInitialState, startGame, flap, gameTick } from "./gameLogic";

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

interface TrailDot {
  x: number;
  y: number;
  age: number;
}

// Goal color tiers based on score
const GOAL_TIERS = [
  { min: 0,  post: ["#cbd5e1","#f1f5f9","#cbd5e1"], bar: ["#e2e8f0","#f8fafc","#cbd5e1"], pipe: ["#64748b","#94a3b8","#64748b"], net: "rgba(255,255,255,0.12)", glow: "" },
  { min: 10, post: ["#7dd3fc","#bae6fd","#7dd3fc"], bar: ["#bae6fd","#e0f2fe","#7dd3fc"], pipe: ["#0369a1","#0ea5e9","#0369a1"], net: "rgba(56,189,248,0.15)",  glow: "#0ea5e9" },
  { min: 20, post: ["#fbbf24","#fde68a","#fbbf24"], bar: ["#fde68a","#fef9c3","#fbbf24"], pipe: ["#92400e","#d97706","#92400e"], net: "rgba(251,191,36,0.15)",  glow: "#f59e0b" },
  { min: 30, post: ["#f87171","#fecaca","#f87171"], bar: ["#fecaca","#fee2e2","#f87171"], pipe: ["#991b1b","#dc2626","#991b1b"], net: "rgba(248,113,113,0.15)", glow: "#ef4444" },
];

function getTier(score: number) {
  for (let i = GOAL_TIERS.length - 1; i >= 0; i--) {
    if (score >= GOAL_TIERS[i].min) return GOAL_TIERS[i];
  }
  return GOAL_TIERS[0];
}

const TRAIL_MAX = 8;

export function usePelotusaLoop(canvasWidth: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PelotusaState>(createInitialState());
  const rafRef = useRef(0);
  const triondaImg = useRef<HTMLImageElement | null>(null);
  const comodinImgs = useRef<HTMLImageElement[]>([]);
  const flagCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const popupsRef = useRef<ScorePopup[]>([]);
  const bubblesRef = useRef<SpeechBubble[]>([]);
  const deathTimeRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const scoreRef = useRef(0);
  const goalsRef = useRef(0);
  const trailRef = useRef<TrailDot[]>([]);
  const frameRef = useRef(0);

  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"loading" | "idle" | "playing" | "lost">("loading");

  const scale = canvasWidth / CANVAS_W;
  const canvasHeight = CANVAS_H * scale;

  useEffect(() => {
    Promise.all([
      loadImage("/images/trionda.png").catch(() => null),
      ...COMODIN_IMAGES.map((s) => loadImage(s).catch(() => null)),
    ]).then((results) => {
      triondaImg.current = results[0] as HTMLImageElement | null;
      comodinImgs.current = results.slice(1).filter(Boolean) as HTMLImageElement[];
      setStatus("idle");
    });
  }, []);

  const start = useCallback(() => {
    const s = startGame();
    stateRef.current = s;
    popupsRef.current = [];
    bubblesRef.current = [];
    trailRef.current = [];
    deathTimeRef.current = 0;
    scoreRef.current = 0;
    goalsRef.current = 0;
    groundOffsetRef.current = 0;
    frameRef.current = 0;
    setScore(0);
    setStatus("playing");
  }, []);

  const doFlap = useCallback(() => {
    if (stateRef.current.status === "playing") {
      stateRef.current = flap(stateRef.current);
    }
  }, []);

  useEffect(() => {
    if (status !== "playing" && status !== "lost") return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const loop = () => {
      const now = performance.now();
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const targetW = canvasWidth * dpr;
      const targetH = canvasHeight * dpr;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = canvasWidth + "px";
        canvas.style.height = canvasHeight + "px";
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // --- UPDATE ---
      if (status === "playing") {
        const result = gameTick(stateRef.current);
        stateRef.current = result.state;

        // Score tracked here from events — single source of truth
        if (result.scored) { scoreRef.current += 1; goalsRef.current += 1; }
        if (result.flagCollected) scoreRef.current += 2;
        if (result.comodinHit) scoreRef.current = Math.max(0, scoreRef.current - 3);
        // Sync back to game state for difficulty ramp
        stateRef.current.score = scoreRef.current;
        setScore(scoreRef.current);

        // Scroll ground
        groundOffsetRef.current = (groundOffsetRef.current + result.state.speed * scale) % 20;

        // Ball trail — dots drift left to simulate forward flight
        frameRef.current++;
        const driftSpeed = result.state.speed * scale * 3;
        if (frameRef.current % 2 === 0) {
          trailRef.current.push({ x: BALL_X * scale, y: result.state.ballY * scale, age: 0 });
          if (trailRef.current.length > TRAIL_MAX) trailRef.current.shift();
        }
        trailRef.current = trailRef.current.map((d) => ({ ...d, x: d.x - driftSpeed, age: d.age + 1 }));

        if (result.scored) {
          if (goalsRef.current === 10) {
            popupsRef.current.push({
              x: 0.5, y: 0.4,
              text: "D10S", time: now, color: "#f59e0b",
            });
          } else {
            popupsRef.current.push({
              x: result.scoredPipeX, y: result.scoredPipeGapY,
              text: "¡GOL!", time: now, color: "#22c55e",
            });
          }
        }
        if (result.comodinHit) {
          popupsRef.current.push({
            x: result.comodinX, y: result.comodinY,
            text: "-3", time: now, color: "#ef4444",
          });
          const phrases = COMODIN_HIT_PHRASES[result.comodinIdx];
          if (phrases) {
            bubblesRef.current.push({
              x: result.comodinX, y: result.comodinY - 0.06,
              text: phrases[Math.floor(Math.random() * phrases.length)],
              time: now,
            });
          }
        }
        if (result.comodinDodged) {
          const phrases = COMODIN_DODGE_PHRASES[result.dodgeIdx];
          if (phrases) {
            bubblesRef.current.push({
              x: result.dodgeX, y: result.dodgeY - 0.06,
              text: phrases[Math.floor(Math.random() * phrases.length)],
              time: now,
            });
          }
        }
        if (result.flagCollected) {
          popupsRef.current.push({
            x: result.flagX, y: result.flagY,
            text: "+2", time: now, color: "#22c55e",
          });
        }

        if (result.state.status === "lost") {
          deathTimeRef.current = now;
          setStatus("lost");
        }
      }

      // --- RENDER ---
      const s = stateRef.current;
      const tier = getTier(s.goals);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      skyGrad.addColorStop(0, "#0f172a");
      skyGrad.addColorStop(0.6, "#1e293b");
      skyGrad.addColorStop(1, "#0f4c2d");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Stars/dots
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 137 + 51) % 100) / 100 * canvasWidth;
        const sy = ((i * 211 + 73) % 80) / 100 * canvasHeight;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // --- GOALS ---
      for (const p of s.pipes) {
        const px = p.x * scale;
        const pw = PIPE_W * scale;
        const gapTop = (p.gapY - p.gapSize / 2) * scale;
        const gapBot = (p.gapY + p.gapSize / 2) * scale;
        const gapH = gapBot - gapTop;
        const postW = Math.max(4, pw * 0.12);

        // Pipe gradient (top/bottom walls)
        const pipeGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
        pipeGrad.addColorStop(0, tier.pipe[0]);
        pipeGrad.addColorStop(0.5, tier.pipe[1]);
        pipeGrad.addColorStop(1, tier.pipe[2]);

        ctx.fillStyle = pipeGrad;
        ctx.fillRect(px, 0, pw, gapTop);
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(px, gapBot, pw, canvasHeight - gapBot);

        // Net in the gap (depth)
        const netDepthGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
        netDepthGrad.addColorStop(0, "rgba(255,255,255,0.03)");
        netDepthGrad.addColorStop(0.5, "rgba(255,255,255,0.07)");
        netDepthGrad.addColorStop(1, "rgba(255,255,255,0.03)");
        ctx.fillStyle = netDepthGrad;
        ctx.fillRect(px + postW, gapTop, pw - postW * 2, gapH);

        // Net grid
        ctx.strokeStyle = tier.net;
        ctx.lineWidth = 0.7;
        const netSp = Math.max(8, gapH / 8);
        for (let ny = gapTop + netSp; ny < gapBot; ny += netSp) {
          ctx.beginPath(); ctx.moveTo(px + postW, ny); ctx.lineTo(px + pw - postW, ny); ctx.stroke();
        }
        for (let nx = px + postW + netSp; nx < px + pw - postW; nx += netSp) {
          ctx.beginPath(); ctx.moveTo(nx, gapTop); ctx.lineTo(nx, gapBot); ctx.stroke();
        }

        // Goal frame — posts
        const frameGrad = ctx.createLinearGradient(px, 0, px + postW, 0);
        frameGrad.addColorStop(0, tier.post[0]);
        frameGrad.addColorStop(0.5, tier.post[1]);
        frameGrad.addColorStop(1, tier.post[2]);
        ctx.fillStyle = frameGrad;
        ctx.fillRect(px, gapTop, postW, gapH);

        const frameGrad2 = ctx.createLinearGradient(px + pw - postW, 0, px + pw, 0);
        frameGrad2.addColorStop(0, tier.post[0]);
        frameGrad2.addColorStop(0.5, tier.post[1]);
        frameGrad2.addColorStop(1, tier.post[2]);
        ctx.fillStyle = frameGrad2;
        ctx.fillRect(px + pw - postW, gapTop, postW, gapH);

        // Crossbar top
        const barH = Math.max(5, postW * 1.2);
        const barGrad = ctx.createLinearGradient(0, gapTop - barH / 2, 0, gapTop + barH / 2);
        barGrad.addColorStop(0, tier.bar[0]);
        barGrad.addColorStop(0.5, tier.bar[1]);
        barGrad.addColorStop(1, tier.bar[2]);
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(px - 2, gapTop - barH / 2, pw + 4, barH, 2);
        ctx.fill();

        // Bottom bar
        const botBarH = Math.max(3, postW * 0.7);
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(px - 2, gapBot - botBarH / 2, pw + 4, botBarH, 2);
        ctx.fill();

        // Shine highlights
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + postW * 0.3, gapTop + barH);
        ctx.lineTo(px + postW * 0.3, gapBot - botBarH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + pw - postW * 0.3, gapTop + barH);
        ctx.lineTo(px + pw - postW * 0.3, gapBot - botBarH);
        ctx.stroke();

        // Tier glow on goal frame
        if (tier.glow) {
          ctx.save();
          ctx.shadowColor = tier.glow;
          ctx.shadowBlur = 10;
          ctx.strokeStyle = tier.glow;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, gapTop); ctx.lineTo(px, gapBot);
          ctx.moveTo(px + pw, gapTop); ctx.lineTo(px + pw, gapBot);
          ctx.moveTo(px, gapTop); ctx.lineTo(px + pw, gapTop);
          ctx.stroke();
          ctx.restore();
        }

        // Comodin obstacle in the gap (red = danger)
        if (p.comodin !== null && !p.comodinHit) {
          const cx = (p.x + PIPE_W / 2) * scale;
          const cy = (p.gapY + p.comodinOffY) * scale;
          const cr = COMODIN_RADIUS * scale;

          ctx.save();
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 15;

          const cImg = comodinImgs.current[p.comodin];
          if (cImg) {
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(cImg, cx - cr, cy - cr, cr * 2, cr * 2);
            ctx.restore();
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // --- FLOATING FLAGS (collectibles) ---
      for (const f of s.flags) {
        if (f.collected) continue;
        const fx = f.x * scale;
        const fy = f.y * scale;
        const fs = FLAG_SIZE * scale;

        // Load flag image lazily
        if (!flagCache.current.has(f.code)) {
          flagCache.current.set(f.code, null as unknown as HTMLImageElement);
          loadImage(`https://flagcdn.com/w80/${f.code}.png`)
            .then((img) => flagCache.current.set(f.code, img))
            .catch(() => {});
        }

        // Green glow
        ctx.save();
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 10;

        const flagImg = flagCache.current.get(f.code);
        if (flagImg) {
          const fw = fs * 2.2;
          const fh = fs * 1.5;
          ctx.beginPath();
          ctx.roundRect(fx - fw / 2, fy - fh / 2, fw, fh, 3);
          ctx.clip();
          ctx.drawImage(flagImg, fx - fw / 2, fy - fh / 2, fw, fh);
          ctx.restore();
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(fx - fw / 2, fy - fh / 2, fw, fh, 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.arc(fx, fy, fs, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // --- SCROLLING GROUND ---
      const grassH = 0.05 * scale;
      const grassY = canvasHeight - grassH;
      const off = groundOffsetRef.current;
      // Dark grass base
      ctx.fillStyle = "#1a5c32";
      ctx.fillRect(0, grassY, canvasWidth, grassH);
      // Scrolling stripes
      ctx.fillStyle = "#22723e";
      const stripeW = 20;
      for (let gx = -stripeW - off; gx < canvasWidth + stripeW; gx += stripeW * 2) {
        ctx.fillRect(gx, grassY, stripeW, grassH);
      }
      // White pitch line
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(0, grassY, canvasWidth, 1.5);
      // Scrolling pitch dashes
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let dx = -off * 3; dx < canvasWidth + 10; dx += 30) {
        ctx.fillRect(dx, grassY + grassH / 2 - 0.5, 12, 1);
      }

      // --- BALL TRAIL ---
      for (let i = 0; i < trailRef.current.length; i++) {
        const dot = trailRef.current[i];
        const progress = i / trailRef.current.length;
        const r = BALL_RADIUS * scale * 0.6 * progress;
        ctx.save();
        ctx.globalAlpha = 0.15 * progress;
        ctx.fillStyle = "#c5e34a";
        ctx.shadowColor = "#c5e34a";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- BALL (trionda) ---
      const bx = BALL_X * scale;
      const by = s.ballY * scale;
      const br = BALL_RADIUS * scale;

      ctx.save();
      ctx.translate(bx, by);
      const rotation = Math.max(-0.5, Math.min(0.5, s.ballVel * 40));
      ctx.rotate(rotation);

      ctx.shadowColor = "#c5e34a";
      ctx.shadowBlur = 12;

      if (triondaImg.current) {
        ctx.drawImage(triondaImg.current, -br * 1.3, -br * 1.3, br * 2.6, br * 2.6);
      } else {
        ctx.fillStyle = "#c5e34a";
        ctx.beginPath();
        ctx.arc(0, 0, br, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- SCORE POPUPS ---
      popupsRef.current = popupsRef.current.filter((p) => now - p.time < 800);
      for (const popup of popupsRef.current) {
        const elapsed = now - popup.time;
        const alpha = 1 - elapsed / 800;
        const drift = elapsed * 0.00005 * scale;
        ctx.save();
        ctx.globalAlpha = alpha;
        const fontSize = Math.round(scale * 0.04);
        ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = popup.color;
        ctx.shadowColor = popup.color;
        ctx.shadowBlur = 8;
        ctx.fillText(popup.text, popup.x * scale, popup.y * scale - drift);
        ctx.restore();
      }

      // --- SPEECH BUBBLES ---
      bubblesRef.current = bubblesRef.current.filter((b) => now - b.time < 2000);
      for (const bubble of bubblesRef.current) {
        const elapsed = now - bubble.time;
        const alpha = Math.max(0, 1 - elapsed / 2000);
        const drift = elapsed * 0.00003 * scale;
        const bx2 = bubble.x * scale;
        const by2 = bubble.y * scale - drift;

        ctx.save();
        ctx.globalAlpha = alpha;
        const fontSize = Math.max(9, Math.round(scale * 0.02));
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        const metrics = ctx.measureText(bubble.text);
        const tw = metrics.width + 10;
        const th = fontSize + 6;

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath();
        ctx.roundRect(bx2 - tw / 2, by2 - th / 2, tw, th, 5);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(bubble.text, bx2, by2);
        ctx.restore();
      }

      // --- BIG GOAL COUNT overlay ---
      if (s.status === "playing") {
        ctx.save();
        ctx.globalAlpha = 0.15;
        const bigSize = Math.round(scale * 0.18);
        ctx.font = `900 ${bigSize}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(goalsRef.current), canvasWidth / 2, canvasHeight * 0.15);
        ctx.restore();
      }

      // --- DEATH flash ---
      if (status === "lost" && deathTimeRef.current > 0) {
        const deathElapsed = now - deathTimeRef.current;
        if (deathElapsed < 300) {
          ctx.save();
          ctx.globalAlpha = 0.4 * (1 - deathElapsed / 300);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasWidth, canvasHeight, scale]);

  return {
    canvasRef,
    canvasHeight,
    score,
    status,
    start,
    doFlap,
  };
}
