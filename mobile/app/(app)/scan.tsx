import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { normalizeProduct, productsAPI, unwrapData } from '../../services/api';
import { routes } from '../../utils/routes';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async ({ data }: BarcodeScanningResult) => {
    if (locked) return;
    setLocked(true);
    setLoading(true);
    setError('');
    try {
      const response = await productsAPI.getByBarcode(data);
      const payload = unwrapData<{ product?: unknown }>(response.data);
      const product = normalizeProduct(payload.product ?? payload);
      router.push(routes.product(product.id));
    } catch (cause) {
      const status = (cause as { response?: { status?: number } })?.response?.status;
      setError(status === 404 ? `Không tìm thấy sản phẩm có mã ${data}.` : 'Không thể tra cứu mã vạch. Kiểm tra mạng rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0f766e" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Ionicons name="camera-outline" size={56} color="#0f766e" />
        <Text style={styles.permissionTitle}>Quét mã sản phẩm</Text>
        <Text style={styles.permissionText}>Cho phép camera để tìm nhanh sản phẩm trong cửa hàng.</Text>
        <TouchableOpacity style={styles.action} onPress={requestPermission}>
          <Text style={styles.actionText}>Cho phép camera</Text>
        </TouchableOpacity>
        {!permission.canAskAgain ? <Text style={styles.permissionText}>Hãy bật quyền camera trong Cài đặt của thiết bị.</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={locked ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
      />
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanLabel}>Đặt mã vạch vào trong khung</Text>
      </View>
      <View style={styles.bottom}>
        <View style={styles.message}>
          {loading ? <ActivityIndicator color="#ffffff" /> : null}
          <Text style={styles.messageText}>{loading ? 'Đang tìm sản phẩm...' : error || 'Mã vạch sẽ được quét tự động'}</Text>
        </View>
        {error ? (
          <TouchableOpacity style={styles.retry} onPress={() => { setError(''); setLocked(false); }}>
            <Text style={styles.retryText}>Quét lại</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.close} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="#111827" />
          <Text style={styles.closeText}>Đóng máy quét</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: 30, gap: 14 },
  permissionTitle: { color: '#111827', fontWeight: '800', fontSize: 21 },
  permissionText: { color: '#64748b', textAlign: 'center', lineHeight: 21 },
  action: { backgroundColor: '#0f766e', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12, marginTop: 8 },
  actionText: { color: '#ffffff', fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 270, height: 220, borderRadius: 22, borderWidth: 3, borderColor: '#5eead4', backgroundColor: 'transparent' },
  scanLabel: { color: '#ffffff', marginTop: 20, fontSize: 15, fontWeight: '600' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  message: { backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  messageText: { color: '#ffffff', textAlign: 'center', flexShrink: 1 },
  retry: { padding: 10 },
  retryText: { color: '#99f6e4', fontWeight: '700' },
  close: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#ffffff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24 },
  closeText: { color: '#111827', fontWeight: '700' },
});
