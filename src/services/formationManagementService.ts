import type { Formation, Player, TacticsState } from '../types';
import { autoAssignPlayersToFormation, getFormationAnalysis } from './formationAutoAssignment';

interface FormationSaveData {
  id: string;
  name: string;
  formation: Formation;
  savedAt: string;
  version: number;
  isAutoSaved: boolean;
  teamPlayers: string[]; // Player IDs that were assigned
  analysis?: {
    totalScore: number;
    averageScore: number;
    strengths: string[];
    weaknesses: string[];
  };
}

interface FormationAutoSaveOptions {
  enabled: boolean;
  interval: number; // milliseconds
  maxAutoSaves: number;
  saveOnPlayerChange: boolean;
  saveOnFormationChange: boolean;
}

/**
 * Enhanced Formation Management Service
 * 
 * Features:
 * - Auto-save formations with configurable intervals
 * - Version history and rollback capability
 * - Template management with custom formations
 * - Formation analysis and optimization suggestions
 * - Intelligent player assignment recommendations
 */
class FormationManagementService {
  private autoSaveOptions: FormationAutoSaveOptions = {
    enabled: true,
    interval: 30000, // 30 seconds
    maxAutoSaves: 10,
    saveOnPlayerChange: true,
    saveOnFormationChange: true,
  };

  private autoSaveTimer: NodeJS.Timeout | null = null;
  private lastSaveData: string = '';
  private saveHistory: FormationSaveData[] = [];

