import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  FileText,
  Image,
  Database,
  Code,
  Globe,
  Folder,
  FolderOpen,
  Star,
  Clock,
  Users,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Tag,
  X,
  Archive,
  Cloud,
  HardDrive,
  Zap,
  Camera,
  FileImage,
  FileCode,
  Save,
  Package,
} from 'lucide-react';
import { type Player, type Formation, type PlaybookItem } from '../../types';

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'png' | 'svg' | 'xml';
  includePlayerData: boolean;
  includeFormations: boolean;
  includePlaybook: boolean;
  includeAnalytics: boolean;
  compression: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

interface ImportOptions {
  replaceExisting: boolean;
  mergeStrategy: 'overwrite' | 'skip' | 'append';
  validateData: boolean;
  createBackup: boolean;
}

interface TacticalLibrary {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: 'formation' | 'playbook' | 'complete';
  rating: number;
  downloads: number;
  isPublic: boolean;
  formations: Formation[];
  playbook: PlaybookItem[];
  preview: string;
  fileSize: number;
}

interface EnhancedExportImportProps {
  formations: Record<string, Formation>;
  playbook: Record<string, PlaybookItem>;
  players: Player[];
  onExport: (options: ExportOptions, data: any) => void;
  onImport: (data: any, options: ImportOptions) => void;
  onSaveToLibrary: (library: Omit<TacticalLibrary, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onLoadFromLibrary: (libraryId: string) => void;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'export' | 'import' | 'library' | 'cloud';

const EnhancedExportImport: React.FC<EnhancedExportImportProps> = ({
  formations,
  playbook,
  players,
  onExport,
  onImport,
  onSaveToLibrary,
  onLoadFromLibrary,
  className,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includePlayerData: true,
    includeFormations: true,
    includePlaybook: false,
    includeAnalytics: false,
    compression: true,
    quality: 'high',
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    replaceExisting: false,
    mergeStrategy: 'append',
    validateData: true,
    createBackup: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'formation' | 'playbook' | 'complete'
  >('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock tactical library data
  const tacticalLibrary = useMemo(
    (): TacticalLibrary[] => [
      {
        id: 'lib-1',
        name: 'Premier League Masterclass',
        description: 'Professional formations and tactics used by top Premier League teams',
        author: 'TacticalGuru',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-20'),
        tags: ['Premier League', 'Professional', '4-3-3', 'Pressing'],
        category: 'complete',
        rating: 4.8,
        downloads: 1250,
        isPublic: true,
        formations: [],
        playbook: [],
        preview: 'preview-1.png',
        fileSize: 2.4, // MB
      },
      {
        id: 'lib-2',
        name: 'Pep Guardiola Style',
        description: 'Possession-based football with high defensive line',
        author: 'CityCoachs',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15'),
        tags: ['Pep', 'Possession', 'Tiki-taka', '4-3-3'],
        category: 'formation',
        rating: 4.9,
        downloads: 890,
        isPublic: true,
        formations: [],
        playbook: [],
        preview: 'preview-2.png',
        fileSize: 1.8,
      },
      {
        id: 'lib-3',
        name: 'Counter-Attack Masterpiece',
        description: 'Devastating counter-attacking playbook with set pieces',
        author: 'TacticalMind',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-10'),
        tags: ['Counter-attack', 'Set pieces', 'Quick transitions'],
        category: 'playbook',
        rating: 4.6,
        downloads: 650,
        isPublic: true,
        formations: [],
        playbook: [],
        preview: 'preview-3.png',
        fileSize: 3.1,
      },
    ],
    [],
  );

  // Filter library items
  const filteredLibrary = useMemo(() => {
    return tacticalLibrary.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [tacticalLibrary, searchQuery, selectedCategory]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Prepare export data
    const exportData = {
      metadata: {
        version: '1.0',
        exportedAt: new Date(),
        author: 'Tactical Board User',
        format: exportOptions.format,
      },
      formations: exportOptions.includeFormations ? formations : {},
      playbook: exportOptions.includePlaybook ? playbook : {},
      players: exportOptions.includePlayerData ? players : [],
      analytics: exportOptions.includeAnalytics ? {} : {},
    };

    onExport(exportOptions, exportData);
  }, [exportOptions, formations, playbook, players, onExport]);

  const handleImport = useCallback(
    async (file: File) => {
      setIsImporting(true);

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate data structure
        if (importOptions.validateData) {
          // Perform validation logic here
          console.log('Validating import data...');
        }

        onImport(data, importOptions);
        setPreviewData(data);
      } catch (error) {
        console.error('Import failed:', error);
      } finally {
        setIsImporting(false);
      }
    },
    [importOptions, onImport],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleImport(files[0]);
      }
    },
    [handleImport],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return Code;
      case 'csv':
        return FileText;
      case 'pdf':
        return FileText;
      case 'png':
      case 'svg':
        return FileImage;
      case 'xml':
        return Code;
      default:
        return FileText;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'formation':
        return Users;
      case 'playbook':
        return FileText;
      case 'complete':
        return Package;
      default:
        return Folder;
    }
  };

