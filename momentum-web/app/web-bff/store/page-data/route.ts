// =========================================================
// silkpanda/momentum/app/web-bff/store/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Manage Store" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

// Internal API URLs
const STORE_API_URL = `${API_BASE_URL}/store-items`;
const HOUSEHOLD_API_URL = `${API_BASE_URL}/households`;

/**
 * @desc    Get all data for the Store management page
 * @route   GET /web-bff/store/page-data
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
        const [itemResponse, householdResponse] = await Promise.all([
            fetch(STORE_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(HOUSEHOLD_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        if (!itemResponse.ok) throw new Error('Failed to fetch store items');
        if (!householdResponse.ok) throw new Error('Failed to fetch household data');

        const itemData = await itemResponse.json();
        const householdData = await householdResponse.json();

        // 2. Aggregate and return the combined data
        return NextResponse.json({
            storeItems: itemData.data.storeItems || [],
            memberProfiles: householdData.data.memberProfiles || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch store page data', error: err.message }, { status: 500 });
    }
}