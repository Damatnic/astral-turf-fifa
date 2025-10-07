# API Reference - Astral Turf

Complete API documentation for Astral Turf components, hooks, and utilities.

---

## Table of Contents

- [Theme System](#theme-system)
- [Performance Utilities](#performance-utilities)
- [Navigation Components](#navigation-components)
- [Roster Management](#roster-management)
- [Hooks](#hooks)
- [Utilities](#utilities)

---

## Theme System

### ThemeProvider

React context provider for theme management.

**Import**:
```tsx
import { ThemeProvider } from './theme';
```

**Props**:
- `defaultMode?: 'light' | 'dark'` - Initial theme mode (default: 'dark')
- `storageKey?: string` - localStorage key (default: 'astral-turf-theme')
- `children: ReactNode` - Child components

**Example**:
```tsx
<ThemeProvider defaultMode="dark" storageKey="my-theme">
  <App />
</ThemeProvider>
```

### useTheme

Hook to access theme context.

**Returns**:
```tsx
{
  theme: Theme,           // Current theme object
  mode: 'light' | 'dark', // Current mode
  toggleTheme: () => void,// Toggle function
  setTheme: (mode: 'light' | 'dark') => void // Set specific theme
}
```

**Example**:
```tsx
const MyComponent = () => {
  const { theme, mode, toggleTheme } = useTheme();
  
  return (
    <div style={{ color: theme.colors.text.primary }}>
      <button onClick={toggleTheme}>Toggle ({mode})</button>
    </div>
  );
};
```

### useThemeMode

Get current theme mode only.

**Returns**: `'light' | 'dark'`

**Example**:
```tsx
const mode = useThemeMode();
console.log(mode); // 'dark'
```

### useThemeToggle

Get theme toggle function only.

**Returns**: `() => void`

**Example**:
```tsx
const toggleTheme = useThemeToggle();
<button onClick={toggleTheme}>Toggle Theme</button>
```

### Design Tokens

**Import**:
```tsx
import { colors, typography, spacing, shadows } from './theme';
```

**Colors**:
```tsx
colors.primary[500]      // #00f5ff (cyan)
colors.secondary[500]    // #0080ff (blue)
colors.semantic.success  // Green shades
colors.semantic.error    // Red shades
colors.positions.GK      // Amber (goalkeeper)
colors.morale.excellent  // Green (high morale)
```

**Typography**:
```tsx
typography.fontSize.base  // 1rem (16px)
typography.fontWeight.bold // 700
typography.lineHeight.normal // 1.5
```

**Spacing**:
```tsx
spacing[4]  // 1rem (16px)
spacing[8]  // 2rem (32px)
spacing[16] // 4rem (64px)
```

**Shadows**:
```tsx
shadows.md              // Medium shadow
shadows.glow.primary    // Cyan glow effect
```

---

## Performance Utilities

### useRenderPerformance

Track component render performance.

**Import**:
```tsx
import { useRenderPerformance } from './performance';
```

**Signature**:
```tsx
useRenderPerformance(
  componentName: string,
  options?: {
    enabled?: boolean,
    reportThreshold?: number,
    onReport?: (report: PerformanceReport) => void
  }
): PerformanceMetrics | null
```

**Parameters**:
- `componentName` - Name for tracking
- `options.enabled` - Enable tracking (default: dev mode)
- `options.reportThreshold` - Report if > N ms (default: 16)
- `options.onReport` - Callback for reports

**Example**:
```tsx
const MyComponent = () => {
  const metrics = useRenderPerformance('MyComponent', {
    reportThreshold: 16,
    onReport: (report) => {
      console.log('Slow render:', report);
    }
  });

  return <div>Render count: {metrics?.renderCount}</div>;
};
```

### useMemoryLeakDetection

Detect memory leaks in components.

**Signature**:
```tsx
useMemoryLeakDetection(
  componentName: string,
  options?: {
    enabled?: boolean,
    checkInterval?: number,
    growthThreshold?: number,
    onLeak?: (name: string, growth: number) => void
  }
): void
```

**Parameters**:
- `componentName` - Name for tracking
- `options.checkInterval` - Check every N ms (default: 5000)
- `options.growthThreshold` - Alert if growth > N bytes (default: 10MB)
- `options.onLeak` - Callback for leaks

**Example**:
```tsx
const MyComponent = () => {
  useMemoryLeakDetection('MyComponent', {
    checkInterval: 5000,
    growthThreshold: 10 * 1024 * 1024,
    onLeak: (name, growth) => {
      alert(`Memory leak in ${name}: ${growth} bytes`);
    }
  });

  return <div>Content</div>;
};
```

### useEffectCleanup

Centralized effect cleanup management.

**Returns**:
```tsx
{
  track: (cleanupFn: () => void) => void,
  cleanup: () => void
}
```

**Example**:
```tsx
const MyComponent = () => {
  const { track } = useEffectCleanup('MyComponent');

  useEffect(() => {
    const subscription = service.subscribe(handleData);
    track(() => subscription.unsubscribe());

    const listener = window.addEventListener('resize', handleResize);
    track(() => window.removeEventListener('resize', handleResize));
  }, []);

  return <div>Content</div>;
};
```

### Memoization Utilities

**MemoizedListItem**:
```tsx
import { MemoizedListItem } from './performance';

const PlayerCard = MemoizedListItem(({ id, player }) => (
  <div>{player.name}</div>
));
```

**MemoizedCard**:
```tsx
import { MemoizedCard } from './performance';

const TeamCard = MemoizedCard(({ team, onSelect }) => (
  <div onClick={onSelect}>{team.name}</div>
));
```

**createSelectiveMemo**:
```tsx
import { createSelectiveMemo } from './performance';

const ChartComponent = createSelectiveMemo(
  ExpensiveChart,
  ['data', 'options'] // Only re-render when these change
);
```

**createVisibilityAwareMemo**:
```tsx
import { createVisibilityAwareMemo } from './performance';

const HeavyComponent = createVisibilityAwareMemo(ExpensiveSection);
// Only renders when visible in viewport
```

---

## Navigation Components

### SmartNavbar

Intelligent navigation with breadcrumbs, search, and quick actions.

**Import**:
```tsx
import { SmartNavbar } from './components/navigation';
```

**Props**:
- `currentPage: string` - Active page identifier
- `user?: User` - Current user object
- `onSearch?: (query: string) => void` - Search handler
- `onNavigate?: (path: string) => void` - Navigation handler

**Example**:
```tsx
<SmartNavbar
  currentPage="dashboard"
  user={currentUser}
  onSearch={(query) => console.log('Search:', query)}
  onNavigate={(path) => router.push(path)}
/>
```

### BreadcrumbTrail

Hierarchical breadcrumb navigation.

**Props**:
- `items: BreadcrumbItem[]` - Breadcrumb items
- `maxItems?: number` - Max items before collapse (default: 4)

**Example**:
```tsx
<BreadcrumbTrail
  items={[
    { label: 'Home', path: '/' },
    { label: 'Teams', path: '/teams' },
    { label: 'Players', path: '/teams/players' }
  ]}
  maxItems={3}
/>
```

### SearchBar

Smart search with history and suggestions.

**Props**:
- `onSearch: (query: string) => void` - Search handler
- `placeholder?: string` - Input placeholder
- `showHistory?: boolean` - Show search history (default: true)

**Example**:
```tsx
<SearchBar
  onSearch={(query) => handleSearch(query)}
  placeholder="Search players, teams..."
  showHistory={true}
/>
```

---

## Roster Management

### RosterGrid

Virtual scrolling grid for large player lists.

**Import**:
```tsx
import { RosterGrid } from './components/roster';
```

**Props**:
```tsx
{
  players: Player[],
  onPlayerSelect?: (player: Player) => void,
  onPlayerCompare?: (players: Player[]) => void,
  viewMode?: 'grid' | 'list',
  filters?: RosterFilters,
  sortBy?: RosterSortOption
}
```

**Example**:
```tsx
<RosterGrid
  players={allPlayers}
  onPlayerSelect={(player) => showDetails(player)}
  onPlayerCompare={(players) => showComparison(players)}
  viewMode="grid"
  filters={{ positions: ['ST', 'CF'], minOverall: 80 }}
  sortBy={{ field: 'overall', order: 'desc' }}
/>
```

### FilterPanel

Advanced filtering for roster.

**Props**:
```tsx
{
  filters: RosterFilters,
  onChange: (filters: RosterFilters) => void,
  onSave?: (name: string, filters: RosterFilters) => void,
  savedFilters?: SavedFilter[]
}
```

**Example**:
```tsx
<FilterPanel
  filters={currentFilters}
  onChange={setFilters}
  onSave={(name, filters) => saveFilter(name, filters)}
  savedFilters={myFilters}
/>
```

---

## Hooks

### useAuthContext

Access authentication context.

**Returns**:
```tsx
{
  authState: {
    isAuthenticated: boolean,
    user: User | null,
    loading: boolean
  },
  login: (credentials) => Promise<void>,
  logout: () => Promise<void>,
  updateUser: (user: User) => void
}
```

### useLocalStorage

Persist state in localStorage.

**Signature**:
```tsx
useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void]
```

**Example**:
```tsx
const [theme, setTheme] = useLocalStorage('theme', 'dark');
```

### useDebounce

Debounce a value.

**Signature**:
```tsx
useDebounce<T>(value: T, delay: number): T
```

**Example**:
```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## Utilities

### Roster Helpers

**calculatePlayerOverall**:
```tsx
calculatePlayerOverall(player: Player): number
```

**filterPlayers**:
```tsx
filterPlayers(
  players: Player[],
  filters: RosterFilters
): Player[]
```

**sortPlayers**:
```tsx
sortPlayers(
  players: Player[],
  sortBy: RosterSortOption
): Player[]
```

**exportToCSV**:
```tsx
exportToCSV(
  players: Player[],
  filename?: string
): void
```

**exportToJSON**:
```tsx
exportToJSON(
  players: Player[],
  filename?: string
): void
```

### Style Utilities

**getButtonStyles**:
```tsx
getButtonStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth?: boolean,
  disabled?: boolean
): React.CSSProperties
```

**getCardStyles**:
```tsx
getCardStyles(
  variant: CardVariant,
  padding?: string,
  clickable?: boolean
): React.CSSProperties
```

**getGlassMorphismStyles**:
```tsx
getGlassMorphismStyles(
  blur?: number,
  opacity?: number
): React.CSSProperties
```

### Football Utilities

**getPositionColor**:
```tsx
getPositionColor(position: string): string
// Returns color for football positions (GK, CB, ST, etc.)
```

**getMoraleColor**:
```tsx
getMoraleColor(morale: string): string
// Returns color for morale states (excellent, good, etc.)
```

**getRoleColor**:
```tsx
getRoleColor(role: string): string
// Returns color for user roles (admin, coach, player, etc.)
```

---

## Type Definitions

### Player

```tsx
interface Player {
  id: string;
  name: string;
  position: Position;
  overall: number;
  potential: number;
  age: number;
  nationality: string;
  club: string;
  attributes: PlayerAttributes;
  morale: MoraleState;
}
```

### Theme

```tsx
interface Theme {
  mode: 'light' | 'dark';
  colors: {
    text: TextColors;
    background: BackgroundColors;
    border: BorderColors;
    brand: BrandColors;
    semantic: SemanticColors;
  };
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  transitions: Transitions;
}
```

### PerformanceMetrics

```tsx
interface PerformanceMetrics {
  renderTime: number;
  timeSinceLastRender: number;
  renderCount: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}
```

---

## Best Practices

### Performance

1. **Use memoization for expensive components**:
   ```tsx
   const ExpensiveList = MemoizedListItem(ListItem);
   ```

2. **Monitor performance in development**:
   ```tsx
   useRenderPerformance('MyComponent');
   ```

3. **Clean up effects**:
   ```tsx
   const { track } = useEffectCleanup('MyComponent');
   track(() => cleanup());
   ```

### Theming

1. **Use theme tokens**:
   ```tsx
   const { theme } = useTheme();
   style={{ color: theme.colors.text.primary }}
   ```

2. **Persist user preferences**:
   ```tsx
   <ThemeProvider storageKey="user-theme" />
   ```

### Accessibility

1. **Provide ARIA labels**:
   ```tsx
   <button aria-label="Toggle theme">🌙</button>
   ```

2. **Support keyboard navigation**:
   ```tsx
   <div role="button" tabIndex={0} onKeyPress={handleKey} />
   ```

---

For more examples, see the test files in `src/__tests__/`.
