-- SmartCompare Database Schema v2
-- Enterprise-grade price intelligence system
-- PostgreSQL 14+

-- ============================================================
-- 1. CANONICAL PRODUCTS
-- The single source of truth for product identity.
-- Multiple store listings map back to one canonical product.
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand           TEXT,
  model           TEXT,
  gtin            TEXT UNIQUE,                    -- EAN / UPC / GTIN-13
  asin            TEXT,                           -- Amazon Standard Identification Number
  canonical_title TEXT NOT NULL,
  category        TEXT,
  subcategory     TEXT,
  image           TEXT,
  specs           JSONB DEFAULT '{}',             -- Structured product specifications
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_gtin ON products(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin) WHERE asin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand_model ON products(brand, model);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin(canonical_title gin_trgm_ops);

-- ============================================================
-- 2. SELLERS
-- Stores / sellers across platforms with trust scoring.
-- ============================================================

CREATE TABLE IF NOT EXISTS sellers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  platform      TEXT NOT NULL,
  trust_score   INTEGER NOT NULL DEFAULT 80 CHECK (trust_score >= 0 AND trust_score <= 100),
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, platform)
);

-- ============================================================
-- 3. PRODUCT LISTINGS
-- Each row = one product on one store.
-- A canonical product may have many listings across stores.
-- ============================================================

CREATE TABLE IF NOT EXISTS product_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store           TEXT NOT NULL,                   -- Store identifier (amazon, flipkart, croma, etc.)
  external_id     TEXT,                            -- Store-specific product ID (ASIN, FSN, etc.)
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  seller_id       UUID REFERENCES sellers(id),
  last_price      NUMERIC(12,2),
  original_price  NUMERIC(12,2),                   -- MRP / list price for discount calculation
  currency        TEXT NOT NULL DEFAULT 'INR',
  condition       TEXT NOT NULL DEFAULT 'New',
  in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_info   TEXT,                            -- Free Delivery, 2-day, etc.
  return_policy   TEXT,                            -- 30-day returns, etc.
  rating          NUMERIC(2,1),                    -- Product rating on this store
  review_count    INTEGER,
  affiliate_url   TEXT,
  affiliate_network TEXT,
  last_checked    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store, external_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_product ON product_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_store ON product_listings(store);
CREATE INDEX IF NOT EXISTS idx_listings_last_checked ON product_listings(last_checked);

-- ============================================================
-- 4. PRICE HISTORY
-- Immutable log of every observed price change.
-- Powers analytics, charts, and predictions.
-- ============================================================

CREATE TABLE IF NOT EXISTS price_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store         TEXT NOT NULL,
  price         NUMERIC(12,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'INR',
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_listing ON price_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_history_store ON price_history(store);
CREATE INDEX IF NOT EXISTS idx_history_time ON price_history(recorded_at DESC);

-- ============================================================
-- 5. DEALS
-- Active deals and discounts across platforms.
-- ============================================================

CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  product_image   TEXT,
  original_price  NUMERIC(12,2) NOT NULL,
  deal_price      NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2),
  deal_score      INTEGER CHECK (deal_score >= 0 AND deal_score <= 100),
  store           TEXT NOT NULL,
  category        TEXT,
  is_limited_time BOOLEAN DEFAULT FALSE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_store ON deals(store);
CREATE INDEX IF NOT EXISTS idx_deals_score ON deals(deal_score DESC);

-- ============================================================
-- 6. WATCHLIST
-- Per-user product tracking with price alerts.
-- ============================================================

CREATE TABLE IF NOT EXISTS watchlist (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name  TEXT NOT NULL,
  product_image TEXT,
  product_url   TEXT,
  store         TEXT,
  current_price NUMERIC(12,2),
  alert_price   NUMERIC(12,2),
  trend         TEXT DEFAULT 'stable',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);

-- ============================================================
-- 7. NOTIFICATIONS
-- User notification feed.
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;

-- ============================================================
-- 8. AFFILIATE CLICKS
-- Tracks affiliate link clicks for analytics.
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT,
  listing_id        TEXT NOT NULL,
  product_id        TEXT NOT NULL,
  store             TEXT NOT NULL,
  affiliate_network TEXT,
  clicked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_user ON affiliate_clicks(user_id);

-- ============================================================
-- 9. SCRAPE JOBS
-- Tracks scraping tasks for observability and retry logic.
-- ============================================================

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  store       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  url         TEXT,
  result      JSONB,
  error       TEXT,
  attempts    INTEGER NOT NULL DEFAULT 0,
  started_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_product ON scrape_jobs(product_id);
