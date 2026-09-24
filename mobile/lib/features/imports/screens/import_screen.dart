import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';

final importsProvider = FutureProvider.autoDispose((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('/imports');
  return response.data['data']['imports'] as List;
});

class ImportScreen extends ConsumerWidget {
  const ImportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final importsState = ref.watch(importsProvider);
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch sử nhập hàng'),
        centerTitle: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Chuyển sang màn hình tạo phiếu nhập mới
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Chức năng nhập hàng mới đang phát triển')),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Nhập hàng'),
      ),
      body: importsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Lỗi: $err')),
        data: (imports) {
          if (imports.isEmpty) {
            return const Center(child: Text('Chưa có phiếu nhập nào.'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(importsProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: imports.length,
              itemBuilder: (context, index) {
                final item = imports[index];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.blueAccent,
                      child: Icon(Icons.receipt_long, color: Colors.white),
                    ),
                    title: Text('Mã phiếu: ${item['receipt_code']}'),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('NCC: ${item['supplier_name'] ?? 'Khách lẻ'}'),
                        Text('Ngày: ${dateFormat.format(DateTime.parse(item['created_at']))}'),
                        Text('Số loại SP: ${item['item_count']}'),
                      ],
                    ),
                    trailing: Text(
                      currencyFormat.format(double.parse(item['total_amount'].toString())),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                        fontSize: 14,
                      ),
                    ),
                    isThreeLine: true,
                    onTap: () {
                      // Xem chi tiết phiếu nhập
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
