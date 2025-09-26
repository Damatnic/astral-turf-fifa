import React, { useState, useEffect, useRef } from 'react';
import { useFranchiseContext, useTacticsContext, useUIContext } from '../../hooks';
import { CloseIcon, LoadingSpinner, HandshakeIcon } from '../ui/icons';
import type { AIAgentResponse } from '../../types';
import { getAgentNegotiationResponse } from "../../services/aiServiceLoader";

const ContractNegotiationPopup: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { franchiseState, dispatch: franchiseDispatch } = useFranchiseContext();
    const { tacticsState } = useTacticsContext();
    const { isLoadingNegotiation } = uiState;
    const { negotiationData } = franchiseState;
    const { players } = tacticsState;
    const [offer, setOffer] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const player = negotiationData ? players.find(p => p.id === negotiationData.playerId) : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [negotiationData?.conversation]);

    if (!negotiationData || !player) {return null;}

    const handleSendOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offer.trim() || isLoadingNegotiation) {return;}

        franchiseDispatch({ type: 'SEND_NEGOTIATION_OFFER_START', payload: { offerText: offer } });
        setOffer('');

        try {
            const response = await getAgentNegotiationResponse(
                player.name,
                player.stats.careerHistory.length > 0 ? 500000 : 100000,
                negotiationData.agentPersonality,
                offer,
                negotiationData.conversation.join('\n'),
            );
            franchiseDispatch({ type: 'SEND_NEGOTIATION_OFFER_SUCCESS', payload: { response } });
        } catch (_error) {
            franchiseDispatch({ type: 'SEND_NEGOTIATION_OFFER_FAILURE' });
        }
    };

    const lastMessage = negotiationData.conversation[negotiationData.conversation.length - 1];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => franchiseDispatch({ type: 'END_NEGOTIATION' })}>
            <div onClick={e => e.stopPropagation()} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale h-[70vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center"><HandshakeIcon className="w-5 h-5 mr-2" />Negotiating with {player.name}'s Agent</h2>
                    <button onClick={() => franchiseDispatch({ type: 'END_NEGOTIATION' })} className="p-1 rounded-full text-gray-400 hover:bg-gray-700"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {negotiationData.conversation.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-3 ${msg.startsWith('You:') ? 'justify-end' : ''}`}>
                             <p className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.startsWith('You:') ? 'bg-blue-600 text-white' : 'bg-slate-700'}`}>{msg}</p>
                        </div>
                    ))}
                     {isLoadingNegotiation && <div className="flex justify-center"><LoadingSpinner/></div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-slate-700">
                    <form onSubmit={handleSendOffer} className="flex gap-2">
                        <input
                            type="text" value={offer} onChange={e => setOffer(e.target.value)}
                            placeholder="Make your offer..."
                            className="flex-grow bg-slate-700 rounded-lg px-3 py-2 text-sm"
                            disabled={isLoadingNegotiation}
                        />
                        <button type="submit" disabled={!offer.trim() || isLoadingNegotiation} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 text-white font-bold rounded-lg">Send</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContractNegotiationPopup;
