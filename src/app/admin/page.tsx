"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminMatchSettingsTab } from "@/components/admin/AdminMatchSettingsTab";
import { AdminResultsTab } from "@/components/admin/AdminResultsTab";
import { AdminBonusTab } from "@/components/admin/AdminBonusTab";

export default function AdminPage() {
  const user = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "matches" | "results" | "bonus">("users");
  const [resultStatus, setResultStatus] = useState<"idle" | "saved" | "error">("idle");

  const flashStatus = (status: "saved" | "error") => {
    setResultStatus(status);
    setTimeout(() => setResultStatus("idle"), 2500);
  };

  useEffect(() => {
    if (!user.is_admin) {
      router.push("/");
    }
  }, [user, router]);

  if (!user.is_admin) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin
        </h1>
      </div>

      {/* Admin tabs */}
      <div className="mb-6 flex rounded-full bg-surface p-1 ring-1 ring-white/5">
        {(["users", "matches", "results", "bonus"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full px-4 py-2 font-display text-sm uppercase tracking-wider transition-all",
              tab === t
                ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
                : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10 cursor-pointer",
            )}
          >
            {t === "users" ? "Participantes" : t === "matches" ? "Partidos" : t === "results" ? "Resultados" : "Puntos Extra"}
          </button>
        ))}
      </div>

      {tab === "users" && <AdminUsersTab flashStatus={flashStatus} />}
      {tab === "matches" && <AdminMatchSettingsTab flashStatus={flashStatus} />}
      {tab === "results" && <AdminResultsTab flashStatus={flashStatus} />}
      {tab === "bonus" && <AdminBonusTab flashStatus={flashStatus} />}

      {resultStatus !== "idle" && (
        <div className="fixed bottom-28 left-1/2 z-[90] -translate-x-1/2 md:bottom-8">
          <div className={cn(
            "rounded-xl px-4 py-2 text-xs font-medium shadow-xl",
            resultStatus === "saved" ? "bg-fifa-green/90 text-white" : "bg-fifa-red/90 text-white",
          )}>
            {resultStatus === "saved" ? "✓ Guardado" : "✗ Error al guardar"}
          </div>
        </div>
      )}
    </div>
  );
}
