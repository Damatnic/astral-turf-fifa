/**
 * AI Training Intelligence Integration Example
 * 
 * This file demonstrates how to integrate the AI Training Optimization Intelligence System
 * into your TrainingPage component or any other part of the application.
 */

import { AITrainingIntelligence } from '../services/aiTrainingIntelligence';
import type {
  AITrainingSimulationResult,
  PlayerDevelopmentPlan,
  TacticalPatternRecognition,
  AutomatedSuggestion,
  TeamTrainingAnalysis,
} from '../services/aiTrainingIntelligence';
import type { Player, TrainingDrill, Formation, WeeklySchedule } from '../types';

// ==================== EXAMPLE 1: SIMULATE TRAINING SESSION ====================

export function simulateTrainingExample(
  player: Player,
  scheduledDrills: TrainingDrill[],
  coachQuality = 75,
  facilityLevel = 3,
) {
  // Simulate training for a single player
  const result: AITrainingSimulationResult = AITrainingIntelligence.simulatePlayerTraining(
    player,
    scheduledDrills,
    coachQuality,
    facilityLevel,
  );

  console.log('=== Training Simulation Results ===');
  console.log(`Player: ${result.playerName}`);
  console.log(`Performance Rating: ${result.performanceRating}/100`);
  console.log(`\nAttribute Changes:`);
  console.log(`  Pace: +${result.attributeChanges.pace.toFixed(2)}`);
  console.log(`  Shooting: +${result.attributeChanges.shooting.toFixed(2)}`);
  console.log(`  Passing: +${result.attributeChanges.passing.toFixed(2)}`);
  console.log(`  Dribbling: +${result.attributeChanges.dribbling.toFixed(2)}`);
  console.log(`  Defending: +${result.attributeChanges.defending.toFixed(2)}`);
  console.log(`  Physical: +${result.attributeChanges.physical.toFixed(2)}`);
  console.log(`\nFatigue: +${result.fatigueChange.toFixed(1)}`);
  console.log(`Morale: ${result.moraleChange > 0 ? '+' : ''}${result.moraleChange.toFixed(1)}`);

  if (result.injuryOccurred && result.injuryDetails) {
    console.log(`\n⚠️ INJURY OCCURRED: ${result.injuryDetails.type}`);
    console.log(`  Recovery Time: ${result.injuryDetails.estimatedRecovery} days`);
    console.log(`  Affected: ${result.injuryDetails.affectedAttribute}`);
  }

  console.log(`\nInsights:`);
  result.insights.forEach(insight => console.log(`  ${insight}`));

  return result;
}

// ==================== EXAMPLE 2: GENERATE DEVELOPMENT PLAN ====================

export function generateDevelopmentPlanExample(
  player: Player,
  targetRole?: string,
  weeks = 12,
) {
  const plan: PlayerDevelopmentPlan = AITrainingIntelligence.generateDevelopmentPlan(
    player,
    targetRole,
    weeks,
  );

  console.log('\n=== Player Development Plan ===');
  console.log(`Player: ${plan.playerName} (Age ${plan.age})`);
  console.log(`Current Rating: ${plan.currentRating}`);
  console.log(`Potential: ${plan.potentialRating}`);
  console.log(`Development Stage: ${plan.developmentStage}`);
  console.log(`Priority: ${plan.priority.toUpperCase()}`);

  console.log(`\nRole Recommendation:`);
  console.log(`  Primary: ${plan.roleRecommendation.primary}`);
  console.log(`  Alternative: ${plan.roleRecommendation.alternative.join(', ')}`);
  console.log(`  Reasoning: ${plan.roleRecommendation.reasoning}`);

  console.log(`\nTop 3 Strengths:`);
  plan.strengths.slice(0, 3).forEach(strength => {
    console.log(`  ${strength.attribute}: ${strength.value} (${strength.rating})`);
  });

  console.log(`\nTop 3 Weaknesses:`);
  plan.weaknesses.slice(0, 3).forEach(weakness => {
    console.log(`  ${weakness.attribute}: ${weakness.value} (gap: ${weakness.gap.toFixed(1)})`);
  });

  console.log(`\n${weeks}-Week Projection:`);
  console.log(`  Estimated Overall Gain: +${plan.twelveWeekProjection.estimatedOverallGain.toFixed(1)}`);
  console.log(`  Time to Reach Potential: ${plan.estimatedTimeToReachPotential}`);

  console.log(`\nMilestones:`);
  plan.twelveWeekProjection.milestones.forEach(milestone => {
    console.log(`  Week ${milestone.week}: ${milestone.target} - ${milestone.description}`);
  });

  console.log(`\nRecommendations:`);
  plan.recommendations.forEach(rec => console.log(`  ${rec}`));

  if (plan.riskFactors.length > 0) {
    console.log(`\n⚠️ Risk Factors:`);
    plan.riskFactors.forEach(risk => console.log(`  ${risk}`));
  }

  return plan;
}

