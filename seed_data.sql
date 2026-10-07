-- ============================================================
-- SEED DATA - He Thong Quan Ly Tap Hoa Ban Le
-- Chay lenh nay de nap du lieu mau vao database
-- Password tat ca tai khoan: password
-- ============================================================

USE quan_ly_tap_hoa;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE sales_order_details;
TRUNCATE TABLE sales_orders;
TRUNCATE TABLE import_receipt_details;
TRUNCATE TABLE import_receipts;
TRUNCATE TABLE inventory_batches;
TRUNCATE TABLE product_images;
TRUNCATE TABLE products;
TRUNCATE TABLE shelf_positions;
TRUNCATE TABLE shelves;
TRUNCATE TABLE suppliers;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- USERS (password: password)
INSERT INTO users (username,password_hash,full_name,phone,email,role) VALUES
('admin',    '$2a$10$mZUxvOORoQa7ipwkqq5HpuVAViCMA.6xkItcHaaOXET6dLuWxFuJm','Quan Tri Vien',    '0901234567','admin@taphoavinh.com',   'ADMIN'),
('manager1', '$2a$10$mZUxvOORoQa7ipwkqq5HpuVAViCMA.6xkItcHaaOXET6dLuWxFuJm','Nguyen Thi Lan',   '0901234568','manager@taphoavinh.com', 'MANAGER'),
('cashier1', '$2a$10$mZUxvOORoQa7ipwkqq5HpuVAViCMA.6xkItcHaaOXET6dLuWxFuJm','Tran Van Nam',     '0901234569','cashier@taphoavinh.com', 'CASHIER'),
('cashier2', '$2a$10$mZUxvOORoQa7ipwkqq5HpuVAViCMA.6xkItcHaaOXET6dLuWxFuJm','Le Thi Hoa',       '0901234570','cashier2@taphoavinh.com','CASHIER'),
('customer1','$2a$10$mZUxvOORoQa7ipwkqq5HpuVAViCMA.6xkItcHaaOXET6dLuWxFuJm','Nguyen Van An',    '0909111111','khach1@gmail.com',        'CUSTOMER'),
('customer2','$2a$10$mZUxvOORoQa7ipwkqq5HpuVAViCMA.6xkItcHaaOXET6dLuWxFuJm','Tran Thi Bich',    '0909222222','khach2@gmail.com',        'CUSTOMER'),
('customer3','$2a$10$mZUxvOORoQa7ipwkqq5HpuVAViCMA.6xkItcHaaOXET6dLuWxFuJm','Pham Minh Tuan',   '0909333333','khach3@gmail.com',        'CUSTOMER');

-- CATEGORIES
INSERT INTO categories (name,description) VALUES
('Do uong',          'Nuoc ngot, nuoc suoi, bia, sua, nuoc ep...'),
('Banh keo',         'Banh quy, keo, snack, chocolate, banh mi...'),
('Mi - Chao an lien','Mi tom, chao an lien, pho an lien, hu tieu...'),
('Gia vi - Dau an',  'Muoi, duong, nuoc mam, dau an, tuong ot...'),
('Ve sinh ca nhan',  'Dau goi, sua tam, kem danh rang, xa phong...'),
('Thuc pham kho',    'Gao, bot mi, ngu coc, dau kho, hat...'),
('Do hop',           'Ca hop, thit hop, pate, sua dac...'),
('Sua & Che pham',   'Sua tuoi, sua bot, sua chua, pho mai...'),
('Giat giu-Tay rua', 'Nuoc giat, nuoc xa, bot giat, nuoc rua chen...'),
('Do gia dung',      'Pin, bong den, tui nilon, giay ve sinh...');

