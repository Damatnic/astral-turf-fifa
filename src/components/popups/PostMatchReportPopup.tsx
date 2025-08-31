import React, { useEffect } from 'react';
import { useUIContext, useFranchiseContext, useTacticsContext } from '../../hooks';
import { CloseIcon, BrainCircuitIcon, LoadingSpinner } from '../ui/icons';
import { getPostMatchAnalysis } from "../../services/aiServiceLoader";

const PostMatchReportPopup: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { franchiseState } = useFranchiseContext();
    const { lastMatchResult } = franchiseState;
    const { isLoadingPostMatchReport, postMatchReport, settings } = uiState;

    useEffect(() => {
        if (!postMatchReport && !isLoadingPostMatchReport && lastMatchResult) {
            dispatch({ type: 'GET_POST_MATCH_REPORT_START' });
            getPostMatchAnalysis(lastMatchResult, 'Home Team', 'Away Team', settings.aiPersonality)
                .then(report => dispatch({ type: 'GET_POST_MATCH_REPORT_SUCCESS', payload: report }))
                .catch(err => {
                    console.error(err);
                    dispatch({ type: 'GET_POST_MATCH_REPORT_FAILURE' });
                });
        }
    }, [lastMatchResult, postMatchReport, isLoadingPostMatchReport, dispatch, settings.aiPersonality]);

    const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

    if (!lastMatchResult) {return null;}

    return (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
            <div onClick={e => e.stopPropagation()} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center"><BrainCircuitIcon className="w-5 h-5 mr-2" />Post-Match Analysis</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-400">Final Score</p>
                        <p className="text-4xl font-bold"><span className="text-blue-400">{lastMatchResult.homeScore}</span> - <span className="text-red-400">{lastMatchResult.awayScore}</span></p>
                    </div>

                    {isLoadingPostMatchReport && (
                        <div className="flex justify-center py-8"><LoadingSpinner className="w-8 h-8"/></div>
                    )}

                    {postMatchReport && (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-bold text-green-400 mb-1">Match Summary</h4>
                                <p className="text-gray-300">{postMatchReport.summary}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-400 mb-1">Key Moment</h4>
                                <p className="text-gray-300">{postMatchReport.keyMoment}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-400 mb-1">Strategic Advice</h4>
                                <p className="text-gray-300">{postMatchReport.advice}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-700 text-right">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
};

export default PostMatchReportPopup;
