import { createClient, type Client, type InArgs, type ResultSet } from '@libsql/client';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as schema from './schema.ts';

// Dynamic database credentials
let currentDbUrl: string = '';
let currentAuthToken: string | undefined = undefined;
let activeClient: Client | null = null;
let migrationDone = false;

export const DB_PATH =
  typeof process !== 'undefined' && process.cwd
    ? path.join(process.cwd(), 'data', 'fidelio.sqlite')
    : 'data/fidelio.sqlite';

export const isRemoteDb = Boolean(
  (typeof process !== 'undefined' &&
    process.env?.TURSO_DATABASE_URL &&
    process.env.TURSO_DATABASE_URL.startsWith('libsql://')) ||
    currentDbUrl.startsWith('libsql://')
);

export const dbUrl =
  (typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL) || `file:${DB_PATH}`;

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`fidelio_salt_${password}`).digest('hex');
}

export function setTursoConfig(url: string, authToken?: string): void {
  if (url && (url !== currentDbUrl || authToken !== currentAuthToken)) {
    currentDbUrl = url;
    currentAuthToken = authToken;
    activeClient = null; // Recreate client with new credentials
    migrationDone = false;
  }
}

/**
 * Checks whether the current runtime is Cloudflare Workers (Web Standards isolate)
 */
export function isCloudflareRuntime(): boolean {
  if (typeof (globalThis as any).WebSocketPair !== 'undefined') return true;
  if (typeof (globalThis as any).caches?.default !== 'undefined') return true;
  if (typeof navigator !== 'undefined' && Boolean(navigator.userAgent?.includes('Cloudflare'))) return true;
  if (typeof process === 'undefined' || !process?.versions?.node) return true;
  return false;
}

/**
 * In-memory fallback database for Edge runtimes (Cloudflare Workers)
 * when TURSO_DATABASE_URL is not yet configured.
 */
class MemoryDatabase {
  users: any[] = [];
  merchants: any[] = [];
  loyalty_programs: any[] = [];
  customers: any[] = [];
  transactions: any[] = [];
  leads: any[] = [];

  constructor() {
    // Zero hardcoded mocks or demo seeds: pure multi-tenant data isolation
  }

