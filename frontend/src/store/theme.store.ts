import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'light' | 'blue' | 'dark';

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  // Sidebar
  sidebarBg: string;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarActive: string;
  sidebarActiveBg: string;
  sidebarBorder: string;
  sidebarLogoBg: string;
  sidebarUserBg: string;
  // Main
  mainBg: string;
  // Cards / surfaces
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accent
  accent: string;
  accentLight: string;
  accentText: string;
  // Inputs
  inputBorder: string;
  inputBorderFocus: string;
  inputBg: string;
  // Table
  tableHeaderBg: string;
  tableRowHover: string;
  tableBorder: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  light: {
    id: 'light',
    label: 'Claro',
    emoji: '☀️',
    sidebarBg: '#ffffff',
    sidebarText: '#1e293b',
    sidebarTextMuted: '#64748b',
    sidebarActive: '#1e293b',
    sidebarActiveBg: '#f1f5f9',
    sidebarBorder: '#e2e8f0',
    sidebarLogoBg: '#f1f5f9',
    sidebarUserBg: '#f8fafc',
    mainBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardShadow: '0 1px 3px rgba(0,0,0,0.07)',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#94a3b8',
    accent: '#2563eb',
    accentLight: '#eff6ff',
    accentText: '#2563eb',
    inputBorder: '#d1d5db',
    inputBorderFocus: '#2563eb',
    inputBg: '#ffffff',
    tableHeaderBg: '#f8fafc',
    tableRowHover: '#f1f5f9',
    tableBorder: '#f1f5f9',
  },
  blue: {
    id: 'blue',
    label: 'Azul',
    emoji: '🌊',
    sidebarBg: '#1e3a5f',
    sidebarText: '#ffffff',
    sidebarTextMuted: 'rgba(255,255,255,0.55)',
    sidebarActive: '#ffffff',
    sidebarActiveBg: 'rgba(255,255,255,0.14)',
    sidebarBorder: 'rgba(255,255,255,0.1)',
    sidebarLogoBg: 'rgba(255,255,255,0.15)',
    sidebarUserBg: 'rgba(255,255,255,0.08)',
    mainBg: '#f0f4f8',
    cardBg: '#ffffff',
    cardBorder: '#dbe5ef',
    cardShadow: '0 1px 4px rgba(30,58,95,0.08)',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#94a3b8',
    accent: '#1e3a5f',
    accentLight: '#e8f0f9',
    accentText: '#1e3a5f',
    inputBorder: '#c8d8e8',
    inputBorderFocus: '#1e3a5f',
    inputBg: '#ffffff',
    tableHeaderBg: '#f5f8fb',
    tableRowHover: '#eef3f8',
    tableBorder: '#edf2f7',
  },
  dark: {
    id: 'dark',
    label: 'Oscuro',
    emoji: '🌙',
    sidebarBg: '#0f172a',
    sidebarText: '#f1f5f9',
    sidebarTextMuted: 'rgba(241,245,249,0.45)',
    sidebarActive: '#f1f5f9',
    sidebarActiveBg: 'rgba(241,245,249,0.1)',
    sidebarBorder: 'rgba(241,245,249,0.08)',
    sidebarLogoBg: 'rgba(241,245,249,0.1)',
    sidebarUserBg: 'rgba(241,245,249,0.06)',
    mainBg: '#0f172a',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    cardShadow: '0 1px 4px rgba(0,0,0,0.3)',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    accent: '#38bdf8',
    accentLight: 'rgba(56,189,248,0.1)',
    accentText: '#38bdf8',
    inputBorder: '#334155',
    inputBorderFocus: '#38bdf8',
    inputBg: '#1e293b',
    tableHeaderBg: '#162032',
    tableRowHover: '#243347',
    tableBorder: '#263348',
  },
};

interface ThemeState {
  themeId: ThemeId;
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'light',
      theme: THEMES.light,
      setTheme: (id) => set({ themeId: id, theme: THEMES[id] }),
    }),
    { name: 'contaapp-theme' },
  ),
);
