import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { bentoPalette, spacing, borderRadius, typography, shadows } from '../../theme/bentoTokens';
import { User, Mail, KeyRound, ArrowLeft, ChevronRight, Home, UserCircle } from 'lucide-react-native';

export default function RegisterScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    householdName: '',
    userDisplayName: '',
    userProfileColor: '#6366f1',
    role: 'Parent' as const,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const { firstName, lastName, email, password, householdName, userDisplayName } = formData;
    
    if (!firstName || !lastName || !email || !password || !householdName || !userDisplayName) {
      Alert.alert('Missing Info', 'Please fill in all fields to create your account.');
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      // Navigation is automatic via AuthContext state -> Onboarding
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Could not create account');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={bentoPalette.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join Momentum</Text>
            <Text style={styles.subtitle}>Start your family's productivity journey</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Jane"
                    value={formData.firstName}
                    onChangeText={(v) => updateField('firstName', v)}
                  />
                </View>
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    value={formData.lastName}
                    onChangeText={(v) => updateField('lastName', v)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={bentoPalette.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="jane@doe.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(v) => updateField('email', v)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Household Name</Text>
              <View style={styles.inputWrapper}>
                <Home size={18} color={bentoPalette.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="The Doe Household"
                  value={formData.householdName}
                  onChangeText={(v) => updateField('householdName', v)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Display Name</Text>
              <View style={styles.inputWrapper}>
                <UserCircle size={18} color={bentoPalette.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mom / Dad / Jane"
                  value={formData.userDisplayName}
                  onChangeText={(v) => updateField('userDisplayName', v)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <KeyRound size={18} color={bentoPalette.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 8 characters"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(v) => updateField('password', v)}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={bentoPalette.surface} />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <ChevronRight size={20} color={bentoPalette.surface} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already part of a family?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
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
    paddingBottom: spacing.huge,
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
    marginBottom: spacing.xxl,
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
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.textPrimary,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
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
  registerButton: {
    flexDirection: 'row',
    backgroundColor: bentoPalette.brandPrimary,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    color: bentoPalette.surface,
    marginRight: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  footerText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.textSecondary,
  },
  loginLink: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.brandPrimary,
    fontWeight: '700',
  },
});
