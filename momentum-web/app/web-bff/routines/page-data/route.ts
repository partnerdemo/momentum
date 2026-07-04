// =========================================================
// silkpanda/momentum/app/web-bff/routines/page-data/route.ts
// EMBEDDED WEB BFF
// Aggregates all data for the "Routines" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const ROUTINES_API_URL = `${API_BASE_URL}/routines`;
const HOUSEHOLD_API_URL = `${API_BASE_URL}/households`;

export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const [routinesResponse, householdResponse] = await Promise.all([
            fetch(ROUTINES_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(HOUSEHOLD_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        if (!routinesResponse.ok) throw new Error('Failed to fetch routines');
        if (!householdResponse.ok) throw new Error('Failed to fetch household data');

        const routinesData = await routinesResponse.json();
        const householdData = await householdResponse.json();

        return NextResponse.json({
            routines: routinesData.data.routines || [],
            memberProfiles: householdData.data.memberProfiles || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch routines page data', error: err.message }, { status: 500 });
    }
}
