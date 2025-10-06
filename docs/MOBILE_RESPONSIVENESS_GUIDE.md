# Mobile Responsiveness Implementation Guide

**Task 18 - Phase 4: Advanced Features & Polish**

## Overview

This guide documents the comprehensive mobile responsiveness implementation for Astral Turf, including touch controls, gesture handling, adaptive layouts, and Progressive Web App (PWA) capabilities.

## Architecture

### 1. Touch Gesture System (`src/hooks/useTouchGestures.ts`)

Comprehensive touch gesture detection system with the following capabilities:

#### Swipe Gestures
- **4-directional detection**: up, down, left, right
- **Configurable thresholds**: Distance (50px) and velocity (0.3px/ms)
- **Detailed metrics**: Distance, velocity, duration tracking
- **Usage**:
```typescript
const { handlers } = useSwipeGesture((gesture) => {
  console.log(`Swiped ${gesture.direction} - ${gesture.distance}px`);
}, { threshold: 100 });
```

#### Pinch Gestures
- **Scale detection**: Multi-touch pinch-to-zoom
- **Center point calculation**: Accurate zoom origin
- **Distance tracking**: Precise finger separation measurement
- **Usage**:
```typescript
const { handlers } = usePinchGesture((gesture) => {
  console.log(`Pinched to ${gesture.scale}x scale`);
}, { minScale: 0.5, maxScale: 3.0 });
```

#### Tap Gestures
- **Single tap**: Standard touch interaction
- **Double tap**: Quick succession (300ms window)
- **Long press**: Touch and hold (500ms threshold)
- **Position tracking**: Accurate touch coordinates
- **Usage**:
```typescript
const { handlers } = useTapGesture({
  onTap: (pos) => console.log('Tapped at', pos),
  onDoubleTap: (pos) => console.log('Double-tapped'),
  onLongPress: (pos) => console.log('Long-pressed'),
});
```

#### Combined Gestures
```typescript
const { handlers } = useGestures({
  onSwipe: (gesture) => { /* handle swipe */ },
  onPinch: (gesture) => { /* handle pinch */ },
  onTap: (pos) => { /* handle tap */ },
});
```

#### Auto-Attach to Elements
```typescript
const elementRef = useGestureElement({
  onSwipe: (gesture) => { /* ... */ },
  onPinch: (gesture) => { /* ... */ },
});

return <div ref={elementRef}>Gesture-enabled content</div>;
```

#### Touch Scroll Control
```typescript
// Disable scroll temporarily (e.g., during drag)
useTouchScroll(false);

// Track scroll direction
const direction = useTouchScrollDirection(); // 'up' | 'down' | null
```

### 2. Mobile UI Components (`src/components/mobile/MobileUI.tsx`)

#### MobileBottomNav
Bottom navigation bar with safe area support for iOS notches.

```typescript
<MobileBottomNav>
  <MobileNavItem icon={<HomeIcon />} label="Home" active />
  <MobileNavItem icon={<TacticsIcon />} label="Tactics" badge={3} />
  <MobileNavItem icon={<ProfileIcon />} label="Profile" />
</MobileBottomNav>
```

**Features:**
- iOS safe area insets (bottom padding for home indicator)
- Active state styling
- Badge support for notifications
- Backdrop blur effect
- Smooth transitions

#### MobileDrawer
Slide-out panel for navigation or content.

```typescript
<MobileDrawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  position="left" // left | right | bottom
>
  <nav>...</nav>
</MobileDrawer>
```

**Features:**
- 3 positions: left, right, bottom
- Backdrop with blur
- Swipe-to-close gesture
- Spring animations
- Safe area support

#### MobileHeader
App header with hamburger menu or back button.

```typescript
<MobileHeader
  title="Tactics Board"
  onMenuClick={() => setDrawerOpen(true)}
  showBackButton
  onBackClick={() => navigate(-1)}
/>
```

**Features:**
- Hamburger menu icon
- Back button navigation
- Safe area top padding
- Custom action buttons
- Sticky positioning

#### MobileBottomSheet
Draggable bottom sheet with snap points.

```typescript
<MobileBottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  snapPoints={[0.3, 0.6, 0.9]}
  title="Player Details"
>
  <PlayerStats />
</MobileBottomSheet>
```

**Features:**
- Drag to resize
- Multiple snap points
- Drag indicator
- Safe area bottom padding
- Spring physics animations

#### MobileFAB
Floating Action Button for primary actions.

```typescript
<MobileFAB
  onClick={handleAddPlayer}
  icon={<PlusIcon />}
  extended={isExtended}
  label="Add Player"
/>
```