-- SUPPLIERS
INSERT INTO suppliers (name,phone,email,address,contact_person,is_active) VALUES
('Cong ty CP Coca-Cola Viet Nam',  '028-38255678','orders@coca-cola.vn',      '485 Xa lo Ha Noi, Q.9, TP.HCM',       'Nguyen Thi Bich', TRUE),
('Cong ty TNHH Masan Consumer',    '028-38152060','sales@masanconsumer.com',  'Tang 12, Saigon Centre, Q.1, TP.HCM', 'Tran Van Cuong',  TRUE),
('Cong ty CP Vinamilk',            '028-54155555','contact@vinamilk.com.vn',  '10 Tan Trao, Q.7, TP.HCM',            'Le Thi Dieu',     TRUE),
('Cong ty TNHH Unilever Viet Nam', '028-38254555','contact@unilever.com.vn',  'Khu CX Binh Thoi, Q.11, TP.HCM',     'Pham Van Duc',    TRUE),
('Dai ly Minh Phat',               '0901111222',  'minhphat@gmail.com',        '123 Le Van Viet, Q.9, TP.HCM',        'Anh Minh',        TRUE),
('Nha phan phoi Thanh Cong',       '0902222333',  'thanhcong@gmail.com',        '456 Nguyen Duy Trinh, Q.9, TP.HCM',  'Chi Lan',         TRUE),
('Cong ty CP Acecook Viet Nam',    '028-37620800','info@acecook.com.vn',       'KCN Tan Binh, TP.HCM',                'Nguyen Hai Nam',  TRUE);

-- SHELVES
INSERT INTO shelves (name,description) VALUES
('Ke A',   'Ke chinh giua cua hang - do uong va banh keo'),
('Ke B',   'Ke gan cua ra vao - hang ban chay, mi an lien'),
('Ke C',   'Ke phia trong - gia vi va thuc pham kho'),
('Ke D',   'Ke goc trai - do hop, ve sinh ca nhan'),
('Tu Mat', 'Tu lanh - do uong co ga, sua tuoi, sua chua'),
('Tu Dong','Tu dong - kem, thuc pham dong lanh');

-- SHELF POSITIONS
INSERT INTO shelf_positions (shelf_id,floor_number,position_number,label) VALUES
(1,1,'01','A-T1-01'),(1,1,'02','A-T1-02'),(1,1,'03','A-T1-03'),(1,1,'04','A-T1-04'),
(1,2,'01','A-T2-01'),(1,2,'02','A-T2-02'),(1,2,'03','A-T2-03'),
(1,3,'01','A-T3-01'),(1,3,'02','A-T3-02'),
(2,1,'01','B-T1-01'),(2,1,'02','B-T1-02'),(2,1,'03','B-T1-03'),
(2,2,'01','B-T2-01'),(2,2,'02','B-T2-02'),
(2,3,'01','B-T3-01'),
(3,1,'01','C-T1-01'),(3,1,'02','C-T1-02'),(3,1,'03','C-T1-03'),
(3,2,'01','C-T2-01'),(3,2,'02','C-T2-02'),
(4,1,'01','D-T1-01'),(4,1,'02','D-T1-02'),
(4,2,'01','D-T2-01'),(4,2,'02','D-T2-02'),
(5,1,'01','TM-01'),(5,1,'02','TM-02'),(5,1,'03','TM-03'),
(6,1,'01','TD-01'),(6,1,'02','TD-02');

