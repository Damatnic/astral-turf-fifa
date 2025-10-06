import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import {
  Users,
  Wifi,
  WifiOff,
  MessageCircle,
  Share2,
  Lock,
  Unlock,
  MousePointer,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Copy,
  Crown,
  UserX,
} from 'lucide-react';
import type { Player, Formation } from '../../types';

interface CollaborationUser {
  id: string;
  name: string;
  role: 'coach' | 'assistant' | 'analyst' | 'viewer';
  avatar?: string;
  isOnline: boolean;
  cursor?: { x: number; y: number };
  color: string;
  permissions: {
    canEdit: boolean;
    canMove: boolean;
    canDraw: boolean;
    canChat: boolean;
  };
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'tactical-note' | 'system';
}

interface CollaborationSession {
  id: string;
  name: string;
  isActive: boolean;
  users: CollaborationUser[];
  owner: string;
  settings: {
    allowGuests: boolean;
    requireApproval: boolean;
    maxUsers: number;
    lockFormation: boolean;
  };
}

interface RealTimeCollaborationProps {
  currentUser: CollaborationUser;
  formation: Formation;
  onFormationChange: (formation: Formation) => void;
  onUserJoin?: (user: CollaborationUser) => void;
  onUserLeave?: (userId: string) => void;
}

