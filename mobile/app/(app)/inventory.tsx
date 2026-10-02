import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryAPI } from '../../services/api';

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
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật tồn kho');
    }
  };

  const getStockStyle = (stock: number) => {
    if (stock <= 0) return { bg: '#fee2e2', text: '#dc2626' };
    if (stock < 10) return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#dcfce7', text: '#16a34a' };
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <View style={styles.container}>
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
            colors={['#16a34a']}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="archive-outline" size={48} color="#d1d5db" />
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
                  <Ionicons name="location-outline" size={12} color="#9ca3af" /> {item.shelfLocation}
                </Text>
              </View>
              <View style={[styles.stockBadge, { backgroundColor: stockStyle.bg }]}>
                <Text style={[styles.stockText, { color: stockStyle.text }]}>
                  SL: {item.currentStock}
                </Text>
              </View>
              <Ionicons name="create-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
          );
        }}
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#16a34a' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#16a34a', fontWeight: 'bold' },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemLocation: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  stockBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stockText: { fontSize: 13, fontWeight: 'bold' },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalProduct: { fontSize: 15, color: '#6b7280' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: { color: '#ffffff', fontWeight: 'bold' },
});
