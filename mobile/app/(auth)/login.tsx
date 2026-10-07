import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    clearError();
    const success = await login(username.trim(), password.trim());
    if (!success) {
      Alert.alert('Đăng nhập thất bại', useAuthStore.getState().error || 'Vui lòng thử lại');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="storefront" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>Quản Lý Cửa Hàng</Text>
          <Text style={styles.appSub}>Hệ thống quản lý bán lẻ thông minh</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>
          <Text style={styles.cardSub}>Nhập thông tin tài khoản của bạn</Text>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor={Colors.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={Colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={styles.demoHint}>
            <Text style={styles.demoText}>Demo: admin / 123456</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  appName: { fontSize: 26, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  appSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: Colors.error, flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    backgroundColor: Colors.background, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 13 },
  eyeBtn: { padding: 4 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15,
    marginTop: 8, gap: 8,
  },
  loginBtnDisabled: { backgroundColor: '#93C5FD' },
  loginBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  demoHint: { alignItems: 'center', marginTop: 16 },
  demoText: { fontSize: 12, color: Colors.placeholder },
});
