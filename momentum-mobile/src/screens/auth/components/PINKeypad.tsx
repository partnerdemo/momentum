import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../../theme/bentoTokens';
import { Delete, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PINKeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

export function PINKeypad({ onKeyPress, onBackspace, onClear }: PINKeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'];

  const renderKey = (key: string) => {
    let content: React.ReactNode = <Text style={styles.keyText}>{key}</Text>;
    let onPress = () => onKeyPress(key);
    let style = styles.key;

    if (key === 'DEL') {
      content = <Delete size={28} color={bentoPalette.textPrimary} />;
      onPress = onBackspace;
    } else if (key === 'C') {
      content = <X size={28} color={bentoPalette.textPrimary} />;
      onPress = onClear;
    }

    return (
      <TouchableOpacity key={key} style={style} onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {keys.map(renderKey)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    padding: spacing.lg,
    gap: spacing.md,
  },
  key: {
    width: (width - spacing.xl * 4) / 3,
    aspectRatio: 1.2,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  keyText: {
    fontSize: 28,
    fontFamily: typography.heroGreeting.fontFamily,
    color: bentoPalette.textPrimary,
  },
});
