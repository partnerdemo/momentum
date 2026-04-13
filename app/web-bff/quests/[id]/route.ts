// =========================================================
// silkpanda/momentum/app/web-bff/quests/[id]/route.ts
// EMBEDDED WEB BFF
// Handle individual quest operations (Update)
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '../../../../lib/config';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = params;

        const response = await fetch(`${API_BASE_URL}/quests/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to update quest' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const { id } = params;

        const response = await fetch(`${API_BASE_URL}/quests/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json({ message: data.message || 'Failed to delete quest' }, { status: response.status });
        }

        return new NextResponse(null, { status: 204 });

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
