import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { bentoPalette, spacing, typography } from '../../../theme/bentoTokens';

interface EnvironmentColProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

export function EnvironmentCol({ title, count, children }: EnvironmentColProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </View>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.widgetTitle.fontFamily,
    fontSize: 18,
    color: bentoPalette.textPrimary,
  },
  badge: {
    backgroundColor: bentoPalette.brandPrimary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: bentoPalette.brandPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
    gap: spacing.md,
  },
});
