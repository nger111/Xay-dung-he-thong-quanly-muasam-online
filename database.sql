-- ============================================================
-- ỨNG DỤNG QUẢN LÝ & BÁN HÀNG TẠP HOÁ
-- Database Schema MySQL 8.x
-- Tác giả: Đồ án môn Phát triển ứng dụng Mobile đa nền tảng
-- ============================================================

DROP DATABASE IF EXISTS quan_ly_tap_hoa;

CREATE DATABASE quan_ly_tap_hoa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quan_ly_tap_hoa;

-- ============================================================
-- 1. NGƯỜI DÙNG (users)
-- Lưu thông tin chủ cửa hàng và nhân viên
-- ============================================================

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE         COMMENT 'Tên đăng nhập',
    password_hash VARCHAR(255) NOT NULL                COMMENT 'Mật khẩu đã mã hoá bcrypt',
    full_name     VARCHAR(100) NOT NULL                COMMENT 'Họ và tên',
    phone         VARCHAR(20)                          COMMENT 'Số điện thoại',
    email         VARCHAR(100) UNIQUE                  COMMENT 'Email',
    role          ENUM('CHU_QUAN', 'NHAN_VIEN')
                  NOT NULL DEFAULT 'NHAN_VIEN'         COMMENT 'Phân quyền: Chủ quán hoặc Nhân viên',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE   COMMENT 'Tài khoản còn hoạt động?',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT = 'Bảng người dùng hệ thống';


-- ============================================================
-- 2. DANH MỤC SẢN PHẨM (categories)
-- ============================================================

CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE   COMMENT 'Tên danh mục (VD: Đồ uống, Bánh kẹo)',
    description TEXT                           COMMENT 'Mô tả danh mục',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT = 'Danh mục sản phẩm';


-- ============================================================
-- 3. NHÀ CUNG CẤP (suppliers)
-- ============================================================

CREATE TABLE suppliers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(200) NOT NULL       COMMENT 'Tên nhà cung cấp',
    phone          VARCHAR(20)                 COMMENT 'Số điện thoại',
    email          VARCHAR(100)                COMMENT 'Email',
    address        TEXT                        COMMENT 'Địa chỉ',
    contact_person VARCHAR(100)                COMMENT 'Người liên hệ',
    note           TEXT                        COMMENT 'Ghi chú thêm',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT = 'Nhà cung cấp hàng hoá';


-- ============================================================
-- 4. KỆ HÀNG (shelves)
-- VD: Kệ A, Kệ B, Kệ C, Tủ Đông, Tủ Mát
-- ============================================================

CREATE TABLE shelves (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE  COMMENT 'Tên kệ (VD: Kệ A, Tủ Đông)',
    description TEXT                          COMMENT 'Mô tả vị trí kệ',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT = 'Kệ hàng trong cửa hàng';


-- ============================================================
-- 5. VỊ TRÍ TRÊN KỆ (shelf_positions)
-- VD: Kệ A → Tầng 1 → Vị trí 01
-- ============================================================

CREATE TABLE shelf_positions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    shelf_id        INT          NOT NULL                COMMENT 'Thuộc kệ nào',
    floor_number    INT          NOT NULL                COMMENT 'Tầng (1, 2, 3...)',
    position_number VARCHAR(10)  NOT NULL                COMMENT 'Số vị trí (01, 02...)',
    label           VARCHAR(50)                          COMMENT 'Nhãn tuỳ chỉnh',

    FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
    UNIQUE KEY uq_shelf_floor_pos (shelf_id, floor_number, position_number)
) COMMENT = 'Vị trí cụ thể trên từng kệ';


-- ============================================================
-- 6. SẢN PHẨM (products)
-- Thông tin cơ bản của sản phẩm trong cửa hàng
-- ============================================================

