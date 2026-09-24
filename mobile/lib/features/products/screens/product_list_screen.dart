import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';

// Khởi tạo Dio với Base URL (dành cho máy ảo Android: 10.0.2.2)
final dioProvider = Provider((ref) => Dio(BaseOptions(baseUrl: 'http://10.0.2.2:3000/api')));

class Product {
  final String id;
  final String code;
  final String barcode;
  final String name;
  final double importPrice;
  final double exportPrice;
  final int stock;

  Product({
    required this.id,
    required this.code,
    required this.barcode,
    required this.name,
    required this.importPrice,
    required this.exportPrice,
    required this.stock,
  });

  // Chuyển đổi JSON từ API sang Model
  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'] ?? json['id'] ?? '',
      code: json['code'] ?? '',
      barcode: json['barcode'] ?? '',
      name: json['name'] ?? '',
      importPrice: (json['importPrice'] ?? 0).toDouble(),
      exportPrice: (json['exportPrice'] ?? 0).toDouble(),
      stock: json['stock'] ?? 0,
    );
  }
}

// Provider quản lý search query
final searchQueryProvider = StateProvider<String>((ref) => '');

// Provider lấy danh sách sản phẩm (tự động dispose khi không còn người nghe)
final productListProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  final dio = ref.watch(dioProvider);
  final query = ref.watch(searchQueryProvider);
  
  try {
    Response response;
    if (query.isEmpty) {
      // Lấy toàn bộ sản phẩm
      response = await dio.get('/products');
    } else {
      // Tìm kiếm sản phẩm
      response = await dio.get('/products/search', queryParameters: {'q': query});
    }
    
    // Tương thích với các định dạng trả về khác nhau của API
    final List<dynamic> data = response.data is List ? response.data : (response.data['data'] ?? []);
    return data.map((json) => Product.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Lỗi khi tải danh sách sản phẩm: $e');
  }
});

class ProductListScreen extends ConsumerWidget {
  const ProductListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsyncValue = ref.watch(productListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Danh sách Sản phẩm'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60.0),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Tìm kiếm sản phẩm...',
                fillColor: Colors.white,
                filled: true,
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                ),
              ),
              onChanged: (value) {
                // Cập nhật giá trị tìm kiếm để Riverpod gọi lại API
                ref.read(searchQueryProvider.notifier).state = value;
              },
            ),
          ),
        ),
      ),
      body: productsAsyncValue.when(
        data: (products) {
          if (products.isEmpty) {
            return const Center(child: Text('Không tìm thấy sản phẩm nào.'));
          }
          return RefreshIndicator(
            onRefresh: () async {
              // Làm mới danh sách bằng cách invalidate provider
              ref.invalidate(productListProvider);
            },
            child: ListView.builder(
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                  child: ListTile(
                    leading: const CircleAvatar(
                      child: Icon(Icons.inventory_2),
                    ),
                    title: Text(product.name),
                    subtitle: Text('Mã: ${product.code} - Tồn kho: ${product.stock}'),
                    trailing: Text(
                      '${product.exportPrice} đ',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold, 
                        color: Colors.green,
                      ),
                    ),
                    onTap: () {
                      // Chuyển hướng xem chi tiết nếu cần
                    },
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text(
            'Lỗi: $error',
            style: const TextStyle(color: Colors.red),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          // Chuyển đến màn hình thêm sản phẩm
          await context.push('/products/add');
          // Sau khi thêm xong quay về thì làm mới danh sách
          ref.invalidate(productListProvider);
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
