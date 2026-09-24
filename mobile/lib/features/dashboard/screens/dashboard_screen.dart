import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Import auth provider (Giả định đường dẫn)
import '../../auth/providers/auth_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Lấy trạng thái xác thực hiện tại, ví dụ user object có thuộc tính fullName
    final authState = ref.watch(authProvider);
    final userName = authState.user?.fullName ?? 'Người dùng';

    return Scaffold(
      appBar: AppBar(
        title: Text('Xin chào, $userName'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              // Gọi hàm đăng xuất
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Hiển thị phần thống kê
          _buildStatistics(),
          // Hiển thị menu dạng lưới
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              padding: const EdgeInsets.all(16),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _buildMenuItem(context, 'Bán hàng (POS)', Icons.point_of_sale, '/pos', Colors.orange),
                _buildMenuItem(context, 'Sản phẩm', Icons.inventory, '/products', Colors.blue),
                _buildMenuItem(context, 'Tồn kho', Icons.warehouse, '/inventory', Colors.green),
                _buildMenuItem(context, 'Nhập hàng', Icons.add_shopping_cart, '/import', Colors.purple),
                _buildMenuItem(context, 'Báo cáo', Icons.bar_chart, '/reports', Colors.teal),
                // Nút Đăng xuất riêng nếu cần thêm vào menu
                _buildMenuItem(context, 'Đăng xuất', Icons.logout, '/logout', Colors.red, isLogout: true, ref: ref),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Widget hiển thị tóm tắt thống kê trong ngày
  Widget _buildStatistics() {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem('Doanh thu hôm nay', '5,200,000 đ', Icons.attach_money),
          _buildStatItem('Đơn hàng', '24', Icons.receipt_long),
        ],
      ),
    );
  }

  // Item riêng lẻ cho phần thống kê
  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 32, color: Colors.blue),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey)),
      ],
    );
  }

  // Item trong grid menu
  Widget _buildMenuItem(
    BuildContext context, 
    String title, 
    IconData icon, 
    String route, 
    Color color, 
    {bool isLogout = false, WidgetRef? ref}
  ) {
    return InkWell(
      onTap: () {
        if (isLogout && ref != null) {
          // Xử lý đăng xuất trực tiếp từ menu
          ref.read(authProvider.notifier).logout();
        } else {
          // Chuyển hướng đến các trang chức năng
          context.push(route);
        }
      },
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: color.withOpacity(0.1),
              child: Icon(icon, size: 32, color: color),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