CREATE TABLE products (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    product_code      VARCHAR(50)  NOT NULL UNIQUE       COMMENT 'Mã sản phẩm nội bộ',
    barcode           VARCHAR(100) NOT NULL UNIQUE       COMMENT 'Mã vạch/EAN — PHẢI DUY NHẤT',
    name              VARCHAR(200) NOT NULL               COMMENT 'Tên sản phẩm',
    category_id       INT                                COMMENT 'Danh mục',
    supplier_id       INT                                COMMENT 'Nhà cung cấp mặc định',
    unit              VARCHAR(50)  NOT NULL DEFAULT 'cái' COMMENT 'Đơn vị tính (cái, hộp, chai...)',
    import_price      DECIMAL(12,2) NOT NULL DEFAULT 0   COMMENT 'Giá nhập (đồng)',
    selling_price     DECIMAL(12,2) NOT NULL DEFAULT 0   COMMENT 'Giá bán (đồng)',
    stock_quantity    INT          NOT NULL DEFAULT 0    COMMENT 'Tổng tồn kho hiện tại',
    min_stock_level   INT          NOT NULL DEFAULT 5    COMMENT 'Mức tồn kho tối thiểu (cảnh báo)',
    shelf_position_id INT                                COMMENT 'Vị trí mặc định trên kệ',
    description       TEXT                               COMMENT 'Mô tả sản phẩm',
    status            ENUM('ACTIVE', 'INACTIVE')
                      NOT NULL DEFAULT 'ACTIVE'          COMMENT 'Trạng thái sản phẩm',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)       REFERENCES categories(id)       ON DELETE SET NULL,
    FOREIGN KEY (supplier_id)       REFERENCES suppliers(id)        ON DELETE SET NULL,
    FOREIGN KEY (shelf_position_id) REFERENCES shelf_positions(id)  ON DELETE SET NULL,

    INDEX idx_barcode   (barcode),
    INDEX idx_category  (category_id),
    INDEX idx_supplier  (supplier_id),
    INDEX idx_status    (status),
    INDEX idx_stock     (stock_quantity)
) COMMENT = 'Thông tin sản phẩm';


-- ============================================================
-- 7. HÌNH ẢNH SẢN PHẨM (product_images)
-- Mỗi sản phẩm có thể có nhiều ảnh
-- ============================================================

CREATE TABLE product_images (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    product_id  INT          NOT NULL,
    image_url   VARCHAR(500) NOT NULL   COMMENT 'Đường dẫn ảnh (URL hoặc path)',
    is_main     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Ảnh đại diện chính?',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) COMMENT = 'Hình ảnh sản phẩm';


-- ============================================================
-- 8. LÔ HÀNG / BATCH (inventory_batches)
-- Mỗi lần nhập hàng tạo ra một lô riêng biệt
-- Giúp quản lý hạn sử dụng chính xác cho từng lô
-- VD: Sữa ABC nhập 2 lần: lô1 HSD 01/2025, lô2 HSD 06/2025
-- ============================================================

CREATE TABLE inventory_batches (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    product_id        INT           NOT NULL              COMMENT 'Sản phẩm',
    supplier_id       INT                                 COMMENT 'Nhà cung cấp lô này',
    shelf_position_id INT                                 COMMENT 'Vị trí đặt lô hàng',
    batch_code        VARCHAR(100)                        COMMENT 'Mã lô (của NCC nếu có)',
    quantity          INT           NOT NULL DEFAULT 0    COMMENT 'Số lượng còn lại trong lô',
    original_quantity INT           NOT NULL DEFAULT 0    COMMENT 'Số lượng ban đầu khi nhập',
    import_price      DECIMAL(12,2) NOT NULL DEFAULT 0    COMMENT 'Giá nhập của lô này',
    import_date       DATE          NOT NULL               COMMENT 'Ngày nhập lô',
    expiry_date       DATE                                COMMENT 'Hạn sử dụng (NULL = không có HSD)',
    status            ENUM('ACTIVE', 'DEPLETED', 'EXPIRED')
                      NOT NULL DEFAULT 'ACTIVE'           COMMENT 'ACTIVE=còn, DEPLETED=hết, EXPIRED=quá hạn',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)        REFERENCES products(id)         ON DELETE CASCADE,
    FOREIGN KEY (supplier_id)       REFERENCES suppliers(id)        ON DELETE SET NULL,
    FOREIGN KEY (shelf_position_id) REFERENCES shelf_positions(id)  ON DELETE SET NULL,

    INDEX idx_product_id  (product_id),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_status      (status)
) COMMENT = 'Lô hàng nhập vào — quản lý hạn sử dụng theo lô';


