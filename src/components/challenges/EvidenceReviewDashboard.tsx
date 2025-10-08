/**
 * Evidence Review Dashboard
 * Comprehensive coach interface for reviewing and managing challenge submissions
 * with batch operations, filtering, and analytics
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  TrendingUp,
  Award,
  FileText,
  Image as ImageIcon,
  Video,
  Eye,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { ChallengeSubmission, EvidenceStatus } from '../../types/challenge';
import { EvidenceReview } from './EvidenceReview';

interface EvidenceReviewDashboardProps {
  submissions: ChallengeSubmission[];
  onApprove: (submissionId: string, score?: number, notes?: string) => Promise<void>;
  onReject: (submissionId: string, notes: string) => Promise<void>;
  onRequestRevision: (submissionId: string, notes: string) => Promise<void>;
  onBatchApprove?: (submissionIds: string[]) => Promise<void>;
  onBatchReject?: (submissionIds: string[], notes: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

type FilterStatus = 'all' | EvidenceStatus;
type SortOption = 'date' | 'challenge' | 'player' | 'status';

export const EvidenceReviewDashboard: React.FC<EvidenceReviewDashboardProps> = ({
  submissions,
  onApprove,
  onReject,
  onRequestRevision,
  onBatchApprove,
  onBatchReject,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [reviewingSubmission, setReviewingSubmission] = useState<ChallengeSubmission | null>(null);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.userId.toLowerCase().includes(query) ||
          s.challengeId.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query),
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case 'challenge':
          comparison = a.challengeId.localeCompare(b.challengeId);
          break;
        case 'player':
          comparison = a.userId.localeCompare(b.userId);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDesc ? -comparison : comparison;
    });

    return sorted;
  }, [submissions, filterStatus, searchQuery, sortBy, sortDesc]);

  // Analytics
  const analytics = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === 'pending').length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const rejected = submissions.filter((s) => s.status === 'rejected').length;
    const needsRevision = submissions.filter((s) => s.status === 'requires_revision').length;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    const avgScore =
      submissions.filter((s) => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) /
      submissions.filter((s) => s.score !== undefined).length || 0;

    return {
      total,
      pending,
      approved,
      rejected,
      needsRevision,
      approvalRate,
      avgScore,
    };
  }, [submissions]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSelectSubmission = (id: string) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSubmissions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map((s) => s.id)));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedSubmissions.size === 0) {
      return;
    }
    await onBatchApprove?.(Array.from(selectedSubmissions));
    setSelectedSubmissions(new Set());
    setShowBatchActions(false);
  };

  const handleBatchReject = async (notes: string) => {
    if (selectedSubmissions.size === 0) {
      return;
    }
    await onBatchReject?.(Array.from(selectedSubmissions), notes);
    setSelectedSubmissions(new Set());
    setShowBatchActions(false);
  };

  const getStatusIcon = (status: EvidenceStatus) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      requires_revision: AlertCircle,
    };
    return icons[status];
  };

  const getStatusColor = (status: EvidenceStatus) => {
    const colors = {
      pending: 'text-yellow-400',
      approved: 'text-green-400',
      rejected: 'text-red-400',
      requires_revision: 'text-orange-400',
    };
    return colors[status];
  };

  const getEvidenceIcon = (type: string) => {
    const icons = {
      photo: ImageIcon,
      video: Video,
      stats: FileText,
      tracking: FileText,
      manual: FileText,
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 border-b border-purple-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Evidence Review Dashboard</h2>
            <p className="text-gray-400">Review and manage challenge submissions</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-gray-800/50  border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase">Total</span>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.total}</div>
          </div>
          <div className="bg-yellow-500/10  border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400 uppercase">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{analytics.pending}</div>
          </div>
          <div className="bg-green-500/10  border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 uppercase">Approved</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{analytics.approved}</div>
          </div>
          <div className="bg-red-500/10  border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400 uppercase">Rejected</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{analytics.rejected}</div>
          </div>
          <div className="bg-orange-500/10  border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-orange-400 uppercase">Revision</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{analytics.needsRevision}</div>
          </div>
          <div className="bg-blue-500/10  border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400 uppercase">Approval Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{analytics.approvalRate.toFixed(1)}%</div>
          </div>
          <div className="bg-purple-500/10  border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 uppercase">Avg Score</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{analytics.avgScore.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex-none bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="requires_revision">Needs Revision</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="challenge">Sort by Challenge</option>
              <option value="player">Sort by Player</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors"
            >
              {sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Batch Actions */}
          {selectedSubmissions.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{selectedSubmissions.size} selected</span>
              <button
                onClick={() => setShowBatchActions(!showBatchActions)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Batch Actions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Batch Actions Panel */}
      <AnimatePresence>
        {showBatchActions && selectedSubmissions.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-none bg-purple-900/20 border-b border-purple-500/30 overflow-hidden"
          >
            <div className="p-4 flex items-center gap-4">
              <button
                onClick={handleBatchApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve All
              </button>
              <button
                onClick={() => {
                  const notes = globalThis.prompt('Enter rejection notes:');
                  if (notes) {
                    handleBatchReject(notes);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject All
              </button>
              <button
                onClick={() => setSelectedSubmissions(new Set())}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submissions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No submissions found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-400">Select all {filteredSubmissions.length} submissions</span>
            </div>

            {/* Submissions */}
            {filteredSubmissions.map((submission) => {
              const StatusIcon = getStatusIcon(submission.status);
              const EvidenceIcon = getEvidenceIcon(submission.evidenceType);

              return (
                <motion.div
                  key={submission.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50  border border-gray-700 rounded-lg overflow-hidden hover:border-purple-500/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.has(submission.id)}
                        onChange={() => handleSelectSubmission(submission.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                      />

                      {/* Evidence Icon */}
                      <div className="flex-none">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                          <EvidenceIcon className="w-6 h-6 text-purple-400" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-white font-medium mb-1">
                              Challenge: {submission.challengeId}
                            </h3>
                            <p className="text-sm text-gray-400">Player: {submission.userId}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${getStatusColor(submission.status)}`} />
                            <span className={`text-sm font-medium ${getStatusColor(submission.status)}`}>
                              {submission.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {submission.description && (
                          <p className="text-sm text-gray-300 mb-2 line-clamp-2">{submission.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                          {submission.evidenceUrls.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {submission.evidenceUrls.length} file(s)
                            </span>
                          )}
                          {submission.score !== undefined && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Score: {submission.score}/100
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-none">
                        <button
                          onClick={() => setReviewingSubmission(submission)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-800  z-50 flex items-center justify-center p-4"
            onClick={() => setReviewingSubmission(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <EvidenceReview
                submission={reviewingSubmission}
                challengeTitle={reviewingSubmission.challengeId}
                onApprove={async (id, score, notes) => {
                  await onApprove(id, score, notes);
                  setReviewingSubmission(null);
                }}
                onReject={async (id, notes) => {
                  await onReject(id, notes);
                  setReviewingSubmission(null);
                }}
                onRequestRevision={async (id, notes) => {
                  await onRequestRevision(id, notes);
                  setReviewingSubmission(null);
                }}
                onClose={() => setReviewingSubmission(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