-- PRODUCTS (30 products)
-- shelf_position IDs: A:1-9 | B:10-15 | C:16-20 | D:21-24 | TuMat:25-27 | TuDong:28-29
INSERT INTO products (product_code,barcode,name,category_id,supplier_id,unit,import_price,selling_price,stock_quantity,min_stock_level,shelf_position_id,description) VALUES
('SP001','8934588012301','Coca-Cola lon 330ml',           1,1,'lon',    6000,  9000, 60,12,25,'Nuoc ngot co ga Coca-Cola lon 330ml'),
('SP002','8934588012302','Pepsi lon 330ml',               1,1,'lon',    5500,  8000, 48,12,26,'Nuoc ngot co ga Pepsi lon 330ml'),
('SP003','8934588012303','Sprite lon 330ml',              1,1,'lon',    5500,  8000, 36,10,25,'Nuoc ngot co ga Sprite chanh'),
('SP004','8934713012304','Nuoc suoi Aquafina 500ml',      1,5,'chai',   2500,  5000, 72,24,26,'Nuoc tinh khiet Aquafina 500ml'),
('SP005','8934713012305','Bia Tiger lon 330ml',           1,5,'lon',   13000, 18000, 48,12,27,'Bia Tiger nap vang 330ml'),
('SP006','8934580012306','Nuoc ep cam Tropicana 1L',      1,5,'hop',   22000, 30000, 20, 6,27,'Nuoc ep cam 100% khong duong 1 lit'),
('SP007','8936150012307','Banh Oreo kem vani 137g',       2,5,'goi',   15000, 22000, 40,10, 5,'Banh quy kep kem Oreo vi vani'),
('SP008','8936150012308','Snack Poca khoai tay pho mai',  2,5,'goi',    8000, 12000, 50,15, 6,'Snack khoai tay chien vi pho mai'),
('SP009','8936150012309','Keo Alpenliebe dau 100g',       2,5,'goi',   12000, 18000, 35,10, 7,'Keo mem dau tay Alpenliebe 100g'),
('SP010','8936244012310','Banh mi tuoi SkyBread 200g',    2,6,'goi',   14000, 20000,  3, 8, 5,'Banh mi tuoi dong goi - SAP HET HANG'),
('SP011','8934673012311','Mi Hao Hao tom chua cay',       3,7,'goi',    3200,  5000, 80,20,10,'Mi an lien Acecook Hao Hao vi tom chua cay'),
('SP012','8934673012312','Mi 3 Mien bo ham',              3,7,'goi',    2800,  4500, 60,20,11,'Mi an lien 3 Mien vi bo ham'),
('SP013','8934673012313','Chao an lien Congee ga',        3,7,'goi',    5500,  8000, 30,10,12,'Chao an lien vi ga xe phay'),
('SP014','8934673012314','Pho an lien Vifon bo',          3,7,'goi',    6000,  9000,  4,10,13,'Pho bo an lien Vifon - SAP HET'),
('SP015','8935024012315','Nuoc mam Nam Ngu 500ml',        4,2,'chai',  18000, 25000, 24, 5,16,'Nuoc mam Nam Ngu de nhi 500ml'),
('SP016','8936077012316','Dau an Tuong An 1L',            4,5,'chai',  35000, 45000, 18, 5,17,'Dau thuc vat Tuong An 1 lit'),
('SP017','8935024012317','Tuong ot Chinsu 250g',           4,2,'chai',  12000, 18000, 30, 8,16,'Tuong ot Chinsu cay vua 250g'),
('SP018','8935024012318','Bot ngot Ajinomoto 400g',        4,5,'goi',   22000, 30000,  0,10,17,'Bot ngot Ajinomoto 400g - HET HANG'),
('SP019','8938792012319','Dau goi Clear men 380ml',        5,4,'chai',  55000, 75000, 20, 6,21,'Dau goi sach gau Clear for men'),
('SP020','8938792012320','Sua tam Lifebuoy 480ml',         5,4,'chai',  48000, 65000, 15, 6,22,'Sua tam khang khuan Lifebuoy 480ml'),
('SP021','8938792012321','Kem danh rang P/S 230g',         5,4,'tuyp',  25000, 35000, 25, 8,21,'Kem danh rang bao ve 12 gio P/S'),
('SP022','8936244012322','Gao ST25 tui 5kg',               6,6,'tui',  120000,150000,  8, 3,18,'Gao ngon nhat the gioi ST25 5kg'),
('SP023','8936244012323','Dau xanh ca vo 500g',            6,6,'goi',   20000, 28000, 10, 5,19,'Dau xanh ca kho 500g'),
('SP024','8934580012324','Ca thu hop Ba Co Gai 185g',      7,6,'hop',   22000, 30000, 20, 6,23,'Ca thu sot ca hop Ba Co Gai 185g'),
('SP025','8934580012325','Sua dac Ong Tho 380g',           7,3,'hop',   18000, 25000, 30, 8,24,'Sua dac co duong Ong Tho 380g'),
('SP026','8934822012326','Sua Vinamilk tuoi khong duong 1L',8,3,'hop',  22000, 30000, 24, 6,25,'Sua tuoi tiet trung Vinamilk 1 lit'),
('SP027','8934822012327','Sua chua Vinamilk nha dam 100g', 8,3,'hop',    6000,  9000, 36, 8,26,'Sua chua uong Vinamilk nha dam'),
('SP028','8934822012328','Sua bot Ensure Gold 400g',        8,6,'hop',  380000,420000,  5, 2,27,'Sua bot dinh duong Ensure Gold 400g'),
('SP029','8934873012329','Nuoc giat Omo 2.9kg',             9,4,'tui',   90000,120000, 10, 4,23,'Nuoc giat tay manh Omo tui 2.9kg'),
('SP030','8934873012330','Nuoc rua chen Sunlight 750ml',    9,4,'chai',  28000, 38000, 18, 6,24,'Nuoc rua chen sieu sach Sunlight 750ml');

