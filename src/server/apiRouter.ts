import type { IncomingMessage, ServerResponse } from 'node:http';
import * as crypto from 'node:crypto';
import { dbQueryOne, dbQueryAll, dbRun, hashPassword } from '../db/index.ts';
import {
  LeadSchema,
  RegisterMerchantSchema,
  LoginMerchantSchema,
  UpdateProgramSchema,
  JoinCustomerSchema,
  ScanTransactionSchema,
} from './validation.ts';

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface MerchantRow {
  id: string;
  owner_id?: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  password_hash: string;
  category: string;
  address: string;
  card_bg_color: string;
  card_accent_color: string;
  card_cover_image: string;
  card_logo_image: string;
  google_review_url: string;
  geo_notification_text: string;
  created_at: string;
}

interface LoyaltyProgramRow {
  id: string;
  merchant_id: string;
  name: string;
  mode: 'points' | 'tampons';
  points_per_dzd: number;
  stamps_per_visit: number;
  stamps_target: number;
  welcome_bonus: number;
  referral_bonus: number;
  google_review_bonus: number;
  rewards_json: string;
  updated_at: string;
}

interface CustomerRow {
  id: string;
  merchant_id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  visits: number;
  total_spent: number;
  wallet_added: 'apple' | 'google' | 'web';
  google_review_done: number;
  unlocked_rewards_json: string;
  member_since: string;
  last_visit: string;
  created_at: string;
}

interface TransactionRow {
  id: string;
  merchant_id: string;
  customer_id: string;
  customer_code: string;
  customer_name: string;
  type: 'earn' | 'redeem';
  delta: number;
  amount_dzd: number;
  reward_title: string | null;
  unlocked_reward: string | null;
  operator: string;
  reference: string | null;
  created_at: string;
}

export interface RewardTierDTO {
  id: string;
  title: string;
  cost: number;
  description: string;
  category: string;
  redemptions: number;
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base || 'commerce'}-${suffix}`;
}

async function generateUniqueCustomerCode(): Promise<string> {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = 'C-';
    for (let i = 0; i < 6; i++) {
      code += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    const exists = await dbQueryOne<{ id: string }>('SELECT id FROM customers WHERE code = ?', [code]);
    if (!exists) return code;
  }
  return `C-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function formatMerchantDTO(m: MerchantRow, p?: LoyaltyProgramRow) {
  const rewards: RewardTierDTO[] = p?.rewards_json ? JSON.parse(p.rewards_json) : [];
  return {
    id: m.id,
    ownerId: m.owner_id ?? '',
    name: m.name,
    slug: m.slug,
    email: m.email,
    phone: m.phone,
    category: m.category,
    address: m.address,
    programId: p?.id ?? `prog-${m.id}`,
    programName: p?.name ?? `Programme ${m.name}`,
    mode: (p?.mode ?? 'tampons') as 'points' | 'tampons',
    pointsPerMad: p?.points_per_dzd ?? 1,
    pointsPerDzd: p?.points_per_dzd ?? 1,
    stampsPerVisit: p?.stamps_per_visit ?? 1,
    stampsTarget: p?.stamps_target ?? 10,
    welcomeBonus: p?.welcome_bonus ?? 0,
    referralBonus: p?.referral_bonus ?? 0,
    googleReviewBonus: p?.google_review_bonus ?? 0,
    googleReviewUrl: m.google_review_url,
    cardBgColor: m.card_bg_color,
    cardAccentColor: m.card_accent_color,
    cardCoverImage: m.card_cover_image,
    cardLogoImage: m.card_logo_image,
    geoNotificationText: m.geo_notification_text,
    rewards,
  };
}

const JWT_SECRET =
  (typeof process !== 'undefined' && process.env?.JWT_SECRET) ||
  'fidelio_super_secure_multi_tenant_secret_2026';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
}

export function createAuthToken(session: AuthSession): string {
  const payload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(b64Payload).digest('base64url');
  return `${b64Payload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthSession | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2 && parts.length !== 3) return null;
    const b64Payload = parts.length === 3 ? parts[1] : parts[0];
    const signature = parts.length === 3 ? parts[2] : parts[1];
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(b64Payload)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export function getSessionFromHeaders(
  headers?: Record<string, string | string[] | undefined>,
  urlObj?: URL
): AuthSession | null {
  let authHeader = headers?.['authorization'] || headers?.['Authorization'];
  if (Array.isArray(authHeader)) authHeader = authHeader[0];
  let token = '';
  if (authHeader && typeof authHeader === 'string') {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  }
  if (!token && urlObj) {
    token = urlObj.searchParams.get('token') || '';
  }
  if (!token) return null;
  return verifyAuthToken(token);
}

async function getMerchantWithProgram(
  idOrSlug?: string,
  ownerId?: string
): Promise<{
  merchant: MerchantRow;
  program: LoyaltyProgramRow;
} | null> {
  let merchant: MerchantRow | undefined;
  if (idOrSlug && ownerId) {
    merchant = await dbQueryOne<MerchantRow>(
      'SELECT * FROM merchants WHERE (id = ? OR slug = ?) AND owner_id = ?',
      [idOrSlug, idOrSlug, ownerId]
    );
  } else if (idOrSlug) {
    merchant = await dbQueryOne<MerchantRow>(
      'SELECT * FROM merchants WHERE id = ? OR slug = ?',
      [idOrSlug, idOrSlug]
    );
  } else if (ownerId) {
    merchant = await dbQueryOne<MerchantRow>(
      'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1',
      [ownerId]
    );
  }

  if (!merchant) return null;

  let program = await dbQueryOne<LoyaltyProgramRow>(
    'SELECT * FROM loyalty_programs WHERE merchant_id = ?',
    [merchant.id]
  );

  if (!program) {
    const now = new Date().toISOString();
    const progId = `prog-${merchant.id}`;
    await dbRun(
      `INSERT INTO loyalty_programs (
        id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
        welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        progId,
        merchant.id,
        `Programme ${merchant.name}`,
        'tampons',
        1,
        1,
        10,
        0,
        0,
        0,
        '[]',
        now,
      ]
    );
    program = (await dbQueryOne<LoyaltyProgramRow>('SELECT * FROM loyalty_programs WHERE id = ?', [progId]))!;
  }

  return { merchant, program };
}

