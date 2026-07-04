import React from 'react';
import { Sun } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { useTheme } from '../layout/ThemeContext';

export default function KioskHeader() {
    const { user } = useSession();
    const { currentTheme } = useTheme();
    const isDark = currentTheme.id === 'darkMode';
    
    // Get formatted time and date natively
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const [time, period] = timeString.split(' ');
    
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString(undefined, dateOptions);

    return (
        <header className="relative h-64 rounded-[32px] overflow-hidden mb-12 shadow-[0_30px_60px_-15px_rgba(30,27,75,0.4)] border border-white/10 group">
            {/* Background Layer: Deep Premium Unified Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-indigo-950 via-slate-900 to-blue-950' : 'from-indigo-600 via-indigo-500 to-purple-600'} transition-all duration-700 ease-in-out group-hover:scale-105`} />
            
            {/* Ambient Glows */}
            <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[150%] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

            {/* Inner Content Container (Glassmorphic Window) */}
            <div className="absolute inset-3 rounded-[24px] bg-white/5 backdrop-blur-sm border border-white/10 p-10 flex justify-between items-center z-10 shadow-inner">
                
                {/* Left Side: Family & Date */}
                <div className="flex flex-col justify-center h-full">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
                            <span className="text-sm font-black text-white/90 uppercase tracking-[0.2em]">{dateString}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-1.5 rounded-full border border-amber-500/30 shadow-sm">
                            <Sun className="text-amber-400 w-5 h-5 fill-current" />
                            <span className="text-sm font-bold text-amber-100 tracking-wider">72° Sunny</span>
                        </div>
                    </div>
                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                        {user?.lastName || 'The Family'} Hub
                    </h2>
                    <p className="text-indigo-200/80 text-xl font-medium tracking-wide mt-2">
                        Let's make today a great day.
                    </p>
                </div>

                {/* Right Side: Giant Clock */}
                <div className="flex flex-col items-end justify-center h-full text-right">
                    <h1 className="text-[100px] leading-none font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] tabular-nums tracking-tighter">
                        {time}<span className="text-5xl font-medium ml-3 text-white/50">{period}</span>
                    </h1>
                    <div className="mt-4 flex items-center gap-3 bg-white/10 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        <span className="text-sm font-black text-white uppercase tracking-[0.3em]">Active Status</span>
                    </div>
                </div>

            </div>
        </header>
    );
}
