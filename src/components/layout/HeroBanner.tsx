import Image from "next/image";

export function HeroBanner() {
  return (
    <div className="-mx-4 -mt-6 mb-8 sm:mx-0">
      <div className="relative h-36 overflow-hidden sm:h-44 sm:rounded-2xl">
        <Image
          src="/images/wc2026-banner.jpg"
          alt="FIFA World Cup 2026"
          fill
          className="object-cover object-right"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-fifa-purple/30 to-transparent" />
      </div>
    </div>
  );
}
