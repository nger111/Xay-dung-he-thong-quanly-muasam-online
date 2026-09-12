-- =========================================================
-- DATABASE QUẢN LÝ CỬA HÀNG TẠP HÓA
-- =========================================================

DROP DATABASE IF EXISTS quanly_taphoa;

CREATE DATABASE quanly_taphoa
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE quanly_taphoa;


-- =========================================================
-- 1. NGƯỜI DÙNG
-- =========================================================

CREATE TABLE nguoi_dung (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,

    mat_khau VARCHAR(255) NOT NULL,

    ho_ten VARCHAR(100) NOT NULL,

    so_dien_thoai VARCHAR(20),

    vai_tro ENUM('CHU_QUAN', 'NHAN_VIEN')
        NOT NULL DEFAULT 'NHAN_VIEN',

    trang_thai BOOLEAN NOT NULL DEFAULT TRUE,

    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. DANH MỤC
-- =========================================================

CREATE TABLE danh_muc (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,

    mo_ta VARCHAR(255),

    trang_thai BOOLEAN NOT NULL DEFAULT TRUE,

    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 3. ĐƠN VỊ TÍNH
-- =========================================================

CREATE TABLE don_vi_tinh (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ten_don_vi VARCHAR(50) NOT NULL UNIQUE
);


-- =========================================================
-- 4. SẢN PHẨM
-- =========================================================

CREATE TABLE san_pham (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ma_san_pham VARCHAR(50) NOT NULL UNIQUE,

    ma_vach VARCHAR(50) UNIQUE,

    ten_san_pham VARCHAR(255) NOT NULL,

    danh_muc_id INT NOT NULL,

    don_vi_tinh_id INT NOT NULL,

    gia_nhap DECIMAL(15,2) NOT NULL DEFAULT 0,

    gia_ban DECIMAL(15,2) NOT NULL DEFAULT 0,

    han_su_dung DATE,

    mo_ta VARCHAR(500),

    hinh_anh VARCHAR(500),

    trang_thai ENUM('DANG_BAN', 'NGUNG_BAN')
        NOT NULL DEFAULT 'DANG_BAN',

    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_sanpham_danhmuc
        FOREIGN KEY (danh_muc_id)
        REFERENCES danh_muc(id),

    CONSTRAINT fk_sanpham_donvitinh
        FOREIGN KEY (don_vi_tinh_id)
        REFERENCES don_vi_tinh(id)
);


-- =========================================================
-- 5. TỒN KHO
-- =========================================================

CREATE TABLE ton_kho (
    id INT AUTO_INCREMENT PRIMARY KEY,

    san_pham_id INT NOT NULL UNIQUE,

    so_luong INT NOT NULL DEFAULT 0,

    muc_ton_toi_thieu INT NOT NULL DEFAULT 5,

    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tonkho_sanpham
        FOREIGN KEY (san_pham_id)
        REFERENCES san_pham(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 6. NHÀ CUNG CẤP
-- =========================================================

CREATE TABLE nha_cung_cap (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ten_nha_cung_cap VARCHAR(150) NOT NULL,

    so_dien_thoai VARCHAR(20),

    email VARCHAR(100),

    dia_chi VARCHAR(255),

    ghi_chu VARCHAR(500),

    trang_thai BOOLEAN NOT NULL DEFAULT TRUE,

    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 7. PHIẾU NHẬP
-- =========================================================

CREATE TABLE phieu_nhap (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ma_phieu VARCHAR(50) NOT NULL UNIQUE,

    nha_cung_cap_id INT,

    nguoi_nhap_id INT NOT NULL,

    ngay_nhap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    tong_tien DECIMAL(15,2) NOT NULL DEFAULT 0,

    ghi_chu VARCHAR(500),

    trang_thai ENUM('HOAN_THANH', 'DA_HUY')
        NOT NULL DEFAULT 'HOAN_THANH',

    CONSTRAINT fk_phieunhap_nhacungcap
        FOREIGN KEY (nha_cung_cap_id)
        REFERENCES nha_cung_cap(id),

    CONSTRAINT fk_phieunhap_nguoidung
        FOREIGN KEY (nguoi_nhap_id)
        REFERENCES nguoi_dung(id)
);


-- =========================================================
-- 8. CHI TIẾT PHIẾU NHẬP
-- =========================================================

CREATE TABLE chi_tiet_phieu_nhap (
    id INT AUTO_INCREMENT PRIMARY KEY,

    phieu_nhap_id INT NOT NULL,

    san_pham_id INT NOT NULL,

    so_luong INT NOT NULL,

    don_gia DECIMAL(15,2) NOT NULL,

    thanh_tien DECIMAL(15,2)
        GENERATED ALWAYS AS (so_luong * don_gia) STORED,

    CONSTRAINT fk_ctpn_phieunhap
        FOREIGN KEY (phieu_nhap_id)
        REFERENCES phieu_nhap(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ctpn_sanpham
        FOREIGN KEY (san_pham_id)
        REFERENCES san_pham(id)
);


-- =========================================================
-- 9. HÓA ĐƠN BÁN HÀNG
-- =========================================================

CREATE TABLE hoa_don (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ma_hoa_don VARCHAR(50) NOT NULL UNIQUE,

    nguoi_ban_id INT NOT NULL,

    ngay_ban DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    tong_tien DECIMAL(15,2) NOT NULL DEFAULT 0,

    tien_khach_dua DECIMAL(15,2) NOT NULL DEFAULT 0,

    tien_thua DECIMAL(15,2) NOT NULL DEFAULT 0,

    phuong_thuc_thanh_toan
        ENUM('TIEN_MAT', 'CHUYEN_KHOAN')
        NOT NULL DEFAULT 'TIEN_MAT',

    trang_thai
        ENUM('HOAN_THANH', 'DA_HUY')
        NOT NULL DEFAULT 'HOAN_THANH',

    ghi_chu VARCHAR(500),

    CONSTRAINT fk_hoadon_nguoidung
        FOREIGN KEY (nguoi_ban_id)
        REFERENCES nguoi_dung(id)
);


-- =========================================================
-- 10. CHI TIẾT HÓA ĐƠN
-- =========================================================

CREATE TABLE chi_tiet_hoa_don (
    id INT AUTO_INCREMENT PRIMARY KEY,

    hoa_don_id INT NOT NULL,

    san_pham_id INT NOT NULL,

    so_luong INT NOT NULL,

    don_gia DECIMAL(15,2) NOT NULL,

    thanh_tien DECIMAL(15,2)
        GENERATED ALWAYS AS (so_luong * don_gia) STORED,

    CONSTRAINT fk_cthd_hoadon
        FOREIGN KEY (hoa_don_id)
        REFERENCES hoa_don(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cthd_sanpham
        FOREIGN KEY (san_pham_id)
        REFERENCES san_pham(id)
);


-- =========================================================
-- 11. LỊCH SỬ TỒN KHO
-- =========================================================

CREATE TABLE lich_su_ton_kho (
    id INT AUTO_INCREMENT PRIMARY KEY,

    san_pham_id INT NOT NULL,

    loai_giao_dich ENUM(
        'NHAP_HANG',
        'BAN_HANG',
        'DIEU_CHINH',
        'HU_HONG',
        'TRA_HANG'
    ) NOT NULL,

    so_luong INT NOT NULL,

    so_luong_truoc INT NOT NULL,

    so_luong_sau INT NOT NULL,

    tham_chieu_id INT,

    ghi_chu VARCHAR(500),

    nguoi_thuc_hien_id INT,

    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lichsu_sanpham
        FOREIGN KEY (san_pham_id)
        REFERENCES san_pham(id),

    CONSTRAINT fk_lichsu_nguoidung
        FOREIGN KEY (nguoi_thuc_hien_id)
        REFERENCES nguoi_dung(id)
);


-- =========================================================
-- INDEX
-- =========================================================

CREATE INDEX idx_sanpham_ten
ON san_pham(ten_san_pham);

CREATE INDEX idx_sanpham_danhmuc
ON san_pham(danh_muc_id);

CREATE INDEX idx_sanpham_mavach
ON san_pham(ma_vach);

CREATE INDEX idx_hoadon_ngayban
ON hoa_don(ngay_ban);

CREATE INDEX idx_phieunhap_ngaynhap
ON phieu_nhap(ngay_nhap);

CREATE INDEX idx_lichsu_sanpham
ON lich_su_ton_kho(san_pham_id);


-- =========================================================
-- DỮ LIỆU MẪU
-- =========================================================

-- Người dùng
INSERT INTO nguoi_dung
(ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, vai_tro)
VALUES
('admin', '123456', 'Chủ cửa hàng', '0900000000', 'CHU_QUAN');


-- Danh mục
INSERT INTO danh_muc
(ten_danh_muc, mo_ta)
VALUES
('Đồ uống', 'Nước ngọt, nước suối, nước tăng lực'),
('Bánh kẹo', 'Các loại bánh và kẹo'),
('Mì ăn liền', 'Mì gói, mì ly'),
('Sữa', 'Sữa hộp, sữa tươi'),
('Gia vị', 'Nước mắm, dầu ăn, đường, muối'),
('Đồ gia dụng', 'Các sản phẩm gia dụng');


-- Đơn vị tính
INSERT INTO don_vi_tinh
(ten_don_vi)
VALUES
('Chai'),
('Lon'),
('Gói'),
('Hộp'),
('Cái'),
('Kg'),
('Thùng');


-- Nhà cung cấp
INSERT INTO nha_cung_cap
(ten_nha_cung_cap, so_dien_thoai, dia_chi)
VALUES
('Nhà cung cấp ABC', '0911111111', 'Hà Nội'),
('Nhà cung cấp XYZ', '0922222222', 'Hưng Yên');


-- Sản phẩm
INSERT INTO san_pham
(
    ma_san_pham,
    ma_vach,
    ten_san_pham,
    danh_muc_id,
    don_vi_tinh_id,
    gia_nhap,
    gia_ban,
    han_su_dung
)
VALUES
(
    'SP001',
    '8931234567890',
    'Coca Cola 330ml',
    1,
    2,
    7000,
    10000,
    '2027-12-31'
),

(
    'SP002',
    '8931234567891',
    'Pepsi 330ml',
    1,
    2,
    7000,
    10000,
    '2027-12-31'
),

(
    'SP003',
    '8931234567892',
    'Mì Hảo Hảo Tôm Chua Cay',
    3,
    3,
    3500,
    5000,
    '2027-06-30'
),

(
    'SP004',
    '8931234567893',
    'Sữa Vinamilk 180ml',
    4,
    4,
    6000,
    8000,
    '2027-03-30'
);


-- Tồn kho ban đầu
INSERT INTO ton_kho
(san_pham_id, so_luong, muc_ton_toi_thieu)
VALUES
(1, 50, 10),
(2, 40, 10),
(3, 100, 20),
(4, 30, 10);


-- =========================================================
-- KIỂM TRA DATABASE
-- =========================================================

SHOW TABLES;