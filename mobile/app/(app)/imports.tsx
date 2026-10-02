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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { importsAPI } from '../../services/api';

interface ImportReceipt {
  receipt_code: string;
  supplier_name?: string;
  created_at: string;
  item_count: number;
  total_amount: number;
}

export default function ImportsScreen() {
  const [imports, setImports] = useState<ImportReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchImports = useCallback(async () => {
    try {
      const res = await importsAPI.getAll();
      const raw = res.data?.data?.imports ?? res.data?.data ?? res.data;
      setImports(Array.isArray(raw) ? raw : []);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={imports}
        keyExtractor={(item, index) => item.receipt_code || String(index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchImports();
            }}
            colors={['#16a34a']}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Chưa có phiếu nhập hàng nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.codeBadge}>
                <Ionicons name="document-text" size={16} color="#2563eb" />
                <Text style={styles.codeText}>{item.receipt_code}</Text>
              </View>
              <Text style={styles.amountText}>{formatCurrency(Number(item.total_amount) || 0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardBody}>
              <View style={styles.row}>
                <Ionicons name="business-outline" size={14} color="#6b7280" />
                <Text style={styles.rowText}>NCC: {item.supplier_name || 'Khách lẻ / Nội bộ'}</Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="cube-outline" size={14} color="#6b7280" />
                <Text style={styles.rowText}>Số loại sản phẩm: {item.item_count || 1}</Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="time-outline" size={14} color="#6b7280" />
                <Text style={styles.rowText}>Ngày nhập: {formatDate(item.created_at)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Alert.alert('Thông báo', 'Chức năng tạo phiếu nhập mới đang được phát triển');
        }}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
        <Text style={styles.fabText}>Nhập hàng</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  amountText: { fontSize: 15, fontWeight: 'bold', color: '#16a34a' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 10 },
  cardBody: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { fontSize: 13, color: '#4b5563' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
