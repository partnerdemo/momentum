import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../../theme/bentoTokens';
import { useAuth } from '../../../contexts/AuthContext';
import { LogOut, Shield, Bell, Smartphone, HelpCircle, ChevronRight } from 'lucide-react-native';

export default function ParentSettings() {
  const { logout, user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user?.firstName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Bell size={20} color={bentoPalette.textSecondary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch value={true} />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Smartphone size={20} color={bentoPalette.textSecondary} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch value={false} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Security</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Shield size={20} color={bentoPalette.textSecondary} />
                <Text style={styles.settingText}>Security PIN</Text>
              </View>
              <ChevronRight size={18} color={bentoPalette.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <HelpCircle size={20} color={bentoPalette.textSecondary} />
                <Text style={styles.settingText}>Support & Help</Text>
              </View>
              <ChevronRight size={18} color={bentoPalette.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Momentum Mobile v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  header: { padding: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold', color: bentoPalette.textPrimary },
  scroll: { paddingHorizontal: spacing.xl },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, marginBottom: spacing.lg },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: bentoPalette.brandLight, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: 24, fontWeight: 'bold', color: bentoPalette.brandPrimary },
  profileName: { fontSize: 18, fontWeight: 'bold', color: bentoPalette.textPrimary },
  profileEmail: { fontSize: 14, color: bentoPalette.textSecondary },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: bentoPalette.textTertiary, textTransform: 'uppercase', marginBottom: spacing.md, marginLeft: 4 },
  settingsGroup: { backgroundColor: '#fff', borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.soft },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settingLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingText: { fontSize: 16, color: bentoPalette.textPrimary },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.lg, backgroundColor: '#fef2f2', borderRadius: borderRadius.xl, marginTop: spacing.lg },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', color: bentoPalette.textTertiary, fontSize: 12, marginTop: spacing.xxl, marginBottom: spacing.xl }
});
