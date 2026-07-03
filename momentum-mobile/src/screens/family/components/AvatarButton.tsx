import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../../theme/bentoTokens';
import { Member } from '../../../types';

interface AvatarButtonProps {
  member: Member;
  isActive: boolean;
  onPress: () => void;
}

export function AvatarButton({ member, isActive, onPress }: AvatarButtonProps) {
  const initials = member.firstName ? member.firstName.charAt(0) : '?';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { borderColor: member.profileColor || bentoPalette.brandPrimary },
        isActive && styles.activeContainer
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: member.profileColor || bentoPalette.brandPrimary }]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <Text 
        style={[styles.name, isActive && styles.activeName]} 
        numberOfLines={1}
      >
        {member.firstName}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    width: 70,
  },
  activeContainer: {
    backgroundColor: 'rgba(99, 102, 141, 0.05)',
    borderColor: bentoPalette.brandPrimary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
    marginBottom: spacing.xs,
  },
  initials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: bentoPalette.textSecondary,
    textAlign: 'center',
  },
  activeName: {
    color: bentoPalette.brandPrimary,
    fontWeight: 'bold',
  },
});