-- INVENTORY BATCHES
-- Lo ACTIVE binh thuong, lo CAN HAN (<30 ngay), lo EXPIRED, lo DEPLETED
INSERT INTO inventory_batches (product_id,supplier_id,shelf_position_id,batch_code,quantity,original_quantity,import_price,import_date,expiry_date,status) VALUES
-- Lo ACTIVE binh thuong
(1, 1,25,'LOT-CC-24-01', 60,120,  6000,'2024-10-01','2026-12-31','ACTIVE'),
(2, 1,26,'LOT-PP-24-01', 48, 96,  5500,'2024-10-01','2026-12-31','ACTIVE'),
(3, 1,25,'LOT-SP-24-01', 36, 72,  5500,'2024-10-01','2026-12-31','ACTIVE'),
(4, 5,26,'LOT-AQ-24-01', 72,144,  2500,'2024-09-15','2027-09-15','ACTIVE'),
(5, 5,27,'LOT-TG-24-01', 48, 48, 13000,'2024-10-01','2027-10-01','ACTIVE'),
(7, 5, 5,'LOT-OR-24-01', 40, 80, 15000,'2024-09-01','2026-08-01','ACTIVE'),
(8, 5, 6,'LOT-PC-24-01', 50,100,  8000,'2024-09-01','2027-05-01','ACTIVE'),
(9, 5, 7,'LOT-AL-24-01', 35, 60, 12000,'2024-09-10','2026-12-31','ACTIVE'),
(11,7,10,'LOT-HH-24-01', 80,200,  3200,'2024-09-20','2026-12-31','ACTIVE'),
(12,7,11,'LOT-3M-24-01', 60,150,  2800,'2024-09-20','2026-12-31','ACTIVE'),
(13,7,12,'LOT-CG-24-01', 30, 60,  5500,'2024-09-15','2026-09-15','ACTIVE'),
(15,2,16,'LOT-NM-24-01', 24, 48, 18000,'2024-08-01','2027-08-01','ACTIVE'),
(16,5,17,'LOT-DA-24-01', 18, 36, 35000,'2024-08-15','2027-08-15','ACTIVE'),
(17,2,16,'LOT-TC-24-01', 30, 60, 12000,'2024-09-01','2026-09-01','ACTIVE'),
(19,4,21,'LOT-CL-24-01', 20, 36, 55000,'2024-10-01','2026-10-01','ACTIVE'),
(20,4,22,'LOT-SL-24-01', 15, 24, 48000,'2024-10-01','2026-10-01','ACTIVE'),
(21,4,21,'LOT-KR-24-01', 25, 48, 25000,'2024-09-01','2026-09-01','ACTIVE'),
(22,6,18,'LOT-GT-24-01',  8, 20,120000,'2024-10-01','2026-10-01','ACTIVE'),
(24,6,23,'LOT-CA-24-01', 20, 40, 22000,'2024-08-01','2027-01-01','ACTIVE'),
(25,3,24,'LOT-OT-24-01', 30, 60, 18000,'2024-09-01','2028-09-01','ACTIVE'),
(26,3,25,'LOT-VM-24-01', 24, 48, 22000,'2024-10-01','2025-04-01','ACTIVE'),
(27,3,26,'LOT-YG-24-01', 36, 72,  6000,'2024-10-01','2026-04-01','ACTIVE'),
(29,4,23,'LOT-OM-24-01', 10, 20, 90000,'2024-09-15','2027-09-15','ACTIVE'),
(30,4,24,'LOT-SN-24-01', 18, 36, 28000,'2024-09-15','2027-09-15','ACTIVE'),
-- Lo CAN HAN (< 30 ngay, HSD <= 2026-11-06)
(6, 5,27,'LOT-TP-NEAR', 20, 30, 22000,'2024-06-01','2026-10-20','ACTIVE'),
(10,6, 5,'LOT-SB-NEAR',  3, 20, 14000,'2024-09-01','2026-10-15','ACTIVE'),
(14,7,13,'LOT-PV-NEAR',  4, 30,  6000,'2024-09-01','2026-10-25','ACTIVE'),
(23,6,19,'LOT-DX-NEAR', 10, 20, 20000,'2024-06-01','2026-10-30','ACTIVE'),
(28,6,27,'LOT-EN-NEAR',  5, 10,380000,'2024-03-01','2026-11-01','ACTIVE'),
-- Lo HET HAN (EXPIRED)
(5, 5,27,'LOT-TG-EXP',  0, 48, 12000,'2023-01-01','2024-01-01','EXPIRED'),
(26,3,25,'LOT-VM-EXP',  2, 48, 20000,'2022-06-01','2023-06-01','EXPIRED'),
(27,3,26,'LOT-YG-EXP',  1, 72,  5500,'2023-09-01','2024-03-01','EXPIRED'),
-- Lo HET HANG (DEPLETED)
(18,5,17,'LOT-BN-DEPL', 0, 40, 22000,'2024-01-01','2026-12-31','DEPLETED'),
(1, 1,25,'LOT-CC-DEPL', 0, 60,  5500,'2023-06-01','2025-06-01','DEPLETED'),
(11,7,10,'LOT-HH-DEPL', 0,100,  3000,'2023-07-01','2025-07-01','DEPLETED');

