import { FormField, FormValidationResult, FormData, ModalSize } from './types';

/**
 * Validate form data against field definitions
 */
export const validateForm = (
    data: FormData,
    fields: FormField[]
): FormValidationResult => {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
        const value = data[field.name];

        // Check required fields
        if (field.required && (!value || value.toString().trim() === '')) {
            errors[field.name] = `${field.label} is required`;
            return;
        }

        // Skip validation if field is empty and not required
        if (!value && !field.required) {
            return;
        }

        // Type-specific validation
        switch (field.type) {
            case 'number':
                const num = Number(value);
                if (isNaN(num)) {
                    errors[field.name] = `${field.label} must be a number`;
                } else if (field.min !== undefined && num < field.min) {
                    errors[field.name] = `${field.label} must be at least ${field.min}`;
                } else if (field.max !== undefined && num > field.max) {
                    errors[field.name] = `${field.label} must be at most ${field.max}`;
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors[field.name] = `${field.label} must be a valid email`;
                }
                break;

            case 'text':
            case 'textarea':
                if (field.min && value.length < field.min) {
                    errors[field.name] = `${field.label} must be at least ${field.min} characters`;
                }
                if (field.max && value.length > field.max) {
                    errors[field.name] = `${field.label} must be at most ${field.max} characters`;
                }
                if (field.pattern) {
                    const regex = new RegExp(field.pattern);
                    if (!regex.test(value)) {
                        errors[field.name] = `${field.label} format is invalid`;
                    }
                }
                break;

            case 'color':
                const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                if (!hexRegex.test(value)) {
                    errors[field.name] = `${field.label} must be a valid hex color`;
                }
                break;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Get modal size dimensions
 */
export const getModalSize = (size: 'small' | 'medium' | 'large'): ModalSize => {
    switch (size) {
        case 'small':
            return { maxWidth: 400, padding: 16 };
        case 'medium':
            return { maxWidth: 600, padding: 24 };
        case 'large':
            return { maxWidth: 800, padding: 32 };
        default:
            return { maxWidth: 600, padding: 24 };
    }
};

/**
 * Get initial form data from fields
 */
export const getInitialFormData = (fields: FormField[]): FormData => {
    const data: FormData = {};

    fields.forEach(field => {
        if (field.defaultValue !== undefined) {
            data[field.name] = field.defaultValue;
        } else {
            // Set appropriate default based on type
            switch (field.type) {
                case 'number':
                    data[field.name] = field.min || 0;
                    break;
                case 'select':
                    data[field.name] = field.options?.[0]?.value || '';
                    break;
                default:
                    data[field.name] = '';
            }
        }
    });

    return data;
};

/**
 * Check if form has changes from initial data
 */
export const hasFormChanges = (
    currentData: FormData,
    initialData: FormData
): boolean => {
    const keys = Object.keys(currentData);

    return keys.some(key => {
        const current = currentData[key];
        const initial = initialData[key];

        // Handle different types
        if (typeof current === 'number' && typeof initial === 'number') {
            return current !== initial;
        }

        return String(current) !== String(initial);
    });
};

/**
 * Sanitize form data (trim strings, convert numbers)
 */
export const sanitizeFormData = (
    data: FormData,
    fields: FormField[]
): FormData => {
    const sanitized: FormData = {};

    fields.forEach(field => {
        let value = data[field.name];

        if (value === undefined || value === null) {
            sanitized[field.name] = '';
            return;
        }

        switch (field.type) {
            case 'number':
                sanitized[field.name] = Number(value);
                break;
            case 'text':
            case 'textarea':
            case 'email':
                sanitized[field.name] = String(value).trim();
                break;
            default:
                sanitized[field.name] = value;
        }
    });

    return sanitized;
};
