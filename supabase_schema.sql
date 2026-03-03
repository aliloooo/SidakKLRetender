-- ============================================================
-- SIDAK Kantor Layanan – Database Schema
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

-- 1. Aspek (assessment categories)
CREATE TABLE IF NOT EXISTS aspek (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_aspek   text NOT NULL,
  bobot_aspek  numeric NOT NULL CHECK (bobot_aspek >= 0 AND bobot_aspek <= 100),
  created_at   timestamptz DEFAULT now()
);

-- 2. Sub Aspek (sub-categories)
CREATE TABLE IF NOT EXISTS sub_aspek (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspek_id          uuid NOT NULL REFERENCES aspek(id) ON DELETE CASCADE,
  nama_sub_aspek    text NOT NULL,
  bobot_sub_aspek   numeric NOT NULL CHECK (bobot_sub_aspek >= 0),
  is_unit_required  boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- 3. SIDAK Header (main inspection record)
CREATE TABLE IF NOT EXISTS sidak_header (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_ro             text NOT NULL,
  nama_kl             text NOT NULL,
  tanggal_kunjungan   date NOT NULL,
  total_nilai         numeric DEFAULT 0,
  status              text DEFAULT 'Not Comply' CHECK (status IN ('Comply', 'Not Comply')),
  created_at          timestamptz DEFAULT now(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. SIDAK Detail (line items per sub aspek)
CREATE TABLE IF NOT EXISTS sidak_detail (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sidak_id      uuid NOT NULL REFERENCES sidak_header(id) ON DELETE CASCADE,
  aspek_id      uuid REFERENCES aspek(id) ON DELETE SET NULL,
  sub_aspek_id  uuid REFERENCES sub_aspek(id) ON DELETE SET NULL,
  jumlah_unit   integer DEFAULT 0,
  kelengkapan   text DEFAULT 'Tidak Sesuai' CHECK (kelengkapan IN ('Sesuai', 'Tidak Sesuai')),
  keterangan    text,
  nilai         numeric DEFAULT 0
);

-- 5. Template Files (Excel templates for download)
CREATE TABLE IF NOT EXISTS template_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_file    text NOT NULL,
  file_url     text NOT NULL,
  uploaded_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE aspek         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_aspek     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidak_header  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidak_detail  ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_files ENABLE ROW LEVEL SECURITY;

-- aspek: Anyone can read; only authenticated (admin) can write
CREATE POLICY "Public read aspek"
  ON aspek FOR SELECT USING (true);

CREATE POLICY "Authenticated write aspek"
  ON aspek FOR ALL USING (auth.role() = 'authenticated');

-- sub_aspek: Same pattern
CREATE POLICY "Public read sub_aspek"
  ON sub_aspek FOR SELECT USING (true);

CREATE POLICY "Authenticated write sub_aspek"
  ON sub_aspek FOR ALL USING (auth.role() = 'authenticated');

-- sidak_header: Anyone can insert; authenticated can select all
CREATE POLICY "Anyone insert sidak"
  ON sidak_header FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated read all sidak"
  ON sidak_header FOR SELECT USING (true);

CREATE POLICY "Authenticated delete sidak"
  ON sidak_header FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update sidak"
  ON sidak_header FOR UPDATE USING (auth.role() = 'authenticated');

-- sidak_detail: follow same open policy for insert; select all
CREATE POLICY "Anyone insert sidak_detail"
  ON sidak_detail FOR INSERT WITH CHECK (true);

CREATE POLICY "Select all sidak_detail"
  ON sidak_detail FOR SELECT USING (true);

CREATE POLICY "Authenticated delete sidak_detail"
  ON sidak_detail FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update sidak_detail"
  ON sidak_detail FOR UPDATE USING (auth.role() = 'authenticated');

-- template_files: Anyone can read; admin can write
CREATE POLICY "Public read templates"
  ON template_files FOR SELECT USING (true);

CREATE POLICY "Authenticated write templates"
  ON template_files FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Supabase Storage (run via Dashboard or Storage API)
-- Create bucket: sidak-templates (public read)
-- ============================================================
-- Via Supabase Dashboard: Storage > New Bucket > sidak-templates > Public: ON
