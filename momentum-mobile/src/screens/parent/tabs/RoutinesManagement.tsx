import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../../theme/bentoTokens';
import { useData } from '../../../contexts/DataContext';
import { api } from '../../../services/api';
import { Routine, RoutineItem } from '../../../types';
import { Plus, X, CheckCircle2, Circle, Trash2, Pencil, Sun, Sunset, Moon } from 'lucide-react-native';

type TimeOfDay = 'morning' | 'noon' | 'night';

interface RoutineForm {
  title: string;
  memberId: string;
  timeOfDay: TimeOfDay;
  items: string[]; // item titles
}

const DEFAULT_FORM: RoutineForm = { title: '', memberId: '', timeOfDay: 'morning', items: [''] };

const TIME_OPTIONS: { value: TimeOfDay; label: string; Icon: any; color: string }[] = [
  { value: 'morning', label: 'Morning', Icon: Sun, color: '#f59e0b' },
  { value: 'noon', label: 'Afternoon', Icon: Sunset, color: '#f97316' },
  { value: 'night', label: 'Night', Icon: Moon, color: '#6366f1' },
];

export default function RoutinesManagement() {
  const { members } = useData();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [form, setForm] = useState<RoutineForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadRoutines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getAllRoutines();
      if (res.data?.routines) setRoutines(res.data.routines);
    } catch (e) {
      // fail silently — empty state shown
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRoutines(); }, [loadRoutines]);

  const onRefresh = () => { setRefreshing(true); loadRoutines(true); };

  const getMemberName = (id: string) => {
    const m = members.find(m => m.id === id || m._id === id);
    return m ? m.firstName : 'Unknown';
  };

  const getMemberColor = (id: string) => {
    const m = members.find(m => m.id === id || m._id === id);
    return m?.profileColor ?? bentoPalette.brandPrimary;
  };

  const handleToggleItem = async (routine: Routine, item: RoutineItem) => {
    if (!item._id) return;
    setToggling(item._id);
    try {
      const res = await api.toggleRoutineItem(routine.id, item._id);
      if (res.data?.routine) {
        setRoutines(prev => prev.map(r => r.id === routine.id ? res.data!.routine : r));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update item');
    } finally {
      setToggling(null);
    }
  };

  const openCreate = () => {
    setEditingRoutine(null);
    setForm({
      ...DEFAULT_FORM,
      memberId: members[0]?.id ?? '',
    });
    setModalVisible(true);
  };

  const openEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setForm({
      title: routine.title,
      memberId: routine.memberId,
      timeOfDay: routine.timeOfDay,
      items: routine.items.length > 0 ? routine.items.map(i => i.title) : [''],
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return Alert.alert('Required', 'Routine title is required.');
    if (!form.memberId) return Alert.alert('Required', 'Please select a member.');
    const validItems = form.items.map(s => s.trim()).filter(Boolean);
    if (validItems.length === 0) return Alert.alert('Required', 'Add at least one step.');

    setSaving(true);
    try {
      const payload: Partial<Routine> = {
        title: form.title.trim(),
        memberId: form.memberId,
        timeOfDay: form.timeOfDay,
        items: validItems.map((title, order) => ({ title, order, isCompleted: false })),
      };
      if (editingRoutine) {
        await api.updateRoutine(editingRoutine.id, payload);
      } else {
        await api.createRoutine(payload);
      }
      setModalVisible(false);
      await loadRoutines(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (routine: Routine) => {
    Alert.alert('Delete Routine', `Delete "${routine.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteRoutine(routine.id);
            setRoutines(prev => prev.filter(r => r.id !== routine.id));
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const updateFormItem = (index: number, value: string) => {
    setForm(f => {
      const items = [...f.items];
      items[index] = value;
      return { ...f, items };
    });
  };

  const addFormItem = () => setForm(f => ({ ...f, items: [...f.items, ''] }));
  const removeFormItem = (index: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={bentoPalette.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Routines</Text>
          <Text style={styles.subtitle}>{routines.length} routine{routines.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={routines}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={bentoPalette.brandPrimary} />}
        renderItem={({ item: routine }) => {
          const timeOpt = TIME_OPTIONS.find(t => t.value === routine.timeOfDay)!;
          const memberColor = getMemberColor(routine.memberId);
          const completedCount = routine.items.filter(i => i.isCompleted).length;

          return (
            <View style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={[styles.timeIcon, { backgroundColor: timeOpt.color + '20' }]}>
                  <timeOpt.Icon size={18} color={timeOpt.color} />
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardTitle}>{routine.title}</Text>
                  <View style={styles.cardSubRow}>
                    <View style={[styles.memberDot, { backgroundColor: memberColor }]} />
                    <Text style={styles.cardSub}>{getMemberName(routine.memberId)} · {timeOpt.label}</Text>
                  </View>
                </View>
                <Text style={styles.progress}>{completedCount}/{routine.items.length}</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(routine)}>
                  <Pencil size={15} color={bentoPalette.brandPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(routine)}>
                  <Trash2 size={15} color={bentoPalette.error} />
                </TouchableOpacity>
              </View>

              {/* Items */}
              {routine.items.map(item => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.itemRow}
                  onPress={() => handleToggleItem(routine, item)}
                  disabled={toggling === item._id}
                >
                  {toggling === item._id
                    ? <ActivityIndicator size="small" color={bentoPalette.brandPrimary} style={styles.checkIcon} />
                    : item.isCompleted
                      ? <CheckCircle2 size={22} color={bentoPalette.success} style={styles.checkIcon} />
                      : <Circle size={22} color={bentoPalette.textTertiary} style={styles.checkIcon} />}
                  <Text style={[styles.itemText, item.isCompleted && styles.itemDone]}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Sun size={40} color={bentoPalette.textTertiary} />
            <Text style={styles.emptyText}>No routines yet. Create one!</Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingRoutine ? 'Edit Routine' : 'New Routine'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={bentoPalette.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Morning Routine"
                value={form.title}
                onChangeText={t => setForm(f => ({ ...f, title: t }))}
              />

              <Text style={styles.label}>Member *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
                {members.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.memberChip, form.memberId === m.id && { backgroundColor: m.profileColor, borderColor: m.profileColor }]}
                    onPress={() => setForm(f => ({ ...f, memberId: m.id }))}
                  >
                    <Text style={[styles.chipText, form.memberId === m.id && { color: '#fff' }]}>{m.firstName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Time of Day</Text>
              <View style={styles.timeRow}>
                {TIME_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.timeOption, form.timeOfDay === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
                    onPress={() => setForm(f => ({ ...f, timeOfDay: opt.value }))}
                  >
                    <opt.Icon size={18} color={opt.color} />
                    <Text style={[styles.timeLabel, form.timeOfDay === opt.value && { color: opt.color, fontWeight: 'bold' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Steps *</Text>
              {form.items.map((item, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <Text style={styles.stepNum}>{idx + 1}</Text>
                  <TextInput
                    style={[styles.input, styles.stepInput]}
                    placeholder={`Step ${idx + 1}`}
                    value={item}
                    onChangeText={v => updateFormItem(idx, v)}
                  />
                  {form.items.length > 1 && (
                    <TouchableOpacity onPress={() => removeFormItem(idx)} style={styles.removeStep}>
                      <X size={16} color={bentoPalette.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addStepBtn} onPress={addFormItem}>
                <Plus size={16} color={bentoPalette.brandPrimary} />
                <Text style={styles.addStepText}>Add Step</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveButtonText}>{editingRoutine ? 'Save Changes' : 'Create Routine'}</Text>}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: bentoPalette.textPrimary },
  subtitle: { fontSize: 13, color: bentoPalette.textSecondary },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: bentoPalette.brandPrimary, justifyContent: 'center', alignItems: 'center', ...shadows.float },
  list: { padding: spacing.xl, paddingTop: 0, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: borderRadius.xl, marginBottom: spacing.md, ...shadows.soft, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  timeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: bentoPalette.textPrimary },
  cardSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  memberDot: { width: 8, height: 8, borderRadius: 4 },
  cardSub: { fontSize: 12, color: bentoPalette.textSecondary },
  progress: { fontSize: 13, fontWeight: 'bold', color: bentoPalette.brandPrimary },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  checkIcon: { marginRight: spacing.md },
  itemText: { fontSize: 14, color: bentoPalette.textPrimary, flex: 1 },
  itemDone: { textDecorationLine: 'line-through', color: bentoPalette.textTertiary },
  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.md },
  emptyText: { color: bentoPalette.textTertiary, fontSize: 15 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary },
  sheetBody: { padding: spacing.xl, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', color: bentoPalette.textSecondary, marginBottom: 6, marginTop: spacing.md, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: bentoPalette.textPrimary, borderWidth: 1, borderColor: '#e2e8f0' },
  memberScroll: { marginBottom: spacing.sm },
  memberChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', marginRight: spacing.sm },
  chipText: { fontSize: 14, fontWeight: '600', color: bentoPalette.textSecondary },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  timeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: '#e2e8f0' },
  timeLabel: { fontSize: 12, color: bentoPalette.textSecondary },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: bentoPalette.brandPrimary, color: '#fff', textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  stepInput: { flex: 1 },
  removeStep: { padding: 4 },
  addStepBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, marginTop: spacing.xs },
  addStepText: { color: bentoPalette.brandPrimary, fontWeight: '600', fontSize: 14 },
  saveButton: { backgroundColor: bentoPalette.brandPrimary, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.xl },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
