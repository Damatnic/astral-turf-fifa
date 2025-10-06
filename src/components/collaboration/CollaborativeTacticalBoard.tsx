import React, { useState, useEffect, useRef } from 'react';
import {
  findSlotById,
  isValidPlayer,
  isValidFormation,
  getFormationSlots,
} from '../../utils/tacticalDataGuards';
import type { Player, Formation, DrawingShape, User } from '../../types';

interface CollaborationState {
  users: Array<{
    id: string;
    name: string;
    color: string;
    cursor: { x: number; y: number } | null;
    isActive: boolean;
  }>;
  drawings: Array<DrawingShape & { userId: string; timestamp: number }>;
  playerPositions: Record<string, { x: number; y: number; userId: string }>;
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    text: string;
    position: { x: number; y: number };
    timestamp: number;
    replies: Array<{
      id: string;
      userId: string;
      userName: string;
      text: string;
      timestamp: number;
    }>;
  }>;
  version: number;
}

interface CollaborativeTacticalBoardProps {
  formation: Formation;
  players: Player[];
  currentUser: User;
  sessionId: string;
  _onPositionChange?: (playerId: string, position: { x: number; y: number }) => void;
  _onDrawingAdd?: (drawing: DrawingShape) => void;
  className?: string;
}

const CollaborativeTacticalBoard: React.FC<CollaborativeTacticalBoardProps> = ({
  formation,
  players,
  currentUser,
  sessionId,
  _onPositionChange,
  _onDrawingAdd,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [collaborationState, setCollaborationState] = useState<CollaborationState>({
    users: [
      {
        id: currentUser.id,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        color: '#3b82f6',
        cursor: null,
        isActive: true,
      },
    ],
    drawings: [],
    playerPositions: {},
    comments: [],
    version: 1,
  });

  const [selectedTool, setSelectedTool] = useState<'select' | 'arrow' | 'zone' | 'comment'>(
    'select'
  );
  const [_isDrawing, _setIsDrawing] = useState(false);
  const [_currentDrawing, _setCurrentDrawing] = useState<DrawingShape | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);

  // Mock WebSocket connection (in real implementation, this would be a proper WebSocket)
  const [mockConnectedUsers] = useState([
    {
      id: 'user2',
      name: 'Assistant Coach',
      color: '#ef4444',
      cursor: { x: 200, y: 150 },
      isActive: true,
    },
    { id: 'user3', name: 'Analyst', color: '#10b981', cursor: { x: 300, y: 250 }, isActive: true },
  ]);

  useEffect(() => {
    // Simulate real-time collaboration updates
    const interval = setInterval(() => {
      setCollaborationState(prev => ({
        ...prev,
        users: [
          prev.users[0], // Current user
          ...mockConnectedUsers.map(user => ({
            ...user,
            cursor: {
              x: user.cursor.x + (Math.random() - 0.5) * 20,
              y: user.cursor.y + (Math.random() - 0.5) * 20,
            },
          })),
        ],
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [mockConnectedUsers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawField(ctx, canvas.width, canvas.height);
    drawPlayers(ctx);
    drawDrawings(ctx);
    drawCursors(ctx);
    drawComments(ctx);
  }, [formation, players, collaborationState, showComments]);

  const drawField = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Field background
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, w, h);

    // Field lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(20, 20, w - 40, h - 40);

    // Center line
    ctx.beginPath();
    ctx.moveTo(20, h / 2);
    ctx.lineTo(w - 20, h / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawPlayers = (ctx: CanvasRenderingContext2D) => {
    if (!isValidFormation(formation) || !Array.isArray(players)) {
      return;
    }

    players.forEach(player => {
      if (!isValidPlayer(player)) {
        return;
      }

      const validSlots = getFormationSlots(formation);
      const slot = validSlots.find(s => s.playerId === player.id);
      if (!slot) {
        return;
      }

      // Use collaborative position or default
      const position = collaborationState.playerPositions[player.id] || {
        x: slot.defaultPosition.x * 8,
        y: slot.defaultPosition.y * 6,
      }; // Scale to canvas

      // Draw player circle
      ctx.fillStyle = player.teamColor || '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(position.x, position.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw jersey number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.jerseyNumber.toString(), position.x, position.y);

      // Draw name below
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(player.name, position.x, position.y + 35);
    });
  };

  const drawDrawings = (ctx: CanvasRenderingContext2D) => {
    collaborationState.drawings.forEach(drawing => {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 3;

      if (drawing.tool === 'arrow' && drawing.points.length >= 2) {
        // Draw arrow
        const start = drawing.points[0];
        const end = drawing.points[drawing.points.length - 1];

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 15;

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle - Math.PI / 6),
          end.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle + Math.PI / 6),
          end.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }

      if (drawing.tool === 'zone' && drawing.points.length >= 2) {
        // Draw zone rectangle
        const start = drawing.points[0];
        const end = drawing.points[drawing.points.length - 1];

        ctx.fillStyle = drawing.color + '30'; // Semi-transparent
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = 2;

        const width = end.x - start.x;
        const height = end.y - start.y;

        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeRect(start.x, start.y, width, height);
      }
    });
  };

  const drawCursors = (ctx: CanvasRenderingContext2D) => {
    collaborationState.users.forEach(user => {
      if (user.id === currentUser.id || !user.cursor || !user.isActive) {
        return;
      }

      const { x, y } = user.cursor;

      // Draw cursor
      ctx.fillStyle = user.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      // Cursor pointer shape
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y + 10);
      ctx.lineTo(x + 5, y + 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // User name label
      ctx.fillStyle = user.color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillRect(x + 15, y - 5, ctx.measureText(user.name).width + 8, 20);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(user.name, x + 19, y + 8);
    });
  };

  const drawComments = (ctx: CanvasRenderingContext2D) => {
    if (!showComments) {
      return;
    }

    collaborationState.comments.forEach(comment => {
      const { x, y } = comment.position;

      // Comment bubble
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;

      const bubbleWidth = 200;
      const bubbleHeight = 60;

      // Draw bubble background
      ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
      ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);

      // Comment text
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';

      // Wrap text
      const words = comment.text.split(' ');
      let line = '';
      let lineY = y + 15;

      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > bubbleWidth - 10 && line !== '') {
          ctx.fillText(line, x + 5, lineY);
          line = word + ' ';
          lineY += 12;
        } else {
          line = testLine;
        }
      });

      ctx.fillText(line, x + 5, lineY);

      // User name and timestamp
      ctx.fillStyle = '#9ca3af';
      ctx.font = '8px sans-serif';
      ctx.fillText(
        `${comment.userName} - ${new Date(comment.timestamp).toLocaleTimeString()}`,
        x + 5,
        y + bubbleHeight - 5
      );

      // Comment indicator dot
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x - 5, y + 10, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (selectedTool === 'comment') {
      setCommentPosition({ x, y });
    }
  };

  const addComment = () => {
    if (!newComment.trim() || !commentPosition) {
      return;
    }

    const comment = {
      id: `comment_${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      text: newComment,
      position: commentPosition,
      timestamp: Date.now(),
      replies: [],
    };

    setCollaborationState(prev => ({
      ...prev,
      comments: [...prev.comments, comment],
      version: prev.version + 1,
    }));

    setNewComment('');
    setCommentPosition(null);
  };

  const clearDrawings = () => {
    setCollaborationState(prev => ({
      ...prev,
      drawings: [],
      version: prev.version + 1,
    }));
  };

  return (
    <div className={`collaborative-tactical-board ${className}`}>
      <div className="bg-gray-800 rounded-lg shadow-xl">
        <div className="border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-3">👥</span>
                Collaborative Tactical Board
              </h2>
              <p className="text-gray-400 mt-1">
                Real-time tactical planning with your coaching staff
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {collaborationState.users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: user.color + '30', color: user.color }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-400">Session: {sessionId.substring(0, 8)}...</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {[
                  { tool: 'select', icon: '👆', label: 'Select' },
                  { tool: 'arrow', icon: '➡️', label: 'Arrow' },
                  { tool: 'zone', icon: '⬜', label: 'Zone' },
                  { tool: 'comment', icon: '💬', label: 'Comment' },
                ].map(({ tool, icon, label }) => (
                  <button
                    key={tool}
                    onClick={() => setSelectedTool(tool as any)}
                    className={`px-3 py-2 rounded text-sm font-medium flex items-center space-x-1 ${
                      selectedTool === tool
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="border-l border-gray-600 pl-4 flex items-center space-x-2">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    showComments ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {showComments ? '🔍 Hide Comments' : '💭 Show Comments'}
                </button>

                <button
                  onClick={clearDrawings}
                  className="px-3 py-2 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                >
                  🗑️ Clear Drawings
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              v{collaborationState.version} • {collaborationState.drawings.length} drawings •{' '}
              {collaborationState.comments.length} comments
            </div>
          </div>

          {/* Canvas */}
          <div className="bg-gray-900 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="border border-gray-600 rounded cursor-crosshair max-w-full"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>

          {/* Comment Input Modal */}
          {commentPosition && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-96">
                <h3 className="text-lg font-semibold text-white mb-4">Add Comment</h3>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Enter your tactical comment..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none h-24"
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setCommentPosition(null)}
                    className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collaboration Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">Real-Time Features</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Live cursor tracking</li>
                <li>• Instant drawing sync</li>
                <li>• Collaborative comments</li>
                <li>• Version control</li>
              </ul>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">Session Status</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Active Users: {collaborationState.users.filter(u => u.isActive).length}</div>
                <div>Session Duration: 12:34</div>
                <div>Last Update: Just now</div>
                <div>Auto-save: Enabled</div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-sm">
                  💾 Save Session
                </button>
                <button className="w-full text-left px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-sm">
                  📤 Export Plan
                </button>
                <button className="w-full text-left px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-sm">
                  🔗 Share Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeTacticalBoard;