-- IMPORT RECEIPTS (5 phieu nhap)
INSERT INTO import_receipts (receipt_code,supplier_id,user_id,import_date,total_amount,note) VALUES
('PN20240901001',1,2,'2024-09-01',2640000,'Nhap do uong Coca-Cola thang 9'),
('PN20240910001',7,2,'2024-09-10',1680000,'Nhap mi an lien Acecook thang 9'),
('PN20241001001',3,1,'2024-10-01',2400000,'Nhap sua Vinamilk thang 10'),
('PN20241005001',4,2,'2024-10-05',3270000,'Nhap do dung ca nhan Unilever'),
('PN20241010001',5,1,'2024-10-10',1380000,'Nhap hang tap hoa tong hop');

INSERT INTO import_receipt_details (receipt_id,product_id,batch_id,quantity,import_price,expiry_date,shelf_position_id) VALUES
(1,1, 1,120, 6000,'2026-12-31',25),
(1,2, 2, 96, 5500,'2026-12-31',26),
(1,3, 3, 72, 5500,'2026-12-31',25),
(2,11, 9,200, 3200,'2026-12-31',10),
(2,12,10,150, 2800,'2026-12-31',11),
(2,13,11, 60, 5500,'2026-09-15',12),
(3,26,21, 48,22000,'2025-04-01',25),
(3,27,22, 72, 6000,'2026-04-01',26),
(3,25,20, 60,18000,'2028-09-01',24),
(4,19,15, 36,55000,'2026-10-01',21),
(4,20,16, 24,48000,'2026-10-01',22),
(4,21,17, 48,25000,'2026-09-01',21),
(5,15,12, 48,18000,'2027-08-01',16),
(5,17,14, 60,12000,'2026-09-01',16);

