'use client';
import { create } from 'zustand';
import type { MarketRegime, RegimeType, User } from './types';

interface AppStore {
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;

  regime: RegimeType;
  regimeData: MarketRegime | null;
  setRegime: (r: MarketRegime) => void;

  shariaFilter: boolean;
  setShariaFilter: (v: boolean) => void;

  // Auth (Slice 3)
  user:     User | null;
  token:    string | null;
  setUser:  (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout:   () => void;
  initAuth: () => void;
}

const LS_TOKEN = 'egx_token';
const LS_USER  = 'egx_user';

export const useAppStore = create<AppStore>((set) => ({
  lang: 'ar',
  setLang: (lang) => set({ lang }),

  regime: 'SIDEWAYS',
  regimeData: null,
  setRegime: (data) => set({ regime: data.regime, regimeData: data }),

  shariaFilter: false,
  setShariaFilter: (shariaFilter) => set({ shariaFilter }),

  // Auth
  user:  null,
  token: null,

  setUser: (user) => {
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else       localStorage.removeItem(LS_USER);
    set({ user });
  },

  setToken: (token) => {
    if (token) localStorage.setItem(LS_TOKEN, token);
    else       localStorage.removeItem(LS_TOKEN);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    set({ user: null, token: null });
  },

  initAuth: () => {
    const token = localStorage.getItem(LS_TOKEN);
    const raw   = localStorage.getItem(LS_USER);
    const user  = raw ? (JSON.parse(raw) as User) : null;
    set({ token, user });
  },
}));
