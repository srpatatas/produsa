"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function MiCuentaPage() {
  const router = useRouter();
  const user = useUser();

  // Name
  const [name, setName] = useState(user.name);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  // PIN
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  const [error, setError] = useState("");

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim() === user.name) return;
    setNameSaving(true);
    try {
      const res = await fetch("/api/auth/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      setNameSaved(true);
      setTimeout(() => window.location.href = "/cambiar-pin", 1500);
    } catch {
      setError("Error de conexión");
    } finally {
      setNameSaving(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPin !== confirmPin) {
      setError("Los PINs no coinciden");
      return;
    }
    setPinSaving(true);
    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setPinSaved(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setTimeout(() => setPinSaved(false), 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-fifa-purple/10 px-4 py-1.5 font-display text-sm tracking-wider text-fifa-purple transition-colors hover:bg-fifa-purple/20"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Mi cuenta
        </h1>
        <p className="mt-1 text-base text-fifa-dark-gray">
          {user.invite_code}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-fifa-red/10 px-4 py-2.5 text-center text-sm text-fifa-red">
          {error}
        </div>
      )}

      {/* Name section */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
          Nombre
        </h2>
        <form onSubmit={handleNameSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameSaved(false); }}
            className="w-full rounded-xl bg-card-bg px-4 py-3 text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40"
          />
          <button
            type="submit"
            disabled={nameSaving || name.trim() === user.name}
            className="w-full rounded-xl bg-fifa-purple px-4 py-2.5 font-display text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-30"
          >
            {nameSaving ? "Guardando..." : nameSaved ? "✓ Nombre actualizado" : "Guardar nombre"}
          </button>
        </form>
      </div>

      {/* PIN section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
          Cambiar PIN
        </h2>
        {pinSaved ? (
          <div className="rounded-xl bg-fifa-green/10 px-4 py-4 text-center">
            <span className="text-2xl">✓</span>
            <p className="mt-2 text-sm font-medium text-fifa-green">
              PIN actualizado
            </p>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-fifa-dark-gray">PIN actual</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="····"
                className="w-full rounded-xl bg-card-bg px-4 py-3 text-center font-display text-2xl tracking-[0.5em] text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40 placeholder:tracking-[0.3em]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fifa-dark-gray">Nuevo PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="····"
                className="w-full rounded-xl bg-card-bg px-4 py-3 text-center font-display text-2xl tracking-[0.5em] text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40 placeholder:tracking-[0.3em]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fifa-dark-gray">Confirmar nuevo PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="····"
                className="w-full rounded-xl bg-card-bg px-4 py-3 text-center font-display text-2xl tracking-[0.5em] text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40 placeholder:tracking-[0.3em]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={pinSaving}
              className="w-full rounded-xl bg-fifa-purple px-4 py-2.5 font-display text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {pinSaving ? "Actualizando..." : "Actualizar PIN"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
