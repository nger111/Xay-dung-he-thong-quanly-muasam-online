import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { statisticsAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Báo cáo & Thống kê</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStats(); }}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.cardHighlight}>
          <View style={styles.iconCircleHighlight}>
            <Ionicons name="cash" size={28} color={Colors.success} />
          </View>
          <Text style={styles.labelHighlight}>Doanh thu hôm nay</Text>
          <Text style={styles.valueHighlight}>
            {formatCurrency(stats?.today_revenue ?? 0)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, { borderLeftColor: Colors.primary }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="cart" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.label}>Đơn hàng hôm nay</Text>
            <Text style={styles.value}>{stats?.today_orders ?? 0}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: Colors.info }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.infoLight }]}>
              <Ionicons name="cube" size={20} color={Colors.info} />
            </View>
            <Text style={styles.label}>Tổng sản phẩm</Text>
            <Text style={styles.value}>{stats?.total_products ?? 0}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, { borderLeftColor: Colors.warning }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="warning" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.label}>Sắp hết hàng</Text>
            <Text style={[styles.value, { color: Colors.warning }]}>{stats?.low_stock ?? 0}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: Colors.error }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.errorLight }]}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
            </View>
            <Text style={styles.label}>Hết hàng</Text>
            <Text style={[styles.value, { color: Colors.error }]}>{stats?.out_of_stock ?? 0}</Text>
          </View>
        </View>

        <View style={[styles.cardFull, { borderLeftColor: '#7C3AED' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="time" size={22} color="#7C3AED" />
          </View>
          <View style={styles.cardFullText}>
            <Text style={styles.label}>Hạn sử dụng các lô hàng</Text>
            <Text style={styles.valueWarning}>
              {stats?.expired_batches ?? 0} lô hết hạn / {stats?.expiring_soon ?? 0} lô sắp hết hạn
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardHighlight: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, alignItems: 'center',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3, marginBottom: 4,
  },
  iconCircleHighlight: {
    backgroundColor: Colors.successLight, padding: 14, borderRadius: 30, marginBottom: 10,
  },
  labelHighlight: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  valueHighlight: { fontSize: 26, fontWeight: '800', color: Colors.success, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    borderLeftWidth: 4, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, gap: 6,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  label: { fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 20, fontWeight: '800', color: Colors.text },
  cardFull: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 12, padding: 16, borderLeftWidth: 4,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, gap: 12,
  },
  cardFullText: { flex: 1 },
  valueWarning: { fontSize: 15, fontWeight: '700', color: '#7C3AED', marginTop: 2 },
});
