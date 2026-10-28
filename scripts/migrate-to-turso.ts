import { createClient } from '@libsql/client';
import * as path from 'node:path';
import * as fs from 'node:fs';

const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data', 'fidelio.sqlite');
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function migrateToTurso() {
  console.log('================================================================');
  console.log('🔄 MIGRATION DE LA BASE LOCALE VERS TURSO CLOUD (libSQL)');
  console.log('================================================================');

  if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
    console.error('❌ ERREUR : Les variables TURSO_DATABASE_URL et TURSO_AUTH_TOKEN sont manquantes.');
    console.log('\nPour obtenir vos identifiants Turso gratuits :');
    console.log('1. Installez le CLI Turso : curl -sSfL https://get.tur.so/install.sh | bash (ou via winget/brew)');
    console.log('2. Créez votre base : turso db create fidelio-db');
    console.log('3. Récupérez l’URL : turso db show fidelio-db --url');
    console.log('4. Créez un token : turso db tokens create fidelio-db');
    console.log('5. Définissez vos variables dans le fichier .env :\n');
    console.log('   TURSO_DATABASE_URL=libsql://fidelio-db-[username].turso.io');
    console.log('   TURSO_AUTH_TOKEN=[votre-token]\n');
    process.exit(1);
  }

  console.log(`📡 Connexion à Turso Cloud : ${TURSO_URL}`);
  const tursoClient = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  console.log('📦 1. Création des tables sur Turso...');
  await tursoClient.executeMultiple(`
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
  console.log('  ✓ Schéma SQL appliqué sur Turso avec succès.');

  // Transfer data from local SQLite file if it exists
  if (fs.existsSync(LOCAL_DB_PATH)) {
    console.log(`📤 2. Transfert des données existantes depuis ${LOCAL_DB_PATH}...`);
    const localClient = createClient({ url: `file:${LOCAL_DB_PATH}` });

    const tables = ['merchants', 'loyalty_programs', 'customers', 'transactions', 'leads'];
    for (const table of tables) {
      const { rows } = await localClient.execute(`SELECT * FROM ${table}`);
      console.log(`   - Table ${table} : ${rows.length} ligne(s) trouvée(s)`);

      for (const row of rows) {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(row) as (string | number | bigint | null)[];

        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
          args: values,
        });
      }
    }
    console.log('  ✓ Toutes les données locales ont été synchronisées vers Turso !');
  }

  console.log('================================================================');
  console.log('🎉 BASE TURSO OPÉRATIONNELLE ET SYNCHRONISÉE POUR LA PRODUCTION');
  console.log('================================================================');
}

migrateToTurso().catch((err) => {
  console.error('❌ Échec de la migration vers Turso :', err);
  process.exit(1);
});
