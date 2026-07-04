// =========================================================
// silkpanda/momentum/app/web-bff/meals/page-data/route.ts
// EMBEDDED WEB BFF
// Aggregates all data for the "Meals" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const RECIPES_API_URL = `${API_BASE_URL}/meals/recipes`;
const RESTAURANTS_API_URL = `${API_BASE_URL}/meals/restaurants`;
const MEAL_PLANS_API_URL = `${API_BASE_URL}/meals/plans`;

export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const [recipesRes, restaurantsRes, mealPlansRes] = await Promise.all([
            fetch(RECIPES_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(RESTAURANTS_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(MEAL_PLANS_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        if (!recipesRes.ok) throw new Error('Failed to fetch recipes');
        if (!restaurantsRes.ok) throw new Error('Failed to fetch restaurants');
        if (!mealPlansRes.ok) throw new Error('Failed to fetch meal plans');

        const recipesData = await recipesRes.json();
        const restaurantsData = await restaurantsRes.json();
        const mealPlansData = await mealPlansRes.json();

        return NextResponse.json({
            recipes: recipesData.data.recipes || [],
            restaurants: restaurantsData.data.restaurants || [],
            mealPlans: mealPlansData.data.mealPlans || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch meals page data', error: err.message }, { status: 500 });
    }
}
