// app/components/layout/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes, defaultTheme } from '../../lib/themes';

interface ThemeContextType {
    currentTheme: Theme;
    setTheme: (themeId: string) => void;
    availableThemes: Theme[];
    hasPremiumAccess: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
    // TODO: Set to false in production and tie to actual subscription status
    const [hasPremiumAccess, setHasPremiumAccess] = useState(true); // Unlocked for testing

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedThemeId = localStorage.getItem('momentum-theme');

        // TODO: In production, check actual subscription status
        // For now, always enable premium for testing
        setHasPremiumAccess(true);
        localStorage.setItem('momentum-premium', 'true');

        if (savedThemeId && themes[savedThemeId]) {
            const theme = themes[savedThemeId];
            setCurrentTheme(theme);
            applyTheme(theme);
        } else {
            applyTheme(defaultTheme);
        }
    }, []);

    const applyTheme = (theme: Theme) => {
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            // Convert camelCase to kebab-case (e.g., textPrimary -> text-primary)
            const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, value);
        });
    };

    const setTheme = (themeId: string) => {
        const theme = themes[themeId];
        if (!theme) return;

        // TODO: In production, re-enable premium check
        // For now, allow all themes for testing

        setCurrentTheme(theme);
        applyTheme(theme);
        localStorage.setItem('momentum-theme', themeId);
    };

    // TODO: In production, filter by premium access
    // For now, show all themes for testing
    const availableThemes = Object.values(themes);

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes, hasPremiumAccess }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
