import React from 'react';
import { Utensils, Sun, Pizza, Coffee } from 'lucide-react';
import { IMealPlan } from '../../types';

interface KioskDailyMenuProps {
    mealPlans?: IMealPlan[];
    onViewWeeklyMenu: () => void;
}

export default function KioskDailyMenu({ mealPlans, onViewWeeklyMenu }: KioskDailyMenuProps) {
    // 1. Calculate today's date in robust YYYY-MM-DD format (timezone independent)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayString = `${yyyy}-${mm}-${dd}`;

    // 2. Find the active weekly meal plan containing today
    const activePlan = mealPlans?.find(plan => {
        const sDate = plan.startDate ? plan.startDate.split('T')[0] : '';
        const eDate = plan.endDate ? plan.endDate.split('T')[0] : '';
        return todayString >= sDate && todayString <= eDate;
    });

    const hasPlan = !!activePlan;

    // 3. Find today's meal entries
    const todayMeals = activePlan?.meals?.filter(meal => {
        const mealDate = meal.date ? (typeof meal.date === 'string' ? meal.date.split('T')[0] : new Date(meal.date).toISOString().split('T')[0]) : '';
        return mealDate === todayString;
    }) || [];

    const breakfastMeal = todayMeals.find(m => m.mealType === 'Breakfast');
    const lunchMeal = todayMeals.find(m => m.mealType === 'Lunch');
    const dinnerMeal = todayMeals.find(m => m.mealType === 'Dinner');

    const breakfastTitle = breakfastMeal?.customTitle || breakfastMeal?.itemId?.name;
    const lunchTitle = lunchMeal?.customTitle || lunchMeal?.itemId?.name;
    const dinnerTitle = dinnerMeal?.customTitle || dinnerMeal?.itemId?.name;

    // 4. Resolve displays with dynamic / premium defaults
    const breakfastDisplay = breakfastTitle || (hasPlan ? 'Not planned yet' : 'Blueberry Pancakes');
    const lunchDisplay = lunchTitle || (hasPlan ? 'Not planned yet' : 'Quinoa Power Bowls');
    const dinnerDisplay = dinnerTitle || (hasPlan ? 'Not planned yet' : 'Homemade Lasagna');

    return (
        <section className="mb-12 bg-bg-surface text-text-primary rounded-2xl p-6 bento-card-shadow border-2 border-orange-200/20">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-4 border-r border-border-subtle pr-12">
                    <div className="w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <Utensils className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-text-primary">Daily Menu</h3>
                        <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">
                            {hasPlan ? 'Freshly Planned' : 'Fuel for the family'}
                        </p>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-8">
                    {/* Breakfast */}
                    <div className="flex items-center gap-5 bg-bg-canvas rounded-lg p-5 border-l-8 border-orange-500">
                        <Sun className="text-orange-500 w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Breakfast</p>
                            <p className={`font-bold text-lg ${breakfastTitle ? 'text-text-primary' : 'text-text-secondary italic'}`}>
                                {breakfastDisplay}
                            </p>
                        </div>
                    </div>
                    
                    {/* Lunch */}
                    <div className="flex items-center gap-5 bg-bg-canvas rounded-lg p-5 border-l-8 border-green-600">
                        <Pizza className="text-green-600 w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Lunch</p>
                            <p className={`font-bold text-lg ${lunchTitle ? 'text-text-primary' : 'text-text-secondary italic'}`}>
                                {lunchDisplay}
                            </p>
                        </div>
                    </div>
                    
                    {/* Dinner */}
                    <div className="flex items-center gap-5 bg-bg-canvas rounded-lg p-5 border-l-8 border-blue-600">
                        <Coffee className="text-blue-600 w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Dinner</p>
                            <p className={`font-bold text-lg ${dinnerTitle ? 'text-text-primary' : 'text-text-secondary italic'}`}>
                                {dinnerDisplay}
                            </p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onViewWeeklyMenu}
                    className="px-10 py-4 rounded-full bg-orange-100 text-orange-800 font-bold hover:bg-orange-200 transition-all text-lg border border-orange-200 cursor-pointer hover:scale-105 active:scale-95 duration-200"
                >
                    Full Weekly Menu
                </button>
            </div>
        </section>
    );
}