-- ============================================================
-- 9. PHIẾU NHẬP HÀNG (import_receipts)
-- Header của phiếu nhập
-- ============================================================

CREATE TABLE import_receipts (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    receipt_code  VARCHAR(50)   NOT NULL UNIQUE     COMMENT 'Mã phiếu nhập (VD: PN20240101001)',
    supplier_id   INT                               COMMENT 'Nhà cung cấp',
    user_id       INT           NOT NULL             COMMENT 'Nhân viên thực hiện nhập hàng',
    import_date   DATE          NOT NULL             COMMENT 'Ngày nhập hàng',
    total_amount  DECIMAL(15,2) NOT NULL DEFAULT 0  COMMENT 'Tổng giá trị phiếu nhập',
    note          TEXT                               COMMENT 'Ghi chú',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)     REFERENCES users(id),

    INDEX idx_supplier    (supplier_id),
    INDEX idx_user        (user_id),
    INDEX idx_import_date (import_date)
) COMMENT = 'Phiếu nhập hàng';


-- ============================================================
-- 10. CHI TIẾT PHIẾU NHẬP (import_receipt_details)
-- Mỗi dòng là một sản phẩm trong phiếu nhập
-- Mỗi dòng tạo ra một lô hàng mới (inventory_batch)
-- ============================================================

CREATE TABLE import_receipt_details (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id        INT           NOT NULL            COMMENT 'Phiếu nhập',
    product_id        INT           NOT NULL            COMMENT 'Sản phẩm được nhập',
    batch_id          INT                               COMMENT 'Lô hàng được tạo từ dòng này',
    quantity          INT           NOT NULL            COMMENT 'Số lượng nhập',
    import_price      DECIMAL(12,2) NOT NULL            COMMENT 'Giá nhập của lô này',
    expiry_date       DATE                              COMMENT 'HSD của lô hàng này',
    shelf_position_id INT                               COMMENT 'Vị trí đặt lô hàng',

    FOREIGN KEY (receipt_id)        REFERENCES import_receipts(id)  ON DELETE CASCADE,
    FOREIGN KEY (product_id)        REFERENCES products(id),
    FOREIGN KEY (batch_id)          REFERENCES inventory_batches(id) ON DELETE SET NULL,
    FOREIGN KEY (shelf_position_id) REFERENCES shelf_positions(id)   ON DELETE SET NULL,

    INDEX idx_receipt (receipt_id),
    INDEX idx_product (product_id)
) COMMENT = 'Chi tiết phiếu nhập hàng';


-- ============================================================
-- 11. HOÁ ĐƠN BÁN HÀNG (sales_orders)
-- Header của hoá đơn
-- ============================================================

