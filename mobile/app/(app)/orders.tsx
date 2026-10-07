import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomerOrder, normalizeOrder, ordersAPI, unwrapData } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { routes } from '../../utils/routes';

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

import { useAuthStore } from '../../store/authStore';

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isStaff = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'CASHIER';

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await ordersAPI.getMine({ limit: 50 });
      const data = unwrapData<{ orders?: unknown[] }>(response.data);
      setOrders((data.orders ?? []).map(normalizeOrder));
    } catch (cause) {
      const resp = (cause as { response?: { status?: number; data?: { message?: string } } })?.response;
      setError(resp?.data?.message || (resp?.status === 403
        ? 'Tài khoản hiện tại không có quyền xem đơn hàng.'
        : 'Không tải được đơn hàng. Vui lòng kiểm tra kết nối.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0f766e" /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={orders.length ? styles.list : styles.emptyList}
      data={orders}
      keyExtractor={(order) => order.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); void load(); }}
          colors={['#0f766e']}
        />
      }
      ListHeaderComponent={orders.length ? <Text style={styles.heading}>{isStaff ? `Quản lý đơn hàng (${orders.length})` : 'Lịch sử mua hàng'}</Text> : null}
      ListEmptyComponent={
        <View style={styles.center}>
          <View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={38} color="#0f766e" /></View>
          <Text style={styles.emptyTitle}>{error ? 'Chưa thể tải đơn hàng' : 'Bạn chưa có đơn hàng'}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : (
            <Text style={styles.emptyText}>Các đơn bạn đặt sẽ xuất hiện tại đây.</Text>
          )}
          {error ? (
            <TouchableOpacity onPress={() => { setLoading(true); void load(); }}>
              <Text style={styles.retry}>Thử lại</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push(routes.catalog)}>
              <Text style={styles.shopButtonText}>Bắt đầu mua sắm</Text>
            </TouchableOpacity>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const status = item.status.toUpperCase();
        const cancelled = status === 'CANCELLED';
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(routes.order(item.id))}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.orderCode}>{item.orderCode || `Đơn #${item.id}`}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={[styles.status, cancelled && styles.cancelled]}>
                <Text style={[styles.statusText, cancelled && styles.cancelledText]}>
                  {statusLabel[status] || status || 'Đang cập nhật'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardBottom}>
              <Text style={styles.itemsText}>{item.items.length || '—'} sản phẩm</Text>
              <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
              <Ionicons name="chevron-forward" size={17} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, paddingBottom: 28 },
  emptyList: { flexGrow: 1 },
  heading: { color: '#111827', fontSize: 20, fontWeight: '800', marginBottom: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIcon: { width: 76, height: 76, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccfbf1', marginBottom: 17 },
  emptyTitle: { color: '#111827', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: '#64748b', marginTop: 7, textAlign: 'center' },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 8 },
  retry: { color: '#0f766e', fontWeight: '700', marginTop: 16 },
  shopButton: { backgroundColor: '#0f766e', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 11, marginTop: 20 },
  shopButtonText: { color: '#ffffff', fontWeight: '700' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 11, padding: 15, borderWidth: 1, borderColor: '#edf2f4' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  orderCode: { color: '#1f2937', fontWeight: '800', fontSize: 14 },
  date: { color: '#94a3b8', marginTop: 4, fontSize: 11 },
  status: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: '#ccfbf1' },
  cancelled: { backgroundColor: '#fee2e2' },
  statusText: { color: '#0f766e', fontSize: 11, fontWeight: '700' },
  cancelledText: { color: '#b91c1c' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 13 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemsText: { color: '#64748b', fontSize: 12, flex: 1 },
  amount: { color: '#0f766e', fontWeight: '800', fontSize: 15 },
});
