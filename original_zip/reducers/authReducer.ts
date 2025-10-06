import type { AuthState, Action } from '../../types';

export const authReducer = (draft: AuthState, action: Action): AuthState | void => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      draft.isAuthenticated = true;
      draft.user = action.payload;
      draft.error = null;
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
    default:
      return;
  }
};
