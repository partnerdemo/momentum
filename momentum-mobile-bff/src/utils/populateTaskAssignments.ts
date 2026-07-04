// src/utils/populateTaskAssignments.ts
/**
 * Helper utility to manually populate assignedTo field in tasks
 * 
 * Background:
 * The Task model stores assignedTo as ObjectIds referencing Household.memberProfiles._id
 * However, memberProfiles are embedded subdocuments, not a separate collection.
 * Mongoose's .populate() only works with references to separate collections.
 * 
 * This utility manually maps ObjectIds to member profile details from the household data.
 */
import { logger } from './logger';

interface MemberProfile {
    _id: string;
    displayName?: string;
    profileColor?: string;
    familyMemberId?: any;
    pointsTotal?: number;
    role?: string;
}

interface Task {
    _id: string;
    title: string;
    description?: string;
    pointsValue: number;
    status: string;
    assignedTo: any[]; // Can be string[] or PopulatedAssignment[]
    completedBy?: string;
    dueDate?: Date | string;
    householdId: string;
    isRecurring?: boolean;
    recurrenceInterval?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

interface PopulatedAssignment {
    _id: string;
    displayName: string;
    profileColor?: string;
}

interface PopulatedTask extends Omit<Task, 'assignedTo'> {
    assignedTo: PopulatedAssignment[];
}

/**
 * Type guard to check if a task's assignedTo field is already populated
 */
export function isTaskAssignmentPopulated(task: Task): task is PopulatedTask {
    if (!task.assignedTo || task.assignedTo.length === 0) {
        return false;
    }
    const firstAssignment = task.assignedTo[0];
    return typeof firstAssignment === 'object' &&
        firstAssignment !== null &&
        '_id' in firstAssignment &&
        'displayName' in firstAssignment;
}

/**
 * Manually populate assignedTo field with member profile details
 * 
 * @param tasks - Single task or array of tasks to populate
 * @param memberProfiles - Array of member profiles from household
 * @returns Tasks with populated assignedTo field
 * 
 * @example
 * const tasks = await fetch('/api/tasks');
 * const household = await fetch('/api/households');
 * const populatedTasks = populateTaskAssignments(
 *   tasks.data.tasks,
 *   household.data.memberProfiles
 * );
 */
export function populateTaskAssignments(
    tasks: Task | Task[],
    memberProfiles: MemberProfile[]
): PopulatedTask | PopulatedTask[] {
    // Handle both single task and array of tasks
    const isArray = Array.isArray(tasks);
    const taskArray = isArray ? tasks : [tasks];

    // Map each task to populate its assignedTo field
    const populatedTasks = taskArray.map(task => {
        // Handle case where assignedTo might already be populated
        if (isTaskAssignmentPopulated(task)) {
            // Already populated, return as-is
            return task;
        }

        // Map each assignedTo ID to member profile details
        const assignments = (task.assignedTo || [])
            .map(assignedId => {
                // Find the member profile matching this ID
                const member = memberProfiles.find(
                    profile => profile._id.toString() === assignedId.toString()
                );

                if (!member) {
                    // Log warning but don't fail - task might be assigned to deleted member
                    logger.warn(`[populateTaskAssignments] Member profile not found for ID: ${assignedId} in task ${task._id}`);
                    return null;
                }

                // Return the populated assignment object
                const populated: PopulatedAssignment = {
                    _id: member._id.toString(),
                    displayName: member.displayName || 'Unknown',
                    profileColor: member.profileColor
                };
                return populated;
            });

        // Filter out nulls
        const populatedAssignedTo = assignments.filter((a): a is NonNullable<typeof a> => a !== null);

        // Return the task with populated assignedTo
        const result: PopulatedTask = {
            ...task,
            assignedTo: populatedAssignedTo
        };
        return result;
    });

    // Return in the same format as input (single or array)
    return isArray ? populatedTasks : populatedTasks[0];
}
