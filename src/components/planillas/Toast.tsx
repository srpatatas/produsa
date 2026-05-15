"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 1000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isSuccess = message.startsWith("✓");
  const isError = message.startsWith("✗");

  return (
    <div className="fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 md:bottom-8">
      <div className={cn(
        "animate-[fadeInUp_0.3s_ease-out] rounded-xl px-4 py-2.5 text-xs font-medium text-white shadow-xl",
        isSuccess ? "bg-fifa-green/90 shadow-fifa-green/30"
          : isError ? "bg-fifa-red/90 shadow-fifa-red/30"
          : "bg-fifa-purple shadow-fifa-purple/30",
      )}>
        {message}
      </div>
    </div>
  );
}