// ==================== EXAMPLE 3: ANALYZE TACTICAL PATTERNS ====================

export function analyzeTacticalPatternsExample(
  formation: Formation,
  players: Player[],
) {
  const analysis: TacticalPatternRecognition = AITrainingIntelligence.analyzeTacticalPatterns(
    formation,
    players,
  );

  console.log('\n=== Tactical Pattern Analysis ===');
  console.log(`Formation: ${analysis.formationName}`);

  console.log(`\nCommon Patterns:`);
  analysis.commonPatterns.forEach(pattern => {
    console.log(`  ${pattern.pattern} (${pattern.effectiveness}% effective)`);
    console.log(`    ${pattern.description}`);
  });

  if (analysis.tacticalStrengths.length > 0) {
    console.log(`\n✓ Tactical Strengths:`);
    analysis.tacticalStrengths.forEach(strength => console.log(`  ${strength}`));
  }

  if (analysis.tacticalWeaknesses.length > 0) {
    console.log(`\n⚠️ Tactical Weaknesses:`);
    analysis.tacticalWeaknesses.forEach(weakness => console.log(`  ${weakness}`));
  }

  console.log(`\nCounter Formations:`);
  console.log(`  ${analysis.counterFormations.join(', ')}`);

  console.log(`\nRecommendations:`);
  analysis.recommendations.forEach(rec => console.log(`  ${rec}`));

  console.log(`\nPlayer Movement Patterns (Sample):`);
  analysis.playerMovementPatterns.slice(0, 3).forEach(pattern => {
    console.log(`  ${pattern.playerName} (${pattern.role}):`);
    console.log(`    Movement: ${pattern.movementType}`);
    console.log(`    Zones: ${pattern.heatmapZones.join(', ')}`);
    console.log(`    Links with: ${pattern.interactionPartners.join(', ')}`);
  });

  return analysis;
}

// ==================== EXAMPLE 4: GENERATE AUTOMATED SUGGESTIONS ====================

