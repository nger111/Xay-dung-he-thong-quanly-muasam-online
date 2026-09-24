import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../providers/cart_provider.dart';

class PosScreen extends ConsumerStatefulWidget {
  const PosScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends ConsumerState<PosScreen> {
  final TextEditingController _cashController = TextEditingController();
  // Khởi tạo Dio với Base URL, có thể thay thế bằng api_client của project
  final Dio dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:3000/api')); 

  @override
  void dispose() {
    _cashController.dispose();
    super.dispose();
  }

  // Xử lý thanh toán
  Future<void> _processPayment(CartState cartState) async {
    if (cartState.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng trống!')),
      );
      return;
    }

    final double cashReceived = double.tryParse(_cashController.text) ?? 0;
    if (cashReceived < cartState.totalAmount) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Số tiền khách đưa không đủ!')),
      );
      return;
    }

    try {
      // Gọi API POST /orders để tạo đơn hàng
      final orderData = {
        'items': cartState.items.map((item) => {
          'productId': item.product.id,
          'quantity': item.quantity,
          'price': item.product.price,
        }).toList(),
        'totalAmount': cartState.totalAmount,
        'cashReceived': cashReceived,
      };

      final response = await dio.post('/orders', data: orderData);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Thanh toán thành công, xoá giỏ hàng và input
        ref.read(cartProvider.notifier).clearCart();
        _cashController.clear();

        if (mounted) {
          // Hiển thị dialog thông báo thành công và tiền thừa
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Thanh toán thành công'),
              content: Text('Tiền thừa: ${cashReceived - cartState.totalAmount}'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Đóng'),
                ),
              ],
            ),
          );
        }
      } else {
        throw Exception('Lỗi từ server');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi khi thanh toán: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Lắng nghe trạng thái giỏ hàng từ provider
    final cartState = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bán hàng'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              // Chuyển hướng sang màn hình quét mã vạch
              context.push('/pos/scanner');
            },
            tooltip: 'Quét mã vạch',
          ),
        ],
      ),
      body: Column(
        children: [
          // Khu vực giữa: Danh sách sản phẩm trong giỏ hàng
          Expanded(
            child: cartState.items.isEmpty
                ? const Center(child: Text('Chưa có sản phẩm trong giỏ'))
                : ListView.builder(
                    itemCount: cartState.items.length,
                    itemBuilder: (context, index) {
                      final item = cartState.items[index];
                      return ListTile(
                        title: Text(item.product.name),
                        subtitle: Text('Đơn giá: ${item.product.price} - Tổng: ${item.subtotal}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: () {
                                ref.read(cartProvider.notifier)
                                   .updateQuantity(item.product.id, item.quantity - 1);
                              },
                            ),
                            Text('${item.quantity}', style: const TextStyle(fontSize: 16)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              onPressed: () {
                                ref.read(cartProvider.notifier)
                                   .updateQuantity(item.product.id, item.quantity + 1);
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          
          // Khu vực dưới: Tổng tiền, tiền khách đưa, nút thanh toán
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 1,
                  blurRadius: 5,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Tổng tiền:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('${cartState.totalAmount}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red)),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _cashController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Tiền khách đưa',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _processPayment(cartState),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.blue,
                  ),
                  child: const Text('Thanh toán', style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
