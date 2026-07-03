import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../../theme/bentoTokens';
import { useData } from '../../../contexts/DataContext';
import { api } from '../../../services/api';
import { Quest } from '../../../types';
import { Plus, X, Zap, Clock, Repeat, Target, Trash2, Pencil } from 'lucide-react-native';

type QuestType = 'one-time' | 'limited' | 'unlimited';

interface QuestForm {
  title: string;
  description: string;
  pointsValue: string;
  questType: QuestType;
  maxClaims: string;
  hasExpiry: boolean;
  expiresAt: string; // ISO date string YYYY-MM-DD
}

const DEFAULT_FORM: QuestForm = {
  title: '', description: '', pointsValue: '25',
  questType: 'one-time', maxClaims: '1', hasExpiry: false, expiresAt: '',
};

const QUEST_TYPE_OPTIONS: { value: QuestType; label: string; icon: any; color: string }[] = [
  { value: 'one-time', label: 'One-Time', icon: Target, color: '#6366f1' },
  { value: 'limited', label: 'Limited', icon: Clock, color: '#f59e0b' },
  { value: 'unlimited', label: 'Recurring', icon: Repeat, color: '#10b981' },
];

export default function QuestManagement() {
  const { quests, refresh } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [form, setForm] = useState<QuestForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const activeQuests = quests.filter(q => q.isActive);
  const expiredQuests = quests.filter(q => !q.isActive);

  const openCreate = () => {
    setEditingQuest(null);
    setForm(DEFAULT_FORM);
    setModalVisible(true);
  };

  const openEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setForm({
      title: quest.title,
      description: quest.description ?? '',
      pointsValue: String(quest.pointsValue),
      questType: (quest as any).questType ?? 'one-time',
      maxClaims: String((quest as any).maxClaims ?? 1),
      hasExpiry: !!(quest as any).expiresAt,
      expiresAt: (quest as any).expiresAt ? (quest as any).expiresAt.slice(0, 10) : '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return Alert.alert('Required', 'Quest title is required.');
    const pts = parseInt(form.pointsValue, 10);
    if (isNaN(pts) || pts < 1) return Alert.alert('Invalid', 'Points must be a positive number.');

    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        pointsValue: pts,
        questType: form.questType,
        maxClaims: form.questType === 'limited' ? parseInt(form.maxClaims, 10) || 1 : undefined,
        expiresAt: form.hasExpiry && form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: true,
      };
      if (editingQuest) {
        await api.updateQuest(editingQuest.id, payload);
      } else {
        await api.createQuest(payload);
      }
      setModalVisible(false);
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save quest');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (quest: Quest) => {
    Alert.alert('Delete Quest', `Delete "${quest.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteQuest(quest.id);
            await refresh();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderQuest = (quest: Quest) => {
    const typeInfo = QUEST_TYPE_OPTIONS.find(t => t.value === ((quest as any).questType ?? 'one-time'))!;
    const pendingClaims = quest.claims.filter(c => c.status === 'completed').length;
    return (
      <View key={quest.id} style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: typeInfo.color + '20' }]}>
          <typeInfo.icon size={22} color={typeInfo.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.questTitle}>{quest.title}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
              <Text style={styles.typeBadgeText}>{typeInfo.label}</Text>
            </View>
          </View>
          {quest.description ? <Text style={styles.questDesc} numberOfLines={1}>{quest.description}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.pts}>{quest.pointsValue} pts</Text>
            <Text style={styles.claims}>{quest.claims.length} claim{quest.claims.length !== 1 ? 's' : ''}</Text>
            {pendingClaims > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingClaims} awaiting review</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(quest)}>
            <Pencil size={16} color={bentoPalette.brandPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(quest)}>
            <Trash2 size={16} color={bentoPalette.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Quest Board</Text>
          <Text style={styles.subtitle}>{activeQuests.length} active</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {activeQuests.length === 0 && expiredQuests.length === 0 ? (
          <View style={styles.empty}>
            <Zap size={40} color={bentoPalette.textTertiary} />
            <Text style={styles.emptyText}>No quests yet. Create one!</Text>
          </View>
        ) : (
          <>
            {activeQuests.map(renderQuest)}
            {expiredQuests.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Inactive</Text>
                {expiredQuests.map(renderQuest)}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingQuest ? 'Edit Quest' : 'New Quest'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={bentoPalette.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Read for 30 minutes"
                value={form.title}
                onChangeText={t => setForm(f => ({ ...f, title: t }))}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional details..."
                value={form.description}
                onChangeText={t => setForm(f => ({ ...f, description: t }))}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Points Reward *</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                value={form.pointsValue}
                onChangeText={t => setForm(f => ({ ...f, pointsValue: t }))}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Quest Type</Text>
              <View style={styles.typeRow}>
                {QUEST_TYPE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.typeOption, form.questType === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
                    onPress={() => setForm(f => ({ ...f, questType: opt.value }))}
                  >
                    <opt.icon size={18} color={opt.color} />
                    <Text style={[styles.typeLabel, form.questType === opt.value && { color: opt.color, fontWeight: 'bold' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.questType === 'limited' && (
                <>
                  <Text style={styles.label}>Max Claims</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    value={form.maxClaims}
                    onChangeText={t => setForm(f => ({ ...f, maxClaims: t }))}
                    keyboardType="number-pad"
                  />
                </>
              )}

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Set Expiry Date</Text>
                <Switch
                  value={form.hasExpiry}
                  onValueChange={v => setForm(f => ({ ...f, hasExpiry: v }))}
                  trackColor={{ true: bentoPalette.brandPrimary }}
                />
              </View>
              {form.hasExpiry && (
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={form.expiresAt}
                  onChangeText={t => setForm(f => ({ ...f, expiresAt: t }))}
                />
              )}

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveButtonText}>{editingQuest ? 'Save Changes' : 'Create Quest'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  header: { padding: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: bentoPalette.textPrimary },
  subtitle: { fontSize: 13, color: bentoPalette.textSecondary },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: bentoPalette.brandPrimary, justifyContent: 'center', alignItems: 'center', ...shadows.float },
  list: { padding: spacing.xl, paddingTop: 0, paddingBottom: 100 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: bentoPalette.textTertiary, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.md },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.sm, ...shadows.soft, alignItems: 'flex-start' },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 3 },
  questTitle: { fontSize: 15, fontWeight: 'bold', color: bentoPalette.textPrimary, flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  questDesc: { fontSize: 12, color: bentoPalette.textSecondary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pts: { fontSize: 12, fontWeight: 'bold', color: bentoPalette.brandPrimary },
  claims: { fontSize: 12, color: bentoPalette.textTertiary },
  pendingBadge: { backgroundColor: bentoPalette.alertLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  pendingBadgeText: { fontSize: 10, color: bentoPalette.alert, fontWeight: 'bold' },
  cardActions: { flexDirection: 'column', gap: spacing.sm, paddingLeft: spacing.sm },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.md },
  emptyText: { color: bentoPalette.textTertiary, fontSize: 15 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary },
  sheetBody: { padding: spacing.xl, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', color: bentoPalette.textSecondary, marginBottom: 6, marginTop: spacing.md, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: bentoPalette.textPrimary, borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: '#e2e8f0' },
  typeLabel: { fontSize: 12, color: bentoPalette.textSecondary },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: bentoPalette.textPrimary },
  saveButton: { backgroundColor: bentoPalette.brandPrimary, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.xl },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
