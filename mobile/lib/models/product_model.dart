class Product {
  final String id;
  final String productCode;
  final String? barcode;
  final String name;
  final double importPrice;
  final double sellingPrice;
  final int stockQuantity;
  final String unit;
  final String? mainImage;
  final String? categoryName;

  Product({
    required this.id,
    required this.productCode,
    this.barcode,
    required this.name,
    required this.importPrice,
    required this.sellingPrice,
    required this.stockQuantity,
    required this.unit,
    this.mainImage,
    this.categoryName,
  });

  // Khởi tạo object Product từ JSON
  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      productCode: json['productCode'] ?? '',
      barcode: json['barcode'],
      name: json['name'] ?? '',
      importPrice: (json['importPrice'] ?? 0).toDouble(),
      sellingPrice: (json['sellingPrice'] ?? 0).toDouble(),
      stockQuantity: json['stockQuantity'] ?? 0,
      unit: json['unit'] ?? '',
      mainImage: json['mainImage'],
      categoryName: json['categoryName'],
    );
  }

  // Chuyển object Product sang cấu trúc JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productCode': productCode,
      'barcode': barcode,
      'name': name,
      'importPrice': importPrice,
      'sellingPrice': sellingPrice,
      'stockQuantity': stockQuantity,
      'unit': unit,
      'mainImage': mainImage,
      'categoryName': categoryName,
    };
  }
}
