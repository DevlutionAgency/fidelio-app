import * as http from 'node:http';
import * as crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { apiMiddleware } from '../src/server/apiRouter.ts';
import { runMigrations } from '../src/db/index.ts';

interface TestResult {
  step: string;
  name: string;
  passed: boolean;
  statusReceived?: number;
  expectedStatus?: number;
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function recordTest(
  step: string,
  name: string,
  fn: () => Promise<{ passed: boolean; statusReceived?: number; expectedStatus?: number; details: string }>
) {
  const start = Date.now();
  try {
    const res = await fn();
    const duration = Date.now() - start;
    results.push({
      step,
      name,
      passed: res.passed,
      statusReceived: res.statusReceived,
      expectedStatus: res.expectedStatus,
      details: res.details,
      durationMs: duration,
    });
  } catch (err) {
    const duration = Date.now() - start;
    results.push({
      step,
      name,
      passed: false,
      details: `Exception non interceptée : ${err instanceof Error ? err.message : String(err)}`,
      durationMs: duration,
    });
  }
}

async function runFullSystemCheck() {
  console.log('\n=============================================================');
  console.log('🔬 AUDIT FORENSIC & TEST SYSTÈME COMPLET — FIDELIO APP');
  console.log('=============================================================\n');

  // Initialize DB & migrations
  console.log('⚙️ 1. Initialisation de la base SQLite et PRAGMAs (WAL, busy_timeout, foreign_keys)...');
  await runMigrations();
  console.log('✅ Base de données prête.\n');

  // Start dedicated HTTP test server on ephemeral port
  const server = http.createServer((req, res) => {
    apiMiddleware(req, res, () => {
      res.statusCode = 404;
      res.end('Not found');
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`🌐 Serveur HTTP Forensic démarré sur : ${baseUrl}\n`);

  try {
    // ------------------------------------------------------------------------
    // 1. GET /api/health
    // ------------------------------------------------------------------------
    await recordTest('API Health', 'GET /api/health', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      const json = await res.json() as any;
      const passed = res.status === 200 && json.ok === true && json.status === 'healthy';
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 200,
        details: `Réponse : ok=${json.ok}, status=${json.status}, timestamp=${json.timestamp}`,
      };
    });

    // ------------------------------------------------------------------------
    // 2. POST /api/leads (valide)
    // ------------------------------------------------------------------------
    const testPhone = `055${Math.floor(1000000 + Math.random() * 9000000)}`;
    await recordTest('Leads', 'POST /api/leads (Formulaire valide)', async () => {
      const payload = {
        source: 'demo',
        prenom: 'Karim',
        commerceName: 'Café de la Gare',
        phone: testPhone,
        email: 'karim.gare@example.dz',
        ville: 'Oran',
        pointsDeVente: '1',
        rappelQuand: 'Matin (9h - 12h)',
        simClientsParJour: 80,
        simPanierMoyen: 450,
        simGainMensuelDzd: 180000,
      };
      const res = await fetch(`${baseUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 201 && json.ok === true && json.lead?.id;
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 201,
        details: `Lead ID créé : ${json.lead?.id}, Nom : ${json.lead?.commerce_name}`,
      };
    });

    // ------------------------------------------------------------------------
    // 3. POST /api/leads (cas limite : prénom ou téléphone manquant)
    // ------------------------------------------------------------------------
    await recordTest('Leads [Limite]', 'POST /api/leads (Payload incomplet - téléphone vide)', async () => {
      const payload = {
        source: 'demo',
        prenom: 'Test',
        commerceName: 'Sans Téléphone',
        phone: '', // invalide
        ville: 'Alger',
      };
      const res = await fetch(`${baseUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 400 && json.ok === false;
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 400,
        details: `Erreur validation attendue retournée : "${json.error}"`,
      };
    });

    // ------------------------------------------------------------------------
    // 4. POST /api/auth/register (commerçant valide)
    // ------------------------------------------------------------------------
    const randSuffix = crypto.randomUUID().slice(0, 6);
    const regEmail = `boulangerie.${randSuffix}@forensic.dz`;
    let merchantSlug = '';
    let merchantId = '';
    await recordTest('Auth', 'POST /api/auth/register (Création commerçant valide)', async () => {
      const payload = {
        name: `Boulangerie Tradition ${randSuffix}`,
        email: regEmail,
        phone: '+213 555 12 34 56',
        password: 'PasswordForensic!1',
        mode: 'tampons',
        category: 'Boulangerie',
        address: 'Didouche Mourad, Alger',
      };
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 201 && json.ok === true && json.merchant?.id;
      if (passed) {
        merchantSlug = json.merchant.slug;
        merchantId = json.merchant.id;
      }
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 201,
        details: `Commerçant créé ID=${json.merchant?.id}, Slug=${json.merchant?.slug}`,
      };
    });

    // ------------------------------------------------------------------------
    // 5. POST /api/auth/register (cas limite : email déjà existant)
    // ------------------------------------------------------------------------
    await recordTest('Auth [Limite]', 'POST /api/auth/register (Email déjà utilisé -> 409)', async () => {
      const payload = {
        name: 'Doublon Test',
        email: regEmail.toUpperCase(), // Test case-insensitivity
        phone: '+213 555 00 00 00',
        password: 'PasswordForensic!1',
        mode: 'tampons',
        category: 'Autre',
        address: 'Alger',
      };
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 409 && json.ok === false;
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 409,
        details: `Rejet doublon attendu : "${json.error}"`,
      };
    });

    // ------------------------------------------------------------------------
    // 6. POST /api/auth/login (connexion valide)
    // ------------------------------------------------------------------------
    let sessionToken = '';
    await recordTest('Auth', 'POST /api/auth/login (Connexion mot de passe correct)', async () => {
      const payload = {
        email: regEmail,
        password: 'PasswordForensic!1',
      };
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 200 && json.ok === true && Boolean(json.token);
      if (passed) {
        sessionToken = json.token;
      }
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 200,
        details: `Connexion réussie, Token de session émis : ${sessionToken.slice(0, 20)}... ID=${json.merchant?.id}`,
      };
    });

    // ------------------------------------------------------------------------
    // 7. POST /api/auth/login (cas limite : mauvais mot de passe)
    // ------------------------------------------------------------------------
    await recordTest('Auth [Limite]', 'POST /api/auth/login (Mauvais mot de passe -> 401)', async () => {
      const payload = {
        email: regEmail,
        password: 'MauvaisMotDePasseFaux',
      };
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 401 && json.ok === false;
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 401,
        details: `Rejet 401 attendu : "${json.error}"`,
      };
    });

