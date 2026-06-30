"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const ALBERTITO_PHRASES = [
  "Los alemanes tienen la Oktoberfest, yo la Olivosfest. No debió haberse hecho, Fabiola...",
  "Holanda está un tercio bajo el nivel del mar. A mi me hundió la pandemia, la sequía y Macri.",
  "Es una mierda de partido, seguro lo produjo Sandra.",
  "Por culpa de Marruecos no clasificó Escocia...qué ganas de un whisky",
  "¿Me amás?",
  "Decime algo lindooooo",
  "Se nota que los mexicanos salieron de los indios...",
  "Heredamos este partido y lo estamos reconstruyendo",
];

const LUCAS_PHRASES = [
  "Creo que hablo por todos cuando digo que este partido necesita más acción",
  "Que puse, Oso?",
  "Polo primero como siempre. El juez siempre gana. Hay tongo mal",
  "GOOOOL! GOOOL! Ah no, me confundí. Pero mirá la cara de Polo...",
  "Es mi cumpleaños y el admin me puso de comodín. No sé si es un regalo o un castigo",
  "Hice las cuentas y es matemáticamente imposible alcanzar a Polo con este resultado",
  "SE RINDEN???",
  "Ser celíaco y de Argentina te prepara para sufrir. En la mesa y en el prode",
  "Profesional secret",
  "Que puse en este partido? Alguien se fija?",
];

const lock = { holder: null as string | null, until: 0 };

function CommentatorDock({ name, image, phrases, side }: { name: string; image: string; phrases: string[]; side: "left" | "right" }) {
  const [phrase, setPhrase] = useState("");
  const [visible, setVisible] = useState(false);
  const idx = useRef(0);
  const isLeft = side === "left";

  useEffect(() => {
    function canSpeak() {
      return lock.holder === null || lock.holder === side || Date.now() > lock.until;
    }

    function tryShow() {
      if (!canSpeak()) return;
      const text = phrases[idx.current % phrases.length];
      idx.current++;
      const duration = Math.min(Math.max(text.length * 80, 6000), 14000);
      lock.holder = side;
      lock.until = Date.now() + duration + 2000;
      setPhrase(text);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        if (lock.holder === side) { lock.holder = null; lock.until = 0; }
      }, duration);
    }

    const offset = side === "left" ? 3000 : 0;
    const timer = setTimeout(tryShow, offset);
    const interval = setInterval(tryShow, 15000 + Math.random() * 10000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  return (
    <div className={`absolute bottom-3 ${isLeft ? "left-3" : "right-3"} flex items-end gap-2 z-10 ${isLeft ? "flex-row-reverse" : ""}`}>
      <div className={`max-w-[180px] transition-all duration-300 ${visible && phrase ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className="relative rounded-xl bg-black/50 backdrop-blur-sm px-2.5 py-1.5 ring-1 ring-fifa-gold/30">
          <p className="text-[9px] text-fifa-gold italic leading-tight">
            &ldquo;{phrase}&rdquo;
          </p>
          <div className={`absolute ${isLeft ? "-left-1" : "-right-1"} bottom-2 h-2 w-2 rotate-45 bg-black/50 ring-1 ring-fifa-gold/30`} style={{ clipPath: isLeft ? "polygon(0 0, 0 100%, 100% 100%)" : "polygon(100% 0, 0 100%, 100% 100%)" }} />
        </div>
      </div>
      <div className="relative h-9 w-9 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-fifa-gold shadow-lg shadow-amber-500/20">
        <Image src={image} alt={name} fill className="object-cover" />
      </div>
    </div>
  );
}

export default function TestDualPage() {
  const [minute, setMinute] = useState(1);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setMinute((m) => Math.min(m + 1, 90)), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-4 p-4">
      <div className="flex gap-2 mb-2">
        <button onClick={() => setHomeScore((s) => s + 1)} className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white">+1 NED</button>
        <button onClick={() => setAwayScore((s) => s + 1)} className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white">+1 MAR</button>
        <button onClick={() => { setHomeScore(0); setAwayScore(0); setMinute(1); }} className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white">Reset</button>
      </div>

      <div className="w-full max-w-md">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] p-6 ring-1 ring-white/10 shadow-2xl overflow-hidden" style={{ minHeight: 220 }}>
          <div className="text-center mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">R32 · En vivo</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-3xl">🇳🇱</span>
              <span className="font-bold text-white text-sm">NED</span>
            </div>
            <div className="text-center px-4">
              <span className="font-bold text-white text-3xl">{homeScore} - {awayScore}</span>
              <div className="text-[10px] text-gray-500 mt-1">{minute}&apos;</div>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <span className="text-3xl">🇲🇦</span>
              <span className="font-bold text-white text-sm">MAR</span>
            </div>
          </div>

          <CommentatorDock name="Dr. Lucas Almoño" image="/images/comodin-tia-birthday.jpg" phrases={LUCAS_PHRASES} side="left" />
          <CommentatorDock name="Albertito" image="/images/comodin-R32.jpg" phrases={ALBERTITO_PHRASES} side="right" />
        </div>
      </div>
    </div>
  );
}
