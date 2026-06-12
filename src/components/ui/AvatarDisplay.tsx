import Image from "next/image";

interface AvatarDisplayProps {
  avatar: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-xl",
  lg: "h-11 w-11 text-xl",
};

export function AvatarDisplay({ avatar, size = "md", className = "" }: AvatarDisplayProps) {
  const isImage = avatar.startsWith("http");
  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative flex flex-shrink-0 items-center justify-center rounded-full bg-surface overflow-hidden ${sizeClass} ${className}`}>
      {isImage ? (
        <Image src={avatar} alt="Avatar" fill className="object-cover" />
      ) : (
        avatar
      )}
    </div>
  );
}