    // ------------------------------------------------------------------------
    // 8. POST /api/join/:slug (création carte client)
    // ------------------------------------------------------------------------
    let customerCode = '';
    let customerId = '';
    await recordTest('Client Pass', `POST /api/join/${merchantSlug} (Adhésion client valide)`, async () => {
      const payload = {
        name: 'Amine Benali',
        phone: '0661234567',
        email: 'amine.benali@test.dz',
        walletAdded: 'web',
      };
      const res = await fetch(`${baseUrl}/api/join/${merchantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 201 && json.ok === true && json.customer?.code;
      if (passed) {
        customerCode = json.customer.code;
        customerId = json.customer.id;
      }
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 201,
        details: `Carte créée Code=${json.customer?.code}, Nom=${json.customer?.name}, Solde initial=${json.customer?.points}`,
      };
    });

    // ------------------------------------------------------------------------
    // 9. POST /api/join/:slug (cas limite : téléphone vide -> 400)
    // ------------------------------------------------------------------------
    await recordTest('Client Pass [Limite]', `POST /api/join/${merchantSlug} (Téléphone vide -> 400)`, async () => {
      const payload = {
        name: 'Sans Numéro',
        phone: '',
      };
      const res = await fetch(`${baseUrl}/api/join/${merchantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 400 && json.ok === false;
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 400,
        details: `Rejet 400 attendu : "${json.error}"`,
      };
    });

    // ------------------------------------------------------------------------
    // 10. POST /api/scan (cas limite : code client inexistant -> 404)
    // ------------------------------------------------------------------------
    await recordTest('Caisse Scan [Limite]', 'POST /api/scan (Code client inexistant C-UNKNOWN -> 404)', async () => {
      const payload = {
        codeOrId: 'C-UNKNOWN-999',
        merchantId,
        type: 'earn',
        delta: 1,
        operator: 'Caisse Principale',
      };
      const res = await fetch(`${baseUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as any;
      const passed = res.status === 404 && json.ok === false;
      return {
        passed,
        statusReceived: res.status,
        expectedStatus: 404,
        details: `Rejet 404 attendu : "${json.error}"`,
      };
    });

    // ------------------------------------------------------------------------
    // 11. POST /api/scan (5 scans consécutifs d'affilée pour vérifier le solde exact)
    // ------------------------------------------------------------------------
    await recordTest('Caisse Scan [Concurrence/Répétition]', `POST /api/scan (5 scans consécutifs sur ${customerCode})`, async () => {
      let expectedBalance = 0;
      let allScansPassed = true;
      const scanLogs: string[] = [];

      for (let i = 1; i <= 5; i++) {
        const payload = {
          codeOrId: customerCode,
          merchantId,
          type: 'earn',
          delta: 1,
          amountDzd: 500,
          operator: 'Caisse N°1',
        };
        const res = await fetch(`${baseUrl}/api/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json() as any;
        expectedBalance += 1;

        if (res.status !== 201 || !json.ok || json.solde !== expectedBalance) {
          allScansPassed = false;
          scanLogs.push(`Scan #${i} FAILED: status=${res.status}, solde=${json.solde}, attendu=${expectedBalance}`);
          break;
        } else {
          scanLogs.push(`Scan #${i}: solde=${json.solde} (attendu ${expectedBalance})`);
        }
      }

      // Check balance via GET /api/customers/:code (simulates customer live polling)
      const getRes = await fetch(`${baseUrl}/api/customers/${customerCode}`);
      const getJson = await getRes.json() as any;
      const finalPoints = getJson.solde ?? getJson.customer?.points;
      const balanceMatches = getJson.ok && finalPoints === 5;

      return {
        passed: allScansPassed && balanceMatches,
        statusReceived: 201,
        expectedStatus: 201,
        details: `5/5 scans consécutifs réussis. Solde exact vérifié via GET /api/customers/${customerCode} = ${finalPoints} tampons. (${scanLogs.join(', ')})`,
      };
    });

    // ------------------------------------------------------------------------
    // 12. SÉCURITÉ : Tentative d'accès non-authentifié -> 401 Unauthorized
    // ------------------------------------------------------------------------
    await recordTest('Sécurité [Auth]', 'GET /api/customers & /api/dashboard sans session (Attendu 401)', async () => {
      const resCust = await fetch(`${baseUrl}/api/customers`);
      const resDash = await fetch(`${baseUrl}/api/dashboard`);
      const resTx = await fetch(`${baseUrl}/api/transactions`);

      const passed = resCust.status === 401 && resDash.status === 401 && resTx.status === 401;
      return {
        passed,
        statusReceived: resCust.status,
        expectedStatus: 401,
        details: `Toutes les routes protégées bloquent l'accès anonyme (HTTP ${resCust.status}, ${resDash.status}, ${resTx.status})`,
      };
    });

    // ------------------------------------------------------------------------
    // 13. SÉCURITÉ : Accès autorisé à ses propres données avec Token de Session -> 200 OK
    // ------------------------------------------------------------------------
    await recordTest('Sécurité [Session]', 'GET /api/customers & /api/dashboard (Propre établissement -> 200)', async () => {
      const headers = { Authorization: `Bearer ${sessionToken}` };
      const resCust = await fetch(`${baseUrl}/api/customers?merchant_id=${merchantId}`, { headers });
      const resDash = await fetch(`${baseUrl}/api/dashboard?merchant_id=${merchantId}`, { headers });
      const resTx = await fetch(`${baseUrl}/api/transactions?merchant_id=${merchantId}`, { headers });

      const jsonCust = (await resCust.json()) as any;
      const jsonDash = (await resDash.json()) as any;
      const jsonTx = (await resTx.json()) as any;

      const passed =
        resCust.status === 200 &&
        resDash.status === 200 &&
        resTx.status === 200 &&
        jsonCust.ok === true &&
        jsonDash.ok === true &&
        jsonTx.ok === true;

      return {
        passed,
        statusReceived: 200,
        expectedStatus: 200,
        details: `Accès propriétaire validé : ${jsonCust.total} clients, ${jsonTx.total} transactions, CA=${jsonDash.metrics?.totalRevenueDzd} DZD`,
      };
    });

    // ------------------------------------------------------------------------
    // 14. SÉCURITÉ : Isolation multi-tenant (Accès aux données d'un autre commerce -> 403 Forbidden)
    // ------------------------------------------------------------------------
    await recordTest('Sécurité [Isolation]', 'Tentative d’espionnage autre commerce (?merchant_id=com-1 -> 403 Forbidden)', async () => {
      const headers = { Authorization: `Bearer ${sessionToken}` };
      // User is logged in as merchantId (Boulangerie Tradition), tries to access 'com-1' (Gourmand)
      const resCust = await fetch(`${baseUrl}/api/customers?merchant_id=com-1`, { headers });
      const resDash = await fetch(`${baseUrl}/api/dashboard?merchant_id=com-1`, { headers });
      const resTx = await fetch(`${baseUrl}/api/transactions?merchant_id=com-1`, { headers });
      const resState = await fetch(`${baseUrl}/api/state?merchant=com-1`, { headers });

      const jsonCust = (await resCust.json()) as any;
      const jsonDash = (await resDash.json()) as any;
      const jsonTx = (await resTx.json()) as any;
      const jsonState = (await resState.json()) as any;

      const allForbidden =
        resCust.status === 403 &&
        resDash.status === 403 &&
        resTx.status === 403 &&
        resState.status === 403 &&
        jsonCust.ok === false &&
        jsonDash.ok === false &&
        jsonTx.ok === false &&
        jsonState.ok === false;

      return {
        passed: allForbidden,
        statusReceived: resCust.status,
        expectedStatus: 403,
        details: `Toutes les tentatives d'accès aux données tierces ont été bloquées avec succès en HTTP 403 Forbidden. Message : "${jsonCust.error}"`,
      };
    });

    // ------------------------------------------------------------------------
    // 15. TypeScript Type Check (tsc --noEmit)
    // ------------------------------------------------------------------------
    await recordTest('Qualité Code', 'Vérification du typage TypeScript (tsc -b)', async () => {
      try {
        execSync('npx tsc -b', { stdio: 'pipe' });
        return {
          passed: true,
          details: '0 erreur de typage détectée par tsc -b',
        };
      } catch (err: any) {
        return {
          passed: false,
          details: `Erreurs TypeScript : ${err.stdout?.toString() || err.message}`,
        };
      }
    });

  } finally {
    server.close();
  }

  // --------------------------------------------------------------------------
  // Rapport Forensic Final
  // --------------------------------------------------------------------------
  console.log('\n=============================================================');
  console.log('📊 RÉSULTAT DU CONTRÔLE FORENSIC SYSTÈME');
  console.log('=============================================================\n');

  let passedCount = 0;
  for (const r of results) {
    const symbol = r.passed ? '✅ [PASS]' : '❌ [FAIL]';
    if (r.passed) passedCount++;
    console.log(`${symbol} ${r.step.padEnd(25)} | ${r.name}`);
    console.log(`    ↳ ${r.details} (${r.durationMs}ms)`);
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`Score Forensic : ${passedCount}/${results.length} tests réussis (${Math.round((passedCount / results.length) * 100)}%)`);
  console.log('=============================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runFullSystemCheck().catch((err) => {
  console.error('Erreur fatale lors de l’audit forensic :', err);
  process.exit(1);
});
