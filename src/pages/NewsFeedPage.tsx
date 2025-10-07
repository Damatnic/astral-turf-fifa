import React, { useState } from 'react';
import { useFranchiseContext } from '../hooks';
import type { NewsItem } from '../types';

const NewsFeedPage: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { newsFeed, gameWeek, season } = franchiseState;
  const [selectedFilter, setSelectedFilter] = useState<'all' | NewsItem['type']>('all');

  const filteredNews = newsFeed.filter(
    item => selectedFilter === 'all' || item.type === selectedFilter,
  );

  const getNewsIcon = (type: NewsItem['type']) => {
    switch (type) {
      case 'transfer':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
        );
      case 'injury':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'result':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'rumor':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case 'social_media':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v3a1 1 0 01-1 1h-2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9H4a1 1 0 01-1-1V5a1 1 0 011-1h3z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        );
    }
  };

  const getNewsTypeColor = (type: NewsItem['type']) => {
    switch (type) {
      case 'transfer':
        return 'text-blue-400';
      case 'injury':
        return 'text-red-400';
      case 'result':
        return 'text-green-400';
      case 'rumor':
        return 'text-yellow-400';
      case 'social_media':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getNewsTypeBackground = (type: NewsItem['type']) => {
    switch (type) {
      case 'transfer':
        return 'bg-blue-600/20';
      case 'injury':
        return 'bg-red-600/20';
      case 'result':
        return 'bg-green-600/20';
      case 'rumor':
        return 'bg-yellow-600/20';
      case 'social_media':
        return 'bg-purple-600/20';
      default:
        return 'bg-gray-600/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    }
    if (diffDays === 2) {
      return 'Yesterday';
    }
    if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    }
    return date.toLocaleDateString();
  };

  const newsTypes = [
    { key: 'all' as const, label: 'All News', count: newsFeed.length },
    {
      key: 'result' as const,
      label: 'Match Results',
      count: newsFeed.filter(n => n.type === 'result').length,
    },
    {
      key: 'transfer' as const,
      label: 'Transfers',
      count: newsFeed.filter(n => n.type === 'transfer').length,
    },
    {
      key: 'injury' as const,
      label: 'Injuries',
      count: newsFeed.filter(n => n.type === 'injury').length,
    },
    {
      key: 'rumor' as const,
      label: 'Rumors',
      count: newsFeed.filter(n => n.type === 'rumor').length,
    },
    {
      key: 'social_media' as const,
      label: 'Social Media',
      count: newsFeed.filter(n => n.type === 'social_media').length,
    },
  ];

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">News Feed</h1>
          <p className="text-gray-400">
            Stay updated with the latest football news and developments
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-teal-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">
                  Season {season.year} - Week {gameWeek}
                </p>
                <p className="text-gray-400 text-sm">Latest updates and breaking news</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-teal-400">{newsFeed.length}</p>
              <p className="text-xs text-gray-400">Total Stories</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 sticky top-6">
              <h3 className="text-lg font-semibold text-teal-400 mb-4">News Categories</h3>
              <div className="space-y-2">
                {newsTypes.map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFilter(key)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${
                      selectedFilter === key
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* News Feed */}
          <div className="lg:col-span-3">
            {filteredNews.length > 0 ? (
              <div className="space-y-4">
                {filteredNews.map(newsItem => (
                  <div
                    key={newsItem.id}
                    className={`bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all ${getNewsTypeBackground(newsItem.type)}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`flex-shrink-0 p-2 rounded-full ${getNewsTypeBackground(newsItem.type)} ${getNewsTypeColor(newsItem.type)}`}
                      >
                        {getNewsIcon(newsItem.type)}
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {newsItem.title}
                            </h3>
                            <div className="flex items-center space-x-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getNewsTypeBackground(newsItem.type)} ${getNewsTypeColor(newsItem.type)} capitalize`}
                              >
                                {newsItem.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(newsItem.date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-300 leading-relaxed">{newsItem.content}</p>

                        {/* Additional info for specific news types */}
                        {newsItem.type === 'result' && (
                          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="text-green-400">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-300">Match Result Confirmed</span>
                            </div>
                          </div>
                        )}

                        {newsItem.type === 'transfer' && (
                          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="text-blue-400">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-300">
                                Transfer Market Activity
                              </span>
                            </div>
                          </div>
                        )}

                        {newsItem.type === 'rumor' && (
                          <div className="mt-4 p-3 bg-yellow-600/10 rounded-lg border border-yellow-600/30">
                            <div className="flex items-center space-x-2">
                              <div className="text-yellow-400">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <span className="text-xs text-yellow-400 font-medium">
                                Unconfirmed Report
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No News Available</h3>
                <p className="text-gray-500">
                  {selectedFilter === 'all'
                    ? 'No news stories are currently available.'
                    : `No ${selectedFilter.replace('_', ' ')} news available.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* News Summary */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">News Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {newsTypes.slice(1).map(({ key, label, count }) => (
              <div key={key} className="text-center">
                <div className={`text-2xl font-bold ${getNewsTypeColor(key as NewsItem['type'])}`}>
                  {count}
                </div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsFeedPage;
