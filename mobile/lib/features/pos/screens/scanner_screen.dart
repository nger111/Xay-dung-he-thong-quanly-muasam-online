import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../providers/cart_provider.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController cameraController = MobileScannerController();
  bool isProcessing = false;
  
  // Khởi tạo Dio, có thể sử dụng interceptor hoặc api_client sẵn có
  final Dio dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:3000/api')); 

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  // Xử lý khi quét được mã vạch
  Future<void> _handleBarcode(BarcodeCapture capture) async {
    // Tránh việc gọi API liên tục khi chưa xử lý xong mã trước đó
    if (isProcessing) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        setState(() {
          isProcessing = true;
        });
        
        try {
          // GET /products/barcode/:barcode
          final response = await dio.get('/products/barcode/$code');
          if (response.statusCode == 200 && response.data != null) {
            final product = Product.fromJson(response.data);
            
            // Thêm vào provider giỏ hàng
            ref.read(cartProvider.notifier).addItem(product);
            
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Đã thêm ${product.name} vào giỏ hàng'),
                  backgroundColor: Colors.green,
                ),
              );
              // Đóng màn hình quét sau khi thành công
              context.pop();
            }
          } else {
            _showError('Không tìm thấy sản phẩm');
          }
        } catch (e) {
          _showError('Lỗi kết nối hoặc không tìm thấy sản phẩm: $e');
        } finally {
          if (mounted) {
            setState(() {
              isProcessing = false;
            });
          }
        }
      }
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message, style: const TextStyle(color: Colors.white)),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quét mã vạch'),
        actions: [
          // Nút bật tắt đèn flash
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: cameraController.torchState,
              builder: (context, state, child) {
                switch (state) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: Colors.yellow);
                }
              },
            ),
            onPressed: () => cameraController.toggleTorch(),
          ),
          // Nút xoay camera trước/sau
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: cameraController.cameraFacingState,
              builder: (context, state, child) {
                switch (state) {
                  case CameraFacing.front:
                    return const Icon(Icons.camera_front);
                  case CameraFacing.back:
                    return const Icon(Icons.camera_rear);
                }
              },
            ),
            onPressed: () => cameraController.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Màn hình camera
          MobileScanner(
            controller: cameraController,
            onDetect: _handleBarcode,
          ),
          // Hiển thị vòng xoay đang tải khi gọi API
          if (isProcessing)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
          // Khung ngắm ở giữa màn hình
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.green, width: 2),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          )
        ],
      ),
    );
  }
}
