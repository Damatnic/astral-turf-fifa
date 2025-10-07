import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Position {
  x: number;
  y: number;
}

interface SelectionRectangle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface SelectionRectangleOverlayProps {
  rectangle: SelectionRectangle | null;
  visible: boolean;
}

/**
 * Visual rectangle for lasso selection
 */
export const SelectionRectangleOverlay: React.FC<SelectionRectangleOverlayProps> = ({
  rectangle,
  visible,
}) => {
  if (!visible || !rectangle) {
    return null;
  }

  const { startX, startY, endX, endY } = rectangle;
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute z-40 pointer-events-none"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
      >
        {/* Selection rectangle */}
        <div className="w-full h-full border-2 border-blue-500 bg-blue-500/10 rounded">
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 border-2 border-blue-400 rounded"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Corner indicators */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
            <div
              key={corner}
              className={`absolute w-2 h-2 bg-blue-500 rounded-full ${
                corner === 'top-left'
                  ? '-top-1 -left-1'
                  : corner === 'top-right'
                    ? '-top-1 -right-1'
                    : corner === 'bottom-left'
                      ? '-bottom-1 -left-1'
                      : '-bottom-1 -right-1'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

interface GroupSelectionIndicatorProps {
  items: Array<{ id: string; position: Position }>;
  visible: boolean;
  center?: Position | null;
  bounds?: { minX: number; maxX: number; minY: number; maxY: number } | null;
}

/**
 * Visual indicator for selected group
 */
export const GroupSelectionIndicator: React.FC<GroupSelectionIndicatorProps> = ({
  items,
  visible,
  center,
  bounds,
}) => {
  if (!visible || items.length === 0 || !bounds) {
    return null;
  }

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute z-35 pointer-events-none"
        style={{
          left: `${bounds.minX}%`,
          top: `${bounds.minY}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
      >
        {/* Bounding box */}
        <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-lg">
          {/* Pulsing glow */}
          <motion.div
            className="absolute inset-0 border-2 border-blue-300 rounded-lg"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Corner handles */}
          {['nw', 'ne', 'sw', 'se'].map(corner => (
            <div
              key={corner}
              className={`absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-sm shadow-lg ${
                corner === 'nw'
                  ? '-top-1.5 -left-1.5'
                  : corner === 'ne'
                    ? '-top-1.5 -right-1.5'
                    : corner === 'sw'
                      ? '-bottom-1.5 -left-1.5'
                      : '-bottom-1.5 -right-1.5'
              }`}
            />
          ))}

          {/* Edge handles */}
          <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm shadow-lg" />
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm shadow-lg" />
          <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm shadow-lg" />
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm shadow-lg" />
        </div>

        {/* Center point indicator */}
        {center && (
          <motion.div
            className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"
            style={{
              left: `${((center.x - bounds.minX) / width) * 100}%`,
              top: `${((center.y - bounds.minY) / height) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Cross hair */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-blue-400 transform -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-blue-400 transform -translate-x-1/2" />
          </motion.div>
        )}

        {/* Selection count badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white"
        >
          {items.length} selected
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface SelectionContextMenuProps {
  visible: boolean;
  position: Position;
  selectedCount: number;
  onAlign: (
    type: 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical'
  ) => void;
  onDistribute: (type: 'horizontal' | 'vertical') => void;
  onMirror: (axis: 'horizontal' | 'vertical') => void;
  onClearSelection: () => void;
  onClose: () => void;
}

/**
 * Context menu for group operations
 */
export const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  visible,
  position,
  selectedCount,
  onAlign,
  onDistribute,
  onMirror,
  onClearSelection,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute z-[9999] bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl overflow-hidden pointer-events-auto"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
        }}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">Group Actions</span>
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          </div>
          <button onClick={onClose} className="text-white hover:text-slate-200 transition-colors">
            ✕
          </button>
        </div>

        {/* Menu sections */}
        <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
          {/* Alignment section */}
          <div className="space-y-1">
            <div className="text-slate-400 text-xs font-semibold px-2 py-1">ALIGN</div>
            <button
              onClick={() => {
                onAlign('left');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>⬅️</span> Align Left
            </button>
            <button
              onClick={() => {
                onAlign('right');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>➡️</span> Align Right
            </button>
            <button
              onClick={() => {
                onAlign('top');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>⬆️</span> Align Top
            </button>
            <button
              onClick={() => {
                onAlign('bottom');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>⬇️</span> Align Bottom
            </button>
            <button
              onClick={() => {
                onAlign('center-horizontal');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>↔️</span> Center Horizontally
            </button>
            <button
              onClick={() => {
                onAlign('center-vertical');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>↕️</span> Center Vertically
            </button>
          </div>

          {/* Distribution section (requires 3+ items) */}
          {selectedCount >= 3 && (
            <div className="space-y-1 pt-2 border-t border-slate-700">
              <div className="text-slate-400 text-xs font-semibold px-2 py-1">DISTRIBUTE</div>
              <button
                onClick={() => {
                  onDistribute('horizontal');
                  onClose();
                }}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
              >
                <span>↔️</span> Distribute Horizontally
              </button>
              <button
                onClick={() => {
                  onDistribute('vertical');
                  onClose();
                }}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
              >
                <span>↕️</span> Distribute Vertically
              </button>
            </div>
          )}

          {/* Mirror section */}
          <div className="space-y-1 pt-2 border-t border-slate-700">
            <div className="text-slate-400 text-xs font-semibold px-2 py-1">MIRROR</div>
            <button
              onClick={() => {
                onMirror('horizontal');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>⇄</span> Mirror Horizontally
            </button>
            <button
              onClick={() => {
                onMirror('vertical');
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-2"
            >
              <span>⇅</span> Mirror Vertically
            </button>
          </div>

          {/* Actions section */}
          <div className="space-y-1 pt-2 border-t border-slate-700">
            <button
              onClick={() => {
                onClearSelection();
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 rounded transition-colors flex items-center gap-2"
            >
              <span>✕</span> Clear Selection
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

interface SelectionToolbarProps {
  selectedCount: number;
  onAlign: (
    type: 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical'
  ) => void;
  onDistribute: (type: 'horizontal' | 'vertical') => void;
  onMirror: (axis: 'horizontal' | 'vertical') => void;
  onClearSelection: () => void;
  position?: 'top' | 'bottom';
}

/**
 * Floating toolbar for quick group operations
 */
export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  onAlign,
  onDistribute,
  onMirror,
  onClearSelection,
  position = 'bottom',
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`absolute ${position === 'bottom' ? 'bottom-4' : 'top-4'} left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl px-3 py-2 flex items-center gap-2`}
      >
        {/* Selection count */}
        <div className="flex items-center gap-2 px-2 py-1 bg-blue-600 rounded text-white text-sm font-semibold">
          <span>{selectedCount} selected</span>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Align buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onAlign('left');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Align Left"
          >
            ⬅️
          </button>
          <button
            onClick={() => {
              onAlign('center-horizontal');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Center Horizontally"
          >
            ↔️
          </button>
          <button
            onClick={() => {
              onAlign('right');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Align Right"
          >
            ➡️
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Vertical align buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onAlign('top');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Align Top"
          >
            ⬆️
          </button>
          <button
            onClick={() => {
              onAlign('center-vertical');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Center Vertically"
          >
            ↕️
          </button>
          <button
            onClick={() => {
              onAlign('bottom');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Align Bottom"
          >
            ⬇️
          </button>
        </div>

        {/* Distribute buttons (only for 3+ items) */}
        {selectedCount >= 3 && (
          <>
            <div className="w-px h-6 bg-slate-700" />
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onDistribute('horizontal');
                }}
                className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
                title="Distribute Horizontally"
              >
                ⟷
              </button>
              <button
                onClick={() => {
                  onDistribute('vertical');
                }}
                className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
                title="Distribute Vertically"
              >
                ⟷
              </button>
            </div>
          </>
        )}

        <div className="w-px h-6 bg-slate-700" />

        {/* Mirror buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onMirror('horizontal');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Mirror Horizontally"
          >
            ⇄
          </button>
          <button
            onClick={() => {
              onMirror('vertical');
            }}
            className="p-2 hover:bg-slate-800 rounded transition-colors text-white text-sm"
            title="Mirror Vertically"
          >
            ⇅
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-2 hover:bg-red-900/20 rounded transition-colors text-red-400 text-sm font-semibold"
          title="Clear Selection"
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
