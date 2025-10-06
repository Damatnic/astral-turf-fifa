import type {
  FranchiseState,
  Action,
  NewsItem,
  InboxItem,
  TrainingPlanTemplate,
  SponsorshipDeal,
  SkillChallenge,
} from '../../types';

// Helper function to add an inbox item
const addInboxItem = (
  draft: FranchiseState,
  type: InboxItem['type'],
  title: string,
  content: string,
  payload?: InboxItem['payload']
) => {
  draft.inbox.unshift({
    id: `inbox_${Date.now()}_${Math.random()}`,
    week: draft.gameWeek,
    type,
    title,
    content,
    isRead: false,
    payload,
  });
};

export const franchiseReducer = (draft: FranchiseState, action: Action): FranchiseState | void => {
  switch (action.type) {
    case 'ADVANCE_WEEK': {
      // This action is now handled in the rootReducer to access other state slices.
      break;
    }

    case 'ADVANCE_SEASON': {
      draft.season.year++;
      draft.matchHistory = [];
      Object.values(draft.season.leagueTable).forEach(entry => {
        entry.played = 0;
        entry.won = 0;
        entry.drawn = 0;
        entry.lost = 0;
        entry.goalsFor = 0;
        entry.goalsAgainst = 0;
        entry.goalDifference = 0;
        entry.points = 0;
      });
      draft.gameWeek = 1;
      addInboxItem(
        draft,
        'objective',
        `New Season: ${draft.season.year}`,
        'A new season has begun. Check your board objectives and prepare your squad!'
      );
      break;
    }
    case 'ADD_INBOX_ITEM':
      if (
        action.payload &&
        typeof action.payload === 'object' &&
        'type' in action.payload &&
        'title' in action.payload &&
        'content' in action.payload
      ) {
        addInboxItem(
          draft,
          action.payload.type as InboxItem['type'],
          action.payload.title as string,
          action.payload.content as string,
          'payload' in action.payload ? (action.payload.payload as InboxItem['payload']) : undefined
        );
      }
      break;

    case 'MARK_INBOX_ITEM_READ': {
      const item = draft.inbox.find(i => i.id === action.payload);
      if (item) {
        item.isRead = true;
      }
      break;
    }

    case 'REMOVE_INBOX_ITEM': {
      draft.inbox = draft.inbox.filter(i => i.id !== action.payload);
      break;
    }

    case 'HIRE_STAFF': {
      const staff = action.payload.staff as { name: string; cost: number };
      const cost = staff.cost;
      if (draft.finances[action.payload.team].transferBudget >= cost) {
        draft.finances[action.payload.team].transferBudget -= cost;
        const staffObj = draft.staff[action.payload.team] as unknown as Record<string, unknown>;
        staffObj[action.payload.type] = staff;
        addInboxItem(
          draft,
          'finance',
          `New Staff Hired`,
          `${staff.name} has been hired as the new ${action.payload.type}.`
        );
      } else {
        addInboxItem(
          draft,
          'finance',
          `Hiring Failed`,
          `Insufficient funds to hire ${staff.name}.`
        );
      }
      break;
    }

    case 'UPGRADE_STADIUM_FACILITY': {
      const { facility, team } = action.payload;
      const stadium = draft.stadium[team] as unknown as Record<string, number>;
      const upgradeCost =
        stadium[facility] * (facility === 'trainingFacilitiesLevel' ? 5000000 : 3000000);
      if (draft.finances[team].transferBudget >= upgradeCost) {
        draft.finances[team].transferBudget -= upgradeCost;
        stadium[facility]++;
        addInboxItem(
          draft,
          'finance',
          `${facility} Upgraded`,
          `The ${facility} has been upgraded to level ${stadium[facility]}.`
        );
      }
      break;
    }

    case 'SET_SPONSORSHIP_DEAL': {
      const { deal, team } = action.payload;
      const sponsorDeal = deal as { name: string; weeklyIncome: number };
      draft.sponsorships[team] = sponsorDeal as SponsorshipDeal;
      draft.finances[team].income.sponsorship = sponsorDeal.weeklyIncome;
      addInboxItem(
        draft,
        'finance',
        `New Sponsorship Deal`,
        `A new deal has been signed with ${sponsorDeal.name}.`
      );
      break;
    }

    case 'SET_SESSION_DRILL': {
      const { team, day, session, sessionPart, drillId } = action.payload;
      const schedule = draft.trainingSchedule[team] as unknown as Record<
        string,
        {
          isRestDay: boolean;
          morning: Record<string, string | null>;
          afternoon: Record<string, string | null>;
        }
      >;
      const daySchedule = schedule[day];
      const sessionSchedule = (
        session === 'morning' ? daySchedule.morning : daySchedule.afternoon
      ) as Record<string, string | null>;
      sessionSchedule[sessionPart] = drillId;
      if (drillId) {
        daySchedule.isRestDay = false;
      }
      break;
    }
    case 'SET_DAY_AS_REST': {
      const { team, day } = action.payload;
      const schedule = draft.trainingSchedule[team] as unknown as Record<
        string,
        {
          isRestDay: boolean;
          morning: { warmup: string | null; main: string | null; cooldown: string | null };
          afternoon: { warmup: string | null; main: string | null; cooldown: string | null };
        }
      >;
      schedule[day].isRestDay = true;
      schedule[day].morning = { warmup: null, main: null, cooldown: null };
      schedule[day].afternoon = { warmup: null, main: null, cooldown: null };
      break;
    }
    case 'SET_DAY_AS_TRAINING': {
      const { team, day } = action.payload;
      const schedule = draft.trainingSchedule[team] as unknown as Record<
        string,
        { isRestDay: boolean }
      >;
      schedule[day].isRestDay = false;
      break;
    }

    case 'SAVE_TRAINING_TEMPLATE': {
      const { team, name } = action.payload;
      const id = `template_${Date.now()}`;
      const newTemplate: TrainingPlanTemplate = {
        id,
        name,
        schedule: draft.trainingSchedule[team],
        isDefault: false,
      };
      draft.trainingPlanTemplates[id] = newTemplate;
      break;
    }

    case 'LOAD_TRAINING_TEMPLATE': {
      const { team, templateId } = action.payload;
      const template = draft.trainingPlanTemplates[templateId];
      if (template) {
        draft.trainingSchedule[team] = template.schedule;
      }
      break;
    }

    case 'DELETE_TRAINING_TEMPLATE': {
      const template = draft.trainingPlanTemplates[action.payload.templateId];
      if (template && !template.isDefault) {
        delete draft.trainingPlanTemplates[action.payload.templateId];
      }
      break;
    }

    case 'ADD_SKILL_CHALLENGE': {
      if (action.payload && typeof action.payload === 'object') {
        const newChallenge = {
          id: `challenge_${Date.now()}`,
          ...(action.payload as object),
        } as SkillChallenge;
        draft.skillChallenges.push(newChallenge);
      }
      break;
    }

    case 'REMOVE_SKILL_CHALLENGE': {
      draft.skillChallenges = draft.skillChallenges.filter(sc => sc.id !== action.payload);
      break;
    }

    case 'ADD_NEWS_ITEM': {
      if (action.payload && typeof action.payload === 'object') {
        draft.newsFeed.unshift({
          id: `news_${Date.now()}_${Math.random()}`,
          date: new Date().toISOString(),
          ...(action.payload as object),
        } as NewsItem);
      }
      break;
    }

    case 'START_NEGOTIATION': {
      const player = draft.transferMarket.forSale.find(p => p.id === action.payload.playerId);
      if (player) {
        draft.negotiationData = {
          playerId: player.id,
          conversation: [
            `Agent: "So, we're here to discuss ${player.name}'s future. What do you have in mind?"`,
          ],
          agentPersonality: 'standard', // Could be randomized later
        };
      }
      break;
    }

    case 'SEND_NEGOTIATION_OFFER_START':
      draft.negotiationData?.conversation.push(`You: ${action.payload.offerText}`);
      break;

    case 'SEND_NEGOTIATION_OFFER_SUCCESS':
      draft.negotiationData?.conversation.push(`Agent: "${action.payload.response.response}"`);
      break;

    case 'END_NEGOTIATION':
      draft.negotiationData = null;
      break;

    case 'CREATE_MENTORING_GROUP': {
      const { team, mentorId, menteeIds } = action.payload;
      draft.mentoringGroups[team].push({ mentorId, menteeIds });

      // Form friendships
      menteeIds.forEach(menteeId => {
        if (!draft.relationships[mentorId]) {
          draft.relationships[mentorId] = {};
        }
        if (!draft.relationships[menteeId]) {
          draft.relationships[menteeId] = {};
        }
        draft.relationships[mentorId][menteeId] = 'friendship';
        draft.relationships[menteeId][mentorId] = 'friendship';
      });
      addInboxItem(
        draft,
        'mentoring',
        'New Mentoring Group',
        'A new mentoring group has been established.'
      );
      break;
    }

    case 'DISSOLVE_MENTORING_GROUP': {
      const { team, mentorId } = action.payload;
      const group = draft.mentoringGroups[team].find(g => g.mentorId === mentorId);
      if (group) {
        group.menteeIds.forEach(menteeId => {
          if (draft.relationships[mentorId]?.[menteeId] === 'friendship') {
            delete draft.relationships[mentorId][menteeId];
          }
          if (draft.relationships[menteeId]?.[mentorId] === 'friendship') {
            delete draft.relationships[menteeId][mentorId];
          }
        });
      }
      draft.mentoringGroups[team] = draft.mentoringGroups[team].filter(
        g => g.mentorId !== mentorId
      );
      addInboxItem(
        draft,
        'mentoring',
        'Mentoring Group Dissolved',
        'A mentoring group has been dissolved.'
      );
      break;
    }

    default:
      return;
  }
};
