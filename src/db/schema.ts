import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const merchants = sqliteTable('merchants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  passwordHash: text('password_hash').notNull(),
  category: text('category').notNull().default('Restaurant'),
  address: text('address').notNull().default('Alger'),
  cardBgColor: text('card_bg_color').notNull().default('#1a1a1a'),
  cardAccentColor: text('card_accent_color').notNull().default('#f85b04'),
  cardCoverImage: text('card_cover_image').notNull().default('/landing/cartes/ongles.webp'),
  cardLogoImage: text('card_logo_image').notNull().default('/brand/logo-mark.png'),
  googleReviewUrl: text('google_review_url')
    .notNull()
    .default('https://search.google.com/local/writereview?placeid='),
  geoNotificationText: text('geo_notification_text')
    .notNull()
    .default('Un café vous attend chez nous ☕'),
  createdAt: text('created_at').notNull(),
});

export const loyaltyPrograms = sqliteTable('loyalty_programs', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mode: text('mode').notNull().default('tampons'), // 'points' | 'tampons'
  pointsPerDzd: integer('points_per_dzd').notNull().default(1),
  stampsPerVisit: integer('stamps_per_visit').notNull().default(1),
  stampsTarget: integer('stamps_target').notNull().default(10),
  welcomeBonus: integer('welcome_bonus').notNull().default(0),
  referralBonus: integer('referral_bonus').notNull().default(0),
  googleReviewBonus: integer('google_review_bonus').notNull().default(0),
  rewardsJson: text('rewards_json').notNull().default('[]'),
  updatedAt: text('updated_at').notNull(),
});

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull().default(''),
  points: integer('points').notNull().default(0),
  visits: integer('visits').notNull().default(1),
  totalSpent: integer('total_spent').notNull().default(0),
  walletAdded: text('wallet_added').notNull().default('web'),
  googleReviewDone: integer('google_review_done').notNull().default(0),
  unlockedRewardsJson: text('unlocked_rewards_json').notNull().default('[]'),
  memberSince: text('member_since').notNull(),
  lastVisit: text('last_visit').notNull(),
  createdAt: text('created_at').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  customerCode: text('customer_code').notNull(),
  customerName: text('customer_name').notNull(),
  type: text('type').notNull(), // 'earn' | 'redeem'
  delta: integer('delta').notNull(),
  amountDzd: integer('amount_dzd').notNull().default(0),
  rewardTitle: text('reward_title'),
  unlockedReward: text('unlocked_reward'),
  operator: text('operator').notNull().default('Caisse Principale'),
  reference: text('reference'),
  createdAt: text('created_at').notNull(),
});

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  source: text('source').notNull(), // 'demo' | 'simulateur' | 'demarrer'
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
