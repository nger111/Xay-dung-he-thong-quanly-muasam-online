import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import {
  categoriesAPI,
  Category,
  normalizeCategory,
  normalizeProduct,
  productsAPI,
  Product,
  unwrapData,
} from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { routes } from '../../utils/routes';

const getRows = (response: unknown, key: string): unknown[] => {
  const data = unwrapData<Record<string, unknown>>(response);
  const list = data[key];
  return Array.isArray(list) ? list : [];
};

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ q?: string; category_id?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [categoryId, setCategoryId] = useState(params.category_id ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let active = true;
    categoriesAPI.getAll()
      .then((response) => {
        if (active) setCategories(getRows(response.data, 'categories').map(normalizeCategory));
      })
      .catch(() => {
        if (active) setError('Không thể tải danh mục sản phẩm.');
      });
    return () => { active = false; };
  }, []);

  const loadProducts = useCallback(async (searchText: string, selectedCategory: string) => {
    const requestId = ++requestSequence.current;
    setError('');
    try {
      const response = searchText.trim()
        ? await productsAPI.search(searchText.trim())
        : await productsAPI.getAll({ limit: 100, ...(selectedCategory ? { category_id: selectedCategory } : {}) });
      if (requestId !== requestSequence.current) return;
      let list = getRows(response.data, 'products').map(normalizeProduct);
      if (searchText.trim() && selectedCategory) {
        list = list.filter((product) => product.categoryId === selectedCategory);
      }
      setProducts(list);
    } catch {
      if (requestId === requestSequence.current) {
        setError('Không tải được sản phẩm. Vui lòng thử lại.');
      }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProducts(query, categoryId);
    }, query ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [query, categoryId, loadProducts]);

  const addToCart = (product: Product) => {
    if (!addItem(product)) {
      Alert.alert('Chưa thể thêm sản phẩm', 'Sản phẩm đã hết hàng hoặc đã đạt số lượng tồn hiện có.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#64748b" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm tên, mã sản phẩm..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => router.push(routes.scan)}>
          <Ionicons name="scan-outline" size={22} color="#0f766e" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(product) => product.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void loadProducts(query, categoryId); }}
            colors={['#0f766e']}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Khám phá sản phẩm</Text>
            <FlatList
              horizontal
              data={[{ id: '', name: 'Tất cả', description: null }, ...categories]}
              keyExtractor={(category) => category.id || 'all'}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryChip, categoryId === item.id && styles.categoryChipActive]}
                  onPress={() => setCategoryId(item.id)}
                >
                  <Text style={[styles.categoryText, categoryId === item.id && styles.categoryTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} size="large" color="#0f766e" />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>{error ? 'Có lỗi khi tải dữ liệu' : 'Không tìm thấy sản phẩm'}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {error ? (
                <TouchableOpacity onPress={() => { setLoading(true); void loadProducts(query, categoryId); }}>
                  <Text style={styles.retry}>Thử lại</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(routes.product(item.id))}
            onAdd={() => addToCart(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, paddingHorizontal: 14, height: 48, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, color: '#111827' },
  list: { paddingBottom: 20, flexGrow: 1 },
  header: { marginBottom: 12 },
  title: { color: '#111827', fontSize: 21, fontWeight: '800', paddingHorizontal: 18, marginBottom: 14 },
  categoryList: { paddingHorizontal: 18, gap: 8, paddingBottom: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  categoryChipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  categoryText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#ffffff' },
  productRow: { justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  loader: { padding: 28 },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 36, gap: 10 },
  emptyTitle: { color: '#334155', fontSize: 16, fontWeight: '700' },
  error: { textAlign: 'center', color: '#b91c1c' },
  retry: { color: '#0f766e', fontWeight: '700', padding: 8 },
});