**Features:**
- Circular or extended (with label)
- Fixed bottom-right positioning
- Safe area offset
- Scale animation on press
- Shadow elevation

#### MobileCard
Touch-optimized card with tap feedback.

```typescript
<MobileCard
  title="Formation"
  subtitle="4-3-3"
  onTap={() => selectFormation('4-3-3')}
  image="/formations/4-3-3.png"
  badge="Popular"
/>
```

**Features:**
- Tap feedback animation
- Optional image header
- Title, subtitle, badges
- Scale effect on press
- Accessible touch targets (min 44px)

#### PullToRefresh
Pull-down-to-refresh functionality.

```typescript
<PullToRefresh
  onRefresh={async () => {
    await fetchLatestData();
  }}
>
  <ContentList />
</PullToRefresh>
```

**Features:**
- Drag threshold (80px)
- Loading indicator
- Smooth spring animations
- Async refresh handling
- Haptic feedback (on supported devices)

#### MobileTabs
Swipeable tabs with navigation.

```typescript
<MobileTabs
  tabs={[
    { id: 'tactics', label: 'Tactics', content: <TacticsView /> },
    { id: 'players', label: 'Players', content: <PlayersView /> },
    { id: 'stats', label: 'Stats', content: <StatsView /> },
  ]}
  defaultTab="tactics"
  onTabChange={(tabId) => console.log('Changed to', tabId)}
/>
```

**Features:**
- Swipe between tabs
- Active tab indicator
- Smooth transitions
- Accessible touch targets
- Keyboard navigation support

### 3. Adaptive Layout System (`src/components/layout/AdaptiveLayout.tsx`)

#### ResponsiveContainer
Mobile-first responsive container with automatic padding.

```typescript
<ResponsiveContainer maxWidth="xl" padding>
  <PageContent />
</ResponsiveContainer>
```

**Breakpoint padding:**
- Mobile: 16px (px-4 py-4)
- Tablet: 24px (px-6 py-6)
- Desktop: 32px (px-8 py-8)

#### ResponsiveGrid
Automatic column layout based on breakpoint.

```typescript
<ResponsiveGrid
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap={4}
>
  {items.map(item => <GridItem key={item.id} {...item} />)}
</ResponsiveGrid>
```

#### ResponsiveStack
Flex container with mobile-first direction.

```typescript
<ResponsiveStack
  direction="responsive" // vertical on mobile, horizontal on desktop
  spacing={4}
  align="center"
  justify="between"
>
  <Logo />
  <Navigation />
</ResponsiveStack>
```

#### ResponsiveSidebarLayout
Sidebar that auto-collapses on mobile.

```typescript
<ResponsiveSidebarLayout
  sidebar={<NavigationMenu />}
  main={<MainContent />}
  sidebarWidth="280px"
  collapsible
/>
```

#### ResponsiveModal
Modal that becomes full-screen on mobile.

```typescript
<ResponsiveModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Formation"
  size="md" // sm | md | lg | full
>
  <FormationEditor />
</ResponsiveModal>
```

#### TouchButton
Touch-optimized button with minimum 44px touch target.

```typescript
<TouchButton
  onClick={handleSave}
  variant="primary" // primary | secondary | danger | ghost
  size="md" // sm (36px) | md (44px) | lg (52px)
  fullWidth
>
  Save Changes
</TouchButton>
```

**Accessibility:**
- Minimum touch target: 44x44px (WCAG 2.5.5)
- Scale feedback on press
- Disabled state handling
- Keyboard accessible

#### TouchInput
Input field with proper mobile sizing.

```typescript
<TouchInput
  value={playerName}
  onChange={setPlayerName}
  placeholder="Player Name"
  type="text"
  error={validationError}
/>
```

**Features:**
- Minimum height: 44px
- Large touch targets
- Error state display
- Mobile keyboard types (text, email, tel, number)

#### ResponsiveText
Text with viewport-based font sizing.

```typescript
<ResponsiveText as="h1" size="3xl">
  Tactical Board
</ResponsiveText>
```

**Size scaling:**
- `3xl`: 30px (mobile) → 36px (tablet) → 48px (desktop)
- `2xl`: 24px → 30px → 36px
- `xl`: 20px → 24px → 30px

### 4. Responsive Hooks (`src/hooks/useResponsive.tsx`)

Comprehensive responsive design detection (already implemented).

