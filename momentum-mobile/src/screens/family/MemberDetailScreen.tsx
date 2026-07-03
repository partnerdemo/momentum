import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useData } from '../../contexts/DataContext';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../theme/bentoTokens';
import { ArrowLeft, Zap, ClipboardList, ShoppingCart, TrendingUp, ChevronRight } from 'lucide-react-native';
import { calculateStreak, getStreakEmoji, getStreakMessage } from '../../utils/streakCalculator';

const { width } = Dimensions.get('window');

type Route = RouteProp<RootStackParamList, 'MemberDetail'>;

export default function MemberDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { memberId } = route.params;
  const { members, tasks, quests } = useData();

  const member = members.find(m => m.id === memberId);
  const memberTasks = tasks.filter(t => t.assignedTo.includes(memberId) && (t.status === 'Pending' || t.status === 'PendingApproval'));
  const memberQuests = quests.filter(q => q.claims.some(c => c.memberId === memberId));

  if (!member) return null;

  const streakInfo = calculateStreak(member);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={bentoPalette.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{member.firstName}'s Progress</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Section */}
          <View style={[styles.heroCard, { backgroundColor: member.profileColor }]}>
            <View style={styles.heroMain}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>{member.firstName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.heroName}>{member.firstName}</Text>
                <Text style={styles.heroPoints}>{member.pointsTotal} Points</Text>
              </View>
            </View>
            
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>{getStreakEmoji(streakInfo.currentStreak)}</Text>
              <View>
                <Text style={styles.multiplierText}>{streakInfo.multiplier}x Multiplier</Text>
                <Text style={styles.streakText}>{getStreakMessage(streakInfo.currentStreak)}</Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ClipboardList size={20} color={bentoPalette.brandPrimary} />
              <Text style={styles.statValue}>{memberTasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={20} color={bentoPalette.success} />
              <Text style={styles.statValue}>{memberQuests.length}</Text>
              <Text style={styles.statLabel}>Quests</Text>
            </View>
            <View style={styles.statCard}>
              <Zap size={20} color={bentoPalette.alert} />
              <Text style={styles.statValue}>{streakInfo.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>

          {/* Section: Active Tasks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Responsibilities</Text>
            {memberTasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={[styles.taskStatusIndicator, { backgroundColor: task.status === 'Completed' ? bentoPalette.success : bentoPalette.brandLight }]} />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskPoints}>{task.pointsValue} Points</Text>
                </View>
                <ChevronRight size={18} color={bentoPalette.textTertiary} />
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.storeButton}
            onPress={() => navigation.navigate('MemberStore', { memberId })}
          >
            <ShoppingCart size={20} color="#fff" />
            <Text style={styles.storeButtonText}>Visit Member Store</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    height: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: bentoPalette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  title: {
    fontFamily: typography.widgetTitle.fontFamily,
    fontSize: 18,
    color: bentoPalette.textPrimary,
  },
  scrollContent: { padding: spacing.xl },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.soft,
  },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarTextLarge: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  heroName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  heroPoints: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  streakEmoji: { fontSize: 28 },
  multiplierText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  streakText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: bentoPalette.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.soft,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary, marginVertical: 2 },
  statLabel: { fontSize: 11, color: bentoPalette.textSecondary, textTransform: 'uppercase' },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: bentoPalette.textPrimary, marginBottom: spacing.md },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  taskStatusIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: spacing.md },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: bentoPalette.textPrimary },
  taskPoints: { fontSize: 12, color: bentoPalette.brandPrimary },
  storeButton: {
    flexDirection: 'row',
    backgroundColor: bentoPalette.brandPrimary,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.soft,
  },
  storeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
