"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { KnockoutMatch } from "@/types";
import { KnockoutMatchCard } from "../KnockoutMatchCard";

interface BracketPredictionModalProps {
  match: KnockoutMatch;
  onClose: () => void;
}

export function BracketPredictionModal({
  match,
  onClose,
}: BracketPredictionModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card-bg text-fifa-dark-gray shadow-lg ring-1 ring-white/10 transition-colors hover:text-foreground"
        >
          ✕
        </button>
        <KnockoutMatchCard match={match} />
      </div>
    </div>,
    document.body,
  );
}
