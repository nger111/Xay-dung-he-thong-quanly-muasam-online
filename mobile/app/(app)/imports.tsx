import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
  Animated,
  Vibration,
} from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { importsAPI, suppliersAPI, productsAPI, unwrapData, normalizeProduct } from '../../services/api';
import { Colors } from '../../constants/colors';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

interface ImportItemRow {
  product_id: number;
  product_name: string;
  barcode: string;
  unit: string;
  quantity: number;
  import_price: number;
  batch_code: string;
  expiry_date: string;
}

export default function ImportsScreen() {
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal Tạo Phiếu Nhập
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [importDate, setImportDate] = useState(new Date().toISOString().slice(0, 10));
  const [importNote, setImportNote] = useState('');
  const [importItems, setImportItems] = useState<ImportItemRow[]>([]);

  // Modal Chọn Sản Phẩm thủ công
  const [selectProductModal, setSelectProductModal] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Modal Chi Tiết Phiếu Nhập
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal Quét Camera Barcode trong Phiếu Nhập
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [cameraScanning, setCameraScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; success: boolean } | null>(null);
  const isCooldown = useRef(false);
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Hiệu ứng tia laser
  useEffect(() => {
    if (cameraModalVisible) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, { toValue: 200, duration: 1600, useNativeDriver: true }),
          Animated.timing(laserAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [cameraModalVisible, laserAnim]);

  // Load danh sách phiếu nhập
  const fetchImports = useCallback(async () => {
    try {
      const res = await importsAPI.getAll();
      const raw = res.data?.data?.imports ?? res.data?.data ?? res.data;
      setImports(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.warn('Lỗi tải danh sách phiếu nhập:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load danh sách nhà cung cấp & sản phẩm
  const loadInitialFormData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        suppliersAPI.getAll(),
        productsAPI.getAll({ limit: 100 }),
      ]);
      const supList = supRes.data?.data?.suppliers ?? supRes.data?.data ?? supRes.data ?? [];
      const prodList = prodRes.data?.data?.products ?? prodRes.data?.data ?? prodRes.data ?? [];
      setSuppliers(Array.isArray(supList) ? supList : []);
      setAvailableProducts(Array.isArray(prodList) ? prodList : []);
      if (supList.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supList[0].id);
      }
    } catch (err) {
      console.warn('Lỗi tải NCC/Sản phẩm:', err);
    }
  };

  useEffect(() => {
    fetchImports();
    loadInitialFormData();
  }, [fetchImports]);

  // Mở modal tạo phiếu nhập mới
  const handleOpenCreateModal = () => {
    loadInitialFormData();
    setImportDate(new Date().toISOString().slice(0, 10));
    setImportNote('');
    setImportItems([]);
    setCreateModalVisible(true);
  };

  // Sinh mã lô ngẫu nhiên theo ngày: LO-YYYYMMDD-XXX
  const generateBatchCode = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `LO-${today}-${rand}`;
  };

  // Tính hạn sử dụng mặc định (+1 năm)
  const getDefaultExpiryDate = () => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().slice(0, 10);
  };

  // Thêm sản phẩm vào danh sách phiếu nhập
  const addProductToImportList = (product: any, qty: number = 10) => {
    const existingIndex = importItems.findIndex((item) => item.product_id === Number(product.id));

    if (existingIndex >= 0) {
      // Đã có -> tăng số lượng
      const updated = [...importItems];
      updated[existingIndex].quantity += qty;
      setImportItems(updated);
    } else {
      // Chưa có -> thêm dòng mới
      const newRow: ImportItemRow = {
        product_id: Number(product.id),
        product_name: product.name,
        barcode: product.barcode || '',
        unit: product.unit || 'cái',
        quantity: qty,
        import_price: Number(product.import_price || product.importPrice || product.selling_price || 0),
        batch_code: generateBatchCode(),
        expiry_date: getDefaultExpiryDate(),
      };
      setImportItems((prev) => [newRow, ...prev]);
    }
  };

  // Xử lý quét mã vạch bằng camera
  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (isCooldown.current || cameraScanning || !data) return;

    isCooldown.current = true;
    setTimeout(() => {
      isCooldown.current = false;
    }, 1500);

    setCameraScanning(true);
    setScanMessage(null);

    try {
      if (Platform.OS !== 'web') Vibration.vibrate(70);

      const res = await productsAPI.getByBarcode(data.trim());
      const payload = unwrapData<{ product?: unknown }>(res.data);
      const product = normalizeProduct(payload.product ?? payload);

      if (product && product.id) {
        addProductToImportList(product, 10);
        setScanMessage({
          text: `Đã thêm: ${product.name} (SL: 10 ${product.unit || 'cái'})`,
          success: true,
        });
      } else {
        setScanMessage({
          text: `Không tìm thấy sản phẩm có mã: ${data}`,
          success: false,
        });
      }
    } catch {
      setScanMessage({
        text: `Mã vạch "${data}" chưa có trong danh mục sản phẩm`,
        success: false,
      });
    } finally {
      setCameraScanning(false);
    }
  };

  // Cập nhật trường trong từng dòng sản phẩm
  const updateItemField = (index: number, field: keyof ImportItemRow, val: any) => {
    const updated = [...importItems];
    updated[index] = { ...updated[index], [field]: val };
    setImportItems(updated);
  };

  // Xóa 1 dòng sản phẩm
  const removeImportItem = (index: number) => {
    setImportItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Tính tổng tiền phiếu nhập
  const grandTotal = importItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.import_price) || 0),
    0
  );

  // Gửi form lưu phiếu nhập hàng
  const handleSubmitImport = async () => {
    if (!selectedSupplierId) {
      Alert.alert('Chưa chọn NCC', 'Vui lòng chọn Nhà cung cấp!');
      return;
    }
    if (importItems.length === 0) {
      Alert.alert('Chưa có sản phẩm', 'Vui lòng quét mã hoặc thêm ít nhất 1 sản phẩm vào phiếu nhập!');
      return;
    }

    // Kiểm tra dữ liệu từng dòng
    for (const item of importItems) {
      if (item.quantity <= 0) {
        Alert.alert('Số lượng không hợp lệ', `Sản phẩm "${item.product_name}" phải có số lượng > 0`);
        return;
      }
      if (item.import_price < 0) {
        Alert.alert('Đơn giá không hợp lệ', `Đơn giá của "${item.product_name}" không được âm`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const selectedSup = suppliers.find((s) => s.id === selectedSupplierId);
      const payload = {
        supplier_id: selectedSupplierId,
        supplier_name: selectedSup?.name,
        import_date: importDate,
        note: importNote,
        total_amount: grandTotal,
        items: importItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          import_price: item.import_price,
          batch_code: item.batch_code,
          expiry_date: item.expiry_date,
        })),
      };

      await importsAPI.create(payload);
      Alert.alert('✅ Thành công', 'Đã tạo phiếu nhập hàng và cộng tồn kho theo lô FEFO!');
      setCreateModalVisible(false);
      await fetchImports();
    } catch (err: any) {
      Alert.alert('Lỗi tạo phiếu', err?.response?.data?.message || 'Không thể tạo phiếu nhập hàng');
    } finally {
      setSubmitting(false);
    }
  };

  // Xem chi tiết phiếu nhập
  const handleViewDetail = async (item: any) => {
    setSelectedReceipt(item);
    setDetailModalVisible(true);
    setLoadingDetail(true);

    try {
      const res = await importsAPI.getById(item.id);
      const detail = res.data?.data?.import ?? res.data?.data ?? res.data;
      if (detail) setSelectedReceipt(detail);
    } catch (err) {
      console.warn('Lỗi lấy chi tiết phiếu nhập:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản Lý Nhập Hàng</Text>
          <Text style={styles.headerSub}>Phiếu nhập kho & Quản lý lô FEFO</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreateModal}>
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <Text style={styles.createBtnText}>Tạo Phiếu</Text>
        </TouchableOpacity>
      </View>

      {/* ── Thống kê tóm tắt ── */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Tổng phiếu nhập</Text>
          <Text style={styles.summaryValue}>{imports.length} phiếu</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Tổng tiền nhập</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>
            {fmt(imports.reduce((s, i) => s + (Number(i.total_amount) || 0), 0))}
          </Text>
        </View>
      </View>

      {/* ── Danh sách phiếu nhập ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Đang tải danh sách...</Text>
        </View>
      ) : (
        <FlatList
          data={imports}
          keyExtractor={(item, index) => String(item.id || item.receipt_code || index)}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchImports();
              }}
              colors={['#059669']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có phiếu nhập hàng nào</Text>
              <Text style={styles.emptyDesc}>Bấm "Tạo Phiếu" để nhập thêm hàng vào kho</Text>
            </View>
          }
          renderItem={({ item }) => {
            const code = item.receipt_code || item.po_code || `PN${item.id}`;
            const total = Number(item.total_amount) || 0;
            const itemsCount = item.item_count || item.items_count || (item.items ? item.items.length : 1);
            let dateStr = item.import_date || item.created_at || '—';
            if (dateStr.includes('T')) dateStr = dateStr.slice(0, 10);

            return (
              <TouchableOpacity
                style={styles.receiptCard}
                onPress={() => handleViewDetail(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.receiptBadge}>
                    <Ionicons name="document-text" size={15} color="#2563EB" />
                    <Text style={styles.receiptCode}>{code}</Text>
                  </View>
                  <Text style={styles.receiptAmount}>{fmt(total)}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={14} color="#64748B" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {item.supplier_name || 'Nhà cung cấp'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.infoText}>Ngày nhập: {dateStr}</Text>
                    <Text style={styles.itemCountText}>• {itemsCount} loại SP</Text>
                  </View>
                  {item.note ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#64748B" />
                      <Text style={[styles.infoText, { fontStyle: 'italic' }]} numberOfLines={1}>
                        {item.note}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.viewDetailText}>Xem chi tiết phiếu nhập</Text>
                  <Ionicons name="chevron-forward" size={16} color="#059669" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── MODAL DUY NHẤT: TẠO PHIẾU NHẬP HÀNG (Bao gồm Form + Quét Camera + Chọn SP không bị lỗi native modal) ── */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (cameraModalVisible) setCameraModalVisible(false);
          else if (selectProductModal) setSelectProductModal(false);
          else setCreateModalVisible(false);
        }}
      >
        {cameraModalVisible ? (
          /* 1. MÀN HÌNH QUÉT CAMERA */
          <View style={styles.cameraContainer}>
            {permission && permission.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing={facing}
                enableTorch={torch}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'],
                }}
              />
            ) : (
              <View style={styles.center}>
                <Ionicons name="camera-outline" size={48} color="#059669" />
                <Text style={{ color: '#FFF', marginTop: 12, marginBottom: 16 }}>
                  Cần cấp quyền camera để quét mã vạch
                </Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Cấp Quyền Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.permBtn, { marginTop: 10, backgroundColor: '#475569' }]}
                  onPress={() => setCameraModalVisible(false)}
                >
                  <Text style={{ color: '#FFF' }}>Quay lại</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Top Bar Camera */}
            <View style={styles.cameraTopBar}>
              <TouchableOpacity style={styles.camIconBtn} onPress={() => setCameraModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <Text style={styles.cameraTitle}>Quét Mã Vạch Nhập Hàng</Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.camIconBtn, torch && { backgroundColor: '#F59E0B' }]}
                  onPress={() => setTorch((t) => !t)}
                >
                  <Ionicons name={torch ? 'flash' : 'flash-outline'} size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.camIconBtn}
                  onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                >
                  <Ionicons name="camera-reverse-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Khung ngắm và tia laser */}
            <View style={styles.viewFinderWrapper}>
              <View style={styles.viewFinder}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Animated.View style={[styles.laserLine, { transform: [{ translateY: laserAnim }] }]} />
              </View>
              <Text style={styles.cameraHint}>Hướng camera vào mã vạch sản phẩm cần nhập</Text>
            </View>

            {/* Thông báo quét thành công / lỗi */}
            <View style={styles.cameraBottomBar}>
              {cameraScanning && (
                <View style={styles.scanNotice}>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.scanNoticeText}>Đang tra cứu sản phẩm...</Text>
                </View>
              )}

              {!cameraScanning && scanMessage && (
                <View
                  style={[
                    styles.scanNotice,
                    scanMessage.success ? styles.scanSuccess : styles.scanError,
                  ]}
                >
                  <Ionicons
                    name={scanMessage.success ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color="#FFF"
                  />
                  <Text style={styles.scanNoticeText}>{scanMessage.text}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.btnDoneScan}
                onPress={() => setCameraModalVisible(false)}
              >
                <Text style={styles.btnDoneScanText}>
                  Xong ({importItems.length} sản phẩm)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : selectProductModal ? (
          /* 2. MÀN HÌNH CHỌN SẢN PHẨM TỪ DANH MỤC */
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chọn Sản Phẩm Nhập</Text>
                <Text style={styles.modalSubtitle}>Nhấn để thêm vào phiếu nhập ({availableProducts.length} SP)</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectProductModal(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Tìm kiếm */}
            <View style={styles.searchProductBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchProductInput}
                placeholder="Nhập tên sản phẩm hoặc mã vạch..."
                placeholderTextColor="#94A3B8"
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                autoFocus
              />
              {productSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={availableProducts.filter((p) =>
                (p.name?.toLowerCase() || '').includes(productSearchQuery.toLowerCase()) ||
                (p.barcode || '').includes(productSearchQuery)
              )}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="cube-outline" size={40} color="#CBD5E1" />
                  <Text style={{ color: '#64748B', marginTop: 10 }}>Không tìm thấy sản phẩm phù hợp</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.prodSelectItem}
                  onPress={() => {
                    addProductToImportList(item, 10);
                    setSelectProductModal(false);
                  }}
                >
                  <View style={styles.prodSelectIcon}>
                    <Ionicons name="cube-outline" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodSelectName}>{item.name}</Text>
                    <Text style={styles.prodSelectMeta}>
                      Mã: {item.barcode || '—'} • ĐVT: {item.unit || 'cái'}
                    </Text>
                    <Text style={styles.prodSelectCost}>
                      Giá nhập cũ: {fmt(Number(item.import_price || item.importPrice || 0))}
                    </Text>
                  </View>
                  <View style={styles.btnAddCircle}>
                    <Ionicons name="add" size={18} color="#FFF" />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          /* 3. MÀN HÌNH CHÍNH FORM TẠO PHIẾU NHẬP */
          <View style={styles.modalContainer}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tạo Phiếu Nhập Hàng</Text>
                <Text style={styles.modalSubtitle}>Thêm lô hàng & Tự động cộng tồn kho</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 1. Chọn Nhà Cung Cấp */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nhà cung cấp (*):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplierScroll}>
                {suppliers.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.supplierChip,
                      selectedSupplierId === s.id && styles.supplierChipActive,
                    ]}
                    onPress={() => setSelectedSupplierId(s.id)}
                  >
                    <Text
                      style={[
                        styles.supplierChipText,
                        selectedSupplierId === s.id && styles.supplierChipTextActive,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 2. Ngày nhập & Ghi chú */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Ngày nhập (YYYY-MM-DD):</Text>
                <TextInput
                  style={styles.textInput}
                  value={importDate}
                  onChangeText={setImportDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ghi chú phiếu nhập:</Text>
              <TextInput
                style={[styles.textInput, { height: 40 }]}
                value={importNote}
                onChangeText={setImportNote}
                placeholder="Ví dụ: Nhập định kỳ đầu tháng..."
              />
            </View>

            {/* 3. Nút Thêm Sản Phẩm: QUÉT MÃ VẠCH & CHỌN TAY */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Danh Sách Sản Phẩm ({importItems.length})</Text>
              <View style={styles.addBtnsGroup}>
                <TouchableOpacity
                  style={styles.btnScanBarcode}
                  onPress={async () => {
                    if (!permission?.granted) {
                      await requestPermission();
                    }
                    setCameraModalVisible(true);
                  }}
                >
                  <Ionicons name="camera" size={16} color="#FFF" />
                  <Text style={styles.btnScanBarcodeText}>Quét Mã</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnAddFromCatalog}
                  onPress={() => {
                    setProductSearchQuery('');
                    setSelectProductModal(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#059669" />
                  <Text style={styles.btnAddFromCatalogText}>Chọn SP</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Danh sách các dòng mặt hàng nhập */}
            {importItems.length === 0 ? (
              <View style={styles.emptyItemsBox}>
                <Ionicons name="cart-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyItemsText}>Chưa có mặt hàng nào</Text>
                <Text style={styles.emptyItemsSub}>
                  Bấm "Quét Mã" hoặc "Chọn SP" để thêm vào phiếu nhập
                </Text>
              </View>
            ) : (
              importItems.map((item, idx) => {
                const subtotal = (Number(item.quantity) || 0) * (Number(item.import_price) || 0);
                return (
                  <View key={item.product_id} style={styles.importRowCard}>
                    {/* Hàng 1: Tên & Nút xoá */}
                    <View style={styles.rowHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowProdName}>{item.product_name}</Text>
                        <Text style={styles.rowProdMeta}>
                          ĐVT: {item.unit} {item.barcode ? `• Mã: ${item.barcode}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeImportItem(idx)} style={styles.deleteRowBtn}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Hàng 2: Số lượng & Giá nhập */}
                    <View style={styles.rowInputsGrid}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputMiniLabel}>Số lượng nhập:</Text>
                        <TextInput
                          style={styles.rowInput}
                          keyboardType="numeric"
                          value={String(item.quantity)}
                          onChangeText={(v) =>
                            updateItemField(idx, 'quantity', parseInt(v.replace(/[^0-9]/g, '')) || 0)
                          }
                        />
                      </View>

                      <View style={{ flex: 1.3 }}>
                        <Text style={styles.inputMiniLabel}>Đơn giá nhập (đ):</Text>
                        <TextInput
                          style={styles.rowInput}
                          keyboardType="numeric"
                          value={String(item.import_price)}
                          onChangeText={(v) =>
                            updateItemField(idx, 'import_price', parseFloat(v.replace(/[^0-9]/g, '')) || 0)
                          }
                        />
                      </View>
                    </View>

                    {/* Hàng 3: Mã lô & Hạn sử dụng */}
                    <View style={styles.rowInputsGrid}>
                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.inputMiniLabel}>Mã lô (Batch):</Text>
                        <TextInput
                          style={styles.rowInput}
                          value={item.batch_code}
                          onChangeText={(v) => updateItemField(idx, 'batch_code', v)}
                          placeholder="Mã lô"
                        />
                      </View>

                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.inputMiniLabel}>Hạn dùng (HSD):</Text>
                        <TextInput
                          style={styles.rowInput}
                          value={item.expiry_date}
                          onChangeText={(v) => updateItemField(idx, 'expiry_date', v)}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                    </View>

                    {/* Hàng 4: Thành tiền */}
                    <View style={styles.rowSubtotalBar}>
                      <Text style={styles.rowSubtotalLabel}>Thành tiền:</Text>
                      <Text style={styles.rowSubtotalValue}>{fmt(subtotal)}</Text>
                    </View>
                  </View>
                );
              })
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Tổng Tiền & Nút Tạo */}
          <View style={styles.modalFooter}>
            <View>
              <Text style={styles.footerTotalLabel}>TỔNG TIỀN NHẬP:</Text>
              <Text style={styles.footerTotalValue}>{fmt(grandTotal)}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.btnSubmitImport,
                (submitting || importItems.length === 0) && styles.btnSubmitDisabled,
              ]}
              onPress={handleSubmitImport}
              disabled={submitting || importItems.length === 0}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#FFF" />
                  <Text style={styles.btnSubmitImportText}>XÁC NHẬN NHẬP HÀNG</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>

      {/* ── MODAL 4: CHI TIẾT PHIẾU NHẬP ── */}
      <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Chi Tiết Phiếu Nhập</Text>
                <Text style={styles.detailCode}>
                  #{selectedReceipt?.receipt_code || selectedReceipt?.po_code || selectedReceipt?.id}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#059669" />
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                <View style={styles.detailInfoBox}>
                  <Text style={styles.detailInfoRow}>
                    🏢 <Text style={{ fontWeight: '700' }}>NCC:</Text> {selectedReceipt?.supplier_name || '—'}
                  </Text>
                  <Text style={styles.detailInfoRow}>
                    📅 <Text style={{ fontWeight: '700' }}>Ngày nhập:</Text>{' '}
                    {(selectedReceipt?.import_date || selectedReceipt?.created_at || '').slice(0, 10)}
                  </Text>
                  {selectedReceipt?.note ? (
                    <Text style={styles.detailInfoRow}>
                      📝 <Text style={{ fontWeight: '700' }}>Ghi chú:</Text> {selectedReceipt.note}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.detailItemsTitle}>
                  Mặt hàng đã nhập ({(selectedReceipt?.items || []).length}):
                </Text>

                {(selectedReceipt?.items || []).map((it: any, i: number) => {
                  const qty = Number(it.quantity) || 0;
                  const price = Number(it.import_price) || 0;
                  return (
                    <View key={i} style={styles.detailItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailItemName}>{it.product_name || `SP #${it.product_id}`}</Text>
                        <Text style={styles.detailItemBatch}>
                          Lô: {it.batch_code || '—'} • HSD: {(it.expiry_date || '—').slice(0, 10)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.detailItemQty}>
                          {qty} x {fmt(price)}
                        </Text>
                        <Text style={styles.detailItemSubtotal}>{fmt(qty * price)}</Text>
                      </View>
                    </View>
                  );
                })}

                <View style={styles.detailTotalRow}>
                  <Text style={styles.detailTotalLabel}>TỔNG TIỀN PHIẾU:</Text>
                  <Text style={styles.detailTotalValue}>
                    {fmt(Number(selectedReceipt?.total_amount) || 0)}
                  </Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setDetailModalVisible(false)}>
              <Text style={styles.detailCloseBtnText}>ĐÓNG</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    backgroundColor: '#059669',
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
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },

  // Empty state
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Receipt Card
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  receiptCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  cardBody: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  itemCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 10,
    paddingTop: 8,
  },
  viewDetailText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },

  // Modal Create
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#1E293B',
  },
  supplierScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  supplierChip: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
  },
  supplierChipActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  supplierChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  supplierChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  addBtnsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  btnScanBarcode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  btnScanBarcodeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnAddFromCatalog: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  btnAddFromCatalogText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty Items
  emptyItemsBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyItemsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 8,
  },
  emptyItemsSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },

  // Import Item Card
  importRowCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rowProdName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  rowProdMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  deleteRowBtn: {
    padding: 4,
  },
  rowInputsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  rowInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    fontSize: 13,
    color: '#1E293B',
  },
  rowSubtotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rowSubtotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rowSubtotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  // Modal Footer
  modalFooter: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  btnSubmitImport: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnSubmitDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnSubmitImportText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Camera Modal
  cameraContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  cameraTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  camIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFinderWrapper: {
    position: 'absolute',
    top: '26%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  viewFinder: {
    width: 240,
    height: 240,
    borderRadius: 16,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#059669',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    height: 2,
    backgroundColor: '#059669',
  },
  cameraHint: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  cameraBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 16,
    right: 16,
    gap: 12,
  },
  scanNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  scanSuccess: {
    backgroundColor: 'rgba(5, 150, 105, 0.95)',
  },
  scanError: {
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
  },
  scanNoticeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  btnDoneScan: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDoneScanText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  permBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  // Modal Chọn Sản Phẩm
  searchProductBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    height: 42,
  },
  searchProductInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  prodSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  prodSelectIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodSelectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  prodSelectMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  prodSelectCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  btnAddCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Chi Tiết Phiếu Nhập
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  detailCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  detailInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginBottom: 12,
  },
  detailInfoRow: {
    fontSize: 13,
    color: '#334155',
  },
  detailItemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailItemBatch: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  detailItemQty: {
    fontSize: 11,
    color: '#64748B',
  },
  detailItemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  detailTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  detailTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  detailTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  detailCloseBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  detailCloseBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
