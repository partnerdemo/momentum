import React from 'react';
import Modal from './Modal';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" zIndex="z-[60]">
            <div className="text-center p-2">
                {variant === 'danger' ? (
                    <div className="w-12 h-12 bg-signal-alert/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-signal-alert" />
                    </div>
                ) : (
                    <div className="w-12 h-12 bg-action-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-6 h-6 text-action-primary" />
                    </div>
                )}

                <h3 className="text-xl font-bold text-text-primary mb-2">
                    {title}
                </h3>
                <p className="text-text-secondary mb-6">
                    {message}
                </p>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-bg-canvas text-text-primary border border-border-subtle 
                                 rounded-lg font-medium hover:bg-bg-subtle transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            // Optional: Close on confirm if not handled by parent (usually parent closes after async op)
                        }}
                        disabled={isLoading}
                        className={`flex-1 py-3 px-4 text-white rounded-lg font-medium shadow-sm transition-colors
                            ${variant === 'danger'
                                ? 'bg-signal-alert hover:bg-signal-alert/90'
                                : 'bg-action-primary hover:bg-action-hover'}`}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
