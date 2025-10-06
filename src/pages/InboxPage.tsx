import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import type { InboxItem } from '../types';

const InboxPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'unread' | 'match' | 'transfer' | 'injury' | 'contract'
  >('all');
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const { inbox } = franchiseState;

  const filteredItems = inbox.filter(item => {
    if (selectedFilter === 'all') {
      return true;
    }
    if (selectedFilter === 'unread') {
      return !item.isRead;
    }
    return item.type === selectedFilter;
  });

  const unreadCount = inbox.filter(item => !item.isRead).length;

  const handleItemClick = (item: InboxItem) => {
    setSelectedItem(item);
    if (!item.isRead) {
      dispatch({ type: 'MARK_INBOX_ITEM_READ', payload: item.id });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_INBOX_ITEM', payload: itemId });
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  };

  const handleAcceptTransferOffer = (inboxId: string, playerId: string, price: number) => {
    (dispatch as (action: { type: string; payload: unknown }) => void)({
      type: 'ACCEPT_TRANSFER_OFFER',
      payload: { inboxId, playerId, price },
    });
    uiDispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: 'Transfer offer accepted successfully!',
        type: 'success',
      },
    });
  };

  const handleAcceptLoanOffer = (
    inboxId: string,
    playerId: string,
    fee: number,
    wageContribution: number
  ) => {
    (dispatch as (action: { type: string; payload: unknown }) => void)({
      type: 'ACCEPT_LOAN_OFFER',
      payload: { inboxId, playerId, fee, wageContribution },
    });
    uiDispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: 'Loan offer accepted successfully!',
        type: 'success',
      },
    });
  };

  const getItemIcon = (type: InboxItem['type']) => {
    switch (type) {
      case 'match':
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
      case 'transfer':
      case 'transfer_offer':
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
      case 'contract':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getItemTypeColor = (type: InboxItem['type']) => {
    switch (type) {
      case 'match':
        return 'text-green-400';
      case 'transfer':
      case 'transfer_offer':
        return 'text-blue-400';
      case 'injury':
        return 'text-red-400';
      case 'contract':
        return 'text-yellow-400';
      case 'award':
        return 'text-purple-400';
      case 'finance':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Inbox</h1>
          <p className="text-gray-400">
            Manage notifications and communications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters and Item List */}
          <div className="lg:col-span-1">
            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-teal-400 mb-3">Filter Messages</h3>
              <div className="space-y-2">
                {[
                  { key: 'all' as const, label: 'All Messages', count: inbox.length },
                  { key: 'unread' as const, label: 'Unread', count: unreadCount },
                  {
                    key: 'match' as const,
                    label: 'Match Results',
                    count: inbox.filter(i => i.type === 'match').length,
                  },
                  {
                    key: 'transfer' as const,
                    label: 'Transfers',
                    count: inbox.filter(i => i.type === 'transfer' || i.type === 'transfer_offer')
                      .length,
                  },
                  {
                    key: 'injury' as const,
                    label: 'Injuries',
                    count: inbox.filter(i => i.type === 'injury').length,
                  },
                  {
                    key: 'contract' as const,
                    label: 'Contracts',
                    count: inbox.filter(i => i.type === 'contract').length,
                  },
                ].map(({ key, label, count }) => (
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

            {/* Message List */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                    selectedItem?.id === item.id ? 'bg-gray-700 border-l-4 border-l-teal-500' : ''
                  } ${!item.isRead ? 'bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${getItemTypeColor(item.type)}`}>
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h4
                          className={`text-sm font-medium truncate ${!item.isRead ? 'text-white' : 'text-gray-300'}`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2">Week {item.week}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {item.content.substring(0, 100)}...
                      </p>
                      {!item.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <p>No messages match the selected filter</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${getItemTypeColor(selectedItem.type)}`}>
                      {getItemIcon(selectedItem.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{selectedItem.title}</h2>
                      <p className="text-sm text-gray-400">
                        Week {selectedItem.week} • {selectedItem.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete message"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Message Content */}
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {selectedItem.content}
                  </p>
                </div>

                {/* Action Buttons for Transfer Offers */}
                {selectedItem.payload && (selectedItem.payload as any).offer && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-teal-400 mb-3">Offer Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">From Club:</span>
                        <span className="text-white font-medium">
                          {(selectedItem.payload as any).offer.fromClub}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Offer Value:</span>
                        <span className="text-green-400 font-bold">
                          ${(selectedItem.payload as any).offer.value.toLocaleString()}
                        </span>
                      </div>
                      {(selectedItem.payload as any).offer.wageContribution && (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Wage Contribution:</span>
                          <span className="text-yellow-400 font-medium">
                            {(selectedItem.payload as any).offer.wageContribution}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => {
                          const payload = selectedItem.payload as {
                            offer?: {
                              type?: string;
                              playerId?: string;
                              value?: number;
                              wageContribution?: number;
                            };
                          };
                          if (payload.offer?.type === 'transfer_offer') {
                            handleAcceptTransferOffer(
                              selectedItem.id,
                              payload.offer.playerId!,
                              payload.offer.value!
                            );
                          } else {
                            handleAcceptLoanOffer(
                              selectedItem.id,
                              payload.offer!.playerId!,
                              payload.offer!.value!,
                              payload.offer!.wageContribution || 0
                            );
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => handleDeleteItem(selectedItem.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        Reject Offer
                      </button>
                    </div>
                  </div>
                )}

                {/* Action for Conversation Requests */}
                {selectedItem.payload && (selectedItem.payload as any).conversationRequest && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-teal-400 mb-3">
                      Conversation Request
                    </h3>
                    <p className="text-gray-300 mb-3">
                      Reason: {(selectedItem.payload as any).conversationRequest.reason}
                    </p>
                    <button
                      onClick={() => {
                        const payload = selectedItem.payload as {
                          conversationRequest?: { playerId?: string };
                        };
                        uiDispatch({
                          type: 'START_PLAYER_CONVERSATION',
                          payload: {
                            playerId: payload.conversationRequest!.playerId!,
                          },
                        });
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      Start Conversation
                    </button>
                  </div>
                )}
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
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Select a Message</h3>
                <p className="text-gray-500">Choose a message from the list to view its details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
