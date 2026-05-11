import Image from "next/image";
import { getFlagUrl } from "@/data/flags";

interface FlagImageProps {
  code: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const dimensions = {
  sm: { width: 24, height: 18 },
  md: { width: 32, height: 24 },
  lg: { width: 48, height: 36 },
  xl: { width: 64, height: 48 },
};

export function FlagImage({ code, name, size = "md" }: FlagImageProps) {
  const { width, height } = dimensions[size];

  return (
    <Image
      src={getFlagUrl(code, width * 2)}
      alt={`Bandera de ${name}`}
      width={width}
      height={height}
      className="rounded-sm object-cover shadow-sm"
    />
  );
}
