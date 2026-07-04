import { ITask, IHouseholdMemberProfile } from '../../types';

/**
 * Manually populates the assignedTo field of a task with member details.
 * The API returns assignedTo as an array of IDs (strings), but the UI expects
 * objects with {_id, displayName, profileColor}.
 */
export function populateTaskAssignments(
    task: ITask,
    householdMembers: IHouseholdMemberProfile[]
): ITask {
    return {
        ...task,
        assignedTo: (task.assignedTo as any[]).map((assignedId: any) => {
            // Check if it's already populated (object) or just an ID (string)
            if (typeof assignedId === 'string') {
                const member = householdMembers.find(m => m._id === assignedId);
                return member ? {
                    _id: member._id,
                    displayName: member.displayName,
                    profileColor: member.profileColor
                } : { _id: assignedId, displayName: '?', profileColor: '#808080' };
            }
            return assignedId; // Already populated
        })
    };
}
