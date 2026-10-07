import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { normalizeOrder, ordersAPI, unwrapData } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { getCartTotal, useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';
import { routes } from '../../utils/routes';

export default function CheckoutScreen() {
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (items.length === 0) {
      setError('Giỏ hàng đang trống.');
      return;
    }
    if (!fullName.trim() || !/^\d{9,11}$/.test(phone.trim()) || !address.trim()) {
      setError('Vui lòng nhập họ tên, số điện thoại hợp lệ và địa chỉ nhận hàng.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await ordersAPI.create({
        items: items.map(({ product, quantity }) => ({
          product_id: product.id,
          quantity,
        })),
        payment_method: 'TIEN_MAT',
        cash_received: 0,
        note: `Người nhận: ${fullName.trim()} | SĐT: ${phone.trim()} | Địa chỉ: ${address.trim()}`,
      });
      const payload = unwrapData<{ order?: unknown }>(response.data);
      const order = normalizeOrder(payload.order ?? payload);
      clearCart();
      if (order.id) {
        router.replace(routes.order(order.id));
      } else {
        Alert.alert('Đã nhận đơn hàng', 'Cửa hàng đã tiếp nhận yêu cầu đặt hàng của bạn.');
        router.replace(routes.orders);
      }
    } catch (cause) {
      const response = (cause as { response?: { data?: { message?: string } } })?.response;
      setError(response?.data?.message || 'Đặt hàng thất bại. Tồn kho có thể vừa thay đổi; vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bag-outline" size={46} color="#94a3b8" />
        <Text style={styles.emptyText}>Giỏ hàng đang trống</Text>
        <TouchableOpacity onPress={() => router.replace(routes.catalog)}>
          <Text style={styles.link}>Quay lại cửa hàng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.stepHeader}>
          <View style={styles.stepIcon}><Ionicons name="location" size={20} color="#0f766e" /></View>
          <View>
            <Text style={styles.title}>Thông tin nhận hàng</Text>
            <Text style={styles.subtitle}>Cửa hàng sẽ liên hệ để xác nhận đơn</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Người nhận *" value={fullName} onChangeText={setFullName} placeholder="Họ và tên" />
          <Field label="Số điện thoại *" value={phone} onChangeText={setPhone} placeholder="09xxxxxxxx" keyboardType="phone-pad" />
          <Field label="Địa chỉ giao hàng *" value={address} onChangeText={setAddress} placeholder="Số nhà, đường, phường/xã, quận/huyện..." multiline />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={styles.paymentMethod}>
            <View style={styles.cashIcon}><Ionicons name="cash-outline" size={20} color="#0f766e" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Tiền mặt khi nhận hàng</Text>
              <Text style={styles.methodHint}>Thanh toán trực tiếp cho nhân viên giao hàng</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#0f766e" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          {items.map(({ product, quantity }) => (
            <View key={product.id} style={styles.line}>
              <Text style={styles.lineName} numberOfLines={1}>{product.name} × {quantity}</Text>
              <Text style={styles.linePrice}>{formatCurrency(product.sellingPrice * quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tạm tính</Text>
            <Text style={styles.total}>{formatCurrency(getCartTotal(items))}</Text>
          </View>
          <Text style={styles.deliveryHint}>Phí giao hàng (nếu có) sẽ được cửa hàng thông báo khi xác nhận.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.submit, submitting && styles.disabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#ffffff" /> : (
            <>
              <Text style={styles.submitText}>Đặt hàng · {formatCurrency(getCartTotal(items))}</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 28 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  stepIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#111827', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 3 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#edf2f4' },
  field: { marginBottom: 13 },
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, color: '#111827' },
  multiline: { minHeight: 82, paddingTop: 12 },
  sectionTitle: { color: '#111827', fontWeight: '800', fontSize: 15, marginBottom: 12 },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cashIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },
  methodTitle: { color: '#1f2937', fontWeight: '700', fontSize: 13 },
  methodHint: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 5, gap: 10 },
  lineName: { flex: 1, color: '#64748b', fontSize: 12 },
  linePrice: { color: '#334155', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#334155', fontWeight: '700' },
  total: { color: '#0f766e', fontSize: 19, fontWeight: '800' },
  deliveryHint: { color: '#94a3b8', fontSize: 11, marginTop: 7 },
  error: { color: '#b91c1c', backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, marginBottom: 12 },
  submit: { height: 52, borderRadius: 13, backgroundColor: '#0f766e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabled: { opacity: 0.65 },
  submitText: { color: '#ffffff', fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#f8fafc' },
  emptyText: { color: '#334155', fontWeight: '700', fontSize: 16 },
  link: { color: '#0f766e', fontWeight: '700' },
});
