// =========================================================
// silkpanda/momentum/app/web-bff/members/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Manage Members" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { populateTaskAssignments } from '../../../utils/populateTaskAssignments';

// Internal API URLs
const HOUSEHOLD_API_URL = `${API_BASE_URL}/households`;
const TASK_API_URL = `${API_BASE_URL}/tasks`;

/**
 * @desc    Get all data for the Member management page
 * @route   GET /web-bff/members/page-data
 * @access  Private (via DashboardLayout)
 */
export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        // 1. Make parallel calls to the internal 'momentum-api'
        const [householdResponse, taskResponse] = await Promise.all([
            fetch(HOUSEHOLD_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(TASK_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        if (!householdResponse.ok) throw new Error('Failed to fetch household data');
        if (!taskResponse.ok) throw new Error('Failed to fetch task data');

        const householdData = await householdResponse.json();
        const taskData = await taskResponse.json();

        // Populate task assignments with member details
        const memberProfiles = householdData.data.memberProfiles || [];
        const populatedTasks = taskData.data.tasks
            ? populateTaskAssignments(taskData.data.tasks, memberProfiles)
            : [];

        // 2. Aggregate and return the combined data
        return NextResponse.json({
            memberProfiles: memberProfiles,
            tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch member page data', error: err.message }, { status: 500 });
    }
}