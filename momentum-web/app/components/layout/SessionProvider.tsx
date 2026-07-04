// =========================================================
// momentum-web/app/components/layout/SessionProvider.tsx
// Session Provider - Manages authentication state
// =========================================================
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { SessionContext, UserData } from './SessionContext';

export function SessionProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('[SessionProvider] Initializing');

        const loadSession = () => {
            // Load token from localStorage
            const storedToken = localStorage.getItem('momentum_token');
            console.log('[SessionProvider] Stored token:', !!storedToken);

            if (storedToken) {
                if (storedToken === 'mock_development_token') {
                    console.log('[SessionProvider] Dev Mode: Loading mock developer session');
                    setToken('mock_development_token');
                    setUser({
                        _id: 'mock-parent-id-1',
                        firstName: 'Sarah',
                        role: 'Parent',
                    });
                    setHouseholdId('mock-household-id');
                    setIsLoading(false);
                    return;
                }

                setToken(storedToken);

                // Fetch user data
                console.log('[SessionProvider] Fetching user data');
                fetch('/web-bff/auth/me', {
                    headers: { 'Authorization': `Bearer ${storedToken}` }
                })
                    .then(res => {
                        console.log('[SessionProvider] Auth response status:', res.status);
                        if (!res.ok) throw new Error('Auth failed');
                        return res.json();
                    })
                    .then(data => {
                        console.log('[SessionProvider] User data received:', data);
                        // API returns { status: "success", data: { user, householdId } }
                        if (data.data && data.data.user && data.data.householdId) {
                            console.log('[SessionProvider] Setting user:', data.data.user);
                            setUser(data.data.user);
                            setHouseholdId(data.data.householdId);
                        } else {
                            console.error('[SessionProvider] Invalid data structure:', data);
                        }
                    })
                    .catch(err => {
                        console.error('[SessionProvider] Error fetching user:', err);
                        if (process.env.NODE_ENV === 'development') {
                            console.log('[SessionProvider] Dev Mode: Backend unreachable, falling back to mock session');
                            localStorage.setItem('momentum_token', 'mock_development_token');
                            setToken('mock_development_token');
                            setUser({
                                _id: 'mock-parent-id-1',
                                firstName: 'Sarah',
                                role: 'Parent',
                            });
                            setHouseholdId('mock-household-id');
                        } else {
                            // Clear invalid token in production
                            localStorage.removeItem('momentum_token');
                            setToken(null);
                            setUser(null);
                            setHouseholdId(null);
                        }
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } else {
                console.log('[SessionProvider] No token found');
                if (process.env.NODE_ENV === 'development') {
                    console.log('[SessionProvider] Dev Mode: Initializing mock developer session');
                    localStorage.setItem('momentum_token', 'mock_development_token');
                    setToken('mock_development_token');
                    setUser({
                        _id: 'mock-parent-id-1',
                        firstName: 'Sarah',
                        role: 'Parent',
                    });
                    setHouseholdId('mock-household-id');
                    setIsLoading(false);
                } else {
                    setToken(null);
                    setUser(null);
                    setHouseholdId(null);
                    setIsLoading(false);
                }
            }
        };

        // Load session on mount
        loadSession();

        // Listen for storage changes (logout in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'momentum_token') {
                console.log('[SessionProvider] Storage changed, reloading session');
                loadSession();
            }
        };

        // Listen for custom login event
        const handleLoginEvent = () => {
            console.log('[SessionProvider] Login event received, reloading session');
            loadSession();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('momentum_login', handleLoginEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('momentum_login', handleLoginEvent);
        };
    }, []);

    console.log('[SessionProvider] Rendering - user:', !!user, 'token:', !!token, 'householdId:', householdId);

    return (
        <SessionContext.Provider value={{ user, householdId, token, isLoading }}>
            {children}
        </SessionContext.Provider>
    );
}
