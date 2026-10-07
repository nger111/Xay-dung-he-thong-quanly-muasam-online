import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!password.trim()) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu ít nhất 6 ký tự';
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authAPI.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      Alert.alert(
        'Đăng ký thành công!',
        'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.',
        [{ text: 'Đăng nhập', onPress: () => router.replace('/(auth)/login' as any) }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const setError = (field: string) => (errors[field] ? () => setErrors((e) => ({ ...e, [field]: '' })) : undefined);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrapper}>
            <Text style={styles.headerTitle}>Tạo tài khoản</Text>
            <Text style={styles.headerSubtitle}>Đăng ký để bắt đầu mua sắm</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChangeText={(t) => { setFullName(t); setErrors((e) => ({ ...e, fullName: '' })); }}
            leftIcon="person-outline"
            error={errors.fullName}
          />

          <Input
            label="Email"
            placeholder="email@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Số điện thoại"
            placeholder="0901234567"
            value={phone}
            onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: '' })); }}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
            leftIcon="lock-closed-outline"
            isPassword
            error={errors.password}
          />

          <Input
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
            leftIcon="lock-closed-outline"
            isPassword
            error={errors.confirmPassword}
          />

          <Button
            title="Đăng ký"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.registerBtn}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login' as any)}
          >
            <Text style={styles.loginLinkText}>Đã có tài khoản? </Text>
            <Text style={styles.loginLinkBold}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 56,
  },
  header: {
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  headerTitleWrapper: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  registerBtn: {
    marginTop: 8,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLinkBold: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
});
