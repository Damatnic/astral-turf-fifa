/**
 * Evidence Submission Component
 * Upload and submit evidence for challenge completion
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Camera,
  Video,
  FileText,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Loader,
} from 'lucide-react';
import { EvidenceType, ChallengeSubmission, ChallengeRequirement } from '../../types/challenge';

interface EvidenceSubmissionProps {
  challengeId: string;
  challengeTitle: string;
  requirements: ChallengeRequirement[];
  onSubmit: (submission: Partial<ChallengeSubmission>) => Promise<void>;
  onCancel: () => void;
}

export const EvidenceSubmission: React.FC<EvidenceSubmissionProps> = ({
  challengeId,
  challengeTitle,
  requirements,
  onSubmit,
  onCancel,
}) => {
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('photo');
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState<string>('');
  const [metricValue, setMetricValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate file types
    const validTypes: Record<EvidenceType, string[]> = {
      photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
      video: ['video/mp4', 'video/quicktime', 'video/webm'],
      stats: ['application/pdf', 'image/jpeg', 'image/png'],
      tracking: ['application/gpx', 'application/json'],
      manual: [],
    };

    const invalidFiles = selectedFiles.filter(
      file => !validTypes[evidenceType].includes(file.type),
    );

    if (invalidFiles.length > 0) {
      setErrors([`Invalid file type. Please upload ${evidenceType} files only.`]);
      return;
    }

    // Validate file size (50MB max)
    const oversizedFiles = selectedFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors(['File size must be under 50MB']);
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    setErrors([]);
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle submission
  const handleSubmit = async () => {
    // Validation
    const newErrors: string[] = [];

    if (files.length === 0 && evidenceType !== 'manual') {
      newErrors.push('Please upload at least one file');
    }

    if (!description.trim()) {
      newErrors.push('Please provide a description');
    }

    if (!selectedRequirement) {
      newErrors.push('Please select which requirement this evidence is for');
    }

    if (selectedRequirement) {
      const req = requirements.find(r => r.id === selectedRequirement);
      if (req?.type === 'metric' && !metricValue) {
        newErrors.push(`Please enter your ${req.metric} value`);
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create submission object
      const submission: Partial<ChallengeSubmission> = {
        challengeId,
        evidenceType,
        evidenceUrls: [], // Would be populated after upload
        description,
        requirementId: selectedRequirement,
        value: metricValue ? parseFloat(metricValue) : undefined,
        metadata: {
          fileCount: files.length,
          fileNames: files.map(f => f.name),
          fileSizes: files.map(f => f.size),
        },
        status: 'pending',
        submittedAt: new Date(),
      };

      await onSubmit(submission);

      // Reset form
      setFiles([]);
      setDescription('');
      setSelectedRequirement('');
      setMetricValue('');
      setErrors([]);

    } catch (error) {
      setErrors(['Failed to submit evidence. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Submit Evidence</h2>
              <p className="text-sm text-gray-400">{challengeTitle}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Messages */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400 mb-1">Please fix the following:</p>
                    <ul className="text-sm text-red-300 space-y-1">
                      {errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Evidence Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Evidence Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { type: 'photo' as EvidenceType, icon: Camera, label: 'Photo' },
                { type: 'video' as EvidenceType, icon: Video, label: 'Video' },
                { type: 'stats' as EvidenceType, icon: FileText, label: 'Stats/PDF' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setEvidenceType(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    evidenceType === type
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    evidenceType === type ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    evidenceType === type ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Requirement Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Which requirement does this evidence fulfill? *
            </label>
            <select
              value={selectedRequirement}
              onChange={(e) => setSelectedRequirement(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="">Select a requirement...</option>
              {requirements.map(req => (
                <option key={req.id} value={req.id}>
                  {req.description} {req.target && `(Target: ${req.target} ${req.unit})`}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Value Input (if applicable) */}
          {selectedRequirement && requirements.find(r => r.id === selectedRequirement)?.type === 'metric' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your {requirements.find(r => r.id === selectedRequirement)?.metric} *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  placeholder="Enter value"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
                <span className="text-gray-400 text-sm">
                  {requirements.find(r => r.id === selectedRequirement)?.unit}
                </span>
              </div>
            </motion.div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Files *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all"
            >
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {evidenceType === 'photo' && 'JPG, PNG, WEBP up to 50MB'}
                {evidenceType === 'video' && 'MP4, MOV, WEBM up to 50MB'}
                {evidenceType === 'stats' && 'PDF, JPG, PNG up to 50MB'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={
                evidenceType === 'photo' ? 'image/*' :
                evidenceType === 'video' ? 'video/*' :
                'application/pdf,image/*'
              }
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Uploaded Files ({files.length})
              </label>
              {files.map((file, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your achievement, what you did, and any relevant details..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length} / 500 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Submit Evidence
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
