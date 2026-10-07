import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useCart } from '../../hooks/useCart';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export interface Product {
  id: string;
  name: string;
  selling_price?: number;
  sellingPrice?: number;
  price?: number;
  stock_quantity?: number;
  stockQuantity?: number;
  image?: string;
  category?: { name: string };
  brand?: string;
  unit?: string;
}

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/200x200?text=No+Image';

function getPrice(product: Product): number {
  return product.selling_price ?? product.sellingPrice ?? product.price ?? 0;
}

function getStock(product: Product): number {
  return product.stock_quantity ?? product.stockQuantity ?? 0;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, getQuantity } = useCart();
  const price = getPrice(product);
  const stock = getStock(product);
  const inStock = stock > 0;
  const qty = getQuantity(product.id);

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price,
      maxStock: stock,
      image: product.image || undefined,
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/products/${product.id}` as any)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image || PLACEHOLDER_IMAGE }}
          style={styles.image}
          resizeMode="cover"
        />
        {!inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
        {qty > 0 && (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyBadgeText}>{qty}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.unit && (
          <Text style={styles.unit}>{product.unit}</Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{price.toLocaleString('vi-VN')}đ</Text>
          <TouchableOpacity
            style={[styles.addBtn, !inStock && styles.addBtnDisabled]}
            onPress={handleAddToCart}
            disabled={!inStock}
          >
            <Ionicons name="add" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 130,
    backgroundColor: Colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  qtyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  unit: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: Colors.border,
  },
});
