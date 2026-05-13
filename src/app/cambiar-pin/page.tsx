"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CambiarPinPage() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPin !== confirmPin) {
      setError("Los PINs no coinciden");
      return;
    }

    setLoading(true);
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

      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
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
          Cambiar PIN
        </h1>
        <p className="mt-1 text-base text-fifa-dark-gray">
          Actualizá tu PIN de 4 dígitos
        </p>
      </div>

      {success ? (
        <div className="rounded-xl bg-fifa-green/10 px-4 py-4 text-center">
          <span className="text-2xl">✓</span>
          <p className="mt-2 text-sm font-medium text-fifa-green">
            PIN actualizado correctamente
          </p>
          <p className="mt-1 text-xs text-fifa-dark-gray">
            Redirigiendo...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
              PIN actual
            </label>
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
              Nuevo PIN
            </label>
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
              Confirmar nuevo PIN
            </label>
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
            {loading ? "Actualizando..." : "Actualizar PIN"}
          </button>
        </form>
      )}
    </div>
  );
}
