import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI, categoriesAPI } from '../../../services/api';
import { Colors } from '../../../constants/colors';

interface Category { id: number; name: string; }

interface ProductForm {
  name: string;
  barcode: string;
  sku: string;
  import_price: string;
  selling_price: string;
  shelf_location: string;
  expiry_date: string;
  unit: string;
  min_stock_level: string;
  description: string;
  category_id: string;
}

const EMPTY_FORM: ProductForm = {
  name: '', barcode: '', sku: '', import_price: '', selling_price: '',
  shelf_location: '', expiry_date: '', unit: 'cái', min_stock_level: '5',
  description: '', category_id: '',
};

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [errors, setErrors] = useState<Partial<ProductForm>>({});

  const update = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Load categories
  useEffect(() => {
    categoriesAPI.getAll()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Load product if editing
  useEffect(() => {
    if (!isEdit || !id) return;
    setFetchLoading(true);
    productsAPI.getById(id)
      .then((res) => {
        const p = res.data?.data ?? res.data;
        if (p) {
          setForm({
            name: p.name ?? '',
            barcode: p.barcode ?? '',
            sku: p.sku ?? p.product_code ?? '',
            import_price: String(p.import_price ?? ''),
            selling_price: String(p.selling_price ?? p.sellingPrice ?? ''),
            shelf_location: p.shelf_location ?? p.shelfLocation ?? '',
            expiry_date: p.expiry_date ? p.expiry_date.split('T')[0] : '',
            unit: p.unit ?? 'cái',
            min_stock_level: String(p.min_stock_level ?? '5'),
            description: p.description ?? '',
            category_id: String(p.category_id ?? p.category?.id ?? ''),
          });
        }
      })
      .catch(() => Alert.alert('Lỗi', 'Không tải được thông tin sản phẩm'))
      .finally(() => setFetchLoading(false));
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Partial<ProductForm> = {};
    if (!form.name.trim()) newErrors.name = 'Tên sản phẩm là bắt buộc';
    if (!form.selling_price.trim()) newErrors.selling_price = 'Giá bán là bắt buộc';
    if (parseFloat(form.selling_price) <= 0) newErrors.selling_price = 'Giá bán phải > 0';
    if (!isEdit && !form.sku.trim()) newErrors.sku = 'SKU là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        barcode: form.barcode.trim() || undefined,
        sku: form.sku.trim() || `SP-${Date.now()}`,
        product_code: form.sku.trim() || `SP-${Date.now()}`,
        import_price: parseFloat(form.import_price) || 0,
        selling_price: parseFloat(form.selling_price),
        shelf_location: form.shelf_location.trim() || undefined,
        expiry_date: form.expiry_date.trim() || undefined,
        unit: form.unit.trim() || 'cái',
        min_stock_level: parseInt(form.min_stock_level) || 5,
        description: form.description.trim() || undefined,
        category_id: form.category_id ? parseInt(form.category_id) : undefined,
      };

      if (isEdit) {
        await productsAPI.update(id!, payload);
        Alert.alert('✅ Đã cập nhật', 'Thông tin sản phẩm đã được lưu', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await productsAPI.create(payload);
        Alert.alert('✅ Đã thêm sản phẩm', 'Sản phẩm mới đã được tạo', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không thể lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => String(c.id) === form.category_id);

  if (fetchLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        {/* Thông tin cơ bản */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>

          <Field
            label="Tên sản phẩm *"
            placeholder="VD: Nước suối Lavie 500ml"
            value={form.name}
            onChangeText={(v) => update('name', v)}
            error={errors.name}
            icon="cube-outline"
          />
          <Field
            label="Mã vạch (Barcode)"
            placeholder="Quét hoặc nhập mã vạch"
            value={form.barcode}
            onChangeText={(v) => update('barcode', v)}
            icon="barcode-outline"
            keyboardType="default"
          />
          {!isEdit && (
            <Field
              label="SKU / Mã sản phẩm *"
              placeholder="VD: SP001"
              value={form.sku}
              onChangeText={(v) => update('sku', v)}
              error={errors.sku}
              icon="pricetag-outline"
            />
          )}
          <Field
            label="Đơn vị tính"
            placeholder="cái / hộp / gói / kg..."
            value={form.unit}
            onChangeText={(v) => update('unit', v)}
            icon="scale-outline"
          />

          {/* Category picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Danh mục</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Ionicons name="grid-outline" size={16} color={Colors.textSecondary} />
              <Text style={[styles.pickerText, !selectedCategory && { color: Colors.placeholder }]}>
                {selectedCategory?.name ?? 'Chọn danh mục...'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.placeholder} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Giá cả */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giá cả</Text>
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Field
                label="Giá nhập (đ)"
                placeholder="15000"
                value={form.import_price}
                onChangeText={(v) => update('import_price', v)}
                keyboardType="numeric"
                icon="arrow-down-circle-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Giá bán (đ) *"
                placeholder="20000"
                value={form.selling_price}
                onChangeText={(v) => update('selling_price', v)}
                keyboardType="numeric"
                error={errors.selling_price}
                icon="pricetag-outline"
              />
            </View>
          </View>
          {form.import_price && form.selling_price ? (
            <View style={styles.profitInfo}>
              <Text style={styles.profitLabel}>Lợi nhuận: </Text>
              <Text style={[
                styles.profitValue,
                parseFloat(form.selling_price) >= parseFloat(form.import_price)
                  ? { color: Colors.success }
                  : { color: Colors.error },
              ]}>
                {(parseFloat(form.selling_price) - parseFloat(form.import_price)).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ) : null}
        </View>

        {/* Kho & Vị trí */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kho hàng & Hạn sử dụng</Text>
          <Field
            label="Vị trí kệ / Khu vực"
            placeholder="VD: Kệ A - Tầng 2"
            value={form.shelf_location}
            onChangeText={(v) => update('shelf_location', v)}
            icon="location-outline"
          />
          <Field
            label="Hạn sử dụng (YYYY-MM-DD)"
            placeholder="VD: 2025-12-31"
            value={form.expiry_date}
            onChangeText={(v) => update('expiry_date', v)}
            icon="calendar-outline"
          />
          <Field
            label="Tồn kho tối thiểu"
            placeholder="5"
            value={form.min_stock_level}
            onChangeText={(v) => update('min_stock_level', v)}
            keyboardType="numeric"
            icon="alert-circle-outline"
          />
          <Field
            label="Mô tả"
            placeholder="Mô tả thêm về sản phẩm..."
            value={form.description}
            onChangeText={(v) => update('description', v)}
            icon="document-text-outline"
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name={isEdit ? 'save-outline' : 'add-circle-outline'} size={20} color={Colors.white} />
              <Text style={styles.submitBtnText}>{isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerBox}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => { update('category_id', ''); setShowCategoryPicker(false); }}
            >
              <Text style={styles.pickerItemText}>— Không chọn —</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pickerItem, form.category_id === String(cat.id) && styles.pickerItemActive]}
                onPress={() => { update('category_id', String(cat.id)); setShowCategoryPicker(false); }}
              >
                <Text style={[styles.pickerItemText, form.category_id === String(cat.id) && { color: Colors.primary, fontWeight: '700' }]}>
                  {cat.name}
                </Text>
                {form.category_id === String(cat.id) && (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, placeholder, value, onChangeText, keyboardType, error, icon, multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
  error?: string;
  icon?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && { borderColor: Colors.error }]}>
        {icon && <Ionicons name={icon as any} size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />}
        <TextInput
          style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: Colors.background, paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 11 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 4 },
  priceRow: { flexDirection: 'row', gap: 12 },
  profitInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    backgroundColor: Colors.background, borderRadius: 8, padding: 10, marginTop: 4,
  },
  profitLabel: { fontSize: 13, color: Colors.textSecondary },
  profitValue: { fontSize: 15, fontWeight: '700' },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 12,
  },
  pickerText: { flex: 1, fontSize: 15, color: Colors.text },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4,
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerBox: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerItemActive: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 8 },
  pickerItemText: { fontSize: 15, color: Colors.text },
});