  const tabs = [
    { id: 'export', name: 'Export', icon: Download, count: 0 },
    { id: 'import', name: 'Import', icon: Upload, count: 0 },
    { id: 'library', name: 'Library', icon: Archive, count: filteredLibrary.length },
    { id: 'cloud', name: 'Cloud Sync', icon: Cloud, count: 0 },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`
          bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl
          w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Export & Import Hub</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  {Object.keys(formations).length} formations
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {Object.keys(playbook).length} plays
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/50">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative
                  ${
                    activeTab === tab.id
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                {tab.name}
                {tab.count > 0 && (
                  <span
                    className={`
                    px-1.5 py-0.5 rounded text-xs
                    ${activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-300'}
                  `}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeExportTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Export Tab */}
            {activeTab === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* Export Options */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">Export Options</h3>

                    {/* Format Selection */}
                    <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5">
                      <h4 className="font-medium text-white mb-4">Export Format</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'json', label: 'JSON', desc: 'Complete data' },
                          { id: 'csv', label: 'CSV', desc: 'Spreadsheet data' },
                          { id: 'pdf', label: 'PDF', desc: 'Printable format' },
                          { id: 'png', label: 'PNG', desc: 'High-res image' },
                          { id: 'svg', label: 'SVG', desc: 'Vector graphics' },
                          { id: 'xml', label: 'XML', desc: 'Structured data' },
                        ].map(format => {
                          const IconComponent = getFormatIcon(format.id);
                          return (
                            <button
                              key={format.id}
                              onClick={() =>
                                setExportOptions(prev => ({ ...prev, format: format.id as any }))
                              }
                              className={`
                                p-3 rounded-lg border transition-all text-left
                                ${
                                  exportOptions.format === format.id
                                    ? 'border-emerald-500/70 bg-emerald-600/25'
                                    : 'border-slate-600/50 bg-slate-800/40 hover:border-slate-500/60'
                                }
                              `}
                            >
                              <IconComponent
                                className={`w-5 h-5 mb-2 ${
                                  exportOptions.format === format.id
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                              />
                              <div className="font-medium text-white text-sm">{format.label}</div>
                              <div className="text-xs text-slate-400">{format.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content Selection */}
                    <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5">
                      <h4 className="font-medium text-white mb-4">Include Content</h4>
                      <div className="space-y-3">
                        {[
                          {
                            key: 'includePlayerData',
                            label: 'Player Data',
                            desc: 'All player information and stats',
                          },
                          {
                            key: 'includeFormations',
                            label: 'Formations',
                            desc: 'Formation layouts and tactics',
                          },
                          {
                            key: 'includePlaybook',
                            label: 'Playbook',
                            desc: 'Plays and tactical sequences',
                          },
                          {
                            key: 'includeAnalytics',
                            label: 'Analytics',
                            desc: 'Performance data and insights',
                          },
                        ].map(option => (
                          <label
                            key={option.key}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                              onChange={e =>
                                setExportOptions(prev => ({
                                  ...prev,
                                  [option.key]: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <div>
                              <div className="font-medium text-white">{option.label}</div>
                              <div className="text-sm text-slate-400">{option.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5">
                      <h4 className="font-medium text-white mb-4">Advanced Settings</h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <span className="text-white">Compression</span>
                          <input
                            type="checkbox"
                            checked={exportOptions.compression}
                            onChange={e =>
                              setExportOptions(prev => ({
                                ...prev,
                                compression: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                        </label>

                        <div>
                          <label className="text-white mb-2 block">Quality</label>
                          <select
                            value={exportOptions.quality}
                            onChange={e =>
                              setExportOptions(prev => ({
                                ...prev,
                                quality: e.target.value as any,
                              }))
                            }
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="low">Low (Fast)</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="ultra">Ultra (Slow)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Preview & Action */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">Export Preview</h3>

                    {/* Preview Area */}
                    <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5 h-64 flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <div className="font-medium mb-1">Export Preview</div>
                        <div className="text-sm">
                          Preview will appear here based on selected options
                        </div>
                      </div>
                    </div>

                    {/* Export Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-white">
                          {Object.keys(formations).length + Object.keys(playbook).length}
                        </div>
                        <div className="text-sm text-slate-400">Total Items</div>
                      </div>
                      <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-white">~2.4MB</div>
                        <div className="text-sm text-slate-400">Estimated Size</div>
                      </div>
                    </div>

                    {/* Export Action */}
                    <div className="space-y-4">
                      {isExporting && (
                        <div>
                          <div className="flex justify-between text-sm text-slate-400 mb-2">
                            <span>Exporting...</span>
                            <span>{exportProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${exportProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        {isExporting ? 'Exporting...' : 'Export Data'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Import Tab */}
            {activeTab === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* Import Options */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">Import Settings</h3>

                    {/* Import Options */}
                    <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5">
                      <h4 className="font-medium text-white mb-4">Import Behavior</h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between">
                          <span className="text-white">Replace Existing Data</span>
                          <input
                            type="checkbox"
                            checked={importOptions.replaceExisting}
                            onChange={e =>
                              setImportOptions(prev => ({
                                ...prev,
                                replaceExisting: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                        </label>

                        <div>
                          <label className="text-white mb-2 block">Merge Strategy</label>
                          <select
                            value={importOptions.mergeStrategy}
                            onChange={e =>
                              setImportOptions(prev => ({
                                ...prev,
                                mergeStrategy: e.target.value as any,
                              }))
                            }
                            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="overwrite">Overwrite Conflicts</option>
                            <option value="skip">Skip Conflicts</option>
                            <option value="append">Append New Items</option>
                          </select>
                        </div>

                        <label className="flex items-center justify-between">
                          <span className="text-white">Validate Data</span>
                          <input
                            type="checkbox"
                            checked={importOptions.validateData}
                            onChange={e =>
                              setImportOptions(prev => ({
                                ...prev,
                                validateData: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <span className="text-white">Create Backup</span>
                          <input
                            type="checkbox"
                            checked={importOptions.createBackup}
                            onChange={e =>
                              setImportOptions(prev => ({
                                ...prev,
                                createBackup: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Import Area */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">Import Data</h3>

                    {/* Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        border-2 border-dashed rounded-xl p-8 text-center transition-all
                        ${
                          dragActive
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }
                      `}
                    >
                      <Upload
                        className={`w-12 h-12 mx-auto mb-4 ${
                          dragActive ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      <div className="text-white font-medium mb-2">
                        Drop files here or click to browse
                      </div>
                      <div className="text-sm text-slate-400 mb-4">
                        Supports JSON, CSV, XML formats
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.csv,.xml"
                        onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      >
                        Choose File
                      </button>
                    </div>

                    {/* Import Status */}
                    {isImporting && (
                      <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                          <span className="text-white font-medium">Importing data...</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          Validating and processing your data
                        </div>
                      </div>
                    )}

                    {/* Preview Imported Data */}
                    {previewData && (
                      <div className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5">
                        <h4 className="font-medium text-white mb-3">Import Preview</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Formations:</span>
                            <span className="text-white">
                              {Object.keys(previewData.formations || {}).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Players:</span>
                            <span className="text-white">{(previewData.players || []).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Playbook Items:</span>
                            <span className="text-white">
                              {Object.keys(previewData.playbook || {}).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Library Tab */}
            {activeTab === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                {/* Library Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Tactical Library</h3>
                    <button
                      onClick={() => {}} // Handle save to library
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Save Current
                    </button>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search library..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value as any)}
                      className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="formation">Formations</option>
                      <option value="playbook">Playbooks</option>
                      <option value="complete">Complete Sets</option>
                    </select>
                  </div>
                </div>

                {/* Library Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLibrary.map(item => {
                      const CategoryIcon = getCategoryIcon(item.category);
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-slate-800/40 border border-slate-600/50 rounded-xl overflow-hidden hover:border-slate-500/60 transition-all cursor-pointer"
                          onClick={() => onLoadFromLibrary(item.id)}
                        >
                          {/* Preview Image */}
                          <div className="h-32 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 flex items-center justify-center">
                            <CategoryIcon className="w-8 h-8 text-emerald-400" />
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-white text-sm leading-tight">
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-yellow-400">
                                <Star className="w-3 h-3 fill-current" />
                                {item.rating}
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                              {item.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                              <span>{item.author}</span>
                              <span>{item.fileSize}MB</span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Download className="w-3 h-3" />
                                {item.downloads}
                              </div>
                              <span className="text-xs text-slate-400">
                                {item.updatedAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cloud Sync Tab */}
            {activeTab === 'cloud' && (
              <motion.div
                key="cloud"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-6 flex items-center justify-center"
              >
                <div className="text-center text-slate-400">
                  <Cloud className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Cloud Sync</h3>
                  <p className="text-sm">
                    Sync your tactical data across devices with cloud storage.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                    Connect to Cloud
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { EnhancedExportImport };
export default EnhancedExportImport;
