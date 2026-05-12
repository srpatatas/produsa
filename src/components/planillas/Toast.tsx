"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 md:bottom-8">
      <div className="animate-[fadeInUp_0.3s_ease-out] rounded-xl bg-fifa-purple px-4 py-2.5 text-xs font-medium text-white shadow-xl shadow-fifa-purple/30">
        {message}
      </div>
    </div>
  );
}
