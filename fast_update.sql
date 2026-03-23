-- This script runs directly in Supabase SQL Editor
-- It updates ALL products in one execution - very fast!

-- Drop existing function if exists
DROP FUNCTION IF EXISTS update_products_prices_and_images();

-- Create function to update prices and images
CREATE OR REPLACE FUNCTION update_products_prices_and_images()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
  new_price numeric;
  cost_price numeric;
  img_url text;
  car_img_url text;
  part_name text;
BEGIN
  -- Loop through all active products
  FOR rec IN SELECT id, name FROM products WHERE is_deleted = false LOOP
    part_name := LOWER(rec.name);
    
    -- Generate price based on part type
    IF part_name LIKE '%spark plug%' OR part_name LIKE '%ignition plug%' THEN
      new_price := 30 + random() * 90;
    ELSIF part_name LIKE '%air filter%' OR part_name LIKE '%cabin filter%' THEN
      new_price := 35 + random() * 115;
    ELSIF part_name LIKE '%oil filter%' THEN
      new_price := 50 + random() * 150;
    ELSIF part_name LIKE '%brake pad%' OR part_name LIKE '%brake shoe%' THEN
      new_price := 95 + random() * 255;
    ELSIF part_name LIKE '%brake caliper%' THEN
      new_price := 250 + random() * 550;
    ELSIF part_name LIKE '%abs sensor%' THEN
      new_price := 100 + random() * 150;
    ELSIF part_name LIKE '%ignition coil%' OR part_name LIKE '%coil pack%' THEN
      new_price := 100 + random() * 200;
    ELSIF part_name LIKE '%alternator%' THEN
      new_price := 400 + random() * 800;
    ELSIF part_name LIKE '%starter%' THEN
      new_price := 350 + random() * 650;
    ELSIF part_name LIKE '%battery%' THEN
      new_price := 200 + random() * 600;
    ELSIF part_name LIKE '%radiator%' OR part_name LIKE '%cooling%' THEN
      new_price := 300 + random() * 900;
    ELSIF part_name LIKE '%water pump%' THEN
      new_price := 150 + random() * 350;
    ELSIF part_name LIKE '%shock%' OR part_name LIKE '%strut%' OR part_name LIKE '%suspension%' THEN
      new_price := 180 + random() * 520;
    ELSIF part_name LIKE '%stabilizer link%' THEN
      new_price := 80 + random() * 120;
    ELSIF part_name LIKE '%ball joint%' THEN
      new_price := 100 + random() * 250;
    ELSIF part_name LIKE '%tie rod%' OR part_name LIKE '%steering%' THEN
      new_price := 120 + random() * 280;
    ELSIF part_name LIKE '%headlight%' THEN
      new_price := 300 + random() * 900;
    ELSIF part_name LIKE '%taillight%' OR part_name LIKE '%rear light%' THEN
      new_price := 250 + random() * 650;
    ELSIF part_name LIKE '%mirror%' THEN
      new_price := 150 + random() * 450;
    ELSIF part_name LIKE '%grille%' THEN
      new_price := 300 + random() * 1200;
    ELSIF part_name LIKE '%bonnet%' OR part_name LIKE '%hood%' THEN
      new_price := 800 + random() * 2700;
    ELSIF part_name LIKE '%door%' THEN
      new_price := 1000 + random() * 4000;
    ELSIF part_name LIKE '%bumper%' THEN
      new_price := 500 + random() * 2000;
    ELSIF part_name LIKE '%fender%' OR part_name LIKE '%wing%' THEN
      new_price := 400 + random() * 1600;
    ELSIF part_name LIKE '%windscreen%' OR part_name LIKE '%windshield%' THEN
      new_price := 400 + random() * 1600;
    ELSIF part_name LIKE '%gearbox%' OR part_name LIKE '%transmission%' THEN
      new_price := 1500 + random() * 6500;
    ELSIF part_name LIKE '%cvt%' OR part_name LIKE '%transmission oil%' THEN
      new_price := 200 + random() * 300;
    ELSIF part_name LIKE '%fuel pump%' THEN
      new_price := 200 + random() * 600;
    ELSIF part_name LIKE '%fuel filter%' THEN
      new_price := 80 + random() * 220;
    ELSIF part_name LIKE '%sensor%' THEN
      new_price := 80 + random() * 320;
    ELSIF part_name LIKE '%turbo%' THEN
      new_price := 1500 + random() * 4500;
    ELSIF part_name LIKE '%exhaust%' OR part_name LIKE '%muffler%' THEN
      new_price := 200 + random() * 800;
    ELSIF part_name LIKE '%wiper%' THEN
      new_price := 30 + random() * 120;
    ELSIF part_name LIKE '%key%' THEN
      new_price := 40 + random() * 110;
    ELSIF part_name LIKE '%tire%' OR part_name LIKE '% tyre%' THEN
      new_price := 200 + random() * 1000;
    ELSIF part_name LIKE '%rim%' OR part_name LIKE '%wheel%' THEN
      new_price := 300 + random() * 1700;
    ELSE
      new_price := 100 + random() * 900;
    END IF;
    
    new_price := ROUND(new_price / 10) * 10;
    cost_price := ROUND(new_price * 0.55);
    
    -- Generate product image URL
    IF part_name LIKE '%bonnet%' OR part_name LIKE '%hood%' THEN
      img_url := 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%door%' THEN
      img_url := 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%bumper%' THEN
      img_url := 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%headlight%' THEN
      img_url := 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%taillight%' THEN
      img_url := 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%mirror%' THEN
      img_url := 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%filter%' THEN
      img_url := 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%brake%' THEN
      img_url := 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%shock%' OR part_name LIKE '%strut%' THEN
      img_url := 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%battery%' THEN
      img_url := 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%engine%' OR part_name LIKE '%piston%' THEN
      img_url := 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
    ELSE
      img_url := 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    END IF;
    
    -- Generate car image URL
    IF part_name LIKE '%toyota%' AND (part_name LIKE '%corolla%' OR part_name LIKE '%rav4%' OR part_name LIKE '%camry%' OR part_name LIKE '%hilux%') THEN
      car_img_url := 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%honda%' AND (part_name LIKE '%civic%' OR part_name LIKE '%accord%') THEN
      car_img_url := 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%hyundai%' AND (part_name LIKE '%elantra%' OR part_name LIKE '%tucson%') THEN
      car_img_url := 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%bmw%' THEN
      car_img_url := 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%mercedes%' OR part_name LIKE '%benz%' THEN
      car_img_url := 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop';
    ELSIF part_name LIKE '%nissan%' THEN
      car_img_url := 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop';
    ELSE
      car_img_url := 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    END IF;
    
    UPDATE products 
    SET price = new_price, cost_price = cost_price, image_url = img_url, car_image_url = car_img_url
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Execute the function
SELECT update_products_prices_and_images();

-- Show summary
SELECT 
  COUNT(*) as total_products,
  MIN(price)::numeric::int as min_price,
  MAX(price)::numeric::int as max_price,
  ROUND(AVG(price))::numeric::int as avg_price
FROM products
WHERE is_deleted = false;
