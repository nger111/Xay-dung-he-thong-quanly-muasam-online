import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../../store/cartStore';
import { productsAPI, posAPI, categoriesAPI } from '../../../services/api';
import { Colors } from '../../../constants/colors';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const QUICK_CASH_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function PosScreen() {
  const { items, totalAmount, updateQuantity, removeItem, clearCart, addItem } = useCartStore();

  const [cashInput, setCashInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE'>('TIEN_MAT');
  const [orderNote, setOrderNote] = useState('');
  const [paying, setPaying] = useState(false);

  // Search & browse modal
  const [searchModal, setSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Direct barcode search on top bar
  const [manualBarcode, setManualBarcode] = useState('');

  // Invoice success modal
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const cashReceived =
    paymentMethod === 'TIEN_MAT'
      ? parseFloat(cashInput.replace(/[^0-9.]/g, '')) || 0
      : totalAmount;
  const change = Math.max(0, cashReceived - totalAmount);

  // Load categories for search modal
  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesAPI.getAll();
        const list = res.data?.data?.categories ?? res.data?.data ?? res.data ?? [];
        if (Array.isArray(list)) setCategories(list);
      } catch (e) {}
    })();
  }, []);

  // Search products
  const handleSearch = useCallback(async (q: string, catId: string | null = null) => {
    setSearching(true);
    try {
      if (q.trim()) {
        const res = await productsAPI.search(q.trim());
        const raw = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.products ?? []);
        setSearchResults(list);
      } else {
        const res = await productsAPI.getAll({
          limit: 30,
          category_id: catId || undefined,
        });
        const raw = res.data?.data?.products ?? res.data?.data ?? res.data ?? [];
        setSearchResults(Array.isArray(raw) ? raw : []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const openSearchModal = () => {
    setSearchModal(true);
    handleSearch(searchQuery, selectedCatId);
  };

  // Tra cứu mã vạch nhanh từ ô nhập trên header
  const handleBarcodeSearch = async () => {
    const code = manualBarcode.trim();
    if (!code) return;

    setSearching(true);
    try {
      const res = await productsAPI.getByBarcode(code);
      const product = res.data?.data?.product ?? res.data?.data ?? res.data;
      if (product && product.id) {
        addProductToCart(product);
        setManualBarcode('');
      } else {
        Alert.alert('Không tìm thấy', `Mã vạch "${code}" không tồn tại trong hệ thống`);
      }
    } catch {
      Alert.alert('Không tìm thấy', `Mã vạch "${code}" không tồn tại trong hệ thống`);
    } finally {
      setSearching(false);
    }
  };

  const addProductToCart = (p: any) => {
    const stock = Number(p.stock_quantity ?? p.stockQuantity ?? 0);
    const existing = items.find((i) => String(i.product.id) === String(p.id));

    if (stock <= 0) {
      Alert.alert('Hết hàng', `"${p.name}" hiện đã hết hàng trong kho!`);
      return;
    }

    if (existing && existing.quantity >= stock) {
      Alert.alert('Hết hàng tồn', `"${p.name}" chỉ còn ${stock} sản phẩm trong kho`);
      return;
    }

    addItem({
      id: String(p.id),
      name: p.name,
      price: Number(p.selling_price ?? p.sellingPrice ?? 0),
      sellingPrice: Number(p.selling_price ?? p.sellingPrice ?? 0),
      barcode: p.barcode ?? '',
      stockQuantity: stock,
      unit: p.unit ?? 'cái',
    });

    setSearchModal(false);
    setSearchQuery('');
  };

  // Nút cộng tiền nhanh
  const handleAddQuickCash = (amt: number) => {
    const cur = parseFloat(cashInput.replace(/[^0-9.]/g, '')) || 0;
    setCashInput(String(cur + amt));
  };

  const handleSetExactCash = () => {
    setCashInput(String(totalAmount));
  };

  // Xử lý tạo đơn hàng POS
  const handlePayment = async () => {
    if (items.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng đang trống! Vui lòng quét mã vạch hoặc chọn sản phẩm.');
      return;
    }

    if (paymentMethod === 'TIEN_MAT' && cashReceived < totalAmount) {
      Alert.alert(
        'Chưa đủ tiền',
        `Số tiền khách đưa (${fmt(cashReceived)}) nhỏ hơn tổng đơn (${fmt(totalAmount)})`
      );
      return;
    }

    setPaying(true);
    try {
      const payload = {
        items: items.map((item) => ({
          productId: String(item.product.id),
          quantity: item.quantity,
          price: item.product.sellingPrice ?? item.product.price,
        })),
        totalAmount,
        cashReceived,
        paymentMethod,
        note: orderNote,
      };

      const res = await posAPI.create(payload);
      const order = res.data?.data?.order ?? res.data?.data ?? res.data;

      // Xóa giỏ hàng và mở Modal hóa đơn thành công
      clearCart();
      setCashInput('');
      setOrderNote('');
      setCompletedOrder({
        order_code: order?.order_code || 'HĐ' + Date.now(),
        total_amount: totalAmount,
        cash_received: cashReceived,
        change_amount: change,
        payment_method: paymentMethod,
        created_at: order?.created_at || new Date().toISOString(),
        items_count: items.reduce((s, i) => s + i.quantity, 0),
      });
    } catch (e: any) {
      Alert.alert('Lỗi tạo đơn', e?.response?.data?.message ?? 'Không thể kết nối đến máy chủ');
    } finally {
      setPaying(false);
    }
  };

  const validItems = items.filter((i) => i?.product?.id && i?.product?.name);
  const totalItemsCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* ── Top Header Bar ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bán Hàng POS</Text>
          <Text style={styles.headerSub}>
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalItemsCount} món</Text>
          </View>
          {validItems.length > 0 && (
            <TouchableOpacity
              style={styles.clearCartHeaderBtn}
              onPress={() => {
                Alert.alert('Xoá giỏ hàng', 'Bạn có chắc chắn muốn xoá toàn bộ giỏ hàng?', [
                  { text: 'Không' },
                  { text: 'Xoá hết', style: 'destructive', onPress: clearCart },
                ]);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Controls Bar: Quét Cam & Nhập mã / Tìm kiếm ── */}
      <View style={styles.actionBar}>
        {/* Nút to bật Cam quét mã vạch */}
        <TouchableOpacity
          style={styles.scanCamBtn}
          onPress={() => router.push('/(app)/pos/scanner' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="scan-circle" size={24} color="#FFF" />
          <Text style={styles.scanCamBtnText}>BẬT CAM QUÉT MÃ</Text>
        </TouchableOpacity>

        {/* Hàng nhập mã vạch & nút tìm kiếm */}
        <View style={styles.searchRow}>
          <View style={styles.barcodeInputWrap}>
            <Ionicons name="barcode-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.barcodeInput}
              placeholder="Nhập mã vạch hoặc nhấn quét..."
              placeholderTextColor="#94A3B8"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              returnKeyType="search"
              onSubmitEditing={handleBarcodeSearch}
            />
            {searching ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : manualBarcode.length > 0 ? (
              <TouchableOpacity onPress={handleBarcodeSearch}>
                <Ionicons name="arrow-forward-circle" size={22} color={Colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.findProductBtn} onPress={openSearchModal}>
            <Ionicons name="search" size={18} color={Colors.primary} />
            <Text style={styles.findProductBtnText}>Tìm SP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Danh sách sản phẩm trong giỏ ── */}
      {validItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="barcode-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
          <Text style={styles.emptySubtitle}>
            Bấm "BẬT CAM QUÉT MÃ" hoặc nhập mã vạch để thêm sản phẩm vào đơn hàng
          </Text>
          <TouchableOpacity
            style={styles.emptyScanBtn}
            onPress={() => router.push('/(app)/pos/scanner' as any)}
          >
            <Ionicons name="camera" size={18} color="#FFF" />
            <Text style={styles.emptyScanBtnText}>Mở Camera Quét Mã</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={validItems}
          keyExtractor={(item) => String(item.product.id)}
          style={styles.cartList}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => {
            const price = Number(item.product.sellingPrice ?? item.product.price ?? 0);
            return (
              <View style={styles.cartItemCard}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View style={styles.cartItemMetaRow}>
                    <Text style={styles.cartItemPrice}>{fmt(price)}</Text>
                    {item.product.unit ? (
                      <Text style={styles.cartItemUnit}>/ {item.product.unit}</Text>
                    ) : null}
                    {item.product.barcode ? (
                      <Text style={styles.cartItemBarcode}>🔖 {item.product.barcode}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Bộ điều khiển số lượng */}
                <View style={styles.qtyControlBox}>
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
                        Alert.alert('Tồn kho tối đa', `Trong kho chỉ còn ${item.product.stockQuantity} sản phẩm`);
                        return;
                      }
                      updateQuantity(item.product.id, item.quantity + 1);
                    }}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Thành tiền & nút xoá */}
                <View style={styles.cartItemRight}>
                  <Text style={styles.cartItemSubtotal}>{fmt(price * item.quantity)}</Text>
                  <TouchableOpacity
                    onPress={() => removeItem(item.product.id)}
                    style={styles.cartRemoveBtn}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Bảng Thanh Toán (Payment Panel) ── */}
      <View style={styles.payPanel}>
        {/* Tổng tiền */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TỔNG CỘNG ({totalItemsCount} SP):</Text>
          <Text style={styles.totalValue}>{fmt(totalAmount)}</Text>
        </View>

        {/* Chọn phương thức thanh toán */}
        <View style={styles.paymentMethodsRow}>
          {[
            { id: 'TIEN_MAT', label: 'Tiền mặt', icon: 'cash-outline' },
            { id: 'CHUYEN_KHOAN', label: 'Chuyển khoản', icon: 'qr-code-outline' },
            { id: 'THE', label: 'Quẹt thẻ', icon: 'card-outline' },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.paymentMethodBtn,
                paymentMethod === m.id && styles.paymentMethodBtnActive,
              ]}
              onPress={() => setPaymentMethod(m.id as any)}
            >
              <Ionicons
                name={m.icon as any}
                size={16}
                color={paymentMethod === m.id ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentMethod === m.id && styles.paymentMethodTextActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Khung nhập tiền khách đưa nếu là Tiền mặt */}
        {paymentMethod === 'TIEN_MAT' && (
          <View style={styles.cashSection}>
            <View style={styles.cashInputRow}>
              <Text style={styles.cashInputLabel}>Khách đưa:</Text>
              <View style={styles.cashInputBox}>
                <TextInput
                  style={styles.cashTextInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={cashInput}
                  onChangeText={setCashInput}
                />
                <Text style={styles.cashCurrencyText}>đ</Text>
              </View>
            </View>

            {/* Nút chọn nhanh tiền */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickCashScroll}>
              <TouchableOpacity style={styles.quickCashBtnExact} onPress={handleSetExactCash}>
                <Text style={styles.quickCashBtnTextExact}>Đủ tiền</Text>
              </TouchableOpacity>
              {QUICK_CASH_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickCashBtn}
                  onPress={() => handleAddQuickCash(amt)}
                >
                  <Text style={styles.quickCashBtnText}>+{amt / 1000}k</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tiền thừa trả khách */}
            {cashReceived >= totalAmount && totalAmount > 0 && (
              <View style={styles.changeBanner}>
                <Text style={styles.changeLabel}>Tiền thừa thối khách:</Text>
                <Text style={styles.changeValue}>{fmt(change)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Nút bấm Thanh toán */}
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            (paying || validItems.length === 0) && styles.checkoutBtnDisabled,
          ]}
          onPress={handlePayment}
          disabled={paying || validItems.length === 0}
        >
          {paying ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
              <Text style={styles.checkoutBtnText}>
                THANH TOÁN HÓA ĐƠN {totalAmount > 0 ? `(${fmt(totalAmount)})` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Modal Tìm kiếm & Chọn sản phẩm ── */}
      <Modal
        visible={searchModal}
        animationType="slide"
        onRequestClose={() => setSearchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Sản Phẩm</Text>
            <TouchableOpacity onPress={() => setSearchModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Ô tìm kiếm */}
          <View style={styles.modalSearchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Nhập tên sản phẩm hoặc mã vạch..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(v) => {
                setSearchQuery(v);
                handleSearch(v, selectedCatId);
              }}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearch('', selectedCatId); }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Danh mục lọc nhanh */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabsScroll}>
            <TouchableOpacity
              style={[styles.catTab, !selectedCatId && styles.catTabActive]}
              onPress={() => {
                setSelectedCatId(null);
                handleSearch(searchQuery, null);
              }}
            >
              <Text style={[styles.catTabText, !selectedCatId && styles.catTabTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catTab, selectedCatId === String(c.id) && styles.catTabActive]}
                onPress={() => {
                  const newCat = selectedCatId === String(c.id) ? null : String(c.id);
                  setSelectedCatId(newCat);
                  handleSearch(searchQuery, newCat);
                }}
              >
                <Text
                  style={[
                    styles.catTabText,
                    selectedCatId === String(c.id) && styles.catTabTextActive,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Danh sách kết quả */}
          {searching ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const stock = Number(item.stock_quantity ?? item.stockQuantity ?? 0);
                const price = Number(item.selling_price ?? item.sellingPrice ?? 0);
                const isOutOfStock = stock <= 0;

                return (
                  <TouchableOpacity
                    style={[styles.productResultItem, isOutOfStock && styles.productDisabled]}
                    onPress={() => addProductToCart(item)}
                    disabled={isOutOfStock}
                  >
                    <View style={styles.productIconBox}>
                      <Ionicons name="cube-outline" size={22} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                        <Text style={styles.productBarcode}>Mã: {item.barcode || '—'}</Text>
                        <Text style={{ fontSize: 11, color: isOutOfStock ? '#EF4444' : '#10B981' }}>
                          • Tồn: {stock} {item.unit || 'cái'}
                        </Text>
                      </View>
                      <Text style={styles.productPrice}>{fmt(price)}</Text>
                    </View>
                    <View style={styles.productAddBtn}>
                      <Ionicons name="add" size={20} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* ── Modal Hoá Đơn Thành Công (Invoice Modal) ── */}
      <Modal visible={!!completedOrder} transparent animationType="fade">
        <View style={styles.invoiceModalOverlay}>
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceSuccessIcon}>
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            </View>

            <Text style={styles.invoiceSuccessTitle}>Thanh Toán Thành Công!</Text>
            <Text style={styles.invoiceCode}>#{completedOrder?.order_code}</Text>

            <View style={styles.invoiceDetailsTable}>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceRowLabel}>Tổng tiền:</Text>
                <Text style={styles.invoiceRowValueBold}>{fmt(completedOrder?.total_amount || 0)}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceRowLabel}>Trạng thái đơn:</Text>
                <Text style={[styles.invoiceRowValueBold, { color: '#D97706' }]}>⏳ Chờ xác nhận</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceRowLabel}>Phương thức:</Text>
                <Text style={styles.invoiceRowValue}>
                  {completedOrder?.payment_method === 'TIEN_MAT'
                    ? '💵 Tiền mặt'
                    : completedOrder?.payment_method === 'CHUYEN_KHOAN'
                    ? '🏦 Chuyển khoản QR'
                    : '💳 Thẻ'}
                </Text>
              </View>
              {completedOrder?.payment_method === 'TIEN_MAT' && (
                <>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceRowLabel}>Tiền khách đưa:</Text>
                    <Text style={styles.invoiceRowValue}>{fmt(completedOrder?.cash_received || 0)}</Text>
                  </View>
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceRowLabel}>Tiền thối lại:</Text>
                    <Text style={[styles.invoiceRowValue, { color: '#10B981', fontWeight: '700' }]}>
                      {fmt(completedOrder?.change_amount || 0)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.invoiceDoneBtn}
              onPress={() => setCompletedOrder(null)}
            >
              <Text style={styles.invoiceDoneBtnText}>BÁN ĐƠN TIẾP THEO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    backgroundColor: '#059669', // Màu xanh lục POS hiện đại
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  clearCartHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Action Bar
  actionBar: {
    backgroundColor: '#FFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  scanCamBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  scanCamBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: '#1E293B',
  },
  findProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  findProductBtnText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  emptyScanBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Cart List
  cartList: {
    flex: 1,
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cartItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  cartItemUnit: {
    fontSize: 11,
    color: '#64748B',
  },
  cartItemBarcode: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
  },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartItemRight: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  cartItemSubtotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  cartRemoveBtn: {
    marginTop: 4,
    padding: 2,
  },

  // Payment Panel
  payPanel: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  paymentMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  paymentMethodBtnActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  paymentMethodTextActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // Cash Section
  cashSection: {
    marginBottom: 10,
  },
  cashInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cashInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  cashInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 150,
    backgroundColor: '#F8FAFC',
  },
  cashTextInput: {
    flex: 1,
    height: 34,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'right',
  },
  cashCurrencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  quickCashScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  quickCashBtnExact: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
  },
  quickCashBtnTextExact: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickCashBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
  },
  quickCashBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  changeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  // Checkout Button
  checkoutBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Modal Chọn Sản Phẩm
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    height: 42,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  catTabsScroll: {
    paddingHorizontal: 16,
    marginBottom: 10,
    maxHeight: 38,
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  catTabActive: {
    backgroundColor: '#059669',
  },
  catTabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  catTabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  productResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  productDisabled: {
    opacity: 0.45,
  },
  productIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  productBarcode: {
    fontSize: 11,
    color: '#64748B',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  productAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Hóa Đơn Thành Công
  invoiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  invoiceCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  invoiceSuccessIcon: {
    marginBottom: 8,
  },
  invoiceSuccessTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  invoiceCode: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 16,
  },
  invoiceDetailsTable: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceRowLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  invoiceRowValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  invoiceRowValueBold: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '800',
  },
  invoiceDoneBtn: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  invoiceDoneBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