CREATE TABLE sales_orders (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    order_code     VARCHAR(50)   NOT NULL UNIQUE     COMMENT 'Mã hoá đơn (VD: HD20240101001)',
    user_id        INT           NOT NULL             COMMENT 'Nhân viên tạo hoá đơn',
    total_amount   DECIMAL(15,2) NOT NULL DEFAULT 0  COMMENT 'Tổng tiền cần trả',
    cash_received  DECIMAL(15,2) NOT NULL DEFAULT 0  COMMENT 'Tiền khách đưa',
    change_amount  DECIMAL(15,2) NOT NULL DEFAULT 0  COMMENT 'Tiền thừa trả lại (= cash_received - total_amount)',
    payment_method ENUM('TIEN_MAT', 'CHUYEN_KHOAN', 'THE')
                   NOT NULL DEFAULT 'TIEN_MAT'        COMMENT 'Phương thức thanh toán',
    status         ENUM('COMPLETED', 'CANCELLED')
                   NOT NULL DEFAULT 'COMPLETED'        COMMENT 'Trạng thái hoá đơn',
    note           TEXT                                COMMENT 'Ghi chú',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),

    INDEX idx_user       (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status     (status)
) COMMENT = 'Hoá đơn bán hàng';


-- ============================================================
-- 12. CHI TIẾT HOÁ ĐƠN (sales_order_details)
-- Mỗi dòng là một sản phẩm trong hoá đơn
-- Lưu SNAPSHOT tên/giá tại thời điểm bán
-- (để hoá đơn cũ không bị ảnh hưởng khi sửa giá sản phẩm)
-- ============================================================

CREATE TABLE sales_order_details (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    order_id     INT           NOT NULL           COMMENT 'Thuộc hoá đơn nào',
    product_id   INT           NOT NULL           COMMENT 'Sản phẩm',
    product_name VARCHAR(200)  NOT NULL           COMMENT 'SNAPSHOT tên sản phẩm lúc bán',
    barcode      VARCHAR(100)                     COMMENT 'SNAPSHOT mã vạch lúc bán',
    unit_price   DECIMAL(12,2) NOT NULL           COMMENT 'Đơn giá lúc bán',
    quantity     INT           NOT NULL           COMMENT 'Số lượng bán',
    subtotal     DECIMAL(15,2) NOT NULL           COMMENT 'Thành tiền (= unit_price * quantity)',

    FOREIGN KEY (order_id)   REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),

    INDEX idx_order   (order_id),
    INDEX idx_product (product_id)
) COMMENT = 'Chi tiết hoá đơn bán hàng';


-- ============================================================
-- 13. THANH TOÁN (payments)
-- Quan hệ 1-1 với sales_orders
-- ============================================================

CREATE TABLE payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT           NOT NULL UNIQUE      COMMENT 'Hoá đơn (1 hoá đơn - 1 thanh toán)',
    amount          DECIMAL(15,2) NOT NULL              COMMENT 'Số tiền thanh toán',
    method          ENUM('TIEN_MAT', 'CHUYEN_KHOAN', 'THE')
                    NOT NULL DEFAULT 'TIEN_MAT',
    status          ENUM('PENDING', 'COMPLETED', 'REFUNDED')
                    NOT NULL DEFAULT 'COMPLETED',
    transaction_ref VARCHAR(100)                        COMMENT 'Mã giao dịch (chuyển khoản/thẻ)',
    paid_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
) COMMENT = 'Thông tin thanh toán';


-- ============================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================================

-- Tài khoản Admin mặc định
-- Username: admin | Password: Admin@123
-- (hash của 'Admin@123' bằng bcrypt rounds=10)
INSERT INTO users (username, password_hash, full_name, phone, email, role) VALUES
(
    'admin',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password (thay bằng hash thật)
    'Chủ Quán',
    '0901234567',
    'admin@taphoavinh.com',
    'CHU_QUAN'
),
(
    'nhanvien1',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Nguyễn Văn A',
    '0901234568',
    'nva@taphoavinh.com',
    'NHAN_VIEN'
);

