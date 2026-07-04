'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import ConfirmModal from '../shared/ConfirmModal';

export default function InviteCodeManager() {
    const { token, householdId } = useSession();
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isConfirmRegenerateOpen, setIsConfirmRegenerateOpen] = useState(false);

    const fetchInviteCode = async () => {
        if (!token || !householdId) return;
        setLoading(true);
        try {
            const res = await fetch(`/web-bff/households/${householdId}/invite-code`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch invite code');
            const data = await res.json();
            setInviteCode(data.inviteCode);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const regenerateCode = async () => {
        if (!token || !householdId) return;

        setLoading(true);
        try {
            const res = await fetch(`/web-bff/households/${householdId}/invite-code`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to regenerate code');
            const data = await res.json();
            setInviteCode(data.inviteCode);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setIsConfirmRegenerateOpen(false);
        }
    };

    useEffect(() => {
        fetchInviteCode();
    }, [token, householdId]);

    const copyToClipboard = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!householdId) return null;

    return (
        <div className="bg-bg-surface p-6 rounded-xl border border-border-subtle shadow-sm mt-6">
            <ConfirmModal
                isOpen={isConfirmRegenerateOpen}
                onClose={() => setIsConfirmRegenerateOpen(false)}
                onConfirm={regenerateCode}
                title="Regenerate Invite Code"
                message="Are you sure? The old code will stop working immediately."
                confirmText="Regenerate"
                variant="danger"
            />

            <h3 className="text-lg font-semibold text-text-primary mb-4">Household Invite Code</h3>
            <p className="text-text-secondary text-sm mb-4">
                Share this code with family members to let them join your household.
            </p>

            {error && (
                <div className="text-signal-alert text-sm mb-4 bg-signal-alert/10 p-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                    <div className="w-full bg-bg-canvas border border-border-subtle rounded-lg px-4 py-3 font-mono text-xl text-center tracking-widest text-text-primary">
                        {loading ? '...' : inviteCode || 'No Code'}
                    </div>
                </div>

                <button
                    onClick={copyToClipboard}
                    disabled={!inviteCode || loading}
                    className="p-3 text-text-secondary hover:text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors"
                    title="Copy to clipboard"
                >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>

                <button
                    onClick={() => setIsConfirmRegenerateOpen(true)}
                    disabled={loading}
                    className="p-3 text-text-secondary hover:text-signal-alert hover:bg-signal-alert/10 rounded-lg transition-colors"
                    title="Regenerate code"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
}
