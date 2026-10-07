// POS Screen for Mobile (React Native)
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '../../../store/cartStore';
import { ordersAPI } from '../../../services/api';

export default function PosScreen() {
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCartStore();
  const [cashInput, setCashInput] = useState('');
  const [paying, setPaying] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const shopName = 'Cửa hàng Demo';
  const cashReceived = parseFloat(cashInput.replace(/[^0-9.]/g, '')) || 0;
  const change = cashReceived - totalAmount;

  const handlePayment = async () => {
    if (items.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng đang trống!');
      return;
    }
    if (cashReceived < totalAmount) {
      Alert.alert('Thông báo', 'Số tiền khách đưa không đủ!');
      return;
    }
    setPaying(true);
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount,
        cashReceived,
        payment_method: 'TIEN_MAT',
      };
      const res = await ordersAPI.create(payload);
      const order = res.data?.data?.order ?? res.data?.data ?? res.data;
      const orderCode = order?.order_code ? `Mã HĐ: ${order.order_code}\n` : '';
      clearCart();
      setCashInput('');
      Alert.alert('✅ Thanh toán thành công', `${orderCode}Tiền thừa: ${formatCurrency(change)}`);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message ?? 'Không thể tạo đơn hàng');
    } finally {
      setPaying(false);
    }
  };

  return (
    <LinearGradient colors={['#0ea5e9', '#2563eb']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{shopName}</Text>
        <Text style={styles.headerTime}>{new Date().toLocaleTimeString('vi-VN')}</Text>
      </View>
      {/* Scanner button */}
      <TouchableOpacity style={styles.scannerBtn} onPress={() => router.push('/(app)/pos/scanner')}>
        <Ionicons name="scan" size={20} color="#ffffff" />
        <Text style={styles.scannerBtnText}>Quét mã vạch để thêm sản phẩm</Text>
      </TouchableOpacity>
      {/* Cart list */}
      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubText}>Quét mã vạch để thêm sản phẩm</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.product.id}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.cartItemPrice}>{formatCurrency(item.product.price)}/sp</Text>
              </View>
              <View style={styles.quantityControl}>
                <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={16} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={16} color="#374151" />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtotal}>{formatCurrency(item.product.price * item.quantity)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.product.id)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      {/* Payment panel */}
      <View style={styles.paymentPanel}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        <TextInput
          style={styles.cashInput}
          placeholder="Tiền khách đưa (VNĐ)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={cashInput}
          onChangeText={setCashInput}
        />
        {cashReceived > 0 && cashReceived >= totalAmount && (
          <View style={styles.changeRow}>
            <Text style={styles.changeLabel}>Tiền thừa:</Text>
            <Text style={styles.changeValue}>{formatCurrency(change)}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.payBtn, (paying || items.length === 0) && styles.payBtnDisabled]}
          onPress={handlePayment}
          disabled={paying || items.length === 0}
        >
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text style={styles.payBtnText}>{paying ? 'Đang xử lý...' : 'Thanh toán'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/(app)/statistics')}>
          <Ionicons name="analytics-outline" size={20} color="#ffffff" />
          <Text style={styles.reportBtnText}>Xem báo cáo</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  headerTime: { fontSize: 14, color: '#e0e7ff' },
  scannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    margin: 12,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffffff50',
  },
  scannerBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 18, color: '#ffffff', fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#d1d5db' },
  list: { flex: 1 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cartItemPrice: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, gap: 4 },
  qtyBtn: { padding: 6 },
  qty: { fontSize: 15, fontWeight: 'bold', color: '#111827', minWidth: 24, textAlign: 'center' },
  subtotal: { fontSize: 14, fontWeight: 'bold', color: '#16a34a', minWidth: 80, textAlign: 'right' },
  paymentPanel: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#dc2626' },
  cashInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#111827', marginBottom: 8, backgroundColor: '#ffffff' },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  changeLabel: { fontSize: 15, color: '#6b7280' },
  changeValue: { fontSize: 15, fontWeight: 'bold', color: '#16a34a' },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 14, gap: 8 },
  payBtnDisabled: { backgroundColor: '#86efac' },
  payBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, marginTop: 12, gap: 8 },
  reportBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
