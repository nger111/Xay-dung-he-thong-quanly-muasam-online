/**
 * backend/src/constants/roles.js
 * Định nghĩa tất cả các Role trong hệ thống (RBAC)
 */

const ROLES = {
  ADMIN: 'ADMIN',           // Quản trị viên — toàn quyền
  MANAGER: 'MANAGER',       // Nhân viên quản lý
  CASHIER: 'CASHIER',       // Thu ngân / Nhân viên bán hàng
  CUSTOMER: 'CUSTOMER',     // Khách hàng — Mobile App
  CHU_QUAN: 'CHU_QUAN',     // Alias: Chủ quán (tương đương ADMIN)
  NHAN_VIEN: 'NHAN_VIEN',   // Alias: Nhân viên (tương đương CASHIER)
};

module.exports = ROLES;
