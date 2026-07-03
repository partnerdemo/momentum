import { AvatarStyles } from './types';

/**
 * Get initials from a name
 * @param name - Full name or first name
 * @returns Single uppercase letter
 */
export const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return '?';
    return name.trim().charAt(0).toUpperCase();
};

/**
 * Calculate avatar styles based on size
 * @param color - Background color hex
 * @param size - Avatar diameter in pixels
 * @returns Style object with calculated values
 */
export const getAvatarStyles = (color: string, size: number): AvatarStyles => {
    return {
        backgroundColor: color || '#808080',
        width: size,
        height: size,
        borderRadius: size / 2,
        fontSize: Math.floor(size * 0.4), // 40% of size for good proportion
    };
};

/**
 * Validate color hex code
 * @param color - Hex color string
 * @returns Valid hex color or default gray
 */
export const validateColor = (color: string): string => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color) ? color : '#808080';
};

/**
 * Get contrasting text color for background
 * @param backgroundColor - Hex color
 * @returns '#FFFFFF' or '#000000'
 */
export const getContrastingTextColor = (backgroundColor: string): string => {
    // Remove # if present
    const hex = backgroundColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};
