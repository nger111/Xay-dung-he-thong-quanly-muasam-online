import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useCartStore } from '../../store/cartStore';

export function CartIcon() {
  const totalItems = useCartStore((s) =>
    s.items.reduce((total, item) => total + item.quantity, 0)
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/(app)/cart' as any)}
    >
      <Ionicons name="cart-outline" size={26} color={Colors.text} />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalItems > 99 ? '99+' : totalItems}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
