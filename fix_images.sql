-- FIX IMAGES: Assign car images based on product name patterns
-- Run this in Supabase SQL Editor

-- These are verified Unsplash image URLs for each part type
-- Image 1: Car front/side view
-- Image 2: Different angle

UPDATE public.products SET image_url = 
  CASE 
    WHEN LOWER(name) LIKE '%bonnet%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%door%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%bumper%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%fender%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%headlight%' OR LOWER(name) LIKE '%head light%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%taillight%' OR LOWER(name) LIKE '%tail light%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%mirror%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%grille%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
      END
    WHEN LOWER(name) LIKE '%gear%' THEN 
      CASE WHEN random() < 0.5 
        THEN 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop'
      END
    ELSE 
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop'
  END;

-- Verify the update
SELECT 
  COUNT(*) as total_updated,
  COUNT(DISTINCT image_url) as unique_images
FROM public.products;