function formatCustomerDTO(c: CustomerRow) {
  let unlockedRewards: string[] = [];
  try {
    unlockedRewards = JSON.parse(c.unlocked_rewards_json || '[]');
  } catch {
    unlockedRewards = [];
  }
  return {
    id: c.id,
    merchantId: c.merchant_id,
    code: c.code,
    name: c.name,
    phone: c.phone,
    email: c.email,
    points: c.points,
    visits: c.visits,
    totalSpent: c.total_spent,
    memberSince: c.member_since,
    lastVisit: c.last_visit,
    walletAdded: c.wallet_added,
    googleReviewDone: Boolean(c.google_review_done),
    unlockedRewards,
    createdAt: c.created_at,
  };
}

function formatTransactionDTO(t: TransactionRow) {
  const d = new Date(t.created_at);
  const timeStr = Number.isNaN(d.getTime())
    ? t.created_at
    : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return {
    id: t.id,
    merchantId: t.merchant_id,
    customerId: t.customer_id,
    customerName: t.customer_name,
    customerCode: t.customer_code,
    type: t.type,
    delta: t.delta,
    amountDzd: t.amount_dzd,
    rewardTitle: t.reward_title ?? undefined,
    unlockedReward: t.unlocked_reward ?? undefined,
    operator: t.operator,
    reference: t.reference ?? undefined,
    timestamp: timeStr,
    createdAt: t.created_at,
    synced: true,
  };
}

