/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate points value
 */
export const isValidPoints = (points: number): boolean => {
    return Number.isInteger(points) && points > 0 && points <= 1000;
};

/**
 * Validate task title
 */
export const isValidTaskTitle = (title: string): boolean => {
    return title.trim().length >= 3 && title.trim().length <= 100;
};

/**
 * Validate hex color
 */
export const isValidHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};
