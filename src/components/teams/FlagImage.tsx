import Image from "next/image";

interface FlagImageProps {
  code: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const config = {
  sm: { width: 24, height: 18, cdn: 40 },
  md: { width: 32, height: 24, cdn: 80 },
  lg: { width: 48, height: 36, cdn: 80 },
  xl: { width: 64, height: 48, cdn: 160 },
};

export function FlagImage({ code, name, size = "md" }: FlagImageProps) {
  const { width, height, cdn } = config[size];
  const src = `https://flagcdn.com/w${cdn}/${code.toLowerCase()}.png`;

  return (
    <Image
      src={src}
      alt={`Bandera de ${name}`}
      width={width}
      height={height}
      className="rounded-sm object-cover shadow-sm"
    />
  );
}
