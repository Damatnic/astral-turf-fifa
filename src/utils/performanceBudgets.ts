/**
 * Performance Budget Configuration
 *
 * Defines size limits for different resource types to ensure
 * fast load times and optimal performance.
 */

export const PERFORMANCE_BUDGETS = {
  // JavaScript budgets (in bytes)
  javascript: {
    main: 200 * 1024, // 200 KB for main bundle
    vendor: 300 * 1024, // 300 KB for vendor code
    chunk: 100 * 1024, // 100 KB per route chunk
    total: 600 * 1024, // 600 KB total JS
  },

  // CSS budgets (in bytes)
  css: {
    main: 50 * 1024, // 50 KB main stylesheet
    total: 75 * 1024, // 75 KB total CSS
  },

  // Image budgets (in bytes)
  images: {
    hero: 200 * 1024, // 200 KB for hero images
    thumbnail: 50 * 1024, // 50 KB for thumbnails
    icon: 10 * 1024, // 10 KB for icons
    total: 1 * 1024 * 1024, // 1 MB total images
  },

  // Font budgets (in bytes)
  fonts: {
    perFont: 50 * 1024, // 50 KB per font file
    total: 150 * 1024, // 150 KB total fonts
  },

  // Overall budget
  overall: {
    total: 1 * 1024 * 1024, // 1 MB total page weight
    gzipped: 350 * 1024, // 350 KB gzipped
  },

  // Performance metrics (in milliseconds)
  metrics: {
    FCP: 1500, // First Contentful Paint < 1.5s
    LCP: 2500, // Largest Contentful Paint < 2.5s
    TTI: 3500, // Time to Interactive < 3.5s
    FID: 100, // First Input Delay < 100ms
    CLS: 0.1, // Cumulative Layout Shift < 0.1
    TTFB: 600, // Time to First Byte < 600ms
  },

  // Network conditions for testing
  networkConditions: {
    '4G': {
      downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
      uploadThroughput: (1 * 1024 * 1024) / 8, // 1 Mbps
      latency: 20, // 20ms
    },
    '3G': {
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
      uploadThroughput: (750 * 1024) / 8, // 750 Kbps
      latency: 150, // 150ms
    },
    'Slow 3G': {
      downloadThroughput: (500 * 1024) / 8, // 500 Kbps
      uploadThroughput: (500 * 1024) / 8, // 500 Kbps
      latency: 400, // 400ms
    },
  },
};

/**
 * Check if a bundle size is within budget
 */
export function isWithinBudget(size: number, budget: number): boolean {
  return size <= budget;
}

/**
 * Calculate budget usage percentage
 */
export function getBudgetUsage(size: number, budget: number): number {
  return Math.round((size / budget) * 100);
}

/**
 * Get budget status
 */
