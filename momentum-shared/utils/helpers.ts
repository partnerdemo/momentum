/**
 * Sort array by property
 */
export const sortBy = <T>(
    array: T[],
    key: keyof T,
    order: 'asc' | 'desc' = 'asc'
): T[] => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

/**
 * Group array by property
 */
export const groupBy = <T>(
    array: T[],
    key: keyof T
): Record<string, T[]> => {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

/**
 * Filter array by search term
 */
export const filterBySearch = <T>(
    array: T[],
    searchTerm: string,
    searchKeys: (keyof T)[]
): T[] => {
    if (!searchTerm.trim()) return array;

    const term = searchTerm.toLowerCase();

    return array.filter(item =>
        searchKeys.some(key => {
            const value = item[key];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(term);
        })
    );
};

/**
 * Paginate array
 */
export const paginate = <T>(
    array: T[],
    page: number,
    pageSize: number
): { items: T[]; totalPages: number; hasNext: boolean; hasPrev: boolean } => {
    const totalPages = Math.ceil(array.length / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
        items: array.slice(start, end),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

/**
 * Deep clone object using the native global structuredClone API.
 * Falls back to JSON serialization for older or restricted environments.
 */
export const deepClone = <T>(obj: T): T => {
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(obj);
        } catch (e) {
            // Fallback if structuredClone fails on non-serializable objects (e.g. DOM nodes, functions)
            return JSON.parse(JSON.stringify(obj));
        }
    }
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if two objects are equal (shallow)
 */
export const shallowEqual = (obj1: any, obj2: any): boolean => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => obj1[key] === obj2[key]);
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Pluralize word based on count
 */
export const pluralize = (
    count: number,
    singular: string,
    plural?: string
): string => {
    if (count === 1) return singular;
    return plural || `${singular}s`;
};
