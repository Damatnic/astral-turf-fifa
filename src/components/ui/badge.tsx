import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  children: React.ReactNode;
}

const getVariantClasses = (variant: string) => {
  switch (variant) {
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    case 'destructive':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
    case 'outline':
      return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary/80';
  }
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', children }) => {
  const variantClasses = getVariantClasses(variant);

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses} ${className}`}
    >
      {children}
    </div>
  );
};
