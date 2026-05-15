"use client";

import { useState, useEffect } from "react";

interface LockCountdownProps {
  locksAt: string;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function LockCountdown({ locksAt }: LockCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const ms = new Date(locksAt).getTime() - Date.now();
      setTimeLeft(ms > 0 ? formatTimeLeft(ms) : "");
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [locksAt]);

  if (!timeLeft) return null;

  const ms = new Date(locksAt).getTime() - Date.now();
  const isUrgent = ms < 3600_000;

  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ring-1 ring-white/5 ${
      isUrgent ? "bg-fifa-red/10" : "bg-fifa-teal/10"
    }`}>
      <span className="text-lg">{isUrgent ? "⏳" : "⏱️"}</span>
      <div>
        <p className={`text-sm font-semibold ${isUrgent ? "text-fifa-red" : "text-fifa-teal"}`}>
          Cierra en {timeLeft}
        </p>
        <p className="text-xs text-fifa-dark-gray">
          Completá tus predicciones antes del cierre
        </p>
      </div>
    </div>
  );
}