  query(sql: string, args: InArgs = []): any[] {
    const s = sql.trim().toUpperCase();
    const argsArray = Array.isArray(args) ? args : Object.values(args);

    if (s.startsWith('SELECT')) {
      if (s.includes('COUNT(*)')) {
        let count = 0;
        if (s.includes('FROM LEADS')) count = this.leads.length;
        else if (s.includes('FROM MERCHANTS')) count = this.merchants.length;
        else if (s.includes('FROM CUSTOMERS')) count = this.customers.length;
        else if (s.includes('FROM USERS')) count = this.users.length;
        return [{ cnt: count, count }];
      }

      if (s.includes('FROM USERS')) {
        if (s.includes('WHERE')) {
          if (s.includes('ID = ?')) {
            return this.users.filter((u) => u.id === argsArray[0]);
          }
          if (s.includes('EMAIL')) {
            const targetEmail = String(argsArray[0] || '').trim().toLowerCase();
            return this.users.filter((u) => u.email.toLowerCase() === targetEmail);
          }
          return [];
        }
        return [...this.users];
      }

      if (s.includes('FROM MERCHANTS')) {
        if (s.includes('WHERE')) {
          if (s.includes('OWNER_ID = ?') && (s.includes('ID = ?') || s.includes('SLUG = ?'))) {
            const matchVal = argsArray[0];
            const ownerId = argsArray[1];
            return this.merchants.filter(
              (m) => m.owner_id === ownerId && (m.id === matchVal || m.slug === matchVal)
            );
          }
          if (s.includes('OWNER_ID = ?')) {
            return this.merchants.filter((m) => m.owner_id === argsArray[0]);
          }
          if (s.includes('ID = ?') && s.includes('SLUG = ?')) {
            const val1 = argsArray[0];
            const val2 = argsArray[1] ?? val1;
            return this.merchants.filter((m) => m.id === val1 || m.slug === val2 || m.slug === val1);
          }
          if (s.includes('ID = ?')) {
            return this.merchants.filter((m) => m.id === argsArray[0]);
          }
          if (s.includes('SLUG = ?')) {
            return this.merchants.filter((m) => m.slug === argsArray[0]);
          }
          if (s.includes('EMAIL')) {
            const targetEmail = String(argsArray[0] || '').trim().toLowerCase();
            return this.merchants.filter(
              (m) => m.email.toLowerCase() === targetEmail
            );
          }
          return [];
        }
        return [...this.merchants];
      }

      if (s.includes('FROM LOYALTY_PROGRAMS')) {
        if (s.includes('WHERE')) {
          if (s.includes('MERCHANT_ID')) {
            return this.loyalty_programs.filter((p) => p.merchant_id === argsArray[0]);
          }
          return [];
        }
        return [...this.loyalty_programs];
      }

      if (s.includes('FROM CUSTOMERS')) {
        if (s.includes('WHERE')) {
          if (s.includes('MERCHANT_ID') && (s.includes('CODE') || s.includes('ID')) && argsArray.length >= 2) {
            const mid = String(argsArray[0]);
            const val = String(argsArray[1]).toUpperCase();
            return this.customers.filter(
              (c) => c.merchant_id === mid && (c.code.toUpperCase() === val || c.id === val)
            );
          }
          if (s.includes('CODE') && s.includes('ID')) {
            const val = String(argsArray[0] ?? '').toUpperCase();
            const val2 = String(argsArray[1] ?? val).toUpperCase();
            return this.customers.filter(
              (c) =>
                c.code.toUpperCase() === val ||
                c.id === val ||
                c.code.toUpperCase() === val2 ||
                c.id === val2
            );
          }
          if (s.includes('CODE')) {
            const targetCode = String(argsArray[0] || '').toUpperCase();
            return this.customers.filter((c) => c.code.toUpperCase() === targetCode);
          }
          if (s.includes('MERCHANT_ID')) {
            return this.customers.filter((c) => c.merchant_id === argsArray[0]);
          }
          return [];
        }
        return [...this.customers];
      }

      if (s.includes('FROM TRANSACTIONS')) {
        if (s.includes('WHERE')) {
          if (s.includes('MERCHANT_ID')) {
            return this.transactions
              .filter((t) => t.merchant_id === argsArray[0])
              .sort((a, b) => b.created_at.localeCompare(a.created_at));
          }
          return [];
        }
        return [...this.transactions].sort((a, b) => b.created_at.localeCompare(a.created_at));
      }

      if (s.includes('FROM LEADS')) {
        return [...this.leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
    }

    if (s.startsWith('INSERT')) {
      if (s.includes('INTO USERS')) {
        const item = {
          id: argsArray[0],
          email: argsArray[1],
          password_hash: argsArray[2],
          name: argsArray[3],
          phone: argsArray[4] || '',
          created_at: argsArray[5] || new Date().toISOString(),
        };
        const itemEmail = String(item.email || '').toLowerCase();
        const exists = this.users.find(
          (u) => u.id === item.id || String(u.email || '').toLowerCase() === itemEmail
        );
        if (!exists) this.users.push(item);
        return [];
      }

      if (s.includes('INTO MERCHANTS')) {
        const hasOwner = s.includes('OWNER_ID');
        let item: any;
        if (hasOwner) {
          item = {
            id: argsArray[0],
            owner_id: argsArray[1],
            name: argsArray[2],
            slug: argsArray[3],
            email: argsArray[4],
            phone: argsArray[5],
            password_hash: argsArray[6],
            category: argsArray[7] || 'Commerce',
            address: argsArray[8] || 'Alger',
            card_bg_color: argsArray[9] || '#1a1a1a',
            card_accent_color: argsArray[10] || '#f85b04',
            card_cover_image: argsArray[11] || '/landing/cartes/ongles.webp',
            card_logo_image: argsArray[12] || '/brand/logo-mark.png',
            google_review_url: argsArray[13] || '',
            geo_notification_text: argsArray[14] || '',
            created_at: argsArray[15] || new Date().toISOString(),
          };
        } else {
          item = {
            id: argsArray[0],
            owner_id: 'usr-default',
            name: argsArray[1],
            slug: argsArray[2],
            email: argsArray[3],
            phone: argsArray[4],
            password_hash: argsArray[5],
            category: argsArray[6] || 'Commerce',
            address: argsArray[7] || 'Alger',
            card_bg_color: argsArray[8] || '#1a1a1a',
            card_accent_color: argsArray[9] || '#f85b04',
            card_cover_image: argsArray[10] || '/landing/cartes/ongles.webp',
            card_logo_image: argsArray[11] || '/brand/logo-mark.png',
            google_review_url: argsArray[12] || '',
            geo_notification_text: argsArray[13] || '',
            created_at: argsArray[14] || new Date().toISOString(),
          };
        }
        this.merchants = this.merchants.filter((m) => m.id !== item.id && m.email !== item.email);
        this.merchants.push(item);
        return [];
      }

      if (s.includes('INTO LOYALTY_PROGRAMS')) {
        const item = {
          id: argsArray[0],
          merchant_id: argsArray[1],
          name: argsArray[2],
          mode: argsArray[3],
          points_per_dzd: argsArray[4],
          stamps_per_visit: argsArray[5],
          stamps_target: argsArray[6],
          welcome_bonus: argsArray[7],
          referral_bonus: argsArray[8],
          google_review_bonus: argsArray[9],
          rewards_json: argsArray[10],
          updated_at: argsArray[11] || new Date().toISOString(),
        };
        const idx = this.loyalty_programs.findIndex((p) => p.merchant_id === item.merchant_id);
        if (idx >= 0) this.loyalty_programs[idx] = item;
        else this.loyalty_programs.push(item);
        return [];
      }

      if (s.includes('INTO CUSTOMERS')) {
        const item = {
          id: argsArray[0],
          merchant_id: argsArray[1],
          code: argsArray[2],
          name: argsArray[3],
          phone: argsArray[4],
          email: argsArray[5] || '',
          points: Number(argsArray[6] || 0),
          visits: Number(argsArray[7] || 1),
          total_spent: Number(argsArray[8] || 0),
          wallet_added: argsArray[9] || 'web',
          google_review_done: Number(argsArray[10] || 0),
          unlocked_rewards_json: argsArray[11] || '[]',
          member_since: argsArray[12],
          last_visit: argsArray[13],
          created_at: argsArray[14] || new Date().toISOString(),
        };
        this.customers.push(item);
        return [];
      }

      if (s.includes('INTO TRANSACTIONS')) {
        const item = {
          id: argsArray[0],
          merchant_id: argsArray[1],
          customer_id: argsArray[2],
          customer_code: argsArray[3],
          customer_name: argsArray[4],
          type: argsArray[5],
          delta: Number(argsArray[6]),
          amount_dzd: Number(argsArray[7] || 0),
          reward_title: argsArray[8] || null,
          unlocked_reward: argsArray[9] || null,
          operator: argsArray[10] || 'Caisse Principale',
          reference: argsArray[11] || null,
          created_at: argsArray[12] || new Date().toISOString(),
        };
        this.transactions.push(item);
        return [];
      }

      if (s.includes('INTO LEADS')) {
        const item = {
          id: argsArray[0],
          source: argsArray[1],
          prenom: argsArray[2],
          commerce_name: argsArray[3],
          phone: argsArray[4],
          email: argsArray[5] || '',
          ville: argsArray[6] || 'Alger',
          points_de_vente: argsArray[7] || '1',
          rappel_quand: argsArray[8] || 'Peu importe',
          sim_clients_par_jour: argsArray[9] ?? null,
          sim_panier_moyen: argsArray[10] ?? null,
          sim_gain_mensuel_dzd: argsArray[11] ?? null,
          created_at: argsArray[12] || new Date().toISOString(),
        };
        this.leads.push(item);
        return [];
      }
    }

    if (s.startsWith('UPDATE')) {
      if (s.includes('CUSTOMERS') && s.includes('POINTS = POINTS + ?')) {
        const delta = Number(argsArray[0]);
        const amount = Number(argsArray[1] || 0);
        const unlockedJson = String(argsArray[2] || '[]');
        const lastVisit = String(argsArray[3]);
        const custId = String(argsArray[4]);
        const c = this.customers.find((x) => x.id === custId);
        if (c) {
          c.points += delta;
          c.visits += 1;
          c.total_spent += amount;
          c.unlocked_rewards_json = unlockedJson;
          c.lastVisit = lastVisit;
        }
        return [];
      }

      if (s.includes('CUSTOMERS') && s.includes('POINTS = MAX(0, POINTS - ?)')) {
        const delta = Number(argsArray[0]);
        const unlockedJson = String(argsArray[1] || '[]');
        const lastVisit = String(argsArray[2]);
        const custId = String(argsArray[3]);
        const c = this.customers.find((x) => x.id === custId);
        if (c) {
          c.points = Math.max(0, c.points - delta);
          c.unlocked_rewards_json = unlockedJson;
          c.lastVisit = lastVisit;
        }
        return [];
      }

      if (s.includes('LOYALTY_PROGRAMS')) {
        const mid = argsArray[argsArray.length - 1];
        const p = this.loyalty_programs.find((x) => x.merchant_id === mid);
        if (p && argsArray.length >= 10) {
          p.name = argsArray[0];
          p.mode = argsArray[1];
          p.points_per_dzd = argsArray[2];
          p.stamps_per_visit = argsArray[3];
          p.stamps_target = argsArray[4];
          p.welcome_bonus = argsArray[5];
          p.referral_bonus = argsArray[6];
          p.google_review_bonus = argsArray[7];
          p.rewards_json = argsArray[8];
          p.updated_at = argsArray[9];
        }
        return [];
      }

      if (s.includes('MERCHANTS') && s.includes('OWNER_ID = ?')) {
        const newOwner = String(argsArray[0]);
        const matchVal = String(argsArray[1]);
        this.merchants.forEach((m) => {
          if (m.id === matchVal || m.email.toLowerCase() === matchVal.toLowerCase()) {
            m.owner_id = newOwner;
          }
        });
        return [];
      }
    }

    if (s.startsWith('DELETE')) {
      if (s.includes('FROM MERCHANTS')) {
        if (s.includes('COM-1') || s.includes('COM-SUPPORT') || s.includes('IN')) {
          this.merchants = this.merchants.filter(
            (m) =>
              !['com-1', 'com-support'].includes(m.id) &&
              !['gourmand-klzq', 'fidelio-alger'].includes(m.slug)
          );
        }
        return [];
      }
      if (s.includes('FROM LOYALTY_PROGRAMS')) {
        this.loyalty_programs = this.loyalty_programs.filter(
          (p) => !['com-1', 'com-support'].includes(p.merchant_id)
        );
        return [];
      }
      if (s.includes('FROM CUSTOMERS')) {
        this.customers = this.customers.filter(
          (c) => !['com-1', 'com-support'].includes(c.merchant_id)
        );
        return [];
      }
      if (s.includes('FROM TRANSACTIONS')) {
        this.transactions = this.transactions.filter(
          (t) => !['com-1', 'com-support'].includes(t.merchant_id)
        );
        return [];
      }
    }

    return [];
  }
}

const memoryDbInstance = new MemoryDatabase();

function createMemoryFallbackClient(): Client {
  return {
    async execute(stmt: any): Promise<ResultSet> {
      const sql = typeof stmt === 'string' ? stmt : stmt.sql;
      const args = typeof stmt === 'string' ? [] : stmt.args || [];
      const rows = memoryDbInstance.query(sql, args);
      return {
        columns: [],
        columnTypes: [],
        rows,
        rowsAffected: 1,
        lastInsertRowid: undefined,
      } as unknown as ResultSet;
    },
    async executeMultiple(_sql: string): Promise<void> {},
    async batch(stmts: any[]): Promise<ResultSet[]> {
      const results: ResultSet[] = [];
      const self = this as any;
      for (const s of stmts) {
        results.push(await self.execute(s));
      }
      return results;
    },
    async transaction(): Promise<any> {
      return this;
    },
    close() {},
    closed: false,
    protocol: 'memory',
  } as unknown as Client;
}

export function getClient(): Client {
  if (activeClient) return activeClient;

  // 1. Check if Turso cloud credentials are provided
  const tursoUrl =
    currentDbUrl || (typeof process !== 'undefined' ? process.env?.TURSO_DATABASE_URL : undefined);
  const tursoToken =
    currentAuthToken ||
    (typeof process !== 'undefined' ? process.env?.TURSO_AUTH_TOKEN : undefined);

  if (tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://'))) {
    activeClient = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return activeClient;
  }

  // 2. If running on Cloudflare Workers without TURSO_DATABASE_URL, use MemoryDatabase
  // to avoid URL_SCHEME_NOT_SUPPORTED on file: URLs.
  if (isCloudflareRuntime()) {
    activeClient = createMemoryFallbackClient();
    return activeClient;
  }

  // 3. Otherwise we are running in Node.js (local dev / test): use local SQLite file
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const localPath = path.join(dataDir, 'fidelio.sqlite');
    activeClient = createClient({
      url: `file:${localPath}`,
    });
    return activeClient;
  } catch {
    activeClient = createMemoryFallbackClient();
    return activeClient;
  }
}

export const client: Client = new Proxy({} as unknown as Client, {
  get(_target, prop) {
    const c = getClient();
    const val = (c as any)[prop];
    if (typeof val === 'function') {
      return val.bind(c);
    }
    return val;
  },
});

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
  if (migrationDone) return;
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    try {
      const cli = getClient();

      // SQLite Concurrency & Integrity: Enable WAL mode, busy timeout, and foreign keys
      try {
        await cli.execute('PRAGMA journal_mode = WAL;');
        await cli.execute('PRAGMA busy_timeout = 5000;');
        await cli.execute('PRAGMA foreign_keys = ON;');
      } catch {
        // Safe fallback for in-memory or Turso edge runtimes
      }

      await cli.executeMultiple(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS merchants (
          id TEXT PRIMARY KEY,
          owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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

      // 1. Ensure owner_id column exists on merchants table for SQLite
      try {
        await cli.execute('ALTER TABLE merchants ADD COLUMN owner_id TEXT REFERENCES users(id) ON DELETE CASCADE;');
      } catch {
        // Column already exists or table freshly created
      }

      // 2. Multi-tenant Cleanup: Purge hardcoded demo seeds (Gourmand, Fidelio Alger)
      try {
        await cli.execute("DELETE FROM merchants WHERE id IN ('com-1', 'com-support') OR slug IN ('gourmand-klzq', 'fidelio-alger');");
        await cli.execute("DELETE FROM loyalty_programs WHERE merchant_id IN ('com-1', 'com-support');");
        await cli.execute("DELETE FROM customers WHERE merchant_id IN ('com-1', 'com-support');");
        await cli.execute("DELETE FROM transactions WHERE merchant_id IN ('com-1', 'com-support');");
      } catch {
        // Safe ignore
      }

      // 3. Multi-tenant Backfill: Auto-assign user accounts to any unassigned legitimate merchants
      try {
        const unownedResult = await cli.execute(
          "SELECT id, email, password_hash, name, phone, created_at FROM merchants WHERE owner_id IS NULL OR owner_id = '';"
        );
        for (const row of unownedResult.rows) {
          const r = row as any;
          const userId = `usr-${r.id.replace('com-', '')}`;
          await cli.execute({
            sql: 'INSERT OR IGNORE INTO users (id, email, password_hash, name, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            args: [
              userId,
              r.email,
              r.password_hash,
              r.name,
              r.phone || '',
              r.created_at || new Date().toISOString(),
            ],
          });
          await cli.execute({
            sql: 'UPDATE merchants SET owner_id = ? WHERE id = ?',
            args: [userId, r.id],
          });
        }
      } catch {
        // Safe ignore
      }

      migrationDone = true;
    } catch (err) {
      console.warn('[Fidelio DB] Migration notice:', err);
    } finally {
      migrationPromise = null;
    }
  })();

  return migrationPromise;
}
