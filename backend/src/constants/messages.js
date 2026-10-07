/**
 * backend/src/constants/messages.js
 * Định nghĩa các message response chuẩn dùng cho toàn hệ thống
 */

const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGOUT_SUCCESS: 'Đăng xuất thành công. Hãy xóa token ở phía client.',
  REGISTER_SUCCESS: 'Đăng ký tài khoản thành công!',
  CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công!',
  INVALID_CREDENTIALS: 'Email/tên đăng nhập hoặc mật khẩu không đúng.',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa. Vui lòng liên hệ Admin.',
  TOKEN_MISSING: 'Vui lòng đăng nhập để tiếp tục.',
  TOKEN_INVALID: 'Token không hợp lệ hoặc đã hết hạn.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',

  // User
  USER_NOT_FOUND: 'Không tìm thấy người dùng.',
  USER_CREATED: 'Tạo tài khoản thành công!',
  USER_UPDATED: 'Cập nhật thông tin thành công!',
  USER_LOCKED: 'Khóa tài khoản thành công.',
  USER_UNLOCKED: 'Mở khóa tài khoản thành công.',
  EMAIL_DUPLICATE: 'Email đã được sử dụng bởi tài khoản khác.',

  // Category
  CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục.',
  CATEGORY_CREATED: 'Thêm danh mục thành công!',
  CATEGORY_UPDATED: 'Cập nhật danh mục thành công!',
  CATEGORY_DELETED: 'Xóa danh mục thành công.',

  // Product
  PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm.',
  PRODUCT_CREATED: 'Thêm sản phẩm thành công!',
  PRODUCT_UPDATED: 'Cập nhật sản phẩm thành công!',
  PRODUCT_DELETED: 'Xóa sản phẩm thành công.',
  PRODUCT_HIDDEN: 'Sản phẩm đã được ẩn (không thể xóa vì đã có trong đơn hàng).',
  BARCODE_DUPLICATE: 'Mã vạch (barcode) đã tồn tại trong hệ thống.',
  SKU_DUPLICATE: 'Mã SKU đã tồn tại trong hệ thống.',
  BARCODE_NOT_FOUND: 'Không tìm thấy sản phẩm với mã vạch này.',

  // Supplier
  SUPPLIER_NOT_FOUND: 'Không tìm thấy nhà cung cấp.',
  SUPPLIER_CREATED: 'Thêm nhà cung cấp thành công!',
  SUPPLIER_UPDATED: 'Cập nhật nhà cung cấp thành công!',
  SUPPLIER_DELETED: 'Vô hiệu hóa nhà cung cấp thành công.',

  // Purchase Order
  PURCHASE_ORDER_NOT_FOUND: 'Không tìm thấy phiếu nhập hàng.',
  PURCHASE_ORDER_CREATED: 'Tạo phiếu nhập hàng thành công!',
  PURCHASE_ORDER_CONFIRMED: 'Xác nhận phiếu nhập hàng thành công! Tồn kho đã được cập nhật.',
  PURCHASE_ORDER_LOCKED: 'Phiếu nhập đã hoàn thành, không thể chỉnh sửa.',

  // Inventory
  BATCH_NOT_FOUND: 'Không tìm thấy lô hàng.',

  // Order / POS
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng.',
  ORDER_CREATED: 'Tạo đơn hàng thành công!',
  ORDER_CANCELLED: 'Hủy đơn hàng thành công. Tồn kho đã được hoàn lại.',
  ORDER_ALREADY_CANCELLED: 'Đơn hàng đã bị hủy trước đó.',
  INSUFFICIENT_STOCK: 'Số lượng tồn kho không đủ.',
  EXPIRED_PRODUCT: 'Sản phẩm thuộc lô đã hết hạn sử dụng, không thể bán.',
  INSUFFICIENT_CASH: 'Số tiền khách đưa không đủ.',
};

module.exports = MESSAGES;
