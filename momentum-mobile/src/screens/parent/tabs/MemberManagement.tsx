import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../../theme/bentoTokens';
import { useData } from '../../../contexts/DataContext';
import { api } from '../../../services/api';
import { UserPlus, X, ChevronRight, Mail } from 'lucide-react-native';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#64748b',
];

interface MemberForm {
  firstName: string;
  role: 'Parent' | 'Child';
  profileColor: string;
}

const DEFAULT_FORM: MemberForm = { firstName: '', role: 'Child', profileColor: '#6366f1' };

export default function MemberManagement() {
  const { members, household, householdId, refresh, isRefreshing } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<MemberForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim()) return Alert.alert('Required', 'First name is required.');
    if (!householdId) return Alert.alert('Error', 'Household not loaded.');

    setSaving(true);
    try {
      await api.createMember({
        householdId,
        firstName: form.firstName.trim(),
        role: form.role,
        profileColor: form.profileColor,
        displayName: form.firstName.trim(),
      });
      setModalVisible(false);
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Family Members</Text>
          <Text style={styles.subtitle}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <UserPlus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={bentoPalette.brandPrimary} />}
      >
        {members.map(member => (
          <View key={member.id} style={styles.memberCard}>
            <View style={[styles.avatar, { backgroundColor: member.profileColor }]}>
              <Text style={styles.avatarText}>{member.firstName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.name}>{member.firstName}</Text>
              <View style={styles.roleRow}>
                <View style={[styles.roleBadge, member.role === 'Parent' ? styles.roleBadgeParent : styles.roleBadgeChild]}>
                  <Text style={[styles.roleText, member.role === 'Parent' ? styles.roleTextParent : styles.roleTextChild]}>
                    {member.role}
                  </Text>
                </View>
                {member.isLinkedChild && (
                  <View style={styles.linkedBadge}>
                    <Text style={styles.linkedText}>Linked</Text>
                  </View>
                )}
              </View>
              <Text style={styles.points}>{member.pointsTotal ?? 0} pts</Text>
            </View>
            <View style={styles.streakInfo}>
              {(member.currentStreak ?? 0) > 0 && (
                <Text style={styles.streak}>🔥 {member.currentStreak}</Text>
              )}
              <ChevronRight size={18} color={bentoPalette.textTertiary} />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.inviteCard} onPress={openCreate}>
          <View style={styles.inviteIcon}>
            <UserPlus size={22} color={bentoPalette.brandPrimary} />
          </View>
          <View style={styles.inviteInfo}>
            <Text style={styles.inviteTitle}>Add Family Member</Text>
            <Text style={styles.inviteSubtitle}>Create a new child or parent profile</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Member Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Member</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={bentoPalette.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Emma"
                value={form.firstName}
                onChangeText={t => setForm(f => ({ ...f, firstName: t }))}
                autoFocus
              />

              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow2}>
                {(['Child', 'Parent'] as const).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, form.role === role && styles.roleOptionActive]}
                    onPress={() => setForm(f => ({ ...f, role }))}
                  >
                    <Text style={[styles.roleOptionText, form.role === role && styles.roleOptionTextActive]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Profile Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color }, form.profileColor === color && styles.colorSwatchSelected]}
                    onPress={() => setForm(f => ({ ...f, profileColor: color }))}
                  />
                ))}
              </View>

              {/* Preview */}
              <View style={styles.preview}>
                <View style={[styles.previewAvatar, { backgroundColor: form.profileColor }]}>
                  <Text style={styles.previewAvatarText}>
                    {form.firstName ? form.firstName.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.previewName}>{form.firstName || 'New Member'}</Text>
                  <Text style={styles.previewRole}>{form.role}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveButtonText}>Add Member</Text>}
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
  scroll: { padding: spacing.xl, paddingTop: 0, paddingBottom: 100 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.sm, ...shadows.soft },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  memberInfo: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 16, fontWeight: 'bold', color: bentoPalette.textPrimary, marginBottom: 3 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 3 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleBadgeParent: { backgroundColor: '#ede9fe' },
  roleBadgeChild: { backgroundColor: '#d1fae5' },
  roleText: { fontSize: 11, fontWeight: '700' },
  roleTextParent: { color: '#7c3aed' },
  roleTextChild: { color: '#065f46' },
  linkedBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  linkedText: { fontSize: 11, fontWeight: '700', color: '#1d4ed8' },
  points: { fontSize: 12, color: bentoPalette.textTertiary },
  streakInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streak: { fontSize: 14 },
  inviteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', padding: spacing.lg, borderRadius: borderRadius.xl, marginTop: spacing.lg, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#bae6fd' },
  inviteIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  inviteInfo: { marginLeft: spacing.md },
  inviteTitle: { fontSize: 16, fontWeight: 'bold', color: '#0369a1' },
  inviteSubtitle: { fontSize: 12, color: '#0ea5e9' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary },
  sheetBody: { padding: spacing.xl, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', color: bentoPalette.textSecondary, marginBottom: 6, marginTop: spacing.md, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: bentoPalette.textPrimary, borderWidth: 1, borderColor: '#e2e8f0' },
  roleRow2: { flexDirection: 'row', gap: spacing.md },
  roleOption: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  roleOptionActive: { borderColor: bentoPalette.brandPrimary, backgroundColor: '#ede9fe' },
  roleOptionText: { fontWeight: '600', color: bentoPalette.textSecondary, fontSize: 15 },
  roleOptionTextActive: { color: bentoPalette.brandPrimary },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  colorSwatch: { width: 38, height: 38, borderRadius: 19 },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#f8fafc', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  previewAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  previewAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  previewName: { fontSize: 16, fontWeight: 'bold', color: bentoPalette.textPrimary },
  previewRole: { fontSize: 13, color: bentoPalette.textSecondary },
  saveButton: { backgroundColor: bentoPalette.brandPrimary, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
