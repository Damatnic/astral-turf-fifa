import React from 'react';

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

interface AvatarFallbackProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ className = '', children }) => {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
      {children}
    </div>
  );
};

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  decoding = 'async',
}) => {
  if (!src) {
    return null;
  }

  return (
    <img
      className={`aspect-square h-full w-full object-cover ${className}`}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
    />
  );
};

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({
  className = '',
  style,
  children,
}) => {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
