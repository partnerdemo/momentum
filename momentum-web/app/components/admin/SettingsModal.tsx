'use client';

import React from 'react';
import { Palette, Lock, Check } from 'lucide-react';
import Modal from '../shared/Modal';
import { useTheme } from '../layout/ThemeContext';
import { useSession } from '../layout/SessionContext';
import InviteCodeManager from '../settings/InviteCodeManager';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { currentTheme, setTheme, availableThemes, hasPremiumAccess } = useTheme();
    const { user } = useSession();

    return (
        <Modal isOpen={true} onClose={onClose} title="Settings">
            <div className="space-y-8">
                {/* Theme Settings */}
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <Palette className="w-5 h-5 text-action-primary" />
                        <h3 className="text-lg font-bold text-text-primary">Appearance</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableThemes.map((theme) => {
                            const isSelected = currentTheme.id === theme.id;
                            const isLocked = theme.isPremium && !hasPremiumAccess;

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => !isLocked && setTheme(theme.id)}
                                    disabled={isLocked}
                                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                        ? 'border-action-primary bg-action-primary/5'
                                        : 'border-border-subtle hover:border-action-primary/50 bg-bg-surface'
                                        } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div
                                            className="w-8 h-8 rounded-full border border-border-subtle shadow-sm"
                                            style={{ backgroundColor: theme.colors.actionPrimary }}
                                        />
                                        {isSelected && (
                                            <div className="bg-action-primary text-white p-1 rounded-full">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                        {isLocked && (
                                            <Lock className="w-4 h-4 text-text-tertiary" />
                                        )}
                                    </div>

                                    <h4 className="font-bold text-text-primary mb-1">
                                        {theme.name}
                                    </h4>
                                    <p className="text-xs text-text-secondary line-clamp-2">
                                        {theme.description}
                                    </p>

                                    {/* Preview Swatches */}
                                    <div className="flex gap-1 mt-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.bgCanvas }} />
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.textPrimary }} />
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.signalSuccess }} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Account Info (Read Only) */}
                <section className="pt-6 border-t border-border-subtle">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Account</h3>
                    <div className="bg-bg-surface p-4 rounded-xl border border-border-subtle space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                Email
                            </label>
                            <p className="text-text-primary font-medium">
                                {user?.email || 'Not available'}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                Role
                            </label>
                            <p className="text-text-primary font-medium">
                                {user?.role || 'User'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Invite Code Manager */}
                <InviteCodeManager />
            </div>
        </Modal >
    );
};

export default SettingsModal;
