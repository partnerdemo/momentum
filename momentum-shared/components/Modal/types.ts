export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'email' | 'color';
    required?: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string | number }>;
    min?: number;
    max?: number;
    pattern?: string;
    defaultValue?: any;
}

export interface FormValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export interface FormData {
    [key: string]: any;
}

export interface ModalSize {
    maxWidth: number;
    padding: number;
}
