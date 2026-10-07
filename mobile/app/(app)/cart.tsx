import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore, getCartTotal } from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';
import { routes } from '../../utils/routes';

export default function CartScreen() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={items.length ? styles.list : styles.emptyList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="bag-outline" size={38} color="#0f766e" /></View>
            <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
            <Text style={styles.emptyDescription}>Thêm vài món đồ thiết yếu để bắt đầu đơn hàng.</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push(routes.catalog)}>
              <Text style={styles.shopText}>Khám phá sản phẩm</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.unit}>{formatCurrency(item.product.sellingPrice)} / {item.product.unit}</Text>
              <Text style={styles.available}>Tồn hiện có: {item.product.stockQuantity}</Text>
              {item.quantity >= item.product.stockQuantity ? (
                <Text style={styles.stockNotice}>Đã đạt số lượng tồn hiện có</Text>
              ) : null}
            </View>
            <View style={styles.controls}>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                  accessibilityLabel="Giảm số lượng"
                >
                  <Ionicons name="remove" size={17} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.stepButton}
                  onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stockQuantity}
                  accessibilityLabel="Tăng số lượng"
                >
                  <Ionicons name="add" size={17} color={item.quantity >= item.product.stockQuantity ? '#cbd5e1' : '#334155'} />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtotal}>{formatCurrency(item.product.sellingPrice * item.quantity)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.product.id)} accessibilityLabel="Xóa sản phẩm">
                <Ionicons name="trash-outline" size={19} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {items.length > 0 ? (
        <View style={styles.summary}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tạm tính</Text>
            <Text style={styles.total}>{formatCurrency(getCartTotal(items))}</Text>
          </View>
          <Text style={styles.disclaimer}>Phí giao hàng và tổng tiền cuối cùng sẽ được cửa hàng xác nhận.</Text>
          <TouchableOpacity style={styles.checkout} onPress={() => router.push(routes.checkout)}>
            <Text style={styles.checkoutText}>Tiếp tục đặt hàng</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, paddingBottom: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  emptyIcon: { width: 78, height: 78, borderRadius: 26, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { color: '#111827', fontSize: 19, fontWeight: '800' },
  emptyDescription: { color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 21 },
  shopButton: { backgroundColor: '#0f766e', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 20 },
  shopText: { color: '#ffffff', fontWeight: '700' },
  item: { backgroundColor: '#ffffff', borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#edf2f4' },
  itemInfo: { paddingRight: 4 },
  name: { fontSize: 15, color: '#1f2937', fontWeight: '700' },
  unit: { color: '#0f766e', fontWeight: '700', marginTop: 6 },
  available: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
  stockNotice: { color: '#b45309', fontSize: 11, marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10 },
  stepButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 28, textAlign: 'center', fontWeight: '700', color: '#111827' },
  subtotal: { color: '#111827', fontWeight: '800', flex: 1, textAlign: 'right', paddingRight: 16 },
  summary: { backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0', padding: 18, paddingBottom: 22 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#64748b', fontSize: 14 },
  total: { color: '#0f766e', fontSize: 21, fontWeight: '800' },
  disclaimer: { color: '#94a3b8', fontSize: 11, marginTop: 6 },
  checkout: { height: 50, backgroundColor: '#0f766e', borderRadius: 13, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  checkoutText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
