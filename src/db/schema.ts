import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/* ============================================================================
   1. MERCHANTS (Établissements commerçants)
   ============================================================================ */
export const merchants = sqliteTable('merchants', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id'),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  phone: text('phone').notNull().default(''),
  currency: text('currency').notNull().default('MAD'), // 'MAD' | 'EUR'
  logoUrl: text('logo_url').default('/brand/logo-mark.png'),
  businessType: text('business_type').default('Commerce'),
  primaryColor: text('primary_color').notNull().default('#f85b04'),
  headerMode: text('header_mode').notNull().default('stamps'), // 'stamps' | 'photo'
  stampIcon: text('stamp_icon').default('star'),
  createdAt: text('created_at').notNull(),

  // Compatibility fields for authentication and styling
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  category: text('category').notNull().default('Restaurant'),
  address: text('address').notNull().default('Alger'),
  cardBgColor: text('card_bg_color').notNull().default('#1a1a1a'),
  cardAccentColor: text('card_accent_color').notNull().default('#f85b04'),
  cardCoverImage: text('card_cover_image').notNull().default('/landing/cartes/ongles.webp'),
  cardLogoImage: text('card_logo_image').notNull().default('/brand/logo-mark.png'),
  googleReviewUrl: text('google_review_url').notNull().default(''),
  geoNotificationText: text('geo_notification_text').notNull().default(''),
});

/* ============================================================================
   2. LOYALTY PROGRAMS (Programmes de fidélité)
   ============================================================================ */
export const loyaltyPrograms = sqliteTable('loyalty_programs', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  maxStamps: integer('max_stamps').notNull().default(10), // 5, 6, 8, 10, 12, 15
  referralBonus: integer('referral_bonus').notNull().default(0),
  googleReviewBonus: integer('google_review_bonus').notNull().default(0),
  googleReviewUrl: text('google_review_url').default(''),
  isReviewBonusActive: integer('is_review_bonus_active', { mode: 'boolean' })
    .notNull()
    .default(false),

  // Compatibility fields
  name: text('name').notNull().default('Programme Fidélité'),
  mode: text('mode').notNull().default('tampons'), // 'points' | 'tampons'
  pointsPerDzd: integer('points_per_dzd').notNull().default(1),
  stampsPerVisit: integer('stamps_per_visit').notNull().default(1),
  stampsTarget: integer('stamps_target').notNull().default(10),
  welcomeBonus: integer('welcome_bonus').notNull().default(0),
  rewardsJson: text('rewards_json').notNull().default('[]'),
  updatedAt: text('updated_at').notNull(),
});

/* ============================================================================
   3. REWARDS (Récompenses paliers)
   ============================================================================ */
export const rewards = sqliteTable('rewards', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  stampsRequired: integer('stamps_required').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

/* ============================================================================
   4. CUSTOMERS (Clients & Cartes de fidélité)
   ============================================================================ */
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull().default(''),
  phone: text('phone').notNull(),
  code: text('code').notNull().unique(), // C-XXXXXX
  currentStamps: integer('current_stamps').notNull().default(0),
  totalVisits: integer('total_visits').notNull().default(1),
  totalSpent: integer('total_spent').notNull().default(0),
  createdAt: text('created_at').notNull(),

  // Compatibility fields
  name: text('name').notNull().default(''),
  email: text('email').notNull().default(''),
  points: integer('points').notNull().default(0),
  visits: integer('visits').notNull().default(1),
  walletAdded: text('wallet_added').notNull().default('web'),
  googleReviewDone: integer('google_review_done').notNull().default(0),
  unlockedRewardsJson: text('unlocked_rewards_json').notNull().default('[]'),
  memberSince: text('member_since'),
  lastVisit: text('last_visit'),
});

/* ============================================================================
   5. TRANSACTIONS (Historique des scans & passages)
   ============================================================================ */
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  staffId: text('staff_id'),
  type: text('type').notNull(), // 'STAMP' | 'REWARD_REDEEMED' (also 'earn' | 'redeem')
  deltaStamps: integer('delta_stamps').notNull().default(1),
  amount: integer('amount').notNull().default(0),
  createdAt: text('created_at').notNull(),

  // Compatibility fields
  customerCode: text('customer_code').notNull().default(''),
  customerName: text('customer_name').notNull().default(''),
  delta: integer('delta').notNull().default(1),
  amountDzd: integer('amount_dzd').notNull().default(0),
  rewardTitle: text('reward_title'),
  unlockedReward: text('unlocked_reward'),
  operator: text('operator').notNull().default('Caisse Principale'),
  reference: text('reference'),
});

/* ============================================================================
   6. TEAM MEMBERS (Caissiers & Gestionnaires)
   ============================================================================ */
export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull().default('CAISSE'), // 'CAISSE' | 'MANAGER'
  pinCode: text('pin_code').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

/* ============================================================================
   7. NOTIFICATIONS (Campagnes & Alertes)
   ============================================================================ */
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  targetUrl: text('target_url'),
  sentAt: text('sent_at').notNull(),
});

/* ============================================================================
   8. GOOGLE REVIEW CLAIMS (Réclamations avis Google)
   ============================================================================ */
export const googleReviewClaims = sqliteTable('google_review_claims', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: text('created_at').notNull(),
});

/* ============================================================================
   LEADS (Optionnel - Formulaires de démo)
   ============================================================================ */
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  prenom: text('prenom').notNull(),
  commerceName: text('commerce_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull().default(''),
  ville: text('ville').notNull().default('Alger'),
  pointsDeVente: text('points_de_vente').notNull().default('1'),
  rappelQuand: text('rappel_quand').notNull().default('Peu importe'),
  simClientsParJour: integer('sim_clients_par_jour'),
  simPanierMoyen: integer('sim_panier_moyen'),
  simGainMensuelDzd: integer('sim_gain_mensuel_dzd'),
  createdAt: text('created_at').notNull(),
});
