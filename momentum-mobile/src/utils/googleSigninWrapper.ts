import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function tryGoogleSignIn() {
  try {
    return GoogleSignin;
  } catch {
    return null;
  }
}
