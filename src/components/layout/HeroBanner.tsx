import Image from "next/image";

interface HeroBannerProps {
  subtitle?: string;
}

export function HeroBanner({ subtitle }: HeroBannerProps) {
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
      {subtitle && (
        <p className="mt-4 text-sm text-fifa-dark-gray">{subtitle}</p>
      )}
    </div>
  );
}
