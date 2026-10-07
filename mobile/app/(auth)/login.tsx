import { useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { routes } from '../../utils/routes';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      return;
    }
    clearError();
    await login(identifier.trim(), password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="bag-handle" size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>Mua sắm tiện lợi</Text>
          <Text style={styles.subtitle}>Đăng nhập để khám phá sản phẩm</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Chào mừng bạn</Text>
          <Text style={styles.description}>Đăng nhập bằng tài khoản của bạn</Text>

          <Text style={styles.label}>Email hoặc tên đăng nhập</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor="#9ca3af"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push(routes.register)}>
              <Text style={styles.registerLink}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#134e4a' },
  subtitle: { marginTop: 6, color: '#64748b', fontSize: 15 },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heading: { fontSize: 21, fontWeight: '700', color: '#111827' },
  description: { color: '#6b7280', marginTop: 4, marginBottom: 22 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 7, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#dbe3e8',
    backgroundColor: '#f8fafc',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#111827',
    fontSize: 15,
  },
  error: { marginTop: 12, color: '#dc2626', fontSize: 14 },
  button: {
    backgroundColor: '#0f766e',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 22,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  registerPrompt: { color: '#64748b' },
  registerLink: { color: '#0f766e', fontWeight: '700' },
});
