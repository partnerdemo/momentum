import React from 'react';
import { PartyPopper, CalendarDays } from 'lucide-react';

export default function KioskBottomRow() {
    return (
        <div className="grid grid-cols-12 gap-10 mt-12 pb-24">
            {/* Milestone Banner */}
            <div className="col-span-8 bg-green-200/30 rounded-2xl p-10 flex justify-between items-center bento-card-shadow border-2 border-green-200/50">
                <div className="flex items-center gap-10">
                    <div className="bg-green-600 p-8 rounded-full text-white shadow-xl shadow-green-600/20">
                        <PartyPopper className="w-12 h-12" />
                    </div>
                    <div>
                        <h4 className="text-4xl font-black text-green-600 mb-2">Family Milestone Reached!</h4>
                        <p className="text-green-900 text-2xl font-medium">
                            100 tasks completed together this month. Reward: <span className="font-bold text-green-600">Pizza Night! 🍕</span>
                        </p>
                    </div>
                </div>
                <button className="px-12 py-6 bg-green-600 text-white font-black rounded-full hover:scale-105 active:scale-95 transition-all text-xl shadow-xl shadow-green-600/30 cursor-pointer">
                    Claim Your Reward
                </button>
            </div>
            
            {/* Family Calendar/Event */}
            <div className="col-span-4 bg-orange-200/20 rounded-2xl p-10 bento-card-shadow flex items-center gap-8 border-2 border-orange-200/30">
                <div className="bg-orange-500 text-white min-w-20 w-20 h-20 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/20">
                    <CalendarDays className="w-10 h-10" />
                </div>
                <div>
                    <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Next Family Event</p>
                    <p className="text-3xl font-black text-gray-900">Game Night @ 7:00 PM</p>
                    <p className="text-gray-600 font-medium mt-1">Living Room • All Invited</p>
                </div>
            </div>
        </div>
    );
}
