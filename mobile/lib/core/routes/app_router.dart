import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

// Provider cho GoRouter
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    // Logic điều hướng khi thay đổi trạng thái xác thực
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isGoingToLogin = state.matchedLocation == '/login';

      if (!isAuth && !isGoingToLogin) {
        // Chưa đăng nhập thì bắt buộc về trang login
        return '/login';
      }

      if (isAuth && isGoingToLogin) {
        // Đã đăng nhập rồi thì không vào login nữa, cho về trang chủ
        return '/';
      }

      return null; // Không cần điều hướng lại
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const _PlaceholderScreen(title: 'Login'),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const _PlaceholderScreen(title: 'Home Dashboard'),
        routes: [
          GoRoute(
            path: 'products',
            builder: (context, state) => const _PlaceholderScreen(title: 'Products'),
          ),
          GoRoute(
            path: 'pos',
            builder: (context, state) => const _PlaceholderScreen(title: 'POS (Bán Hàng)'),
          ),
          GoRoute(
            path: 'inventory',
            builder: (context, state) => const _PlaceholderScreen(title: 'Quản Lý Kho'),
          ),
        ],
      ),
    ],
  );
});

// Màn hình tạm cho đến khi tạo UI thật
class _PlaceholderScreen extends ConsumerWidget {
  final String title;
  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          if (title != 'Login')
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () {
                ref.read(authProvider.notifier).logout();
              },
            )
        ],
      ),
      body: Center(
        child: title == 'Login' 
          ? ElevatedButton(
              onPressed: () {
                // Giả lập login tạm
                ref.read(authProvider.notifier).login('admin', 'password');
              },
              child: const Text('Simulate Login'),
            )
          : Text('Welcome to $title'),
      ),
    );
  }
}
