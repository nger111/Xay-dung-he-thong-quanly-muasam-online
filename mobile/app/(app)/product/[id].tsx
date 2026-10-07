import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ORIGIN, normalizeProduct, Product, productsAPI, unwrapData } from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';
import { formatCurrency } from '../../../utils/format';
import { routes } from '../../../utils/routes';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let active = true;
    productsAPI.getById(id)
      .then((response) => {
        const data = unwrapData<{ product?: unknown }>(response.data);
        if (active) setProduct(normalizeProduct(data.product ?? data));
      })
      .catch((cause) => {
        if (active) {
          const status = (cause as { response?: { status?: number } })?.response?.status;
          setError(status === 404 ? 'Không tìm thấy sản phẩm này.' : 'Không tải được thông tin sản phẩm.');
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
  if (!product) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={46} color="#94a3b8" />
        <Text style={styles.error}>{error || 'Không có dữ liệu sản phẩm.'}</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Quay lại</Text></TouchableOpacity>
      </View>
    );
  }

  const imageUri = product.imageUrl
    ? product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${API_ORIGIN}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`
    : null;

  const addToCart = () => {
    if (addItem(product)) {
      Alert.alert('Đã thêm vào giỏ', product.name, [
        { text: 'Tiếp tục mua', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push(routes.cart) },
      ]);
    } else {
      Alert.alert('Sản phẩm hiện không khả dụng', 'Sản phẩm đã hết hàng hoặc số lượng trong giỏ đã đạt tồn kho.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          ) : (
            <Ionicons name="basket-outline" size={90} color="#0f766e" />
          )}
        </View>
        {product.categoryName ? <Text style={styles.category}>{product.categoryName}</Text> : null}
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="cube-outline" size={18} color="#0f766e" />
          <Text style={styles.stock}>
            {product.stockQuantity > 0 ? `Còn ${product.stockQuantity} ${product.unit}` : 'Tạm hết hàng'}
          </Text>
        </View>
        {product.barcode ? <Text style={styles.code}>Mã sản phẩm: {product.productCode || product.barcode}</Text> : null}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
        <Text style={styles.description}>{product.description || 'Thông tin mô tả chưa được cập nhật.'}</Text>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartShortcut} onPress={() => router.push(routes.cart)}>
          <Ionicons name="bag-outline" size={22} color="#0f766e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, product.stockQuantity <= 0 && styles.disabled]}
          onPress={addToCart}
          disabled={product.stockQuantity <= 0}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addText}>{product.stockQuantity > 0 ? 'Thêm vào giỏ' : 'Tạm hết hàng'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  content: { paddingBottom: 26 },
  imageWrap: { height: 290, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' },
  image: { width: '90%', height: '90%' },
  category: { marginTop: 22, marginHorizontal: 20, color: '#0f766e', fontWeight: '700', fontSize: 13 },
  name: { marginHorizontal: 20, marginTop: 7, color: '#111827', fontSize: 23, lineHeight: 30, fontWeight: '800' },
  price: { marginHorizontal: 20, marginTop: 13, color: '#0f766e', fontWeight: '800', fontSize: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 20, marginTop: 13 },
  stock: { color: '#475569', fontWeight: '600' },
  code: { marginHorizontal: 20, marginTop: 9, color: '#94a3b8', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginHorizontal: 20, marginVertical: 20 },
  sectionTitle: { marginHorizontal: 20, color: '#111827', fontSize: 16, fontWeight: '700' },
  description: { marginHorizontal: 20, marginTop: 8, color: '#64748b', fontSize: 14, lineHeight: 22 },
  bottomBar: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  cartShortcut: { width: 50, height: 50, borderWidth: 1, borderColor: '#99f6e4', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  addButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f766e', borderRadius: 13 },
  disabled: { backgroundColor: '#94a3b8' },
  addText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  error: { color: '#475569', textAlign: 'center' },
  link: { color: '#0f766e', fontWeight: '700' },
});
