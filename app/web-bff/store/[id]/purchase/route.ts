import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export async function POST(
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
        const { memberId } = body;

        if (!memberId) {
            return NextResponse.json({ message: 'Member ID is required' }, { status: 400 });
        }

        const response = await fetch(`${API_BASE_URL}/store-items/${params.id}/purchase`, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ memberId }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[BFF] Purchase store item error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}