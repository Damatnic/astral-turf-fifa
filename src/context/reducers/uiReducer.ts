
import type { UIState, Action } from '../../types';

export const uiReducer = (draft: UIState, action: Action): UIState | void => {
  switch (action.type) {
    case 'OPEN_MODAL':
      draft.activeModal = action.payload;
      break;
    case 'CLOSE_MODAL':
      draft.activeModal = null;
      draft.editingPlayerId = null;
      draft.playerToCompareId = null;
      draft.slotActionMenuData = null;
      draft.aiComparisonResult = null;
      draft.oppositionReport = null;
      draft.pressConferenceData = null;
      draft.aiSubSuggestionData = null;
      draft.scoutReport = null;
      draft.playerConversationData = null;
      draft.developmentSummary = null;
      break;
    case 'SET_EDITING_PLAYER_ID':
        draft.editingPlayerId = action.payload;
        break;
    case 'SET_COMPARE_PLAYER_ID':
        draft.playerToCompareId = action.payload;
        break;
    case 'SELECT_PLAYER':
      if (draft.isPresentationMode) return;
      if (draft.drawingTool !== 'select' && !draft.isAnimating) {
        draft.drawingTool = 'select';
      }
      if (draft.isAnimating) return;
      draft.selectedPlayerId = action.payload;
      draft.highlightedByAIPlayerIds = [];
      break;
    case 'OPEN_SLOT_ACTION_MENU':
        if (draft.isPresentationMode) return;
        draft.activeModal = 'slotActionMenu';
        draft.slotActionMenuData = action.payload;
        break;
    case 'CLOSE_SLOT_ACTION_MENU':
        if (draft.activeModal === 'slotActionMenu') {
            draft.activeModal = null;
            draft.slotActionMenuData = null;
        }
        break;
    case 'TOGGLE_THEME':
        draft.theme = draft.theme === 'dark' ? 'light' : 'dark';
        break;
    case 'ADD_NOTIFICATION':
        draft.notifications.push({ ...action.payload, id: `notif_${Date.now()}` });
        break;
    case 'REMOVE_NOTIFICATION':
        draft.notifications = draft.notifications.filter(n => n.id !== action.payload);
        break;
    case 'SET_DRAWING_TOOL':
      draft.drawingTool = action.payload;
      draft.selectedPlayerId = null;
      break;
    case 'SET_DRAWING_COLOR':
      draft.drawingColor = action.payload;
      break;
    case 'SET_POSITIONING_MODE':
      draft.positioningMode = action.payload;
      break;
    case 'TOGGLE_GRID_VISIBILITY':
      draft.isGridVisible = !draft.isGridVisible;
      break;
    case 'TOGGLE_FORMATION_STRENGTH_VISIBILITY':
      draft.isFormationStrengthVisible = !draft.isFormationStrengthVisible;
      break;
    case 'SET_ACTIVE_STEP': {
        if (action.payload === draft.activeStepIndex) return;
        draft.isAnimating = false;
        draft.animationTrails = null;
        draft.playerInitialPositions = null;
        draft.activeStepIndex = action.payload;
        break;
    }
    case 'START_ANIMATION': {
        draft.isAnimating = true;
        draft.isPaused = false;
        draft.selectedPlayerId = null;
        draft.drawingTool = 'select';
        // Payload for trails and positions are now handled in rootReducer
        break;
    }
    case 'PAUSE_ANIMATION':
        draft.isPaused = true;
        break;
    case 'RESET_ANIMATION':
        draft.isAnimating = false;
        draft.isPaused = false;
        draft.playerInitialPositions = null;
        draft.animationTrails = null;
        if(draft.activePlaybookItemId) {
            draft.activeStepIndex = 0;
        }
        break;
    case 'GENERATE_AI_INSIGHT_START': draft.isLoadingAI = true; draft.aiInsight = null; break;
    case 'GENERATE_AI_INSIGHT_SUCCESS': draft.isLoadingAI = false; draft.aiInsight = action.payload; break;
    case 'GENERATE_AI_INSIGHT_FAILURE': draft.isLoadingAI = false; break;

    case 'GENERATE_AI_COMPARISON_START': draft.isComparingAI = true; draft.aiComparisonResult = null; break;
    case 'GENERATE_AI_COMPARISON_SUCCESS': draft.isComparingAI = false; draft.aiComparisonResult = action.payload; break;
    case 'GENERATE_AI_COMPARISON_FAILURE': draft.isComparingAI = false; break;

    case 'SUGGEST_FORMATION_START': draft.isSuggestingFormation = true; draft.aiSuggestedFormation = null; break;
    case 'SUGGEST_FORMATION_SUCCESS': draft.isSuggestingFormation = false; draft.aiSuggestedFormation = action.payload; break;
    case 'SUGGEST_FORMATION_FAILURE': draft.isSuggestingFormation = false; break;

    case 'SEND_CHAT_MESSAGE_START': draft.isChatProcessing = true; draft.chatHistory.push(action.payload); draft.highlightedByAIPlayerIds = []; break;
    case 'SEND_CHAT_MESSAGE_SUCCESS':
        draft.isChatProcessing = false;
        draft.chatHistory.push(action.payload.response);
        draft.highlightedByAIPlayerIds = [...action.payload.playerIdsToHighlight];
        break;
    case 'SEND_CHAT_MESSAGE_FAILURE': draft.isChatProcessing = false; draft.chatHistory.push({ id: 'error', sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }); break;
    
    case 'GENERATE_OPPOSITION_REPORT_START':
        draft.isLoadingOppositionReport = true;
        draft.oppositionReport = null;
        break;
    case 'GENERATE_OPPOSITION_REPORT_SUCCESS':
        draft.isLoadingOppositionReport = false;
        draft.oppositionReport = action.payload;
        break;
    case 'GENERATE_OPPOSITION_REPORT_FAILURE':
        draft.isLoadingOppositionReport = false;
        draft.oppositionReport = null;
        break;

    case 'LOAD_PLAYBOOK_ITEM': {
      draft.activePlaybookItemId = action.payload;
      draft.activeStepIndex = 0;
      draft.isAnimating = false;
      draft.animationTrails = null;
      draft.playerInitialPositions = null;
      break;
    }
    case 'SET_ACTIVE_TEAM_CONTEXT':
        draft.activeTeamContext = action.payload;
        break;
    
    case 'TOGGLE_PLAYBOOK_CATEGORY':
        draft.playbookCategories[action.payload] = !draft.playbookCategories[action.payload];
        break;
        
    case 'SET_AI_PERSONALITY':
        draft.settings.aiPersonality = action.payload;
        break;
        
    case 'START_PLAYER_CONVERSATION':
        draft.activeModal = 'playerConversation';
        draft.playerConversationData = { playerId: action.payload.playerId };
        break;

    case 'START_TUTORIAL': draft.tutorial.isActive = true; draft.tutorial.step = 0; break;
    case 'END_TUTORIAL': draft.tutorial.isActive = false; break;
    case 'SET_TUTORIAL_STEP': draft.tutorial.step = action.payload; break;
    
    case 'GET_AI_DEVELOPMENT_SUMMARY_START': draft.isLoadingDevelopmentSummary = true; draft.developmentSummary = null; break;
    case 'GET_AI_DEVELOPMENT_SUMMARY_SUCCESS': draft.isLoadingDevelopmentSummary = false; draft.developmentSummary = action.payload; break;
    case 'GET_AI_DEVELOPMENT_SUMMARY_FAILURE': draft.isLoadingDevelopmentSummary = false; break;
    
    case 'SIMULATE_MATCH_UPDATE':
      draft.simulationTimeline.push(action.payload);
      break;

    case 'GET_TEAM_TALK_OPTIONS_START': draft.isLoadingTeamTalk = true; draft.teamTalkData = null; break;
    case 'GET_TEAM_TALK_OPTIONS_SUCCESS': draft.isLoadingTeamTalk = false; draft.teamTalkData = action.payload; break;
    case 'GET_TEAM_TALK_OPTIONS_FAILURE': draft.isLoadingTeamTalk = false; break;

    default:
      return;
  }
};
