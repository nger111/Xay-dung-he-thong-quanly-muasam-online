import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomerOrder, normalizeOrder, ordersAPI, unwrapData } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/format';

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    ordersAPI.getById(id)
      .then((response) => {
        const data = unwrapData<{ order?: unknown }>(response.data);
        if (active) setOrder(normalizeOrder(data.order ?? data));
      })
      .catch((cause) => {
        const status = (cause as { response?: { status?: number } })?.response?.status;
        if (active) {
          setError(status === 404
            ? 'Không tìm thấy đơn hàng hoặc đơn không thuộc tài khoản này.'
            : 'Không tải được chi tiết đơn hàng.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0f766e" /></View>;
  }
  if (!order) {
    return <View style={styles.center}><Ionicons name="alert-circle-outline" size={42} color="#94a3b8" /><Text style={styles.error}>{error}</Text></View>;
  }

  const status = order.status.toUpperCase();
  const cancelled = status === 'CANCELLED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.statusIcon, cancelled && styles.cancelledIcon]}>
          <Ionicons name={cancelled ? 'close' : 'checkmark'} size={27} color={cancelled ? '#b91c1c' : '#0f766e'} />
        </View>
        <Text style={styles.statusTitle}>{statusLabel[status] || status || 'Đang cập nhật'}</Text>
        <Text style={styles.statusHint}>Trạng thái đơn hàng</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.orderHeader}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          <Text style={styles.orderCode}>{order.orderCode || `#${order.id}`}</Text>
        </View>
        <InfoRow label="Ngày đặt" value={formatDate(order.createdAt)} />
        <InfoRow label="Thanh toán" value="Tiền mặt khi nhận hàng" />
        {order.note ? <InfoRow label="Giao đến" value={order.note} multiline /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sản phẩm</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.productLine}>
            <View style={styles.productIcon}><Ionicons name="cube-outline" size={18} color="#0f766e" /></View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.productQty}>{item.quantity} × {formatCurrency(item.unitPrice)}</Text>
            </View>
            <Text style={styles.subtotal}>{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.total}>{formatCurrency(order.totalAmount)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={[styles.infoRow, multiline && styles.infoRowMultiline]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, multiline && styles.address]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 26 },
  error: { color: '#64748b', textAlign: 'center' },
  hero: { alignItems: 'center', backgroundColor: '#ffffff', padding: 22, borderRadius: 18, marginBottom: 12 },
  statusIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccfbf1', marginBottom: 10 },
  cancelledIcon: { backgroundColor: '#fee2e2' },
  statusTitle: { color: '#111827', fontWeight: '800', fontSize: 18 },
  statusHint: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  sectionTitle: { color: '#111827', fontSize: 15, fontWeight: '800' },
  orderCode: { color: '#0f766e', fontWeight: '700', fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
  infoRowMultiline: { flexDirection: 'column', gap: 5 },
  infoLabel: { color: '#64748b', fontSize: 12 },
  infoValue: { color: '#334155', fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  address: { textAlign: 'left', fontWeight: '400', lineHeight: 19 },
  productLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  productIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productName: { color: '#334155', fontWeight: '600', fontSize: 13 },
  productQty: { color: '#94a3b8', marginTop: 4, fontSize: 11 },
  subtotal: { color: '#334155', fontWeight: '700', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: '#334155', fontWeight: '700' },
  total: { color: '#0f766e', fontSize: 18, fontWeight: '800' },
});
