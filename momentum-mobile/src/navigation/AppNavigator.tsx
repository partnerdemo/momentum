import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SignupOptionsScreen from '../screens/auth/SignupOptionsScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import FamilyBentoScreen from '../screens/family/FamilyBentoScreen';
import ParentScreen from '../screens/parent/ParentScreen';
import MemberDetailScreen from '../screens/family/MemberDetailScreen';
import MemberStoreScreen from '../screens/family/MemberStoreScreen';
import SharingSettingsScreen from '../screens/household/SharingSettingsScreen';
import { NotificationCenterScreen } from '../screens/notifications/NotificationCenterScreen';
import ParentCalendarScreen from '../screens/calendar/ParentCalendarScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        user?.onboardingCompleted === false ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Family" component={FamilyBentoScreen} />
            <Stack.Screen name="Parent" component={ParentScreen} />
            <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
            <Stack.Screen name="MemberStore" component={MemberStoreScreen} />
            <Stack.Screen name="SharingSettings" component={SharingSettingsScreen} />
            <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
            <Stack.Screen name="ParentCalendar" component={ParentCalendarScreen} />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="SignupOptions" component={SignupOptionsScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});
