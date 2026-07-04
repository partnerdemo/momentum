'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link, Loader, AlertTriangle, Copy, Check, Trash, Settings } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import AlertModal from '../shared/AlertModal';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import ConfirmModal from '../shared/ConfirmModal';

interface IHouseholdLink {
    _id: string;
    childId: { _id: string; displayName: string };
    household1: string;
    household2: string;
    linkCode: string;
    status: 'active' | 'unlinked';
    createdAt: string;
}

const HouseholdLinkSettings: React.FC = () => {
    const [links, setLinks] = useState<IHouseholdLink[]>([]);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();
    const { members } = useFamilyData();
    const children = members.filter(m => m.role === 'Child');

    // Modal States
    const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    const fetchLinks = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('/web-bff/household/links', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch links');
            const data = await response.json();
            setLinks(data.data.links || []);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleGenerateCode = async () => {
        if (children.length === 0) {
            showAlert('Info', 'No children found in this household to link.', 'info');
            return;
        }

        // For MVP, auto-select first child if multiple not supported in UI yet
        // In a real UI, we would show a modal to select the child.
        const targetChild = children[0];

        setGenerating(true);
        try {
            const response = await fetch('/web-bff/household/links/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    childId: targetChild._id
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to generate code');
            }

            const data = await response.json();
            // Assuming the API returns the code in data.data.code
            const code = data.data.code;
            setGeneratedCode(code);

            showAlert('Success', `Link Code Generated for ${targetChild.displayName}: ${code}. Share this with the other parent.`, 'success');

        } catch (e: any) {
            showAlert('Error', e.message, 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleUnlink = async () => {
        if (!confirmUnlinkId) return;
        try {
            const response = await fetch(`/web-bff/household/links/child/${confirmUnlinkId}/unlink`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to unlink child');
            fetchLinks();
            setConfirmUnlinkId(null);
            showAlert('Success', 'Child unlinked successfully.', 'success');
        } catch (e: any) {
            showAlert('Error', e.message, 'error');
            setConfirmUnlinkId(null);
        }
    };

    if (loading && links.length === 0) {
        return <div className="p-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-action-primary" /></div>;
    }

    return (
        <div className="w-full space-y-6">
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <ConfirmModal
                isOpen={!!confirmUnlinkId}
                onClose={() => setConfirmUnlinkId(null)}
                onConfirm={handleUnlink}
                title="Unlink Child"
                message="Are you sure you want to unlink this child? They will no longer be shared with the other household."
                confirmText="Unlink"
                variant="danger"
            />

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-text-primary flex items-center">
                    <Link className="w-5 h-5 mr-2 text-action-primary" />
                    Household Links
                </h2>
                <button
                    className="px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors flex items-center text-sm font-medium"
                    onClick={handleGenerateCode}
                    disabled={generating}
                >
                    {generating ? <Loader className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                    Link Child
                </button>
            </div>

            {error && (
                <div className="p-4 bg-signal-alert/10 text-signal-alert rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-bg-surface rounded-lg border border-border-subtle overflow-hidden">
                <table className="min-w-full divide-y divide-border-subtle">
                    <thead className="bg-bg-subtle">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Child</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Linked Household</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-bg-surface divide-y divide-border-subtle">
                        {links.map((link) => (
                            <tr key={link._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                    {link.childId?.displayName || 'Unknown Child'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                    {link.household2}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${link.status === 'active' ? 'bg-signal-success/10 text-signal-success' : 'bg-text-secondary/10 text-text-secondary'
                                        }`}>
                                        {link.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setConfirmUnlinkId(link.childId._id)}
                                        className="text-signal-alert hover:text-signal-alert/80 ml-4"
                                    >
                                        Unlink
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {links.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary text-sm">
                                    No active household links found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Helper for Plus icon since I didn't import it
function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

export default HouseholdLinkSettings;
