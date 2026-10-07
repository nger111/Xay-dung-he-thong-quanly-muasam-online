import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Store, Lock, User } from 'lucide-react';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { ROUTES } from '@/constants/routes';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Chào mừng, ${user.full_name}!`);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Tên đăng nhập hoặc mật khẩu không đúng';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full" />
          <div className="absolute bottom-32 right-16 w-60 h-60 bg-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/30">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Hệ Thống Quản Lý</h1>
          <h2 className="text-xl font-light mb-6 text-blue-100">Mua Sắm Online</h2>
          <p className="text-blue-200 text-sm max-w-xs leading-relaxed">
            Nền tảng quản lý bán lẻ toàn diện — sản phẩm, kho hàng, đơn hàng và báo cáo trong một hệ thống duy nhất.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Sản phẩm', value: '1000+' },
              { label: 'Đơn hàng/ngày', value: '500+' },
              { label: 'Tin cậy', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Quản Lý Mua Sắm</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-7">
              <h3 className="text-2xl font-bold text-gray-900">Đăng nhập</h3>
              <p className="text-sm text-gray-500 mt-1">Vui lòng đăng nhập để tiếp tục</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('username')}
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    autoComplete="username"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all
                      ${errors.username ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all
                      ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">Tài khoản thử nghiệm:</p>
              <div className="space-y-1 text-xs text-blue-600">
                <p>👤 Admin: <strong>admin</strong> / <strong>admin123</strong></p>
                <p>👤 Thu ngân: <strong>cashier</strong> / <strong>cashier123</strong></p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2024 Hệ thống quản lý mua sắm online. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