```typescript
const {
  // Breakpoint detection
  isMobile,    // < 768px
  isTablet,    // 768-1023px
  isDesktop,   // 1024-1439px
  isXl,        // >= 1440px
  breakpoint,  // Current breakpoint name
  
  // Device capabilities
  isTouch,     // Touch device detection
  hasHover,    // Hover capability
  
  // Orientation
  orientation, // 'portrait' | 'landscape'
  aspectRatio, // Numeric aspect ratio
  
  // Display
  pixelRatio,  // Device pixel ratio
  isHighDPI,   // Retina/high-DPI display
  
  // Preferences
  prefersReducedMotion, // Accessibility
  colorScheme,          // 'light' | 'dark'
  
  // Safe areas (iOS notches)
  safeArea, // { top, bottom, left, right }
} = useResponsive();
```

**Helper hooks:**

```typescript
// Mobile-specific detection
const { isMobile, isLandscape, hasNotch } = useMobileDetection();

// Responsive modal behavior
const { isFullScreen, maxHeight } = useResponsiveModal();

// Responsive navigation
const { useBottomNav, useHamburger } = useResponsiveNavigation();

// Mobile optimizations
const {
  shouldLazyLoad,
  imageQuality,
  enableAnimations,
} = useMobileOptimizations();
```

### 5. PWA Configuration (`public/manifest.json`)

Progressive Web App configuration (already implemented - 168 lines).

