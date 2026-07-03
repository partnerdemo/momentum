import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { spacing } from '../../../theme/bentoTokens';
import { Member } from '../../../types';
import { AvatarButton } from './AvatarButton';

interface FamilyRosterGridProps {
  members: Member[];
  selectedMemberId: string | null;
  onMemberSelect: (id: string) => void;
}

export function FamilyRosterGrid({ members, selectedMemberId, onMemberSelect }: FamilyRosterGridProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {members.map(member => (
          <AvatarButton
            key={member.id}
            member={member}
            isActive={selectedMemberId === member.id}
            onPress={() => onMemberSelect(member.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 90,
    width: '100%',
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
});
