import 'package:flutter_riverpod/flutter_riverpod.dart';

// Mô hình sản phẩm cơ bản cho POS
class Product {
  final String id;
  final String name;
  final double price;
  final String barcode;

  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.barcode,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      barcode: json['barcode'] ?? '',
    );
  }
}

// Đối tượng đại diện cho một mặt hàng trong giỏ hàng
class CartItem {
  final Product product;
  final int quantity;
  
  CartItem({required this.product, this.quantity = 1});
  
  // Tính tổng tiền của mặt hàng
  double get subtotal => product.price * quantity;
  
  CartItem copyWith({Product? product, int? quantity}) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }
}

// Trạng thái giỏ hàng
class CartState {
  final List<CartItem> items;
  
  CartState({this.items = const []});
  
  // Tính tổng tiền của cả giỏ hàng
  double get totalAmount => items.fold(0, (sum, item) => sum + item.subtotal);
  
  CartState copyWith({List<CartItem>? items}) {
    return CartState(items: items ?? this.items);
  }
}

// Quản lý trạng thái giỏ hàng
class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  // Thêm sản phẩm vào giỏ
  void addItem(Product product) {
    final existingIndex = state.items.indexWhere((item) => item.product.id == product.id);
    if (existingIndex >= 0) {
      // Nếu đã có trong giỏ, tăng số lượng
      final newItems = List<CartItem>.from(state.items);
      final item = newItems[existingIndex];
      newItems[existingIndex] = item.copyWith(quantity: item.quantity + 1);
      state = state.copyWith(items: newItems);
    } else {
      // Nếu chưa có, thêm mới
      state = state.copyWith(items: [...state.items, CartItem(product: product)]);
    }
  }

  // Xoá sản phẩm khỏi giỏ
  void removeItem(String productId) {
    final newItems = state.items.where((item) => item.product.id != productId).toList();
    state = state.copyWith(items: newItems);
  }

  // Cập nhật số lượng sản phẩm
  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    final newItems = state.items.map((item) {
      if (item.product.id == productId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();
    state = state.copyWith(items: newItems);
  }

  // Xoá toàn bộ giỏ hàng
  void clearCart() {
    state = state.copyWith(items: []);
  }
}

// Provider toàn cục cho giỏ hàng
final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});
