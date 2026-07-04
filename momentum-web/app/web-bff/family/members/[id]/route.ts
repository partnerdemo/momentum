// =========================================================
// silkpanda/momentum/app/web-bff/members/[id]/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles updating (PATCH) and deleting (DELETE) a member profile
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

/**
 * @desc    Update a member profile
 * @route   PATCH /web-bff/members/:id
 * @access  Private
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: memberProfileId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        // 1. Read the full body from the client
        const body = await req.json();
        const { householdId, ...memberData } = body;

        // 2. Validate the BFF request
        if (!householdId) {
            return NextResponse.json({ message: 'BFF Error: householdId is missing from the request body' }, { status: 400 });
        }

        // 3. Construct the correct internal API URL
        const API_URL = `${API_BASE_URL}/households/${householdId}/members/${memberProfileId}`;

        const apiResponse = await fetch(API_URL, {
            method: 'PATCH',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(memberData), // 4. Forward only the member data
        });

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to update member', error: err.message }, { status: 500 });
    }
}

/**
 * @desc    Delete a member profile
 * @route   DELETE /web-bff/members/:id
 * @access  Private
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: memberProfileId } = params;

    // 1. Get householdId from query params
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    if (!householdId) {
        return NextResponse.json({ message: 'BFF Error: householdId is missing from query parameters' }, { status: 400 });
    }

    // 2. Construct the correct internal API URL
    const API_URL = `${API_BASE_URL}/households/${householdId}/members/${memberProfileId}`;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Authorization': authorization,
            },
        });

        // DELETE often returns 204 No Content, which has no JSON body
        if (apiResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to delete member', error: err.message }, { status: 500 });
    }
}