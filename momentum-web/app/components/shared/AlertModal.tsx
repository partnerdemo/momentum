import React from 'react';
import Modal from './Modal';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    buttonText?: string;
    variant?: 'success' | 'error' | 'info';
}

const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    buttonText = 'OK',
    variant = 'info'
}) => {
    const getIcon = () => {
        switch (variant) {
            case 'success':
                return <CheckCircle className="w-12 h-12 text-signal-success mx-auto mb-4" />;
            case 'error':
                return <AlertCircle className="w-12 h-12 text-signal-alert mx-auto mb-4" />;
            default:
                return <Info className="w-12 h-12 text-action-primary mx-auto mb-4" />;
        }
    };

    const getTitle = () => {
        if (title) return title;
        switch (variant) {
            case 'success': return 'Success';
            case 'error': return 'Error';
            default: return 'Notice';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" zIndex="z-[60]">
            <div className="text-center p-2">
                {getIcon()}
                <h3 className="text-xl font-bold text-text-primary mb-2">
                    {getTitle()}
                </h3>
                <p className="text-text-secondary mb-6">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-action-primary text-white rounded-lg font-medium 
                             hover:bg-action-hover transition-colors shadow-sm"
                >
                    {buttonText}
                </button>
            </div>
        </Modal>
    );
};

export default AlertModal;
