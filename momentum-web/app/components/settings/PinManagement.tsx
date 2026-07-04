'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useSession } from '../layout/SessionContext';

export default function PinManagement() {
    const { token, householdId } = useSession();
    const [hasPin, setHasPin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        checkPinStatus();
    }, [token]);

    const checkPinStatus = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/web-bff/pin/status', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch PIN status');
            const data = await res.json();
            setHasPin(data.hasPin);
        } catch (err: any) {
            console.error(err);
            setError('Could not check PIN status');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (newPin.length !== 4 || isNaN(Number(newPin))) {
            setError('New PIN must be 4 digits.');
            return;
        }

        if (newPin !== confirmPin) {
            setError('New PINs do not match.');
            return;
        }

        setActionLoading(true);

        try {
            const endpoint = hasPin ? '/web-bff/pin/change' : '/web-bff/pin/setup';
            const body = hasPin
                ? { currentPin, newPin }
                : { pin: newPin };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update PIN');
            }

            setSuccessMessage(hasPin ? 'PIN changed successfully.' : 'PIN set up successfully.');
            setHasPin(true);
            setIsEditing(false);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-text-secondary">Loading PIN status...</div>;
    }

    return (
        <div className="bg-bg-surface p-6 rounded-xl border border-border-subtle shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${hasPin ? 'bg-signal-success/10 text-signal-success' : 'bg-text-secondary/10 text-text-secondary'}`}>
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">Parent PIN Protection</h3>
                        <p className="text-sm text-text-secondary">
                            {hasPin
                                ? 'Your account is protected with a PIN.'
                                : 'Set up a PIN to secure the Parent Dashboard.'}
                        </p>
                    </div>
                </div>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary font-medium hover:bg-action-primary/5 hover:border-action-primary transition-all"
                    >
                        {hasPin ? 'Change PIN' : 'Set Up PIN'}
                    </button>
                )}
            </div>

            {successMessage && (
                <div className="mb-4 p-3 bg-signal-success/10 text-signal-success rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            {isEditing && (
                <form onSubmit={handleSubmit} className="mt-6 p-4 bg-bg-canvas rounded-lg border border-border-subtle animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-medium text-text-primary mb-4">
                        {hasPin ? 'Change Existing PIN' : 'Create New PIN'}
                    </h4>

                    <div className="space-y-4 max-w-xs">
                        {hasPin && (
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">Current PIN</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={currentPin}
                                    onChange={(e) => setCurrentPin(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-border-subtle bg-bg-surface focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary transition-all"
                                    placeholder="Enter current PIN"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">New PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="w-full p-2 rounded-lg border border-border-subtle bg-bg-surface focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary transition-all"
                                placeholder="Enter 4-digit PIN"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Confirm New PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                className="w-full p-2 rounded-lg border border-border-subtle bg-bg-surface focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary transition-all"
                                placeholder="Re-enter new PIN"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-signal-alert/10 text-signal-alert rounded-lg flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-4 py-2 bg-action-primary text-white rounded-lg font-medium hover:bg-action-hover disabled:opacity-50 flex items-center gap-2"
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {hasPin ? 'Update PIN' : 'Set PIN'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setError(null);
                                setCurrentPin('');
                                setNewPin('');
                                setConfirmPin('');
                            }}
                            disabled={actionLoading}
                            className="px-4 py-2 text-text-secondary hover:text-text-primary"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
