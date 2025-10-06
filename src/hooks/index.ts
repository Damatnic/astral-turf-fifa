export * from './useFranchiseContext';
export * from './useTacticsContext';
export * from './useUIContext';
export * from './useAuthContext';
export { useChallengeContext } from '../context/ChallengeContext';

// Mobile-First Responsive Design Hooks
export {
  useResponsive,
  useMobileDetection,
  useResponsiveModal,
  useResponsiveNavigation,
  BREAKPOINTS,
} from './useResponsive.tsx';

// Formation Transition Animations
export { useFormationTransition } from './useFormationTransition';
export type { TransitionConfig, PlayerTransition } from './useFormationTransition';
