import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

export function configureGoogleSignIn() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    || Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    || '586333342003-i7t3b613209bhfp4abnd8fti80t52r38.apps.googleusercontent.com';

  GoogleSignin.configure({ webClientId, offlineAccess: true });
}
