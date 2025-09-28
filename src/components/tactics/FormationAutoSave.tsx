import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Clock, 
  Download, 
  Upload, 
  Settings, 
  History, 
  Star, 
  Trash2, 
  Play, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { formationManager, type FormationSaveData, type FormationAutoSaveOptions } from '../../services/formationManagementService';
import type { Formation, Player } from '../../types';

interface FormationAutoSaveProps {
  currentFormation?: Formation;
  currentPlayers: Player[];
  onLoadFormation: (formation: Formation) => void;
  onNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

const FormationAutoSave: React.FC<FormationAutoSaveProps> = ({
  currentFormation,
  currentPlayers,
  onLoadFormation,
  onNotification,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'saves' | 'templates' | 'settings'>('saves');
  const [saveHistory, setSaveHistory] = useState<FormationSaveData[]>([]);
  const [templates, setTemplates] = useState<FormationSaveData[]>([]);
  const [autoSaveOptions, setAutoSaveOptions] = useState<FormationAutoSaveOptions>({
    enabled: true,
    interval: 30000,
    maxAutoSaves: 10,
    saveOnPlayerChange: true,
    saveOnFormationChange: true,
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Initialize auto-save system
  useEffect(() => {
    formationManager.initializeAutoSave(autoSaveOptions);
    loadSaveData();

    // Set up periodic updates for last auto-save time
    const interval = setInterval(() => {
      // Check for new auto-saves
      loadSaveData();
    }, 5000);

    return () => {
      clearInterval(interval);
      formationManager.destroy();
    };
  }, []);

  // Load save data from service
  const loadSaveData = useCallback(() => {
    const history = formationManager.getSaveHistory();
    const formationTemplates = formationManager.getFormationTemplates();
    
    setSaveHistory(history);
    setTemplates(formationTemplates);
    
    // Update last auto-save time
    const latestAutoSave = history.find(save => save.isAutoSaved);
    if (latestAutoSave) {
      setLastAutoSave(new Date(latestAutoSave.savedAt));
    }
  }, []);

  // Handle manual save
  const handleManualSave = useCallback(() => {
    if (!currentFormation) {
      onNotification('No formation to save', 'error');
      return;
    }

    const customName = `Manual Save - ${new Date().toLocaleString()}`;
    const saveData = formationManager.manualSave(customName);
    
    if (saveData) {
      onNotification('Formation saved successfully!', 'success');
      loadSaveData();
    } else {
      onNotification('Failed to save formation', 'error');
    }
  }, [currentFormation, onNotification, loadSaveData]);

  // Handle load formation
  const handleLoadFormation = useCallback((saveId: string) => {
    const saveData = formationManager.loadFormationFromSave(saveId);
    if (saveData) {
      onLoadFormation(saveData.formation);
      onNotification(`Loaded: ${saveData.name}`, 'success');
      setIsOpen(false);
    }
  }, [onLoadFormation, onNotification]);

  // Handle delete save
  const handleDeleteSave = useCallback((saveId: string) => {
    if (formationManager.deleteFormationSave(saveId)) {
      onNotification('Formation save deleted', 'info');
      loadSaveData();
    }
  }, [onNotification, loadSaveData]);

  // Handle create template
  const handleCreateTemplate = useCallback(() => {
    if (!currentFormation || !templateName.trim()) {
      onNotification('Please provide a template name', 'error');
      return;
    }

    const template = formationManager.createFormationTemplate(
      currentFormation,
      currentPlayers,
      templateName.trim(),
      templateDescription.trim()
    );

    if (template) {
      onNotification('Formation template created!', 'success');
      setIsCreatingTemplate(false);
      setTemplateName('');
      setTemplateDescription('');
      loadSaveData();
    }
  }, [currentFormation, currentPlayers, templateName, templateDescription, onNotification, loadSaveData]);

  // Handle settings update
  const handleSettingsUpdate = useCallback((newOptions: Partial<FormationAutoSaveOptions>) => {
    const updatedOptions = { ...autoSaveOptions, ...newOptions };
    setAutoSaveOptions(updatedOptions);
    formationManager.updateAutoSaveOptions(updatedOptions);
    onNotification('Auto-save settings updated', 'success');
  }, [autoSaveOptions, onNotification]);

  // Handle export
  const handleExport = useCallback((saveId: string) => {
    const exportData = formationManager.exportFormation(saveId);
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `formation_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onNotification('Formation exported!', 'success');
    }
  }, [onNotification]);

  // Handle import
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const imported = formationManager.importFormation(content);
      
      if (imported) {
        onNotification('Formation imported successfully!', 'success');
        loadSaveData();
      } else {
        onNotification('Failed to import formation', 'error');
      }
    };
    reader.readAsText(file);
  }, [onNotification, loadSaveData]);

  // Format time ago
  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  // Auto-save status
  const autoSaveStatus = useMemo(() => {
    if (!autoSaveOptions.enabled) return { status: 'disabled', message: 'Auto-save disabled' };
    if (!lastAutoSave) return { status: 'waiting', message: 'Waiting for changes...' };
    
    const timeSinceLastSave = Date.now() - lastAutoSave.getTime();
    if (timeSinceLastSave < autoSaveOptions.interval) {
      return { status: 'recent', message: `Last saved ${formatTimeAgo(lastAutoSave.toISOString())}` };
    }
    
    return { status: 'pending', message: 'Changes detected, will save soon...' };
  }, [autoSaveOptions.enabled, autoSaveOptions.interval, lastAutoSave, formatTimeAgo]);

  return (
    <>
      {/* Auto-Save Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          relative flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 
          border border-slate-600/50 rounded-lg transition-all text-white text-sm
          ${className}
        `}
        title="Formation Auto-Save & Templates"
      >
        <Save className="w-4 h-4" />
        <span className="hidden md:inline">Auto-Save</span>
        
        {/* Status indicator */}
        <div className={`
          w-2 h-2 rounded-full
          ${autoSaveStatus.status === 'recent' ? 'bg-green-400' : 
            autoSaveStatus.status === 'pending' ? 'bg-yellow-400 animate-pulse' :
            autoSaveStatus.status === 'disabled' ? 'bg-red-400' : 'bg-gray-400'}
        `} />
      </button>

      {/* Auto-Save Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div>
                  <h2 className="text-2xl font-bold text-white">Formation Auto-Save</h2>
                  <p className="text-slate-400 mt-1">{autoSaveStatus.message}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleManualSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Now
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700/50">
                {[
                  { id: 'saves', label: 'Save History', icon: History, count: saveHistory.length },
                  { id: 'templates', label: 'Templates', icon: Star, count: templates.length },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors
                      ${activeTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'saves' && (
                  <div className="space-y-4">
                    {saveHistory.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No saves yet</p>
                        <p className="text-sm">Formations will be auto-saved as you work</p>
                      </div>
                    ) : (
                      saveHistory.map(save => (
                        <div
                          key={save.id}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-white font-medium">{save.name}</h3>
                                {save.isAutoSaved ? (
                                  <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">
                                    Auto-saved
                                  </span>
                                ) : (
                                  <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded">
                                    Manual
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-sm mb-2">
                                {formatTimeAgo(save.savedAt)} • Version {save.version}
                              </p>
                              {save.analysis && (
                                <div className="flex items-center gap-4 text-xs">
                                  <span className="text-green-400">
                                    Score: {save.analysis.averageScore}/100
                                  </span>
                                  <span className="text-blue-400">
                                    {save.teamPlayers.length} players
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLoadFormation(save.id)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-all"
                                title="Load Formation"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExport(save.id)}
                                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-all"
                                title="Export Formation"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSave(save.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-all"
                                title="Delete Save"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'templates' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium">Formation Templates</h3>
                      <button
                        onClick={() => setIsCreatingTemplate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <Star className="w-4 h-4" />
                        Create Template
                      </button>
                    </div>

                    {/* Create Template Modal */}
                    {isCreatingTemplate && (
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
                        <h4 className="text-white font-medium mb-3">Create Formation Template</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Template name..."
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white placeholder-slate-400"
                          />
                          <textarea
                            placeholder="Description (optional)..."
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white placeholder-slate-400 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCreateTemplate}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                            >
                              Create
                            </button>
                            <button
                              onClick={() => setIsCreatingTemplate(false)}
                              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {templates.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No templates yet</p>
                        <p className="text-sm">Create templates from your best formations</p>
                      </div>
                    ) : (
                      templates.map(template => (
                        <div
                          key={template.id}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-green-500/50 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-white font-medium mb-1">{template.name}</h3>
                              {template.formation.notes && (
                                <p className="text-slate-400 text-sm mb-2">{template.formation.notes}</p>
                              )}
                              <p className="text-slate-500 text-xs">
                                Created {formatTimeAgo(template.savedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLoadFormation(template.id)}
                                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-all"
                                title="Load Template"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExport(template.id)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-all"
                                title="Export Template"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-medium mb-4">Auto-Save Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-white text-sm font-medium">Enable Auto-Save</label>
                            <p className="text-slate-400 text-xs">Automatically save formations while you work</p>
                          </div>
                          <button
                            onClick={() => handleSettingsUpdate({ enabled: !autoSaveOptions.enabled })}
                            className={`
                              relative w-12 h-6 rounded-full transition-colors
                              ${autoSaveOptions.enabled ? 'bg-green-600' : 'bg-slate-600'}
                            `}
                          >
                            <div className={`
                              absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                              ${autoSaveOptions.enabled ? 'translate-x-7' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>

                        <div>
                          <label className="text-white text-sm font-medium block mb-2">
                            Auto-Save Interval: {autoSaveOptions.interval / 1000}s
                          </label>
                          <input
                            type="range"
                            min="5000"
                            max="300000"
                            step="5000"
                            value={autoSaveOptions.interval}
                            onChange={(e) => handleSettingsUpdate({ interval: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-white text-sm font-medium block mb-2">
                            Max Auto-Saves: {autoSaveOptions.maxAutoSaves}
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={autoSaveOptions.maxAutoSaves}
                            onChange={(e) => handleSettingsUpdate({ maxAutoSaves: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="saveOnPlayerChange"
                              checked={autoSaveOptions.saveOnPlayerChange}
                              onChange={(e) => handleSettingsUpdate({ saveOnPlayerChange: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <label htmlFor="saveOnPlayerChange" className="text-white text-sm">
                              Save on player changes
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="saveOnFormationChange"
                              checked={autoSaveOptions.saveOnFormationChange}
                              onChange={(e) => handleSettingsUpdate({ saveOnFormationChange: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <label htmlFor="saveOnFormationChange" className="text-white text-sm">
                              Save on formation changes
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-700/50">
                      <h4 className="text-white font-medium mb-3">Import/Export</h4>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Import Formation
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export { FormationAutoSave };
export default FormationAutoSave;