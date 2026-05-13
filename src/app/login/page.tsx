"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [inviteCode, setInviteCode] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { inviteCode, pin }
        : { inviteCode, pin, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/images/wc2026-logo.png"
            alt="FIFA World Cup 2026"
            width={80}
            height={80}
          />
          <h1 className="font-title text-3xl text-foreground">PRODUSA</h1>
          <p className="text-sm text-fifa-dark-gray">
            Copa del Mundo FIFA 2026
          </p>
        </div>

        <div className="flex rounded-full bg-surface p-1 ring-1 ring-white/5">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={cn(
              "flex-1 rounded-full px-4 py-2.5 font-display text-base uppercase tracking-wider transition-all",
              mode === "login"
                ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
                : "text-fifa-dark-gray hover:text-foreground",
            )}
          >
            Entrar
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={cn(
              "flex-1 rounded-full px-4 py-2.5 font-display text-base uppercase tracking-wider transition-all",
              mode === "register"
                ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
                : "text-fifa-dark-gray hover:text-foreground",
            )}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Fede"
                className="w-full rounded-xl bg-card-bg px-4 py-3 text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40 placeholder:text-fifa-dark-gray/30"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
              Código de invitación
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ej: FEDE2026"
              className="w-full rounded-xl bg-card-bg px-4 py-3 font-display text-lg uppercase tracking-widest text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40 placeholder:text-fifa-dark-gray/30 placeholder:text-base placeholder:tracking-normal placeholder:normal-case placeholder:font-sans"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
              PIN (4 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="····"
              className="w-full rounded-xl bg-card-bg px-4 py-3 text-center font-display text-2xl tracking-[0.5em] text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40 placeholder:tracking-[0.3em]"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-fifa-red/10 px-4 py-2.5 text-center text-sm text-fifa-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-fifa-purple to-fifa-teal px-6 py-3.5 font-display text-base uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading
              ? "Cargando..."
              : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-fifa-dark-gray/50">
          {mode === "login"
            ? "¿Primera vez? Tocá Registrarse arriba."
            : "¿Ya tenés cuenta? Tocá Entrar arriba."}
        </p>
      </div>
    </div>
  );
}
