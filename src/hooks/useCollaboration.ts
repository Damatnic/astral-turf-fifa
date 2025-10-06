import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CollaborationUser,
  CollaborationSession,
  CollaborationEvent,
  ConnectionStatus,
  CursorPosition,
  PlayerMoveEvent,
  PlayerUpdateEvent,
  ChatMessage,
} from '../types/collaboration';

// Simulated WebSocket - Replace with actual socket.io in production
interface WebSocketClient {
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: unknown) => void;
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback?: (data: unknown) => void) => void;
}

interface UseCollaborationOptions {
  sessionId: string;
  userId: string;
  userName: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
}

interface UseCollaborationReturn {
  // Connection state
  status: ConnectionStatus;
  session: CollaborationSession | null;
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;

  // Connection management
  connect: () => void;
  disconnect: () => void;

  // User actions
  updateCursor: (position: CursorPosition) => void;
  sendPlayerMove: (playerId: string, position: { x: number; y: number }) => void;
  sendPlayerUpdate: (playerId: string, updates: Record<string, unknown>) => void;
  sendChatMessage: (message: string) => void;

  // Session management
  inviteUser: (userId: string) => void;
  kickUser: (userId: string) => void;

  // Events
  onPlayerMove: (callback: (event: PlayerMoveEvent) => void) => void;
  onPlayerUpdate: (callback: (event: PlayerUpdateEvent) => void) => void;
  onUserJoined: (callback: (user: CollaborationUser) => void) => void;
  onUserLeft: (callback: (userId: string) => void) => void;
  onChatMessage: (callback: (message: ChatMessage) => void) => void;
}

// User colors for cursor/presence
const USER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

/**
 * Hook for real-time collaboration
 */
