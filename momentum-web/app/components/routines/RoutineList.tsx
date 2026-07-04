// =========================================================
// silkpanda/momentum/app/components/routines/RoutineList.tsx
// List of routines
// =========================================================
'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import RoutineItem from './RoutineItem';
import CreateRoutineModal from './CreateRoutineModal';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';

import { IRoutine, IRoutineItem } from '../../types';

export type { IRoutine, IRoutineItem };

interface RoutineListProps {
    initialRoutines: IRoutine[];
}

const RoutineList: React.FC<RoutineListProps> = ({ initialRoutines }) => {
    const { user } = useSession();
    const { members } = useFamilyData();
    const [routines, setRoutines] = useState<IRoutine[]>(initialRoutines);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleRoutineCreated = (newRoutine: IRoutine) => {
        setRoutines([newRoutine, ...routines]);
    };

    const handleRoutineUpdated = (updatedRoutine: IRoutine) => {
        setRoutines(routines.map(r => r._id === updatedRoutine._id ? updatedRoutine : r));
    };

    const handleRoutineDeleted = (routineId: string) => {
        setRoutines(routines.filter(r => r._id !== routineId));
    };

    // Filter routines based on user role
    const displayRoutines = user?.role === 'Parent'
        ? routines
        : routines.filter(r => r.memberId === user?._id && r.isActive);

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Routines</h1>
                    <p className="text-text-secondary">Build good habits with daily and weekly routines.</p>
                </div>

                {user?.role === 'Parent' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Routine
                    </button>
                )}
            </div>

            {/* Routine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRoutines.length > 0 ? (
                    displayRoutines.map((routine) => (
                        <RoutineItem
                            key={routine._id}
                            routine={routine}
                            onUpdate={handleRoutineUpdated}
                            onDelete={handleRoutineDeleted}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-surface rounded-xl border border-border-subtle border-dashed">
                        <div className="mx-auto w-12 h-12 bg-bg-canvas rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">No routines found</h3>
                        <p className="text-text-secondary">
                            {user?.role === 'Parent'
                                ? "Create a routine to get started."
                                : "You don't have any assigned routines yet."}
                        </p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <CreateRoutineModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onRoutineCreated={handleRoutineCreated}
                    members={members}
                />
            )}
        </div>
    );
};

export default RoutineList;
