// =========================================================
// silkpanda/momentum/app/web-bff/quests/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Quests" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

// Internal API URLs
const QUESTS_API_URL = `${API_BASE_URL}/quests`;
const HOUSEHOLD_API_URL = `${API_BASE_URL}/households`;

/**
 * @desc    Get all data for the Quests page
 * @route   GET /web-bff/quests/page-data
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
        const [questsResponse, householdResponse] = await Promise.all([
            fetch(QUESTS_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(HOUSEHOLD_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        if (!questsResponse.ok) throw new Error('Failed to fetch quests');
        if (!householdResponse.ok) throw new Error('Failed to fetch household data');

        const questsData = await questsResponse.json();
        const householdData = await householdResponse.json();

        // 2. Aggregate and return the combined data
        return NextResponse.json({
            quests: questsData.data.quests || [],
            memberProfiles: householdData.data.memberProfiles || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch quests page data', error: err.message }, { status: 500 });
    }
}