export function generateAutomatedSuggestionsExample(
  players: Player[],
  schedule: WeeklySchedule,
  formation: Formation,
  coachQuality = 75,
) {
  // Get all types of suggestions
  const trainingSuggestions = AITrainingIntelligence.generateTrainingSuggestions(
    players,
    schedule,
    coachQuality,
  );

  const formationSuggestions = AITrainingIntelligence.generateFormationSuggestions(
    formation,
    players,
  );

  const developmentSuggestions = AITrainingIntelligence.generateDevelopmentSuggestions(
    players,
  );

  // Combine and sort by priority
  const allSuggestions: AutomatedSuggestion[] = [
    ...trainingSuggestions,
    ...formationSuggestions,
    ...developmentSuggestions,
  ].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  console.log('\n=== Automated Suggestions ===');
  console.log(`Total Suggestions: ${allSuggestions.length}`);

  allSuggestions.forEach((suggestion, index) => {
    console.log(`\n[${index + 1}] ${suggestion.title}`);
    console.log(`Type: ${suggestion.type} | Priority: ${suggestion.priority.toUpperCase()}`);
    console.log(`Confidence: ${suggestion.confidence}%`);
    console.log(`\nDescription: ${suggestion.description}`);
    console.log(`Reasoning: ${suggestion.reasoning}`);
    console.log(`Expected Benefit: ${suggestion.expectedBenefit}`);

    console.log(`\nAction Items:`);
    suggestion.actionItems.forEach(action => console.log(`  • ${action}`));

    console.log(`\nEstimated Impact:`);
    console.log(`  Performance: ${suggestion.estimatedImpact.performance > 0 ? '+' : ''}${suggestion.estimatedImpact.performance}`);
    console.log(`  Morale: ${suggestion.estimatedImpact.morale > 0 ? '+' : ''}${suggestion.estimatedImpact.morale}`);
    console.log(`  Fitness: ${suggestion.estimatedImpact.fitness > 0 ? '+' : ''}${suggestion.estimatedImpact.fitness}`);

    console.log(`\nImplementation: ${suggestion.suggestedImplementation}`);

    if (suggestion.affectedPlayers.length <= 5) {
      console.log(`Affected Players: ${suggestion.affectedPlayers.join(', ')}`);
    } else {
      console.log(`Affected Players: ${suggestion.affectedPlayers.length} players`);
    }
  });

  return allSuggestions;
}

// ==================== EXAMPLE 5: ANALYZE TEAM TRAINING STATUS ====================

export function analyzeTeamTrainingExample(
  players: Player[],
  schedule: WeeklySchedule,
) {
  const analysis: TeamTrainingAnalysis = AITrainingIntelligence.analyzeTeam(
    players,
    schedule,
  );

  console.log('\n=== Team Training Analysis ===');
  console.log(`Team: ${analysis.teamId}`);

  console.log(`\nTeam Metrics:`);
  console.log(`  Overall Fitness: ${analysis.overallFitness.toFixed(1)}%`);
  console.log(`  Overall Morale: ${analysis.overallMorale.toFixed(1)}/100`);
  console.log(`  Injury Risk: ${analysis.injuryRisk.toFixed(1)}%`);
  console.log(`  Fatigue Level: ${analysis.fatiguLevel.toFixed(1)}%`);
  console.log(`  Development Progress: ${analysis.developmentProgress.toFixed(1)}%`);

  if (analysis.teamStrengths.length > 0) {
    console.log(`\n✓ Team Strengths:`);
    analysis.teamStrengths.forEach(strength => console.log(`  ${strength}`));
  }

  if (analysis.teamWeaknesses.length > 0) {
    console.log(`\n⚠️ Team Weaknesses:`);
    analysis.teamWeaknesses.forEach(weakness => console.log(`  ${weakness}`));
  }

  console.log(`\nRecommended Intensity Levels:`);
  console.log(`  Monday: ${analysis.recommendedIntensity.monday.toUpperCase()}`);
  console.log(`  Tuesday: ${analysis.recommendedIntensity.tuesday.toUpperCase()}`);
  console.log(`  Wednesday: ${analysis.recommendedIntensity.wednesday.toUpperCase()}`);
  console.log(`  Thursday: ${analysis.recommendedIntensity.thursday.toUpperCase()}`);
  console.log(`  Friday: ${analysis.recommendedIntensity.friday.toUpperCase()}`);
  console.log(`  Saturday: ${analysis.recommendedIntensity.saturday.toUpperCase()}`);
  console.log(`  Sunday: ${analysis.recommendedIntensity.sunday.toUpperCase()}`);

  console.log(`\nSuggested Training Focus:`);
  analysis.suggestedFocus.forEach(focus => {
    console.log(`  ${focus.day.toUpperCase()}: ${focus.focus}`);
    console.log(`    ${focus.reasoning}`);
  });

  return analysis;
}

// ==================== REACT COMPONENT INTEGRATION EXAMPLE ====================

/**
 * Example React component integration
 */
