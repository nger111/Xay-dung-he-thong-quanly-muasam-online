import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_ORIGIN, Product } from '../services/api';
import { formatCurrency } from '../utils/format';

export default function ProductCard({
  product,
  onPress,
  onAdd,
}: {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
}) {
  const imageUri = product.imageUrl
    ? product.imageUrl.startsWith('http')
      ? product.imageUrl
      : `${API_ORIGIN}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`
    : null;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <Ionicons name="basket-outline" size={38} color="#0f766e" />
          )}
        </View>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit} · {product.stockQuantity > 0 ? `Còn ${product.stockQuantity}` : 'Tạm hết hàng'}</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.price}>{formatCurrency(product.sellingPrice)}</Text>
        <TouchableOpacity
          style={[styles.addButton, product.stockQuantity <= 0 && styles.disabled]}
          onPress={onAdd}
          disabled={product.stockQuantity <= 0}
          accessibilityLabel={`Thêm ${product.name} vào giỏ`}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    maxWidth: '49%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#edf2f4',
  },
  imageWrap: {
    height: 112,
    borderRadius: 12,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  image: { width: '100%', height: '100%' },
  name: { color: '#1f2937', fontSize: 14, fontWeight: '600', minHeight: 38 },
  unit: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  price: { color: '#0f766e', fontWeight: '800', fontSize: 14, flex: 1 },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { backgroundColor: '#cbd5e1' },
});
