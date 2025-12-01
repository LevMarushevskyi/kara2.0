import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type GridColorTheme = 'green' | 'blue' | 'white' | 'dark';
export type ViewMode = 'normal' | 'transparency';

interface Settings {
  themeMode: ThemeMode;
  gridColorTheme: GridColorTheme;
  viewMode: ViewMode;
}

const SETTINGS_KEY = 'kara-settings';

const defaultSettings: Settings = {
  themeMode: 'system',
  gridColorTheme: 'green',
  viewMode: 'normal',
};

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return defaultSettings;
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const initial = loadSettings();
    return initial.themeMode === 'system' ? getSystemTheme() : initial.themeMode;
  });

  // Apply theme to document
  useEffect(() => {
    const theme = settings.themeMode === 'system' ? getSystemTheme() : settings.themeMode;
    setResolvedTheme(theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.themeMode]);

  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const setThemeMode = useCallback((themeMode: ThemeMode) => {
    setSettings({ themeMode });
  }, [setSettings]);

  const setGridColorTheme = useCallback((gridColorTheme: GridColorTheme) => {
    setSettings({ gridColorTheme });
  }, [setSettings]);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setSettings({ viewMode });
  }, [setSettings]);

  return {
    ...settings,
    resolvedTheme,
    setThemeMode,
    setGridColorTheme,
    setViewMode,
  };
}

// Grid color theme styles
export const gridColorStyles: Record<GridColorTheme, { cell: string; cellDark: string }> = {
  green: {
    cell: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200/50',
    cellDark: 'dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/30',
  },
  blue: {
    cell: 'bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200/50',
    cellDark: 'dark:from-sky-950/20 dark:to-sky-900/20 dark:border-sky-800/30',
  },
  white: {
    cell: 'bg-gradient-to-br from-gray-50 to-white border-gray-200/50',
    cellDark: 'dark:from-gray-900/40 dark:to-gray-800/40 dark:border-gray-700/30',
  },
  dark: {
    cell: 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400/50',
    cellDark: 'dark:from-gray-800 dark:to-gray-900 dark:border-gray-600/50',
  },
};
