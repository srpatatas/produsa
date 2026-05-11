import Image from "next/image";

interface HeroBannerProps {
  subtitle?: string;
}

export function HeroBanner({ subtitle }: HeroBannerProps) {
  return (
    <div className="-mx-4 -mt-6 mb-6 sm:mx-0">
      <div className="relative h-32 overflow-hidden rounded-b-2xl sm:h-40 sm:rounded-2xl">
        <Image
          src="/images/wc2026-banner.jpg"
          alt="FIFA World Cup 2026"
          fill
          className="object-cover object-right"
          priority
        />
      </div>
      {subtitle && (
        <p className="mt-3 px-1 text-sm text-fifa-dark-gray">{subtitle}</p>
      )}
    </div>
  );
}
