import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { bentoPalette, spacing, borderRadius, typography, shadows } from '../../theme/bentoTokens';
import { KeyRound, Mail, ArrowLeft, ChevronRight } from 'lucide-react-native';

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Navigation is handled by AuthContext state change in AppNavigator
    } catch (error: any) {
      Alert.alert('Login failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={bentoPalette.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to manage your household</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={bentoPalette.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={bentoPalette.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <KeyRound size={20} color={bentoPalette.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={bentoPalette.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={bentoPalette.surface} />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Log In</Text>
                  <ChevronRight size={20} color={bentoPalette.surface} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bentoPalette.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: bentoPalette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
    marginBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxxl,
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
  },
  form: {
    gap: spacing.xl,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.textPrimary,
    fontWeight: '600',
  },
  forgotText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.brandPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
    ...shadows.soft,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    color: bentoPalette.textPrimary,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: bentoPalette.brandPrimary,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: bentoPalette.surface,
    marginRight: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxl,
    gap: spacing.xs,
  },
  footerText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.textSecondary,
  },
  signupText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.brandPrimary,
    fontWeight: '700',
  },
});
