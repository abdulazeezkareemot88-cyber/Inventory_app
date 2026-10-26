-- Supabase PostgreSQL Schema for Inventory Management System (Clean / Empty Slate)

-- 1. Drop existing table if you want a clean start
DROP TABLE IF EXISTS products CASCADE;

-- 2. Create the products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Access Policies for REST API CRUD operations
CREATE POLICY "Allow public read access" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON products
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON products
    FOR DELETE USING (true);
