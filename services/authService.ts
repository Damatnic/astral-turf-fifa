import { User } from '../types';
import { DEMO_USERS } from '../constants';

const FAKE_USERS: User[] = [...DEMO_USERS];

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = FAKE_USERS.find(u => u.email === email);
        if (user && password === 'password123') { // Using a mock password
          localStorage.setItem('authUser', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500);
    });
  },

  signup: async (email: string, password: string, role: 'coach' | 'player'): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (FAKE_USERS.some(u => u.email === email)) {
          reject(new Error('User with this email already exists'));
          return;
        }
        const newUser: User = {
          id: `user_${Date.now()}`,
          email,
          role,
        };
        FAKE_USERS.push(newUser);
        localStorage.setItem('authUser', JSON.stringify(newUser));
        resolve(newUser);
      }, 500);
    });
  },

  logout: (): void => {
    localStorage.removeItem('authUser');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('authUser');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};
