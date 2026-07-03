import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../theme/bentoTokens';
import {
  ArrowLeft, Bell, CheckCircle, AlertTriangle, Info,
  ClipboardCheck, Zap, ShoppingBag, CheckCheck,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { Notification, NotificationType } from '../../types';

const TYPE_CONFIG: Record<string, { Icon: any; color: string; bg: string }> = {
  [NotificationType.TASK_ASSIGNED]:   { Icon: ClipboardCheck, color: '#6366f1', bg: '#ede9fe' },
  [NotificationType.TASK_COMPLETED]:  { Icon: CheckCircle,    color: '#10b981', bg: '#d1fae5' },
  [NotificationType.TASK_APPROVED]:   { Icon: CheckCircle,    color: '#10b981', bg: '#d1fae5' },
  [NotificationType.TASK_REJECTED]:   { Icon: AlertTriangle,  color: '#ef4444', bg: '#fee2e2' },
  [NotificationType.QUEST_AVAILABLE]: { Icon: Zap,            color: '#f59e0b', bg: '#fef3c7' },
  [NotificationType.QUEST_COMPLETED]: { Icon: Zap,            color: '#f97316', bg: '#ffedd5' },
  [NotificationType.REWARD_REDEEMED]: { Icon: ShoppingBag,    color: '#06b6d4', bg: '#cffafe' },
  [NotificationType.APPROVAL_REQUEST]:{ Icon: Info,           color: '#6366f1', bg: '#ede9fe' },
  [NotificationType.SYSTEM]:          { Icon: Bell,           color: '#64748b', bg: '#f1f5f9' },
  [NotificationType.REMINDER]:        { Icon: AlertTriangle,  color: '#f59e0b', bg: '#fef3c7' },
};

const DEFAULT_CONFIG = { Icon: Bell, color: bentoPalette.textTertiary, bg: '#f1f5f9' };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationCenterScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.data) {
        setNotifications(res.data.notifications ?? []);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (e) {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleTap = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await api.markAsRead(notification.id ?? notification._id!);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id || n._id === notification._id)
            ? { ...n, isRead: true } : n)
        );
        setUnreadCount(c => Math.max(0, c - 1));
      } catch {
        // non-critical
      }
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await api.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const { Icon: DefaultIcon, color: defaultColor, bg: defaultBg } = DEFAULT_CONFIG;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={bentoPalette.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll} disabled={markingAll}>
            {markingAll
              ? <ActivityIndicator size="small" color={bentoPalette.brandPrimary} />
              : <CheckCheck size={20} color={bentoPalette.brandPrimary} />}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={bentoPalette.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id ?? item._id ?? Math.random().toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={bentoPalette.brandPrimary} />}
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG;
            const { Icon, color, bg } = config;
            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => handleTap(item)}
                activeOpacity={0.75}
              >
                {!item.isRead && <View style={styles.unreadDot} />}
                <View style={[styles.iconBox, { backgroundColor: bg }]}>
                  <Icon size={20} color={color} />
                </View>
                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleBold]}>{item.title}</Text>
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{item.message}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={48} color={bentoPalette.textTertiary} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...shadows.soft },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary },
  unreadBadge: { backgroundColor: bentoPalette.brandPrimary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  markAllBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', padding: spacing.md,
    borderRadius: borderRadius.xl, marginBottom: spacing.sm, ...shadows.soft,
  },
  cardUnread: { backgroundColor: '#fafafe', borderLeftWidth: 3, borderLeftColor: bentoPalette.brandPrimary },
  unreadDot: { position: 'absolute', top: spacing.md, right: spacing.md, width: 8, height: 8, borderRadius: 4, backgroundColor: bentoPalette.brandPrimary },
  iconBox: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: bentoPalette.textPrimary, flex: 1, marginRight: spacing.sm },
  notifTitleBold: { fontWeight: '700' },
  time: { fontSize: 11, color: bentoPalette.textTertiary, flexShrink: 0 },
  body: { fontSize: 13, color: bentoPalette.textSecondary, lineHeight: 18 },
  empty: { paddingTop: 80, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: bentoPalette.textSecondary, marginTop: spacing.md },
  emptySubtitle: { fontSize: 14, color: bentoPalette.textTertiary },
});
