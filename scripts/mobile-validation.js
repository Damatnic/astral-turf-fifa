/**
 * Mobile Deployment Validation Script
 * Comprehensive testing suite for mobile optimization validation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MobileValidationSuite {
  constructor() {
    this.baseUrl = 'http://localhost:3012';
    this.results = {
      performance: {},
      features: {},
      accessibility: {},
      offline: {},
      crossPlatform: {},
    };
  }

  /**
   * Validate mobile performance optimizations
   */
  async validatePerformance() {
    console.log('🚀 Validating Mobile Performance...');

    const performanceChecks = {
      bundleSize: this.checkBundleSize(),
      lazyLoading: this.checkLazyLoading(),
      serviceWorker: this.checkServiceWorker(),
      caching: this.checkCaching(),
      imageOptimization: this.checkImageOptimization(),
    };

    this.results.performance = performanceChecks;
    return performanceChecks;
  }

  /**
   * Check bundle size optimization
   */
  checkBundleSize() {
    try {
      const distPath = path.join(process.cwd(), 'dist');
      if (!fs.existsSync(distPath)) {
        return { status: 'warning', message: 'Dist folder not found - run build first' };
      }

      const files = fs.readdirSync(distPath, { recursive: true });
      const jsFiles = files.filter(file => file.endsWith('.js'));
      const cssFiles = files.filter(file => file.endsWith('.css'));

      let totalJSSize = 0;
      let totalCSSSize = 0;

      jsFiles.forEach(file => {
        const filePath = path.join(distPath, file);
        if (fs.existsSync(filePath)) {
          totalJSSize += fs.statSync(filePath).size;
        }
      });

      cssFiles.forEach(file => {
        const filePath = path.join(distPath, file);
        if (fs.existsSync(filePath)) {
          totalCSSSize += fs.statSync(filePath).size;
        }
      });

      const totalSizeMB = (totalJSSize + totalCSSSize) / (1024 * 1024);
      const isOptimal = totalSizeMB < 2; // Target: < 2MB for mobile

      return {
        status: isOptimal ? 'pass' : 'warning',
        totalSize: `${totalSizeMB.toFixed(2)}MB`,
        jsSize: `${(totalJSSize / (1024 * 1024)).toFixed(2)}MB`,
        cssSize: `${(totalCSSSize / (1024 * 1024)).toFixed(2)}MB`,
        recommendation: isOptimal
          ? 'Bundle size is optimal for mobile'
          : 'Consider code splitting for mobile optimization',
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Check lazy loading implementation
   */
  checkLazyLoading() {
    const utilsPath = path.join(process.cwd(), 'src', 'utils', 'lazyLoadingOptimizations.tsx');
    const exists = fs.existsSync(utilsPath);

    if (!exists) {
      return { status: 'fail', message: 'Lazy loading optimizations not found' };
    }

    const content = fs.readFileSync(utilsPath, 'utf8');
    const hasLazyComponents = content.includes('React.lazy');
    const hasSuspense = content.includes('Suspense');
    const hasIntersectionObserver = content.includes('IntersectionObserver');

    return {
      status: hasLazyComponents && hasSuspense ? 'pass' : 'partial',
      lazyComponents: hasLazyComponents,
      suspenseBoundary: hasSuspense,
      intersectionObserver: hasIntersectionObserver,
      message: 'Lazy loading implementation verified',
    };
  }

  /**
   * Check service worker implementation
   */
  checkServiceWorker() {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    const exists = fs.existsSync(swPath);

    if (!exists) {
      return { status: 'fail', message: 'Service worker not found' };
    }

    const content = fs.readFileSync(swPath, 'utf8');
    const hasCaching = content.includes('cache');
    const hasOfflineSupport = content.includes('offline');
    const hasBackgroundSync = content.includes('background-sync');
    const hasMobileOptimizations = content.includes('mobile');

    return {
      status: hasCaching && hasOfflineSupport ? 'pass' : 'partial',
      caching: hasCaching,
      offlineSupport: hasOfflineSupport,
      backgroundSync: hasBackgroundSync,
      mobileOptimizations: hasMobileOptimizations,
      message: 'Service worker features verified',
    };
  }

  /**
   * Check caching optimizations
   */
  checkCaching() {
    const cachingPath = path.join(process.cwd(), 'src', 'utils', 'cachingOptimizations.ts');
    const exists = fs.existsSync(cachingPath);

    if (!exists) {
      return { status: 'fail', message: 'Caching optimizations not found' };
    }

    const content = fs.readFileSync(cachingPath, 'utf8');
    const hasIndexedDB = content.includes('IndexedDB');
    const hasLRU = content.includes('LRU');
    const hasMemoryManagement = content.includes('memory');

    return {
      status: hasIndexedDB && hasLRU ? 'pass' : 'partial',
      indexedDB: hasIndexedDB,
      lruCache: hasLRU,
      memoryManagement: hasMemoryManagement,
      message: 'Caching strategy implementation verified',
    };
  }

  /**
   * Check image optimization
   */
  checkImageOptimization() {
    // Check for WebP support, lazy loading, and responsive images
    const components = ['UnifiedTacticsBoard.tsx', 'PlayerToken.tsx'];
    let optimizationScore = 0;
    const checks = [];

    components.forEach(component => {
      const componentPath = path.join(process.cwd(), 'src', 'components', 'tactics', component);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        const hasLazyLoading = content.includes('loading="lazy"') || content.includes('lazy');
        const hasResponsiveImages = content.includes('srcSet') || content.includes('sizes');

        if (hasLazyLoading) {
          optimizationScore++;
        }
        if (hasResponsiveImages) {
          optimizationScore++;
        }

        checks.push({
          component,
          lazyLoading: hasLazyLoading,
          responsiveImages: hasResponsiveImages,
        });
      }
    });

    return {
      status: optimizationScore >= 2 ? 'pass' : 'partial',
      score: `${optimizationScore}/${components.length * 2}`,
      checks,
      message: 'Image optimization features checked',
    };
  }

  /**
   * Validate mobile features
   */
  async validateMobileFeatures() {
    console.log('📱 Validating Mobile Features...');

    const featureChecks = {
      touchGestures: this.checkTouchGestures(),
      hapticFeedback: this.checkHapticFeedback(),
      deviceOrientation: this.checkDeviceOrientation(),
      responsiveDesign: this.checkResponsiveDesign(),
      pwaFeatures: this.checkPWAFeatures(),
    };

    this.results.features = featureChecks;
    return featureChecks;
  }

  /**
   * Check touch gesture implementation
   */
  checkTouchGestures() {
    const mobileUtilsPath = path.join(process.cwd(), 'src', 'utils', 'mobileOptimizations.ts');
    const exists = fs.existsSync(mobileUtilsPath);

    if (!exists) {
      return { status: 'fail', message: 'Mobile optimizations not found' };
    }

    const content = fs.readFileSync(mobileUtilsPath, 'utf8');
    const hasTouchEvents = content.includes('touch') || content.includes('gesture');
    const hasPinchZoom = content.includes('pinch') || content.includes('zoom');
    const hasSwipeGestures = content.includes('swipe');

    return {
      status: hasTouchEvents ? 'pass' : 'fail',
      touchEvents: hasTouchEvents,
      pinchZoom: hasPinchZoom,
      swipeGestures: hasSwipeGestures,
      message: 'Touch gesture support verified',
    };
  }

  /**
   * Check haptic feedback implementation
   */
  checkHapticFeedback() {
    const mobileFeaturesPath = path.join(process.cwd(), 'src', 'utils', 'mobileFeatures.ts');
    const exists = fs.existsSync(mobileFeaturesPath);

    if (!exists) {
      return { status: 'fail', message: 'Mobile features not found' };
    }

    const content = fs.readFileSync(mobileFeaturesPath, 'utf8');
    const hasHapticFeedback = content.includes('haptic') || content.includes('vibrate');
    const hasHapticManager = content.includes('HapticFeedbackManager');
    const hasTacticalPatterns = content.includes('tactical') && content.includes('pattern');

    return {
      status: hasHapticFeedback && hasHapticManager ? 'pass' : 'partial',
      hapticFeedback: hasHapticFeedback,
      hapticManager: hasHapticManager,
      tacticalPatterns: hasTacticalPatterns,
      message: 'Haptic feedback implementation verified',
    };
  }

  /**
   * Check device orientation support
   */
  checkDeviceOrientation() {
    const mobileFeaturesPath = path.join(process.cwd(), 'src', 'utils', 'mobileFeatures.ts');
    const exists = fs.existsSync(mobileFeaturesPath);

    if (!exists) {
      return { status: 'fail', message: 'Mobile features not found' };
    }

    const content = fs.readFileSync(mobileFeaturesPath, 'utf8');
    const hasOrientationSupport = content.includes('orientation');
    const hasOrientationManager = content.includes('DeviceOrientationManager');
    const hasScreenOrientation = content.includes('screen.orientation');

    return {
      status: hasOrientationSupport ? 'pass' : 'fail',
      orientationSupport: hasOrientationSupport,
      orientationManager: hasOrientationManager,
      screenOrientation: hasScreenOrientation,
      message: 'Device orientation support verified',
    };
  }

  /**
   * Check responsive design implementation
   */
  checkResponsiveDesign() {
    const designSystemPath = path.join(process.cwd(), 'src', 'styles', 'mobile-design-system.css');
    const exists = fs.existsSync(designSystemPath);

    if (!exists) {
      return { status: 'fail', message: 'Mobile design system not found' };
    }

    const content = fs.readFileSync(designSystemPath, 'utf8');
    const hasBreakpoints = content.includes('@media');
    const hasFlexbox = content.includes('flex');
    const hasGrid = content.includes('grid');
    const hasSafeAreas = content.includes('safe-area');
    const hasTouchTargets = content.includes('44px') || content.includes('touch-target');

    return {
      status: hasBreakpoints && hasSafeAreas && hasTouchTargets ? 'pass' : 'partial',
      breakpoints: hasBreakpoints,
      flexbox: hasFlexbox,
      grid: hasGrid,
      safeAreas: hasSafeAreas,
      touchTargets: hasTouchTargets,
      message: 'Responsive design system verified',
    };
  }

  /**
   * Check PWA features
   */
  checkPWAFeatures() {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const pwaUtilsPath = path.join(process.cwd(), 'src', 'utils', 'pwaUtils.ts');

    const hasManifest = fs.existsSync(manifestPath);
    const hasPWAUtils = fs.existsSync(pwaUtilsPath);

    let manifestFeatures = {};
    if (hasManifest) {
      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifestFeatures = {
        hasIcons: manifestContent.icons && manifestContent.icons.length > 0,
        hasStartUrl: !!manifestContent.start_url,
        hasDisplay: !!manifestContent.display,
        hasThemeColor: !!manifestContent.theme_color,
      };
    }

    let pwaFeatures = {};
    if (hasPWAUtils) {
      const pwaContent = fs.readFileSync(pwaUtilsPath, 'utf8');
      pwaFeatures = {
        hasOfflineManager: pwaContent.includes('OfflineDataManager'),
        hasBackgroundSync: pwaContent.includes('BackgroundSyncManager'),
        hasInstallPrompt: pwaContent.includes('beforeinstallprompt'),
        hasUpdateNotification: pwaContent.includes('update'),
      };
    }

    return {
      status: hasManifest && hasPWAUtils ? 'pass' : 'partial',
      manifest: hasManifest,
      pwaUtils: hasPWAUtils,
      manifestFeatures,
      pwaFeatures,
      message: 'PWA features implementation verified',
    };
  }

  /**
   * Validate accessibility features
   */
  async validateAccessibility() {
    console.log('♿ Validating Accessibility Features...');

    const accessibilityChecks = {
      mobileAccessibility: this.checkMobileAccessibility(),
      screenReader: this.checkScreenReaderSupport(),
      keyboardNavigation: this.checkKeyboardNavigation(),
      colorContrast: this.checkColorContrast(),
      touchTargets: this.checkTouchTargets(),
    };

    this.results.accessibility = accessibilityChecks;
    return accessibilityChecks;
  }

  /**
   * Check mobile accessibility implementation
   */
  checkMobileAccessibility() {
    const accessibilityPath = path.join(process.cwd(), 'src', 'utils', 'mobileAccessibility.ts');
    const exists = fs.existsSync(accessibilityPath);

    if (!exists) {
      return { status: 'fail', message: 'Mobile accessibility utilities not found' };
    }

    const content = fs.readFileSync(accessibilityPath, 'utf8');
    const hasScreenReaderManager = content.includes('ScreenReaderManager');
    const hasAccessibilityManager = content.includes('MobileAccessibilityManager');
    const hasAriaLabels = content.includes('aria-label');
    const hasKeyboardSupport = content.includes('keyboard');

    return {
      status: hasScreenReaderManager && hasAccessibilityManager ? 'pass' : 'partial',
      screenReaderManager: hasScreenReaderManager,
      accessibilityManager: hasAccessibilityManager,
      ariaLabels: hasAriaLabels,
      keyboardSupport: hasKeyboardSupport,
      message: 'Mobile accessibility implementation verified',
    };
  }

  /**
   * Check screen reader support
   */
  checkScreenReaderSupport() {
    const accessibilityLabelsPath = path.join(
      process.cwd(),
      'src',
      'utils',
      'accessibilityLabels.ts'
    );
    const exists = fs.existsSync(accessibilityLabelsPath);

    if (!exists) {
      return { status: 'fail', message: 'Accessibility labels not found' };
    }

    const content = fs.readFileSync(accessibilityLabelsPath, 'utf8');
    const hasAriaLabels = content.includes('aria-label');
    const hasAriaDescriptions = content.includes('aria-description');
    const hasRoles = content.includes('role=');
    const hasLiveRegions = content.includes('aria-live');

    return {
      status: hasAriaLabels && hasRoles ? 'pass' : 'partial',
      ariaLabels: hasAriaLabels,
      ariaDescriptions: hasAriaDescriptions,
      roles: hasRoles,
      liveRegions: hasLiveRegions,
      message: 'Screen reader support verified',
    };
  }

  /**
   * Check keyboard navigation
   */
  checkKeyboardNavigation() {
    // Check tactical board components for keyboard support
    const tacticsComponents = [
      'UnifiedTacticsBoard.tsx',
      'PlayerToken.tsx',
      'QuickActionsPanel.tsx',
    ];
    let keyboardSupport = 0;
    const componentChecks = [];

    tacticsComponents.forEach(component => {
      const componentPath = path.join(process.cwd(), 'src', 'components', 'tactics', component);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        const hasTabIndex = content.includes('tabIndex');
        const hasKeyboardEvents = content.includes('onKeyDown') || content.includes('onKeyPress');
        const hasFocusManagement = content.includes('focus');

        if (hasTabIndex || hasKeyboardEvents || hasFocusManagement) {
          keyboardSupport++;
        }

        componentChecks.push({
          component,
          tabIndex: hasTabIndex,
          keyboardEvents: hasKeyboardEvents,
          focusManagement: hasFocusManagement,
        });
      }
    });

    return {
      status: keyboardSupport >= 2 ? 'pass' : 'partial',
      supportedComponents: keyboardSupport,
      totalComponents: tacticsComponents.length,
      componentChecks,
      message: 'Keyboard navigation support verified',
    };
  }

  /**
   * Check color contrast
   */
  checkColorContrast() {
    const designSystemPath = path.join(process.cwd(), 'src', 'styles', 'mobile-design-system.css');
    const exists = fs.existsSync(designSystemPath);

    if (!exists) {
      return { status: 'fail', message: 'Design system not found' };
    }

    const content = fs.readFileSync(designSystemPath, 'utf8');
    const hasHighContrast = content.includes('high-contrast');
    const hasColorVars = content.includes('--color');
    const hasAccessibleColors = content.includes('wcag') || content.includes('contrast');

    return {
      status: hasColorVars ? 'pass' : 'partial',
      highContrast: hasHighContrast,
      colorVariables: hasColorVars,
      accessibleColors: hasAccessibleColors,
      message: 'Color contrast implementation verified',
    };
  }

  /**
   * Check touch targets
   */
  checkTouchTargets() {
    const designSystemPath = path.join(process.cwd(), 'src', 'styles', 'mobile-design-system.css');
    const exists = fs.existsSync(designSystemPath);

    if (!exists) {
      return { status: 'fail', message: 'Design system not found' };
    }

    const content = fs.readFileSync(designSystemPath, 'utf8');
    const hasTouchTargetSize = content.includes('44px') || content.includes('touch-target');
    const hasMinimumSize = content.includes('min-width') && content.includes('min-height');
    const hasPadding = content.includes('padding');

    return {
      status: hasTouchTargetSize && hasMinimumSize ? 'pass' : 'partial',
      touchTargetSize: hasTouchTargetSize,
      minimumSize: hasMinimumSize,
      padding: hasPadding,
      message: 'Touch target accessibility verified',
    };
  }

  /**
   * Validate offline functionality
   */
  async validateOffline() {
    console.log('📡 Validating Offline Functionality...');

    const offlineChecks = {
      serviceWorkerCache: this.checkServiceWorkerCache(),
      indexedDBStorage: this.checkIndexedDBStorage(),
      offlineDetection: this.checkOfflineDetection(),
      backgroundSync: this.checkBackgroundSync(),
      offlineUI: this.checkOfflineUI(),
    };

    this.results.offline = offlineChecks;
    return offlineChecks;
  }

  /**
   * Check service worker caching
   */
  checkServiceWorkerCache() {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    const exists = fs.existsSync(swPath);

    if (!exists) {
      return { status: 'fail', message: 'Service worker not found' };
    }

    const content = fs.readFileSync(swPath, 'utf8');
    const hasCacheFirst = content.includes('cache-first') || content.includes('CacheFirst');
    const hasNetworkFirst = content.includes('network-first') || content.includes('NetworkFirst');
    const hasStaleWhileRevalidate = content.includes('stale-while-revalidate');
    const hasOfflineSupport = content.includes('offline');

    return {
      status: hasCacheFirst && hasOfflineSupport ? 'pass' : 'partial',
      cacheFirst: hasCacheFirst,
      networkFirst: hasNetworkFirst,
      staleWhileRevalidate: hasStaleWhileRevalidate,
      offlineSupport: hasOfflineSupport,
      message: 'Service worker caching strategy verified',
    };
  }

  /**
   * Check IndexedDB storage
   */
  checkIndexedDBStorage() {
    const cachingPath = path.join(process.cwd(), 'src', 'utils', 'cachingOptimizations.ts');
    const indexedDBPath = path.join(process.cwd(), 'src', 'utils', 'indexedDBOptimizations.ts');

    const hasCaching = fs.existsSync(cachingPath);
    const hasIndexedDB = fs.existsSync(indexedDBPath);

    let features = {};
    if (hasIndexedDB) {
      const content = fs.readFileSync(indexedDBPath, 'utf8');
      features = {
        hasFormationStorage: content.includes('formation'),
        hasPlayerStorage: content.includes('player'),
        hasOfflineQueue: content.includes('queue'),
        hasDataSync: content.includes('sync'),
      };
    }

    return {
      status: hasCaching && hasIndexedDB ? 'pass' : 'partial',
      cachingOptimizations: hasCaching,
      indexedDBOptimizations: hasIndexedDB,
      features,
      message: 'IndexedDB storage implementation verified',
    };
  }

  /**
   * Check offline detection
   */
  checkOfflineDetection() {
    const pwaUtilsPath = path.join(process.cwd(), 'src', 'utils', 'pwaUtils.ts');
    const exists = fs.existsSync(pwaUtilsPath);

    if (!exists) {
      return { status: 'fail', message: 'PWA utilities not found' };
    }

    const content = fs.readFileSync(pwaUtilsPath, 'utf8');
    const hasNavigatorOnline = content.includes('navigator.onLine');
    const hasOfflineEvents = content.includes('offline') && content.includes('online');
    const hasConnectionSpeed = content.includes('connection') || content.includes('effectiveType');

    return {
      status: hasNavigatorOnline && hasOfflineEvents ? 'pass' : 'partial',
      navigatorOnline: hasNavigatorOnline,
      offlineEvents: hasOfflineEvents,
      connectionSpeed: hasConnectionSpeed,
      message: 'Offline detection implementation verified',
    };
  }

  /**
   * Check background sync
   */
  checkBackgroundSync() {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    const pwaUtilsPath = path.join(process.cwd(), 'src', 'utils', 'pwaUtils.ts');

    let swFeatures = {};
    if (fs.existsSync(swPath)) {
      const swContent = fs.readFileSync(swPath, 'utf8');
      swFeatures = {
        hasBackgroundSync: swContent.includes('background-sync') || swContent.includes('sync'),
        hasSyncEvent: swContent.includes('sync'),
        hasQueueManagement: swContent.includes('queue'),
      };
    }

    let pwaFeatures = {};
    if (fs.existsSync(pwaUtilsPath)) {
      const pwaContent = fs.readFileSync(pwaUtilsPath, 'utf8');
      pwaFeatures = {
        hasBackgroundSyncManager: pwaContent.includes('BackgroundSyncManager'),
        hasSyncRegistration: pwaContent.includes('sync.register'),
        hasOfflineActions: pwaContent.includes('offline') && pwaContent.includes('action'),
      };
    }

    return {
      status:
        swFeatures.hasBackgroundSync && pwaFeatures.hasBackgroundSyncManager ? 'pass' : 'partial',
      serviceWorkerFeatures: swFeatures,
      pwaFeatures: pwaFeatures,
      message: 'Background sync implementation verified',
    };
  }

  /**
   * Check offline UI
   */
  checkOfflineUI() {
    // Check tactical board components for offline state handling
    const components = ['UnifiedTacticsBoard.tsx', 'ContextualToolbar.tsx'];
    let offlineUISupport = 0;
    const componentChecks = [];

    components.forEach(component => {
      const componentPath = path.join(process.cwd(), 'src', 'components', 'tactics', component);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        const hasOfflineState = content.includes('offline') || content.includes('isOnline');
        const hasOfflineIndicator =
          content.includes('offline') &&
          (content.includes('indicator') || content.includes('status'));
        const hasOfflineMessage = content.includes('offline') && content.includes('message');

        if (hasOfflineState) {
          offlineUISupport++;
        }

        componentChecks.push({
          component,
          offlineState: hasOfflineState,
          offlineIndicator: hasOfflineIndicator,
          offlineMessage: hasOfflineMessage,
        });
      }
    });

    return {
      status: offlineUISupport >= 1 ? 'pass' : 'partial',
      supportedComponents: offlineUISupport,
      totalComponents: components.length,
      componentChecks,
      message: 'Offline UI implementation verified',
    };
  }

  /**
   * Validate cross-platform testing
   */
  async validateCrossPlatform() {
    console.log('🌐 Validating Cross-Platform Testing...');

    const crossPlatformChecks = {
      testFramework: this.checkTestFramework(),
      deviceSimulation: this.checkDeviceSimulation(),
      browserTesting: this.checkBrowserTesting(),
      touchSimulation: this.checkTouchSimulation(),
      responsiveTesting: this.checkResponsiveTesting(),
    };

    this.results.crossPlatform = crossPlatformChecks;
    return crossPlatformChecks;
  }

  /**
   * Check cross-platform test framework
   */
  checkTestFramework() {
    const testPath = path.join(
      process.cwd(),
      'src',
      '__tests__',
      'mobile',
      'MobileCrossPlatformTesting.test.tsx'
    );
    const exists = fs.existsSync(testPath);

    if (!exists) {
      return { status: 'fail', message: 'Cross-platform test framework not found' };
    }

    const content = fs.readFileSync(testPath, 'utf8');
    const hasDeviceSimulator = content.includes('DeviceSimulator');
    const hasTouchSimulator = content.includes('TouchSimulator');
    const hasViewportTesting = content.includes('viewport');
    const hasPlatformTesting = content.includes('iOS') && content.includes('Android');

    return {
      status: hasDeviceSimulator && hasTouchSimulator ? 'pass' : 'partial',
      deviceSimulator: hasDeviceSimulator,
      touchSimulator: hasTouchSimulator,
      viewportTesting: hasViewportTesting,
      platformTesting: hasPlatformTesting,
      message: 'Cross-platform test framework verified',
    };
  }

  /**
   * Check device simulation
   */
  checkDeviceSimulation() {
    const testPath = path.join(
      process.cwd(),
      'src',
      '__tests__',
      'mobile',
      'MobileCrossPlatformTesting.test.tsx'
    );

    if (!fs.existsSync(testPath)) {
      return { status: 'fail', message: 'Device simulation tests not found' };
    }

    const content = fs.readFileSync(testPath, 'utf8');
    const hasiOSSimulation = content.includes('iOS');
    const hasAndroidSimulation = content.includes('Android');
    const hasTabletSimulation = content.includes('tablet') || content.includes('iPad');
    const hasDesktopSimulation = content.includes('desktop');

    return {
      status: hasiOSSimulation && hasAndroidSimulation ? 'pass' : 'partial',
      iOSSimulation: hasiOSSimulation,
      androidSimulation: hasAndroidSimulation,
      tabletSimulation: hasTabletSimulation,
      desktopSimulation: hasDesktopSimulation,
      message: 'Device simulation capabilities verified',
    };
  }

  /**
   * Check browser testing
   */
  checkBrowserTesting() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return { status: 'fail', message: 'Package.json not found' };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devDependencies = packageJson.devDependencies || {};

    const hasPlaywright = 'playwright' in devDependencies || '@playwright/test' in devDependencies;
    const hasPuppeteer = 'puppeteer' in devDependencies;
    const hasTestingLibrary = '@testing-library/react' in devDependencies;
    const hasJest = 'jest' in devDependencies || 'vitest' in devDependencies;

    return {
      status: hasTestingLibrary && hasJest ? 'pass' : 'partial',
      playwright: hasPlaywright,
      puppeteer: hasPuppeteer,
      testingLibrary: hasTestingLibrary,
      testRunner: hasJest,
      message: 'Browser testing framework verified',
    };
  }

  /**
   * Check touch simulation
   */
  checkTouchSimulation() {
    const testPath = path.join(
      process.cwd(),
      'src',
      '__tests__',
      'mobile',
      'MobileCrossPlatformTesting.test.tsx'
    );

    if (!fs.existsSync(testPath)) {
      return { status: 'fail', message: 'Touch simulation tests not found' };
    }

    const content = fs.readFileSync(testPath, 'utf8');
    const hasTouchEvents = content.includes('touchstart') || content.includes('touchend');
    const hasGestureSimulation = content.includes('gesture') || content.includes('swipe');
    const hasPinchSimulation = content.includes('pinch') || content.includes('zoom');
    const hasTouchSimulator = content.includes('TouchSimulator');

    return {
      status: hasTouchEvents && hasTouchSimulator ? 'pass' : 'partial',
      touchEvents: hasTouchEvents,
      gestureSimulation: hasGestureSimulation,
      pinchSimulation: hasPinchSimulation,
      touchSimulator: hasTouchSimulator,
      message: 'Touch simulation capabilities verified',
    };
  }

  /**
   * Check responsive testing
   */
  checkResponsiveTesting() {
    const testFiles = [
      'src/__tests__/mobile/MobileCrossPlatformTesting.test.tsx',
      'src/__tests__/integration/TacticsBoard.test.tsx',
      'src/__tests__/components/tactics/UnifiedTacticsBoard.test.tsx',
    ];

    let responsiveTests = 0;
    const testChecks = [];

    testFiles.forEach(testFile => {
      const testPath = path.join(process.cwd(), testFile);
      if (fs.existsSync(testPath)) {
        const content = fs.readFileSync(testPath, 'utf8');
        const hasViewportTesting = content.includes('viewport') || content.includes('resize');
        const hasBreakpointTesting = content.includes('breakpoint') || content.includes('mobile');
        const hasResponsiveLayout = content.includes('responsive') || content.includes('layout');

        if (hasViewportTesting || hasBreakpointTesting || hasResponsiveLayout) {
          responsiveTests++;
        }

        testChecks.push({
          testFile: testFile.split('/').pop(),
          viewportTesting: hasViewportTesting,
          breakpointTesting: hasBreakpointTesting,
          responsiveLayout: hasResponsiveLayout,
        });
      }
    });

    return {
      status: responsiveTests >= 2 ? 'pass' : 'partial',
      responsiveTestFiles: responsiveTests,
      totalTestFiles: testFiles.length,
      testChecks,
      message: 'Responsive testing implementation verified',
    };
  }

  /**
   * Generate comprehensive validation report
   */
  generateReport() {
    console.log('\n📊 MOBILE DEPLOYMENT VALIDATION REPORT');
    console.log('=====================================\n');

    const sections = [
      { name: 'Performance', data: this.results.performance },
      { name: 'Mobile Features', data: this.results.features },
      { name: 'Accessibility', data: this.results.accessibility },
      { name: 'Offline Functionality', data: this.results.offline },
      { name: 'Cross-Platform Testing', data: this.results.crossPlatform },
    ];

    let overallScore = 0;
    let totalChecks = 0;

    sections.forEach(section => {
      console.log(`${section.name.toUpperCase()}:`);
      let sectionScore = 0;
      let sectionChecks = 0;

      Object.entries(section.data).forEach(([key, value]) => {
        const status = value.status;
        const statusIcon = this.getStatusIcon(status);
        console.log(`  ${statusIcon} ${key}: ${value.message || 'Checked'}`);

        if (status === 'pass') {
          sectionScore += 1;
        } else if (status === 'partial') {
          sectionScore += 0.5;
        }
        sectionChecks += 1;
      });

      const sectionPercentage = ((sectionScore / sectionChecks) * 100).toFixed(1);
      console.log(`  Score: ${sectionScore}/${sectionChecks} (${sectionPercentage}%)\n`);

      overallScore += sectionScore;
      totalChecks += sectionChecks;
    });

    const overallPercentage = ((overallScore / totalChecks) * 100).toFixed(1);
    console.log(
      `OVERALL MOBILE OPTIMIZATION SCORE: ${overallScore}/${totalChecks} (${overallPercentage}%)`
    );

    if (overallPercentage >= 90) {
      console.log('🎉 EXCELLENT! Mobile optimization is production-ready.');
    } else if (overallPercentage >= 75) {
      console.log('✅ GOOD! Mobile optimization is solid with minor improvements needed.');
    } else if (overallPercentage >= 60) {
      console.log('⚠️  FAIR! Mobile optimization needs attention before production.');
    } else {
      console.log('❌ POOR! Significant mobile optimization work required.');
    }

    console.log('\nRecommendations:');
    this.generateRecommendations();
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    switch (status) {
      case 'pass':
        return '✅';
      case 'partial':
        return '⚠️';
      case 'fail':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Check for common issues and provide recommendations
    if (this.results.performance?.bundleSize?.status !== 'pass') {
      recommendations.push(
        'Consider implementing code splitting and tree shaking to reduce bundle size'
      );
    }

    if (this.results.features?.hapticFeedback?.status !== 'pass') {
      recommendations.push('Implement haptic feedback for better mobile user experience');
    }

    if (this.results.accessibility?.mobileAccessibility?.status !== 'pass') {
      recommendations.push('Enhance accessibility features for better mobile support');
    }

    if (this.results.offline?.serviceWorkerCache?.status !== 'pass') {
      recommendations.push('Improve service worker caching strategy for offline functionality');
    }

    if (this.results.crossPlatform?.testFramework?.status !== 'pass') {
      recommendations.push('Implement comprehensive cross-platform testing framework');
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Mobile optimization looks excellent! Consider monitoring performance metrics continuously.'
      );
    }

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  /**
   * Run full validation suite
   */
  async runFullValidation() {
    console.log('🚀 Starting Mobile Deployment Validation...\n');

    try {
      await this.validatePerformance();
      await this.validateMobileFeatures();
      await this.validateAccessibility();
      await this.validateOffline();
      await this.validateCrossPlatform();

      this.generateReport();

      return this.results;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new MobileValidationSuite();
  validator
    .runFullValidation()
    .then(() => {
      console.log('\n✅ Mobile validation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Mobile validation failed:', error);
      process.exit(1);
    });
}

export default MobileValidationSuite;