export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  const { sessionId, userId, userName, autoConnect = true, reconnectInterval = 5000 } = options;

  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
  });

  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);

  const wsRef = useRef<WebSocketClient | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Event callbacks
  const playerMoveCallbacks = useRef<Array<(event: PlayerMoveEvent) => void>>([]);
  const playerUpdateCallbacks = useRef<Array<(event: PlayerUpdateEvent) => void>>([]);
  const userJoinedCallbacks = useRef<Array<(user: CollaborationUser) => void>>([]);
  const userLeftCallbacks = useRef<Array<(userId: string) => void>>([]);
  const chatMessageCallbacks = useRef<Array<(message: ChatMessage) => void>>([]);

  // Create simulated WebSocket client
  const createWebSocketClient = useCallback((): WebSocketClient => {
    // In production, replace with:
    // import io from 'socket.io-client';
    // return io(WEBSOCKET_URL, { query: { sessionId, userId } });

    const eventHandlers = new Map<string, Array<(data: unknown) => void>>();

    return {
      connect: () => {
        // Simulate connection
        setTimeout(() => {
          setStatus({
            isConnected: true,
            isConnecting: false,
            latency: 50,
          });

          // Simulate initial session data
          const mockSession: CollaborationSession = {
            id: sessionId,
            name: 'Tactical Planning',
            createdBy: userId,
            createdAt: Date.now(),
            users: [],
            isActive: true,
            permissions: {
              allowEdit: true,
              allowInvite: true,
              allowKick: false,
              isPublic: false,
            },
          };

          setSession(mockSession);

          // Simulate current user
          const user: CollaborationUser = {
            id: userId,
            name: userName,
            color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
            isOnline: true,
            lastSeenAt: Date.now(),
          };

          setCurrentUser(user);
          setUsers([user]);
        }, 500);
      },

      disconnect: () => {
        setStatus({
          isConnected: false,
          isConnecting: false,
        });
      },

      emit: (event: string, data: unknown) => {
        // Simulate server processing
        const handlers = eventHandlers.get(event);
        if (handlers) {
          setTimeout(() => {
            handlers.forEach(handler => {
              handler(data);
            });
          }, 10);
        }
      },

      on: (event: string, callback: (data: unknown) => void) => {
        if (!eventHandlers.has(event)) {
          eventHandlers.set(event, []);
        }
        eventHandlers.get(event)!.push(callback);
      },

      off: (event: string, callback?: (data: unknown) => void) => {
        if (!callback) {
          eventHandlers.delete(event);
        } else {
          const handlers = eventHandlers.get(event);
          if (handlers) {
            const filtered = handlers.filter(h => h !== callback);
            eventHandlers.set(event, filtered);
          }
        }
      },
    };
  }, [sessionId, userId, userName]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (status.isConnected || status.isConnecting) {
      return;
    }

    setStatus({
      isConnected: false,
      isConnecting: true,
    });

    const ws = createWebSocketClient();
    wsRef.current = ws;

    // Set up event handlers
    ws.on('user-joined', data => {
      const user = data as CollaborationUser;
      setUsers(prev => {
        if (prev.find(u => u.id === user.id)) {
          return prev;
        }
        return [...prev, user];
      });

      userJoinedCallbacks.current.forEach(cb => {
        cb(user);
      });
    });

    ws.on('user-left', data => {
      const { userId: leftUserId } = data as { userId: string };
      setUsers(prev => prev.filter(u => u.id !== leftUserId));
      userLeftCallbacks.current.forEach(cb => {
        cb(leftUserId);
      });
    });

    ws.on('cursor-move', data => {
      const { userId: cursorUserId, position } = data as {
        userId: string;
        position: CursorPosition;
      };
      setUsers(prev => prev.map(u => (u.id === cursorUserId ? { ...u, cursor: position } : u)));
    });

    ws.on('player-move', data => {
      const event = data as PlayerMoveEvent;
      playerMoveCallbacks.current.forEach(cb => {
        cb(event);
      });
    });

    ws.on('player-update', data => {
      const event = data as PlayerUpdateEvent;
      playerUpdateCallbacks.current.forEach(cb => {
        cb(event);
      });
    });

    ws.on('chat-message', data => {
      const message = data as ChatMessage;
      chatMessageCallbacks.current.forEach(cb => {
        cb(message);
      });
    });

    ws.connect();

    // Start heartbeat
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current && status.isConnected) {
        const pingStart = Date.now();
        wsRef.current.emit('ping', { timestamp: pingStart });

        wsRef.current.on('pong', () => {
          const latency = Date.now() - pingStart;
          setStatus(prev => ({ ...prev, latency, lastPingAt: Date.now() }));
        });
      }
    }, 10000);
  }, [status.isConnected, status.isConnecting, createWebSocketClient]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }

    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // Auto-connect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update cursor position
  const updateCursor = useCallback(
    (position: CursorPosition) => {
      if (!wsRef.current || !status.isConnected) {
        return;
      }

      wsRef.current.emit('cursor-move', {
        userId,
        sessionId,
        position,
        timestamp: Date.now(),
      });
    },
    [userId, sessionId, status.isConnected]
  );

  // Send player move
  const sendPlayerMove = useCallback(
    (playerId: string, position: { x: number; y: number }) => {
      if (!wsRef.current || !status.isConnected) {
        return;
      }

      const event: PlayerMoveEvent = {
        playerId,
        position,
        userId,
        timestamp: Date.now(),
      };

      wsRef.current.emit('player-move', event);
    },
    [userId, status.isConnected]
  );

  // Send player update
  const sendPlayerUpdate = useCallback(
    (playerId: string, updates: Record<string, unknown>) => {
      if (!wsRef.current || !status.isConnected) {
        return;
      }

      const event: PlayerUpdateEvent = {
        playerId,
        updates,
        userId,
        timestamp: Date.now(),
      };

      wsRef.current.emit('player-update', event);
    },
    [userId, status.isConnected]
  );

  // Send chat message
  const sendChatMessage = useCallback(
    (message: string) => {
      if (!wsRef.current || !status.isConnected) {
        return;
      }

      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        userName,
        message,
        timestamp: Date.now(),
      };

      wsRef.current.emit('chat-message', chatMessage);
    },
    [userId, userName, status.isConnected]
  );

  // Invite user
  const inviteUser = useCallback(
    (inviteUserId: string) => {
      if (!wsRef.current || !status.isConnected) {
        return;
      }

      wsRef.current.emit('invite-user', {
        sessionId,
        userId: inviteUserId,
        invitedBy: userId,
      });
    },
    [sessionId, userId, status.isConnected]
  );

  // Kick user
  const kickUser = useCallback(
    (kickUserId: string) => {
      if (!wsRef.current || !status.isConnected || !session?.permissions.allowKick) {
        return;
      }

      wsRef.current.emit('kick-user', {
        sessionId,
        userId: kickUserId,
        kickedBy: userId,
      });
    },
    [sessionId, userId, status.isConnected, session]
  );

  // Event subscription helpers
  const onPlayerMove = useCallback((callback: (event: PlayerMoveEvent) => void) => {
    playerMoveCallbacks.current.push(callback);
    return () => {
      playerMoveCallbacks.current = playerMoveCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  const onPlayerUpdate = useCallback((callback: (event: PlayerUpdateEvent) => void) => {
    playerUpdateCallbacks.current.push(callback);
    return () => {
      playerUpdateCallbacks.current = playerUpdateCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  const onUserJoined = useCallback((callback: (user: CollaborationUser) => void) => {
    userJoinedCallbacks.current.push(callback);
    return () => {
      userJoinedCallbacks.current = userJoinedCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  const onUserLeft = useCallback((callback: (userId: string) => void) => {
    userLeftCallbacks.current.push(callback);
    return () => {
      userLeftCallbacks.current = userLeftCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  const onChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
    chatMessageCallbacks.current.push(callback);
    return () => {
      chatMessageCallbacks.current = chatMessageCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  return {
    // Connection state
    status,
    session,
    users,
    currentUser,

    // Connection management
    connect,
    disconnect,

    // User actions
    updateCursor,
    sendPlayerMove,
    sendPlayerUpdate,
    sendChatMessage,

    // Session management
    inviteUser,
    kickUser,

    // Events
    onPlayerMove,
    onPlayerUpdate,
    onUserJoined,
    onUserLeft,
    onChatMessage,
  };
}
