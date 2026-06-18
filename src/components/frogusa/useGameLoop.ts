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
  WATER_ROWS,
  ALL_STADIUM_IMAGES,
  COMODIN_HIT_PHRASES,
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

export interface StadiumInfo {
  image: string;
  label: string;
  homeFlag?: string;
  awayFlag?: string;
}

export function useFrogusaLoop(canvasWidth: number, playerAvatarUrl: string | null, firstStadium: StadiumInfo | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FrogusaState>(createInitialState());
  const rafRef = useRef(0);
  const triondaImg = useRef<HTMLImageElement | null>(null);
  const playerImg = useRef<HTMLImageElement | null>(null);
  const comodinImgs = useRef<HTMLImageElement[]>([]);
  const flagCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const stadiumImgRef = useRef<HTMLImageElement | null>(null);
  const stadiumInfoRef = useRef<StadiumInfo | null>(null);
  const popupsRef = useRef<ScorePopup[]>([]);
  const bubblesRef = useRef<SpeechBubble[]>([]);
  const scoreRef = useRef(0);
  const goalsRef = useRef(0);
  const hitMessageRef = useRef("¡CRASH!");

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

  const loadStadium = useCallback((info: StadiumInfo) => {
    stadiumInfoRef.current = info;
    loadImage(info.image)
      .then((img) => { stadiumImgRef.current = img; })
      .catch(() => { stadiumImgRef.current = null; });
    if (info.homeFlag) ensureFlag(info.homeFlag);
    if (info.awayFlag) ensureFlag(info.awayFlag);
  }, [ensureFlag]);

  const rotateStadium = useCallback(() => {
    const idx = Math.floor(Math.random() * ALL_STADIUM_IMAGES.length);
    const img = ALL_STADIUM_IMAGES[idx];
    const label = img.split("/").pop()?.replace(".png", "").replace(/-/g, " ") ?? "";
    loadStadium({ image: img, label });
  }, [loadStadium]);

  const start = useCallback(() => {
    stateRef.current = startGame();
    popupsRef.current = [];
    bubblesRef.current = [];
    scoreRef.current = 0;
    goalsRef.current = 0;
    if (firstStadium) {
      loadStadium(firstStadium);
    } else {
      rotateStadium();
    }
    setScore(0);
    setLives(3);
    setGoals(0);
    setStatus("playing");
  }, [firstStadium, loadStadium, rotateStadium]);

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

        if (result.scored) {
          goalsRef.current++;
          scoreRef.current += 5;
          rotateStadium();
          popupsRef.current.push({
            x: (result.state.playerCol + 0.5) * CELL_W,
            y: GOAL_ROW * CELL_H + CELL_H / 2,
            text: "+5", time: now, color: "#22c55e",
          });
        }
        if (result.trophyCollected) {
          scoreRef.current += 3;
          popupsRef.current.push({
            x: (result.state.playerCol + 0.5) * CELL_W,
            y: (result.state.playerRow + 0.5) * CELL_H,
            text: "+3 🏆", time: now, color: "#f59e0b",
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

        if (result.hit || result.drowned) {
          if (result.drowned) {
            hitMessageRef.current = "¡AL AGUA!";
          } else if (result.hitComodinIdx >= 0) {
            const phrases = COMODIN_HIT_PHRASES[result.hitComodinIdx];
            hitMessageRef.current = phrases[Math.floor(Math.random() * phrases.length)];
          } else {
            hitMessageRef.current = "¡CRASH!";
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

      // Background by zone
      for (let r = 0; r < ROWS; r++) {
        const ry = r * CELL_H * scale;
        const rh = CELL_H * scale;
        if (WATER_ROWS.includes(r)) {
          // River
          const waterGrad = ctx.createLinearGradient(0, ry, 0, ry + rh);
          waterGrad.addColorStop(0, "#1e40af");
          waterGrad.addColorStop(0.5, "#2563eb");
          waterGrad.addColorStop(1, "#1e40af");
          ctx.fillStyle = waterGrad;
          ctx.fillRect(0, ry, canvasWidth, rh);
          ctx.strokeStyle = "rgba(147,197,253,0.25)";
          ctx.lineWidth = 1;
          const waveOff = (now * 0.03 + r * 40) % canvasWidth;
          for (let wx = -20; wx < canvasWidth + 20; wx += 25) {
            ctx.beginPath();
            ctx.moveTo(wx + waveOff % 25, ry + rh * 0.3);
            ctx.quadraticCurveTo(wx + 12 + waveOff % 25, ry + rh * 0.15, wx + 25 + waveOff % 25, ry + rh * 0.3);
            ctx.stroke();
          }
        } else if (r >= 8 && r <= 11) {
          // Road
          ctx.fillStyle = "#374151";
          ctx.fillRect(0, ry, canvasWidth, rh);
          // Lane dashes
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1;
          ctx.setLineDash([8, 10]);
          ctx.beginPath();
          ctx.moveTo(0, ry + rh / 2);
          ctx.lineTo(canvasWidth, ry + rh / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (SAFE_ROWS.includes(r)) {
          // Sidewalk
          ctx.fillStyle = r === 0 ? "#1e293b" : "#4b5563";
          ctx.fillRect(0, ry, canvasWidth, rh);
          if (r !== 0) {
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            for (let sx = 0; sx < canvasWidth; sx += 20) {
              ctx.fillRect(sx, ry, 18, rh);
            }
          }
        } else {
          // Grass (rows 5)
          ctx.fillStyle = r % 2 === 0 ? "#2d8a4e" : "#34a058";
          ctx.fillRect(0, ry, canvasWidth, rh);
        }
      }

      // Road edges
      ctx.fillStyle = "#f59e0b";
      const roadTop = 8 * CELL_H * scale;
      const roadBot = 12 * CELL_H * scale;
      ctx.fillRect(0, roadTop, canvasWidth, 2);
      ctx.fillRect(0, roadBot - 2, canvasWidth, 2);

      // --- STADIUM at top (row 0) ---
      const stadH = CELL_H * scale;
      // Dark background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvasWidth, stadH);

      // Stadium image (zoomed in, clipped to row)
      if (stadiumImgRef.current) {
        const img = stadiumImgRef.current;
        const imgAspect = img.width / img.height;
        const drawH = stadH * 1.6;
        const drawW = drawH * imgAspect;
        const drawX = (canvasWidth - drawW) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth, stadH);
        ctx.clip();
        ctx.drawImage(img, drawX, stadH - drawH * 0.85, drawW, drawH);
        ctx.restore();
      }

      // Flags of next match (side by side: flag v flag)
      const sInfo = stadiumInfoRef.current;
      if (sInfo?.homeFlag && sInfo?.awayFlag) {
        const fW = stadH * 0.45;
        const fH = fW * 0.65;
        const gap = 6;
        const vsFontSize = Math.round(fH * 0.5);
        const totalW = fW * 2 + gap + vsFontSize * 1.5;
        const startX = canvasWidth - totalW - 6;
        const fY = (stadH - fH) / 2;

        const homeImg = flagCache.current.get(sInfo.homeFlag);
        const awayImg = flagCache.current.get(sInfo.awayFlag);
        if (homeImg) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(startX, fY, fW, fH, 2);
          ctx.clip();
          ctx.drawImage(homeImg, startX, fY, fW, fH);
          ctx.restore();
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(startX, fY, fW, fH, 2);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = `bold ${vsFontSize}px Outfit, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("v", startX + fW + gap / 2 + vsFontSize * 0.4, stadH / 2);

        if (awayImg) {
          const ax = startX + fW + gap + vsFontSize * 0.8;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(ax, fY, fW, fH, 2);
          ctx.clip();
          ctx.drawImage(awayImg, ax, fY, fW, fH);
          ctx.restore();
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(ax, fY, fW, fH, 2);
          ctx.stroke();
        }
      }

      // Stadium bottom border
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(0, stadH - 1, canvasWidth, 1);

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

      // --- PLATFORMS (logs) ---
      for (const lane of s.waterLanes) {
        for (const plat of lane.platforms) {
          const platX = plat.x * scale;
          const platY = plat.row * CELL_H * scale;
          const platW = plat.width * scale;
          const platH = CELL_H * scale * 0.7;
          const platYc = platY + (CELL_H * scale - platH) / 2;

          // Log body
          const logGrad = ctx.createLinearGradient(0, platYc, 0, platYc + platH);
          logGrad.addColorStop(0, "#92400e");
          logGrad.addColorStop(0.3, "#b45309");
          logGrad.addColorStop(0.7, "#a16207");
          logGrad.addColorStop(1, "#78350f");
          ctx.fillStyle = logGrad;
          ctx.beginPath();
          ctx.roundRect(platX, platYc, platW, platH, platH / 2);
          ctx.fill();

          // Wood grain lines
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.lineWidth = 0.8;
          for (let lx = platX + 12; lx < platX + platW - 5; lx += 14) {
            ctx.beginPath();
            ctx.moveTo(lx, platYc + 3);
            ctx.lineTo(lx, platYc + platH - 3);
            ctx.stroke();
          }

          // Highlight
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.beginPath();
          ctx.roundRect(platX + 4, platYc + 2, platW - 8, platH * 0.3, 3);
          ctx.fill();

          // Log end circles
          ctx.fillStyle = "#78350f";
          ctx.beginPath();
          ctx.ellipse(platX + 3, platYc + platH / 2, 3, platH / 2 - 1, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(platX + platW - 3, platYc + platH / 2, 3, platH / 2 - 1, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- CARS ---
      const CAR_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#22c55e", "#8b5cf6", "#ec4899", "#06b6d4"];
      for (const lane of s.lanes) {
        for (const d of lane.defenders) {
          const dx = d.x * scale;
          const dy = d.row * CELL_H * scale;
          const dw = d.width * scale;
          const dh = CELL_H * scale * 0.65;
          const carY = dy + (CELL_H * scale - dh) / 2;

          if (d.isComodin) {
            // Comodin truck (bigger, red)
            const truckGrad = ctx.createLinearGradient(0, carY, 0, carY + dh);
            truckGrad.addColorStop(0, "#dc2626");
            truckGrad.addColorStop(1, "#991b1b");
            ctx.fillStyle = truckGrad;
            ctx.beginPath();
            ctx.roundRect(dx, carY, dw, dh, 4);
            ctx.fill();

            // Comodin face
            const cImg = comodinImgs.current[d.comodinIdx];
            if (cImg) {
              const faceR = dh * 0.35;
              const faceCx = dx + dw * 0.3;
              const faceCy = carY + dh / 2;
              ctx.save();
              ctx.beginPath();
              ctx.arc(faceCx, faceCy, faceR, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(cImg, faceCx - faceR, faceCy - faceR, faceR * 2, faceR * 2);
              ctx.restore();
            }

            // Headlights
            ctx.fillStyle = "#fbbf24";
            const hlX = lane.direction === 1 ? dx + dw - 4 : dx + 1;
            ctx.fillRect(hlX, carY + 3, 3, 4);
            ctx.fillRect(hlX, carY + dh - 7, 3, 4);
          } else {
            // Team bus (top-down view)
            ensureFlag(d.flag);

            // Bus body
            ctx.fillStyle = "#e2e8f0";
            ctx.beginPath();
            ctx.roundRect(dx, carY, dw, dh, 4);
            ctx.fill();

            // Flag on rear half of roof (rotated 90°)
            const flagImg = flagCache.current.get(d.flag);
            const rearX = lane.direction === 1 ? dx + 3 : dx + dw / 2;
            const flagW = dw / 2 - 5;
            const flagH = dh - 6;
            if (flagImg) {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(rearX, carY + 3, flagW, flagH, 2);
              ctx.clip();
              ctx.translate(rearX + flagW / 2, carY + 3 + flagH / 2);
              ctx.rotate(Math.PI / 2);
              ctx.drawImage(flagImg, -flagH / 2, -flagW / 2, flagH, flagW);
              ctx.restore();
            }

            // Bus border/frame
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(dx, carY, dw, dh, 4);
            ctx.stroke();

            // Front windshield
            ctx.fillStyle = "rgba(147,197,253,0.6)";
            const frontX = lane.direction === 1 ? dx + dw - 6 : dx + 1;
            ctx.fillRect(frontX, carY + 2, 5, dh - 4);

            // Flashing headlights
            const flash = Math.sin(now * 0.008 + d.x * 50) > 0.3;
            if (flash) {
              ctx.save();
              ctx.shadowColor = "#fef08a";
              ctx.shadowBlur = 6;
              ctx.fillStyle = "#fef08a";
              const hlX = lane.direction === 1 ? dx + dw - 2 : dx - 1;
              ctx.fillRect(hlX, carY + 2, 3, 3);
              ctx.fillRect(hlX, carY + dh - 5, 3, 3);
              ctx.restore();
            }
          }
        }
      }

      // --- TROPHY ---
      if (s.trophy && !s.trophy.collected) {
        const tx = (s.trophy.col + 0.5) * CELL_W * scale;
        const ty = (s.trophy.row + 0.5) * CELL_H * scale;
        const tr = CELL_W * scale * 0.4;
        const blink = s.trophy.ticksLeft < 60 ? Math.sin(now * 0.02) > 0 : true;
        if (blink) {
          ctx.save();
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 15;
          ctx.font = `${Math.round(tr * 1.6)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🏆", tx, ty);
          ctx.restore();
        }
      }

      // --- PLAYER (avatar) ---
      const px = (WATER_ROWS.includes(s.playerRow) ? s.playerX + CELL_W / 2 : (s.playerCol + 0.5) * CELL_W) * scale;
      const py = (s.playerRow + 0.5) * CELL_H * scale;
      const pr = CELL_H * scale * 0.85 * 0.38;

      ctx.save();
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 10;

      if (playerImg.current) {
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(playerImg.current, px - pr, py - pr, pr * 2, pr * 2);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (triondaImg.current) {
        ctx.drawImage(triondaImg.current, px - pr * 1.1, py - pr * 1.1, pr * 2.2, pr * 2.2);
        ctx.restore();
      } else {
        ctx.fillStyle = "#22c55e";
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
      if (status === "hit" || s.status === "hit") {
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
