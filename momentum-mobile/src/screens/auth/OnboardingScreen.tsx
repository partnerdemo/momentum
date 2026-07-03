import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { bentoPalette, spacing, borderRadius, typography, shadows } from '../../theme/bentoTokens';
import { User, Check, Palette, Smartphone, Calendar, Lock } from 'lucide-react-native';
import { api } from '../../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

export default function OnboardingScreen() {
  const { user, householdId, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.firstName || '');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [pin, setPin] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.firstName) setDisplayName(user.firstName);
  }, [user]);

  const handleComplete = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!pin || pin.length < 4) {
      Alert.alert('PIN Required', 'Please set a 4-digit PIN for your account security.');
      return;
    }

    setIsLoading(true);
    try {
      await api.completeOnboarding({
        userId: user?.id || '',
        householdId: householdId || '',
        displayName,
        profileColor: selectedColor,
        pin,
      });
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <User size={40} color={bentoPalette.brandPrimary} />
            </View>
            <Text style={styles.stepTitle}>Let's personalize your profile</Text>
            <Text style={styles.stepDescription}>This is how your family will see you in the app.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Manager / Mom / Jane"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Profile Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorSelected]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && <Check size={20} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Lock size={40} color={bentoPalette.brandPrimary} />
            </View>
            <Text style={styles.stepTitle}>Secure your profile</Text>
            <Text style={styles.stepDescription}>Set a 4-digit PIN. You'll use this to switch profiles on shared devices.</Text>
            
            <View style={styles.pinContainer}>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                placeholder="----"
                textAlign="center"
              />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Check size={40} color={bentoPalette.success} />
            </View>
            <Text style={styles.stepTitle}>You're all set!</Text>
            <Text style={styles.stepDescription}>Welcome to Momentum. Your unified family dashboard is ready.</Text>
            
            <View style={styles.summaryCard}>
              <View style={[styles.summaryAvatar, { backgroundColor: selectedColor }]}>
                <Text style={styles.summaryAvatarText}>{displayName.charAt(0)}</Text>
              </View>
              <Text style={styles.summaryName}>{displayName}</Text>
              <Text style={styles.summaryRole}>Parent Admin</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map(s => (
            <View 
              key={s} 
              style={[styles.progressBar, s <= step ? styles.progressBarActive : styles.progressBarInactive]} 
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {renderStep()}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.nextButton, isLoading && styles.buttonDisabled]} 
          onPress={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 3 ? 'Get Started' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  content: { flex: 1, padding: spacing.xl },
  progressContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxxl },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressBarActive: { backgroundColor: bentoPalette.brandPrimary },
  progressBarInactive: { backgroundColor: bentoPalette.textTertiary, opacity: 0.2 },
  scroll: { flexGrow: 1 },
  stepContainer: { alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: bentoPalette.surface, justifyContent: 'center', alignItems: 'center', ...shadows.soft, marginBottom: spacing.xl },
  stepTitle: { fontFamily: typography.heroGreeting.fontFamily, fontSize: 24, color: bentoPalette.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  stepDescription: { fontFamily: typography.body.fontFamily, fontSize: 16, color: bentoPalette.textSecondary, textAlign: 'center', marginBottom: spacing.xxxl },
  inputContainer: { width: '100%', marginBottom: spacing.xl },
  label: { fontFamily: typography.body.fontFamily, fontSize: 14, fontWeight: '600', color: bentoPalette.textPrimary, marginBottom: spacing.sm },
  input: { backgroundColor: bentoPalette.surface, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: bentoPalette.textPrimary, ...shadows.soft },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  colorOption: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: bentoPalette.brandPrimary },
  pinContainer: { width: 200, height: 80, backgroundColor: bentoPalette.surface, borderRadius: borderRadius.md, justifyContent: 'center', ...shadows.soft },
  pinInput: { fontSize: 32, letterSpacing: 10, color: bentoPalette.textPrimary },
  summaryCard: { width: '100%', backgroundColor: bentoPalette.surface, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', ...shadows.soft },
  summaryAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  summaryAvatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  summaryName: { fontSize: 20, fontWeight: '700', color: bentoPalette.textPrimary },
  summaryRole: { fontSize: 14, color: bentoPalette.textSecondary },
  nextButton: { height: 56, backgroundColor: bentoPalette.brandPrimary, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl, ...shadows.soft },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.7 },
});
