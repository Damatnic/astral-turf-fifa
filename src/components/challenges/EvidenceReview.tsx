/**
 * Evidence Review Component
 * Coach interface for reviewing and approving challenge submissions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  User,
  FileText,
  Image as ImageIcon,
  Video,
  Maximize2,
} from 'lucide-react';
import { ChallengeSubmission, EvidenceStatus } from '../../types/challenge';

interface EvidenceReviewProps {
  submission: ChallengeSubmission;
  challengeTitle: string;
  onApprove: (submissionId: string, score?: number, notes?: string) => Promise<void>;
  onReject: (submissionId: string, notes: string) => Promise<void>;
  onRequestRevision: (submissionId: string, notes: string) => Promise<void>;
  onClose: () => void;
}

export const EvidenceReview: React.FC<EvidenceReviewProps> = ({
  submission,
  challengeTitle,
  onApprove,
  onReject,
  onRequestRevision,
  onClose,
}) => {
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revise' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [score, setScore] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  // Get status badge
  const getStatusBadge = (status: EvidenceStatus) => {
    const configs = {
      pending: { color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400', icon: Clock, label: 'Pending Review' },
      approved: { color: 'bg-green-500/20 border-green-500/30 text-green-400', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-500/20 border-red-500/30 text-red-400', icon: XCircle, label: 'Rejected' },
      requires_revision: { color: 'bg-orange-500/20 border-orange-500/30 text-orange-400', icon: AlertCircle, label: 'Needs Revision' },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // Get evidence type icon
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

  // Handle review submission
  const handleReviewSubmit = async () => {
    if (!reviewAction) {return;}

    // Validation
    if ((reviewAction === 'reject' || reviewAction === 'revise') && !reviewNotes.trim()) {
      alert('Please provide feedback notes');
      return;
    }

    setIsSubmitting(true);

    try {
      if (reviewAction === 'approve') {
        await onApprove(submission.id, score, reviewNotes || undefined);
      } else if (reviewAction === 'reject') {
        await onReject(submission.id, reviewNotes);
      } else if (reviewAction === 'revise') {
        await onRequestRevision(submission.id, reviewNotes);
      }

      onClose();
    } catch (error) {
      console.error('Review submission failed:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const EvidenceIcon = getEvidenceIcon(submission.evidenceType);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Review Evidence</h2>
                <p className="text-sm text-gray-400">{challengeTitle}</p>
              </div>
              {getStatusBadge(submission.status)}
            </div>

            {/* Submission Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Submitted by</p>
                  <p className="text-sm font-medium text-white">{submission.userId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="text-sm font-medium text-white">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EvidenceIcon className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm font-medium text-white capitalize">{submission.evidenceType}</p>
                </div>
              </div>
              {submission.value !== undefined && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Value</p>
                    <p className="text-sm font-medium text-white">
                      {submission.value} {submission.unit}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-white whitespace-pre-wrap">{submission.description}</p>
              </div>
            </div>

            {/* Evidence Files */}
            {submission.evidenceUrls.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Evidence Files ({submission.evidenceUrls.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {submission.evidenceUrls.map((url, idx) => (
                    <motion.div
                      key={idx}
                      className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-700 cursor-pointer group"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedMedia(url)}
                    >
                      {submission.evidenceType === 'video' ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="w-12 h-12 text-gray-500" />
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Review (if exists) */}
            {submission.reviewNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Previous Review
                </label>
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">
                        Reviewed by {submission.reviewedBy} on{' '}
                        {submission.reviewedAt && new Date(submission.reviewedAt).toLocaleDateString()}
                      </p>
                      <p className="text-white">{submission.reviewNotes}</p>
                      {submission.score !== undefined && (
                        <p className="text-sm text-blue-400 mt-2">Score: {submission.score}/100</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Actions (only for pending) */}
            {submission.status === 'pending' && (
              <>
                {/* Action Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Review Decision
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setReviewAction('approve')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        reviewAction === 'approve'
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <ThumbsUp className={`w-6 h-6 mx-auto mb-2 ${
                        reviewAction === 'approve' ? 'text-green-400' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium block ${
                        reviewAction === 'approve' ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        Approve
                      </span>
                    </button>

                    <button
                      onClick={() => setReviewAction('revise')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        reviewAction === 'revise'
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <AlertCircle className={`w-6 h-6 mx-auto mb-2 ${
                        reviewAction === 'revise' ? 'text-orange-400' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium block ${
                        reviewAction === 'revise' ? 'text-orange-400' : 'text-gray-400'
                      }`}>
                        Revise
                      </span>
                    </button>

                    <button
                      onClick={() => setReviewAction('reject')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        reviewAction === 'reject'
                          ? 'border-red-500 bg-red-500/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <ThumbsDown className={`w-6 h-6 mx-auto mb-2 ${
                        reviewAction === 'reject' ? 'text-red-400' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium block ${
                        reviewAction === 'reject' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        Reject
                      </span>
                    </button>
                  </div>
                </div>

                {/* Score Input (for approval) */}
                {reviewAction === 'approve' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Score (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value))}
                        className="flex-1 accent-green-500"
                      />
                      <span className="text-xl font-bold text-green-400 min-w-[60px]">
                        {score}/100
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Feedback Notes {(reviewAction === 'reject' || reviewAction === 'revise') && (
                      <span className="text-red-400">*</span>
                    )}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      reviewAction === 'approve'
                        ? 'Great work! (Optional)'
                        : reviewAction === 'revise'
                        ? 'Please provide specific feedback on what needs to be improved...'
                        : 'Please explain why this submission is being rejected...'
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Close
              </button>

              {submission.status === 'pending' && reviewAction && (
                <button
                  onClick={handleReviewSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 text-white rounded-lg transition-all disabled:opacity-50 ${
                    reviewAction === 'approve'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      : reviewAction === 'revise'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : `${reviewAction === 'approve' ? 'Approve' : reviewAction === 'revise' ? 'Request Revision' : 'Reject'} Submission`}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Media Viewer */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              className="max-w-5xl max-h-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              {submission.evidenceType === 'video' ? (
                <video src={selectedMedia} controls className="max-w-full max-h-[90vh] rounded-lg" />
              ) : (
                <img src={selectedMedia} alt="Evidence" className="max-w-full max-h-[90vh] rounded-lg" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
