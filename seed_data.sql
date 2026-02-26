-- ============================================================
-- SIDAK Kantor Layanan - Seed Data Aspek & Sub Aspek
-- Jalankan query ini di SQL Editor Supabase
-- ============================================================

-- Bersihkan data lama jika ingin reset (OPSIONAL - Hati-hati!)
-- TRUNCATE aspek RESTART IDENTITY CASCADE;

-- Menggunakan CTE (Common Table Expression) untuk menyisipkan data secara hierarkis
WITH 
ins_aspek1 AS (
  INSERT INTO aspek (nama_aspek, bobot_aspek) 
  VALUES ('SDM & KEDISIPLINAN', 30) 
  RETURNING id
),
ins_aspek2 AS (
  INSERT INTO aspek (nama_aspek, bobot_aspek) 
  VALUES ('INFRASTRUKTUR & TATA GRAHA', 40) 
  RETURNING id
),
ins_aspek3 AS (
  INSERT INTO aspek (nama_aspek, bobot_aspek) 
  VALUES ('STANDAR LAYANAN', 30) 
  RETURNING id
)

-- Insert Sub Aspek untuk Aspek 1
INSERT INTO sub_aspek (aspek_id, nama_sub_aspek, bobot_sub_aspek)
SELECT id, 'Kehadiran Pegawai Tepat Waktu', 10 FROM ins_aspek1
UNION ALL
SELECT id, 'Seragam & Atribut Lengkap', 10 FROM ins_aspek1
UNION ALL
SELECT id, 'Sikap 5S (Salam, Sapa, Senyum, Sopan, Santun)', 10 FROM ins_aspek1

UNION ALL

-- Insert Sub Aspek untuk Aspek 2
SELECT id, 'Kebersihan Area Front Office', 15 FROM ins_aspek2
UNION ALL
SELECT id, 'Fungsi AC & Pencahayaan', 10 FROM ins_aspek2
UNION ALL
SELECT id, 'Ketersediaan Kursi Tunggu', 15 FROM ins_aspek2

UNION ALL

-- Insert Sub Aspek untuk Aspek 3
SELECT id, 'Waktu Tunggu Layanan < 15 Menit', 15 FROM ins_aspek3
UNION ALL
SELECT id, 'Keluapan Informasi Produk', 15 FROM ins_aspek3;
