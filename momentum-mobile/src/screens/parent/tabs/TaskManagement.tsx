import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../../theme/bentoTokens';
import { useData } from '../../../contexts/DataContext';
import { api } from '../../../services/api';
import { Task } from '../../../types';
import { Plus, X, Check, ChevronDown, Trash2, Pencil } from 'lucide-react-native';

type TabName = 'Pending' | 'PendingApproval' | 'Approved';

const TABS: { label: string; value: TabName | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Awaiting', value: 'PendingApproval' },
  { label: 'Done', value: 'Approved' },
];

interface TaskForm {
  title: string;
  description: string;
  pointsValue: string;
  assignedTo: string[];
  dueDate: string;
}

const DEFAULT_FORM: TaskForm = { title: '', description: '', pointsValue: '10', assignedTo: [], dueDate: '' };

export default function TaskManagement() {
  const { tasks, members, refresh, isRefreshing } = useData();
  const [activeTab, setActiveTab] = useState<TabName | 'All'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = tasks.filter(t =>
    activeTab === 'All' ? true : t.status === activeTab
  );

  const getMemberName = (id: string) => {
    const m = members.find(m => m.id === id || m._id === id);
    return m ? m.firstName : id.slice(0, 6);
  };

  const openCreate = () => {
    setEditingTask(null);
    setForm(DEFAULT_FORM);
    setModalVisible(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? '',
      pointsValue: String(task.pointsValue ?? task.value ?? 10),
      assignedTo: task.assignedTo,
      dueDate: '',
    });
    setModalVisible(true);
  };

  const toggleAssign = (memberId: string) => {
    setForm(f => ({
      ...f,
      assignedTo: f.assignedTo.includes(memberId)
        ? f.assignedTo.filter(id => id !== memberId)
        : [...f.assignedTo, memberId],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return Alert.alert('Required', 'Task title is required.');
    if (form.assignedTo.length === 0) return Alert.alert('Required', 'Assign to at least one member.');
    const pts = parseInt(form.pointsValue, 10);
    if (isNaN(pts) || pts < 1) return Alert.alert('Invalid', 'Points must be a positive number.');

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        pointsValue: pts,
        assignedTo: form.assignedTo,
        dueDate: form.dueDate || undefined,
      };
      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }
      setModalVisible(false);
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteTask(task.id);
            await refresh();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const statusColor = (status: Task['status']) => {
    switch (status) {
      case 'Pending': return bentoPalette.alert;
      case 'PendingApproval': return bentoPalette.brandPrimary;
      case 'Approved': return bentoPalette.success;
      default: return bentoPalette.textTertiary;
    }
  };

  const statusLabel = (status: Task['status']) => {
    if (status === 'PendingApproval') return 'Awaiting';
    return status;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>All Tasks</Text>
          <Text style={styles.subtitle}>{tasks.length} total</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.activeTab]}
            onPress={() => setActiveTab(tab.value as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
            <View style={styles.cardBody}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskMeta}>
                {item.assignedTo.map(getMemberName).join(', ')} · {item.pointsValue ?? item.value} pts
              </Text>
              <Text style={[styles.statusTag, { color: statusColor(item.status) }]}>
                {statusLabel(item.status)}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                <Pencil size={16} color={bentoPalette.brandPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                <Trash2 size={16} color={bentoPalette.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks in this category.</Text>
          </View>
        }
      />

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={bentoPalette.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Clean your room"
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

              <Text style={styles.label}>Points Value *</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                value={form.pointsValue}
                onChangeText={t => setForm(f => ({ ...f, pointsValue: t }))}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Assign To *</Text>
              <View style={styles.memberGrid}>
                {members.map(m => {
                  const selected = form.assignedTo.includes(m.id);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.memberChip, selected && { backgroundColor: m.profileColor, borderColor: m.profileColor }]}
                      onPress={() => toggleAssign(m.id)}
                    >
                      {selected && <Check size={12} color="#fff" />}
                      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{m.firstName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveButtonText}>{editingTask ? 'Save Changes' : 'Create Task'}</Text>}
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
  tabs: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.sm },
  tab: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, backgroundColor: bentoPalette.surface },
  activeTab: { backgroundColor: bentoPalette.brandPrimary },
  tabText: { fontWeight: '600', color: bentoPalette.textSecondary, fontSize: 13 },
  activeTabText: { color: '#fff' },
  list: { padding: spacing.xl, paddingTop: 0, paddingBottom: 100 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: borderRadius.lg,
    marginBottom: spacing.sm, ...shadows.soft, overflow: 'hidden',
  },
  statusDot: { width: 4 },
  cardBody: { flex: 1, padding: spacing.md },
  taskTitle: { fontSize: 15, fontWeight: '600', color: bentoPalette.textPrimary, marginBottom: 3 },
  taskMeta: { fontSize: 12, color: bentoPalette.textSecondary, marginBottom: 4 },
  statusTag: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  cardActions: { flexDirection: 'column', justifyContent: 'center', padding: spacing.sm, gap: spacing.sm },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: bentoPalette.textTertiary },
  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary },
  sheetBody: { padding: spacing.xl, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: bentoPalette.textSecondary, marginBottom: 6, marginTop: spacing.md, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: bentoPalette.textPrimary, borderWidth: 1, borderColor: '#e2e8f0' },
  textArea: { height: 80, textAlignVertical: 'top' },
  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipText: { fontSize: 14, fontWeight: '600', color: bentoPalette.textSecondary },
  saveButton: { backgroundColor: bentoPalette.brandPrimary, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.xl },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
