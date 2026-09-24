class User {
  final String id;
  final String username;
  final String fullName;
  final String role;

  User({
    required this.id,
    required this.username,
    required this.fullName,
    required this.role,
  });

  // Tạo object User từ JSON (Thường dùng khi nhận response từ API)
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      fullName: json['fullName'] ?? '',
      role: json['role'] ?? '',
    );
  }

  // Chuyển object User thành JSON để gửi đi hoặc lưu trữ
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'fullName': fullName,
      'role': role,
    };
  }
}
