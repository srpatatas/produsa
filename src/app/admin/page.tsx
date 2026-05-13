"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { matches } from "@/data/matches";
import { knockoutMatches } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";
import { cn } from "@/lib/utils";

function matchLabel(matchId: string): string {
  const gMatch = matches.find((m) => m.id === matchId);
  if (gMatch) {
    return `${getTeam(gMatch.homeTeamId).shortName} vs ${getTeam(gMatch.awayTeamId).shortName}`;
  }
  const kMatch = knockoutMatches.find((m) => m.id === matchId);
  if (kMatch) {
    return `${kMatch.homeSlot.label} vs ${kMatch.awaySlot.label}`;
  }
  return matchId;
}

interface AdminUser {
  id: number;
  name: string;
  invite_code: string;
  avatar: string;
  is_admin: boolean;
  registered: boolean;
  created_at: string;
}

interface UserPredictions {
  predictions: { match_id: string; outcome: string }[];
  comodines: { scope: string; match_id: string }[];
  bonus: { question_id: string; answer: string }[];
}

export default function AdminPage() {
  const user = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newAvatar, setNewAvatar] = useState("⚽");
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userPreds, setUserPreds] = useState<UserPredictions | null>(null);

  useEffect(() => {
    if (!user.is_admin) {
      router.push("/");
      return;
    }
    loadUsers();
  }, [user, router]);

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, inviteCode: newCode, avatar: newAvatar }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setNewName("");
    setNewCode("");
    setNewAvatar("⚽");
    setShowAdd(false);
    loadUsers();
  };

  const handleResetPin = async (userId: number) => {
    if (!confirm("¿Resetear PIN? El usuario tendrá que registrarse de nuevo.")) return;
    await fetch("/api/admin/reset-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadUsers();
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Se borrarán todas sus predicciones.`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadUsers();
  };

  const handleViewPredictions = async (userId: number) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
      setUserPreds(null);
      return;
    }
    setSelectedUser(userId);
    const res = await fetch(`/api/admin/user-predictions?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setUserPreds(data);
    }
  };

  if (!user.is_admin) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin
        </h1>
        <p className="mt-1 text-base text-fifa-dark-gray">
          {users.length} participantes · {users.filter((u) => u.registered).length} registrados
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-xl bg-gradient-to-r from-fifa-purple to-fifa-teal px-4 py-2 font-display text-sm uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/20 transition-all hover:brightness-110"
        >
          + Agregar participante
        </button>
        <a
          href="/api/admin/export"
          className="rounded-xl bg-white/5 px-4 py-2 font-display text-sm uppercase tracking-wider text-fifa-dark-gray ring-1 ring-white/5 transition-all hover:text-foreground hover:bg-white/10"
        >
          ⬇ Descargar pronósticos
        </a>
      </div>

      {showAdd && (
        <form onSubmit={handleAddUser} className="mb-6 space-y-3 rounded-2xl bg-card-bg p-5 ring-1 ring-white/5">
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Alias"
              className="flex-1 rounded-xl bg-surface px-4 py-2.5 text-sm text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40 placeholder:text-fifa-dark-gray/30"
              required
            />
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Usuario (ej: JUAN2026)"
              className="flex-1 rounded-xl bg-surface px-4 py-2.5 text-sm font-display uppercase tracking-wider text-foreground outline-none ring-1 ring-white/5 focus:ring-fifa-purple/40 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-fifa-red">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-xl px-4 py-2 text-sm text-fifa-dark-gray hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-fifa-purple px-4 py-2 text-sm font-medium text-white"
            >
              Agregar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-fifa-dark-gray">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id}>
              <div className="flex items-center gap-3 rounded-2xl bg-card-bg p-4 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all hover:ring-white/15">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xl">
                  {u.avatar}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {u.name}
                    </span>
                    {u.is_admin && (
                      <span className="rounded-full bg-fifa-purple/20 px-2 py-0.5 text-[9px] font-bold text-fifa-purple">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-fifa-dark-gray">
                    <span className="font-display tracking-wider">{u.invite_code}</span>
                    <span className="text-fifa-dark-gray/30">·</span>
                    <span className={u.registered ? "text-fifa-green" : "text-fifa-gold"}>
                      {u.registered ? "Registrado" : "Pendiente"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewPredictions(u.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                      selectedUser === u.id
                        ? "bg-fifa-blue/20 text-fifa-blue ring-1 ring-fifa-blue/30"
                        : "bg-white/5 text-fifa-dark-gray hover:text-foreground hover:bg-white/10",
                    )}
                  >
                    {selectedUser === u.id ? "Ocultar" : "Ver predicciones"}
                  </button>
                  <button
                    onClick={() => handleResetPin(u.id)}
                    className="rounded-xl px-3 py-1.5 text-xs font-medium bg-white/5 text-fifa-dark-gray transition-all hover:text-foreground hover:bg-white/10"
                  >
                    Resetear PIN
                  </button>
                  {!u.is_admin && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium text-fifa-red/50 transition-all hover:bg-fifa-red/10 hover:text-fifa-red"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {selectedUser === u.id && userPreds && (
                <div className="mt-1 ml-14 rounded-xl bg-surface p-4 text-xs">
                  <div className="mb-2 font-semibold text-fifa-dark-gray">
                    Predicciones ({userPreds.predictions.length})
                  </div>
                  {userPreds.predictions.length === 0 ? (
                    <p className="text-fifa-dark-gray/50">Sin predicciones</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                      {userPreds.predictions.map((p) => (
                        <div
                          key={p.match_id}
                          className="flex items-center gap-2 rounded-lg bg-card-bg px-2.5 py-1.5 ring-1 ring-white/5"
                        >
                          <span className="flex-1 truncate text-foreground">{matchLabel(p.match_id)}</span>
                          <span className={cn(
                            "flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold text-white",
                            p.outcome === "L" ? "bg-fifa-green"
                              : p.outcome === "E" ? "bg-fifa-blue"
                              : p.outcome === "V" ? "bg-fifa-red"
                              : "bg-fifa-purple",
                          )}>
                            {p.outcome}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {userPreds.comodines.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 font-semibold text-fifa-gold">Comodines</div>
                      <div className="space-y-1">
                        {userPreds.comodines.map((c) => (
                          <div key={c.scope} className="flex items-center gap-2 rounded-lg bg-fifa-gold/10 px-3 py-1.5">
                            <span className="text-fifa-gold/70">{c.scope}</span>
                            <span className="text-fifa-gold font-medium">{matchLabel(c.match_id)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {userPreds.bonus.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 font-semibold text-fifa-teal">Puntos Extra</div>
                      <div className="flex flex-wrap gap-1.5">
                        {userPreds.bonus.map((b) => (
                          <span key={b.question_id} className="rounded-lg bg-fifa-teal/10 px-2 py-1 text-fifa-teal">
                            {b.question_id}: {b.answer}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
