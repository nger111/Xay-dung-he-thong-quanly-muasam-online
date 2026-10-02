import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI } from '../../../services/api';

interface Product {
  id: string;
  productCode: string;
  barcode: string;
  name: string;
  importPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
}

export default function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (searchQuery = '') => {
    try {
      setError(null);
      const res = searchQuery
        ? await productsAPI.search(searchQuery)
        : await productsAPI.getAll();
      const raw = res.data?.data ?? res.data;
      const list: Product[] = Array.isArray(raw) ? raw : (raw?.products ?? []);
      setProducts(list);
    } catch {
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Tìm kiếm debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts(query);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const getStockColor = (stock: number) => {
    if (stock <= 0) return '#dc2626';
    if (stock < 10) return '#f59e0b';
    return '#16a34a';
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
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchProducts(query)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchProducts(query); }}
              colors={['#16a34a']}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productIcon}>
                <Ionicons name="cube" size={28} color="#3b82f6" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productCode}>Mã: {item.productCode}</Text>
                <Text style={styles.productPrice}>{formatCurrency(item.sellingPrice)}</Text>
              </View>
              <View style={styles.stockBadge}>
                <Text style={[styles.stockText, { color: getStockColor(item.stockQuantity) }]}>
                  {item.stockQuantity} {item.unit ?? 'cái'}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/products/add')}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productIcon: {
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    padding: 10,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  productCode: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  productPrice: { fontSize: 13, color: '#16a34a', fontWeight: '600', marginTop: 4 },
  stockBadge: { alignItems: 'flex-end' },
  stockText: { fontSize: 13, fontWeight: 'bold' },
  errorText: { fontSize: 15, color: '#dc2626', textAlign: 'center' },
  retryBtn: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#ffffff', fontWeight: 'bold' },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#16a34a',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
