// Player Card Export - Generate shareable card images

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Check, Copy, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Player } from '../../types/player';
import type { PlayerRankingProfile } from '../../types/challenges';
import EnhancedPlayerRankingCard, { type CardRarity } from './EnhancedPlayerRankingCard';

interface PlayerCardExportProps {
  player: Player;
  profile: PlayerRankingProfile;
  rarity: CardRarity;
  onClose?: () => void;
}

const PlayerCardExport: React.FC<PlayerCardExportProps> = ({
  player,
  profile,
  rarity,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Export card as PNG
  const exportAsPNG = async () => {
    if (!cardRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
      });

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${player.name.replace(/\s+/g, '_')}_Card_Level${profile.currentLevel}_${rarity}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch {
      // Failed to export card
    } finally {
      setIsExporting(false);
    }
  };

  // Generate shareable link
  const generateShareLink = async () => {
    if (!cardRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Convert to base64
      const imageData = canvas.toDataURL('image/png');
      
      // In a real app, upload to server and get URL
      // For now, create a shareable text with card info
      const shareText = `Check out my ${rarity} player card!\n\n${player.name}\nLevel ${profile.currentLevel} • ${profile.totalXP.toLocaleString()} XP\n${profile.totalStats.totalChallengesCompleted} Challenges Completed\n\n#AstralTurf #PlayerCard`;
      
      setShareUrl(shareText);
      
      // Try native share API if available
      if (navigator.share) {
        try {
          // Convert base64 to blob for sharing
          const response = await fetch(imageData);
          const blob = await response.blob();
          const fileData = new globalThis.File([blob], `${player.name}_Card.png`, { type: 'image/png' });
          
          await navigator.share({
            title: `${player.name} - Player Card`,
            text: shareText,
            files: [fileData],
          });
        } catch {
          // Share API failed, show copy option
        }
      }
    } catch {
      // Failed to generate share link
    } finally {
      setIsExporting(false);
    }
  };

  // Copy share text to clipboard
  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Export Player Card</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Card Preview */}
        <div className="flex justify-center mb-6">
          <div ref={cardRef} className="inline-block">
            <EnhancedPlayerRankingCard
              player={player}
              profile={profile}
              rarity={rarity}
              showStats
              is3D={false}
            />
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportAsPNG}
            disabled={isExporting}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={20} />
                Download PNG
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateShareLink}
            disabled={isExporting}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Share2 size={20} />
                Share Card
              </>
            )}
          </motion.button>
        </div>

        {/* Share URL Display */}
        {shareUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Shareable Text</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </motion.button>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{shareUrl}</p>
          </motion.div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-400 mb-2">💡 Tips</h3>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Download as PNG to save the card to your device</li>
            <li>• Share to send the card via social media or messaging apps</li>
            <li>• High-resolution export for best quality (2x scale)</li>
            <li>• Cards update automatically with your latest stats</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlayerCardExport;
