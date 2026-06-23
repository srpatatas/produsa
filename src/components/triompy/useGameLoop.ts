"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  CANVAS_W, CANVAS_H, BALL_R, PLATFORM_COLORS, COMODIN_IMAGES,
  drawPixelText,
  type TriompyState, type PlatformType,
} from "./gameTypes";
import { tick } from "./gameLogic";

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
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  stateRef: React.MutableRefObject<TriompyState>,
  onStateChange: (s: TriompyState) => void,
) {
  const keys = useRef<Set<string>>(new Set());
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const spriteFrames = useRef<HTMLCanvasElement[]>([]);
  const comodinImgs = useRef<(HTMLImageElement | null)[]>([]);
  const flagCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    Promise.all([
      loadImage("/images/triompy_sprite.png").catch(() => null),
      ...COMODIN_IMAGES.map((s) => loadImage(s).catch(() => null)),
    ]).then((results) => {
      const sheet = results[0] as HTMLImageElement | null;
      comodinImgs.current = results.slice(1) as (HTMLImageElement | null)[];

      if (sheet) {
        const imgW = sheet.width;
        const imgH = sheet.height;
        const ballR = imgW * 0.155;
        const centers = [
          { x: imgW * 0.27, y: imgH * 0.27 },
          { x: imgW * 0.77, y: imgH * 0.27 },
          { x: imgW * 0.27, y: imgH * 0.72 },
          { x: imgW * 0.77, y: imgH * 0.72 },
        ];
        const size = Math.ceil(ballR * 2);
        spriteFrames.current = centers.map((c) => {
          const oc = document.createElement("canvas");
          oc.width = size;
          oc.height = size;
          const octx = oc.getContext("2d")!;
          octx.beginPath();
          octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          octx.clip();
          octx.drawImage(
            sheet,
            c.x - ballR, c.y - ballR, ballR * 2, ballR * 2,
            0, 0, size, size,
          );
          return oc;
        });
      }
    });
  }, []);

  const getFlag = useCallback((code: string): HTMLImageElement | null => {
    if (flagCache.current.has(code)) return flagCache.current.get(code)!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://flagcdn.com/w40/${code}.png`;
    img.onload = () => flagCache.current.set(code, img);
    return null;
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "a", "d", "s", "w"].includes(e.key)) {
        e.preventDefault();
        keys.current.add(e.key);
      }
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchId: number | null = null;
    let touchStartX = 0;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      touchId = t.identifier;
      touchStartX = t.clientX;
      const rect = canvas.getBoundingClientRect();
      const touchY = t.clientY - rect.top;
      if (touchY > rect.height * 0.7) {
        keys.current.add("ArrowDown");
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          const dx = t.clientX - touchStartX;
          keys.current.delete("ArrowLeft");
          keys.current.delete("ArrowRight");
          if (dx < -15) keys.current.add("ArrowLeft");
          if (dx > 15) keys.current.add("ArrowRight");
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          keys.current.delete("ArrowLeft");
          keys.current.delete("ArrowRight");
          keys.current.delete("ArrowDown");
          touchId = null;
        }
      }
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [canvasRef]);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    lastTimeRef.current = 0;

    const frame = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const elapsed = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const dt = Math.min(elapsed / 16.67, 3);

      const s = stateRef.current;
      if (s.status === "playing" || s.status === "dying") {
        const input = {
          left: keys.current.has("ArrowLeft") || keys.current.has("a"),
          right: keys.current.has("ArrowRight") || keys.current.has("d"),
          down: keys.current.has("ArrowDown") || keys.current.has("s"),
          up: keys.current.has("ArrowUp") || keys.current.has("w"),
        };
        const next = tick(s, input, dt);
        stateRef.current = next;
        if (next.status !== s.status || next.score !== s.score || next.lives !== s.lives || next.collectedFlags !== s.collectedFlags) {
          onStateChange(next);
        }
      }

      draw(ctx, stateRef.current, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [canvasRef, stateRef, onStateChange]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  function drawPlatform(ctx: CanvasRenderingContext2D, type: PlatformType, px: number, py: number, pw: number, ph: number, bounceAnim: number, alpha = 1) {
    const c = PLATFORM_COLORS[type];
    ctx.globalAlpha = alpha;

    // Deep V bend — edges stay fixed, middle sags dramatically
    const bend = bounceAnim * ph * 1.8;

    if (bend > 0.5) {
      const bottomY = py + ph;
      const midX = px + pw / 2;

      // Body — deep V sag
      ctx.fillStyle = c.body;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(midX - 4, py + bend);
      ctx.lineTo(midX + 4, py + bend);
      ctx.lineTo(px + pw, py);
      ctx.lineTo(px + pw, bottomY);
      ctx.lineTo(midX + 4, bottomY + bend * 0.6);
      ctx.lineTo(midX - 4, bottomY + bend * 0.6);
      ctx.lineTo(px, bottomY);
      ctx.closePath();
      ctx.fill();

      // Top face — follows the V
      ctx.fillStyle = c.top;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(midX - 4, py + bend);
      ctx.lineTo(midX + 4, py + bend);
      ctx.lineTo(px + pw, py);
      ctx.lineTo(px + pw, py + ph * 0.35);
      ctx.lineTo(midX + 3, py + ph * 0.35 + bend * 0.8);
      ctx.lineTo(midX - 3, py + ph * 0.35 + bend * 0.8);
      ctx.lineTo(px, py + ph * 0.35);
      ctx.closePath();
      ctx.fill();

      // Top edge highlight — V line
      ctx.strokeStyle = c.shine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(midX, py + bend);
      ctx.lineTo(px + pw, py);
      ctx.stroke();

      // Side edges
      ctx.fillStyle = c.shine;
      ctx.fillRect(px, py, 2, ph);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(px + pw - 2, py, 2, ph);
    } else {
      // Normal flat platform
      ctx.fillStyle = c.body;
      ctx.fillRect(px, py, pw, ph);

      // Top face
      ctx.fillStyle = c.top;
      ctx.fillRect(px + 1, py + 2, pw - 2, ph * 0.4);

      // Top highlight
      ctx.fillStyle = c.shine;
      ctx.fillRect(px, py, pw, 2);

      // Left edge highlight
      ctx.fillStyle = c.shine;
      ctx.fillRect(px, py, 2, ph);

      // Right/bottom shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(px + pw - 2, py, 2, ph);
      ctx.fillRect(px, py + ph - 2, pw, 2);
    }

    // Brick pattern for normal (skip when bending)
    if (type === "normal" && pw > 30 && bend <= 0.5) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      const brickW = 12;
      let bOffset = false;
      for (let by = py; by < py + ph - 1; by += ph / 2) {
        for (let bx = px + (bOffset ? brickW / 2 : 0); bx < px + pw; bx += brickW) {
          ctx.fillRect(bx, by, 1, ph / 2);
        }
        bOffset = !bOffset;
      }
    }

    // Ice: pixel sparkles
    if (type === "icy") {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 5; i++) {
        const ix = px + 4 + ((pw - 8) * i) / 4;
        ctx.fillRect(ix, py + 3, 2, 2);
      }
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(px + 2, py + 1, pw - 4, 1);
    }

    // Spring: zigzag coil underneath
    if (type === "spring") {
      const coilH = Math.max(2, 8 - bend);
      ctx.fillStyle = "#fbbf24";
      const segments = 6;
      const segW = pw * 0.5 / segments;
      const sStartX = px + pw * 0.25;
      for (let i = 0; i < segments; i++) {
        const x1 = sStartX + i * segW;
        const y1 = py + ph + (i % 2 === 0 ? 0 : coilH);
        ctx.fillRect(x1, y1, segW + 1, 2);
      }
    }

    // Crumble: pixel cracks
    if (type === "crumble") {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(px + pw * 0.25, py + 1, 1, ph - 2);
      ctx.fillRect(px + pw * 0.55, py + 2, 1, ph - 3);
      ctx.fillRect(px + pw * 0.8, py, 1, ph - 1);
    }

    ctx.globalAlpha = 1;
  }

  function draw(ctx: CanvasRenderingContext2D, s: TriompyState, cw: number, ch: number) {
    const sx = cw / CANVAS_W;
    const sy = ch / CANVAS_H;

    // Background — DOS dark blue
    ctx.fillStyle = "#000030";
    ctx.fillRect(0, 0, cw, ch);

    // Starfield dots (DOS style)
    ctx.fillStyle = "#334";
    const dotSize = 2 * sx;
    for (let dy = 50 * sy; dy < ch; dy += 30 * sy) {
      for (let dx = 15 * sx; dx < cw; dx += 35 * sx) {
        ctx.fillRect(dx, dy, dotSize, dotSize);
      }
    }

    // Side walls — solid colored border (DOS style)
    ctx.fillStyle = "#1a1a5a";
    ctx.fillRect(0, 0, 3 * sx, ch);
    ctx.fillRect(cw - 3 * sx, 0, 3 * sx, ch);

    // Platforms
    for (const pl of s.platforms) {
      if (pl.crumbled) continue;
      drawPlatform(ctx, pl.type,
        pl.x * sx, pl.y * sy, pl.w * sx, pl.h * sy,
        pl.bounceAnim,
        pl.type === "crumble" ? 0.8 : 1,
      );
    }

    // Spikes
    for (const sp of s.spikes) {
      const spx = sp.x * sx;
      const spy = sp.y * sy;
      const spw = sp.w * sx;
      const sph = sp.h * sy;
      const count = Math.max(3, Math.floor(spw / (10 * sx)));
      for (let i = 0; i < count; i++) {
        const tx = spx + i * (spw / count);
        const tw = spw / count;
        if (sp.flipped) {
          // Ceiling spike — points down
          ctx.fillStyle = "#cc2222";
          ctx.beginPath();
          ctx.moveTo(tx, spy);
          ctx.lineTo(tx + tw / 2, spy + sph);
          ctx.lineTo(tx + tw, spy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ff6666";
          ctx.beginPath();
          ctx.moveTo(tx, spy);
          ctx.lineTo(tx + tw / 2, spy + sph);
          ctx.lineTo(tx + tw * 0.3, spy);
          ctx.closePath();
          ctx.fill();
        } else {
          // Floor spike — points up
          ctx.fillStyle = "#cc2222";
          ctx.beginPath();
          ctx.moveTo(tx, spy + sph);
          ctx.lineTo(tx + tw / 2, spy);
          ctx.lineTo(tx + tw, spy + sph);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ff6666";
          ctx.beginPath();
          ctx.moveTo(tx, spy + sph);
          ctx.lineTo(tx + tw / 2, spy);
          ctx.lineTo(tx + tw * 0.3, spy + sph);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Enemies (comodines) — circular with glow
    for (const e of s.enemies) {
      const ex = e.x * sx;
      const ey = e.y * sy;
      const ew = e.w * sx;
      const eh = e.h * sy;
      const ecx = ex + ew / 2;
      const ecy = ey + eh / 2;
      const er = ew / 2;

      // Glow
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 8;

      const img = comodinImgs.current[e.comodinIndex];
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ecx, ecy, er, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, ex, ey, ew, eh);
        ctx.restore();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ecx, ecy, er, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(ecx, ecy, er, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Flags — with pole
    for (const fl of s.flags) {
      if (fl.collected) continue;
      const fx = fl.x * sx;
      const fy = fl.y * sy;
      const fw = 18 * sx;
      const fh = 12 * sy;

      // Pole
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy + fh / 2);
      ctx.lineTo(fx, fy + fh / 2 + 10 * sy);
      ctx.stroke();

      // Flag image or placeholder
      const flagImg = getFlag(fl.code);
      if (flagImg) {
        ctx.drawImage(flagImg, fx - 1, fy - fh / 2, fw, fh);
      } else {
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(fx - 1, fy - fh / 2, fw, fh);
      }

      // Subtle glow
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "rgba(251,191,36,0.01)";
      ctx.fillRect(fx - 2, fy - fh / 2 - 2, fw + 4, fh + 4);
      ctx.shadowBlur = 0;
    }

    // Gate — animated hole that opens in the platform
    if (s.gate.openAnim > 0) {
      const gx = s.gate.x * sx;
      const gy = s.gate.y * sy;
      const maxR = 14 * sx;
      const anim = s.gate.openAnim;
      const hr = maxR * anim;
      const vr = hr * 0.55;

      // Golden rim — grows with animation
      const pulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.85;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = anim * 10;
      ctx.fillStyle = `rgba(251,191,36,${pulse})`;
      ctx.beginPath();
      ctx.ellipse(gx, gy - 2 * sy, hr + 3 * sx * anim, vr + 2 * sy * anim, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark hole — grows from nothing
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(gx, gy - 2 * sy, hr, vr, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner depth
      if (anim > 0.3) {
        ctx.fillStyle = "#1a0a00";
        ctx.beginPath();
        ctx.ellipse(gx, gy - 1 * sy, hr * 0.7, vr * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight arc on top edge
      if (anim > 0.5) {
        ctx.strokeStyle = `rgba(251,191,36,${(anim - 0.5) * 1.0})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(gx, gy - 2 * sy, hr + 1 * sx, vr + 1 * sy, 0, Math.PI * 1.1, Math.PI * 1.8);
        ctx.stroke();
      }
    }

    // Ball — sprite from spritesheet
    const bx = s.ballX * sx;
    const by = s.ballY * sy;
    const br = BALL_R * sx;

    // During enter animation: shrink ball into hole
    const enterScale = s.enterAnim > 0 ? Math.max(0, 1 - s.enterAnim) : 1;

    if (enterScale <= 0) {
      // Ball fully inside hole — don't draw
    } else {

    if (s.status === "dying") {
      ctx.globalAlpha = 0.3 + Math.sin(s.deathTimer * 0.4) * 0.3;
    }

    // Shadow (shrinks with enter)
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + br * 1.1 * enterScale, br * 0.7 * enterScale, br * 0.25 * enterScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Squash/stretch
    const stretch = s.enterAnim > 0 ? 1 : 1 + Math.abs(s.vy) * 0.012;
    const squash = 1 / stretch;

    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(squash * enterScale, stretch * enterScale);

    if (spriteFrames.current.length === 4) {
      const moving = keys.current.has("ArrowLeft") || keys.current.has("a") ||
        keys.current.has("ArrowRight") || keys.current.has("d");
      let frame = 0;
      if (s.status === "dying" && s.deathTimer > 25) {
        frame = 2; // ouch
      } else if (s.status === "dying") {
        frame = 3; // dead
      } else if (s.vy < -4 || moving) {
        frame = 1; // surprised
      }

      const drawSize = br * 2.8;
      ctx.drawImage(
        spriteFrames.current[frame],
        -drawSize / 2, -drawSize / 2, drawSize, drawSize,
      );
    } else {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, 0, br, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    } // end enterScale > 0

    // HUD — arcade style bar at top
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, cw, 32 * sy);

    // Score — pixel font
    const px = 2 * sx;
    drawPixelText(ctx, String(s.score).padStart(5, "0"), 8 * sx, 8 * sy, px, "#fbbf24");

    // Flags counter — pixel font
    const flagStr = `${s.collectedFlags}/${s.totalFlags}`;
    const flagW = flagStr.length * 6 * px;
    drawPixelText(ctx, flagStr, (CANVAS_W / 2) * sx - flagW / 2, 8 * sy, px, "#fff");

    // Lives — trionda sprites
    if (spriteFrames.current.length === 4) {
      const lifeSize = 18 * sx;
      for (let i = 0; i < s.lives; i++) {
        ctx.drawImage(spriteFrames.current[0], (CANVAS_W - 12 - i * 22) * sx - lifeSize / 2, 16 * sy - lifeSize / 2, lifeSize, lifeSize);
      }
    } else {
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      for (let i = 0; i < s.lives; i++) {
        ctx.fillText("♥", (CANVAS_W - 10 - i * 18) * sx, 16 * sy);
      }
    }
    ctx.textBaseline = "alphabetic";
  }

  return { startLoop, stopLoop, keys };
}
