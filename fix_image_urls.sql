-- FIX IMAGES: Update image URLs to match product names
-- Run this in Supabase SQL Editor
-- This efficiently handles 3000+ products

-- Create the image URL generator function
CREATE OR REPLACE FUNCTION generate_part_image_url(part_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Body Parts - Bonnet/Hood
  IF LOWER(part_name) LIKE '%bonnet%' OR LOWER(part_name) LIKE '%hood%' THEN
    RETURN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  -- Body Parts - Door
  ELSIF LOWER(part_name) LIKE '%door%' THEN
    RETURN 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
  -- Body Parts - Bumper
  ELSIF LOWER(part_name) LIKE '%bumper%' THEN
    RETURN 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop';
  -- Body Parts - Fender
  ELSIF LOWER(part_name) LIKE '%fender%' OR LOWER(part_name) LIKE '%wing%' THEN
    RETURN 'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop';
  -- Body Parts - Grille
  ELSIF LOWER(part_name) LIKE '%grille%' OR LOWER(part_name) LIKE '%grill%' THEN
    RETURN 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop';
  -- Headlights
  ELSIF LOWER(part_name) LIKE '%headlight%' OR LOWER(part_name) LIKE '%head light%' THEN
    RETURN 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  -- Taillights
  ELSIF LOWER(part_name) LIKE '%taillight%' OR LOWER(part_name) LIKE '%tail light%' OR LOWER(part_name) LIKE '%rear light%' THEN
    RETURN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
  -- Mirrors
  ELSIF LOWER(part_name) LIKE '%mirror%' OR LOWER(part_name) LIKE '%rear view%' THEN
    RETURN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  -- Windshield/Glass
  ELSIF LOWER(part_name) LIKE '%windscreen%' OR LOWER(part_name) LIKE '%windshield%' OR LOWER(part_name) LIKE '%glass%' THEN
    RETURN 'https://images.unsplash.com/photo-1508853191279-582d0e0e92e1?w=800&h=600&fit=crop';
  -- Rims/Wheels
  ELSIF LOWER(part_name) LIKE '%rim%' OR LOWER(part_name) LIKE '%wheel%' THEN
    RETURN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  -- Engine Parts - General
  ELSIF LOWER(part_name) LIKE '%engine%' OR LOWER(part_name) LIKE '%piston%' OR LOWER(part_name) LIKE '%cylinder%' THEN
    RETURN 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  -- Transmission/Gearbox
  ELSIF LOWER(part_name) LIKE '%gear%' OR LOWER(part_name) LIKE '%transmission%' OR LOWER(part_name) LIKE '%gearbox%' THEN
    RETURN 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  -- Battery
  ELSIF LOWER(part_name) LIKE '%battery%' THEN
    RETURN 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  -- Brake Parts
  ELSIF LOWER(part_name) LIKE '%brake%' THEN
    RETURN 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  -- Suspension/Shocks
  ELSIF LOWER(part_name) LIKE '%shock%' OR LOWER(part_name) LIKE '%strut%' OR LOWER(part_name) LIKE '%suspension%' THEN
    RETURN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  -- Filters (Air, Oil, Fuel)
  ELSIF LOWER(part_name) LIKE '%filter%' THEN
    RETURN 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  -- Spark Plugs / Ignition
  ELSIF LOWER(part_name) LIKE '%spark%' OR LOWER(part_name) LIKE '%ignition%' OR LOWER(part_name) LIKE '%coil%' THEN
    RETURN 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  -- Radiator/Cooling
  ELSIF LOWER(part_name) LIKE '%radiator%' OR LOWER(part_name) LIKE '%cooling%' OR LOWER(part_name) LIKE '%water pump%' THEN
    RETURN 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  -- Alternator/Starter
  ELSIF LOWER(part_name) LIKE '%alternator%' OR LOWER(part_name) LIKE '%starter%' THEN
    RETURN 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  -- Fuel System
  ELSIF LOWER(part_name) LIKE '%fuel%' OR LOWER(part_name) LIKE '%pump%' THEN
    RETURN 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  -- Exhaust
  ELSIF LOWER(part_name) LIKE '%exhaust%' OR LOWER(part_name) LIKE '%muffler%' OR LOWER(part_name) LIKE '%catalytic%' THEN
    RETURN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  -- Sensors
  ELSIF LOWER(part_name) LIKE '%sensor%' OR LOWER(part_name) LIKE '%abs%' THEN
    RETURN 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  -- Steering
  ELSIF LOWER(part_name) LIKE '%steering%' OR LOWER(part_name) LIKE '%tie rod%' OR LOWER(part_name) LIKE '%ball joint%' THEN
    RETURN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  -- Turbo
  ELSIF LOWER(part_name) LIKE '%turbo%' OR LOWER(part_name) LIKE '%charger%' THEN
    RETURN 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  -- Wipers
  ELSIF LOWER(part_name) LIKE '%wiper%' THEN
    RETURN 'https://images.unsplash.com/photo-1508853191279-582d0e0e92e1?w=800&h=600&fit=crop';
  -- Keys
  ELSIF LOWER(part_name) LIKE '%key%' THEN
    RETURN 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  -- Interior
  ELSIF LOWER(part_name) LIKE '%seat%' OR LOWER(part_name) LIKE '%mat%' OR LOWER(part_name) LIKE '%carpet%' THEN
    RETURN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  -- Tyres/Tires
  ELSIF LOWER(part_name) LIKE '%tire%' OR LOWER(part_name) LIKE '% tyre%' THEN
    RETURN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  -- Oil/Lubricants
  ELSIF LOWER(part_name) LIKE '%oil%' OR LOWER(part_name) LIKE '%lubricant%' OR LOWER(part_name) LIKE '%cvt%' OR LOWER(part_name) LIKE '%transmission oil%' THEN
    RETURN 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  -- Default: Generic car part
  ELSE
    RETURN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function for car images (for car_image_url field)
CREATE OR REPLACE FUNCTION generate_car_image_url(part_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- For products that are about specific cars, use car images
  IF LOWER(part_name) LIKE '%toyota%' AND (LOWER(part_name) LIKE '%corolla%' OR LOWER(part_name) LIKE '%rav4%' OR LOWER(part_name) LIKE '%camry%' OR LOWER(part_name) LIKE '%hilux%' OR LOWER(part_name) LIKE '%fortuner%' OR LOWER(part_name) LIKE '%yaris%' OR LOWER(part_name) LIKE '%vitz%' OR LOWER(part_name) LIKE '%starlet%') THEN
    RETURN 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%honda%' AND (LOWER(part_name) LIKE '%civic%' OR LOWER(part_name) LIKE '%accord%' OR LOWER(part_name) LIKE '%cr-v%' OR LOWER(part_name) LIKE '%pilot%') THEN
    RETURN 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%hyundai%' AND (LOWER(part_name) LIKE '%elantra%' OR LOWER(part_name) LIKE '%tucson%' OR LOWER(part_name) LIKE '%santa fe%' OR LOWER(part_name) LIKE '%sonata%') THEN
    RETURN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%nissan%' AND (LOWER(part_name) LIKE '%sentra%' OR LOWER(part_name) LIKE '%altima%' OR LOWER(part_name) LIKE '%pathfinder%' OR LOWER(part_name) LIKE '%navara%') THEN
    RETURN 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%bmw%' THEN
    RETURN 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%mercedes%' OR LOWER(part_name) LIKE '%benz%' THEN
    RETURN 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%mazda%' THEN
    RETURN 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%ford%' THEN
    RETURN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%kia%' THEN
    RETURN 'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%mitsubishi%' OR LOWER(part_name) LIKE '%outlander%' THEN
    RETURN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%lexus%' THEN
    RETURN 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
  ELSIF LOWER(part_name) LIKE '%land cruiser%' OR LOWER(part_name) LIKE '%prado%' THEN
    RETURN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  -- Default generic car
  ELSE
    RETURN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update both image URLs
UPDATE public.products SET 
  image_url = generate_part_image_url(name),
  car_image_url = generate_car_image_url(name)
WHERE is_deleted = false;

-- Summary
SELECT 
  COUNT(*) as total_updated,
  COUNT(DISTINCT image_url) as unique_product_images,
  COUNT(DISTINCT car_image_url) as unique_car_images
FROM public.products
WHERE is_deleted = false;
