import type { AuthState, Action } from '../../types';

export const authReducer = (draft: AuthState, action: Action): AuthState | void => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      draft.isAuthenticated = true;
      draft.user = action.payload;
      draft.error = null;
      // Update last login timestamp
      if (draft.user) {
        draft.user.lastLoginAt = new Date().toISOString();
      }
      break;
    case 'LOGIN_FAILURE':
      draft.isAuthenticated = false;
      draft.user = null;
      draft.error = action.payload;
      break;
    case 'LOGOUT':
      draft.isAuthenticated = false;
      draft.user = null;
      draft.error = null;
      draft.familyAssociations = [];
      break;
    case 'SIGNUP_SUCCESS':
      draft.isAuthenticated = true;
      draft.user = action.payload;
      draft.error = null;
      break;
    case 'SIGNUP_FAILURE':
      draft.isAuthenticated = false;
      draft.user = null;
      draft.error = action.payload;
      break;
    case 'UPDATE_USER_PROFILE':
      if (draft.user) {
        Object.assign(draft.user, action.payload);
      }
      break;
    case 'ADD_FAMILY_ASSOCIATION':
      draft.familyAssociations.push(action.payload);
      break;
    case 'UPDATE_FAMILY_ASSOCIATION':
      const index = draft.familyAssociations.findIndex(
        assoc => assoc.id === action.payload.id
      );
      if (index !== -1) {
        draft.familyAssociations[index] = action.payload;
      }
      break;
    case 'REMOVE_FAMILY_ASSOCIATION':
      draft.familyAssociations = draft.familyAssociations.filter(
        assoc => assoc.id !== action.payload
      );
      break;
    case 'LOAD_FAMILY_ASSOCIATIONS':
      draft.familyAssociations = action.payload;
      break;
    case 'UPDATE_NOTIFICATION_SETTINGS':
      if (draft.user) {
        draft.user.notifications = { ...draft.user.notifications, ...action.payload };
      }
      break;
    case 'REQUEST_PASSWORD_RESET':
      if (draft.user) {
        draft.user.needsPasswordReset = true;
      }
      break;
    case 'COMPLETE_PASSWORD_RESET':
      if (draft.user) {
        draft.user.needsPasswordReset = false;
      }
      break;
    case 'DEACTIVATE_ACCOUNT':
      if (draft.user) {
        draft.user.isActive = false;
      }
      break;
    case 'ACTIVATE_ACCOUNT':
      if (draft.user) {
        draft.user.isActive = true;
      }
      break;
    default:
      return;
  }
};
