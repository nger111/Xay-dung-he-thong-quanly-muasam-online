import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI } from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';
import { Product } from '../../../store/cartStore';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const res = await productsAPI.getByBarcode(data);
      const raw = res.data?.data ?? res.data;

      const product: Product = {
        id: String(raw.id ?? raw._id ?? ''),
        name: raw.name ?? '',
        price: Number(raw.sellingPrice ?? raw.exportPrice ?? raw.price ?? 0),
        barcode: raw.barcode ?? data,
        code: raw.productCode ?? raw.code ?? '',
        importPrice: Number(raw.importPrice ?? 0),
        stockQuantity: Number(raw.stockQuantity ?? raw.stock ?? 0),
        unit: raw.unit,
      };

      addItem(product);
      Alert.alert('✅ Đã thêm vào giỏ', product.name, [
        {
          text: 'Quét tiếp',
          onPress: () => setScanned(false),
        },
        {
          text: 'Quay lại',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const msg =
        error?.response?.status === 404
          ? `Không tìm thấy sản phẩm với mã: ${data}`
          : 'Lỗi khi tìm sản phẩm. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg, [
        { text: 'Quét lại', onPress: () => setScanned(false) },
        { text: 'Thoát', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.infoText}>Đang yêu cầu quyền camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-off" size={64} color="#9ca3af" />
        <Text style={styles.infoText}>Không có quyền truy cập camera</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>

      <View style={styles.bottomInfo}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.loadingText}>Đang tìm sản phẩm...</Text>
          </View>
        ) : (
          <Text style={styles.hint}>
            {scanned ? 'Đang xử lý...' : 'Hướng camera vào mã vạch sản phẩm'}
          </Text>
        )}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    gap: 16,
  },
  infoText: { fontSize: 16, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
  backBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: { color: '#ffffff', fontWeight: 'bold' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 10,
  },
  loadingText: { color: '#ffffff', fontSize: 15 },
  hint: {
    color: '#ffffff',
    fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelBtn: {
    backgroundColor: 'rgba(220,38,38,0.8)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cancelText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});
