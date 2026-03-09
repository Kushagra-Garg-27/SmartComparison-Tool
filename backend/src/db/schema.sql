-- SmartCompare Database Schema
-- PostgreSQL

-- Canonical products (brand + model identity)
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand         TEXT,
  model         TEXT,
  gtin          TEXT UNIQUE,
  canonical_title TEXT NOT NULL,
  category      TEXT,
  image         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_gtin ON products(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX idx_products_brand_model ON products(brand, model);

-- Sellers across platforms
CREATE TABLE IF NOT EXISTS sellers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  platform      TEXT NOT NULL,
  trust_score   INTEGER NOT NULL DEFAULT 80 CHECK (trust_score >= 0 AND trust_score <= 100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, platform)
);

-- Individual product listings on various platforms
CREATE TABLE IF NOT EXISTS product_listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL,
  external_id   TEXT,
  url           TEXT NOT NULL,
  title         TEXT NOT NULL,
  seller_id     UUID REFERENCES sellers(id),
  last_price    NUMERIC(12,2),
  currency      TEXT NOT NULL DEFAULT 'USD',
  condition     TEXT NOT NULL DEFAULT 'New',
  in_stock      BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

CREATE INDEX idx_listings_product ON product_listings(product_id);
CREATE INDEX idx_listings_platform ON product_listings(platform);

-- Price history for trend tracking
CREATE TABLE IF NOT EXISTS price_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
  price         NUMERIC(12,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_listing ON price_history(listing_id);
CREATE INDEX idx_history_time ON price_history(recorded_at);
