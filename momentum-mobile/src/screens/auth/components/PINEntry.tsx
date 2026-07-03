import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Alert } from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../../theme/bentoTokens';
import { PINKeypad } from './PINKeypad';
import { Shield, ArrowLeft } from 'lucide-react-native';

interface PINEntryProps {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  error?: string;
}

export function PINEntry({ title, subtitle, onComplete, onCancel, error: externalError }: PINEntryProps) {
  const [pin, setPin] = useState('');
  const [shake] = useState(new Animated.Value(0));

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        onComplete(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (externalError) {
      triggerShake();
      setPin('');
    }
  }, [externalError]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onCancel && (
          <TouchableOpacity style={styles.backButton} onPress={onCancel}>
            <ArrowLeft size={24} color={bentoPalette.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.shieldContainer}>
          <Shield size={32} color={bentoPalette.brandPrimary} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shake }] }]}>
          {[1, 2, 3, 4].map(i => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                pin.length >= i ? styles.dotFilled : styles.dotEmpty,
                externalError && styles.dotError
              ]} 
            />
          ))}
        </Animated.View>

        {externalError && <Text style={styles.errorText}>{externalError}</Text>}
      </View>

      <PINKeypad 
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onClear={handleClear}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  header: { padding: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  backButton: { position: 'absolute', left: spacing.xl, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...shadows.soft },
  shieldContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...shadows.soft },
  content: { alignItems: 'center', marginTop: spacing.xl, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: bentoPalette.textPrimary, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: bentoPalette.textSecondary, marginBottom: spacing.xxxl },
  dotsContainer: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  dotEmpty: { borderColor: bentoPalette.textTertiary, backgroundColor: 'transparent' },
  dotFilled: { borderColor: bentoPalette.brandPrimary, backgroundColor: bentoPalette.brandPrimary },
  dotError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontWeight: 'bold', marginTop: spacing.md },
});
