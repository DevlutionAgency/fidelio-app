import { runMigrations, dbQueryAll, DB_PATH, isRemoteDb, dbUrl } from './index.ts';

const EXPECTED_TABLES = [
  'merchants',
  'loyalty_programs',
  'rewards',
  'customers',
  'transactions',
  'team_members',
  'notifications',
  'google_review_claims',
];

async function main() {
  await runMigrations();

  const allTables = await dbQueryAll<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );
  const tableNames = allTables.map((t) => t.name);

  console.log(`\n=============================================================`);
  console.log(`🚀 MIGRATION FIDELIX DASHBOARD — SCHÉMA & PERSISTANCE`);
  console.log(`=============================================================`);
  console.log(`📍 Cible Base de Données : ${isRemoteDb ? 'Turso Cloud (' + dbUrl + ')' : DB_PATH}`);
  console.log(`📦 Tables Détectées (${tableNames.length}) : ${tableNames.join(', ')}\n`);

  console.log(`🔍 Vérification détaillée des 8 tables Fidelix isolées par merchant_id :`);
  let allActive = true;

  for (const t of EXPECTED_TABLES) {
    const isPresent = tableNames.includes(t);
    if (!isPresent) allActive = false;
    const columns = await dbQueryAll<{ name: string; type: string }>(`PRAGMA table_info(${t})`);
    const colList = columns.map((c) => c.name).join(', ');
    const symbol = isPresent ? '✅' : '❌';
    console.log(`  ${symbol} ${t.padEnd(22)} (${columns.length} colonnes)`);
    console.log(`     ↳ [${colList}]`);
  }

  console.log(`\n=============================================================`);
  if (allActive) {
    console.log(`✅ SUCCÈS : Les 8 tables Fidelix sont actives, migrées et prêtes.`);
  } else {
    console.error(`❌ ÉCHEC : Certaines tables attendues sont manquantes.`);
    process.exit(1);
  }
  console.log(`=============================================================\n`);
}

main().catch((err) => {
  console.error('❌ Erreur de migration :', err);
  process.exit(1);
});
