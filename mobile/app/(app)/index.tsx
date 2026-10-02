import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { statisticsAPI } from '../../services/api';

interface DashboardData {
  today_revenue: number;
  today_orders: number;
  total_products: number;
  low_stock: number;
  out_of_stock: number;
  expired_batches: number;
  expiring_soon: number;
}

const menuItems = [
  { title: 'Bán hàng', icon: 'cart' as const, route: '/(app)/pos', color: '#f97316' },
  { title: 'Sản phẩm', icon: 'cube' as const, route: '/(app)/products', color: '#3b82f6' },
  { title: 'Tồn kho', icon: 'archive' as const, route: '/(app)/inventory', color: '#10b981' },
  { title: 'Nhập hàng', icon: 'download' as const, route: '/(app)/imports', color: '#8b5cf6' },
  { title: 'Báo cáo', icon: 'bar-chart' as const, route: '/(app)/statistics', color: '#14b8a6' },
];

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await statisticsAPI.getDashboard();
      setStats(res.data?.data ?? res.data);
    } catch {
      // Stats not critical - show empty
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào 👋</Text>
          <Text style={styles.userName}>{user?.fullName ?? user?.username ?? 'Người dùng'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
          <Ionicons name="cash" size={24} color="#16a34a" />
          <Text style={styles.statValue}>
            {loading ? '...' : formatCurrency(stats?.today_revenue ?? 0)}
          </Text>
          <Text style={styles.statLabel}>Doanh thu hôm nay</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
          <Ionicons name="receipt" size={24} color="#2563eb" />
          <Text style={styles.statValue}>{loading ? '...' : stats?.today_orders ?? 0}</Text>
          <Text style={styles.statLabel}>Đơn hàng hôm nay</Text>
        </View>
      </View>

      {loading ? null : (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#fef9c3' }]}>
            <Ionicons name="warning" size={24} color="#ca8a04" />
            <Text style={styles.statValue}>{stats?.low_stock ?? 0}</Text>
            <Text style={styles.statLabel}>Sắp hết hàng</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="close-circle" size={24} color="#dc2626" />
            <Text style={styles.statValue}>{stats?.out_of_stock ?? 0}</Text>
            <Text style={styles.statLabel}>Hết hàng</Text>
          </View>
        </View>
      )}

      {/* Menu Grid */}
      <Text style={styles.sectionTitle}>Chức năng</Text>
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={32} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#16a34a',
  },
  greeting: {
    fontSize: 14,
    color: '#bbf7d0',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 32,
  },
  menuItem: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
