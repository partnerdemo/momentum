// =========================================================
// silkpanda/momentum/momentum-f93a728fe5c8fecb2f9f6bbd2c2a49cf91a087f2/app/components/layout/SessionContext.tsx
// Creates a React Context to share user/household data.
// =========================================================
'use client';

import { createContext, useContext } from 'react';

// Define the shape of the data we will share
export interface UserData {
    _id: string;
    firstName: string;
    lastName?: string;
    role: 'Parent' | 'Child';
    email?: string;
}

export interface SessionData {
    user: UserData | null;
    householdId: string | null;
    token: string | null;
    isLoading: boolean;
}

// Create the context with a default value
export const SessionContext = createContext<SessionData>({
    user: null,
    householdId: null,
    token: null,
    isLoading: true,
});

// Create a custom hook for easy consumption by child components
export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a DashboardLayout');
    }
    return context;
};