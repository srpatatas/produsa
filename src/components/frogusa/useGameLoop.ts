import { useRef, useEffect, useCallback, useState } from "react";
import {
  CANVAS_W,
  CANVAS_H,
  COLS,
  ROWS,
  CELL_W,
  CELL_H,
  GOAL_ROW,
  SAFE_ROWS,
  COMODIN_IMAGES,
  COMODIN_HIT_PHRASES,
  COMODIN_DODGE_PHRASES,
  FLAG_CODES,
  type FrogusaState,
  type ScorePopup,
} from "./gameTypes";
import { createInitialState, startGame, movePlayer, gameTick, type Direction } from "./gameLogic";

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

export function useFrogusaLoop(canvasWidth: number, playerAvatarUrl: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FrogusaState>(createInitialState());
  const rafRef = useRef(0);
  const triondaImg = useRef<HTMLImageElement | null>(null);
  const playerImg = useRef<HTMLImageElement | null>(null);
  const comodinImgs = useRef<HTMLImageElement[]>([]);
  const flagCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const popupsRef = useRef<ScorePopup[]>([]);
  const bubblesRef = useRef<SpeechBubble[]>([]);
  const scoreRef = useRef(0);
  const goalsRef = useRef(0);
  const prevRowRef = useRef(-1);
  const hitMessageRef = useRef("¡FOUL!");

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [goals, setGoals] = useState(0);
  const [status, setStatus] = useState<"loading" | "idle" | "playing" | "hit" | "scored" | "lost">("loading");

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
      setStatus("idle");
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
    stateRef.current = startGame();
    popupsRef.current = [];
    bubblesRef.current = [];
    scoreRef.current = 0;
    goalsRef.current = 0;
    setScore(0);
    setLives(3);
    setGoals(0);
    setStatus("playing");
  }, []);

  const move = useCallback((dir: Direction) => {
    const s = stateRef.current;
    if (s.status === "playing") {
      stateRef.current = movePlayer(s, dir);
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); move(dir); }
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, [move]);

  // Touch swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const minSwipe = 15;
    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) {
      // Tap = move up
      move("up");
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? "right" : "left");
    } else {
      move(dy > 0 ? "down" : "up");
    }
  }, [move]);

  // Game loop
  useEffect(() => {
    if (status !== "playing" && status !== "hit" && status !== "scored" && status !== "lost") return;

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

        // Detect comodin dodge: left a lane that had a comodin
        const curRow = result.state.playerRow;
        if (prevRowRef.current !== curRow && prevRowRef.current >= 0) {
          const prevLane = result.state.lanes.find((l) => l.row === prevRowRef.current);
          if (prevLane) {
            const dodgedComodin = prevLane.defenders.find((d) => d.isComodin);
            if (dodgedComodin) {
              const phrases = COMODIN_DODGE_PHRASES[dodgedComodin.comodinIdx];
              if (phrases) {
                bubblesRef.current.push({
                  x: dodgedComodin.x + dodgedComodin.width / 2,
                  y: prevRowRef.current * CELL_H,
                  text: phrases[Math.floor(Math.random() * phrases.length)],
                  time: now,
                });
              }
            }
          }
        }
        prevRowRef.current = curRow;

        if (result.scored) {
          goalsRef.current++;
          scoreRef.current += 5;
          popupsRef.current.push({
            x: (result.state.playerCol + 0.5) * CELL_W,
            y: GOAL_ROW * CELL_H + CELL_H / 2,
            text: "+5", time: now, color: "#22c55e",
          });
        }
        if (result.flagCollected) {
          scoreRef.current += 1;
          popupsRef.current.push({
            x: (result.state.playerCol + 0.5) * CELL_W,
            y: (result.state.playerRow + 0.5) * CELL_H,
            text: "+1", time: now, color: "#22c55e",
          });
        }
        if (result.hit) scoreRef.current = Math.max(0, scoreRef.current);
        stateRef.current.score = scoreRef.current;
        stateRef.current.goals = goalsRef.current;
        setScore(scoreRef.current);
        setGoals(goalsRef.current);
        setLives(result.state.lives);

        if (result.hit) {
          if (result.hitComodinIdx >= 0) {
            const phrases = COMODIN_HIT_PHRASES[result.hitComodinIdx];
            hitMessageRef.current = phrases[Math.floor(Math.random() * phrases.length)];
          } else {
            hitMessageRef.current = "¡FOUL!";
          }
          if (result.state.status === "lost") {
            setStatus("lost");
          } else {
            setStatus("hit");
            setTimeout(() => {
              stateRef.current = { ...stateRef.current, status: "playing" };
              setStatus("playing");
            }, 800);
          }
        }
        if (result.scored) {
          setStatus("scored");
          setTimeout(() => {
            stateRef.current = { ...stateRef.current, status: "playing" };
            setStatus("playing");
          }, 1000);
        }
      }

      // --- RENDER ---
      const s = stateRef.current;

      // Pitch background
      for (let r = 0; r < ROWS; r++) {
        const ry = r * CELL_H * scale;
        const rh = CELL_H * scale;
        ctx.fillStyle = r % 2 === 0 ? "#2d8a4e" : "#34a058";
        ctx.fillRect(0, ry, canvasWidth, rh);
      }

      // Pitch lines
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;

      // Midfield line
      const midY = 6 * CELL_H * scale;
      ctx.beginPath();
      ctx.moveTo(0, midY + CELL_H * scale / 2);
      ctx.lineTo(canvasWidth, midY + CELL_H * scale / 2);
      ctx.stroke();

      // Center circle
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, midY + CELL_H * scale / 2, CELL_W * scale * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Goal area (top)
      const goalAreaW = CELL_W * 5 * scale;
      const goalAreaH = CELL_H * 1.5 * scale;
      const goalAreaX = (canvasWidth - goalAreaW) / 2;
      ctx.strokeRect(goalAreaX, 0, goalAreaW, goalAreaH);

      // Goal area (bottom)
      ctx.strokeRect(goalAreaX, canvasHeight - goalAreaH, goalAreaW, goalAreaH);

      // --- GOAL NET at top ---
      const goalW = CELL_W * 3 * scale;
      const goalH = CELL_H * scale;
      const goalX = (canvasWidth - goalW) / 2;
      const postW = 3;

      // Net background
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(goalX + postW, 0, goalW - postW * 2, goalH);

      // Net grid
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 0.5;
      const netSp = 8;
      for (let ny = 0; ny < goalH; ny += netSp) {
        ctx.beginPath(); ctx.moveTo(goalX + postW, ny); ctx.lineTo(goalX + goalW - postW, ny); ctx.stroke();
      }
      for (let nx = goalX + postW; nx < goalX + goalW - postW; nx += netSp) {
        ctx.beginPath(); ctx.moveTo(nx, 0); ctx.lineTo(nx, goalH); ctx.stroke();
      }

      // Goal frame
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(goalX, 0, postW, goalH);
      ctx.fillRect(goalX + goalW - postW, 0, postW, goalH);
      ctx.fillRect(goalX, goalH - 3, goalW, 3);

      // --- BONUS FLAGS ---
      for (const f of s.flags) {
        if (f.collected) continue;
        const fx = (f.col + 0.5) * CELL_W * scale;
        const fy = (f.row + 0.5) * CELL_H * scale;
        const fs = CELL_W * scale * 0.35;

        ensureFlag(f.code);
        const flagImg = flagCache.current.get(f.code);
        if (flagImg) {
          ctx.save();
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 8;
          const fw = fs * 1.8;
          const fh = fs * 1.2;
          ctx.beginPath();
          ctx.roundRect(fx - fw / 2, fy - fh / 2, fw, fh, 2);
          ctx.clip();
          ctx.drawImage(flagImg, fx - fw / 2, fy - fh / 2, fw, fh);
          ctx.restore();
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(fx - fw / 2, fy - fh / 2, fw, fh, 2);
          ctx.stroke();
        }
      }

      // --- DEFENDERS ---
      for (const lane of s.lanes) {
        for (const d of lane.defenders) {
          const dx = d.x * scale;
          const dy = d.row * CELL_H * scale;
          const dw = d.width * scale;
          const dh = CELL_H * scale * 0.85;
          const dcx = dx + dw / 2;
          const dcy = dy + CELL_H * scale / 2;

          ensureFlag(d.flag);

          if (d.isComodin) {
            const cr = dh * 0.45;
            ctx.save();
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 10;

            const cImg = comodinImgs.current[d.comodinIdx];
            if (cImg) {
              ctx.beginPath();
              ctx.arc(dcx, dcy, cr, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(cImg, dcx - cr, dcy - cr, cr * 2, cr * 2);
              ctx.restore();
              ctx.beginPath();
              ctx.arc(dcx, dcy, cr, 0, Math.PI * 2);
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 2;
              ctx.stroke();
            } else {
              ctx.fillStyle = "#ef4444";
              ctx.beginPath();
              ctx.arc(dcx, dcy, cr, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          } else {
            const flagImg = flagCache.current.get(d.flag);
            const r = dh * 0.38;
            if (flagImg) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(dcx, dcy, r, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(flagImg, dcx - r, dcy - r, r * 2, r * 2);
              ctx.restore();
              ctx.beginPath();
              ctx.arc(dcx, dcy, r, 0, Math.PI * 2);
              ctx.strokeStyle = "rgba(255,255,255,0.4)";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else {
              ctx.fillStyle = "#6366f1";
              ctx.beginPath();
              ctx.arc(dcx, dcy, r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // --- PLAYER ---
      const px = (s.playerCol + 0.5) * CELL_W * scale;
      const py = (s.playerRow + 0.5) * CELL_H * scale;
      const pr = CELL_H * scale * 0.85 * 0.38;

      ctx.save();
      ctx.shadowColor = "#c5e34a";
      ctx.shadowBlur = 12;

      if (triondaImg.current) {
        ctx.drawImage(triondaImg.current, px - pr * 1.1, py - pr * 1.1, pr * 2.2, pr * 2.2);
        ctx.restore();
      } else {
        ctx.fillStyle = "#c5e34a";
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- SPEECH BUBBLES ---
      bubblesRef.current = bubblesRef.current.filter((b) => now - b.time < 2000);
      for (const bubble of bubblesRef.current) {
        const elapsed = now - bubble.time;
        const alpha = Math.max(0, 1 - elapsed / 2000);
        const drift = elapsed * 0.00003 * scale;
        const bx = bubble.x * scale;
        const by = bubble.y * scale - drift;

        ctx.save();
        ctx.globalAlpha = alpha;
        const fontSize = Math.max(9, Math.round(scale * 0.022));
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        const metrics = ctx.measureText(bubble.text);
        const tw = metrics.width + 10;
        const th = fontSize + 6;

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath();
        ctx.roundRect(bx - tw / 2, by - th / 2, tw, th, 5);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(bubble.text, bx, by);
        ctx.restore();
      }

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

      // --- HIT flash + text ---
      if (status === "hit") {
        const elapsed = now - s.hitTime;
        if (elapsed < 700) {
          ctx.save();
          ctx.globalAlpha = 0.35 * (1 - elapsed / 700);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          const fontSize = Math.round(scale * 0.09);
          ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.lineWidth = 4;
          const hitMsg = hitMessageRef.current;
          ctx.strokeText(hitMsg, canvasWidth / 2, canvasHeight / 2);
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 20;
          ctx.fillStyle = "#ffffff";
          ctx.fillText(hitMsg, canvasWidth / 2, canvasHeight / 2);
          ctx.restore();
        }
      }

      // --- SCORED flash ---
      if (status === "scored") {
        const elapsed = now - s.scoreTime;
        if (elapsed < 600) {
          ctx.save();
          ctx.globalAlpha = 0.4 * (1 - elapsed / 600);

          const fontSize = Math.round(scale * 0.1);
          ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 4;
          ctx.strokeText("¡GOL!", canvasWidth / 2, canvasHeight / 2);
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 20;
          ctx.fillStyle = "#22c55e";
          ctx.fillText("¡GOL!", canvasWidth / 2, canvasHeight / 2);
          ctx.restore();
        }
      }

      // --- DEATH overlay ---
      if (status === "lost") {
        const elapsed = now - s.hitTime;
        if (elapsed < 300) {
          ctx.save();
          ctx.globalAlpha = 0.4 * (1 - elapsed / 300);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, canvasWidth, canvasHeight, scale, ensureFlag]);

  return {
    canvasRef,
    canvasHeight,
    score,
    lives,
    goals,
    status,
    start,
    handleTouchStart,
    handleTouchEnd,
  };
}
