import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationVariants } from '../../utils/animationVariants';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

/**
 * NotificationSystem - Animated toast notifications
 *
 * Features:
 * - Spring-based entrance animation
 * - Auto-dismiss with configurable duration
 * - Different types (success, error, warning, info)
 * - Swipe to dismiss
 * - Stacked notifications with spacing
 * - Color-coded by type
 */
export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
  position = 'top-right',
}) => {
  // Position styles
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  // Type-specific styles
  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: '✓',
          ring: 'ring-green-400',
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: '✕',
          ring: 'ring-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: '⚠',
          ring: 'ring-yellow-400',
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          icon: 'ℹ',
          ring: 'ring-blue-400',
        };
    }
  };

  return (
    <div className={`fixed z-50 ${positionStyles[position]} space-y-3`}>
      <AnimatePresence mode="popLayout">
        {notifications.map(notification => {
          const styles = getTypeStyles(notification.type);

          return (
            <motion.div
              key={notification.id}
              variants={notificationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                // Dismiss if dragged far enough
                if (Math.abs(info.offset.x) > 100) {
                  onDismiss(notification.id);
                }
              }}
              className={`relative flex items-start gap-3 min-w-80 max-w-md p-4 ${styles.bg} text-white rounded-lg shadow-xl ring-2 ${styles.ring}  cursor-grab active:cursor-grabbing`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-slate-700 rounded-full text-lg font-bold">
                {styles.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base">{notification.title}</h4>
                {notification.message && (
                  <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                )}
              </div>

              {/* Dismiss button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDismiss(notification.id)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded-full transition-colors"
              >
                ✕
              </motion.button>

              {/* Progress bar (if duration is set) */}
              {notification.duration && (
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-white/40 rounded-b-lg"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{
                    duration: notification.duration / 1000,
                    ease: 'linear',
                  }}
                  onAnimationComplete={() => onDismiss(notification.id)}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;
