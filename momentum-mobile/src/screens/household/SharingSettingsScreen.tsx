import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { bentoPalette, spacing, borderRadius, shadows } from '../../theme/bentoTokens';
import { ArrowLeft, Users, Shield, RefreshCw, Info } from 'lucide-react-native';

export default function SharingSettingsScreen() {
  const navigation = useNavigation();
  
  // Consensus protocol state simulation
  const [settings, setSettings] = useState({
    taskVisibility: true,
    pointSharing: false,
    rewardStoreManagement: false,
    routinesManagement: true,
  });

  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  const toggleSetting = (key: string, value: boolean) => {
    Alert.alert(
      'Consensus Protocol',
      `Changing this setting requires approval from the other parent. Send a request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          onPress: () => {
            setPendingChanges(prev => ({ ...prev, [key]: value }));
            Alert.alert('Request Sent', 'The other parent has been notified. This setting will update once they approve.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={bentoPalette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sharing Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoBox}>
          <Info size={20} color={bentoPalette.brandPrimary} />
          <Text style={styles.infoText}>
            Momentum uses a Strict Consensus Protocol. Changes to shared settings must be approved by both parents.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shared Governance</Text>
          <View style={styles.group}>
            {Object.entries(settings).map(([key, value]) => (
              <View key={key} style={styles.settingItem}>
                <View style={styles.labelContainer}>
                  <Text style={styles.settingLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  {pendingChanges[key] !== undefined && (
                    <Text style={styles.pendingBadge}>Awaiting Approval</Text>
                  )}
                </View>
                <Switch 
                  value={pendingChanges[key] !== undefined ? pendingChanges[key] : value} 
                  onValueChange={(v) => toggleSetting(key, v)}
                  trackColor={{ true: bentoPalette.brandPrimary + '80', false: '#cbd5e1' }}
                  thumbColor={value ? bentoPalette.brandPrimary : '#94a3b8'}
                />
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.syncButton}>
          <RefreshCw size={20} color={bentoPalette.brandPrimary} />
          <Text style={styles.syncText}>Force Household Sync</Text>
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Link Termination</Text>
          <TouchableOpacity style={styles.unlinkButton}>
            <Users size={18} color="#ef4444" />
            <Text style={styles.unlinkText}>Unlink Household</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bentoPalette.canvas },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl, gap: spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...shadows.soft },
  title: { fontSize: 20, fontWeight: 'bold', color: bentoPalette.textPrimary },
  scroll: { padding: spacing.xl, paddingTop: 0 },
  infoBox: { flexDirection: 'row', gap: spacing.md, backgroundColor: '#eff6ff', padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.xl, borderLeftWidth: 4, borderLeftColor: bentoPalette.brandPrimary },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 18 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: bentoPalette.textTertiary, textTransform: 'uppercase', marginBottom: spacing.md, marginLeft: 4 },
  group: { backgroundColor: '#fff', borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.soft },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  labelContainer: { flex: 1 },
  settingLabel: { fontSize: 16, color: bentoPalette.textPrimary, fontWeight: '500' },
  pendingBadge: { fontSize: 11, color: bentoPalette.alert, fontWeight: 'bold', marginTop: 2 },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.lg, backgroundColor: '#fff', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: '#e2e8f0', marginTop: spacing.md },
  syncText: { color: bentoPalette.brandPrimary, fontWeight: 'bold' },
  dangerZone: { marginTop: spacing.xxl, paddingTop: spacing.xl, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  dangerTitle: { fontSize: 14, fontWeight: 'bold', color: '#ef4444', marginBottom: spacing.md },
  unlinkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.md, backgroundColor: '#fef2f2', borderRadius: borderRadius.lg },
  unlinkText: { color: '#ef4444', fontWeight: 'bold' }
});
