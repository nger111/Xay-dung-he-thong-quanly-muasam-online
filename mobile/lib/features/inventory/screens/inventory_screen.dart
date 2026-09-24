import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

final dioProvider = Provider((ref) => Dio(BaseOptions(baseUrl: 'http://10.0.2.2:3000/api')));

class InventoryItem {
  final String productId;
  final String productName;
  final int currentStock;
  final String shelfLocation;

  InventoryItem({
    required this.productId,
    required this.productName,
    required this.currentStock,
    required this.shelfLocation,
  });

  // Chuyển đổi JSON từ API sang Model
  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    return InventoryItem(
      productId: json['productId'] ?? json['_id'] ?? '',
      productName: json['productName'] ?? json['name'] ?? 'Chưa rõ',
      currentStock: json['currentStock'] ?? json['stock'] ?? 0,
      shelfLocation: json['shelfLocation'] ?? json['location'] ?? 'Chưa xếp',
    );
  }
}

// Các bộ lọc tồn kho
enum InventoryFilter { all, lowStock, outOfStock }

// State Provider quản lý bộ lọc
final inventoryFilterProvider = StateProvider<InventoryFilter>((ref) => InventoryFilter.all);

// Provider lấy danh sách theo bộ lọc
final inventoryListProvider = FutureProvider.autoDispose<List<InventoryItem>>((ref) async {
  final dio = ref.watch(dioProvider);
  final filter = ref.watch(inventoryFilterProvider);

  String endpoint = '/inventory';
  if (filter == InventoryFilter.lowStock) endpoint = '/inventory/low-stock';
  if (filter == InventoryFilter.outOfStock) endpoint = '/inventory/out-of-stock';

  try {
    final response = await dio.get(endpoint);
    final List<dynamic> data = response.data is List ? response.data : (response.data['data'] ?? []);
    return data.map((json) => InventoryItem.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Lỗi khi tải dữ liệu tồn kho: $e');
  }
});

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    // 3 Tab tương ứng với: Tất cả, Sắp hết, Hết hàng
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      
      final filter = switch (_tabController.index) {
        1 => InventoryFilter.lowStock,
        2 => InventoryFilter.outOfStock,
        _ => InventoryFilter.all,
      };
      
      // Cập nhật bộ lọc theo tab được chọn
      ref.read(inventoryFilterProvider.notifier).state = filter;
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // Dialog điều chỉnh số lượng tồn kho
  Future<void> _showAdjustStockDialog(InventoryItem item) async {
    final stockController = TextEditingController(text: item.currentStock.toString());
    
    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Điều chỉnh tồn kho'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Sản phẩm: ${item.productName}'),
              const SizedBox(height: 16),
              TextField(
                controller: stockController,
                decoration: const InputDecoration(
                  labelText: 'Số lượng tồn kho mới',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () async {
                final newStock = int.tryParse(stockController.text) ?? 0;
                try {
                  final dio = ref.read(dioProvider);
                  // Gọi API cập nhật tồn kho
                  await dio.put('/inventory/${item.productId}', data: {'stock': newStock});
                  Navigator.of(context).pop(true);
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi cập nhật: $e')),
                  );
                }
              },
              child: const Text('Cập nhật'),
            ),
          ],
        );
      },
    );

    // Nếu cập nhật thành công, làm mới danh sách
    if (result == true) {
      ref.invalidate(inventoryListProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inventoryAsyncValue = ref.watch(inventoryListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý Tồn kho'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Tất cả'),
            Tab(text: 'Sắp hết'),
            Tab(text: 'Hết hàng'),
          ],
        ),
      ),
      body: inventoryAsyncValue.when(
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('Không có dữ liệu tồn kho.'));
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(inventoryListProvider);
            },
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                // Thay đổi màu tùy vào trạng thái
                final isOutOfStock = item.currentStock <= 0;
                final isLowStock = item.currentStock > 0 && item.currentStock < 10;

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                  child: ListTile(
                    leading: const CircleAvatar(
                      child: Icon(Icons.shelves),
                    ),
                    title: Text(item.productName),
                    subtitle: Text('Vị trí: ${item.shelfLocation}'),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isOutOfStock 
                            ? Colors.red.shade100 
                            : (isLowStock ? Colors.orange.shade100 : Colors.green.shade100),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        'SL: ${item.currentStock}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isOutOfStock 
                              ? Colors.red.shade900 
                              : (isLowStock ? Colors.orange.shade900 : Colors.green.shade900),
                        ),
                      ),
                    ),
                    onTap: () => _showAdjustStockDialog(item),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Lỗi: $error', style: const TextStyle(color: Colors.red)),
        ),
      ),
    );
  }
}
