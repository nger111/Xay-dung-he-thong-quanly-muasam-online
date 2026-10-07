import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
  product_count?: number;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  default: 'grid-outline',
  'thực phẩm': 'fast-food-outline',
  'đồ uống': 'cafe-outline',
  'gia vị': 'leaf-outline',
  'bánh kẹo': 'ice-cream-outline',
  'vệ sinh': 'sparkles-outline',
  'rau củ': 'nutrition-outline',
  'trái cây': 'nutrition-outline',
  'thịt': 'restaurant-outline',
  'hải sản': 'fish-outline',
  'sữa': 'beaker-outline',
};

function getCategoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return CATEGORY_ICONS.default;
}

interface CategoryCardProps {
  category: Category;
  index?: number;
  horizontal?: boolean;
}

export function CategoryCard({ category, index = 0, horizontal = false }: CategoryCardProps) {
  const colorIndex = index % Colors.categoryColors.length;
  const bgColor = Colors.categoryColors[colorIndex];
  const iconColor = Colors.categoryIconColors[colorIndex];
  const count = category.productCount ?? category.product_count ?? 0;
  const icon = getCategoryIcon(category.name);

  if (horizontal) {
    return (
      <TouchableOpacity
        style={styles.hCard}
        onPress={() => router.push({ pathname: '/(app)/products', params: { categoryId: category.id, categoryName: category.name } } as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.hIconWrapper, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.hName} numberOfLines={1}>{category.name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={() => router.push({ pathname: '/(app)/products', params: { categoryId: category.id, categoryName: category.name } } as any)}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={32} color={iconColor} />
      <Text style={[styles.name, { color: iconColor }]} numberOfLines={2}>
        {category.name}
      </Text>
      {count > 0 && (
        <Text style={[styles.count, { color: iconColor + 'AA' }]}>{count} sản phẩm</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  count: {
    fontSize: 11,
    marginTop: 2,
  },
  hCard: {
    alignItems: 'center',
    marginRight: 14,
    width: 64,
  },
  hIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  hName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    width: 64,
  },
});
