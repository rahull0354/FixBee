'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  className?: string;
}

export function UserAvatar({ src, alt, name, className }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Get initials from name
  const getInitials = (userName: string) => {
    const parts = userName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Get background color based on name
  const getColorClass = (userName: string) => {
    const colors = [
      'bg-sky-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
    ];
    const index = userName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const displayName = name || 'User';
  const initials = getInitials(displayName);
  const colorClass = getColorClass(displayName);

  return (
    <Avatar className={className}>
      {src && !imageError ? (
        <AvatarImage
          src={src}
          alt={alt || displayName}
          onError={() => setImageError(true)}
        />
      ) : null}
      <AvatarFallback className={cn(colorClass, 'text-white font-semibold')}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
