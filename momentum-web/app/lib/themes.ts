// app/lib/themes.ts
// Theme definitions for the Momentum app

export interface Theme {
    id: string;
    name: string;
    description: string;
    isPremium: boolean;
    colors: {
        textPrimary: string;
        textSecondary: string;
        actionPrimary: string;
        actionHover: string;
        signalSuccess: string;
        signalAlert: string;
        bgCanvas: string;
        bgSurface: string;
        borderSubtle: string;
    };
}

export const themes: Record<string, Theme> = {
    calmLight: {
        id: 'calmLight',
        name: 'Calm Light',
        description: 'Soft, neutral tones for focused work',
        isPremium: false,
        colors: {
            textPrimary: '#111827',
            textSecondary: '#4B5563',
            actionPrimary: '#4F46E5',
            actionHover: '#4338CA',
            signalSuccess: '#16A34A',
            signalAlert: '#DC2626',
            bgCanvas: '#F9FAFB',
            bgSurface: '#FFFFFF',
            borderSubtle: '#E5E7EB',
        },
    },
    darkMode: {
        id: 'darkMode',
        name: 'Dark Mode',
        description: 'Easy on the eyes for evening use',
        isPremium: false,
        colors: {
            textPrimary: '#F9FAFB',
            textSecondary: '#D1D5DB',
            actionPrimary: '#818CF8',
            actionHover: '#6366F1',
            signalSuccess: '#34D399',
            signalAlert: '#F87171',
            bgCanvas: '#111827',
            bgSurface: '#1F2937',
            borderSubtle: '#374151',
        },
    },
    oceanBreeze: {
        id: 'oceanBreeze',
        name: 'Ocean Breeze',
        description: 'Calming blues and teals',
        isPremium: true,
        colors: {
            textPrimary: '#0F172A',
            textSecondary: '#475569',
            actionPrimary: '#0EA5E9',
            actionHover: '#0284C7',
            signalSuccess: '#14B8A6',
            signalAlert: '#EF4444',
            bgCanvas: '#F0F9FF',
            bgSurface: '#FFFFFF',
            borderSubtle: '#BAE6FD',
        },
    },
    forestCalm: {
        id: 'forestCalm',
        name: 'Forest Calm',
        description: 'Grounding greens and earth tones',
        isPremium: true,
        colors: {
            textPrimary: '#1C1917',
            textSecondary: '#57534E',
            actionPrimary: '#16A34A',
            actionHover: '#15803D',
            signalSuccess: '#22C55E',
            signalAlert: '#DC2626',
            bgCanvas: '#F7FEE7',
            bgSurface: '#FFFFFF',
            borderSubtle: '#D9F99D',
        },
    },
    sunsetWarmth: {
        id: 'sunsetWarmth',
        name: 'Sunset Warmth',
        description: 'Energizing oranges and warm hues',
        isPremium: true,
        colors: {
            textPrimary: '#1C1917',
            textSecondary: '#78716C',
            actionPrimary: '#F97316',
            actionHover: '#EA580C',
            signalSuccess: '#84CC16',
            signalAlert: '#DC2626',
            bgCanvas: '#FFF7ED',
            bgSurface: '#FFFFFF',
            borderSubtle: '#FED7AA',
        },
    },
    lavenderDreams: {
        id: 'lavenderDreams',
        name: 'Lavender Dreams',
        description: 'Soft purples and gentle pastels',
        isPremium: true,
        colors: {
            textPrimary: '#1E1B4B',
            textSecondary: '#6366F1',
            actionPrimary: '#A78BFA',
            actionHover: '#8B5CF6',
            signalSuccess: '#34D399',
            signalAlert: '#F472B6',
            bgCanvas: '#FAF5FF',
            bgSurface: '#FFFFFF',
            borderSubtle: '#E9D5FF',
        },
    },
    bluey: {
        id: 'bluey',
        name: 'Bluey',
        description: 'Playful and warm, inspired by everyone\'s favorite Blue Heeler',
        isPremium: true,
        colors: {
            textPrimary: '#2C3E50',        // Deep blue-gray for readability
            textSecondary: '#5D6D7E',      // Softer gray-blue
            actionPrimary: '#5B9BD5',      // Bluey's signature blue
            actionHover: '#4A8BC2',        // Slightly darker blue
            signalSuccess: '#52C41A',      // Bright green (grass/play)
            signalAlert: '#FF6B6B',        // Soft red (gentle warning)
            bgCanvas: '#FFF8E7',           // Warm cream (Queensland sun)
            bgSurface: '#FFFFFF',          // Clean white
            borderSubtle: '#FFE4B5',       // Soft peachy border
        },
    },
    neonCyberpunk: {
        id: 'neonCyberpunk',
        name: 'Neon Cyberpunk',
        description: '🌃 Electric neon vibes with cyberpunk aesthetics',
        isPremium: true,
        colors: {
            textPrimary: '#00FFFF', // Cyan
            textSecondary: '#FF00FF', // Magenta
            actionPrimary: '#FF00FF', // Hot Pink/Magenta
            actionHover: '#FF1493', // Deep Pink
            signalSuccess: '#00FF41', // Neon Green
            signalAlert: '#FF073A', // Neon Red
            bgCanvas: '#0a0a0a', // Almost black
            bgSurface: 'rgba(26, 10, 46, 0.8)', // Dark purple with transparency
            borderSubtle: '#FF00FF80', // Magenta with 50% opacity
        },
    },
    spaceExplorer: {
        id: 'spaceExplorer',
        name: 'Space Explorer',
        description: '🚀 Journey through the cosmos with stellar colors',
        isPremium: true,
        colors: {
            textPrimary: '#FFFFFF', // White
            textSecondary: '#B8C5D6', // Light blue-gray
            actionPrimary: '#00D9FF', // Bright cyan
            actionHover: '#00B8D4', // Darker cyan
            signalSuccess: '#00FF88', // Bright green
            signalAlert: '#FF6B9D', // Soft pink
            bgCanvas: '#000428', // Deep space blue
            bgSurface: 'rgba(0, 78, 146, 0.6)', // Semi-transparent blue
            borderSubtle: '#00D9FF40', // Cyan with 25% opacity
        },
    },
};

export const freeThemes = Object.values(themes).filter(t => !t.isPremium);
export const premiumThemes = Object.values(themes).filter(t => t.isPremium);
export const defaultTheme = themes.calmLight;
