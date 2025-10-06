/**
 * Skip Links Component
 *
 * Provides keyboard-accessible skip links for easier navigation
 * These links are visually hidden but appear on focus
 * Complies with WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */

import React from 'react';

interface SkipLink {
  href: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
];

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

/**
 * SkipLinks Component
 *
 * @example
 * ```tsx
 * <SkipLinks />
 * // Or with custom links:
 * <SkipLinks links={[
 *   { href: '#main', label: 'Skip to main' },
 *   { href: '#search', label: 'Skip to search' },
 * ]} />
 * ```
 */
export function SkipLinks({ links = defaultSkipLinks, className = '' }: SkipLinksProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: skipLinksInlineStyles }} />
      <nav aria-label="Skip links" className={`skip-links ${className}`} role="navigation">
        {links.map(link => (
          <a
            key={link.href}
            href={link.href}
            className="skip-link"
            onClick={e => {
              e.preventDefault();
              const target = document.querySelector(link.href);
              if (target instanceof HTMLElement) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </>
  );
}

/**
 * Inline styles for skip links
 */
const skipLinksInlineStyles = `
  .skip-links {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
  }

  .skip-link {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    padding: 0.5rem 1rem;
    background: #2563eb;
    color: white;
    text-decoration: none;
    font-weight: 600;
    border-radius: 0 0 4px 0;
    transition: all 0.2s ease;
  }

  .skip-link:focus {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    outline: 2px solid #1e40af;
    outline-offset: 2px;
  }

  .skip-link:hover:focus {
    background: #1e40af;
  }
`;

/**
 * CSS classes for skip links (if not using styled-jsx)
 */
export const skipLinksStyles = `
  .skip-links {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
  }

  .skip-link {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    padding: 0.5rem 1rem;
    background: #2563eb;
    color: white;
    text-decoration: none;
    font-weight: 600;
    border-radius: 0 0 4px 0;
    transition: all 0.2s ease;
  }

  .skip-link:focus {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    outline: 2px solid #1e40af;
    outline-offset: 2px;
  }

  .skip-link:hover:focus {
    background: #1e40af;
  }
`;

export default SkipLinks;