export function getBudgetStatus(size: number, budget: number): 'pass' | 'warn' | 'fail' {
  const percentage = getBudgetUsage(size, budget);

  if (percentage <= 80) {
    return 'pass';
  } // Green: under 80%
  if (percentage <= 100) {
    return 'warn';
  } // Yellow: 80-100%
  return 'fail'; // Red: over 100%
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Estimate gzip compression ratio
 */
export function estimateGzipRatio(fileType: 'js' | 'css' | 'html' | 'json'): number {
  const ratios = {
    js: 0.33, // ~67% compression
    css: 0.25, // ~75% compression
    html: 0.3, // ~70% compression
    json: 0.2, // ~80% compression
  };

  return ratios[fileType] || 0.4;
}

/**
 * Calculate estimated load time
 */
export function estimateLoadTime(
  sizeBytes: number,
  network: keyof typeof PERFORMANCE_BUDGETS.networkConditions,
): number {
  const conditions = PERFORMANCE_BUDGETS.networkConditions[network];
  const downloadTime = (sizeBytes / conditions.downloadThroughput) * 1000; // ms
  const totalTime = downloadTime + conditions.latency;

  return Math.round(totalTime);
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(bundles: {
  js: number;
  css: number;
  images: number;
  fonts: number;
}): {
  status: 'pass' | 'warn' | 'fail';
  budgets: Array<{
    name: string;
    size: number;
    budget: number;
    status: 'pass' | 'warn' | 'fail';
    percentage: number;
  }>;
  recommendations: string[];
} {
  const { js, css, images, fonts } = bundles;
  const total = js + css + images + fonts;

  const budgets = [
    {
      name: 'JavaScript',
      size: js,
      budget: PERFORMANCE_BUDGETS.javascript.total,
      status: getBudgetStatus(js, PERFORMANCE_BUDGETS.javascript.total),
      percentage: getBudgetUsage(js, PERFORMANCE_BUDGETS.javascript.total),
    },
    {
      name: 'CSS',
      size: css,
      budget: PERFORMANCE_BUDGETS.css.total,
      status: getBudgetStatus(css, PERFORMANCE_BUDGETS.css.total),
      percentage: getBudgetUsage(css, PERFORMANCE_BUDGETS.css.total),
    },
    {
      name: 'Images',
      size: images,
      budget: PERFORMANCE_BUDGETS.images.total,
      status: getBudgetStatus(images, PERFORMANCE_BUDGETS.images.total),
      percentage: getBudgetUsage(images, PERFORMANCE_BUDGETS.images.total),
    },
    {
      name: 'Fonts',
      size: fonts,
      budget: PERFORMANCE_BUDGETS.fonts.total,
      status: getBudgetStatus(fonts, PERFORMANCE_BUDGETS.fonts.total),
      percentage: getBudgetUsage(fonts, PERFORMANCE_BUDGETS.fonts.total),
    },
    {
      name: 'Total',
      size: total,
      budget: PERFORMANCE_BUDGETS.overall.total,
      status: getBudgetStatus(total, PERFORMANCE_BUDGETS.overall.total),
      percentage: getBudgetUsage(total, PERFORMANCE_BUDGETS.overall.total),
    },
  ];

  // Overall status
  const overallStatus = budgets.some(b => b.status === 'fail')
    ? 'fail'
    : budgets.some(b => b.status === 'warn')
      ? 'warn'
      : 'pass';

  // Generate recommendations
  const recommendations: string[] = [];

  if (js > PERFORMANCE_BUDGETS.javascript.total) {
    recommendations.push(
      '🔴 JavaScript bundle is too large. Consider code splitting, tree shaking, or removing unused dependencies.',
    );
  }
  if (css > PERFORMANCE_BUDGETS.css.total) {
    recommendations.push(
      '🔴 CSS bundle is too large. Consider purging unused styles or splitting CSS.',
    );
  }
  if (images > PERFORMANCE_BUDGETS.images.total) {
    recommendations.push(
      '🔴 Images are too large. Consider WebP format, compression, or lazy loading.',
    );
  }
  if (fonts > PERFORMANCE_BUDGETS.fonts.total) {
    recommendations.push(
      '🔴 Fonts are too large. Consider subsetting, WOFF2 format, or reducing font weights.',
    );
  }
  if (total > PERFORMANCE_BUDGETS.overall.total) {
    recommendations.push(
      '🔴 Overall page weight exceeds budget. Implement aggressive optimization strategies.',
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All bundles are within performance budgets!');
  }

  return {
    status: overallStatus,
    budgets,
    recommendations,
  };
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(report: ReturnType<typeof generatePerformanceReport>): void {
  console.log('\n📊 Performance Budget Report\n');
  console.log('━'.repeat(80));

  report.budgets.forEach(budget => {
    const icon = budget.status === 'pass' ? '✅' : budget.status === 'warn' ? '⚠️' : '❌';
    const size = formatBytes(budget.size);
    const budgetSize = formatBytes(budget.budget);

    console.log(`\n${icon} ${budget.name}`);
    console.log(`   Size: ${size} / ${budgetSize} (${budget.percentage}%)`);

    if (budget.status !== 'pass') {
      const overage = budget.size - budget.budget;
      console.log(`   Overage: ${formatBytes(overage)}`);
    }
  });

  console.log('\n━'.repeat(80));
  console.log('\n💡 Recommendations:\n');
  report.recommendations.forEach(rec => console.log(`   ${rec}`));
  console.log('\n━'.repeat(80));
  console.log(`\n📈 Overall Status: ${report.status.toUpperCase()}\n`);
}
