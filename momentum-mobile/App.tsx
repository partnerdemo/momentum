import 'react-native-gesture-handler';
// Sentry must initialize BEFORE any other module so error boundaries and
// instrumentation can hook into React/RN. No-op if EXPO_PUBLIC_SENTRY_DSN unset.
import { initSentry } from './src/config/sentry';
initSentry();

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as ScreenOrientation from 'expo-screen-orientation';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { DataProvider } from './src/contexts/DataContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
// We'll add NotificationManager later once it's built
// import { NotificationManager } from './src/components/notifications/NotificationManager';
import { configureGoogleSignIn } from './src/config/googleSignIn';
import { SocketProvider } from './src/contexts/SocketContext';

// Initialize Google Sign-In configuration
configureGoogleSignIn();

const isTablet = () => {
  const { width, height } = require('react-native').Dimensions.get('window');
  const minDimension = Math.min(width, height);
  return minDimension >= 600;
};

export default function App() {
  useEffect(() => {
    async function lockOrientation() {
      if (isTablet()) {
        await ScreenOrientation.unlockAsync();
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    }
    lockOrientation();
  }, []);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Wrapped without NotificationManager for now, will add back in Phase 3
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <ThemeProvider>
    <NavigationContainer>
      <AuthProvider>
        <SocketProvider>
          <DataProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </DataProvider>
        </SocketProvider>
      </AuthProvider>
    </NavigationContainer>
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
