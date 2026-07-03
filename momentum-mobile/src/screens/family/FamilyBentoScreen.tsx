import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../theme/bentoTokens';
import { FamilyRosterGrid } from './components/FamilyRosterGrid';
import { EnvironmentCol } from './components/EnvironmentCol';
import { FamilyTimelineCard } from './components/FamilyTimelineCard';
import { 
  Settings, Bell, ShoppingBag, Zap, Plus, ChevronRight 
} from 'lucide-react-native';
import { Task, Quest } from '../../types';

const { width } = Dimensions.get('window');

interface TaskItemProps {
  task: Task;
  onPress: () => void;
}

const TaskItem = React.memo(({ task, onPress }: TaskItemProps) => {
  return (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={onPress}
    >
      <View style={[styles.taskIndicator, { backgroundColor: task.status === 'Completed' ? bentoPalette.success : bentoPalette.brandLight }]} />
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
        <Text style={styles.taskPoints}>{task.pointsValue} Points</Text>
      </View>
    </TouchableOpacity>
  );
});

TaskItem.displayName = 'TaskItem';

interface QuestItemProps {
  quest: Quest;
  onPress: () => void;
}

const QuestItem = React.memo(({ quest, onPress }: QuestItemProps) => {
  return (
    <TouchableOpacity style={styles.questCard} onPress={onPress}>
      <Text style={styles.questTitle}>{quest.title}</Text>
      <View style={styles.questPointsBadge}>
        <Text style={styles.questPointsText}>+{quest.pointsValue}</Text>
      </View>
    </TouchableOpacity>
  );
});

QuestItem.displayName = 'QuestItem';

export default function FamilyBentoScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { members, tasks, quests, events } = useData();
  
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(() => members[0]?.id || null);

  const activeMemberId = selectedMemberId || members[0]?.id || null;
  const selectedMember = members.find(m => m.id === activeMemberId);
  const memberTasks = tasks.filter(t => activeMemberId && t.assignedTo.includes(activeMemberId));
  const activeQuests = quests.filter(q => q.isActive);

  const pagerData = [
    { id: 'responsibilities', type: 'responsibilities' },
    { id: 'quests', type: 'quests' },
    { id: 'schedule', type: 'schedule' }
  ];

  const renderPage = useCallback(({ item }: { item: typeof pagerData[0] }) => {
    if (item.type === 'responsibilities') {
      return (
        <View style={styles.columnPage}>
          <EnvironmentCol title="Responsibilities" count={memberTasks.length}>
            {memberTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onPress={() => navigation.navigate('MemberDetail', { memberId: activeMemberId! })} 
              />
            ))}

            {memberTasks.length === 0 && (
              <View style={styles.emptyColCard}>
                <Text style={styles.emptyColText}>No assigned tasks today</Text>
              </View>
            )}
          </EnvironmentCol>
        </View>
      );
    }
    if (item.type === 'quests') {
      return (
        <View style={styles.columnPage}>
          <EnvironmentCol title="Quests & Rewards" count={activeQuests.length}>
            <View style={styles.questBoard}>
              {activeQuests.map(quest => (
                <QuestItem 
                  key={quest.id} 
                  quest={quest} 
                  onPress={() => {}} 
                />
              ))}
            </View>

            <TouchableOpacity 
              style={styles.storeShortcut}
              onPress={() => navigation.navigate('MemberStore', { memberId: activeMemberId! })}
            >
              <ShoppingBag size={24} color={bentoPalette.brandPrimary} />
              <View style={styles.storeShortcutText}>
                <Text style={styles.storeTitle}>Family Store</Text>
                <Text style={styles.storeSubtitle}>Redeem points for rewards</Text>
              </View>
              <ChevronRight size={20} color={bentoPalette.textTertiary} />
            </TouchableOpacity>
          </EnvironmentCol>
        </View>
      );
    }
    if (item.type === 'schedule') {
      return (
        <View style={styles.columnPage}>
          <EnvironmentCol title="The Schedule" count={events.length}>
            <FamilyTimelineCard events={events} />
          </EnvironmentCol>
        </View>
      );
    }
    return null;
  }, [memberTasks, activeQuests, events, activeMemberId, navigation]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.householdName}>{user?.lastName} Family</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('NotificationCenter')}>
              <Bell size={24} color={bentoPalette.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Parent')}>
              <Settings size={23} color={bentoPalette.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Member Roster */}
        <FamilyRosterGrid 
          members={members} 
          selectedMemberId={activeMemberId} 
          onMemberSelect={setSelectedMemberId} 
        />

        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bentoPager}
          contentContainerStyle={styles.pagerContent}
          data={pagerData}
          keyExtractor={(item) => item.id}
          renderItem={renderPage}
        />

        {/* Floating Action Button (Optional for Parent) */}
        {user?.role === 'Parent' && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => navigation.navigate('Parent')}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Profile/Points Indicator (Locked to Bottom) */}
      <View style={styles.dock}>
        {selectedMember && (
          <View style={styles.dockContent}>
            <View style={styles.dockMemberInfo}>
              <View style={[styles.dockAvatar, { backgroundColor: selectedMember.profileColor }]}>
                <Text style={styles.dockAvatarText}>{selectedMember.firstName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.dockMemberName}>{selectedMember.firstName}'s HUD</Text>
                <Text style={styles.dockStreak}><Zap size={14} color="#EF4444" /> {selectedMember.currentStreak || 0} Day Streak</Text>
              </View>
            </View>
            <View style={styles.dockPoints}>
              <Text style={styles.dockPointsValue}>{selectedMember.pointsTotal}</Text>
              <Text style={styles.dockPointsLabel}>Points</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bentoPalette.canvas,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  greeting: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: bentoPalette.textSecondary,
  },
  householdName: {
    fontFamily: typography.heroGreeting.fontFamily,
    fontSize: 24,
    color: bentoPalette.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: bentoPalette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  bentoPager: {
    flex: 1,
  },
  pagerContent: {
    paddingRight: 0,
  },
  columnPage: {
    width: width,
    height: '100%',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.soft,
  },
  taskIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: bentoPalette.textPrimary,
  },
  taskPoints: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: bentoPalette.brandPrimary,
  },
  emptyColCard: {
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  emptyColText: {
    color: bentoPalette.textTertiary,
    fontSize: 14,
  },
  questBoard: {
    gap: spacing.md,
  },
  questCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#fef3c7',
    ...shadows.soft,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: bentoPalette.textPrimary,
  },
  questPointsBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questPointsText: {
    color: '#d97706',
    fontWeight: 'bold',
    fontSize: 14,
  },
  storeShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  storeShortcutText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  storeSubtitle: {
    fontSize: 12,
    color: '#3b82f6',
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 120, // Above dock
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: bentoPalette.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
    zIndex: 10,
  },
  dock: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: spacing.xxxl, // For safe area
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dockContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dockMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dockAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  dockMemberName: {
    fontSize: 16,
    fontWeight: '700',
    color: bentoPalette.textPrimary,
  },
  dockStreak: {
    fontSize: 12,
    color: bentoPalette.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dockPoints: {
    alignItems: 'flex-end',
  },
  dockPointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: bentoPalette.brandPrimary,
  },
  dockPointsLabel: {
    fontSize: 10,
    color: bentoPalette.textTertiary,
    textTransform: 'uppercase',
  },
});
