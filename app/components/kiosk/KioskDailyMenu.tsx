import React from 'react';
import { Utensils, Sun, Pizza, Coffee } from 'lucide-react';
import { IMealPlan } from '../../types';

interface KioskDailyMenuProps {
    mealPlans?: IMealPlan[];
}

export default function KioskDailyMenu({ mealPlans }: KioskDailyMenuProps) {
    // For now we map static layout, dynamically using mealPlans when available
    return (
        <section className="mb-12 bg-white rounded-2xl p-6 bento-card-shadow border-2 border-orange-200/20">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-4 border-r border-gray-200 pr-12">
                    <div className="w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <Utensils className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900">Daily Menu</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Fuel for the family</p>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-8">
                    {/* Breakfast */}
                    <div className="flex items-center gap-5 bg-gray-50 rounded-lg p-5 border-l-8 border-orange-500">
                        <Sun className="text-orange-500 w-8 h-8" />
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Breakfast</p>
                            <p className="font-bold text-lg text-gray-900">Blueberry Pancakes</p>
                        </div>
                    </div>
                    
                    {/* Lunch */}
                    <div className="flex items-center gap-5 bg-gray-50 rounded-lg p-5 border-l-8 border-green-600">
                        <Pizza className="text-green-600 w-8 h-8" />
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lunch</p>
                            <p className="font-bold text-lg text-gray-900">Quinoa Power Bowls</p>
                        </div>
                    </div>
                    
                    {/* Dinner */}
                    <div className="flex items-center gap-5 bg-gray-50 rounded-lg p-5 border-l-8 border-blue-600">
                        <Coffee className="text-blue-600 w-8 h-8" />
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dinner</p>
                            <p className="font-bold text-lg text-gray-900">Homemade Lasagna</p>
                        </div>
                    </div>
                </div>

                <button className="px-10 py-4 rounded-full bg-orange-100 text-orange-800 font-bold hover:bg-orange-200 transition-all text-lg border border-orange-200 cursor-pointer">
                    Full Weekly Menu
                </button>
            </div>
        </section>
    );
}