async function internalHandleApiRequest(
  method: string,
  urlObj: URL,
  pathname: string,
  body?: unknown,
  headers?: Record<string, string | string[] | undefined>
): Promise<ApiResponse> {
  try {
    /* ----------------------------------------------------------------------
       GET /api/health — System Health check
       ---------------------------------------------------------------------- */
    if (method === 'GET' && pathname === '/api/health') {
      return {
        status: 200,
        data: {
          ok: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : 0,
        },
      };
    }

    /* ----------------------------------------------------------------------
       GET /api/state — Full initial state strictly isolated per authenticated user
       ---------------------------------------------------------------------- */
    if (method === 'GET' && pathname === '/api/state') {
      const session = getSessionFromHeaders(headers, urlObj);
      if (!session) {
        return {
          status: 401,
          data: {
            ok: false,
            error: 'Session non authentifiée. Veuillez vous connecter pour accéder à votre espace.',
            commerces: [],
            activeCommerce: null,
            rewards: [],
            customers: [],
            transactions: [],
            leads: [],
          },
        };
      }

      // 1. Fetch ONLY merchants owned by this authenticated user
      let userMerchants = await dbQueryAll<MerchantRow>(
        'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC',
        [session.userId]
      );

      // Backfill edge case: if existing merchant was created before owner_id migration
      if (userMerchants.length === 0 && session.email) {
        const matchingByEmail = await dbQueryAll<MerchantRow>(
          'SELECT * FROM merchants WHERE LOWER(email) = LOWER(?)',
          [session.email]
        );
        if (matchingByEmail.length > 0) {
          for (const m of matchingByEmail) {
            await dbRun('UPDATE merchants SET owner_id = ? WHERE id = ?', [session.userId, m.id]);
          }
          userMerchants = await dbQueryAll<MerchantRow>(
            'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC',
            [session.userId]
          );
        }
      }

      if (userMerchants.length === 0) {
        return {
          status: 200,
          data: {
            ok: true,
            commerces: [],
            activeCommerce: null,
            rewards: [],
            customers: [],
            transactions: [],
            leads: [],
          },
        };
      }

      const commerces = await Promise.all(
        userMerchants.map(async (m) => {
          const prog = await dbQueryOne<LoyaltyProgramRow>(
            'SELECT * FROM loyalty_programs WHERE merchant_id = ?',
            [m.id]
          );
          return formatMerchantDTO(m, prog);
        })
      );

      const requestedMerchant = urlObj.searchParams.get('merchant') || undefined;
      let activePair: { merchant: MerchantRow; program: LoyaltyProgramRow } | null = null;
      if (requestedMerchant) {
        activePair = await getMerchantWithProgram(requestedMerchant, session.userId);
      }
      if (!activePair) {
        activePair = await getMerchantWithProgram(userMerchants[0].id, session.userId);
      }
      if (!activePair) {
        return {
          status: 200,
          data: {
            ok: true,
            commerces,
            activeCommerce: null,
            rewards: [],
            customers: [],
            transactions: [],
            leads: [],
          },
        };
      }

      const activeDto = formatMerchantDTO(activePair.merchant, activePair.program);
      const custRows = await dbQueryAll<CustomerRow>(
        'SELECT * FROM customers WHERE merchant_id = ? ORDER BY created_at DESC',
        [activePair.merchant.id]
      );
      const txRows = await dbQueryAll<TransactionRow>(
        'SELECT * FROM transactions WHERE merchant_id = ? ORDER BY created_at DESC',
        [activePair.merchant.id]
      );

      return {
        status: 200,
        data: {
          ok: true,
          commerces,
          activeCommerce: activeDto,
          rewards: activeDto.rewards,
          customers: custRows.map(formatCustomerDTO),
          transactions: txRows.map(formatTransactionDTO),
          leads: [],
        },
      };
    }

    /* ----------------------------------------------------------------------
       GET /api/merchants & POST /api/merchants (Multi-Store Point of Sale)
       ---------------------------------------------------------------------- */
    if (pathname === '/api/merchants') {
      const session = getSessionFromHeaders(headers, urlObj);
      if (!session) {
        return { status: 401, data: { ok: false, error: 'Session non authentifiée.' } };
      }

      if (method === 'GET') {
        const userMerchants = await dbQueryAll<MerchantRow>(
          'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC',
          [session.userId]
        );
        const dtos = await Promise.all(
          userMerchants.map(async (m) => {
            const prog = await dbQueryOne<LoyaltyProgramRow>(
              'SELECT * FROM loyalty_programs WHERE merchant_id = ?',
              [m.id]
            );
            return formatMerchantDTO(m, prog);
          })
        );
        return { status: 200, data: { ok: true, commerces: dtos } };
      }

      if (method === 'POST') {
        const { name, category, address, mode } = (body as any) || {};
        if (!name || typeof name !== 'string') {
          return { status: 400, data: { ok: false, error: 'Nom de l’établissement requis.' } };
        }
        const id = `com-${crypto.randomUUID().slice(0, 8)}`;
        const slug = slugify(name);
        const now = new Date().toISOString();

        await dbRun(
          `INSERT INTO merchants (
            id, owner_id, name, slug, email, phone, password_hash, category, address,
            card_bg_color, card_accent_color, card_cover_image, card_logo_image,
            google_review_url, geo_notification_text, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            session.userId,
            name.trim(),
            slug,
            `${slug}@fidelio.local`,
            '',
            hashPassword(crypto.randomUUID()),
            category || 'Commerce',
            address || 'Alger',
            '#1a1a1a',
            '#f85b04',
            '/landing/cartes/ongles.webp',
            '/brand/logo-mark.png',
            'https://search.google.com/local/writereview?placeid=',
            `Bienvenue chez ${name.trim()} !`,
            now,
          ]
        );

        const progId = `prog-${id}`;
        await dbRun(
          `INSERT INTO loyalty_programs (
            id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
            welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            progId,
            id,
            `Programme ${name.trim()}`,
            mode === 'points' ? 'points' : 'tampons',
            1,
            1,
            10,
            0,
            0,
            0,
            '[]',
            now,
          ]
        );

        const pair = (await getMerchantWithProgram(id, session.userId))!;
        return {
          status: 201,
          data: { ok: true, merchant: formatMerchantDTO(pair.merchant, pair.program) },
        };
      }
    }

    /* ----------------------------------------------------------------------
       FLUX A : POST /api/leads & GET /api/leads
       ---------------------------------------------------------------------- */
    if (pathname === '/api/leads') {
      if (method === 'GET') {
        const rows = await dbQueryAll('SELECT * FROM leads ORDER BY created_at DESC');
        return { status: 200, data: { ok: true, leads: rows } };
      }

      if (method === 'POST') {
        const parsed = LeadSchema.safeParse(body);
        if (!parsed.success) {
          return {
            status: 400,
            data: {
              ok: false,
              error: parsed.error.issues[0]?.message || 'Données du formulaire invalides',
              issues: parsed.error.issues,
            },
          };
        }

        const d = parsed.data;
        const id = `lead-${crypto.randomUUID()}`;
        const now = new Date().toISOString();

        await dbRun(
          `INSERT INTO leads (
            id, source, prenom, commerce_name, phone, email, ville,
            points_de_vente, rappel_quand, sim_clients_par_jour, sim_panier_moyen,
            sim_gain_mensuel_dzd, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            d.source,
            d.prenom,
            d.commerceName,
            d.phone,
            d.email || '',
            d.ville,
            d.pointsDeVente,
            d.rappelQuand,
            d.simClientsParJour ?? null,
            d.simPanierMoyen ?? null,
            d.simGainMensuelDzd ?? null,
            now,
          ]
        );

        const created = await dbQueryOne('SELECT * FROM leads WHERE id = ?', [id]);
        return {
          status: 201,
          data: {
            ok: true,
            message: 'Lead enregistré avec succès en base de données.',
            lead: created,
          },
        };
      }
    }

    /* ----------------------------------------------------------------------
       FLUX B : POST /api/auth/register, POST /api/auth/login, POST /api/auth/google
       ---------------------------------------------------------------------- */
    if (method === 'POST' && pathname === '/api/auth/register') {
      const parsed = RegisterMerchantSchema.safeParse(body);
      if (!parsed.success) {
        return {
          status: 400,
          data: {
            ok: false,
            error: parsed.error.issues[0]?.message || 'Données d’inscription invalides',
            issues: parsed.error.issues,
          },
        };
      }

      const d = parsed.data;
      const cleanEmail = d.email.trim().toLowerCase();

      // Check if email already exists in users or merchants
      const existingUser = await dbQueryOne<UserRow>(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
        [cleanEmail]
      );
      const existingMerchant = await dbQueryOne<MerchantRow>(
        'SELECT id FROM merchants WHERE LOWER(email) = LOWER(?)',
        [cleanEmail]
      );

      if (existingUser || existingMerchant) {
        return {
          status: 409,
          data: { ok: false, error: 'Un compte commerçant existe déjà avec cette adresse email.' },
        };
      }

      const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
      const merchantId = `com-${crypto.randomUUID().slice(0, 8)}`;
      const slug = slugify(d.name);
      const now = new Date().toISOString();
      const passwordHash = hashPassword(d.password);

      // 1. Create User account
      await dbRun(
        `INSERT INTO users (id, email, password_hash, name, phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, cleanEmail, passwordHash, d.name.trim(), d.phone.trim(), now]
      );

      // 2. Create primary Merchant establishment owned by this user
      await dbRun(
        `INSERT INTO merchants (
          id, owner_id, name, slug, email, phone, password_hash, category, address,
          card_bg_color, card_accent_color, card_cover_image, card_logo_image,
          google_review_url, geo_notification_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          merchantId,
          userId,
          d.name,
          slug,
          cleanEmail,
          d.phone,
          passwordHash,
          d.category,
          d.address,
          '#1a1a1a',
          '#f85b04',
          '/landing/cartes/ongles.webp',
          '/brand/logo-mark.png',
          'https://search.google.com/local/writereview?placeid=',
          `Bienvenue chez ${d.name} !`,
          now,
        ]
      );

      const defaultRewards: RewardTierDTO[] = [
        {
          id: `rew-${crypto.randomUUID().slice(0, 6)}`,
          title: 'Boisson ou Dessert offert',
          cost: d.mode === 'tampons' ? 5 : 50,
          description: 'Premier palier de fidélité',
          category: 'Cadeau',
          redemptions: 0,
        },
        {
          id: `rew-${crypto.randomUUID().slice(0, 6)}`,
          title: 'Menu Complet offert',
          cost: d.mode === 'tampons' ? 10 : 100,
          description: 'Palier VIP',
          category: 'VIP',
          redemptions: 0,
        },
      ];

      const progId = `prog-${merchantId}`;
      await dbRun(
        `INSERT INTO loyalty_programs (
          id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
          welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          progId,
          merchantId,
          `Programme ${d.name}`,
          d.mode,
          1,
          1,
          10,
          0,
          0,
          0,
          JSON.stringify(defaultRewards),
          now,
        ]
      );

      const pair = (await getMerchantWithProgram(merchantId, userId))!;
      const token = createAuthToken({
        userId,
        email: cleanEmail,
        name: d.name.trim(),
      });

      return {
        status: 201,
        data: {
          ok: true,
          token,
          user: { id: userId, email: cleanEmail, name: d.name.trim() },
          merchant: formatMerchantDTO(pair.merchant, pair.program),
        },
      };
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const parsed = LoginMerchantSchema.safeParse(body);
      if (!parsed.success) {
        return {
          status: 400,
          data: {
            ok: false,
            error: parsed.error.issues[0]?.message || 'Identifiants invalides',
          },
        };
      }

      const d = parsed.data;
      const cleanEmail = d.email.trim().toLowerCase();

      // Find user
      let user = await dbQueryOne<UserRow>(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
        [cleanEmail]
      );

      // Backfill from merchant if user registered prior to users table
      if (!user) {
        const legacyMerchant = await dbQueryOne<MerchantRow>(
          'SELECT * FROM merchants WHERE LOWER(email) = LOWER(?)',
          [cleanEmail]
        );
        if (legacyMerchant) {
          const legacyUserId = `usr-${legacyMerchant.id.replace('com-', '')}`;
          await dbRun(
            'INSERT OR IGNORE INTO users (id, email, password_hash, name, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [legacyUserId, cleanEmail, legacyMerchant.password_hash, legacyMerchant.name, legacyMerchant.phone, legacyMerchant.created_at]
          );
          await dbRun('UPDATE merchants SET owner_id = ? WHERE id = ?', [legacyUserId, legacyMerchant.id]);
          user = (await dbQueryOne<UserRow>('SELECT * FROM users WHERE id = ?', [legacyUserId]))!;
        }
      }

      if (!user) {
        return {
          status: 401,
          data: { ok: false, error: 'Aucun compte trouvé avec cette adresse email.' },
        };
      }

      const expectedHash = hashPassword(d.password);
      if (user.password_hash !== expectedHash) {
        return {
          status: 401,
          data: { ok: false, error: 'Mot de passe incorrect.' },
        };
      }

      let userMerchants = await dbQueryAll<MerchantRow>(
        'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC',
        [user.id]
      );

      if (userMerchants.length === 0) {
        // Link any unassigned merchant matching email
        await dbRun('UPDATE merchants SET owner_id = ? WHERE LOWER(email) = LOWER(?)', [user.id, cleanEmail]);
        userMerchants = await dbQueryAll<MerchantRow>(
          'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC',
          [user.id]
        );
      }

      const primaryMerchant = userMerchants[0];
      const pair = primaryMerchant ? await getMerchantWithProgram(primaryMerchant.id, user.id) : null;
      const token = createAuthToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return {
        status: 200,
        data: {
          ok: true,
          token,
          user: { id: user.id, email: user.email, name: user.name },
          merchant: pair ? formatMerchantDTO(pair.merchant, pair.program) : null,
        },
      };
    }

    if (method === 'POST' && pathname === '/api/auth/google') {
      const { email, name, googleId, photoURL } = (body as any) || {};
      if (!email || typeof email !== 'string') {
        return {
          status: 400,
          data: { ok: false, error: 'Email requis pour la connexion Google.' },
        };
      }

      const cleanEmail = email.trim().toLowerCase();
      let user = await dbQueryOne<UserRow>(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
        [cleanEmail]
      );

      const now = new Date().toISOString();
      if (!user) {
        const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
        const userName = name?.trim() || cleanEmail.split('@')[0] || 'Commerçant Fidelio';
        await dbRun(
          'INSERT INTO users (id, email, password_hash, name, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, cleanEmail, hashPassword(`google_${googleId || 'oauth'}_${Date.now()}`), userName, '', now]
        );
        user = (await dbQueryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId]))!;
      }

      let userMerchants = await dbQueryAll<MerchantRow>(
        'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC',
        [user.id]
      );

      if (userMerchants.length === 0) {
        // Check if legacy merchant exists with this email
        const legacy = await dbQueryOne<MerchantRow>(
          'SELECT * FROM merchants WHERE LOWER(email) = LOWER(?)',
          [cleanEmail]
        );
        if (legacy) {
          await dbRun('UPDATE merchants SET owner_id = ? WHERE id = ?', [user.id, legacy.id]);
        } else {
          // Create new establishment for this Google user
          const merchantId = `com-${crypto.randomUUID().slice(0, 8)}`;
          const baseName = user.name || 'Mon Commerce';
          const baseSlug = slugify(baseName) || 'commerce';
          const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`;

          await dbRun(
            `INSERT INTO merchants (
              id, owner_id, name, slug, email, phone, password_hash, category, address,
              card_bg_color, card_accent_color, card_cover_image, card_logo_image,
              google_review_url, geo_notification_text, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              merchantId,
              user.id,
              baseName,
              slug,
              cleanEmail,
              '+213 5 00 00 00 00',
              hashPassword(`google_${googleId || 'oauth'}`),
              'Commerce',
              'Alger',
              '#1a1a1a',
              '#f85b04',
              '/landing/cartes/ongles.webp',
              photoURL || '/brand/logo-mark.png',
              'https://search.google.com/local/writereview?placeid=',
              `Bienvenue chez ${baseName} ✨`,
              now,
            ]
          );

          await dbRun(
            `INSERT INTO loyalty_programs (
              id, merchant_id, name, mode, points_per_dzd, stamps_per_visit, stamps_target,
              welcome_bonus, referral_bonus, google_review_bonus, rewards_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `prog-${crypto.randomUUID().slice(0, 8)}`,
              merchantId,
              `Programme Fidélité ${baseName}`,
              'tampons',
              1,
              1,
              10,
              0,
              0,
              0,
              JSON.stringify([
                {
                  id: `rew-${Date.now()}-1`,
                  title: 'Café ou Boisson offerte',
                  cost: 5,
                  description: 'Dès 5 tampons validés',
                  category: 'Boisson',
                  redemptions: 0,
                },
              ]),
              now,
            ]
          );
        }

        userMerchants = await dbQueryAll<MerchantRow>(
          'SELECT * FROM merchants WHERE owner_id = ? ORDER BY created_at ASC',
          [user.id]
        );
      }

      const activeMerchant = userMerchants[0];
      const pair = (await getMerchantWithProgram(activeMerchant.id, user.id))!;
      const token = createAuthToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return {
        status: 200,
        data: {
          ok: true,
          token,
          user: { id: user.id, email: user.email, name: user.name },
          merchant: formatMerchantDTO(pair.merchant, pair.program),
        },
      };
    }

    /* ----------------------------------------------------------------------
       FLUX B : GET /api/merchants/:idOrSlug & PUT /api/merchants/:id/program
       ---------------------------------------------------------------------- */
    const merchantProgramMatch = pathname.match(/^\/api\/merchants\/([^/]+)\/program$/);
    if (merchantProgramMatch && (method === 'PUT' || method === 'POST')) {
      const merchantIdOrSlug = decodeURIComponent(merchantProgramMatch[1]);
      const session = getSessionFromHeaders(headers, urlObj);
      if (!session) {
        return {
          status: 401,
          data: { ok: false, error: 'Session non authentifiée. Veuillez vous connecter.' },
        };
      }

      const pair = await getMerchantWithProgram(merchantIdOrSlug);
      if (!pair) {
        return { status: 404, data: { ok: false, error: 'Commerce introuvable.' } };
      }

      if (pair.merchant.owner_id && pair.merchant.owner_id !== session.userId) {
        return {
          status: 403,
          data: {
            ok: false,
            error: 'Accès interdit : cet établissement ne vous appartient pas.',
          },
        };
      }

      const parsed = UpdateProgramSchema.safeParse(body);
      if (!parsed.success) {
        return {
          status: 400,
          data: {
            ok: false,
            error: parsed.error.issues[0]?.message || 'Configuration du programme invalide',
            issues: parsed.error.issues,
          },
        };
      }

      const patch = parsed.data;
      const m = pair.merchant;
      const p = pair.program;
      const now = new Date().toISOString();

      await dbRun(
        `UPDATE merchants SET
          name = ?,
          category = ?,
          address = ?,
          card_bg_color = ?,
          card_accent_color = ?,
          card_cover_image = ?,
          card_logo_image = ?,
          google_review_url = ?,
          geo_notification_text = ?
        WHERE id = ?`,
        [
          patch.name ?? m.name,
          patch.category ?? m.category,
          patch.address ?? m.address,
          patch.cardBgColor ?? m.card_bg_color,
          patch.cardAccentColor ?? m.card_accent_color,
          patch.cardCoverImage ?? m.card_cover_image,
          patch.cardLogoImage ?? m.card_logo_image,
          patch.googleReviewUrl ?? m.google_review_url,
          patch.geoNotificationText ?? m.geo_notification_text,
          m.id,
        ]
      );

      const updatedRewardsJson =
        patch.rewards !== undefined ? JSON.stringify(patch.rewards) : p.rewards_json;
      const nextPointsPerDzd =
        patch.pointsPerDzd ?? patch.pointsPerMad ?? p.points_per_dzd;

      await dbRun(
        `UPDATE loyalty_programs SET
          name = ?,
          mode = ?,
          points_per_dzd = ?,
          stamps_per_visit = ?,
          stamps_target = ?,
          welcome_bonus = ?,
          referral_bonus = ?,
          google_review_bonus = ?,
          rewards_json = ?,
          updated_at = ?
        WHERE merchant_id = ?`,
        [
          patch.programName ?? (patch.name ? `Programme ${patch.name}` : p.name),
          patch.mode ?? p.mode,
          nextPointsPerDzd,
          patch.stampsPerVisit ?? p.stamps_per_visit,
          patch.stampsTarget ?? p.stamps_target,
          patch.welcomeBonus ?? p.welcome_bonus,
          patch.referralBonus ?? p.referral_bonus,
          patch.googleReviewBonus ?? p.google_review_bonus,
          updatedRewardsJson,
          now,
          m.id,
        ]
      );

      const refreshed = (await getMerchantWithProgram(m.id))!;
      const dto = formatMerchantDTO(refreshed.merchant, refreshed.program);
      return {
        status: 200,
        data: {
          ok: true,
          message: 'Programme de fidélité sauvegardé en base de données.',
          merchant: dto,
          rewards: dto.rewards,
        },
      };
    }

    const merchantGetMatch = pathname.match(/^\/api\/merchants\/([^/]+)$/);
    if (merchantGetMatch && method === 'GET') {
      const idOrSlug = decodeURIComponent(merchantGetMatch[1]);
      const session = getSessionFromHeaders(headers, urlObj);
      const pair = await getMerchantWithProgram(idOrSlug);
      if (!pair) {
        return { status: 404, data: { ok: false, error: 'Commerce introuvable.' } };
      }
      if (session && pair.merchant.owner_id && pair.merchant.owner_id !== session.userId) {
        return {
          status: 403,
          data: { ok: false, error: 'Accès interdit : cet établissement ne vous appartient pas.' },
        };
      }
      const dto = formatMerchantDTO(pair.merchant, pair.program);
      const custRows = await dbQueryAll<CustomerRow>(
        'SELECT * FROM customers WHERE merchant_id = ? ORDER BY created_at DESC',
        [pair.merchant.id]
      );
      const txRows = await dbQueryAll<TransactionRow>(
        'SELECT * FROM transactions WHERE merchant_id = ? ORDER BY created_at DESC',
        [pair.merchant.id]
      );

      return {
        status: 200,
        data: {
          ok: true,
          merchant: dto,
          rewards: dto.rewards,
          customers: custRows.map(formatCustomerDTO),
          transactions: txRows.map(formatTransactionDTO),
        },
      };
    }

    /* ----------------------------------------------------------------------
       GET /api/join/:slug — Public Customer Onboarding Info
       ---------------------------------------------------------------------- */
    const joinGetMatch = pathname.match(/^\/api\/join\/([^/]+)$/);
    if (joinGetMatch && method === 'GET') {
      const slug = decodeURIComponent(joinGetMatch[1]);
      const pair = await getMerchantWithProgram(slug);
      if (!pair) {
        return { status: 404, data: { ok: false, error: 'Établissement introuvable.' } };
      }
      return {
        status: 200,
        data: {
          ok: true,
          merchant: formatMerchantDTO(pair.merchant, pair.program),
        },
      };
    }

    /* ----------------------------------------------------------------------
       FLUX C : POST /api/join/:slug & POST /api/customers (Customer Pass & QR)
       ---------------------------------------------------------------------- */
    const joinMatch = pathname.match(/^\/api\/join\/([^/]+)$/);
    if ((joinMatch && method === 'POST') || (pathname === '/api/customers' && method === 'POST')) {
      const slugFromUrl = joinMatch ? decodeURIComponent(joinMatch[1]) : undefined;
      const parsed = JoinCustomerSchema.safeParse(body);
      if (!parsed.success) {
        return {
          status: 400,
          data: {
            ok: false,
            error: parsed.error.issues[0]?.message || 'Données client invalides',
            issues: parsed.error.issues,
          },
        };
      }

      const d = parsed.data;
      const pair = await getMerchantWithProgram(slugFromUrl || d.merchantSlug || d.merchantId);
      if (!pair) {
        return { status: 404, data: { ok: false, error: 'Commerce introuvable.' } };
      }

      const custId = `cust-${crypto.randomUUID().slice(0, 8)}`;
      const code = await generateUniqueCustomerCode();
      const now = new Date();
      const isoNow = now.toISOString();
      const memberSince = now.toLocaleDateString('fr-FR');
      const initialPoints = pair.program.welcome_bonus || 0;

      const rewards: RewardTierDTO[] = JSON.parse(pair.program.rewards_json || '[]');
      const unlockedRewards = rewards
        .filter((r) => initialPoints >= r.cost)
        .map((r) => r.title);

      await dbRun(
        `INSERT INTO customers (
          id, merchant_id, code, name, phone, email, points, visits, total_spent,
          wallet_added, google_review_done, unlocked_rewards_json, member_since, last_visit, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          custId,
          pair.merchant.id,
          code,
          d.name,
          d.phone,
          d.email || '',
          initialPoints,
          1,
          0,
          d.walletAdded || 'web',
          0,
          JSON.stringify(unlockedRewards),
          memberSince,
          'À l’instant',
          isoNow,
        ]
      );

      if (initialPoints > 0) {
        await dbRun(
          `INSERT INTO transactions (
            id, merchant_id, customer_id, customer_code, customer_name,
            type, delta, amount_dzd, reward_title, unlocked_reward, operator, reference, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `tx-${crypto.randomUUID().slice(0, 8)}`,
            pair.merchant.id,
            custId,
            code,
            d.name,
            'earn',
            initialPoints,
            0,
            'Bonus de bienvenue',
            unlockedRewards[0] ?? null,
            'Inscription Pass Mobile',
            null,
            isoNow,
          ]
        );
      }

      const createdRow = (await dbQueryOne<CustomerRow>(
        'SELECT * FROM customers WHERE id = ?',
        [custId]
      ))!;

      return {
        status: 201,
        data: {
          ok: true,
          customer: formatCustomerDTO(createdRow),
          merchant: formatMerchantDTO(pair.merchant, pair.program),
        },
      };
    }

    /* ----------------------------------------------------------------------
       GET /api/customers/:codeOrId & /api/v1/clients/:code
       ---------------------------------------------------------------------- */
    const custGetMatch =
      pathname.match(/^\/api\/customers\/([^/]+)$/) ||
      pathname.match(/^\/api\/v1\/clients\/([^/]+)$/);
    if (custGetMatch && method === 'GET') {
      const codeOrId = decodeURIComponent(custGetMatch[1]).trim();
      const row = await dbQueryOne<CustomerRow>(
        'SELECT * FROM customers WHERE UPPER(code) = UPPER(?) OR id = ?',
        [codeOrId, codeOrId]
      );

      if (!row) {
        return {
          status: 404,
          data: {
            ok: false,
            error: `Aucun client trouvé avec le code "${codeOrId}".`,
            erreur: {
              code: 'client_introuvable',
              message: `Aucun client de ce commerce avec le code ${codeOrId}.`,
            },
          },
        };
      }

      const pair = (await getMerchantWithProgram(row.merchant_id))!;
      const rewards: RewardTierDTO[] = JSON.parse(pair.program.rewards_json || '[]');
      const sortedRewards = [...rewards].sort((a, b) => a.cost - b.cost);
      const disp = sortedRewards
        .filter((r) => row.points >= r.cost)
        .map((r) => ({ titre: r.title, cout: r.cost }));
      const nextRew = sortedRewards.find((r) => r.cost > row.points);

      return {
        status: 200,
        data: {
          ok: true,
          customer: formatCustomerDTO(row),
          merchant: formatMerchantDTO(pair.merchant, pair.program),
          // Public API v1 fields
          code_client: row.code,
          unite: pair.program.mode === 'tampons' ? 'tampons' : 'points',
          solde: row.points,
          recompenses_disponibles: disp,
          prochaine_recompense: nextRew
            ? {
                titre: nextRew.title,
                cout: nextRew.cost,
                manquant: Math.max(0, nextRew.cost - row.points),
              }
            : null,
        },
      };
    }

    /* ----------------------------------------------------------------------
       POST /api/customers/:id/google-review
       ---------------------------------------------------------------------- */
    const googleRevMatch = pathname.match(/^\/api\/customers\/([^/]+)\/google-review$/);
    if (googleRevMatch && method === 'POST') {
      const customerId = decodeURIComponent(googleRevMatch[1]);
      const row = await dbQueryOne<CustomerRow>(
        'SELECT * FROM customers WHERE id = ? OR UPPER(code) = UPPER(?)',
        [customerId, customerId]
      );

      if (!row) {
        return { status: 404, data: { ok: false, error: 'Client introuvable.' } };
      }
      if (row.google_review_done) {
        return { status: 200, data: { ok: true, customer: formatCustomerDTO(row) } };
      }

      const pair = (await getMerchantWithProgram(row.merchant_id))!;
      const bonus = pair.program.google_review_bonus || 0;
      const newPoints = row.points + bonus;

      await dbRun('UPDATE customers SET points = ?, google_review_done = 1 WHERE id = ?', [
        newPoints,
        row.id,
      ]);

      const updated = (await dbQueryOne<CustomerRow>(
        'SELECT * FROM customers WHERE id = ?',
        [row.id]
      ))!;
      return { status: 200, data: { ok: true, customer: formatCustomerDTO(updated) } };
    }

    /* ----------------------------------------------------------------------
       FLUX D : POST /api/scan & POST /api/v1/achats (Scanner Caisse)
       ---------------------------------------------------------------------- */
    if (method === 'POST' && (pathname === '/api/scan' || pathname === '/api/v1/achats')) {
      const raw = (body ?? {}) as Record<string, unknown>;
      const normalizedBody = {
        codeOrId: String(raw.codeOrId ?? raw.code_client ?? ''),
        merchantId: raw.merchantId ? String(raw.merchantId) : undefined,
        type: (raw.type as 'earn' | 'redeem') || 'earn',
        delta:
          raw.delta !== undefined
            ? Number(raw.delta)
            : raw.montant !== undefined
              ? Math.max(1, Math.floor(Number(raw.montant) / 100))
              : 1,
        amountDzd:
          raw.amountDzd !== undefined
            ? Number(raw.amountDzd)
            : raw.montant !== undefined
              ? Number(raw.montant)
              : undefined,
        rewardTitle: raw.rewardTitle ? String(raw.rewardTitle) : undefined,
        operator: raw.operator ? String(raw.operator) : 'Caisse Principale',
        reference: raw.reference ? String(raw.reference) : undefined,
      };

      const parsed = ScanTransactionSchema.safeParse(normalizedBody);
      if (!parsed.success) {
        return {
          status: 400,
          data: {
            ok: false,
            error: parsed.error.issues[0]?.message || 'Requête de scan invalide',
            erreur: {
              code: 'requete_invalide',
              message: parsed.error.issues[0]?.message || 'Paramètres invalides',
            },
          },
        };
      }

      const d = parsed.data;
      const cleanCode = d.codeOrId.trim();
      const customerRow = await dbQueryOne<CustomerRow>(
        'SELECT * FROM customers WHERE UPPER(code) = UPPER(?) OR id = ?',
        [cleanCode, cleanCode]
      );

      if (!customerRow) {
        return {
          status: 404,
          data: {
            ok: false,
            message: `Aucune carte trouvée pour le code "${cleanCode}".`,
            error: `Aucune carte trouvée pour le code "${cleanCode}".`,
            erreur: {
              code: 'client_introuvable',
              message: `Aucun client trouvé avec le code ${cleanCode}.`,
            },
          },
        };
      }

      // Multi-tenant Security: Ensure session user owns the target merchant and customer
      const session = getSessionFromHeaders(headers, urlObj);
      if (session) {
        if (d.merchantId) {
          const targetMerchant = await dbQueryOne<MerchantRow>(
            'SELECT owner_id FROM merchants WHERE id = ? OR slug = ?',
            [d.merchantId, d.merchantId]
          );
          if (targetMerchant?.owner_id && targetMerchant.owner_id !== session.userId) {
            return {
              status: 403,
              data: {
                ok: false,
                error: 'Accès interdit : vous ne pouvez pas scanner pour cet établissement.',
              },
            };
          }
        }
        const custOwner = await dbQueryOne<MerchantRow>(
          'SELECT owner_id FROM merchants WHERE id = ?',
          [customerRow.merchant_id]
        );
        if (custOwner?.owner_id && custOwner.owner_id !== session.userId) {
          return {
            status: 403,
            data: {
              ok: false,
              error: 'Accès interdit : cette carte client appartient à un autre établissement.',
            },
          };
        }
      }

      // Check idempotency if reference is provided
      if (d.reference) {
        const existingTx = await dbQueryOne<TransactionRow>(
          'SELECT * FROM transactions WHERE merchant_id = ? AND reference = ?',
          [customerRow.merchant_id, d.reference]
        );
        if (existingTx) {
          return {
            status: 200,
            data: {
              ok: true,
              statut: 'deja_enregistre',
              message: `Commande ${d.reference} déjà créditée.`,
              customer: formatCustomerDTO(customerRow),
              transaction: formatTransactionDTO(existingTx),
              code_client: customerRow.code,
              reference: d.reference,
              gagne: existingTx.delta,
              solde: customerRow.points,
            },
          };
        }
      }

      const pair = (await getMerchantWithProgram(customerRow.merchant_id))!;
      const rewards: RewardTierDTO[] = JSON.parse(pair.program.rewards_json || '[]');
      const sortedRewards = [...rewards].sort((a, b) => a.cost - b.cost);

      if (d.type === 'redeem' && customerRow.points < d.delta) {
        return {
          status: 422,
          data: {
            ok: false,
            message: `Solde insuffisant (${customerRow.points} disponibles, ${d.delta} requis).`,
            error: `Solde insuffisant (${customerRow.points} disponibles, ${d.delta} requis).`,
          },
        };
      }

      const signedDelta = d.type === 'redeem' ? -Math.abs(d.delta) : Math.abs(d.delta);
      const previousPoints = customerRow.points;
      const newPoints = Math.max(0, previousPoints + signedDelta);
      const newVisits = d.type === 'earn' ? customerRow.visits + 1 : customerRow.visits;
      const addedSpend =
        d.type === 'earn' ? (d.amountDzd !== undefined ? d.amountDzd : Math.abs(d.delta) * 200) : 0;
      const newTotalSpent = customerRow.total_spent + addedSpend;

      // Determine unlocked rewards
      const allUnlockedRewards = sortedRewards.filter((r) => newPoints >= r.cost);
      const newlyUnlocked = sortedRewards.find(
        (r) => previousPoints < r.cost && newPoints >= r.cost
      );
      const unlockedTitles = allUnlockedRewards.map((r) => r.title);

      const nowIso = new Date().toISOString();

      await dbRun(
        `UPDATE customers SET
          points = ?,
          visits = ?,
          total_spent = ?,
          unlocked_rewards_json = ?,
          last_visit = ?
        WHERE id = ?`,
        [
          newPoints,
          newVisits,
          newTotalSpent,
          JSON.stringify(unlockedTitles),
          'À l’instant',
          customerRow.id,
        ]
      );

      // If redeeming a reward, increment its redemptions counter in loyalty_programs
      if (d.type === 'redeem' && d.rewardTitle) {
        const updatedRewards = rewards.map((r) =>
          r.title === d.rewardTitle ? { ...r, redemptions: (r.redemptions || 0) + 1 } : r
        );
        await dbRun(
          'UPDATE loyalty_programs SET rewards_json = ?, updated_at = ? WHERE id = ?',
          [JSON.stringify(updatedRewards), nowIso, pair.program.id]
        );
      }

      const txId = `tx-${crypto.randomUUID().slice(0, 8)}`;
      const unlockedRewardTitle =
        d.type === 'earn'
          ? newlyUnlocked?.title ?? (allUnlockedRewards[0]?.title ?? null)
          : d.rewardTitle ?? null;

      await dbRun(
        `INSERT INTO transactions (
          id, merchant_id, customer_id, customer_code, customer_name,
          type, delta, amount_dzd, reward_title, unlocked_reward, operator, reference, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txId,
          pair.merchant.id,
          customerRow.id,
          customerRow.code,
          customerRow.name,
          d.type,
          signedDelta,
          addedSpend,
          d.rewardTitle ?? null,
          unlockedRewardTitle,
          d.operator,
          d.reference ?? null,
          nowIso,
        ]
      );

      const updatedCustomerRow = (await dbQueryOne<CustomerRow>(
        'SELECT * FROM customers WHERE id = ?',
        [customerRow.id]
      ))!;
      const createdTxRow = (await dbQueryOne<TransactionRow>(
        'SELECT * FROM transactions WHERE id = ?',
        [txId]
      ))!;

      const unitName = pair.program.mode === 'tampons' ? 'tampon(s)' : 'points';
      const rewardBanner = unlockedRewardTitle
        ? ` — 🎉 Récompense débloquée : "${unlockedRewardTitle}" !`
        : '';

      const message =
        d.type === 'earn'
          ? `+${Math.abs(d.delta)} ${unitName} crédités à ${customerRow.name} (Solde : ${newPoints})${rewardBanner}`
          : `Récompense "${d.rewardTitle}" validée pour ${customerRow.name} (Nouveau solde : ${newPoints})`;

      return {
        status: 201,
        data: {
          ok: true,
          statut: 'credite',
          message,
          customer: formatCustomerDTO(updatedCustomerRow),
          transaction: formatTransactionDTO(createdTxRow),
          unlockedRewards: allUnlockedRewards,
          newlyUnlockedReward: newlyUnlocked ?? null,
          // Public API v1 compatibility fields
          code_client: customerRow.code,
          reference: d.reference ?? txId,
          unite: pair.program.mode === 'tampons' ? 'tampons' : 'points',
          gagne: signedDelta,
          solde: newPoints,
        },
      };
    }

    return {
      status: 404,
      data: { ok: false, error: `Route API introuvable : ${method} ${pathname}` },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    return {
      status: 500,
      data: {
        ok: false,
        error: message,
        erreur: { code: 'erreur_interne', message },
      },
    };
  }
}

/**
 * Main API request dispatcher with structured logging
 * Output format: [API] METHOD /route - Status 200/400/500 (XXms)
 */
export async function handleApiRequest(
  method: string,
  rawUrl: string,
  body?: unknown,
  headers?: Record<string, string | string[] | undefined>
): Promise<ApiResponse> {
  const urlObj = new URL(rawUrl, 'http://localhost');
  const pathname = urlObj.pathname;
  const startTime = Date.now();

  let result: ApiResponse;
  try {
    result = await internalHandleApiRequest(method, urlObj, pathname, body, headers);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne critique du serveur';
    result = {
      status: 500,
      data: {
        ok: false,
        error: message,
        erreur: { code: 'erreur_critique', message },
      },
    };
  }

  const duration = Date.now() - startTime;
  console.log(`[API] ${method} ${pathname} - Status ${result.status} (${duration}ms)`);
  return result;
}

/**
 * Standard Web Request/Response handler for Cloudflare Pages Functions / Cloudflare Workers
 */
export async function handleWebRequest(req: Request): Promise<Response> {
  const method = req.method;
  const url = req.url;
  let parsedBody: unknown = undefined;

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const text = await req.text();
      if (text.trim()) {
        parsedBody = JSON.parse(text);
      }
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Corps JSON mal formé',
          erreur: { code: 'requete_invalide', message: 'Le corps JSON n’a pas la bonne forme.' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }
  }

  const headersObj: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headersObj[k] = v;
  });

  const result = await handleApiRequest(method, url, parsedBody, headersObj);
  return new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Node.js IncomingMessage / ServerResponse middleware for Vite and Production Node Server
 */
export function apiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void
): void {
  const url = req.url || '/';
  if (!url.startsWith('/api/')) {
    if (next) next();
    return;
  }

  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', async () => {
    let parsedBody: unknown = undefined;
    const rawBody = Buffer.concat(chunks).toString('utf-8').trim();
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            ok: false,
            error: 'Corps JSON mal formé',
            erreur: { code: 'requete_invalide', message: 'Le corps JSON n’a pas la bonne forme.' },
          })
        );
        return;
      }
    }

    const result = await handleApiRequest(
      req.method || 'GET',
      url,
      parsedBody,
      req.headers as Record<string, string | string[] | undefined>
    );

    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(result.data));
  });
}