export const RealTimeCollaboration: React.FC<RealTimeCollaborationProps> = ({
  currentUser,
  formation,
  onFormationChange,
  onUserJoin,
  onUserLeave,
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [session, setSession] = useState<CollaborationSession>({
    id: 'session-1',
    name: 'Tactical Board Session',
    isActive: true,
    owner: currentUser.id,
    users: [
      currentUser,
      {
        id: 'user-2',
        name: 'John Martinez',
        role: 'assistant',
        isOnline: true,
        color: '#4ade80',
        cursor: { x: 300, y: 200 },
        permissions: { canEdit: true, canMove: true, canDraw: true, canChat: true },
      },
      {
        id: 'user-3',
        name: 'Sarah Chen',
        role: 'analyst',
        isOnline: true,
        color: '#f59e0b',
        cursor: { x: 450, y: 350 },
        permissions: { canEdit: false, canMove: false, canDraw: true, canChat: true },
      },
      {
        id: 'user-4',
        name: 'Mike Wilson',
        role: 'viewer',
        isOnline: false,
        color: '#8b5cf6',
        permissions: { canEdit: false, canMove: false, canDraw: false, canChat: true },
      },
    ],
    settings: {
      allowGuests: true,
      requireApproval: false,
      maxUsers: 8,
      lockFormation: false,
    },
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'user-2',
      userName: 'John Martinez',
      message: 'What do you think about switching to 4-3-3?',
      timestamp: new Date(Date.now() - 5 * 60000),
      type: 'text',
    },
    {
      id: '2',
      userId: currentUser.id,
      userName: currentUser.name,
      message: 'Good idea, let me adjust the formation',
      timestamp: new Date(Date.now() - 3 * 60000),
      type: 'text',
    },
    {
      id: '3',
      userId: 'system',
      userName: 'System',
      message: 'Sarah Chen added a tactical note',
      timestamp: new Date(Date.now() - 1 * 60000),
      type: 'system',
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showCursors, setShowCursors] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulate real-time cursor movements
  useEffect(() => {
    const interval = setInterval(() => {
      setSession(prev => ({
        ...prev,
        users: prev.users.map(user => {
          if (user.id !== currentUser.id && user.isOnline && user.cursor) {
            return {
              ...user,
              cursor: {
                x: user.cursor.x + (Math.random() - 0.5) * 20,
                y: user.cursor.y + (Math.random() - 0.5) * 20,
              },
            };
          }
          return user;
        }),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!newMessage.trim()) {
      return;
    }

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      message: newMessage,
      timestamp: new Date(),
      type: 'text',
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');

    if (soundEnabled) {
      // Simulate notification sound
      console.log('🔊 Message sent');
    }
  };

  const shareSession = async () => {
    const shareUrl = `${window.location.origin}/tactics/session/${session.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      console.log('Session URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const toggleUserPermission = (
    userId: string,
    permission: keyof CollaborationUser['permissions']
  ) => {
    if (session.owner !== currentUser.id) {
      return;
    }

    setSession(prev => ({
      ...prev,
      users: prev.users.map(user =>
        user.id === userId
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [permission]: !user.permissions[permission],
              },
            }
          : user
      ),
    }));
  };

  const removeUser = (userId: string) => {
    if (session.owner !== currentUser.id || userId === currentUser.id) {
      return;
    }

    setSession(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== userId),
    }));

    onUserLeave?.(userId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coach':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'assistant':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'analyst':
        return <Eye className="w-4 h-4 text-purple-400" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coach':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'assistant':
        return 'bg-blue-500/20 text-blue-400';
      case 'analyst':
        return 'bg-purple-500/20 text-purple-400';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
      {/* Connection Status & Session Info */}
      <div className="lg:col-span-3">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <span>Real-Time Collaboration</span>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={shareSession}
                  className="bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>

                <Button
                  size="sm"
                  onClick={() => setShowCursors(!showCursors)}
                  className="bg-white/10 hover:bg-white/20 border-white/20"
                >
                  {showCursors ? (
                    <MousePointer className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="bg-white/10 hover:bg-white/20 border-white/20"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-white">Session: {session.name}</span>
                <Badge className="bg-green-500/20 text-green-400">
                  {session.users.filter(u => u.isOnline).length} online
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {session.settings.lockFormation ? (
                  <Lock className="w-4 h-4 text-red-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-green-400" />
                )}
                <span className="text-sm text-gray-300">
                  Formation {session.settings.lockFormation ? 'Locked' : 'Unlocked'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Panel */}
      <div className="lg:col-span-1">
        <Card className="bg-white/5 border-white/10 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-blue-400" />
              Active Users ({session.users.filter(u => u.isOnline).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {session.users.map(user => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  user.isOnline
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/5 border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        user.isOnline ? 'bg-green-400' : 'bg-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{user.name}</span>
                      {user.id === session.owner && <Crown className="w-3 h-3 text-yellow-400" />}
                    </div>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </Badge>
                  </div>
                </div>

                {session.owner === currentUser.id && user.id !== currentUser.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUser(user.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {session.owner === currentUser.id && (
              <Button className="w-full bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30">
                <Users className="w-4 h-4 mr-2" />
                Invite Users
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Chat */}
      <div className="lg:col-span-2">
        <Card className="bg-white/5 border-white/10 h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-400" />
                Team Chat
              </div>
              <Button
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="bg-white/10 hover:bg-white/20 border-white/20"
              >
                {showChat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>

          {showChat && (
            <CardContent className="flex flex-col h-80">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.userId === currentUser.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.userId !== currentUser.id && message.type !== 'system' && (
                      <Avatar className="w-6 h-6 mt-1">
                        <AvatarFallback className="text-xs">
                          {message.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-xs lg:max-w-md ${
                        message.userId === currentUser.id ? 'order-first' : ''
                      }`}
                    >
                      {message.type === 'system' ? (
                        <div className="text-center">
                          <Badge className="bg-blue-500/20 text-blue-400">{message.message}</Badge>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`p-3 rounded-lg ${
                              message.userId === currentUser.id
                                ? 'bg-blue-500/20 text-blue-100'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <span className="text-xs text-gray-400">{message.userName}</span>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-green-500/20 hover:bg-green-500/30 border-green-500/30"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Live Cursors Overlay */}
      {showCursors && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {session.users
            .filter(user => user.id !== currentUser.id && user.isOnline && user.cursor)
            .map(user => (
              <div
                key={user.id}
                className="absolute transition-all duration-100 ease-out"
                style={{
                  left: user.cursor!.x,
                  top: user.cursor!.y,
                  transform: 'translate(-2px, -2px)',
                }}
              >
                <div className="relative">
                  <MousePointer className="w-5 h-5" style={{ color: user.color }} />
                  <div
                    className="absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium pointer-events-none whitespace-nowrap"
                    style={{
                      backgroundColor: user.color,
                      color: 'white',
                    }}
                  >
                    {user.name}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