export const AITrainingPanel = ({ players, formation, schedule, coachQuality }: {
  players: Player[];
  formation: Formation;
  schedule: WeeklySchedule;
  coachQuality: number;
}) => {
  const [suggestions, setSuggestions] = React.useState<AutomatedSuggestion[]>([]);
  const [teamAnalysis, setTeamAnalysis] = React.useState<TeamTrainingAnalysis | null>(null);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [developmentPlan, setDevelopmentPlan] = React.useState<PlayerDevelopmentPlan | null>(null);

  // Load suggestions on mount
  React.useEffect(() => {
    const loadSuggestions = () => {
      const training = AITrainingIntelligence.generateTrainingSuggestions(
        players,
        schedule,
        coachQuality,
      );
      const formations = AITrainingIntelligence.generateFormationSuggestions(
        formation,
        players,
      );
      const development = AITrainingIntelligence.generateDevelopmentSuggestions(players);

      const all = [...training, ...formations, ...development].sort((a, b) => {
        const priority = { critical: 0, high: 1, medium: 2, low: 3 };
        return priority[a.priority] - priority[b.priority];
      });

      setSuggestions(all);
    };

    loadSuggestions();
  }, [players, schedule, formation, coachQuality]);

  // Load team analysis
  React.useEffect(() => {
    const analysis = AITrainingIntelligence.analyzeTeam(players, schedule);
    setTeamAnalysis(analysis);
  }, [players, schedule]);

  // Generate development plan for selected player
  const handleGeneratePlan = (player: Player) => {
    setSelectedPlayer(player);
    const plan = AITrainingIntelligence.generateDevelopmentPlan(player);
    setDevelopmentPlan(plan);
  };

  return (
    <div className="ai-training-panel">
      {/* Team Analysis Section */}
      {teamAnalysis && (
        <div className="team-analysis">
          <h2>Team Training Status</h2>
          <div className="metrics">
            <div>Fitness: {teamAnalysis.overallFitness.toFixed(1)}%</div>
            <div>Morale: {teamAnalysis.overallMorale.toFixed(1)}/100</div>
            <div>Injury Risk: {teamAnalysis.injuryRisk.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      <div className="suggestions">
        <h2>AI Suggestions ({suggestions.length})</h2>
        {suggestions.map(suggestion => (
          <div key={suggestion.id} className={`suggestion priority-${suggestion.priority}`}>
            <h3>{suggestion.title}</h3>
            <p>{suggestion.description}</p>
            <div className="confidence">Confidence: {suggestion.confidence}%</div>
            <ul>
              {suggestion.actionItems.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Development Plan Section */}
      {developmentPlan && (
        <div className="development-plan">
          <h2>Development Plan: {developmentPlan.playerName}</h2>
          <p>Priority: {developmentPlan.priority}</p>
          <p>Time to Potential: {developmentPlan.estimatedTimeToReachPotential}</p>
          {/* Add more plan details */}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN DEMO FUNCTION ====================

export function runFullAITrainingDemo(
  players: Player[],
  formation: Formation,
  schedule: WeeklySchedule,
  drills: TrainingDrill[],
) {
  console.log('🚀 AI TRAINING OPTIMIZATION INTELLIGENCE SYSTEM DEMO\n');
  console.log('=' .repeat(70));

  // 1. Simulate training for first player
  if (players.length > 0) {
    simulateTrainingExample(players[0], drills, 85, 4);
  }

  console.log('\n' + '='.repeat(70));

  // 2. Generate development plan for first player
  if (players.length > 0) {
    generateDevelopmentPlanExample(players[0]);
  }

  console.log('\n' + '='.repeat(70));

  // 3. Analyze tactical patterns
  analyzeTacticalPatternsExample(formation, players);

  console.log('\n' + '='.repeat(70));

  // 4. Generate automated suggestions
  generateAutomatedSuggestionsExample(players, schedule, formation);

  console.log('\n' + '='.repeat(70));

  // 5. Analyze team training status
  analyzeTeamTrainingExample(players, schedule);

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Demo Complete! All AI Training Intelligence features demonstrated.\n');
}