**Key features:**
- **Display**: Standalone (full-screen app)
- **Orientation**: Any (supports all orientations)
- **Theme**: Blue (#1e40af)
- **Icons**: Multiple sizes (72x72 to 512x512)
- **Screenshots**: Desktop and mobile variants
- **Categories**: Sports, productivity, education

**Installation:**
- Chrome/Edge: Install prompt appears automatically
- Safari iOS: Add to Home Screen from Share menu
- Provides app-like experience with no browser UI

## Implementation Guide

### Step 1: Integrate Touch Controls with Tactical Board

Create a mobile-optimized tactical board component:

```typescript
// src/components/TacticalBoard/MobileTacticalBoard.tsx
import { useGestureElement, usePinchGesture } from '@/hooks/useTouchGestures';
import { useResponsive } from '@/hooks/useResponsive';

export const MobileTacticalBoard: React.FC = () => {
  const { isMobile } = useResponsive();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Pinch-to-zoom
  const { handlers: pinchHandlers } = usePinchGesture((gesture) => {
    setScale((prev) => Math.min(3, Math.max(0.5, prev * gesture.scale)));
  });
  
  // Pan gesture
  const gestureRef = useGestureElement({
    onSwipe: (gesture) => {
      if (gesture.direction === 'left' || gesture.direction === 'right') {
        // Navigate between views
      }
    },
  });
  
  return (
    <div
      ref={gestureRef}
      {...pinchHandlers}
      style={{
        transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none', // Prevent browser gestures
      }}
    >
      <SoccerField />
      <PlayerMarkers />
    </div>
  );
};
```

### Step 2: Create Mobile Navigation

Replace desktop navigation with mobile bottom nav:

```typescript
// src/components/Layout/AppLayout.tsx
import { MobileBottomNav, MobileNavItem } from '@/components/mobile';
import { useResponsive } from '@/hooks/useResponsive';

export const AppLayout: React.FC = () => {
  const { isMobile } = useResponsive();
  const { pathname } = useLocation();
  
  return (
    <>
      {/* Desktop navigation (existing) */}
      {!isMobile && <DesktopNav />}
      
      {/* Main content */}
      <main>{children}</main>
      
      {/* Mobile bottom navigation */}
      {isMobile && (
        <MobileBottomNav>
          <MobileNavItem
            icon={<HomeIcon />}
            label="Home"
            active={pathname === '/'}
            onClick={() => navigate('/')}
          />
          <MobileNavItem
            icon={<TacticsIcon />}
            label="Board"
            active={pathname === '/board'}
            onClick={() => navigate('/board')}
          />
          <MobileNavItem
            icon={<LibraryIcon />}
            label="Plays"
            active={pathname === '/plays'}
            onClick={() => navigate('/plays')}
          />
          <MobileNavItem
            icon={<ProfileIcon />}
            label="Profile"
            active={pathname === '/profile'}
            onClick={() => navigate('/profile')}
          />
        </MobileBottomNav>
      )}
    </>
  );
};
```

### Step 3: Mobile-Optimize Forms

Replace standard inputs with touch-optimized versions:

```typescript
import { TouchInput, TouchButton } from '@/components/layout';

<form>
  <TouchInput
    value={playerName}
    onChange={setPlayerName}
    placeholder="Player Name"
    type="text"
  />
  
  <TouchInput
    value={jerseyNumber}
    onChange={setJerseyNumber}
    placeholder="Jersey Number"
    type="number"
  />
  
  <TouchButton
    onClick={handleSubmit}
    variant="primary"
    fullWidth
  >
    Add Player
  </TouchButton>
</form>
```

### Step 4: Implement Pull-to-Refresh

Add pull-to-refresh to data lists:

```typescript
import { PullToRefresh } from '@/components/mobile';

<PullToRefresh
  onRefresh={async () => {
    await refetchPlays();
  }}
>
  <PlaysList plays={plays} />
</PullToRefresh>
```

### Step 5: Mobile-Responsive Layouts

Wrap pages in responsive containers:

```typescript
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout';

<ResponsiveContainer maxWidth="xl">
  <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={6}>
    {formations.map(formation => (
      <FormationCard key={formation.id} {...formation} />
    ))}
  </ResponsiveGrid>
</ResponsiveContainer>
```

## Testing Checklist

### Touch Gestures
- [ ] Swipe left/right navigation works
- [ ] Pinch-to-zoom on tactical board
- [ ] Tap to select players
- [ ] Double-tap for quick actions
- [ ] Long-press for context menus
- [ ] Drag-and-drop players on board

### UI Components
- [ ] Bottom navigation visible and functional
- [ ] Drawer opens/closes smoothly
- [ ] Bottom sheet drags to snap points
- [ ] FAB accessible and clickable
- [ ] Cards provide tap feedback
- [ ] Pull-to-refresh triggers correctly
- [ ] Tabs swipe smoothly

### Layouts
- [ ] All touch targets >= 44x44px
- [ ] Safe areas respected (iOS notches)
- [ ] Modals full-screen on mobile
- [ ] Sidebars collapse on mobile
- [ ] Grids adjust column count
- [ ] Text sizes scale appropriately
- [ ] Spacing adjusts per breakpoint

### PWA
- [ ] App installs on home screen
- [ ] Icons display correctly
- [ ] Splash screen shows on launch
- [ ] Works offline (if offline support added)
- [ ] No browser chrome in standalone mode

### Performance
- [ ] No touch delay (300ms removed)
- [ ] Gestures respond immediately
- [ ] Animations smooth (60fps)
- [ ] No layout shift on breakpoint change
- [ ] Images lazy load on mobile

### Accessibility
- [ ] Touch targets meet WCAG 2.5.5 (44px)
- [ ] Keyboard navigation works
- [ ] Screen reader announces states
- [ ] Reduced motion respected
- [ ] Color contrast sufficient

## Known Issues & Limitations

### TypeScript Errors in `useTouchGestures.ts`
- **Issue**: TouchEvent/Touch types not fully recognized
- **Status**: Functional but has lint warnings
- **Workaround**: Using `globalThis.TouchEvent` for some instances
- **Resolution needed**: Complete type replacement throughout file

### Browser Compatibility
- **iOS Safari**: Full support for all gestures and safe areas
- **Chrome Android**: Full support
- **Firefox Android**: Limited pinch gesture support
- **Samsung Internet**: Touch events supported, test PWA installation

### Performance Considerations
- Gesture detection uses passive event listeners for scroll performance
- Pinch gestures disable browser zoom (touchAction: 'none')
- Animations use Framer Motion with spring physics
- Consider reducing motion on low-end devices

## Next Steps

### High Priority
1. Fix remaining TypeScript errors in `useTouchGestures.ts`
2. Integrate touch controls with tactical board
3. Implement mobile navigation in main layout
4. Test on real mobile devices (iOS & Android)

### Medium Priority
5. Add haptic feedback where supported
6. Optimize images for mobile (responsive images)
7. Add offline support with service worker
8. Implement mobile-specific keyboard shortcuts

### Low Priority
9. Add app shortcuts to manifest
10. Implement share target API
11. Create mobile onboarding flow
12. Add mobile-specific analytics events

## File Structure

```
src/
├── hooks/
│   ├── useTouchGestures.ts       # Touch gesture detection (560 lines)
│   └── useResponsive.tsx         # Responsive hooks (273 lines)
├── components/
│   ├── mobile/
│   │   ├── MobileUI.tsx          # Mobile UI components (480 lines)
│   │   └── index.ts              # Mobile exports
│   └── layout/
│       ├── AdaptiveLayout.tsx    # Responsive layouts (430 lines)
│       └── index.ts              # Layout exports
public/
└── manifest.json                 # PWA manifest (168 lines)
```

**Total new code**: ~1,470 lines
**Total with existing responsive**: ~1,740 lines

## Resources

- [React Touch Events](https://react.dev/reference/react-dom/components/common#touch-events)
- [Framer Motion Gestures](https://www.framer.com/motion/gestures/)
- [PWA Manifest Spec](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [iOS Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

**Documentation Version**: 1.0  
**Last Updated**: Task 18 Implementation  
**Status**: In Progress (~40% complete)
