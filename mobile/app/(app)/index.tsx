import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { statisticsAPI, productsAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

interface DashboardStats {
  today_revenue: number;
  today_orders: number;
  total_products: number;
  low_stock: number;
  out_of_stock: number;
  expired_batches?: number;
  expiring_soon?: number;
}

interface ExpiringProduct {
  id: string | number;
  name: string;
  barcode?: string;
  expiry_date?: string;
  stockQuantity?: number;
  shelf_location?: string;
  daysLeft?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const getDaysLeft = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, prodRes] = await Promise.allSettled([
        statisticsAPI.getDashboard(),
        productsAPI.getAll(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data?.data ?? statsRes.value.data ?? {};
        setStats(d);
      }

      if (prodRes.status === 'fulfilled') {
        const raw = prodRes.value.data?.data ?? prodRes.value.data ?? [];
        const list: any[] = Array.isArray(raw) ? raw : (raw?.products ?? []);
        // Lọc sản phẩm sắp hết hạn (trong 30 ngày)
        const expiring = list
          .filter((p: any) => {
            const days = getDaysLeft(p.expiry_date);
            return days !== null && days <= 30 && days >= 0;
          })
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode,
            expiry_date: p.expiry_date,
            stockQuantity: p.stockQuantity ?? p.stock_quantity ?? 0,
            shelf_location: p.shelf_location ?? p.shelfLocation,
            daysLeft: getDaysLeft(p.expiry_date) ?? 0,
          }))
          .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
        setExpiringProducts(expiring);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const KPICard = ({
    icon, label, value, color, bg, onPress,
  }: {
    icon: string; label: string; value: string | number; color: string; bg: string; onPress?: () => void;
  }) => (
    <TouchableOpacity style={[styles.kpiCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.kpiInfo}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()} 👋</Text>
          <Text style={styles.userName}>{user?.full_name ?? user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Expiry Warning Banner */}
      {expiringProducts.length > 0 && (
        <TouchableOpacity
          style={styles.warningBanner}
          onPress={() => router.push('/(app)/products' as any)}
        >
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={24} color={Colors.warning} />
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>
              ⚠️ {expiringProducts.length} sản phẩm sắp hết hạn!
            </Text>
            <Text style={styles.warningText}>
              {expiringProducts[0]?.name} — còn {expiringProducts[0]?.daysLeft} ngày
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.warning} />
        </TouchableOpacity>
      )}

      {/* KPI Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hôm nay</Text>
        <View style={styles.kpiGrid}>
          <KPICard
            icon="cash-outline"
            label="Doanh thu"
            value={fmt(stats?.today_revenue ?? 0)}
            color={Colors.success}
            bg={Colors.successLight}
          />
          <KPICard
            icon="receipt-outline"
            label="Đơn hàng"
            value={stats?.today_orders ?? 0}
            color={Colors.primary}
            bg={Colors.primaryLight}
          />
          <KPICard
            icon="cube-outline"
            label="Tổng sản phẩm"
            value={stats?.total_products ?? 0}
            color={Colors.info}
            bg={Colors.infoLight}
            onPress={() => router.push('/(app)/products' as any)}
          />
          <KPICard
            icon="alert-circle-outline"
            label="Sắp hết hàng"
            value={stats?.low_stock ?? 0}
            color={Colors.warning}
            bg={Colors.warningLight}
            onPress={() => router.push('/(app)/inventory' as any)}
          />
          <KPICard
            icon="close-circle-outline"
            label="Hết hàng"
            value={stats?.out_of_stock ?? 0}
            color={Colors.error}
            bg={Colors.errorLight}
            onPress={() => router.push('/(app)/inventory' as any)}
          />
          <KPICard
            icon="time-outline"
            label="Sắp hết hạn"
            value={expiringProducts.length}
            color="#7C3AED"
            bg="#F5F3FF"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'cart', label: 'Bán hàng', route: '/(app)/pos', color: Colors.primary },
            { icon: 'add-circle', label: 'Thêm SP', route: '/(app)/products/add', color: Colors.success },
            { icon: 'archive', label: 'Kho hàng', route: '/(app)/inventory', color: Colors.warning },
            { icon: 'bar-chart', label: 'Báo cáo', route: '/(app)/statistics', color: '#7C3AED' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickAction, { borderTopColor: action.color }]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                <Ionicons name={action.icon as any} size={26} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Expiring Products List */}
      {expiringProducts.length > 0 && (
        <View style={[styles.section, { paddingBottom: 30 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm sắp hết hạn</Text>
            <Text style={styles.sectionCount}>{expiringProducts.length}</Text>
          </View>
          {expiringProducts.slice(0, 5).map((p) => {
            const isUrgent = (p.daysLeft ?? 0) <= 7;
            return (
              <View key={p.id} style={[styles.expiryCard, isUrgent && styles.expiryCardUrgent]}>
                <View style={[styles.expiryDays, { backgroundColor: isUrgent ? Colors.errorLight : Colors.warningLight }]}>
                  <Text style={[styles.expiryDaysNum, { color: isUrgent ? Colors.error : Colors.warning }]}>
                    {p.daysLeft}
                  </Text>
                  <Text style={[styles.expiryDaysLabel, { color: isUrgent ? Colors.error : Colors.warning }]}>
                    ngày
                  </Text>
                </View>
                <View style={styles.expiryInfo}>
                  <Text style={styles.expiryName} numberOfLines={1}>{p.name}</Text>
                  {p.barcode ? (
                    <Text style={styles.expiryBarcode}>Mã vạch: {p.barcode}</Text>
                  ) : null}
                  {p.shelf_location ? (
                    <Text style={styles.expiryLocation}>
                      <Ionicons name="location-outline" size={11} color={Colors.textSecondary} /> {p.shelf_location}
                    </Text>
                  ) : null}
                  <Text style={styles.expiryDate}>
                    HSD: {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : 'Chưa có'}
                  </Text>
                </View>
                {isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>Gấp!</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingHorizontal: 20,
    paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  roleText: { fontSize: 11, color: Colors.white, fontWeight: '600' },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.warningLight, margin: 16, borderRadius: 12,
    padding: 14, borderLeftWidth: 4, borderLeftColor: Colors.warning,
  },
  warningIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center',
  },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  warningText: { fontSize: 12, color: '#B45309', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  sectionCount: {
    backgroundColor: Colors.primary, color: Colors.white,
    fontSize: 12, fontWeight: '700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  kpiGrid: { gap: 10 },
  kpiCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    borderLeftWidth: 4, shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  kpiIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiInfo: { flex: 1 },
  kpiLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  kpiValue: { fontSize: 18, fontWeight: '800' },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickAction: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  expiryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: Colors.warning,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  expiryCardUrgent: { borderLeftColor: Colors.error },
  expiryDays: {
    width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  expiryDaysNum: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  expiryDaysLabel: { fontSize: 10, fontWeight: '600' },
  expiryInfo: { flex: 1 },
  expiryName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  expiryBarcode: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  expiryLocation: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  expiryDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  urgentBadge: {
    backgroundColor: Colors.errorLight, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  urgentText: { fontSize: 11, fontWeight: '700', color: Colors.error },
});
