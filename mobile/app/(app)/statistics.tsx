import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { statisticsAPI } from '../../services/api';

interface DashboardStats {
  today_revenue?: number | string;
  today_orders?: number | string;
  total_products?: number | string;
  low_stock?: number | string;
  out_of_stock?: number | string;
  expired_batches?: number | string;
  expiring_soon?: number | string;
}

export default function StatisticsScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await statisticsAPI.getDashboard();
      const raw = res.data?.data ?? res.data;
      setStats(raw);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount: number | string) => {
    const val = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchStats();
          }}
          colors={['#16a34a']}
        />
      }
      contentContainerStyle={styles.content}
    >
      <View style={styles.cardHighlight}>
        <View style={styles.iconCircleHighlight}>
          <Ionicons name="cash" size={28} color="#16a34a" />
        </View>
        <Text style={styles.labelHighlight}>Doanh thu hôm nay</Text>
        <Text style={styles.valueHighlight}>
          {formatCurrency(stats?.today_revenue ?? 0)}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { borderLeftColor: '#3b82f6' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="cart" size={20} color="#2563eb" />
          </View>
          <Text style={styles.label}>Đơn hàng hôm nay</Text>
          <Text style={styles.value}>{stats?.today_orders ?? 0}</Text>
        </View>

        <View style={[styles.card, { borderLeftColor: '#f59e0b' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="cube" size={20} color="#d97706" />
          </View>
          <Text style={styles.label}>Tổng sản phẩm</Text>
          <Text style={styles.value}>{stats?.total_products ?? 0}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { borderLeftColor: '#eab308' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#fef9c3' }]}>
            <Ionicons name="warning" size={20} color="#ca8a04" />
          </View>
          <Text style={styles.label}>Sắp hết hàng</Text>
          <Text style={[styles.value, { color: '#ca8a04' }]}>{stats?.low_stock ?? 0}</Text>
        </View>

        <View style={[styles.card, { borderLeftColor: '#ef4444' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
          </View>
          <Text style={styles.label}>Hết hàng</Text>
          <Text style={[styles.value, { color: '#dc2626' }]}>{stats?.out_of_stock ?? 0}</Text>
        </View>
      </View>

      <View style={[styles.cardFull, { borderLeftColor: '#8b5cf6' }]}>
        <View style={[styles.iconCircle, { backgroundColor: '#ede9fe' }]}>
          <Ionicons name="time" size={22} color="#7c3aed" />
        </View>
        <View style={styles.cardFullText}>
          <Text style={styles.label}>Hạn sử dụng các lô hàng</Text>
          <Text style={styles.valueWarning}>
            {stats?.expired_batches ?? 0} lô hết hạn / {stats?.expiring_soon ?? 0} lô sắp hết hạn
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardHighlight: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 4,
  },
  iconCircleHighlight: {
    backgroundColor: '#dcfce7',
    padding: 14,
    borderRadius: 30,
    marginBottom: 10,
  },
  labelHighlight: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  valueHighlight: { fontSize: 26, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: { fontSize: 13, color: '#6b7280' },
  value: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  cardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  cardFullText: { flex: 1 },
  valueWarning: { fontSize: 15, fontWeight: 'bold', color: '#7c3aed', marginTop: 2 },
});
