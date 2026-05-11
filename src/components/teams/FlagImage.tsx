import Image from "next/image";

interface FlagImageProps {
  code: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const config = {
  sm: { width: 24, height: 16, cdn: 40 },
  md: { width: 32, height: 22, cdn: 80 },
  lg: { width: 48, height: 32, cdn: 80 },
  xl: { width: 64, height: 43, cdn: 160 },
};

export function FlagImage({ code, name, size = "md" }: FlagImageProps) {
  const { width, height, cdn } = config[size];
  const src = `https://flagcdn.com/w${cdn}/${code.toLowerCase()}.png`;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-sm shadow-sm"
      style={{ width, height }}
    >
      <Image
        src={src}
        alt={`Bandera de ${name}`}
        fill
        className="object-cover"
      />
    </div>
  );
}