-- SALES ORDERS (15 hoa don ban hang mau)
INSERT INTO sales_orders (order_code,user_id,total_amount,cash_received,change_amount,payment_method,status,note,created_at) VALUES
('HD202409200001',3, 41000, 50000,  9000,'TIEN_MAT',    'COMPLETED','','2026-09-20 08:30:00'),
('HD202409200002',3, 54000, 60000,  6000,'TIEN_MAT',    'COMPLETED','','2026-09-20 09:15:00'),
('HD202409210001',4, 76500, 80000,  3500,'TIEN_MAT',    'COMPLETED','','2026-09-21 10:00:00'),
('HD202409210002',3, 30000, 30000,     0,'CHUYEN_KHOAN','COMPLETED','','2026-09-21 14:20:00'),
('HD202409220001',4,125000,150000, 25000,'TIEN_MAT',    'COMPLETED','','2026-09-22 08:00:00'),
('HD202409250001',3, 59000,100000, 41000,'TIEN_MAT',    'COMPLETED','','2026-09-25 11:30:00'),
('HD202409280001',4, 93000,100000,  7000,'THE',         'COMPLETED','','2026-09-28 16:00:00'),
('HD202410010001',3,142000,150000,  8000,'TIEN_MAT',    'COMPLETED','','2026-10-01 09:00:00'),
('HD202410010002',4, 68000, 70000,  2000,'TIEN_MAT',    'COMPLETED','','2026-10-01 13:45:00'),
('HD202410020001',3,215000,220000,  5000,'CHUYEN_KHOAN','COMPLETED','','2026-10-02 10:10:00'),
('HD202410030001',4, 47000, 50000,  3000,'TIEN_MAT',    'COMPLETED','','2026-10-03 08:30:00'),
('HD202410050001',3, 83000,100000, 17000,'TIEN_MAT',    'COMPLETED','','2026-10-05 11:00:00'),
('HD202410060001',4,162000,200000, 38000,'TIEN_MAT',    'COMPLETED','','2026-10-06 14:30:00'),
('HD202410070001',3, 54000, 60000,  6000,'THE',         'COMPLETED','','2026-10-07 08:15:00'),
('HD202410070002',4, 37000, 40000,  3000,'TIEN_MAT',    'COMPLETED','','2026-10-07 09:30:00');

-- SALES ORDER DETAILS
INSERT INTO sales_order_details (order_id,product_id,product_name,barcode,unit_price,quantity,subtotal) VALUES
(1,11,'Mi Hao Hao tom chua cay','8934673012311',5000,3,15000),
(1, 1,'Coca-Cola lon 330ml',    '8934588012301',9000,2,18000),
(1,17,'Tuong ot Chinsu 250g',   '8935024012317',8000,1, 8000),
(2, 7,'Banh Oreo kem vani 137g','8936150012307',22000,1,22000),
(2, 8,'Snack Poca khoai tay',   '8936150012308',12000,2,24000),
(2, 4,'Nuoc suoi Aquafina 500ml','8934713012304',5000,2, 8000),
(3, 4,'Nuoc suoi Aquafina 500ml','8934713012304',5000,5,25000),
(3,11,'Mi Hao Hao tom chua cay','8934673012311',5000,5,25000),
(3,26,'Sua Vinamilk tuoi 1L',   '8934822012326',30000,1,30000),
(4, 5,'Bia Tiger lon 330ml',    '8934713012305',18000,1,18000),
(4, 4,'Nuoc suoi Aquafina 500ml','8934713012304',5000,2,10000),
(4,17,'Tuong ot Chinsu 250g',   '8935024012317',18000,0, 2000),
(5, 1,'Coca-Cola lon 330ml',    '8934588012301',9000,5,45000),
(5, 2,'Pepsi lon 330ml',        '8934588012302',8000,5,40000),
(5,11,'Mi Hao Hao tom chua cay','8934673012311',5000,8,40000),
(6,19,'Dau goi Clear men 380ml','8938792012319',75000,1,75000),
(6, 9,'Keo Alpenliebe dau 100g','8936150012309',18000,0,-16000),
(7,26,'Sua Vinamilk tuoi 1L',   '8934822012326',30000,2,60000),
(7,27,'Sua chua Vinamilk 100g', '8934822012327',9000,3,27000),
(7, 4,'Nuoc suoi Aquafina 500ml','8934713012304',5000,1,5000),
(8,22,'Gao ST25 tui 5kg',       '8936244012322',150000,1,150000),
(8,15,'Nuoc mam Nam Ngu 500ml', '8935024012315',25000,1,25000),
(8,29,'Nuoc giat Omo 2.9kg',    '8934873012329',120000,1,120000),
(9, 7,'Banh Oreo kem vani 137g','8936150012307',22000,2,44000),
(9, 9,'Keo Alpenliebe dau 100g','8936150012309',18000,1,18000),
(9, 4,'Nuoc suoi Aquafina 500ml','8934713012304',5000,1,5000),
(10,24,'Ca thu hop Ba Co Gai',  '8934580012324',30000,3,90000),
(10,25,'Sua dac Ong Tho 380g',  '8934580012325',25000,3,75000),
(10,16,'Dau an Tuong An 1L',    '8936077012316',45000,1,45000),
(11,11,'Mi Hao Hao tom chua cay','8934673012311',5000,5,25000),
(11,12,'Mi 3 Mien bo ham',      '8934673012312',4500,4,18000),
(11,17,'Tuong ot Chinsu 250g',  '8935024012317',18000,1,18000),
(12,19,'Dau goi Clear men 380ml','8938792012319',75000,1,75000),
(12,21,'Kem danh rang P/S 230g','8938792012321',35000,1,35000),
(12,30,'Nuoc rua chen Sunlight','8934873012330',38000,0,-27000),
(13,26,'Sua Vinamilk tuoi 1L',  '8934822012326',30000,2,60000),
(13,22,'Gao ST25 tui 5kg',      '8936244012322',150000,1,150000),
(13,25,'Sua dac Ong Tho 380g',  '8934580012325',25000,2,50000),
(14, 1,'Coca-Cola lon 330ml',   '8934588012301',9000,3,27000),
(14, 8,'Snack Poca khoai tay',  '8936150012308',12000,2,24000),
(14,17,'Tuong ot Chinsu 250g',  '8935024012317',18000,0, 3000),
(15, 5,'Bia Tiger lon 330ml',   '8934713012305',18000,2,36000),
(15, 4,'Nuoc suoi Aquafina 500ml','8934713012304',5000,1,5000),
(15,11,'Mi Hao Hao tom chua cay','8934673012311',5000,0,-4000);

