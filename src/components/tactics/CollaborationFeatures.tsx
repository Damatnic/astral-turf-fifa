import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Share2,
  MessageCircle,
  Video,
  Mic,
  MicOff,
  VideoOff,
  UserPlus,
  Eye,
  Edit3,
  Send,
  Clock,
  Circle,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Crown,
  Settings,
  X,
  Plus,
  Camera,
  Download,
  Upload,
  Globe,
  Lock,
  Zap,
  Bell,
  BellOff,
} from 'lucide-react';
import { type Player, type Formation } from '../../types';

interface Collaborator {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
  isOnline: boolean;
  cursor?: { x: number; y: number };
  lastActivity: Date;
  permissions: CollaboratorPermissions;
}

interface CollaboratorPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canModifyFormations: boolean;
  canManagePlayers: boolean;
}

interface Comment {
  id: string;
  authorId: string;
  content: string;
  position: { x: number; y: number };
  timestamp: Date;
  isResolved: boolean;
  replies: CommentReply[];
  attachments?: string[];
}

interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
}

interface CollaborationSession {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  isLive: boolean;
  collaborators: Collaborator[];
  comments: Comment[];
  shareLink: string;
  visibility: 'public' | 'private' | 'team';
  version: number;
}

interface CollaborationFeaturesProps {
  formation: Formation | undefined;
  players: Player[];
  currentUser: { id: string; name: string; role: string };
  session?: CollaborationSession;
  onShareSession: (visibility: 'public' | 'private' | 'team') => void;
  onInviteCollaborator: (email: string, role: 'editor' | 'viewer') => void;
  onAddComment: (position: { x: number; y: number }, content: string) => void;
  onResolveComment: (commentId: string) => void;
  onUpdatePermissions: (collaboratorId: string, permissions: CollaboratorPermissions) => void;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'collaborators' | 'comments' | 'share' | 'session';

const CollaborationFeatures: React.FC<CollaborationFeaturesProps> = ({
  formation,
  players,
  currentUser,
  session,
  onShareSession,
  onInviteCollaborator,
  onAddComment,
  onResolveComment,
  onUpdatePermissions,
  className,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('collaborators');
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [shareLink, setShareLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Mock collaboration session data
  const mockSession = useMemo(
    (): CollaborationSession => ({
      id: 'session-123',
      name: 'Tactical Planning Session',
      createdBy: currentUser.id,
      createdAt: new Date(),
      isLive: liveMode,
      collaborators: [
        {
          id: currentUser.id,
          name: currentUser.name,
          role: 'owner',
          isOnline: true,
          lastActivity: new Date(),
          permissions: {
            canEdit: true,
            canComment: true,
            canShare: true,
            canModifyFormations: true,
            canManagePlayers: true,
          },
        },
        {
          id: 'user-2',
          name: 'Assistant Coach',
          role: 'editor',
          isOnline: true,
          cursor: { x: 45, y: 30 },
          lastActivity: new Date(Date.now() - 2 * 60 * 1000),
          permissions: {
            canEdit: true,
            canComment: true,
            canShare: false,
            canModifyFormations: true,
            canManagePlayers: false,
          },
        },
        {
          id: 'user-3',
          name: 'Team Analyst',
          role: 'viewer',
          isOnline: false,
          lastActivity: new Date(Date.now() - 15 * 60 * 1000),
          permissions: {
            canEdit: false,
            canComment: true,
            canShare: false,
            canModifyFormations: false,
            canManagePlayers: false,
          },
        },
      ],
      comments: [
        {
          id: 'comment-1',
          authorId: 'user-2',
          content: 'Should we move the midfielder higher up the pitch?',
          position: { x: 50, y: 45 },
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          isResolved: false,
          replies: [
            {
              id: 'reply-1',
              authorId: currentUser.id,
              content: 'Good point, let me adjust that.',
              timestamp: new Date(Date.now() - 8 * 60 * 1000),
            },
          ],
        },
        {
          id: 'comment-2',
          authorId: 'user-3',
          content: 'Defensive line looks solid 👍',
          position: { x: 20, y: 60 },
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          isResolved: true,
          replies: [],
        },
      ],
      shareLink: 'https://tactics.app/share/session-123',
      visibility: 'team',
      version: 1,
    }),
    [currentUser, liveMode]
  );

  const currentSession = session || mockSession;

  const handleAddComment = useCallback(() => {
    if (newComment.trim() && commentPosition) {
      onAddComment(commentPosition, newComment.trim());
      setNewComment('');
      setCommentPosition(null);
    }
  }, [newComment, commentPosition, onAddComment]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentSession.shareLink);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, [currentSession.shareLink]);

  const handleInviteCollaborator = useCallback(() => {
    if (inviteEmail.trim()) {
      onInviteCollaborator(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setShowInviteModal(false);
    }
  }, [inviteEmail, inviteRole, onInviteCollaborator]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'editor':
        return 'text-blue-400 bg-blue-900/30';
      case 'viewer':
        return 'text-green-400 bg-green-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const tabs = [
    { id: 'collaborators', name: 'Team', icon: Users, count: currentSession.collaborators.length },
    {
      id: 'comments',
      name: 'Comments',
      icon: MessageCircle,
      count: currentSession.comments.filter(c => !c.isResolved).length,
    },
    { id: 'share', name: 'Share', icon: Share2, count: 0 },
    { id: 'session', name: 'Session', icon: Video, count: 0 },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`
          bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl
          w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Collaboration Hub</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  {currentSession.isLive ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Live Session
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" />
                      Offline Session
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {currentSession.collaborators.filter(c => c.isOnline).length} online
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotifications(!notifications)}
              className={`p-2 rounded-lg transition-colors ${
                notifications
                  ? 'text-yellow-400 bg-yellow-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={notifications ? 'Disable notifications' : 'Enable notifications'}
            >
              {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/50">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative
                  ${
                    activeTab === tab.id
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                {tab.name}
                {tab.count > 0 && (
                  <span
                    className={`
                    px-1.5 py-0.5 rounded text-xs
                    ${activeTab === tab.id ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/50 text-slate-300'}
                  `}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeCollabTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Collaborators Tab */}
            {activeTab === 'collaborators' && (
              <motion.div
                key="collaborators"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Team Members</h3>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </button>
                </div>

                <div className="space-y-4 h-[calc(100%-5rem)] overflow-y-auto">
                  {currentSession.collaborators.map(collaborator => (
                    <motion.div
                      key={collaborator.id}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-600/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {collaborator.name.charAt(0)}
                          </div>
                          <div
                            className={`
                            absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800
                            ${collaborator.isOnline ? 'bg-green-500' : 'bg-slate-500'}
                          `}
                          />
                          {collaborator.role === 'owner' && (
                            <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{collaborator.name}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getRoleColor(collaborator.role)}`}
                            >
                              {collaborator.role}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            {collaborator.isOnline
                              ? 'Online'
                              : `Last seen ${formatTimeAgo(collaborator.lastActivity)}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {collaborator.permissions.canEdit && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Can edit" />
                        )}
                        {collaborator.permissions.canComment && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Can comment" />
                        )}
                        {collaborator.permissions.canShare && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full" title="Can share" />
                        )}
                        <button className="p-1 text-slate-400 hover:text-white transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <motion.div
                key="comments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="p-6 border-b border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Comments & Feedback</h3>

                  {/* Add Comment Input */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                      className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {currentSession.comments.map(comment => {
                    const author = currentSession.collaborators.find(
                      c => c.id === comment.authorId
                    );
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border ${
                          comment.isResolved
                            ? 'bg-green-900/20 border-green-500/30 opacity-75'
                            : 'bg-slate-800/40 border-slate-600/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {author?.name.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {author?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {formatTimeAgo(comment.timestamp)}
                              </div>
                            </div>
                          </div>

                          {!comment.isResolved && (
                            <button
                              onClick={() => onResolveComment(comment.id)}
                              className="text-xs text-green-400 hover:text-green-300 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </div>

                        <p className="text-slate-300 mb-3">{comment.content}</p>

                        {comment.replies.length > 0 && (
                          <div className="space-y-2 ml-4 border-l-2 border-slate-600 pl-4">
                            {comment.replies.map(reply => {
                              const replyAuthor = currentSession.collaborators.find(
                                c => c.id === reply.authorId
                              );
                              return (
                                <div key={reply.id} className="text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white">
                                      {replyAuthor?.name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {formatTimeAgo(reply.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-slate-300">{reply.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Share Tab */}
            {activeTab === 'share' && (
              <motion.div
                key="share"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Share Session</h3>

                <div className="space-y-6">
                  {/* Share Link */}
                  <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-6">
                    <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Share Link
                    </h4>

                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={currentSession.shareLink}
                        readOnly
                        className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {isLinkCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {isLinkCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="text-sm text-slate-400">
                      Anyone with this link can view the session according to the visibility
                      settings below.
                    </div>
                  </div>

                  {/* Visibility Settings */}
                  <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-6">
                    <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Visibility
                    </h4>

                    <div className="space-y-3">
                      {[
                        {
                          id: 'private',
                          label: 'Private',
                          desc: 'Only invited members can access',
                          icon: Lock,
                        },
                        {
                          id: 'team',
                          label: 'Team',
                          desc: 'Anyone in your organization can view',
                          icon: Users,
                        },
                        {
                          id: 'public',
                          label: 'Public',
                          desc: 'Anyone with the link can view',
                          icon: Globe,
                        },
                      ].map(option => {
                        const IconComponent = option.icon;
                        return (
                          <label
                            key={option.id}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors"
                          >
                            <input
                              type="radio"
                              name="visibility"
                              value={option.id}
                              checked={currentSession.visibility === option.id}
                              onChange={() => onShareSession(option.id as any)}
                              className="w-4 h-4 text-purple-600"
                            />
                            <IconComponent className="w-5 h-5 text-slate-400" />
                            <div>
                              <div className="font-medium text-white">{option.label}</div>
                              <div className="text-sm text-slate-400">{option.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-6">
                    <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Export Session
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center gap-2 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors">
                        <Camera className="w-4 h-4" />
                        Export as Image
                      </button>
                      <button className="flex items-center gap-2 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Session Tab */}
            {activeTab === 'session' && (
              <motion.div
                key="session"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Live Session Controls</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Session Status */}
                  <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-6">
                    <h4 className="font-medium text-white mb-4">Session Status</h4>

                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onClick={() => setLiveMode(!liveMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          liveMode
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {liveMode ? (
                          <>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            End Live
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Go Live
                          </>
                        )}
                      </button>

                      <div className="text-sm text-slate-400">
                        {liveMode ? 'Session is live' : 'Session is offline'}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <span className="text-white">42:15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Participants:</span>
                        <span className="text-white">{currentSession.collaborators.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Comments:</span>
                        <span className="text-white">{currentSession.comments.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recording Controls */}
                  <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-6">
                    <h4 className="font-medium text-white mb-4">Recording</h4>

                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isRecording
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-slate-600 hover:bg-slate-700 text-white'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            Start Recording
                          </>
                        )}
                      </button>
                    </div>

                    {isRecording && (
                      <div className="text-sm text-red-400">
                        Recording session changes and interactions...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Invite Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Invite Collaborator</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="viewer">Viewer - Can view and comment</option>
                      <option value="editor">Editor - Can edit and modify</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteCollaborator}
                    disabled={!inviteEmail.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export { CollaborationFeatures };
export default CollaborationFeatures;
