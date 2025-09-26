/**
 * SEO Head Component
 * Provides comprehensive SEO meta tags, Open Graph, Twitter Cards, and JSON-LD
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
  noFollow?: boolean;
}

const DEFAULT_SEO = {
  title: 'Astral Turf - AI-Powered Soccer Management',
  description: 'Professional soccer tactical planner and franchise simulator. Create formations, manage players, and get AI-driven insights for your team.',
  keywords: [
    'soccer management',
    'football tactics',
    'tactical planner',
    'soccer simulator',
    'football manager',
    'AI coaching',
    'team management',
    'soccer formations',
    'sports analytics',
    'tactical analysis',
  ],
  ogImage: '/og-image.png',
  ogType: 'website' as const,
  twitterCard: 'summary_large_image' as const,
  author: 'Astral Turf',
};

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = DEFAULT_SEO.ogType,
  twitterCard = DEFAULT_SEO.twitterCard,
  author,
  publishedTime,
  modifiedTime,
  jsonLd,
  noIndex = false,
  noFollow = false,
}) => {
  const seoTitle = title ? `${title} | Astral Turf` : DEFAULT_SEO.title;
  const seoDescription = description || DEFAULT_SEO.description;
  const seoKeywords = [...DEFAULT_SEO.keywords, ...keywords].join(', ');
  const seoImage = ogImage || DEFAULT_SEO.ogImage;
  const seoAuthor = author || DEFAULT_SEO.author;

  // Get current URL for canonical and Open Graph
  const currentUrl = typeof window !== 'undefined'
    ? window.location.href
    : canonicalUrl || 'https://astral-turf.vercel.app';

  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
    'noarchive',
    'nosnippet',
  ].join(', ');

  // Default JSON-LD structured data
  const defaultJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Astral Turf',
    description: seoDescription,
    url: currentUrl,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'Astral Productions',
    },
    featureList: [
      'AI-powered tactical analysis',
      'Interactive formation builder',
      'Player management system',
      'Match simulation',
      'Performance analytics',
      'Team communication tools',
    ],
  };

  const structuredData = jsonLd || defaultJsonLd;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="author" content={seoAuthor} />
      <meta name="robots" content={robotsContent} />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:alt" content={`${seoTitle} - Screenshot`} />
      <meta property="og:site_name" content="Astral Turf" />
      <meta property="og:locale" content="en_US" />

      {/* Article-specific Open Graph tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:image:alt" content={`${seoTitle} - Screenshot`} />
      <meta name="twitter:site" content="@AstralTurf" />
      <meta name="twitter:creator" content="@AstralTurf" />

      {/* Additional Meta Tags for Web Apps */}
      <meta name="application-name" content="Astral Turf" />
      <meta name="apple-mobile-web-app-title" content="Astral Turf" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#0f172a" />
      <meta name="msapplication-TileColor" content="#0f172a" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://generativelanguage.googleapis.com" />

      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="https://vercel.com" />
      <link rel="dns-prefetch" href="https://vitejs.dev" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>

      {/* Additional performance hints */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />

      {/* Security headers (backup for server headers) */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
    </Helmet>
  );
};

// Pre-configured SEO components for common pages
export const LandingPageSEO: React.FC = () => (
  <SEOHead
    title="AI-Powered Soccer Management Platform"
    description="Create tactical formations, manage players, and simulate matches with AI-driven insights. The ultimate soccer management experience."
    keywords={['soccer management game', 'football tactics simulator', 'AI soccer coach']}
  />
);

export const LoginPageSEO: React.FC = () => (
  <SEOHead
    title="Login"
    description="Sign in to your Astral Turf account and continue managing your soccer team."
    noIndex={true}
  />
);

export const DashboardSEO: React.FC = () => (
  <SEOHead
    title="Dashboard"
    description="Your soccer management dashboard with team overview, recent matches, and performance analytics."
    noIndex={true}
  />
);

export const TacticsBoardSEO: React.FC = () => (
  <SEOHead
    title="Tactics Board"
    description="Interactive soccer tactics board for creating and analyzing formations with AI assistance."
    keywords={['soccer tactics board', 'formation builder', 'tactical analysis']}
  />
);