-- Danh mục sản phẩm
INSERT INTO categories (name, description) VALUES
('Đồ uống', 'Nước ngọt, nước suối, bia, sữa...'),
('Bánh kẹo', 'Bánh quy, kẹo, snack...'),
('Mì - Cháo ăn liền', 'Mì tôm, cháo ăn liền, phở ăn liền...'),
('Gia vị', 'Muối, đường, nước mắm, dầu ăn...'),
('Vệ sinh cá nhân', 'Dầu gội, sữa tắm, kem đánh răng...'),
('Thực phẩm khô', 'Gạo, bột, ngũ cốc...'),
('Đồ hộp', 'Cá hộp, thịt hộp, đậu hộp...'),
('Đồ gia dụng', 'Pin, bóng đèn, dây điện...'),
('Thuốc lá', 'Các loại thuốc lá...'),
('Khác', 'Các sản phẩm khác');

-- Nhà cung cấp mẫu
INSERT INTO suppliers (name, phone, email, address, contact_person) VALUES
('Công ty CP Coca-Cola Việt Nam', '028-38255678', 'orders@coca-cola.vn', '485 Xa lộ Hà Nội, Q.9, TP.HCM', 'Nguyễn Thị B'),
('Công ty TNHH Masan Consumer', '028-38152060', 'sales@masanconsumer.com', 'Tầng 12, Saigon Centre, Q.1, TP.HCM', 'Trần Văn C'),
('Công ty CP Vinamilk', '028-54155555', 'contact@vinamilk.com.vn', '10 Tân Trào, Q.7, TP.HCM', 'Lê Thị D'),
('Đại lý Hàng tiêu dùng Minh Phát', '0901111222', NULL, '123 Lê Văn Việt, Q.9', 'Anh Minh'),
('Nhà phân phối Thành Công', '0902222333', NULL, '456 Nguyễn Duy Trinh, Q.9', 'Chị Lan');

-- Kệ hàng mẫu
INSERT INTO shelves (name, description) VALUES
('Kệ A', 'Kệ chính giữa cửa hàng — đồ uống và bánh kẹo'),
('Kệ B', 'Kệ gần cửa ra vào — hàng bán chạy'),
('Kệ C', 'Kệ phía trong — gia vị và thực phẩm khô'),
('Tủ Mát', 'Tủ lạnh — đồ uống có ga, sữa tươi'),
('Tủ Đông', 'Tủ đông — kem, thịt đông lạnh');

-- Vị trí trên kệ mẫu (Kệ A có 3 tầng, mỗi tầng 5 vị trí)
INSERT INTO shelf_positions (shelf_id, floor_number, position_number, label) VALUES
(1, 1, '01', 'A-T1-P01'), (1, 1, '02', 'A-T1-P02'), (1, 1, '03', 'A-T1-P03'),
(1, 1, '04', 'A-T1-P04'), (1, 1, '05', 'A-T1-P05'),
(1, 2, '01', 'A-T2-P01'), (1, 2, '02', 'A-T2-P02'), (1, 2, '03', 'A-T2-P03'),
(1, 3, '01', 'A-T3-P01'), (1, 3, '02', 'A-T3-P02'),
(2, 1, '01', 'B-T1-P01'), (2, 1, '02', 'B-T1-P02'), (2, 1, '03', 'B-T1-P03'),
(2, 2, '01', 'B-T2-P01'), (2, 2, '02', 'B-T2-P02'),
(3, 1, '01', 'C-T1-P01'), (3, 1, '02', 'C-T1-P02'),
(4, 1, '01', 'TM-P01'), (4, 1, '02', 'TM-P02'), (4, 1, '03', 'TM-P03'),
(5, 1, '01', 'TD-P01'), (5, 1, '02', 'TD-P02');

-- Sản phẩm mẫu
INSERT INTO products
    (product_code, barcode, name, category_id, supplier_id, unit, import_price, selling_price,
     stock_quantity, min_stock_level, shelf_position_id, description)
