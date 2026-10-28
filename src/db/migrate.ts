import { runMigrations, dbQueryAll, DB_PATH, isRemoteDb, dbUrl } from './index.ts';

async function main() {
  await runMigrations();

  const tables = await dbQueryAll<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );

  console.log(`✅ Migrations appliquées avec succès sur : ${isRemoteDb ? 'Turso Cloud (' + dbUrl + ')' : DB_PATH}`);
  console.log(`📦 Tables actives (${tables.length}) : ${tables.map((t) => t.name).join(', ')}`);
}

main().catch((err) => {
  console.error('❌ Erreur de migration :', err);
  process.exit(1);
});
