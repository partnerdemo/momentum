// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
    // Auth
    Login: undefined;
    Register: undefined;
    SignupOptions: undefined;
    Onboarding: undefined;
    
    // Main App
    Family: undefined;
    Parent: undefined;
    MemberDetail: { memberId: string };
    MemberStore: { memberId: string };
    ParentCalendar: undefined;
    SharingSettings: undefined;
    NotificationCenter: undefined;
};
