import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productsAPI } from '../../../services/api';

export default function AddProductScreen() {
  const [form, setForm] = useState({
    code: '',
    barcode: '',
    name: '',
    importPrice: '',
    exportPrice: '',
    minStock: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.importPrice || !form.exportPrice) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }
    setLoading(true);
    try {
      await productsAPI.create({
        sku: form.code.trim(),
        product_code: form.code.trim(),
        barcode: form.barcode.trim(),
        name: form.name.trim(),
        import_price: parseFloat(form.importPrice) || 0,
        selling_price: parseFloat(form.exportPrice) || 0,
        min_stock_level: parseInt(form.minStock) || 5,
      });
      Alert.alert('✅ Thành công', 'Sản phẩm đã được thêm', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message ?? 'Không thể thêm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Field label="Mã sản phẩm *" placeholder="VD: SP001" value={form.code} onChangeText={(v) => update('code', v)} />
          <Field
            label="Mã vạch (barcode)"
            placeholder="Quét hoặc nhập mã vạch"
            value={form.barcode}
            onChangeText={(v) => update('barcode', v)}
            keyboardType="numeric"
          />
          <Field label="Tên sản phẩm *" placeholder="Nhập tên sản phẩm" value={form.name} onChangeText={(v) => update('name', v)} />
          <Field
            label="Giá nhập (đ) *"
            placeholder="VD: 15000"
            value={form.importPrice}
            onChangeText={(v) => update('importPrice', v)}
            keyboardType="numeric"
          />
          <Field
            label="Giá bán (đ) *"
            placeholder="VD: 20000"
            value={form.exportPrice}
            onChangeText={(v) => update('exportPrice', v)}
            keyboardType="numeric"
          />
          <Field
            label="Tồn kho tối thiểu"
            placeholder="VD: 10"
            value={form.minStock}
            onChangeText={(v) => update('minStock', v)}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.submitText}>Lưu sản phẩm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  form: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
    marginBottom: 40,
  },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: '#86efac' },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
