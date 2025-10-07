import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CollaborationUser, CursorPosition } from '../../../types/collaboration';

interface RemoteCursorsProps {
  users: CollaborationUser[];
  currentUserId: string;
}

/**
 * Displays cursors of other users in the session
 */
export const RemoteCursors: React.FC<RemoteCursorsProps> = ({ users, currentUserId }) => {
  const otherUsers = users.filter(u => u.id !== currentUserId && u.cursor && u.isOnline);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {otherUsers.map(
          user => user.cursor && <RemoteCursor key={user.id} user={user} position={user.cursor} />,
        )}
      </AnimatePresence>
    </div>
  );
};

interface RemoteCursorProps {
  user: CollaborationUser;
  position: CursorPosition;
}

const RemoteCursor: React.FC<RemoteCursorProps> = ({ user, position }) => {
  const [visible, setVisible] = useState(true);

  // Hide cursor after inactivity
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [position]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: visible ? 1 : 0, scale: 1, x: `${position.x}%`, y: `${position.y}%` }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute"
      style={{ left: 0, top: 0 }}
    >
      {/* Cursor pointer */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute top-6 left-6 px-2 py-1 rounded text-xs font-semibold text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>

      {/* Cursor trail effect */}
      <motion.div
        className="absolute -left-1 -top-1 w-6 h-6 rounded-full"
        style={{ backgroundColor: user.color, opacity: 0.3 }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
    </motion.div>
  );
};

interface PresenceIndicatorsProps {
  users: CollaborationUser[];
  currentUserId: string;
  onUserClick?: (userId: string) => void;
}

/**
 * Shows list of active users in the session
 */
export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  users,
  currentUserId,
  onUserClick,
}) => {
  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="popLayout">
        {users.map(user => (
          <PresenceAvatar
            key={user.id}
            user={user}
            isCurrentUser={user.id === currentUserId}
            onClick={() => {
              onUserClick?.(user.id);
            }}
          />
        ))}
      </AnimatePresence>

      <div className="text-sm text-slate-400 ml-2">
        {users.filter(u => u.isOnline).length} online
      </div>
    </div>
  );
};

interface PresenceAvatarProps {
  user: CollaborationUser;
  isCurrentUser: boolean;
  onClick: () => void;
}

const PresenceAvatar: React.FC<PresenceAvatarProps> = ({ user, isCurrentUser, onClick }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      className="relative cursor-pointer"
      onClick={onClick}
    >
      {/* Avatar circle */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg"
        style={{ backgroundColor: user.color }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span>{user.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Online status indicator */}
      <motion.div
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
          user.isOnline ? 'bg-green-500' : 'bg-slate-400'
        }`}
        animate={
          user.isOnline
            ? {
                scale: [1, 1.2, 1],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Current user indicator */}
      {isCurrentUser && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap">
          You
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-slate-900 text-white px-3 py-1 rounded text-xs whitespace-nowrap shadow-lg">
          {user.name}
          {user.isOnline ? (
            <span className="text-green-400 ml-2">● Online</span>
          ) : (
            <span className="text-slate-400 ml-2">● Offline</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  latency?: number;
  error?: string;
  onReconnect?: () => void;
}

/**
 * Shows WebSocket connection status
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  latency,
  error,
  onReconnect,
}) => {
  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg"
      >
        <motion.div
          className="w-2 h-2 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <span className="text-green-400 text-sm font-medium">Connected</span>
        {latency !== undefined && <span className="text-green-300 text-xs">({latency}ms)</span>}
      </motion.div>
    );
  }

  if (isConnecting) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg"
      >
        <motion.div
          className="w-2 h-2 bg-yellow-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <span className="text-yellow-400 text-sm font-medium">Connecting...</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full" />
      <span className="text-red-400 text-sm font-medium">{error || 'Disconnected'}</span>
      {onReconnect && (
        <button onClick={onReconnect} className="text-xs text-red-300 hover:text-red-200 underline">
          Reconnect
        </button>
      )}
    </motion.div>
  );
};

interface ActivityIndicatorProps {
  userId: string;
  userName: string;
  userColor: string;
  activity: string;
}

/**
 * Shows brief notification of user activity
 */
export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  userId,
  userName,
  userColor,
  activity,
}) => {
  return (
    <motion.div
      key={userId}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="flex items-center gap-3 px-4 py-2 bg-slate-800/90 border border-slate-700 rounded-lg shadow-lg"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
        style={{ backgroundColor: userColor }}
      >
        {userName.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="text-white text-sm font-medium">{userName}</div>
        <div className="text-slate-400 text-xs">{activity}</div>
      </div>
    </motion.div>
  );
};

interface CollaborationPanelProps {
  users: CollaborationUser[];
  currentUserId: string;
  isConnected: boolean;
  isConnecting: boolean;
  latency?: number;
  onInviteUser?: () => void;
  onUserClick?: (userId: string) => void;
}

/**
 * Combined panel showing connection status and presence
 */
export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  users,
  currentUserId,
  isConnected,
  isConnecting,
  latency,
  onInviteUser,
  onUserClick,
}) => {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl">
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} latency={latency} />

      {/* Divider */}
      <div className="w-px h-8 bg-slate-700" />

      {/* Presence Indicators */}
      <PresenceIndicators users={users} currentUserId={currentUserId} onUserClick={onUserClick} />

      {/* Invite Button */}
      {onInviteUser && isConnected && (
        <>
          <div className="w-px h-8 bg-slate-700" />
          <button
            onClick={onInviteUser}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Invite
          </button>
        </>
      )}
    </div>
  );
};
