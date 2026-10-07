import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI } from '../../../services/api';
import { Colors } from '../../../constants/colors';

interface Product {
  id: number | string;
  product_code?: string;
  sku?: string;
  barcode?: string;
  name: string;
  import_price?: number;
  selling_price?: number;
  sellingPrice?: number;
  stock_quantity?: number;
  stockQuantity?: number;
  unit?: string;
  shelf_location?: string;
  expiry_date?: string;
  category?: { name: string };
  is_active?: boolean;
}

const fmt = (n?: number) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
    : '--';

const getDaysLeft = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expiring' | 'low'>('all');

  const fetchProducts = useCallback(async (q = '') => {
    try {
      setError(null);
      const res = q ? await productsAPI.search(q) : await productsAPI.getAll();
      const raw = res.data?.data ?? res.data ?? [];
      const list: Product[] = Array.isArray(raw) ? raw : (raw?.products ?? []);
      setProducts(list);
    } catch {
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const handleDelete = async (product: Product) => {
    Alert.alert(
      'Xoá sản phẩm',
      `Bạn có chắc muốn xoá "${product.name}"?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá', style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await productsAPI.delete(product.id);
              setSelectedProduct(null);
              fetchProducts(query);
              Alert.alert('✅ Đã xoá sản phẩm');
            } catch (e: any) {
              Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không thể xoá sản phẩm');
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStockQty = (p: Product) => p?.stock_quantity ?? p?.stockQuantity ?? 0;
  const getSellingPrice = (p: Product) => p?.selling_price ?? p?.sellingPrice ?? 0;
  const getImportPrice = (p: Product) => p?.import_price ?? 0;

  const filteredProducts = products.filter((p) => {
    if (!p) return false;
    if (filter === 'expiring') {
      const d = getDaysLeft(p.expiry_date);
      return d !== null && d <= 30 && d >= 0;
    }
    if (filter === 'low') return getStockQty(p) <= 10;
    return true;
  });

  const renderItem = ({ item }: { item: Product }) => {
    const stock = getStockQty(item);
    const daysLeft = getDaysLeft(item.expiry_date);
    const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
    const isExpired = daysLeft !== null && daysLeft < 0;
    const isLowStock = stock <= 10;

    const stockColor = stock <= 0 ? Colors.error : isLowStock ? Colors.warning : Colors.success;
    const stockBg = stock <= 0 ? Colors.errorLight : isLowStock ? Colors.warningLight : Colors.successLight;

    return (
      <TouchableOpacity
        style={[styles.productCard, (isExpiringSoon || isExpired) && styles.productCardWarning]}
        onPress={() => setSelectedProduct(item)}
        activeOpacity={0.8}
      >
        <View style={styles.productIcon}>
          <Ionicons name="cube" size={26} color={Colors.primary} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.productMeta}>
            {item.barcode ? (
              <Text style={styles.productCode}>🔖 {item.barcode}</Text>
            ) : null}
            {item.shelf_location ? (
              <Text style={styles.productCode}>📍 {item.shelf_location}</Text>
            ) : null}
          </View>
          {isExpired ? (
            <View style={styles.expiryBadgeExpired}>
              <Text style={styles.expiryBadgeText}>⚠️ Đã hết hạn!</Text>
            </View>
          ) : isExpiringSoon ? (
            <View style={styles.expiryBadgeWarning}>
              <Text style={styles.expiryBadgeText}>⏰ Còn {daysLeft} ngày</Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.sellingPrice}>{fmt(getSellingPrice(item))}</Text>
            <Text style={styles.importPrice}>Nhập: {fmt(getImportPrice(item))}</Text>
          </View>
        </View>
        <View style={styles.rightCol}>
          <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
            <Text style={[styles.stockText, { color: stockColor }]}>
              {stock} {item.unit ?? 'cái'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.placeholder} style={{ marginTop: 8 }} />
        </View>
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>Sản phẩm</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(app)/products/add' as any)}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên, mã vạch..."
          placeholderTextColor={Colors.placeholder}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `Tất cả (${products.length})` },
          { key: 'expiring', label: '⏰ Sắp hết hạn' },
          { key: 'low', label: '📦 Sắp hết' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key as any)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={48} color={Colors.placeholder} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchProducts(query)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchProducts(query); }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={52} color={Colors.placeholder} />
              <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
            </View>
          }
          contentContainerStyle={filteredProducts.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
        />
      )}

      {/* Product Detail Modal */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{selectedProduct?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailGrid}>
              <DetailRow icon="barcode-outline" label="Mã vạch" value={selectedProduct?.barcode ?? 'Chưa có'} />
              <DetailRow icon="location-outline" label="Vị trí" value={selectedProduct?.shelf_location ?? 'Chưa xếp'} />
              <DetailRow icon="pricetag-outline" label="Giá bán" value={fmt(getSellingPrice(selectedProduct!))} highlight />
              <DetailRow icon="arrow-down-circle-outline" label="Giá nhập" value={fmt(getImportPrice(selectedProduct!))} />
              <DetailRow icon="layers-outline" label="Tồn kho" value={`${getStockQty(selectedProduct!)} ${selectedProduct?.unit ?? 'cái'}`} />
              {selectedProduct?.expiry_date && (
                <DetailRow
                  icon="calendar-outline"
                  label="Hạn sử dụng"
                  value={new Date(selectedProduct.expiry_date).toLocaleDateString('vi-VN')}
                  warning={(getDaysLeft(selectedProduct.expiry_date) ?? 999) <= 30}
                />
              )}
              {selectedProduct?.category && (
                <DetailRow icon="grid-outline" label="Danh mục" value={selectedProduct.category.name} />
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setSelectedProduct(null);
                  router.push({ pathname: '/(app)/products/edit', params: { id: String(selectedProduct?.id) } } as any);
                }}
              >
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
                <Text style={styles.editBtnText}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => selectedProduct && handleDelete(selectedProduct)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    <Text style={styles.deleteBtnText}>Xoá</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ icon, label, value, highlight, warning }: {
  icon: string; label: string; value: string; highlight?: boolean; warning?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={Colors.textSecondary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[
        styles.detailValue,
        highlight && { color: Colors.primary, fontWeight: '700' },
        warning && { color: Colors.warning, fontWeight: '700' },
      ]}>
        {value}
      </Text>
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
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, margin: 12, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.primary, fontWeight: '700' },
  productCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, marginHorizontal: 12, marginVertical: 4,
    borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  productCardWarning: { borderLeftColor: Colors.warning },
  productIcon: {
    width: 48, height: 48, backgroundColor: Colors.primaryLight,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  productMeta: { gap: 1 },
  productCode: { fontSize: 11, color: Colors.textSecondary },
  expiryBadgeWarning: {
    backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 6,
    paddingVertical: 2, alignSelf: 'flex-start', marginTop: 3,
  },
  expiryBadgeExpired: {
    backgroundColor: Colors.errorLight, borderRadius: 4, paddingHorizontal: 6,
    paddingVertical: 2, alignSelf: 'flex-start', marginTop: 3,
  },
  expiryBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sellingPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  importPrice: { fontSize: 11, color: Colors.textSecondary },
  rightCol: { alignItems: 'flex-end' },
  stockBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  stockText: { fontSize: 12, fontWeight: '700' },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: Colors.white, fontWeight: '700' },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, flex: 1, marginRight: 8 },
  detailGrid: { gap: 0, marginBottom: 20 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  detailLabel: { fontSize: 13, color: Colors.textSecondary, width: 90 },
  detailValue: { flex: 1, fontSize: 14, color: Colors.text, textAlign: 'right' },
  modalActions: { flexDirection: 'row', gap: 12 },
  editBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 13,
  },
  editBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderRadius: 12, paddingVertical: 13,
  },
  deleteBtnText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
});
