-- Performance indexes for products table
-- Run this in Supabase SQL Editor or via CLI

CREATE INDEX IF NOT EXISTS idx_products_year_id ON public.products(year_id);
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON public.products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_deleted, status) WHERE is_deleted = false;

-- Full-text search index for faster text search
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN(search_vector);

-- Trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_trigger ON public.products;
CREATE TRIGGER products_search_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Batch stock decrement function
CREATE OR REPLACE FUNCTION batch_decrement_stock(p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  update_item jsonb;
BEGIN
  FOR update_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    UPDATE public.products
    SET quantity = quantity - (update_item->>'quantity')::integer
    WHERE id = (update_item->>'product_id')::uuid
      AND quantity >= (update_item->>'quantity')::integer;
    
    IF found THEN
      INSERT INTO public.inventory_logs(product_id, change, reason, reference)
      VALUES (
        (update_item->>'product_id')::uuid,
        (update_item->>'quantity')::integer,
        update_item->>'reason',
        update_item->>'reference'
      );
    END IF;
  END LOOP;
END;
$$;

-- Analyze table to update statistics
ANALYZE public.products;

-- Update search vectors for existing products
UPDATE public.products SET search_vector = to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')) WHERE search_vector IS NULL;
