import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../../theme/bentoTokens';
import { useData } from '../../../contexts/DataContext';
import { api } from '../../../services/api';
import { TrendingUp, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react-native';

export default function ParentDashboard() {
  const { tasks, quests, members, refresh, isRefreshing } = useData();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingTaskApprovals = tasks.filter(t => t.status === 'PendingApproval');
  const pendingQuestApprovals = quests.flatMap(q =>
    q.claims
      .filter(c => c.status === 'completed')
      .map(c => ({ quest: q, claim: c }))
  );

  const getMemberName = (id: string) => {
    const m = members.find(m => m.id === id || m._id === id);
    return m ? m.firstName : 'Unknown';
  };

  const handleApproveTask = async (taskId: string) => {
    setActionLoading(`approve-task-${taskId}`);
    try {
      await api.approveTask(taskId);
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to approve task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTask = (taskId: string, taskTitle: string) => {
    Alert.alert('Reject Task', `Send "${taskTitle}" back to pending?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setActionLoading(`reject-task-${taskId}`);
          try {
            await api.rejectTask(taskId);
            await refresh();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to reject task');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleApproveQuest = async (questId: string, memberId: string) => {
    setActionLoading(`approve-quest-${questId}-${memberId}`);
    try {
      await api.approveQuest(questId, memberId);
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to approve quest');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending = pendingTaskApprovals.length + pendingQuestApprovals.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Control Deck</Text>
        <Text style={styles.subtitle}>Family activity overview</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={bentoPalette.brandPrimary} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, totalPending > 0 && styles.statCardAlert]}>
            <Clock size={22} color={totalPending > 0 ? bentoPalette.alert : bentoPalette.textTertiary} />
            <Text style={[styles.statValue, totalPending > 0 && { color: bentoPalette.alert }]}>{totalPending}</Text>
            <Text style={styles.statLabel}>Needs Review</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle2 size={22} color={bentoPalette.success} />
            <Text style={styles.statValue}>{tasks.filter(t => t.status === 'Approved').length}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Zap size={22} color={bentoPalette.brandPrimary} />
            <Text style={styles.statValue}>{tasks.filter(t => t.status === 'Pending').length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* Task Approvals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks Awaiting Review</Text>
            {pendingTaskApprovals.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingTaskApprovals.length}</Text></View>
            )}
          </View>

          {pendingTaskApprovals.length === 0 ? (
            <View style={styles.emptyCard}>
              <TrendingUp size={28} color={bentoPalette.brandLight} />
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          ) : (
            pendingTaskApprovals.map(task => {
              const completerId = task.completedBy ?? (task.assignedTo[0] ?? '');
              const isApprovingThis = actionLoading === `approve-task-${task.id}`;
              const isRejectingThis = actionLoading === `reject-task-${task.id}`;
              return (
                <View key={task.id} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalTitle}>{task.title}</Text>
                    <Text style={styles.approvalMeta}>
                      Completed by {getMemberName(completerId)} · {task.pointsValue ?? task.value} pts
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.rejectBtn, isRejectingThis && styles.btnLoading]}
                      onPress={() => handleRejectTask(task.id, task.title)}
                      disabled={!!actionLoading}
                    >
                      {isRejectingThis
                        ? <ActivityIndicator size="small" color={bentoPalette.error} />
                        : <XCircle size={20} color={bentoPalette.error} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, isApprovingThis && styles.btnLoading]}
                      onPress={() => handleApproveTask(task.id)}
                      disabled={!!actionLoading}
                    >
                      {isApprovingThis
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.approveBtnText}>Approve</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Quest Approvals */}
        {pendingQuestApprovals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quests Awaiting Review</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingQuestApprovals.length}</Text></View>
            </View>

            {pendingQuestApprovals.map(({ quest, claim }) => {
              const key = `${quest.id}-${claim.memberId}`;
              const isApproving = actionLoading === `approve-quest-${quest.id}-${claim.memberId}`;
              return (
                <View key={key} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalTitle}>{quest.title}</Text>
                    <Text style={styles.approvalMeta}>
                      Completed by {getMemberName(claim.memberId)} · {quest.pointsValue} pts
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.approveBtn, isApproving && styles.btnLoading]}
                    onPress={() => handleApproveQuest(quest.id, claim.memberId)}
                    disabled={!!actionLoading}
                  >
                    {isApproving
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.approveBtnText}>Approve</Text>}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  title: { fontSize: 28, fontWeight: 'bold', color: bentoPalette.textPrimary },
  subtitle: { fontSize: 14, color: bentoPalette.textSecondary, marginTop: 2 },
  scroll: { padding: spacing.xl, paddingTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.xl,
    alignItems: 'center', backgroundColor: '#fff', ...shadows.soft,
  },
  statCardAlert: { backgroundColor: bentoPalette.alertLight },
  statValue: { fontSize: 22, fontWeight: 'bold', color: bentoPalette.textPrimary, marginVertical: 2 },
  statLabel: { fontSize: 10, color: bentoPalette.textSecondary, textTransform: 'uppercase', textAlign: 'center' },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: bentoPalette.textPrimary },
  badge: { backgroundColor: bentoPalette.alert, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyCard: {
    padding: spacing.xxl, alignItems: 'center', backgroundColor: '#fff',
    borderRadius: borderRadius.xl, ...shadows.soft,
  },
  emptyText: { marginTop: spacing.sm, color: bentoPalette.textTertiary },
  approvalCard: {
    backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.soft,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  approvalInfo: { flex: 1 },
  approvalTitle: { fontSize: 15, fontWeight: '600', color: bentoPalette.textPrimary },
  approvalMeta: { fontSize: 12, color: bentoPalette.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  rejectBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5,
    borderColor: bentoPalette.error, justifyContent: 'center', alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: bentoPalette.success, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: borderRadius.md,
  },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnLoading: { opacity: 0.6 },
});
