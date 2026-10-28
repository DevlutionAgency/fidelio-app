import { createClient, type Client, type InArgs } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as crypto from 'node:crypto';
import * as schema from './schema.ts';

// Dynamic database client holder
let activeClient: Client | null = null;
let currentDbUrl: string = '';
let currentAuthToken: string | undefined = undefined;

export const DB_PATH = (typeof process !== 'undefined' && process.cwd) ? `${process.cwd()}/data/fidelio.sqlite` : 'data/fidelio.sqlite';

export const isRemoteDb = Boolean(
  (typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL && process.env.TURSO_DATABASE_URL.startsWith('libsql://')) ||
  currentDbUrl.startsWith('libsql://')
);

export const dbUrl = (typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL) || `file:${DB_PATH}`;

export function getDbUrl(): string {
  if (currentDbUrl) return currentDbUrl;
  if (typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  // Check if we are running in a Node.js filesystem environment
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return `file:${path.join(dataDir, 'fidelio.sqlite')}`;
  } catch {
    // Edge/Worker runtime fallback when no filesystem is available
    return ':memory:';
  }
}

export function setTursoConfig(url: string, authToken?: string): void {
  if (url && (url !== currentDbUrl || authToken !== currentAuthToken)) {
    currentDbUrl = url;
    currentAuthToken = authToken;
    activeClient = null; // force re-instantiation with new credentials
  }
}

export function getClient(): Client {
  if (activeClient) return activeClient;

  const url = getDbUrl();
  const token = currentAuthToken || (typeof process !== 'undefined' ? process.env?.TURSO_AUTH_TOKEN : undefined);

  activeClient = createClient({
    url,
    authToken: token,
  });

  return activeClient;
}

export const client: Client = new Proxy({} as Client, {
  get(_target, prop) {
    const c = getClient();
    const val = (c as any)[prop];
    if (typeof val === 'function') {
      return val.bind(c);
    }
    return val;
  },
});

export const db = drizzle(client, { schema });

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`fidelio_salt_${password}`).digest('hex');
}

export async function dbQueryOne<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  const result = await getClient().execute({ sql, args });
  return (result.rows[0] as unknown as T) || undefined;
}

export async function dbQueryAll<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const result = await getClient().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function dbRun(sql: string, args: InArgs = []): Promise<void> {
  await getClient().execute({ sql, args });
}

let migrationPromise: Promise<void> | null = null;

