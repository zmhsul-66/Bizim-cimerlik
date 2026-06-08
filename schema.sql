-- Menyu elementləri cədvəli
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  ingredients TEXT NOT NULL,
  image TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_chef_special BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cədvələ kənar şəxslərin icazəsiz birbaşa yazmasını bloklamaq üçün RLS (Row Level Security) aktiv edirik
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Hər kəsin menyunu oxuya bilməsi üçün oxuma izni (Public Read Access)
CREATE POLICY "Allow public read access" ON menu_items
  FOR SELECT USING (true);

-- API vasitəsilə admin tərəfindən bütün əməliyyatların icra olunmasına icazə
CREATE POLICY "Allow all access with service role/anon" ON menu_items
  FOR ALL USING (true);


-- Restoran ümumi məlumatları və tənzimləmələri cədvəli
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id TEXT PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  restaurant_subtitle TEXT,
  currency TEXT DEFAULT '₼',
  phone TEXT,
  address TEXT,
  wifi TEXT,
  wifi_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS aktiv edirik
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Hər kəs üçün oxuma izni (Public Read Access)
CREATE POLICY "Allow public settings read access" ON restaurant_settings
  FOR SELECT USING (true);

-- Admin tərəfindən idarəetmə izni
CREATE POLICY "Allow all settings access with service role/anon" ON restaurant_settings
  FOR ALL USING (true);


-- Kateqoriyalar cədvəli
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Utensils',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  watermark_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS aktiv edirik
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Hər kəs üçün oxuma izni
CREATE POLICY "Allow public categories read access" ON menu_categories
  FOR SELECT USING (true);

-- Admin tərəfindən idarəetmə izni
CREATE POLICY "Allow all categories access with service role/anon" ON menu_categories
  FOR ALL USING (true);

