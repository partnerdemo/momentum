// =========================================================
// silkpanda/momentum/app/web-bff/members/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles creating a new member (POST)
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

/**
 * @desc    Create a new household member
 * @route   POST /web-bff/members
 * @access  Private
 */
export async function POST(req: Request) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { householdId, ...memberData } = body;

        if (!householdId) {
            return NextResponse.json({ message: 'BFF Error: householdId is missing from the request body' }, { status: 400 });
        }

        // Construct the internal API URL, as required by the household controller
        const API_URL = `${API_BASE_URL}/households/${householdId}/members`;

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(memberData), // Send only the member data
        });

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to create member', error: err.message }, { status: 500 });
    }
}