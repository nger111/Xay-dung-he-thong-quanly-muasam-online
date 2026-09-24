import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';

// Provider gọi API lấy dashboard
final dashboardProvider = FutureProvider.autoDispose((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('/statistics/dashboard');
  return response.data['data'];
});

class StatisticsScreen extends ConsumerWidget {
  const StatisticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardProvider);
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thống kê & Báo cáo'),
        centerTitle: true,
      ),
      body: dashboardState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Text('Lỗi tải dữ liệu: $err', style: const TextStyle(color: Colors.red)),
        ),
        data: (data) {
          return RefreshIndicator(
            onRefresh: () => ref.refresh(dashboardProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildStatCard(
                  title: 'Doanh thu hôm nay',
                  value: currencyFormat.format(double.parse(data['today_revenue']?.toString() ?? '0')),
                  icon: Icons.attach_money,
                  color: Colors.green,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        title: 'Đơn hàng',
                        value: data['today_orders']?.toString() ?? '0',
                        icon: Icons.shopping_cart,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard(
                        title: 'Tổng sản phẩm',
                        value: data['total_products']?.toString() ?? '0',
                        icon: Icons.inventory_2,
                        color: Colors.orange,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        title: 'Sắp hết hàng',
                        value: data['low_stock']?.toString() ?? '0',
                        icon: Icons.warning_amber,
                        color: Colors.amber,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildStatCard(
                        title: 'Hết hàng',
                        value: data['out_of_stock']?.toString() ?? '0',
                        icon: Icons.error_outline,
                        color: Colors.red,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildStatCard(
                  title: 'Sản phẩm hết/sắp hết hạn',
                  value: '${data['expired_batches'] ?? 0} hết hạn / ${data['expiring_soon'] ?? 0} sắp hết',
                  icon: Icons.event_busy,
                  color: Colors.deepPurple,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.black54,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
