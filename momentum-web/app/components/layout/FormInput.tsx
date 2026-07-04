// =========================================================
// silkpanda/momentum/app/components/FormInput.tsx
// Reusable, styled input component for forms
// =========================================================
'use client';

import React from 'react';

// Define the props for the reusable component
interface FormInputProps {
    id: string;
    name: string;
    type?: string;
    label: string;
    Icon: React.ElementType; // Accept icon component
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

/**
 * @fileoverview A reusable, styled text input component.
 * @component FormInput
 */
const FormInput: React.FC<FormInputProps> = ({
    id,
    name,
    type = 'text',
    label,
    Icon,
    placeholder,
    value,
    onChange,
    required = true, // Default to required
}) => {
    return (
        <div className="space-y-1">
            {/* Label Styling (Source: Style Guide, 5. Component Design, Forms) */}
            <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
                {label}
            </label>
            <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    {/* Icon using Lucide */}
                    <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                </div>
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    // Input Field Styling (Source: Style Guide, 5. Component Design, Forms)
                    className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface
                     placeholder:text-text-secondary/70 focus:border-action-primary focus:ring-action-primary transition duration-150 sm:text-sm"
                />
            </div>
        </div>
    );
};

export default FormInput;