"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const emojiCategories = [
  { label: "Fútbol", emojis: ["⚽", "🥅", "🏟️", "🏆", "🥇", "🥈", "🥉", "🎖️"] },
  { label: "Banderas", emojis: ["🇦🇷", "🇧🇷", "🇩🇪", "🇫🇷", "🇪🇸", "🇬🇧", "🇮🇹", "🇵🇹", "🇲🇽", "🇺🇸", "🇯🇵", "🇰🇷"] },
  { label: "Comida", emojis: ["🧉", "🍕", "🌭", "🍔", "🍺", "🥩", "🍷", "☕"] },
  { label: "Animales", emojis: ["🦁", "🐯", "🦅", "🐉", "🦊", "🐺", "🦈", "🐻"] },
  { label: "Música", emojis: ["🎸", "🥁", "🎹", "🎤", "🎵", "🎺", "🎻", "🎧"] },
  { label: "Objetos", emojis: ["🧢", "👑", "🎨", "🏄", "🌸", "🔥", "⭐", "💎", "🎯", "🚀"] },
];

export default function MiCuentaPage() {
  const router = useRouter();
  const user = useUser();

  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  const [error, setError] = useState("");

  const profileChanged = name.trim() !== user.name || selectedAvatar !== user.avatar;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!profileChanged) return;
    setProfileSaving(true);
    try {
      const promises = [];
      if (name.trim() !== user.name) {
        promises.push(fetch("/api/auth/update-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }));
      }
      if (selectedAvatar !== user.avatar) {
        promises.push(fetch("/api/auth/update-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: selectedAvatar }),
        }));
      }
      const results = await Promise.all(promises);
      if (results.some((r) => !r.ok)) {
        setError("Error al guardar");
        return;
      }
      setProfileSaved(true);
      setTimeout(() => window.location.href = "/cambiar-pin", 1000);
    } catch {
      setError("Error de conexión");
    } finally {
      setProfileSaving(false);
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
      if (!res.ok) { setError(data.error); return; }
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

      {/* Profile: Avatar + Name */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
          Perfil
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-3xl ring-2 transition-all",
                showEmojiPicker
                  ? "ring-fifa-purple scale-110"
                  : "ring-white/10 hover:ring-fifa-purple/50 hover:scale-105",
              )}
            >
              {selectedAvatar}
            </button>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setProfileSaved(false); }}
              className="flex-1 rounded-xl bg-card-bg px-4 py-3 text-foreground outline-none ring-1 ring-white/5 transition-all focus:ring-fifa-purple/40"
            />
          </div>

          {showEmojiPicker && (
            <div className="rounded-xl bg-card-bg p-4 ring-1 ring-white/5 space-y-3">
              {emojiCategories.map((cat) => (
                <div key={cat.label}>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-fifa-dark-gray">
                    {cat.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => { setSelectedAvatar(emoji); setProfileSaved(false); }}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all",
                          selectedAvatar === emoji
                            ? "bg-fifa-purple/20 ring-2 ring-fifa-purple scale-110"
                            : "bg-surface ring-1 ring-white/5 hover:ring-white/20 hover:scale-105",
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving || !profileChanged}
            className="w-full rounded-xl bg-fifa-purple px-4 py-2.5 font-display text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-30"
          >
            {profileSaving ? "Guardando..." : profileSaved ? "✓ Perfil actualizado" : "Guardar"}
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
            <p className="mt-2 text-sm font-medium text-fifa-green">PIN actualizado</p>
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
