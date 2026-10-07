import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Vibration,
  Animated,
  Platform,
} from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { normalizeProduct, productsAPI, unwrapData } from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';
import { Colors } from '../../../constants/colors';

// Danh sách mã vạch mẫu trong database để test nhanh
const SAMPLE_BARCODES = [
  { barcode: '8934588012301', name: 'Coca-Cola 330ml' },
  { barcode: '8934673012311', name: 'Mì Hảo Hảo' },
  { barcode: '8934713012304', name: 'Aquafina 500ml' },
  { barcode: '8935024012317', name: 'Tương ớt Chinsu' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [loading, setLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannedProductInfo, setScannedProductInfo] = useState<{
    name: string;
    price: number;
    barcode: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const { items, totalAmount, addItem } = useCartStore();
  const isCooldown = useRef(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Hiệu ứng tia quét laser di chuyển lên xuống
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 220,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  // Xử lý khi camera nhận diện được mã vạch
  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (isCooldown.current || loading || !data) return;

    // Chặn quét lặp trong 1.5 giây
    isCooldown.current = true;
    setTimeout(() => {
      isCooldown.current = false;
    }, 1500);

    await processBarcode(data);
  };

  // Tra cứu sản phẩm theo mã vạch từ API Backend
  const processBarcode = async (barcodeText: string) => {
    const cleanCode = barcodeText.trim();
    if (!cleanCode) return;

    setLoading(true);
    setErrorMessage(null);
    setLastScannedCode(cleanCode);

    try {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(80);
      }

      const res = await productsAPI.getByBarcode(cleanCode);
      const payload = unwrapData<{ product?: unknown }>(res.data);
      const product = normalizeProduct(payload.product ?? payload);

      if (!product || !product.id) {
        throw new Error('Sản phẩm không hợp lệ');
      }

      const success = addItem({
        id: String(product.id),
        name: product.name,
        price: product.sellingPrice || product.price,
        sellingPrice: product.sellingPrice || product.price,
        barcode: product.barcode,
        stockQuantity: product.stockQuantity,
        unit: product.unit || 'cái',
      });

      if (!success) {
        setErrorMessage(`⚠️ "${product.name}" đã hết hàng trong kho!`);
        setScannedProductInfo(null);
      } else {
        setScannedProductInfo({
          name: product.name,
          price: product.sellingPrice || product.price,
          barcode: product.barcode,
        });
        setErrorMessage(null);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setErrorMessage(`❌ Không tìm thấy sản phẩm có mã: ${cleanCode}`);
      } else {
        setErrorMessage(err?.response?.data?.message || 'Lỗi tra cứu mã vạch từ hệ thống');
      }
      setScannedProductInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Màn hình xin quyền Camera ──
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateText}>Đang khởi tạo camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permIconBox}>
          <Ionicons name="camera-outline" size={56} color={Colors.primary} />
        </View>
        <Text style={styles.permTitle}>Quyền Truy Cập Camera</Text>
        <Text style={styles.permDesc}>
          Cần cấp quyền camera để quét mã vạch sản phẩm và bán hàng nhanh chóng.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Cấp Quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtnText} onPress={() => router.back()}>
          <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>Quay lại POS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Camera Live View */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
      />

      {/* Top Controls Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconCircleBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.topTitleBox}>
          <Text style={styles.topTitle}>Quét Mã Vạch</Text>
          <Text style={styles.topSubtitle}>Chế độ quét liên tục</Text>
        </View>

        <View style={styles.topRightBtns}>
          {/* Torch toggle */}
          <TouchableOpacity
            style={[styles.iconCircleBtn, torch && styles.iconActiveBtn]}
            onPress={() => setTorch((prev) => !prev)}
          >
            <Ionicons
              name={torch ? 'flash' : 'flash-outline'}
              size={20}
              color={torch ? '#F59E0B' : '#FFF'}
            />
          </TouchableOpacity>

          {/* Flip camera */}
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanner Viewfinder / Khung quét */}
      <View style={styles.viewFinderWrapper}>
        <View style={styles.viewFinder}>
          {/* 4 Góc định vị */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Tia quét Laser đỏ/xanh chạy động */}
          <Animated.View
            style={[
              styles.laserLine,
              {
                transform: [{ translateY: scanLineAnim }],
              },
            ]}
          />
        </View>
        <Text style={styles.guideText}>Đặt mã vạch hoặc mã QR vào giữa khung</Text>
      </View>

      {/* Thông báo kết quả quét (Toast card dưới khung) */}
      <View style={styles.bottomCardWrapper}>
        {loading && (
          <View style={styles.feedbackCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.feedbackLoading}>Đang tìm sản phẩm ({lastScannedCode})...</Text>
          </View>
        )}

        {!loading && scannedProductInfo && (
          <View style={[styles.feedbackCard, styles.feedbackSuccess]}>
            <View style={styles.feedbackIconSuccess}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedbackTitle} numberOfLines={1}>
                {scannedProductInfo.name}
              </Text>
              <Text style={styles.feedbackMeta}>
                {fmt(scannedProductInfo.price)} • Mã: {scannedProductInfo.barcode}
              </Text>
            </View>
            <View style={styles.badgeAdded}>
              <Text style={styles.badgeAddedText}>+1 Vào giỏ</Text>
            </View>
          </View>
        )}

        {!loading && errorMessage && (
          <View style={[styles.feedbackCard, styles.feedbackError]}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.feedbackErrorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Nút nhập mã thủ công & Mã mẫu test nhanh */}
        {showManualInput ? (
          <View style={styles.manualInputCard}>
            <View style={styles.manualInputRow}>
              <TextInput
                style={styles.manualTextInput}
                placeholder="Nhập mã vạch sản phẩm..."
                placeholderTextColor="#94A3B8"
                value={manualCode}
                onChangeText={setManualCode}
                keyboardType="numeric"
                returnKeyType="search"
                onSubmitEditing={() => processBarcode(manualCode)}
                autoFocus
              />
              <TouchableOpacity
                style={styles.manualSubmitBtn}
                onPress={() => processBarcode(manualCode)}
              >
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Gợi ý mã mẫu database */}
            <View style={styles.sampleCodesRow}>
              <Text style={styles.sampleLabel}>Mẫu có sẵn:</Text>
              {SAMPLE_BARCODES.map((s) => (
                <TouchableOpacity
                  key={s.barcode}
                  style={styles.sampleBadge}
                  onPress={() => processBarcode(s.barcode)}
                >
                  <Text style={styles.sampleBadgeText}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickTextBtn}
              onPress={() => setShowManualInput(true)}
            >
              <Ionicons name="keypad-outline" size={16} color="#E2E8F0" />
              <Text style={styles.quickTextBtnText}>Nhập mã tay / Mã test</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Cart Bar / Nút quay lại giỏ hàng POS */}
        <TouchableOpacity
          style={styles.cartFloatingBar}
          onPress={() => router.back()}
          activeOpacity={0.88}
        >
          <View style={styles.cartIconBadge}>
            <Ionicons name="cart" size={20} color="#FFF" />
            {totalItemsCount > 0 && (
              <View style={styles.cartCountPill}>
                <Text style={styles.cartCountPillText}>{totalItemsCount}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cartBarTitle}>Giỏ hàng POS</Text>
            <Text style={styles.cartBarAmount}>{fmt(totalAmount)}</Text>
          </View>

          <View style={styles.cartBarAction}>
            <Text style={styles.cartBarActionText}>Thanh toán</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  stateText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  permIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  permDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  permBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backBtnText: {
    marginTop: 16,
    padding: 10,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconActiveBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  topTitleBox: {
    alignItems: 'center',
  },
  topTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topSubtitle: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  topRightBtns: {
    flexDirection: 'row',
    gap: 8,
  },

  // ViewFinder (Khung ngắm quét)
  viewFinderWrapper: {
    position: 'absolute',
    top: '24%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  viewFinder: {
    width: 250,
    height: 250,
    borderRadius: 20,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#10B981',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 10,
    height: 2.5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  guideText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom Wrapper
  bottomCardWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 36 : 20,
    left: 16,
    right: 16,
    zIndex: 20,
    gap: 10,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  feedbackLoading: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackSuccess: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(6, 78, 59, 0.92)',
  },
  feedbackIconSuccess: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackMeta: {
    color: '#A7F3D0',
    fontSize: 12,
    marginTop: 2,
  },
  badgeAdded: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeAddedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(127, 29, 29, 0.92)',
  },
  feedbackErrorText: {
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Manual Input & Samples
  manualInputCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualTextInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#FFF',
    fontSize: 14,
  },
  manualSubmitBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleCodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  sampleLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginRight: 2,
  },
  sampleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sampleBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
  },

  quickActionsRow: {
    alignItems: 'center',
  },
  quickTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  quickTextBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },

  // Floating Cart Bar
  cartFloatingBar: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cartIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartCountPill: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  cartCountPillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cartBarTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  cartBarAmount: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  cartBarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  cartBarActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
