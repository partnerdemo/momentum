// app/components/settings/ThemeSwitcher.tsx
'use client';

import React, { useState } from 'react';
import { Palette, Check, Lock } from 'lucide-react';
import { useTheme } from '../layout/ThemeContext';
import { Theme } from '../../lib/themes';

export default function ThemeSwitcher() {
    const { currentTheme, setTheme, availableThemes, hasPremiumAccess } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const handleThemeSelect = (themeId: string) => {
        setTheme(themeId);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle
                   hover:border-action-primary transition-colors"
                title="Change Theme"
            >
                <Palette className="w-5 h-5 text-action-primary" />
                <span className="text-sm font-medium text-text-primary">{currentTheme.name}</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-72 bg-bg-surface rounded-lg shadow-xl border border-border-subtle z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-border-subtle">
                            <h3 className="text-sm font-semibold text-text-primary">Choose Theme</h3>
                            <p className="text-xs text-text-secondary mt-1">
                                {hasPremiumAccess ? 'All themes unlocked' : 'Premium themes require subscription'}
                            </p>
                        </div>

                        <div className="p-2 space-y-1">
                            {availableThemes.map((theme) => (
                                <ThemeOption
                                    key={theme.id}
                                    theme={theme}
                                    isSelected={theme.id === currentTheme.id}
                                    onSelect={() => handleThemeSelect(theme.id)}
                                />
                            ))}
                        </div>

                        {!hasPremiumAccess && (
                            <div className="p-3 border-t border-border-subtle bg-action-primary/5">
                                <p className="text-xs text-text-secondary">
                                    <Lock className="w-3 h-3 inline mr-1" />
                                    Unlock {availableThemes.length > 2 ? 'more' : 'premium'} themes with Momentum Premium
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

interface ThemeOptionProps {
    theme: Theme;
    isSelected: boolean;
    onSelect: () => void;
}

function ThemeOption({ theme, isSelected, onSelect }: ThemeOptionProps) {
    return (
        <button
            onClick={onSelect}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors
                  ${isSelected
                    ? 'bg-action-primary/10 border border-action-primary'
                    : 'hover:bg-bg-canvas border border-transparent'}`}
        >
            <div className="flex items-center space-x-3">
                {/* Color Preview */}
                <div className="flex space-x-1">
                    <div
                        className="w-4 h-4 rounded-full border border-border-subtle"
                        style={{ backgroundColor: theme.colors.actionPrimary }}
                    />
                    <div
                        className="w-4 h-4 rounded-full border border-border-subtle"
                        style={{ backgroundColor: theme.colors.bgCanvas }}
                    />
                    <div
                        className="w-4 h-4 rounded-full border border-border-subtle"
                        style={{ backgroundColor: theme.colors.signalSuccess }}
                    />
                </div>

                {/* Theme Info */}
                <div className="text-left">
                    <p className="text-sm font-medium text-text-primary flex items-center">
                        {theme.name}
                        {theme.isPremium && (
                            <Lock className="w-3 h-3 ml-1 text-text-secondary" />
                        )}
                    </p>
                    <p className="text-xs text-text-secondary">{theme.description}</p>
                </div>
            </div>

            {/* Selected Indicator */}
            {isSelected && (
                <Check className="w-5 h-5 text-action-primary flex-shrink-0" />
            )}
        </button>
    );
}
