
import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../hooks';
import { NewspaperIcon, MessageSquareIcon, RepeatIcon, BanknoteIcon, TrophyIcon, HandshakeIcon, MedicalCrossIcon } from '../components/ui/icons';
import { InboxItem } from '../types';

const getIconForType = (type: InboxItem['type']) => {
    switch (type) {
        case 'match': return <TrophyIcon className="w-5 h-5 text-yellow-400" />;
        case 'transfer': return <RepeatIcon className="w-5 h-5 text-blue-400" />;
        case 'contract': return <HandshakeIcon className="w-5 h-5 text-green-400" />;
        case 'injury': return <MedicalCrossIcon className="w-5 h-5 text-red-400" />;
        case 'conversation': return <MessageSquareIcon className="w-5 h-5 text-purple-400" />;
        case 'finance': return <BanknoteIcon className="w-5 h-5 text-green-400" />;
        case 'transfer_offer': return <RepeatIcon className="w-5 h-5 text-blue-400" />;
        case 'loan_offer': return <RepeatIcon className="w-5 h-5 text-blue-400" />;
        default: return <NewspaperIcon className="w-5 h-5 text-gray-400" />;
    }
}

const InboxPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { dispatch: uiDispatch } = useUIContext();

    const { inbox } = franchiseState;
    const { players } = tacticsState;
    const [selectedItem, setSelectedItem] = useState<InboxItem | null>(inbox[0] || null);

    const handleSelectItem = (item: InboxItem) => {
        setSelectedItem(item);
        if (!item.isRead) {
            dispatch({ type: 'MARK_INBOX_ITEM_READ', payload: item.id });
        }
    };
    
    if(selectedItem && !inbox.find(i => i.id === selectedItem.id)) {
        setSelectedItem(inbox[0] || null);
    }
    
    const handleAcceptOffer = () => {
        if (!selectedItem?.payload || !('offer' in selectedItem.payload)) return;
        const { type, playerId, value } = selectedItem.payload.offer;
        if (type === 'transfer_offer') {
            const player = players.find(p => p.id === playerId);
            if(player && confirm(`Accept offer of $${value.toLocaleString()} for ${player.name}?`)) {
                dispatch({ type: 'ACCEPT_TRANSFER_OFFER', payload: { inboxId: selectedItem.id, playerId, price: value }});
            }
        }
    };

    const handleRejectOffer = () => {
         if (!selectedItem) return;
        dispatch({ type: 'REMOVE_INBOX_ITEM', payload: selectedItem.id });
    };
    
    const handleNegotiateOffer = () => {
        if (!selectedItem) return;
        uiDispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', message: 'Negotiation feature coming soon. For now, reject the offer and wait for a better one.' } });
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col animate-fade-in-scale h-[80vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <NewspaperIcon className="w-5 h-5 mr-3" />
                        Manager's Inbox
                    </h2>
                </div>
                
                <div className="flex flex-grow min-h-0">
                    <aside className="w-1/3 bg-gray-900/50 border-r border-gray-700 overflow-y-auto">
                        {inbox.length > 0 ? (
                            <ul>
                                {[...inbox].sort((a,b) => b.week - a.week).map(item => (
                                    <li key={item.id}>
                                        <button 
                                            onClick={() => handleSelectItem(item)}
                                            className={`w-full text-left p-3 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors ${selectedItem?.id === item.id ? 'bg-teal-600/20' : ''}`}
                                        >
                                            <div className="flex items-start">
                                                {!item.isRead && <div className="w-2 h-2 bg-teal-400 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>}
                                                <div className={`flex-grow ${item.isRead ? 'ml-5' : ''}`}>
                                                    <p className={`font-semibold truncate ${item.isRead ? 'text-gray-300' : 'text-white'}`}>{item.title}</p>
                                                    <p className="text-xs text-gray-400">Week {item.week}</p>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 p-8">Your inbox is empty.</p>
                        )}
                    </aside>
                    <main className="w-2/3 p-6 overflow-y-auto flex flex-col justify-between">
                        {selectedItem ? (
                            <div className="animate-fade-in-scale" style={{animationDuration: '0.2s'}}>
                                <div className="flex items-center mb-2">
                                    {getIconForType(selectedItem.type)}
                                    <h3 className="font-bold text-2xl text-white ml-3">{selectedItem.title}</h3>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">Received: Week {selectedItem.week}</p>
                                <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-gray-300">
                                    {selectedItem.content}
                                </div>
                            </div>
                        ) : (
                             <p className="text-center text-gray-500 pt-20">Select an item to read.</p>
                        )}
                        
                        {selectedItem?.payload && 'offer' in selectedItem.payload && (
                             <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end space-x-3">
                                <button onClick={handleAcceptOffer} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md transition-colors">Accept</button>
                                <button onClick={handleNegotiateOffer} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-md transition-colors">Negotiate</button>
                                <button onClick={handleRejectOffer} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-md transition-colors">Reject</button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default InboxPage;