export async function runMigrations(): Promise<void> {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    const cli = getClient();
    await cli.executeMultiple(`
      CREATE TABLE IF NOT EXISTS merchants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Restaurant',
        address TEXT NOT NULL DEFAULT 'Alger',
        card_bg_color TEXT NOT NULL DEFAULT '#1a1a1a',
        card_accent_color TEXT NOT NULL DEFAULT '#f85b04',
        card_cover_image TEXT NOT NULL DEFAULT '/landing/cartes/ongles.webp',
        card_logo_image TEXT NOT NULL DEFAULT '/brand/logo-mark.png',
        google_review_url TEXT NOT NULL DEFAULT 'https://search.google.com/local/writereview?placeid=',
        geo_notification_text TEXT NOT NULL DEFAULT 'Un café vous attend chez nous ☕',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loyalty_programs (
        id TEXT PRIMARY KEY,
        merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'tampons',
        points_per_dzd INTEGER NOT NULL DEFAULT 1,
        stamps_per_visit INTEGER NOT NULL DEFAULT 1,
        stamps_target INTEGER NOT NULL DEFAULT 10,
        welcome_bonus INTEGER NOT NULL DEFAULT 0,
        referral_bonus INTEGER NOT NULL DEFAULT 0,
        google_review_bonus INTEGER NOT NULL DEFAULT 0,
        rewards_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        points INTEGER NOT NULL DEFAULT 0,
        visits INTEGER NOT NULL DEFAULT 1,
        total_spent INTEGER NOT NULL DEFAULT 0,
        wallet_added TEXT NOT NULL DEFAULT 'web',
        google_review_done INTEGER NOT NULL DEFAULT 0,
        unlocked_rewards_json TEXT NOT NULL DEFAULT '[]',
        member_since TEXT NOT NULL,
        last_visit TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        customer_code TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        type TEXT NOT NULL,
        delta INTEGER NOT NULL,
        amount_dzd INTEGER NOT NULL DEFAULT 0,
        reward_title TEXT,
        unlocked_reward TEXT,
        operator TEXT NOT NULL DEFAULT 'Caisse Principale',
        reference TEXT,
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
    `);

    const now = new Date().toISOString();

    // 1. Initial demo merchant "Gourmand" (Safe INSERT OR IGNORE)
    await dbRun(
      `INSERT OR IGNORE INTO merchants (
        id, name, slug, email, phone, password_hash, category, address,
        card_bg_color, card_accent_color, card_cover_image, card_logo_image,
        google_review_url, geo_notification_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'com-1',
        'Gourmand',
        'gourmand-klzq',
        'contact@gourmand.dz',
        '+213 5 50 00 00 00',
        hashPassword('password123'),
        'Restaurant',
        'Alger',
        '#1a1a1a',
        '#f85b04',
        '/landing/cartes/ongles.webp',
        '/brand/logo-mark.png',
        'https://search.google.com/local/writereview?placeid=',
        'Un café vous attend chez nous ☕',
        now,
      ]
    );

    await dbRun(
      `INSERT OR IGNORE INTO loyalty_programs (
        id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
        welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'prog-1',
        'com-1',
        'Programme Fidélité Gourmand',
        'tampons',
        1,
        1,
        10,
        0,
        0,
        0,
        JSON.stringify([
          {
            id: 'rew-default-1',
            title: 'Café ou Dessert offert',
            cost: 5,
            description: 'Dès 5 passages ou points cumulés',
            category: 'Boisson',
            redemptions: 0,
          },
          {
            id: 'rew-default-2',
            title: 'Menu Complet offert',
            cost: 10,
            description: 'Votre 10ème passage récompensé',
            category: 'Repas',
            redemptions: 0,
          },
        ]),
        now,
      ]
    );

    // 2. Pre-seed Administrator / Support account fidelioapp.support@gmail.com
    await dbRun(
      `INSERT OR IGNORE INTO merchants (
        id, name, slug, email, phone, password_hash, category, address,
        card_bg_color, card_accent_color, card_cover_image, card_logo_image,
        google_review_url, geo_notification_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'com-support',
        'Fidelio Alger',
        'fidelio-alger',
        'fidelioapp.support@gmail.com',
        '+213 5 50 12 34 56',
        hashPassword('Walid@12'),
        'Commerce',
        'Didouche Mourad, Alger',
        '#1a1a1a',
        '#f85b04',
        '/landing/cartes/ongles.webp',
        '/brand/logo-mark.png',
        'https://search.google.com/local/writereview?placeid=',
        'Bienvenue chez Fidelio Alger ✨',
        now,
      ]
    );

    await dbRun(
      `INSERT OR IGNORE INTO loyalty_programs (
        id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
        welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'prog-support',
        'com-support',
        'Programme Privilège Fidelio',
        'points',
        1,
        1,
        100,
        25,
        15,
        10,
        JSON.stringify([
          {
            id: 'rew-support-1',
            title: 'Boisson d’accueil offerte',
            cost: 50,
            description: 'Dès 50 points cumulés',
            category: 'Boisson',
            redemptions: 0,
          },
          {
            id: 'rew-support-2',
            title: 'Remise 20% sur la commande',
            cost: 100,
            description: 'Valable sur toute la carte',
            category: 'Remise',
            redemptions: 0,
          },
        ]),
        now,
      ]
    );

    // Add a demo customer to this account as well
    await dbRun(
      `INSERT OR IGNORE INTO customers (
        id, merchant_id, code, name, phone, email, points, visits, total_spent,
        wallet_added, google_review_done, unlocked_rewards_json, member_since, last_visit, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'cust-sup-1',
        'com-support',
        'C-FIDEL1',
        'Yacine Boutaleb',
        '+213 5 55 12 34 56',
        'yacine.b@gmail.com',
        75,
        4,
        3750,
        'apple',
        1,
        JSON.stringify(['Boisson d’accueil offerte']),
        '2026-10-01T10:00:00Z',
        now,
        now,
      ]
    );
  })();

  return migrationPromise;
}

// Automatically trigger migration check
void runMigrations().catch((err) => {
  console.warn('[Fidelio DB] Migration notice:', err?.message || err);
});
