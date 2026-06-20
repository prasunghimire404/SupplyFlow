import { authService } from "@/services/auth.service";
import { create } from "zustand";

interface AuthState {
  user: any | null;
  userProfile: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: any | null) => void;
  setUserProfile: (profile: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signUp: (data: any) => Promise<void>;
  signIn: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  loadUserProfile: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: false, // <-- CHANGED: was true, now false
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  signUp: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUp(data);
      const profile = await authService.getUserProfile(user.uid);
      set({
        user,
        userProfile: profile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signIn: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(data);
      const profile = await authService.getUserProfile(user.uid);
      set({
        user,
        userProfile: profile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({
        user: null,
        userProfile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadUserProfile: async (uid) => {
    try {
      const profile = await authService.getUserProfile(uid);
      set({ userProfile: profile });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
