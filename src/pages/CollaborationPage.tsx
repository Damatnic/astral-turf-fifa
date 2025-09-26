import React, { useState, useEffect, useMemo } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import type { 
    Team, 
    Player, 
    User, 
    CollaborationSession, 
    SharedFormation,
    RealTimeUpdate,
    ChatMessage 
} from '../types';

interface CollaborativeUser {
    id: string;
    name: string;
    role: 'coach' | 'assistant' | 'analyst' | 'scout' | 'observer';
    isOnline: boolean;
    lastSeen: Date;
    currentAction?: string;
    cursorPosition?: { x: number; y: number };
}

interface CollaborationFeatures {
    realTimeEditing: boolean;
    voiceChat: boolean;
    screenSharing: boolean;
    tacticsSharing: boolean;
    liveCommentary: boolean;
    sessionRecording: boolean;
}

const CollaborationPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [collaborativeUsers, setCollaborativeUsers] = useState<CollaborativeUser[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFeatures, setSelectedFeatures] = useState<CollaborationFeatures>({
        realTimeEditing: true,
        voiceChat: false,
        screenSharing: false,
        tacticsSharing: true,
        liveCommentary: true,
        sessionRecording: false,
    });
    const [sessionCode, setSessionCode] = useState('');
    const [isHost, setIsHost] = useState(false);
    
    // Mock real-time updates simulation
    const [realtimeUpdates, setRealtimeUpdates] = useState<RealTimeUpdate[]>([]);
    
    // Initialize collaboration session
    const startCollaborationSession = () => {
        const newSessionCode = generateSessionCode();
        setSessionCode(newSessionCode);
        setIsHost(true);
        setIsSessionActive(true);
        
        // Simulate starting a WebSocket connection
        simulateCollaborativeEnvironment();
        
        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: `Collaboration session started! Share code: ${newSessionCode}`,
                type: 'success',
            },
        });
    };
    
    const joinCollaborationSession = (code: string) => {
        if (code.length === 6) {
            setSessionCode(code);
            setIsHost(false);
            setIsSessionActive(true);
            
            // Simulate joining a session
            simulateJoiningSession();
            
            uiDispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    message: `Joined collaboration session: ${code}`,
                    type: 'success',
                },
            });
        }
    };
    
    const endCollaborationSession = () => {
        setIsSessionActive(false);
        setCollaborativeUsers([]);
        setChatMessages([]);
        setSessionCode('');
        setIsHost(false);
        
        uiDispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                message: 'Collaboration session ended',
                type: 'info',
            },
        });
    };
    
    // Generate random session code
    const generateSessionCode = (): string => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };
    
    // Simulate collaborative environment
    const simulateCollaborativeEnvironment = () => {
        // Add mock collaborative users
        const mockUsers: CollaborativeUser[] = [
            {
                id: 'user1',
                name: 'Sarah Chen',
                role: 'assistant',
                isOnline: true,
                lastSeen: new Date(),
                currentAction: 'Reviewing formation',
            },
            {
                id: 'user2',
                name: 'Marcus Rodriguez',
                role: 'analyst',
                isOnline: true,
                lastSeen: new Date(),
                currentAction: 'Analyzing player stats',
            },
            {
                id: 'user3',
                name: 'Emma Thompson',
                role: 'scout',
                isOnline: false,
                lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
            },
        ];
        
        setCollaborativeUsers(mockUsers);
        
        // Simulate real-time updates
        const mockUpdates: RealTimeUpdate[] = [
            {
                id: 'update1',
                type: 'formation_change',
                userId: 'user1',
                userName: 'Sarah Chen',
                timestamp: new Date(),
                description: 'Changed formation to 4-3-3',
                data: { formation: '4-3-3' },
            },
            {
                id: 'update2',
                type: 'player_move',
                userId: 'user2',
                userName: 'Marcus Rodriguez',
                timestamp: new Date(Date.now() - 60000),
                description: 'Moved Alex Hunter to central midfield',
                data: { playerId: 'player1', position: { x: 50, y: 60 } },
            },
        ];\n        \n        setRealtimeUpdates(mockUpdates);\n        \n        // Simulate incoming chat messages\n        const mockMessages: ChatMessage[] = [\n            {\n                id: 'msg1',\n                userId: 'user1',\n                userName: 'Sarah Chen',\n                content: 'I think we should try a more defensive approach for the next match',\n                timestamp: new Date(Date.now() - 120000),\n                type: 'text',\n            },\n            {\n                id: 'msg2',\n                userId: 'user2',\n                userName: 'Marcus Rodriguez',\n                content: 'The analytics suggest our current formation is 87% effective against similar opponents',\n                timestamp: new Date(Date.now() - 90000),\n                type: 'text',\n            },\n            {\n                id: 'msg3',\n                userId: 'system',\n                userName: 'System',\n                content: 'Emma Thompson has left the session',\n                timestamp: new Date(Date.now() - 60000),\n                type: 'system',\n            },\n        ];\n        \n        setChatMessages(mockMessages);\n    };\n    \n    const simulateJoiningSession = () => {\n        // Simulate receiving existing session state\n        setCollaborativeUsers([\n            {\n                id: 'host',\n                name: 'Head Coach',\n                role: 'coach',\n                isOnline: true,\n                lastSeen: new Date(),\n                currentAction: 'Managing session',\n            },\n            {\n                id: 'user_me',\n                name: 'You',\n                role: 'observer',\n                isOnline: true,\n                lastSeen: new Date(),\n                currentAction: 'Just joined',\n            },\n        ]);\n    };\n    \n    // Handle sending chat messages\n    const sendChatMessage = () => {\n        if (newMessage.trim()) {\n            const message: ChatMessage = {\n                id: `msg_${Date.now()}`,\n                userId: 'current_user',\n                userName: 'You',\n                content: newMessage.trim(),\n                timestamp: new Date(),\n                type: 'text',\n            };\n            \n            setChatMessages(prev => [...prev, message]);\n            setNewMessage('');\n            \n            // Simulate sending via WebSocket\n            console.log('Sending message:', message);\n        }\n    };\n    \n    // Handle feature toggles\n    const toggleFeature = (feature: keyof CollaborationFeatures) => {\n        setSelectedFeatures(prev => ({\n            ...prev,\n            [feature]: !prev[feature],\n        }));\n        \n        uiDispatch({\n            type: 'ADD_NOTIFICATION',\n            payload: {\n                message: `${feature.replace(/([A-Z])/g, ' $1').toLowerCase()} ${selectedFeatures[feature] ? 'disabled' : 'enabled'}`,\n                type: 'info',\n            },\n        });\n    };\n    \n    // Share current formation\n    const shareCurrentFormation = () => {\n        const activeFormation = tacticsState.formations[tacticsState.activeFormationIds.home];\n        if (activeFormation) {\n            const sharedFormation: SharedFormation = {\n                id: `shared_${Date.now()}`,\n                formation: activeFormation,\n                sharedBy: 'You',\n                sharedAt: new Date(),\n                comments: 'Current working formation',\n            };\n            \n            // Simulate sharing\n            const updateMessage: RealTimeUpdate = {\n                id: `update_${Date.now()}`,\n                type: 'formation_share',\n                userId: 'current_user',\n                userName: 'You',\n                timestamp: new Date(),\n                description: `Shared formation: ${activeFormation.name}`,\n                data: sharedFormation,\n            };\n            \n            setRealtimeUpdates(prev => [updateMessage, ...prev]);\n            \n            uiDispatch({\n                type: 'ADD_NOTIFICATION',\n                payload: {\n                    message: 'Formation shared with collaboration session',\n                    type: 'success',\n                },\n            });\n        }\n    };\n    \n    // Collaboration statistics\n    const collaborationStats = useMemo(() => {\n        const onlineUsers = collaborativeUsers.filter(u => u.isOnline).length;\n        const totalMessages = chatMessages.filter(m => m.type === 'text').length;\n        const recentActivity = realtimeUpdates.filter(u => \n            new Date().getTime() - u.timestamp.getTime() < 600000 // Last 10 minutes\n        ).length;\n        \n        return {\n            onlineUsers,\n            totalUsers: collaborativeUsers.length,\n            totalMessages,\n            recentActivity,\n            sessionDuration: isSessionActive ? '00:45:32' : '00:00:00', // Mock duration\n        };\n    }, [collaborativeUsers, chatMessages, realtimeUpdates, isSessionActive]);\n\n    return (\n        <div className=\"w-full h-full p-6 bg-gray-900 overflow-y-auto\">\n            <div className=\"max-w-7xl mx-auto\">\n                {/* Header */}\n                <div className=\"mb-6\">\n                    <h1 className=\"text-3xl font-bold text-teal-400 mb-2\">Real-Time Collaboration</h1>\n                    <p className=\"text-gray-400\">Collaborate with your coaching staff and analysts in real-time</p>\n                    \n                    {/* Session Status */}\n                    {isSessionActive && (\n                        <div className=\"mt-4 bg-green-600/10 border border-green-500/30 rounded-lg p-4\">\n                            <div className=\"flex items-center justify-between\">\n                                <div className=\"flex items-center space-x-3\">\n                                    <div className=\"w-3 h-3 bg-green-400 rounded-full animate-pulse\"></div>\n                                    <span className=\"text-green-400 font-medium\">Session Active</span>\n                                    <span className=\"text-gray-400\">Session Code: {sessionCode}</span>\n                                </div>\n                                <div className=\"flex items-center space-x-4 text-sm\">\n                                    <span className=\"text-gray-400\">{collaborationStats.onlineUsers} online</span>\n                                    <span className=\"text-gray-400\">{collaborationStats.sessionDuration}</span>\n                                    <button\n                                        onClick={endCollaborationSession}\n                                        className=\"px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors\"\n                                    >\n                                        End Session\n                                    </button>\n                                </div>\n                            </div>\n                        </div>\n                    )}\n                </div>\n\n                {!isSessionActive ? (\n                    /* Session Setup */\n                    <div className=\"space-y-6\">\n                        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n                            {/* Start New Session */}\n                            <div className=\"bg-gray-800 rounded-lg p-6 border border-gray-700\">\n                                <h3 className=\"text-lg font-semibold text-teal-400 mb-4\">Start New Session</h3>\n                                <p className=\"text-gray-400 mb-6\">Create a new collaboration session and invite your team members</p>\n                                \n                                {/* Feature Selection */}\n                                <div className=\"space-y-3 mb-6\">\n                                    <h4 className=\"text-white font-medium\">Enable Features:</h4>\n                                    {Object.entries(selectedFeatures).map(([key, enabled]) => (\n                                        <label key={key} className=\"flex items-center space-x-3 cursor-pointer\">\n                                            <input\n                                                type=\"checkbox\"\n                                                checked={enabled}\n                                                onChange={() => toggleFeature(key as keyof CollaborationFeatures)}\n                                                className=\"w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500\"\n                                            />\n                                            <span className=\"text-white capitalize\">\n                                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}\n                                            </span>\n                                        </label>\n                                    ))}\n                                </div>\n                                \n                                <button\n                                    onClick={startCollaborationSession}\n                                    className=\"w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors\"\n                                >\n                                    Start Collaboration Session\n                                </button>\n                            </div>\n                            \n                            {/* Join Existing Session */}\n                            <div className=\"bg-gray-800 rounded-lg p-6 border border-gray-700\">\n                                <h3 className=\"text-lg font-semibold text-teal-400 mb-4\">Join Session</h3>\n                                <p className=\"text-gray-400 mb-6\">Enter a session code to join an existing collaboration session</p>\n                                \n                                <div className=\"space-y-4\">\n                                    <input\n                                        type=\"text\"\n                                        placeholder=\"Enter 6-digit session code\"\n                                        maxLength={6}\n                                        className=\"w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent uppercase tracking-widest text-center text-lg font-mono\"\n                                        onChange={(e) => {\n                                            const code = e.target.value.toUpperCase();\n                                            if (code.length === 6) {\n                                                joinCollaborationSession(code);\n                                            }\n                                        }}\n                                    />\n                                    \n                                    <div className=\"text-center text-sm text-gray-400\">\n                                        Ask your coach for the session code\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                        \n                        {/* Collaboration Benefits */}\n                        <div className=\"bg-gray-800 rounded-lg p-6 border border-gray-700\">\n                            <h3 className=\"text-lg font-semibold text-teal-400 mb-4\">Collaboration Features</h3>\n                            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">\n                                <div className=\"text-center\">\n                                    <div className=\"text-3xl mb-2\">\ud83d\udcdd</div>\n                                    <h4 className=\"font-medium text-white mb-2\">Real-Time Editing</h4>\n                                    <p className=\"text-sm text-gray-400\">Edit formations and tactics together with live cursors and changes</p>\n                                </div>\n                                <div className=\"text-center\">\n                                    <div className=\"text-3xl mb-2\">\ud83d\udcac</div>\n                                    <h4 className=\"font-medium text-white mb-2\">Live Chat</h4>\n                                    <p className=\"text-sm text-gray-400\">Communicate instantly with text, voice, and video chat options</p>\n                                </div>\n                                <div className=\"text-center\">\n                                    <div className=\"text-3xl mb-2\">\ud83d\udcca</div>\n                                    <h4 className=\"font-medium text-white mb-2\">Shared Analytics</h4>\n                                    <p className=\"text-sm text-gray-400\">View and analyze data together with synchronized dashboards</p>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                ) : (\n                    /* Active Collaboration Session */\n                    <div className=\"grid grid-cols-1 lg:grid-cols-4 gap-6\">\n                        {/* Main Collaboration Area */}\n                        <div className=\"lg:col-span-3 space-y-6\">\n                            {/* Session Statistics */}\n                            <div className=\"bg-gray-800 rounded-lg p-4 border border-gray-700\">\n                                <div className=\"grid grid-cols-4 gap-4 text-center\">\n                                    <div>\n                                        <div className=\"text-2xl font-bold text-teal-400\">{collaborationStats.onlineUsers}</div>\n                                        <div className=\"text-sm text-gray-400\">Online</div>\n                                    </div>\n                                    <div>\n                                        <div className=\"text-2xl font-bold text-blue-400\">{collaborationStats.totalMessages}</div>\n                                        <div className=\"text-sm text-gray-400\">Messages</div>\n                                    </div>\n                                    <div>\n                                        <div className=\"text-2xl font-bold text-purple-400\">{collaborationStats.recentActivity}</div>\n                                        <div className=\"text-sm text-gray-400\">Recent Actions</div>\n                                    </div>\n                                    <div>\n                                        <div className=\"text-2xl font-bold text-green-400\">{collaborationStats.sessionDuration}</div>\n                                        <div className=\"text-sm text-gray-400\">Duration</div>\n                                    </div>\n                                </div>\n                            </div>\n                            \n                            {/* Real-Time Activity Feed */}\n                            <div className=\"bg-gray-800 rounded-lg p-6 border border-gray-700\">\n                                <div className=\"flex justify-between items-center mb-4\">\n                                    <h3 className=\"text-lg font-semibold text-teal-400\">Live Activity Feed</h3>\n                                    <button\n                                        onClick={shareCurrentFormation}\n                                        className=\"px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm transition-colors\"\n                                    >\n                                        Share Formation\n                                    </button>\n                                </div>\n                                <div className=\"space-y-3 max-h-64 overflow-y-auto\">\n                                    {realtimeUpdates.map((update) => (\n                                        <div key={update.id} className=\"flex items-start space-x-3 p-3 bg-gray-700 rounded\">\n                                            <div className={`w-3 h-3 rounded-full mt-2 ${\n                                                update.type === 'formation_change' ? 'bg-blue-400' :\n                                                update.type === 'player_move' ? 'bg-green-400' :\n                                                update.type === 'formation_share' ? 'bg-purple-400' :\n                                                'bg-gray-400'\n                                            }`}></div>\n                                            <div className=\"flex-1\">\n                                                <div className=\"flex justify-between items-start\">\n                                                    <div>\n                                                        <div className=\"text-white font-medium\">{update.userName}</div>\n                                                        <div className=\"text-gray-400 text-sm\">{update.description}</div>\n                                                    </div>\n                                                    <div className=\"text-xs text-gray-500\">\n                                                        {update.timestamp.toLocaleTimeString()}\n                                                    </div>\n                                                </div>\n                                            </div>\n                                        </div>\n                                    ))}\n                                </div>\n                            </div>\n                            \n                            {/* Collaborative Tactics Board Preview */}\n                            <div className=\"bg-gray-800 rounded-lg p-6 border border-gray-700\">\n                                <h3 className=\"text-lg font-semibold text-teal-400 mb-4\">Shared Tactics Board</h3>\n                                <div className=\"bg-green-900/20 border border-green-500/30 rounded-lg p-8 text-center\">\n                                    <div className=\"text-4xl mb-4\">\u26bd</div>\n                                    <div className=\"text-white font-medium mb-2\">Real-Time Collaboration Active</div>\n                                    <div className=\"text-gray-400 text-sm\">Multiple users can edit formations and tactics simultaneously</div>\n                                    <div className=\"mt-4 flex justify-center space-x-2\">\n                                        {collaborativeUsers.filter(u => u.isOnline).map((user, index) => (\n                                            <div key={user.id} className={`w-3 h-3 rounded-full ${\n                                                ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-yellow-400'][index % 4]\n                                            }`} title={user.name}></div>\n                                        ))}\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                        \n                        {/* Sidebar - Users & Chat */}\n                        <div className=\"space-y-6\">\n                            {/* Online Users */}\n                            <div className=\"bg-gray-800 rounded-lg p-4 border border-gray-700\">\n                                <h3 className=\"text-lg font-semibold text-teal-400 mb-4\">Participants</h3>\n                                <div className=\"space-y-3\">\n                                    {collaborativeUsers.map((user) => (\n                                        <div key={user.id} className=\"flex items-center space-x-3\">\n                                            <div className={`w-3 h-3 rounded-full ${\n                                                user.isOnline ? 'bg-green-400' : 'bg-gray-500'\n                                            }`}></div>\n                                            <div className=\"flex-1\">\n                                                <div className=\"text-white text-sm font-medium\">{user.name}</div>\n                                                <div className=\"text-xs text-gray-400 capitalize\">{user.role}</div>\n                                                {user.currentAction && (\n                                                    <div className=\"text-xs text-blue-400\">{user.currentAction}</div>\n                                                )}\n                                            </div>\n                                        </div>\n                                    ))}\n                                </div>\n                            </div>\n                            \n                            {/* Live Chat */}\n                            <div className=\"bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-96\">\n                                <div className=\"p-4 border-b border-gray-700\">\n                                    <h3 className=\"text-lg font-semibold text-teal-400\">Live Chat</h3>\n                                </div>\n                                \n                                <div className=\"flex-1 p-4 overflow-y-auto space-y-3\">\n                                    {chatMessages.map((message) => (\n                                        <div key={message.id} className={`${\n                                            message.type === 'system' ? 'text-center' : ''\n                                        }`}>\n                                            {message.type === 'system' ? (\n                                                <div className=\"text-xs text-gray-500 italic\">{message.content}</div>\n                                            ) : (\n                                                <div>\n                                                    <div className=\"text-xs text-gray-400 mb-1\">\n                                                        {message.userName} \u2022 {message.timestamp.toLocaleTimeString()}\n                                                    </div>\n                                                    <div className=\"text-white text-sm bg-gray-700 rounded-lg p-2\">\n                                                        {message.content}\n                                                    </div>\n                                                </div>\n                                            )}\n                                        </div>\n                                    ))}\n                                </div>\n                                \n                                <div className=\"p-4 border-t border-gray-700\">\n                                    <div className=\"flex space-x-2\">\n                                        <input\n                                            type=\"text\"\n                                            value={newMessage}\n                                            onChange={(e) => setNewMessage(e.target.value)}\n                                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}\n                                            placeholder=\"Type a message...\"\n                                            className=\"flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent\"\n                                        />\n                                        <button\n                                            onClick={sendChatMessage}\n                                            className=\"px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm transition-colors\"\n                                        >\n                                            Send\n                                        </button>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                )}\n            </div>\n        </div>\n    );\n};\n\nexport default CollaborationPage;