"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { TOTAL_LEVELS, BALL_R, drawPixelText } from "./gameTypes";

function DPadBtn({ label, onTap, accent }: { label: string; onTap: () => void; accent?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = (e: TouchEvent) => { e.preventDefault(); onTap(); };
    el.addEventListener("touchstart", start, { passive: false });
    return () => el.removeEventListener("touchstart", start);
  }, [onTap]);
  return (
    <button
      ref={ref}
      type="button"
      onMouseDown={onTap}
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg select-none active:scale-90 ${
        accent ? "bg-fifa-gold/80 text-black active:bg-fifa-gold" : "bg-white/10 text-white/70 active:bg-white/20 active:text-white"
      }`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", touchAction: "none" }}
    >
      {label}
    </button>
  );
}

const CW = 400;
const CH = 500;

// Grid-style node positions — 3 rows, only H/V connections
// Row 1 (bottom): 0,1,2 — Row 2 (mid): 3,4,5 — Row 3 (top): 6,7
const NODES = [
  { x: 65, y: 380 },   // 0
  { x: 200, y: 380 },  // 1
  { x: 335, y: 380 },  // 2
  { x: 65, y: 265 },   // 3
  { x: 200, y: 265 },  // 4
  { x: 335, y: 265 },  // 5
  { x: 130, y: 150 },  // 6
  { x: 270, y: 150 },  // 7
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2],       // bottom row
  [3, 4], [4, 5],       // mid row
  [0, 3], [1, 4], [2, 5], // verticals
  [3, 6], [5, 7],       // up to top
  [6, 7],               // top row
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

interface Props {
  score: number;
  lives: number;
  completedLevels: Set<number>;
  onSelect: (level: number) => void;
  onBack: () => void;
}

const MOVE_SPEED = 4;

export function LevelSelect({ score, lives, completedLevels, onSelect, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState(0);
  const smileFrame = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const posRef = useRef({ x: NODES[0].x, y: NODES[0].y });
  const animTarget = useRef<number | null>(null);

  const bgImg = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    loadImage("/images/triompy_sprite.png").then((img) => {
      const imgW = img.width;
      const imgH = img.height;
      const ballR = imgW * 0.155;
      const cx = imgW * 0.27;
      const cy = imgH * 0.27;
      const size = Math.ceil(ballR * 2);
      const oc = document.createElement("canvas");
      oc.width = size;
      oc.height = size;
      const octx = oc.getContext("2d")!;
      octx.beginPath();
      octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      octx.clip();
      octx.drawImage(img, cx - ballR, cy - ballR, ballR * 2, ballR * 2, 0, 0, size, size);
      smileFrame.current = oc;
    }).catch(() => {});
    loadImage("/images/bg_triompy.png").then((img) => { bgImg.current = img; }).catch(() => {});
  }, []);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sx = canvas.width / CW;
    const sy = canvas.height / CH;

    // Background image
    if (bgImg.current) {
      ctx.drawImage(bgImg.current, 0, 0, canvas.width, canvas.height);
      // Darken slightly so nodes/text pop
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#000030";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw connection lines between nodes (blue pipes like original)
    for (const [a, b] of EDGES) {
      const na = NODES[a];
      const nb = NODES[b];
      // Outer pipe
      ctx.strokeStyle = "#1e40af";
      ctx.lineWidth = 8 * sx;
      ctx.beginPath();
      ctx.moveTo(na.x * sx, na.y * sy);
      ctx.lineTo(nb.x * sx, nb.y * sy);
      ctx.stroke();
      // Inner pipe highlight
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 4 * sx;
      ctx.beginPath();
      ctx.moveTo(na.x * sx, na.y * sy);
      ctx.lineTo(nb.x * sx, nb.y * sy);
      ctx.stroke();
    }

    // Draw level nodes (blue rings like original) — all unlocked
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const n = NODES[i];
      const nx = n.x * sx;
      const ny = n.y * sy;
      const outerR = 26 * sx;
      const innerR = 17 * sx;
      const selected = i === cursor;

      if (selected) {
        ctx.shadowColor = "#60a5fa";
        ctx.shadowBlur = 12;
      }
      // Blue ring — outer
      ctx.fillStyle = "#1e40af";
      ctx.beginPath();
      ctx.arc(nx, ny, outerR, 0, Math.PI * 2);
      ctx.fill();
      // Ring highlight (top-left shine)
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(nx, ny, outerR - 2 * sx, Math.PI * 1.1, Math.PI * 1.7);
      ctx.lineTo(nx, ny);
      ctx.closePath();
      ctx.fill();
      // Inner dark circle
      ctx.fillStyle = selected ? "#172554" : "#0f172a";
      ctx.beginPath();
      ctx.arc(nx, ny, innerR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Blue X if completed
      if (completedLevels.has(i + 1) && !selected) {
        const xr = innerR * 0.6;
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3.5 * sx;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(nx - xr, ny - xr);
        ctx.lineTo(nx + xr, ny + xr);
        ctx.moveTo(nx + xr, ny - xr);
        ctx.lineTo(nx - xr, ny + xr);
        ctx.stroke();
        ctx.lineCap = "butt";
      }
    }

    // Animate position toward target node
    if (animTarget.current !== null) {
      const tgt = NODES[animTarget.current];
      const dx = tgt.x - posRef.current.x;
      const dy = tgt.y - posRef.current.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MOVE_SPEED) {
        posRef.current = { x: tgt.x, y: tgt.y };
        setCursor(animTarget.current);
        animTarget.current = null;
      } else {
        posRef.current = {
          x: posRef.current.x + (dx / dist) * MOVE_SPEED,
          y: posRef.current.y + (dy / dist) * MOVE_SPEED,
        };
      }
    }

    // Draw trionda at animated position
    const tx = posRef.current.x * sx;
    const ty = posRef.current.y * sy;
    const selInnerR = 17 * sx;

    const ballCY = ty;

    // Cloud behind trionda — positioned lower so it peeks out underneath
    const cloudBaseY = ballCY + selInnerR * 0.35;
    ctx.fillStyle = "#c8d8e8";
    ctx.beginPath();
    ctx.arc(tx - 6 * sx, cloudBaseY, 7 * sx, 0, Math.PI * 2);
    ctx.arc(tx + 6 * sx, cloudBaseY, 7 * sx, 0, Math.PI * 2);
    ctx.arc(tx, cloudBaseY - 1 * sy, 8 * sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(tx - 3 * sx, cloudBaseY - 3 * sy, 4 * sx, 0, Math.PI * 2);
    ctx.arc(tx + 4 * sx, cloudBaseY - 2 * sy, 3 * sx, 0, Math.PI * 2);
    ctx.fill();

    // Trionda on top of cloud
    const ballSize = selInnerR * 0.75;
    const ballY = ballCY - selInnerR * 0.1;
    if (smileFrame.current) {
      ctx.drawImage(smileFrame.current, tx - ballSize, ballY - ballSize, ballSize * 2, ballSize * 2);
    } else {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(tx, ballY, ballSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }


    // HUD bar at top — score + lives
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, 30 * sy);
    // Score — pixel font
    const px = 2 * sx;
    drawPixelText(ctx, String(score).padStart(5, "0"), 10 * sx, 8 * sy, px, "#fbbf24");
    // Lives — trionda sprites
    if (smileFrame.current) {
      const lifeSize = 18 * sx;
      for (let i = 0; i < lives; i++) {
        ctx.drawImage(smileFrame.current, (CW - 12 - i * 22) * sx - lifeSize / 2, 15 * sy - lifeSize / 2, lifeSize, lifeSize);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [cursor, score, lives, completedLevels]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
            const move = (target: number) => {
        if (target >= 0 && target < TOTAL_LEVELS && animTarget.current === null) {
          animTarget.current = target;
        }
      };
      // Grid: bottom [0,1,2], mid [3,4,5], top [6,7]
      if (e.key === "ArrowLeft" || e.key === "a") {
        e.preventDefault();
        if (cursor === 1) move(0);
        else if (cursor === 2) move(1);
        else if (cursor === 4) move(3);
        else if (cursor === 5) move(4);
        else if (cursor === 7) move(6);
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        e.preventDefault();
        if (cursor === 0) move(1);
        else if (cursor === 1) move(2);
        else if (cursor === 3) move(4);
        else if (cursor === 4) move(5);
        else if (cursor === 6) move(7);
      }
      if (e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        if (cursor === 0) move(3);
        else if (cursor === 1) move(4);
        else if (cursor === 2) move(5);
        else if (cursor === 3) move(6);
        else if (cursor === 5) move(7);
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        e.preventDefault();
        if (cursor === 3) move(0);
        else if (cursor === 4) move(1);
        else if (cursor === 5) move(2);
        else if (cursor === 6) move(3);
        else if (cursor === 7) move(5);
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(cursor + 1);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, onSelect, onBack]);

  // Touch/click on nodes
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * CW;
    const my = (e.clientY - rect.top) / rect.height * CH;

    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const n = NODES[i];
      const dist = Math.hypot(mx - n.x, my - n.y);
      if (dist < 30) {
        if (cursor === i && animTarget.current === null) {
          onSelect(i + 1);
        } else if (animTarget.current === null) {
          animTarget.current = i;
        }
        return;
      }
    }
  }, [cursor, onSelect]);

  const moveDir = useCallback((dir: "up" | "down" | "left" | "right") => {
    if (animTarget.current !== null) return;
    const c = cursor;
    let target = -1;
    if (dir === "left") { if (c === 1) target = 0; else if (c === 2) target = 1; else if (c === 4) target = 3; else if (c === 5) target = 4; else if (c === 7) target = 6; }
    if (dir === "right") { if (c === 0) target = 1; else if (c === 1) target = 2; else if (c === 3) target = 4; else if (c === 4) target = 5; else if (c === 6) target = 7; }
    if (dir === "up") { if (c === 0) target = 3; else if (c === 1) target = 4; else if (c === 2) target = 5; else if (c === 3) target = 6; else if (c === 5) target = 7; }
    if (dir === "down") { if (c === 3) target = 0; else if (c === 4) target = 1; else if (c === 5) target = 2; else if (c === 6) target = 3; else if (c === 7) target = 5; }
    if (target >= 0 && target < TOTAL_LEVELS) animTarget.current = target;
  }, [cursor]);

  const handlePlay = useCallback(() => {
    if (animTarget.current === null) onSelect(cursor + 1);
  }, [cursor, onSelect]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CW * 2}
        height={CH * 2}
        onClick={handleClick}
        className="mx-auto w-full max-w-[400px] rounded-xl cursor-pointer"
        style={{ aspectRatio: `${CW}/${CH}`, imageRendering: "pixelated" }}
      />
      {/* D-pad + Play for mobile */}
      <div className="md:hidden select-none flex items-center gap-6" style={{ touchAction: "none" }}>
        <div className="grid grid-cols-3 gap-1 w-32">
          <div />
          <DPadBtn label="▲" onTap={() => moveDir("up")} />
          <div />
          <DPadBtn label="◀" onTap={() => moveDir("left")} />
          <DPadBtn label="●" onTap={handlePlay} accent />
          <DPadBtn label="▶" onTap={() => moveDir("right")} />
          <div />
          <DPadBtn label="▼" onTap={() => moveDir("down")} />
          <div />
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-fifa-dark-gray hover:text-foreground transition-colors"
      >
        ← Volver
      </button>
    </div>
  );
}
