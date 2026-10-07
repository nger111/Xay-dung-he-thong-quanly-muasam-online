import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

type FilterType = 'all' | 'low' | 'out';

interface InventoryItem {
  productId: string;
  productName: string;
  currentStock: number;
  shelfLocation: string;
}

const TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'low', label: 'Sắp hết' },
  { key: 'out', label: 'Hết hàng' },
];

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [newStockInput, setNewStockInput] = useState('');

  const fetchInventory = useCallback(async (type: FilterType = filter) => {
    try {
      let res;
      if (type === 'low') res = await inventoryAPI.getLowStock();
      else if (type === 'out') res = await inventoryAPI.getOutOfStock();
      else res = await inventoryAPI.getAll();

      const raw = res.data?.data ?? res.data;
      const list: InventoryItem[] = (Array.isArray(raw) ? raw : []).map((item: any) => ({
        productId: String(item.productId ?? item._id ?? item.id ?? ''),
        productName: item.productName ?? item.name ?? 'Chưa rõ',
        currentStock: Number(item.currentStock ?? item.stock ?? 0),
        shelfLocation: item.shelfLocation ?? item.location ?? 'Chưa xếp',
      }));
      setItems(list);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchInventory(filter);
  }, [filter]);

  const handleAdjust = async () => {
    if (!adjustItem) return;
    const newStock = parseInt(newStockInput);
    if (isNaN(newStock) || newStock < 0) {
      Alert.alert('Lỗi', 'Số lượng không hợp lệ');
      return;
    }
    try {
      await inventoryAPI.updateStock(adjustItem.productId, newStock);
      setAdjustItem(null);
      setNewStockInput('');
      fetchInventory(filter);
      Alert.alert('✅ Thành công', 'Đã cập nhật tồn kho');
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật tồn kho');
    }
  };

  const getStockStyle = (stock: number) => {
    if (stock <= 0) return { bg: Colors.errorLight, text: Colors.error };
    if (stock < 10) return { bg: Colors.warningLight, text: Colors.warning };
    return { bg: Colors.successLight, text: Colors.success };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý tồn kho</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchInventory(filter); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="archive-outline" size={48} color={Colors.placeholder} />
            <Text style={styles.emptyText}>Không có dữ liệu tồn kho</Text>
          </View>
        }
        renderItem={({ item }) => {
          const stockStyle = getStockStyle(item.currentStock);
          return (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => { setAdjustItem(item); setNewStockInput(String(item.currentStock)); }}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.itemLocation}>
                  <Ionicons name="location-outline" size={12} color={Colors.textSecondary} /> {item.shelfLocation}
                </Text>
              </View>
              <View style={[styles.stockBadge, { backgroundColor: stockStyle.bg }]}>
                <Text style={[styles.stockText, { color: stockStyle.text }]}>
                  SL: {item.currentStock}
                </Text>
              </View>
              <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={items.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
      />

      {/* Adjust Modal */}
      <Modal visible={!!adjustItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Điều chỉnh tồn kho</Text>
            <Text style={styles.modalProduct}>{adjustItem?.productName}</Text>
            <TextInput
              style={styles.modalInput}
              value={newStockInput}
              onChangeText={setNewStockInput}
              keyboardType="numeric"
              placeholder="Nhập số lượng mới"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setAdjustItem(null); setNewStockInput(''); }}
              >
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAdjust}>
                <Text style={styles.modalSaveText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    marginHorizontal: 12, marginVertical: 4, borderRadius: 12, padding: 14, gap: 10,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  itemLocation: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  stockBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  stockText: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalProduct: { fontSize: 14, color: Colors.textSecondary },
  modalInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text,
    backgroundColor: Colors.background,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: '700' },
  modalSaveBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  modalSaveText: { color: Colors.white, fontWeight: '700' },
});
