import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    zIndex?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'max-w-lg',
    zIndex = 'z-50'
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`}>
            <div
                className={`relative w-full ${maxWidth} bg-bg-surface rounded-xl shadow-xl border border-border-subtle flex flex-col max-h-[90vh]`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-border-subtle shrink-0">
                    {title && <h3 className="text-xl font-medium text-text-primary">{title}</h3>}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-text-secondary hover:bg-border-subtle transition-colors ml-auto"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    {children}
                </div>
                {footer && (
                    <div className="p-6 border-t border-border-subtle shrink-0">
                        {footer}
                    </div>
                )}
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default Modal;
