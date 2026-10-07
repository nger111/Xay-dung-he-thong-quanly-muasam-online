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
import { authAPI, unwrapData } from '../../services/api';
import { useAuthStore, User } from '../../store/authStore';
import { routes } from '../../utils/routes';

export default function AccountScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    if (!fullName.trim() || !email.trim()) {
      setError('Họ tên và email không được để trống.');
      return;
    }
    if (phone && !/^\d{9,11}$/.test(phone.trim())) {
      setError('Số điện thoại cần có từ 9 đến 11 chữ số.');
      return;
    }
    setSaving(true);
    try {
      const response = await authAPI.updateProfile({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      const payload = unwrapData<{ user?: unknown }>(response.data);
      const raw = (payload.user ?? payload) as Record<string, unknown>;
      const updated: User = {
        id: String(raw.id ?? user?.id ?? ''),
        username: String(raw.username ?? user?.username ?? ''),
        full_name: String(raw.full_name ?? fullName.trim()),
        fullName: String(raw.full_name ?? fullName.trim()),
        email: String(raw.email ?? email.trim()),
        phone: String(raw.phone ?? phone.trim()),
        role: String(raw.role ?? user?.role ?? 'CUSTOMER'),
      };
      updateUser(updated);
      setFullName(updated.fullName);
      setEmail(updated.email);
      setPhone(updated.phone);
      Alert.alert('Đã lưu', 'Thông tin tài khoản đã được cập nhật.');
    } catch (cause) {
      const response = (cause as { response?: { data?: { message?: string } } })?.response;
      setError(response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => { void logout(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Ionicons name="person" size={34} color="#0f766e" /></View>
          <Text style={styles.name}>{user?.fullName || user?.username || 'Khách hàng'}</Text>
          <Text style={styles.accountType}>Tài khoản khách hàng</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <Field label="Họ và tên" value={fullName} onChangeText={setFullName} />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveText}>Lưu thay đổi</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.ordersLink} onPress={() => router.push(routes.orders)}>
          <View style={styles.linkIcon}><Ionicons name="receipt-outline" size={19} color="#0f766e" /></View>
          <Text style={styles.linkLabel}>Lịch sử đơn hàng</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={19} color="#dc2626" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 30 },
  profileHeader: { alignItems: 'center', paddingVertical: 20, marginBottom: 12 },
  avatar: { width: 76, height: 76, borderRadius: 26, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { color: '#111827', fontWeight: '800', fontSize: 20 },
  accountType: { color: '#64748b', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#edf2f4' },
  sectionTitle: { color: '#111827', fontWeight: '800', fontSize: 16, marginBottom: 14 },
  field: { marginBottom: 13 },
  label: { color: '#475569', fontWeight: '600', fontSize: 12, marginBottom: 6 },
  input: { height: 45, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, color: '#111827' },
  error: { color: '#b91c1c', marginBottom: 8, fontSize: 13 },
  saveButton: { height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#0f766e', marginTop: 4 },
  disabled: { opacity: 0.6 },
  saveText: { color: '#ffffff', fontWeight: '700' },
  ordersLink: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, backgroundColor: '#ffffff', borderRadius: 14, marginTop: 12 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, color: '#334155', fontWeight: '600' },
  logout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, marginTop: 10 },
  logoutText: { color: '#dc2626', fontWeight: '700' },
});
