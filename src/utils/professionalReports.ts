/**
 * Professional Reports Generator
 * 
 * Generate comprehensive tactical and performance reports
 * for presentations, analysis, and sharing
 */

import type { Player } from '../types';
import type { ProfessionalFormation } from '../data/professionalFormations';
import type { FormationAnalysis } from './formationAnalyzer';
import type { ChemistryAnalysis } from './playerChemistry';

export interface TacticalReport {
  title: string;
  generatedAt: string;
  formation: FormationReportSection;
  analysis: AnalysisReportSection;
  chemistry: ChemistryReportSection;
  players: PlayerReportSection[];
  recommendations: string[];
}

interface FormationReportSection {
  name: string;
  category: string;
  description: string;
  difficulty: string;
  famousTeams: string[];
}

interface AnalysisReportSection {
  overallScore: number;
  tacticalBalance: {
    defensive: number;
    attacking: number;
    possession: number;
    width: number;
    compactness: number;
  };
  strengths: Array<{ aspect: string; score: number }>;
  weaknesses: Array<{ aspect: string; severity: number; solution: string }>;
}

interface ChemistryReportSection {
  overallChemistry: number;
  teamCohesion: number;
  topConnections: Array<{ player1: string; player2: string; strength: number }>;
}

interface PlayerReportSection {
  name: string;
  position: string;
  overall: number;
  age: number;
  chemistry: number;
  suitability: number;
}

/**
 * Generate comprehensive tactical report
 */
export function generateTacticalReport(
  formation: ProfessionalFormation,
  players: Player[],
  formationAnalysis: FormationAnalysis,
  chemistryAnalysis: ChemistryAnalysis
): TacticalReport {
  return {
    title: `Tactical Report - ${formation.displayName}`,
    generatedAt: new Date().toISOString(),
    formation: {
      name: formation.displayName,
      category: formation.category,
      description: formation.description,
      difficulty: formation.difficulty,
      famousTeams: formation.famousTeams,
    },
    analysis: {
      overallScore: formationAnalysis.overallScore,
      tacticalBalance: formationAnalysis.tacticalBalance,
      strengths: formationAnalysis.strengths.map(s => ({
        aspect: s.aspect,
        score: s.score,
      })),
      weaknesses: formationAnalysis.weaknesses.map(w => ({
        aspect: w.aspect,
        severity: w.severity,
        solution: w.solution,
      })),
    },
    chemistry: {
      overallChemistry: chemistryAnalysis.overallChemistry,
      teamCohesion: chemistryAnalysis.teamCohesion,
      topConnections: chemistryAnalysis.chemistryMatrix.slice(0, 5).map(c => {
        const p1 = players.find(p => p.id === c.player1Id);
        const p2 = players.find(p => p.id === c.player2Id);
        return {
          player1: p1?.name || 'Unknown',
          player2: p2?.name || 'Unknown',
          strength: c.connectionStrength,
        };
      }),
    },
    players: players.map((player, idx) => {
      const playerChem = chemistryAnalysis.playerChemistry.find(pc => pc.playerId === player.id);
      const playerSuit = formationAnalysis.playerSuitability.find(ps => ps.playerId === player.id);
      
      return {
        name: player.name,
        position: player.roleId || 'N/A',
        overall: player.overall,
        age: player.age,
        chemistry: playerChem?.individualChemistry || 0,
        suitability: playerSuit?.suitabilityScore || 0,
      };
    }),
    recommendations: formationAnalysis.recommendations.map(r => r.description),
  };
}

/**
 * Export report as formatted text
 */
export function exportReportAsText(report: TacticalReport): string {
  return `
═══════════════════════════════════════════════════════════
  ${report.title}
═══════════════════════════════════════════════════════════

Generated: ${new Date(report.generatedAt).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATION: ${report.formation.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Category: ${report.formation.category.toUpperCase()}
Difficulty: ${report.formation.difficulty.toUpperCase()}

Description:
${report.formation.description}

Famous Teams:
${report.formation.famousTeams.map(t => `  • ${t}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TACTICAL ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Formation Score: ${report.analysis.overallScore.toFixed(1)}%

Tactical Balance:
  Defensive Strength: ${report.analysis.tacticalBalance.defensive.toFixed(0)}%
  Attacking Threat:   ${report.analysis.tacticalBalance.attacking.toFixed(0)}%
  Possession Control: ${report.analysis.tacticalBalance.possession.toFixed(0)}%
  Width Coverage:     ${report.analysis.tacticalBalance.width.toFixed(0)}%
  Team Compactness:   ${report.analysis.tacticalBalance.compactness.toFixed(0)}%

KEY STRENGTHS:
${report.analysis.strengths.map((s, i) => `  ${i+1}. ${s.aspect} (${s.score.toFixed(0)}%)`).join('\n')}

AREAS TO ADDRESS:
${report.analysis.weaknesses.map((w, i) => `  ${i+1}. ${w.aspect} (Risk: ${w.severity.toFixed(0)}%)
     → ${w.solution}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEAM CHEMISTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Team Chemistry: ${report.chemistry.overallChemistry.toFixed(1)}%
Team Cohesion: ${report.chemistry.teamCohesion.toFixed(1)}%

Top Player Connections:
${report.chemistry.topConnections.map((c, i) => 
  `  ${i+1}. ${c.player1} ↔ ${c.player2} (${c.strength.toFixed(0)}%)`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAYER ROSTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${report.players.map(p => 
  `${p.name.padEnd(20)} | ${p.position.padEnd(5)} | OVR: ${p.overall} | Age: ${p.age} | Chem: ${p.chemistry.toFixed(0)}% | Suit: ${p.suitability.toFixed(0)}%`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${report.recommendations.map((r, i) => `  ${i+1}. ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
End of Report - Generated by Astral Turf
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

/**
 * Export report as JSON
 */
export function exportReportAsJSON(report: TacticalReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Download report as text file
 */
export function downloadReport(report: TacticalReport, format: 'txt' | 'json' = 'txt'): void {
  const content = format === 'json' 
    ? exportReportAsJSON(report)
    : exportReportAsText(report);

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tactical-report-${Date.now()}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate quick summary for sharing
 */
export function generateQuickSummary(report: TacticalReport): string {
  return `
📊 Tactical Report: ${report.formation.name}

✅ Formation Score: ${report.analysis.overallScore.toFixed(0)}%
🔗 Team Chemistry: ${report.chemistry.overallChemistry.toFixed(0)}%
👥 Team Cohesion: ${report.chemistry.teamCohesion.toFixed(0)}%

Top Strength: ${report.analysis.strengths[0]?.aspect || 'N/A'}
Main Weakness: ${report.analysis.weaknesses[0]?.aspect || 'N/A'}

Generated with Astral Turf
  `.trim();
}