VALUES
('SP001', '8934588012345', 'Coca-Cola lon 330ml',     1, 1, 'lon',   6000,  8000,  48, 12, 18, 'Nước ngọt có ga Coca-Cola'),
('SP002', '8934588012346', 'Pepsi lon 330ml',          1, 1, 'lon',   5500,  7500,  36, 12, 19, 'Nước ngọt có ga Pepsi'),
('SP003', '8934673012347', 'Mì Hảo Hảo tôm chua cay', 3, 2, 'gói',  3200,  5000,  60, 20, 11, 'Mì ăn liền Acecook Hảo Hảo'),
('SP004', '8934673012348', 'Mì 3 Miền bò hầm',        3, 2, 'gói',  2800,  4500,  45, 20, 12, 'Mì ăn liền 3 Miền'),
('SP005', '8934822012349', 'Sữa Vinamilk tươi 1L',    1, 3, 'hộp',  22000, 28000,  24,  6, 20, 'Sữa tươi tiệt trùng Vinamilk'),
('SP006', '8936150123456', 'Bánh Oreo kem vani 137g',  2, 4, 'gói',  15000, 22000,  30, 10, 7,  'Bánh quy kẹp kem Oreo'),
('SP007', '8936150123457', 'Snack Poca vị phô mai',    2, 4, 'gói',  8000,  12000,  40, 15, 8,  'Snack khoai tây Poca'),
('SP008', '8935024012340', 'Nước mắm Nam Ngư 500ml',  4, 2, 'chai', 18000, 25000,  20,  5, 16, 'Nước mắm Nam Ngư đệ nhị'),
('SP009', '8936077012341', 'Dầu ăn Tường An 1L',      4, 4, 'chai', 35000, 45000,  15,  5, 17, 'Dầu thực vật Tường An'),
('SP010', '8938792012342', 'Dầu gội Clear men 380ml', 5, 5, 'chai', 55000, 75000,  18,  6, 13, 'Dầu gội sạch gàu Clear');

-- Lô hàng mẫu (tương ứng với sản phẩm trên)
INSERT INTO inventory_batches
    (product_id, supplier_id, shelf_position_id, quantity, original_quantity,
     import_price, import_date, expiry_date, status)
VALUES
(1, 1, 18, 48, 48, 6000,  '2024-01-10', '2025-06-30', 'ACTIVE'),
(2, 1, 19, 36, 36, 5500,  '2024-01-10', '2025-06-30', 'ACTIVE'),
(3, 2, 11, 60, 60, 3200,  '2024-01-05', '2025-12-31', 'ACTIVE'),
(4, 2, 12, 45, 45, 2800,  '2024-01-05', '2025-12-31', 'ACTIVE'),
(5, 3, 20, 24, 24, 22000, '2024-01-12', '2024-04-12', 'ACTIVE'),
(6, 4, 7,  30, 30, 15000, '2024-01-08', '2025-08-15', 'ACTIVE'),
(7, 4, 8,  40, 40, 8000,  '2024-01-08', '2025-05-01', 'ACTIVE'),
(8, 2, 16, 20, 20, 18000, '2024-01-03', '2026-01-03', 'ACTIVE'),
(9, 4, 17, 15, 15, 35000, '2024-01-03', '2026-06-30', 'ACTIVE'),
(10, 5, 13, 18, 18, 55000, '2024-01-15', '2025-11-30', 'ACTIVE');


-- ============================================================
-- STORED PROCEDURE: Tạo mã hoá đơn tự động
-- Format: HD + YYYYMMDD + 4 chữ số (VD: HD202401010001)
-- ============================================================

DELIMITER $$

CREATE PROCEDURE generate_order_code(OUT new_code VARCHAR(50))
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE today_count INT;

    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');

    SELECT COUNT(*) INTO today_count
    FROM sales_orders
    WHERE DATE(created_at) = CURDATE();

    SET new_code = CONCAT('HD', today_str, LPAD(today_count + 1, 4, '0'));
END$$


-- ============================================================
-- STORED PROCEDURE: Tạo mã phiếu nhập tự động
-- Format: PN + YYYYMMDD + 4 chữ số (VD: PN202401010001)
-- ============================================================

