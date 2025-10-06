import React from 'react';
import { ResponsiveContainer } from './AdaptiveLayout.tsx';

export interface ResponsivePageProps {
  children: React.ReactNode;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  noPadding?: boolean;
  className?: string;
}

/**
 * ResponsivePage - Consistent page wrapper with responsive container
 *
 * Provides:
 * - Responsive max-width container
 * - Optional page title with responsive sizing
 * - Configurable padding
 * - Custom className support
 */
export const ResponsivePage: React.FC<ResponsivePageProps> = ({
  children,
  title,
  maxWidth = 'xl',
  noPadding = false,
  className = '',
}) => {
  return (
    <ResponsiveContainer maxWidth={maxWidth} noPadding={noPadding} className={className}>
      {title && (
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-teal-400 mb-4 sm:mb-6 md:mb-8">
          {title}
        </h1>
      )}
      {children}
    </ResponsiveContainer>
  );
};
