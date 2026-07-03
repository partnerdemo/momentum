import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useData } from '../../contexts/DataContext';
import { bentoPalette, spacing, borderRadius, shadows, typography } from '../../theme/bentoTokens';
import { ArrowLeft, ShoppingBag, Coins, ChevronRight } from 'lucide-react-native';
import { api } from '../../services/api';

type Route = RouteProp<RootStackParamList, 'MemberStore'>;

const { width } = Dimensions.get('window');

export default function MemberStoreScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { memberId } = route.params;
  const { storeItems, members, refresh } = useData();
  
  const member = members.find(m => m.id === memberId);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (itemId: string, itemName: string, cost: number) => {
    if (!member) return;
    
    if (member.pointsTotal < cost) {
      Alert.alert('Not Enough Points', `You need ${cost - member.pointsTotal} more points to buy this.`);
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Use ${cost} points for ${itemName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          onPress: async () => {
            setIsPurchasing(true);
            try {
              await api.purchaseItem(itemId, memberId);
              Alert.alert('Success!', `You've redeemed ${itemName}. Great job!`);
              await refresh();
            } catch (error: any) {
              Alert.alert('Purchase Failed', error.message || 'Could not complete purchase');
            } finally {
              setIsPurchasing(false);
            }
          }
        }
      ]
    );
  };

  if (!member) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={bentoPalette.textPrimary} />
          </TouchableOpacity>
          <View style={styles.pointsDisplay}>
            <Coins size={20} color={bentoPalette.alert} />
            <Text style={styles.pointsValue}>{member.pointsTotal}</Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Family Store</Text>
          <Text style={styles.subtitle}>Redeem your hard-earned points</Text>
        </View>

        <FlatList
          data={storeItems}
          keyExtractor={(item) => item.id || item._id!}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.itemCard}
              onPress={() => handlePurchase(item.id!, item.itemName, item.cost)}
            >
              <View style={styles.itemImageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <ShoppingBag size={40} color={bentoPalette.brandLight} />
                )}
              </View>
              <Text style={styles.itemName} numberOfLines={2}>{item.itemName}</Text>
              <View style={styles.costBadge}>
                <Text style={styles.costText}>{item.cost} pts</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>The store is currently empty.</Text>
            </View>
          }
        />
      </SafeAreaView>
      
      {isPurchasing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={bentoPalette.brandPrimary} />
        </View>
      )}
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
    paddingTop: spacing.md,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: bentoPalette.surface,
    justifyContent: 'center', alignItems: 'center', ...shadows.soft
  },
  pointsDisplay: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: bentoPalette.surface,
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 20, gap: 6, ...shadows.soft
  },
  pointsValue: { fontSize: 18, fontWeight: 'bold', color: bentoPalette.textPrimary },
  titleContainer: { paddingHorizontal: spacing.xl, marginVertical: spacing.xl },
  title: { fontSize: 28, fontWeight: 'bold', color: bentoPalette.textPrimary },
  subtitle: { fontSize: 16, color: bentoPalette.textSecondary },
  listContent: { padding: spacing.lg },
  columnWrapper: { justifyContent: 'space-between', marginBottom: spacing.lg },
  itemCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    backgroundColor: bentoPalette.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.soft
  },
  itemImageContainer: {
    width: '100%', aspectRatio: 1, backgroundColor: '#f9fafb',
    borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md
  },
  itemImage: { width: '100%', height: '100%', borderRadius: borderRadius.lg },
  itemName: { fontSize: 16, fontWeight: '600', color: bentoPalette.textPrimary, textAlign: 'center', height: 40 },
  costBadge: {
    backgroundColor: bentoPalette.brandPrimary,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: spacing.sm
  },
  costText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 100 },
  emptyText: { color: bentoPalette.textTertiary, fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center', alignItems: 'center'
  }
});
