-- ==============================================================================
-- FIDELIO CLOUDFLARE D1 DATABASE SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'MAD',
  logo_url TEXT DEFAULT '/brand/logo-mark.png',
  business_type TEXT DEFAULT 'Commerce',
  primary_color TEXT NOT NULL DEFAULT '#f85b04',
  header_mode TEXT NOT NULL DEFAULT 'stamps',
  stamp_icon TEXT DEFAULT 'star',
  created_at TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  category TEXT NOT NULL DEFAULT 'Restaurant',
  address TEXT NOT NULL DEFAULT 'Alger',
  card_bg_color TEXT NOT NULL DEFAULT '#1a1a1a',
  card_accent_color TEXT NOT NULL DEFAULT '#f85b04',
  card_cover_image TEXT NOT NULL DEFAULT '/landing/cartes/ongles.webp',
  card_logo_image TEXT NOT NULL DEFAULT '/brand/logo-mark.png',
  google_review_url TEXT NOT NULL DEFAULT '',
  geo_notification_text TEXT NOT NULL DEFAULT 'Un café vous attend chez nous ☕'
);

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  max_stamps INTEGER NOT NULL DEFAULT 10,
  referral_bonus INTEGER NOT NULL DEFAULT 0,
  google_review_bonus INTEGER NOT NULL DEFAULT 0,
  google_review_url TEXT DEFAULT '',
  is_review_bonus_active INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL DEFAULT 'Programme Fidélité',
  mode TEXT NOT NULL DEFAULT 'tampons',
  points_per_dzd INTEGER NOT NULL DEFAULT 1,
  stamps_per_visit INTEGER NOT NULL DEFAULT 1,
  stamps_target INTEGER NOT NULL DEFAULT 10,
  welcome_bonus INTEGER NOT NULL DEFAULT 0,
  rewards_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stamps_required INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  current_stamps INTEGER NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 1,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 0,
  visits INTEGER NOT NULL DEFAULT 1,
  wallet_added TEXT NOT NULL DEFAULT 'web',
  google_review_done INTEGER NOT NULL DEFAULT 0,
  unlocked_rewards_json TEXT NOT NULL DEFAULT '[]',
  member_since TEXT,
  last_visit TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  staff_id TEXT,
  type TEXT NOT NULL,
  delta_stamps INTEGER NOT NULL DEFAULT 1,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  customer_code TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  delta INTEGER NOT NULL DEFAULT 1,
  amount_dzd INTEGER NOT NULL DEFAULT 0,
  reward_title TEXT,
  unlocked_reward TEXT,
  operator TEXT NOT NULL DEFAULT 'Caisse Principale',
  reference TEXT
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CAISSE',
  pin_code TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_url TEXT,
  sent_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS google_review_claims (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  prenom TEXT NOT NULL,
  commerce_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  ville TEXT NOT NULL DEFAULT 'Alger',
  points_de_vente TEXT NOT NULL DEFAULT '1',
  rappel_quand TEXT NOT NULL DEFAULT 'Peu importe',
  sim_clients_par_jour INTEGER,
  sim_panier_moyen INTEGER,
  sim_gain_mensuel_dzd INTEGER,
  created_at TEXT NOT NULL
);

-- Indices for high performance queries
CREATE INDEX IF NOT EXISTS idx_merchants_slug ON merchants(slug);
CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email);
CREATE INDEX IF NOT EXISTS idx_customers_merchant ON customers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_team_members_merchant ON team_members(merchant_id);
CREATE INDEX IF NOT EXISTS idx_google_review_claims_merchant ON google_review_claims(merchant_id);

-- Seed default Gourmand merchant
INSERT OR IGNORE INTO merchants (
  id, name, slug, email, phone, password_hash, category, address,
  card_bg_color, card_accent_color, card_cover_image, card_logo_image,
  google_review_url, geo_notification_text, created_at
) VALUES (
  'com-1',
  'Gourmand',
  'gourmand-klzq',
  'contact@gourmand.dz',
  '+213 5 50 00 00 00',
  'f9aa1787c95a04e38e6ab274bfa74bc6f62bbf6b5be8b7b20464ea4b162f2ec2',
  'Restaurant',
  'Alger',
  '#1a1a1a',
  '#f85b04',
  '/landing/cartes/ongles.webp',
  '/brand/logo-mark.png',
  'https://search.google.com/local/writereview?placeid=',
  'Un café vous attend chez nous ☕',
  '2026-10-29T00:00:00.000Z'
);

INSERT OR IGNORE INTO loyalty_programs (
  id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
  welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
) VALUES (
  'prog-1',
  'com-1',
  'Programme Fidélité Gourmand',
  'tampons',
  1, 1, 10, 0, 0, 0, '[]',
  '2026-10-29T00:00:00.000Z'
);

-- Seed Administrator / Support account
INSERT OR IGNORE INTO merchants (
  id, name, slug, email, phone, password_hash, category, address,
  card_bg_color, card_accent_color, card_cover_image, card_logo_image,
  google_review_url, geo_notification_text, created_at
) VALUES (
  'com-support',
  'Fidelio Alger',
  'fidelio-alger',
  'fidelioapp.support@gmail.com',
  '+213 5 50 12 34 56',
  '5582f3473fe8847d8b58476839352e89648a12903ef88ff525e9858348981f18',
  'Commerce',
  'Didouche Mourad, Alger',
  '#1a1a1a',
  '#f85b04',
  '/landing/cartes/ongles.webp',
  '/brand/logo-mark.png',
  'https://search.google.com/local/writereview?placeid=',
  'Bienvenue chez Fidelio Alger ✨',
  '2026-10-29T00:00:00.000Z'
);

INSERT OR IGNORE INTO loyalty_programs (
  id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
  welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
) VALUES (
  'prog-support',
  'com-support',
  'Programme Privilège Fidelio',
  'points',
  1, 1, 100, 25, 15, 10, '[]',
  '2026-10-29T00:00:00.000Z'
);
