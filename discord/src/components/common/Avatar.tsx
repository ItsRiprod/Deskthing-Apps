import { DeskThing } from "@deskthing/client"
import { useMemo } from "react"

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar = ({ src, alt, size = 'md', className = '' }: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const fallbackUrl = '/images/default-avatar.png';
  const url = useMemo(() => src ? DeskThing.formatImageUrl(src) : fallbackUrl, [src]);

  return (
    <img
      src={url}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover shadow-sm hover:opacity-90 transition-opacity ${className}`}
    />
  );
};

export default Avatar;