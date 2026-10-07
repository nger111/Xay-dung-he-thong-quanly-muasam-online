/**
 * backend/src/constants/roles.js
 * Định nghĩa tất cả các Role trong hệ thống (RBAC)
 */

const ROLES = {
  ADMIN: 'ADMIN',       // Quản trị viên — toàn quyền
  MANAGER: 'MANAGER',   // Nhân viên quản lý — quản lý sản phẩm, kho, nhập hàng
  CASHIER: 'CASHIER',   // Thu ngân / Nhân viên bán hàng — POS, hóa đơn
  CUSTOMER: 'CUSTOMER', // Khách hàng — Mobile App
};

module.exports = ROLES;
