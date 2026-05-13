"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const emojiCategories = [
  {
    label: "Fútbol",
    emojis: ["⚽", "🥅", "🏟️", "🏆", "🥇", "🥈", "🥉", "🎖️"],
  },
  {
    label: "Banderas",
    emojis: ["🇦🇷", "🇧🇷", "🇩🇪", "🇫🇷", "🇪🇸", "🇬🇧", "🇮🇹", "🇵🇹", "🇲🇽", "🇺🇸", "🇯🇵", "🇰🇷"],
  },
  {
    label: "Comida",
    emojis: ["🧉", "🍕", "🌭", "🍔", "🍺", "🥩", "🍷", "☕"],
  },
  {
    label: "Animales",
    emojis: ["🦁", "🐯", "🦅", "🐉", "🦊", "🐺", "🦈", "🐻"],
  },
  {
    label: "Música",
    emojis: ["🎸", "🥁", "🎹", "🎤", "🎵", "🎺", "🎻", "🎧"],
  },
  {
    label: "Objetos",
    emojis: ["🧢", "👑", "🎨", "🏄", "🌸", "🔥", "⭐", "💎", "🎯", "🚀"],
  },
];

export default function PerfilPage() {
  const user = useUser();
  const router = useRouter();
  const [selected, setSelected] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (selected === user.avatar) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: selected }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => window.location.href = "/", 1000);
      }
    } catch {}
    setSaving(false);
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
          Tu perfil
        </h1>
        <p className="mt-1 text-base text-fifa-dark-gray">
          Elegí tu avatar
        </p>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card-bg text-4xl ring-2 ring-fifa-purple/30 shadow-lg">
          {selected}
        </div>
      </div>

      {saved ? (
        <div className="rounded-xl bg-fifa-green/10 px-4 py-4 text-center">
          <span className="text-2xl">✓</span>
          <p className="mt-2 text-sm font-medium text-fifa-green">
            Avatar actualizado
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {emojiCategories.map((cat) => (
              <div key={cat.label}>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
                  {cat.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelected(emoji)}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all",
                        selected === emoji
                          ? "bg-fifa-purple/20 ring-2 ring-fifa-purple scale-110"
                          : "bg-card-bg ring-1 ring-white/5 hover:ring-white/20 hover:scale-105",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || selected === user.avatar}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-fifa-purple to-fifa-teal px-6 py-3.5 font-display text-base uppercase tracking-wider text-white shadow-lg shadow-fifa-purple/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar avatar"}
          </button>
        </>
      )}
    </div>
  );
}
