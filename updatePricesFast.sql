-- This SQL updates all product prices based on category name
-- Run this in Supabase SQL Editor

-- First, let's create a function that generates prices
CREATE OR REPLACE FUNCTION generate_part_price(part_name TEXT)
RETURNS NUMERIC AS $$
DECLARE
  base_min NUMERIC := 300;
  base_max NUMERIC := 1500;
  result NUMERIC;
BEGIN
  -- Adjust based on part type
  IF LOWER(part_name) LIKE '%bonnet%' THEN
    base_min := 800; base_max := 3500;
  ELSIF LOWER(part_name) LIKE '%door%' THEN
    base_min := 1200; base_max := 5000;
  ELSIF LOWER(part_name) LIKE '%bumper%' THEN
    base_min := 600; base_max := 3000;
  ELSIF LOWER(part_name) LIKE '%fender%' THEN
    base_min := 500; base_max := 2500;
  ELSIF LOWER(part_name) LIKE '%headlight%' OR LOWER(part_name) LIKE '%head light%' THEN
    base_min := 350; base_max := 1800;
  ELSIF LOWER(part_name) LIKE '%taillight%' OR LOWER(part_name) LIKE '%tail light%' THEN
    base_min := 300; base_max := 1500;
  ELSIF LOWER(part_name) LIKE '%mirror%' THEN
    base_min := 200; base_max := 900;
  ELSIF LOWER(part_name) LIKE '%grille%' THEN
    base_min := 400; base_max := 2500;
  ELSIF LOWER(part_name) LIKE '%gear%' THEN
    base_min := 300; base_max := 1200;
  END IF;
  
  -- Random price between min and max
  result := base_min + (random() * (base_max - base_min));
  
  -- Round to nearest 50
  result := ROUND(result / 50) * 50;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update all products with new prices
UPDATE public.products
SET 
  price = generate_part_price(name),
  cost_price = ROUND(generate_part_price(name) * 0.6)
WHERE is_deleted = false;

-- Check results
SELECT 
  COUNT(*) as total_updated,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price) as avg_price
FROM public.products
WHERE is_deleted = false;