CREATE PROCEDURE generate_receipt_code(OUT new_code VARCHAR(50))
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE today_count INT;

    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');

    SELECT COUNT(*) INTO today_count
    FROM import_receipts
    WHERE DATE(created_at) = CURDATE();

    SET new_code = CONCAT('PN', today_str, LPAD(today_count + 1, 4, '0'));
END$$

DELIMITER ;


-- ============================================================
-- VIEW: Xem tồn kho tổng hợp (kết hợp product + batch info)
-- ============================================================

CREATE VIEW v_inventory_overview AS
SELECT
    p.id              AS product_id,
    p.product_code,
    p.barcode,
    p.name            AS product_name,
    c.name            AS category_name,
    p.unit,
    p.selling_price,
    p.stock_quantity,
    p.min_stock_level,
    CASE
        WHEN p.stock_quantity = 0              THEN 'HET_HANG'
        WHEN p.stock_quantity <= p.min_stock_level THEN 'SAP_HET'
        ELSE 'CON_HANG'
    END               AS stock_status,
    s.name            AS shelf_name,
    sp.floor_number,
    sp.position_number,
    sp.label          AS shelf_label
FROM products p
LEFT JOIN categories     c  ON p.category_id       = c.id
LEFT JOIN shelf_positions sp ON p.shelf_position_id = sp.id
LEFT JOIN shelves         s  ON sp.shelf_id         = s.id
WHERE p.status = 'ACTIVE';


-- ============================================================
-- VIEW: Sản phẩm sắp hết hạn / đã hết hạn
-- ============================================================

CREATE VIEW v_expiry_status AS
SELECT
    ib.id             AS batch_id,
    p.id              AS product_id,
    p.name            AS product_name,
    p.barcode,
    p.unit,
    ib.batch_code,
    ib.quantity,
    ib.expiry_date,
    DATEDIFF(ib.expiry_date, CURDATE()) AS days_remaining,
    CASE
        WHEN ib.expiry_date < CURDATE()                        THEN 'DA_HET_HAN'
        WHEN DATEDIFF(ib.expiry_date, CURDATE()) <= 7          THEN 'CON_7_NGAY'
        WHEN DATEDIFF(ib.expiry_date, CURDATE()) <= 30         THEN 'CON_30_NGAY'
        WHEN DATEDIFF(ib.expiry_date, CURDATE()) <= 60         THEN 'CON_60_NGAY'
        ELSE 'CON_HANG'
    END               AS expiry_status,
    s.name            AS shelf_name,
    sp.label          AS shelf_label
FROM inventory_batches ib
JOIN products       p  ON ib.product_id        = p.id
LEFT JOIN shelf_positions sp ON ib.shelf_position_id = sp.id
LEFT JOIN shelves         s  ON sp.shelf_id         = s.id
WHERE ib.status = 'ACTIVE'
  AND ib.expiry_date IS NOT NULL
ORDER BY ib.expiry_date ASC;


-- ============================================================
-- VIEW: Doanh thu theo ngày
-- ============================================================

CREATE VIEW v_daily_revenue AS
SELECT
    DATE(created_at)         AS sale_date,
    COUNT(*)                 AS total_orders,
    SUM(total_amount)        AS total_revenue,
    SUM(
        SELECT SUM(quantity)
        FROM sales_order_details sod
        WHERE sod.order_id = so.id
    )                        AS total_items_sold
FROM sales_orders so
WHERE status = 'COMPLETED'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;


-- ============================================================
-- INDEX bổ sung cho tối ưu truy vấn thống kê
-- ============================================================

ALTER TABLE sales_orders
    ADD INDEX idx_created_date (created_at),
    ADD INDEX idx_status_date  (status, created_at);

ALTER TABLE inventory_batches
    ADD INDEX idx_expiry_status (expiry_date, status);