-- PAYMENTS
INSERT INTO payments (order_id,amount,method,status,paid_at) VALUES
(1,  41000,'TIEN_MAT',    'COMPLETED','2024-09-20 08:30:00'),
(2,  54000,'TIEN_MAT',    'COMPLETED','2024-09-20 09:15:00'),
(3,  76500,'TIEN_MAT',    'COMPLETED','2024-09-21 10:00:00'),
(4,  30000,'CHUYEN_KHOAN','COMPLETED','2024-09-21 14:20:00'),
(5, 125000,'TIEN_MAT',    'COMPLETED','2024-09-22 08:00:00'),
(6,  59000,'TIEN_MAT',    'COMPLETED','2024-09-25 11:30:00'),
(7,  93000,'THE',         'COMPLETED','2024-09-28 16:00:00'),
(8, 142000,'TIEN_MAT',    'COMPLETED','2024-10-01 09:00:00'),
(9,  68000,'TIEN_MAT',    'COMPLETED','2024-10-01 13:45:00'),
(10,215000,'CHUYEN_KHOAN','COMPLETED','2024-10-02 10:10:00'),
(11, 47000,'TIEN_MAT',    'COMPLETED','2024-10-03 08:30:00'),
(12, 83000,'TIEN_MAT',    'COMPLETED','2024-10-05 11:00:00'),
(13,162000,'TIEN_MAT',    'COMPLETED','2024-10-06 14:30:00'),
(14, 54000,'THE',         'COMPLETED','2024-10-07 08:15:00'),
(15, 37000,'TIEN_MAT',    'COMPLETED','2024-10-07 09:30:00');

-- KIEM TRA
SELECT CONCAT('Users: ',       COUNT(*)) AS ket_qua FROM users
UNION ALL SELECT CONCAT('Categories: ',  COUNT(*)) FROM categories
UNION ALL SELECT CONCAT('Suppliers: ',   COUNT(*)) FROM suppliers
UNION ALL SELECT CONCAT('Products: ',    COUNT(*)) FROM products
UNION ALL SELECT CONCAT('Batches: ',     COUNT(*)) FROM inventory_batches
UNION ALL SELECT CONCAT('SalesOrders: ', COUNT(*)) FROM sales_orders
UNION ALL SELECT CONCAT('Batches CAN HAN (<30 ngay): ', COUNT(*)) FROM inventory_batches WHERE status='ACTIVE' AND expiry_date IS NOT NULL AND DATEDIFF(expiry_date,CURDATE()) <= 30
UNION ALL SELECT CONCAT('Batches HET HAN (EXPIRED): ',  COUNT(*)) FROM inventory_batches WHERE status='EXPIRED'
UNION ALL SELECT CONCAT('SP het hang (stock=0): ',       COUNT(*)) FROM products WHERE stock_quantity = 0;