  /**
   * Initialize auto-save system
   */
  public initializeAutoSave(options?: Partial<FormationAutoSaveOptions>): void {
    this.autoSaveOptions = { ...this.autoSaveOptions, ...options };
    
    if (this.autoSaveOptions.enabled) {
      this.startAutoSave();
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(() => {
      this.performAutoSave();
    }, this.autoSaveOptions.interval);
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Perform auto-save if data has changed
   */
  private performAutoSave(): void {
    const currentData = this.getCurrentFormationData();
    const dataString = JSON.stringify(currentData);
    
    if (dataString !== this.lastSaveData) {
      this.saveFormationVersion(currentData, true);
      this.lastSaveData = dataString;
    }
  }

  /**
   * Get current formation data from local storage or context
   */
  private getCurrentFormationData(): any {
    // This would typically get data from React context or state management
    // For now, we'll return a placeholder that can be implemented
    try {
      const savedState = localStorage.getItem('tacticsState');
      return savedState ? JSON.parse(savedState) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save formation version with metadata
   */
  public saveFormationVersion(
    formationData: any,
    isAutoSaved: boolean = false,
    customName?: string
  ): FormationSaveData {
    const saveData: FormationSaveData = {
      id: `formation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customName || `${isAutoSaved ? 'Auto-save' : 'Manual save'} ${new Date().toLocaleTimeString()}`,
      formation: formationData?.formation || {},
      savedAt: new Date().toISOString(),
      version: this.saveHistory.length + 1,
      isAutoSaved,
      teamPlayers: formationData?.players?.map((p: Player) => p.id) || [],
    };

    // Add formation analysis if data is available
    if (formationData?.formation && formationData?.players) {
      const analysis = getFormationAnalysis(formationData.formation, formationData.players);
      saveData.analysis = {
        totalScore: analysis.totalScore,
        averageScore: analysis.averageScore,
        strengths: this.extractStrengths(analysis),
        weaknesses: this.extractWeaknesses(analysis),
      };
    }

    this.saveHistory.push(saveData);

    // Limit history size for auto-saves
    if (isAutoSaved && this.saveHistory.filter(s => s.isAutoSaved).length > this.autoSaveOptions.maxAutoSaves) {
      this.cleanupOldAutoSaves();
    }

    // Persist to localStorage
    this.persistSaveHistory();

    return saveData;
  }

  /**
   * Extract formation strengths from analysis
   */
  private extractStrengths(analysis: any): string[] {
    const strengths: string[] = [];
    
    if (analysis.averageScore >= 80) {
      strengths.push('Well-balanced team selection');
    }
    
    const excellentPositions = analysis.positionScores.filter((p: any) => p.fitness === 'excellent');
    if (excellentPositions.length >= 6) {
      strengths.push('Strong positional coverage');
    }
    
    const defensePositions = analysis.positionScores.filter((p: any) => 
      p.role.includes('DF') || p.role.includes('GK')
    );
    if (defensePositions.every((p: any) => p.fitness !== 'poor')) {
      strengths.push('Solid defensive foundation');
    }

    return strengths;
  }

  /**
   * Extract formation weaknesses from analysis
   */
  private extractWeaknesses(analysis: any): string[] {
    const weaknesses: string[] = [];
    
    if (analysis.averageScore < 60) {
      weaknesses.push('Multiple players out of position');
    }
    
    const poorPositions = analysis.positionScores.filter((p: any) => p.fitness === 'poor');
    if (poorPositions.length > 2) {
      weaknesses.push('Several weak positional fits');
    }
    
    if (analysis.recommendations.length > 5) {
      weaknesses.push('Multiple tactical adjustments needed');
    }

    return weaknesses;
  }

  /**
   * Clean up old auto-saves
   */
  private cleanupOldAutoSaves(): void {
    const autoSaves = this.saveHistory.filter(s => s.isAutoSaved);
    const toRemove = autoSaves.slice(0, autoSaves.length - this.autoSaveOptions.maxAutoSaves);
    
    toRemove.forEach(save => {
      const index = this.saveHistory.findIndex(s => s.id === save.id);
      if (index !== -1) {
        this.saveHistory.splice(index, 1);
      }
    });
  }

  /**
   * Persist save history to localStorage
   */
  private persistSaveHistory(): void {
    try {
      localStorage.setItem('formationSaveHistory', JSON.stringify(this.saveHistory));
    } catch (error) {
      console.warn('Failed to persist formation save history:', error);
    }
  }

  /**
   * Load save history from localStorage
   */
  public loadSaveHistory(): FormationSaveData[] {
    try {
      const saved = localStorage.getItem('formationSaveHistory');
      if (saved) {
        this.saveHistory = JSON.parse(saved);
        return this.saveHistory;
      }
    } catch (error) {
      console.warn('Failed to load formation save history:', error);
    }
    return [];
  }

  /**
   * Get formation save history
   */
  public getSaveHistory(): FormationSaveData[] {
    return [...this.saveHistory].sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  /**
   * Load formation from save data
   */
  public loadFormationFromSave(saveId: string): FormationSaveData | null {
    return this.saveHistory.find(save => save.id === saveId) || null;
  }

  /**
   * Delete formation save
   */
  public deleteFormationSave(saveId: string): boolean {
    const index = this.saveHistory.findIndex(save => save.id === saveId);
    if (index !== -1) {
      this.saveHistory.splice(index, 1);
      this.persistSaveHistory();
      return true;
    }
    return false;
  }

  /**
   * Create formation template from current formation
   */
  public createFormationTemplate(
    formation: Formation,
    players: Player[],
    templateName: string,
    description?: string
  ): FormationSaveData {
    const analysis = getFormationAnalysis(formation, players);
    
    const template: FormationSaveData = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateName,
      formation: {
        ...formation,
        name: templateName,
        isCustom: true,
        notes: description,
      },
      savedAt: new Date().toISOString(),
      version: 1,
      isAutoSaved: false,
      teamPlayers: players.map(p => p.id),
      analysis: {
        totalScore: analysis.totalScore,
        averageScore: analysis.averageScore,
        strengths: this.extractStrengths(analysis),
        weaknesses: this.extractWeaknesses(analysis),
      },
    };

    this.saveHistory.push(template);
    this.persistSaveHistory();

    return template;
  }

  /**
   * Get formation templates (non-auto-saved formations)
   */
  public getFormationTemplates(): FormationSaveData[] {
    return this.saveHistory
      .filter(save => !save.isAutoSaved)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  /**
   * Smart formation optimization
   */
  public optimizeFormation(
    formation: Formation,
    players: Player[],
    team: 'home' | 'away'
  ): {
    optimizedFormation: Formation;
    improvements: string[];
    analysis: any;
  } {
    // Auto-assign players for optimal positions
    const optimizedFormation = autoAssignPlayersToFormation(players, formation, team);
    
    // Get analysis of optimized formation
    const analysis = getFormationAnalysis(optimizedFormation, players);
    
    // Generate improvement suggestions
    const improvements: string[] = [];
    
    if (analysis.averageScore > 75) {
      improvements.push('Formation is well-optimized with strong player-position matches');
    }
    
    if (analysis.recommendations.length === 0) {
      improvements.push('All positions have suitable players assigned');
    } else {
      improvements.push(`${analysis.recommendations.length} positions could benefit from player adjustments`);
    }

    const excellentFits = analysis.positionScores.filter(p => p.fitness === 'excellent').length;
    if (excellentFits >= 7) {
      improvements.push(`${excellentFits} players are in excellent positional fits`);
    }

    return {
      optimizedFormation,
      improvements,
      analysis,
    };
  }

  /**
   * Export formation data
   */
  public exportFormation(saveId: string): string | null {
    const save = this.loadFormationFromSave(saveId);
    if (!save) return null;

    return JSON.stringify({
      ...save,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    }, null, 2);
  }

  /**
   * Import formation data
   */
  public importFormation(importData: string): FormationSaveData | null {
    try {
      const data = JSON.parse(importData);
      
      // Validate imported data structure
      if (!data.formation || !data.name) {
        throw new Error('Invalid formation data');
      }

      // Create new save with imported data
      const importedSave: FormationSaveData = {
        ...data,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString(),
        version: this.saveHistory.length + 1,
        isAutoSaved: false,
      };

      this.saveHistory.push(importedSave);
      this.persistSaveHistory();

      return importedSave;
    } catch (error) {
      console.error('Failed to import formation:', error);
      return null;
    }
  }

  /**
   * Update auto-save options
   */
  public updateAutoSaveOptions(options: Partial<FormationAutoSaveOptions>): void {
    this.autoSaveOptions = { ...this.autoSaveOptions, ...options };
    
    if (this.autoSaveOptions.enabled) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
  }

  /**
   * Get auto-save options
   */
  public getAutoSaveOptions(): FormationAutoSaveOptions {
    return { ...this.autoSaveOptions };
  }

  /**
   * Manual save trigger
   */
  public manualSave(customName?: string): FormationSaveData | null {
    const currentData = this.getCurrentFormationData();
    if (!currentData) return null;

    return this.saveFormationVersion(currentData, false, customName);
  }

  /**
   * Cleanup on destroy
   */
  public destroy(): void {
    this.stopAutoSave();
  }
}

// Export singleton instance
export const formationManager = new FormationManagementService();

export default FormationManagementService;
export type { FormationSaveData, FormationAutoSaveOptions };