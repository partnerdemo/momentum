import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme { name: string; colors: { background: string; surface: string; text: string; primary: string; secondary: string }; }

const defaultTheme: Theme = {
  name: 'default',
  colors: { background: '#FFF9F5', surface: '#FFFFFF', text: '#1C1917', primary: '#6366f1', secondary: '#818cf8' },
};

const darkTheme: Theme = {
  name: 'dark',
  colors: { background: '#0f172a', surface: '#1e293b', text: '#f1f5f9', primary: '#818cf8', secondary: '#a5b4fc' },
};

interface ThemeContextType { theme: Theme; setThemeName: (name: string) => void; isDark: boolean; }

const ThemeContext = createContext<ThemeContextType>({ theme: defaultTheme, setThemeName: () => {}, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState('default');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('momentum_theme');
        if (stored) {
          setThemeNameState(stored);
        }
      } catch (e) {
        // Silently catch persistence failures to ensure app continues to function
      }
    };
    loadTheme();
  }, []);

  const setThemeName = useCallback(async (name: string) => {
    setThemeNameState(name);
    try {
      await AsyncStorage.setItem('momentum_theme', name);
    } catch (e) {
      // Silently catch persistence failures
    }
  }, []);

  const theme = themeName === 'dark' ? darkTheme : defaultTheme;
  return <ThemeContext.Provider value={{ theme, setThemeName, isDark: themeName === 'dark' }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
