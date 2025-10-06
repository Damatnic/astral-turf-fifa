/**
 * Quick Start Templates - Temporarily Disabled
 */
import React from 'react';

interface QuickStartTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset?: (preset: any) => void;
  currentFormation?: string;
  className?: string;
}

const QuickStartTemplates: React.FC<QuickStartTemplatesProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Quick Start Templates</h2>
        <p className="mb-4">Temporarily unavailable</p>
        <button onClick={onClose} className="bg-blue-500 text-white px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default QuickStartTemplates;
