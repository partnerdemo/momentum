import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Dimensions, Alert, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { bentoPalette, spacing, borderRadius, shadows, typography, animations } from '../../theme/bentoTokens';
import { LogIn, Mail, ArrowRight, Github } from 'lucide-react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { logger } from '../../utils/logger';
import { tryGoogleSignIn } from '../../utils/googleSigninWrapper';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

export default function SignupOptionsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    logger.info('Starting Google Sign-In...');
    try {
      const GoogleSignin = tryGoogleSignIn();
      if (!GoogleSignin) {
        Alert.alert('Error', 'Google Sign-In is not available on this device.');
        return;
      }
      await GoogleSignin.hasPlayServices();
      
      // Force account picker by signing out first if already signed in
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        logger.info('Not signed in or failed to sign out:', signOutError);
      }
      
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (idToken) {
        logger.info('Google Success. Sending to backend:', idToken.substring(0, 10) + '...');
        await googleLogin(idToken);
      } else {
        throw new Error('No ID token received from Google');
      }
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop' }}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require('../../../assets/icon.png')} style={styles.logo} />
              </View>
              <Text style={styles.title}>Momentum</Text>
              <Text style={styles.subtitle}>Unified Family Management</Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.googleButton]} 
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Image source={require('../../../assets/adaptive-icon.png')} style={styles.socialIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
                {isLoading ? <ArrowRight size={20} color={bentoPalette.textPrimary} /> : null}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.emailButton]} 
                onPress={() => navigation.navigate('Register')}
              >
                <Mail size={20} color={bentoPalette.surface} style={styles.socialIcon} />
                <Text style={styles.emailButtonText}>Sign up with Email</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Already have an account?</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={[styles.button, styles.loginButton]} 
                onPress={() => navigation.navigate('Login')}
              >
                <LogIn size={20} color={bentoPalette.brandPrimary} style={styles.socialIcon} />
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>By continuing, you agree to our</Text>
              <View style={styles.footerLinks}>
                <Text style={styles.footerLink}>Terms of Service</Text>
                <Text style={styles.footerText}> & </Text>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bentoPalette.canvas,
  },
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.huge,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xxl,
    backgroundColor: bentoPalette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: typography.heroGreeting.fontFamily,
    fontSize: typography.heroGreeting.fontSize,
    color: bentoPalette.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    color: bentoPalette.textSecondary,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.md,
  },
  googleButton: {
    backgroundColor: bentoPalette.surface,
  },
  googleButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: bentoPalette.textPrimary,
  },
  emailButton: {
    backgroundColor: bentoPalette.brandPrimary,
  },
  emailButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: bentoPalette.surface,
  },
  loginButton: {
    backgroundColor: bentoPalette.surface,
    borderWidth: 1,
    borderColor: bentoPalette.brandPrimary,
  },
  loginButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: bentoPalette.brandPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: bentoPalette.textTertiary,
    opacity: 0.3,
  },
  dividerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: bentoPalette.textTertiary,
    marginHorizontal: spacing.md,
    textTransform: 'none',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: bentoPalette.textTertiary,
  },
  footerLinks: {
    flexDirection: 'row',
    marginTop: 4,
  },
  footerLink: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: bentoPalette.brandPrimary,
    textDecorationLine: 'underline',
  },
});
