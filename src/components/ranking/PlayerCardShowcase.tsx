import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  Copy,
  RotateCcw,
  X,
  Check,
  Image as ImageIcon,
  Sparkles,
  Users,
  BarChart3,
} from 'lucide-react';
import EnhancedPlayerRankingCard, { CardRarity } from './EnhancedPlayerRankingCard';
import PlayerCardComparison from './PlayerCardComparison';
import PlayerStatRadar from './PlayerStatRadar';
import {
  exportPlayerCard,
  downloadCardImage,
  shareCardImage,
  copyCardToClipboard,
  generateCardFilename,
} from '../../utils/cardExport';
import type { Player } from '../../types/player';
import type { PlayerRankingProfile } from '../../types/challenges';

interface PlayerCardShowcaseProps {
  player: Player;
  profile: PlayerRankingProfile;
  rarity?: CardRarity;
  comparisonPlayers?: Array<{
    player: Player;
    profile: PlayerRankingProfile;
    rarity?: CardRarity;
  }>;
}

const PlayerCardShowcase: React.FC<PlayerCardShowcaseProps> = ({
  player,
  profile,
  rarity = 'common',
  comparisonPlayers = [],
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle card flip
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Handle card export
  const handleExport = async () => {
    if (!cardRef.current) {
      return;
    }

    setExportStatus('exporting');
    setExportMessage('Generating image...');

    try {
      const result = await exportPlayerCard(cardRef.current, {
        player,
        profile,
        rarity,
        includeWatermark: true,
        watermarkText: 'Astral Turf',
      });

      if (result.success && result.dataUrl) {
        const filename = generateCardFilename(player, profile, rarity);
        downloadCardImage(result.dataUrl, filename);
        setExportStatus('success');
        setExportMessage('Card downloaded!');
        setTimeout(() => {
          setExportStatus('idle');
          setExportMessage('');
        }, 3000);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      setExportStatus('error');
      setExportMessage('Export failed');
      setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
      }, 3000);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!cardRef.current) {
      return;
    }

    setExportStatus('exporting');
    setExportMessage('Preparing to share...');

    try {
      const result = await exportPlayerCard(cardRef.current, {
        player,
        profile,
        rarity,
      });

      if (result.success && result.blob) {
        const shared = await shareCardImage(result.blob, player, profile);
        if (shared) {
          setExportStatus('success');
          setExportMessage('Shared successfully!');
        } else {
          // Fallback to download if share not available
          if (result.dataUrl) {
            const filename = generateCardFilename(player, profile, rarity);
            downloadCardImage(result.dataUrl, filename);
            setExportStatus('success');
            setExportMessage('Card downloaded!');
          }
        }
        setTimeout(() => {
          setExportStatus('idle');
          setExportMessage('');
        }, 3000);
      }
    } catch (error) {
      setExportStatus('error');
      setExportMessage('Share failed');
      setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
      }, 3000);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!cardRef.current) {
      return;
    }

    setExportStatus('exporting');
    setExportMessage('Copying to clipboard...');

    try {
      const result = await exportPlayerCard(cardRef.current, {
        player,
        profile,
        rarity,
      });

      if (result.success && result.blob) {
        const copied = await copyCardToClipboard(result.blob);
        if (copied) {
          setExportStatus('success');
          setExportMessage('Copied to clipboard!');
        } else {
          throw new Error('Clipboard not supported');
        }
        setTimeout(() => {
          setExportStatus('idle');
          setExportMessage('');
        }, 3000);
      }
    } catch (error) {
      setExportStatus('error');
      setExportMessage('Copy failed');
      setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComparison(!showComparison)}
          disabled={comparisonPlayers.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            showComparison
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Users size={18} />
          {showComparison ? 'Hide' : 'Show'} Comparison
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowRadar(!showRadar)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            showRadar
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <BarChart3 size={18} />
          {showRadar ? 'Hide' : 'Show'} Stats
        </motion.button>

        <div className="h-8 w-px bg-gray-700" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          disabled={exportStatus === 'exporting'}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {exportStatus === 'exporting' ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <ImageIcon size={18} />
            </motion.div>
          ) : exportStatus === 'success' ? (
            <Check size={18} />
          ) : (
            <Download size={18} />
          )}
          {exportStatus === 'exporting' ? 'Exporting...' : 'Download PNG'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          disabled={exportStatus === 'exporting'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <Share2 size={18} />
          Share
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          disabled={exportStatus === 'exporting'}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <Copy size={18} />
          Copy
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, rotate: -180 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFlip}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium"
        >
          <RotateCcw size={18} />
          Flip
        </motion.button>
      </div>

      {/* Export Status Message */}
      <AnimatePresence>
        {exportMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              exportStatus === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : exportStatus === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
            }`}
          >
            {exportStatus === 'success' ? (
              <Check size={18} />
            ) : exportStatus === 'error' ? (
              <X size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            <span className="font-medium">{exportMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Display Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Player Card */}
        <div ref={cardRef}>
          <EnhancedPlayerRankingCard
            player={player}
            profile={profile}
            rarity={rarity}
            is3D={true}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            showStats={true}
          />
        </div>

        {/* Stat Radar */}
        <AnimatePresence>
          {showRadar && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-gray-800/50  rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-400" />
                Attribute Analysis
              </h3>
              <PlayerStatRadar
                player={player}
                size={350}
                showLabels={true}
                color="#A855F7"
                animated={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comparison View */}
      <AnimatePresence>
        {showComparison && comparisonPlayers.length > 0 && (
          <PlayerCardComparison
            players={[
              { player, profile, rarity },
              ...comparisonPlayers,
            ]}
            onClose={() => setShowComparison(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerCardShowcase;
