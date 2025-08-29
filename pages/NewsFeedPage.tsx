
import React from 'react';
import { useFranchiseContext } from '../hooks';
import { NewspaperIcon } from '../components/ui/icons';
import { NewsItem } from '../types';

const NewsFeedPage: React.FC = () => {
    const { franchiseState } = useFranchiseContext();
    const { newsFeed } = franchiseState;

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <NewspaperIcon className="w-5 h-5 mr-3" />
                        News Feed
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {newsFeed.length > 0 ? (
                        [...newsFeed].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                            <div key={item.id} className="p-4 bg-gray-700/50 rounded-lg border-l-4 border-teal-500">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-white">{item.title}</h3>
                                    <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">{item.content}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-12">No news items yet. Play a match to get started!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsFeedPage;