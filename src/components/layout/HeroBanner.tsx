import Image from "next/image";

export function HeroBanner() {
  return (
    <div className="hidden sm:block -mx-4 -mt-6 mb-8 sm:mx-0">
      <div className="relative h-28 overflow-hidden sm:rounded-2xl">
        <Image
          src="/images/wc2026-banner.jpg"
          alt="FIFA World Cup 2026"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-fifa-purple/30 to-transparent" />
      </div>
    </div>
  );
}
