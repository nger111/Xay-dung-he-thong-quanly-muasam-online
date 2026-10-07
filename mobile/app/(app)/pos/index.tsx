import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../../store/cartStore';
import { ordersAPI, productsAPI } from '../../../services/api';
import { Colors } from '../../../constants/colors';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function PosScreen() {
  const { items, totalAmount, updateQuantity, removeItem, clearCart, addItem } = useCartStore();
  const [cashInput, setCashInput] = useState('');
  const [paying, setPaying] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  const cashReceived = parseFloat(cashInput.replace(/[^0-9.]/g, '')) || 0;
  const change = cashReceived - totalAmount;

  // Search products by name
  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await productsAPI.search(q);
      const raw = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(raw) ? raw : (raw?.products ?? []);
      setSearchResults(list);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Search by barcode
  const handleBarcodeSearch = async () => {
    if (!manualBarcode.trim()) return;
    setSearching(true);
    try {
      const res = await productsAPI.getByBarcode(manualBarcode.trim());
      const product = res.data?.data ?? res.data;
      if (product) {
        addProductToCart(product);
        setManualBarcode('');
      } else {
        Alert.alert('Không tìm thấy', `Không có sản phẩm với mã vạch: ${manualBarcode}`);
      }
    } catch {
      Alert.alert('Không tìm thấy', `Mã vạch "${manualBarcode}" không tồn tại trong hệ thống`);
    } finally {
      setSearching(false);
    }
  };

  const addProductToCart = (p: any) => {
    const stock = p.stock_quantity ?? p.stockQuantity ?? 999;
    const existingItem = items.find((i) => i.product.id === String(p.id));
    if (existingItem && existingItem.quantity >= stock) {
      Alert.alert('Hết hàng', `"${p.name}" chỉ còn ${stock} sản phẩm trong kho`);
      return;
    }
    addItem({
      id: String(p.id),
      name: p.name,
      price: p.selling_price ?? p.sellingPrice ?? 0,
      sellingPrice: p.selling_price ?? p.sellingPrice ?? 0,
      barcode: p.barcode ?? '',
      stockQuantity: stock,
      unit: p.unit ?? 'cái',
    });
    setSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handlePayment = async () => {
    if (items.length === 0) { Alert.alert('Thông báo', 'Giỏ hàng đang trống!'); return; }
    if (cashReceived < totalAmount) { Alert.alert('Thiếu tiền', 'Số tiền khách đưa không đủ!'); return; }
    setPaying(true);
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.sellingPrice ?? item.product.price,
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
      Alert.alert('✅ Thanh toán thành công!', `${orderCode}Tiền thừa: ${fmt(change)}`);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không thể tạo đơn hàng');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bán hàng (POS)</Text>
          <Text style={styles.headerSub}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{items.length} SP</Text>
        </View>
      </View>

      {/* Add Product Buttons */}
      <View style={styles.addBtns}>
        {/* Manual barcode input */}
        <View style={styles.barcodeRow}>
          <View style={styles.barcodeInput}>
            <Ionicons name="barcode-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.barcodeTextInput}
              placeholder="Nhập mã vạch..."
              placeholderTextColor={Colors.placeholder}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="default"
              returnKeyType="search"
              onSubmitEditing={handleBarcodeSearch}
            />
            {searching && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>
          <TouchableOpacity style={styles.barcodeSearchBtn} onPress={handleBarcodeSearch}>
            <Ionicons name="search" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionBtnsRow}>
          {/* Search by name */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setSearchModal(true)}
          >
            <Ionicons name="search-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Tìm sản phẩm</Text>
          </TouchableOpacity>

          {/* Scan barcode */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.success, borderColor: Colors.success }]}
            onPress={() => router.push('/(app)/pos/scanner' as any)}
          >
            <Ionicons name="scan-outline" size={18} color={Colors.white} />
            <Text style={[styles.actionBtnText, { color: Colors.white }]}>Quét mã</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cart */}
      {items.filter((i) => i?.product?.id && i?.product?.name).length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={72} color={Colors.border} />
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtitle}>Tìm sản phẩm hoặc quét mã vạch để thêm</Text>
        </View>
      ) : (
        <FlatList
          data={items.filter((i) => i?.product?.id && i?.product?.name)}
          keyExtractor={(item) => item.product.id}
          style={styles.cartList}
          renderItem={({ item }) => {
            const price = item.product.sellingPrice ?? item.product.price ?? 0;
            return (
              <View style={styles.cartItem}>
                <View style={styles.cartItemBody}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>{fmt(price)} / {item.product.unit ?? 'cái'}</Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (item.quantity >= item.product.stockQuantity) {
                        Alert.alert('Hết hàng', `Chỉ còn ${item.product.stockQuantity} trong kho`);
                        return;
                      }
                      updateQuantity(item.product.id, item.quantity + 1);
                    }}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartItemTotal}>{fmt(price * item.quantity)}</Text>
                <TouchableOpacity onPress={() => removeItem(item.product.id)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Payment Panel */}
      <View style={styles.payPanel}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng tiền:</Text>
          <Text style={styles.totalValue}>{fmt(totalAmount)}</Text>
        </View>

        <View style={styles.cashRow}>
          <Ionicons name="cash-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.cashInput}
            placeholder="Tiền khách đưa (VNĐ)"
            placeholderTextColor={Colors.placeholder}
            keyboardType="numeric"
            value={cashInput}
            onChangeText={setCashInput}
          />
        </View>

        {cashReceived >= totalAmount && totalAmount > 0 && (
          <View style={styles.changeRow}>
            <Text style={styles.changeLabel}>Tiền thừa trả khách:</Text>
            <Text style={styles.changeValue}>{fmt(change)}</Text>
          </View>
        )}

        <View style={styles.payBtns}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { Alert.alert('Huỷ đơn', 'Xác nhận huỷ toàn bộ giỏ hàng?', [{ text: 'Không' }, { text: 'Huỷ đơn', style: 'destructive', onPress: () => { clearCart(); setCashInput(''); } }]); }}
          >
            <Text style={styles.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payBtn, (paying || items.length === 0) && styles.payBtnDisabled]}
            onPress={handlePayment}
            disabled={paying || items.length === 0}
          >
            {paying ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.payBtnText}>Thanh toán</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Product Modal */}
      <Modal visible={searchModal} animationType="slide" onRequestClose={() => setSearchModal(false)}>
        <View style={styles.searchModalContainer}>
          <View style={styles.searchModalHeader}>
            <Text style={styles.searchModalTitle}>Tìm sản phẩm</Text>
            <TouchableOpacity onPress={() => { setSearchModal(false); setSearchQuery(''); setSearchResults([]); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchModalInput}>
            <Ionicons name="search" size={18} color={Colors.placeholder} />
            <TextInput
              style={styles.searchModalTextInput}
              placeholder="Nhập tên sản phẩm..."
              placeholderTextColor={Colors.placeholder}
              value={searchQuery}
              onChangeText={(v) => { setSearchQuery(v); handleSearch(v); }}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const stock = item.stock_quantity ?? item.stockQuantity ?? 0;
              const price = item.selling_price ?? item.sellingPrice ?? 0;
              return (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => addProductToCart(item)}
                  disabled={stock <= 0}
                >
                  <View style={styles.searchResultIcon}>
                    <Ionicons name="cube" size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, stock <= 0 && { color: Colors.placeholder }]}>
                      {item.name}
                    </Text>
                    {item.barcode ? (
                      <Text style={styles.searchResultBarcode}>🔖 {item.barcode}</Text>
                    ) : null}
                    <Text style={styles.searchResultPrice}>{fmt(price)}</Text>
                  </View>
                  <View>
                    {stock <= 0 ? (
                      <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Hết hàng</Text>
                      </View>
                    ) : (
                      <View style={styles.addToCartBtn}>
                        <Ionicons name="add" size={18} color={Colors.white} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              searchQuery.length > 0 && !searching ? (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>Không tìm thấy sản phẩm</Text>
                </View>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  headerBadgeText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  addBtns: { backgroundColor: Colors.white, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  barcodeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  barcodeInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: Colors.background, paddingHorizontal: 12,
  },
  barcodeTextInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10 },
  barcodeSearchBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, width: 44, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  emptyCart: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  emptySubtitle: { fontSize: 13, color: Colors.placeholder, textAlign: 'center' },
  cartList: { flex: 1 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, marginHorizontal: 12, marginVertical: 4,
    borderRadius: 12, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  cartItemBody: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  cartItemPrice: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
  },
  qtyBtn: { padding: 6 },
  qtyText: { fontSize: 14, fontWeight: '700', color: Colors.text, minWidth: 28, textAlign: 'center' },
  cartItemTotal: { fontSize: 14, fontWeight: '700', color: Colors.primary, minWidth: 80, textAlign: 'right' },
  removeBtn: { padding: 4 },
  payPanel: {
    backgroundColor: Colors.white, padding: 16, borderTopWidth: 1.5, borderTopColor: Colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  totalValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
  cashRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 8, backgroundColor: Colors.background,
  },
  cashInput: { flex: 1, fontSize: 16, color: Colors.text, paddingVertical: 11 },
  changeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.successLight, borderRadius: 10, padding: 10, marginBottom: 10,
  },
  changeLabel: { fontSize: 14, color: '#15803D' },
  changeValue: { fontSize: 16, fontWeight: '800', color: Colors.success },
  payBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  payBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 14,
  },
  payBtnDisabled: { backgroundColor: '#86EFAC' },
  payBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  // Search modal
  searchModalContainer: { flex: 1, backgroundColor: Colors.white },
  searchModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchModalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  searchModalInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12,
    backgroundColor: Colors.background, paddingHorizontal: 14,
  },
  searchModalTextInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 12 },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchResultIcon: {
    width: 44, height: 44, backgroundColor: Colors.primaryLight,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  searchResultBarcode: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  searchResultPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  addToCartBtn: {
    width: 36, height: 36, backgroundColor: Colors.success,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  outOfStockBadge: {
    backgroundColor: Colors.errorLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  outOfStockText: { fontSize: 11, color: Colors.error, fontWeight: '600' },
  searchEmpty: { padding: 32, alignItems: 'center' },
  searchEmptyText: { fontSize: 15, color: Colors.textSecondary },
});
