import * as http from 'node:http';
import * as crypto from 'node:crypto';
import { apiMiddleware } from '../src/server/apiRouter.ts';
import { runMigrations, dbQueryAll } from '../src/db/index.ts';

interface StepResult {
  step: string;
  name: string;
  passed: boolean;
  statusReceived?: number;
  expectedStatus?: number;
  details: string;
}

const testResults: StepResult[] = [];

function logResult(r: StepResult) {
  testResults.push(r);
  const icon = r.passed ? '✅' : '❌';
  console.log(`${icon} [${r.step}] ${r.name}`);
  if (r.details) {
    console.log(`   └─ ${r.details}`);
  }
}

async function runIsolationVerification() {
  console.log('\n=============================================================');
  console.log('🛡️ TEST AUTOMATISÉ D’ISOLATION MULTI-TENANT (ZERO-LEAK)');
  console.log('=============================================================\n');

  // 1. Initialiser la base et les migrations
  console.log('📦 1. Initialisation de la base de données & migrations...');
  await runMigrations();
  console.log('✅ Base initialisée avec succès.\n');

  // 2. Démarrer le serveur HTTP éphémère
  const server = http.createServer((req, res) => {
    apiMiddleware(req, res, () => {
      res.statusCode = 404;
      res.end('Not Found');
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`🌐 Serveur de test multi-tenant actif sur : ${baseUrl}\n`);

  try {
    const runId = crypto.randomUUID().slice(0, 6);

    // ========================================================================
    // TEST 1 : Inscription Utilisateur A ("Boutique Alpha")
    // ========================================================================
    const emailA = `alpha-${runId}@boutique-alpha.dz`;
    let tokenA = '';
    let merchantA: any = null;

    const resA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Boutique Alpha',
        email: emailA,
        phone: '0550000001',
        password: 'PasswordAlpha!123',
        mode: 'tampons',
        category: 'Mode & Prêt-à-porter',
        address: '12 Rue Didouche Mourad, Alger',
      }),
    });
    const dataA = (await resA.json()) as any;
    tokenA = dataA.token;
    merchantA = dataA.merchant;

    const regAPassed =
      resA.status === 201 &&
      dataA.ok === true &&
      Boolean(tokenA) &&
      merchantA?.name === 'Boutique Alpha';

    logResult({
      step: 'Étape 1',
      name: 'Inscription Utilisateur A ("Boutique Alpha")',
      passed: regAPassed,
      statusReceived: resA.status,
      expectedStatus: 201,
      details: `User ID: ${dataA.user?.id}, Commerce ID: ${merchantA?.id}, Slug: ${merchantA?.slug}, Token délivré: ${Boolean(tokenA)}`,
    });

    if (!regAPassed) {
      throw new Error("Échec critique à l'inscription de l'Utilisateur A");
    }

    // ========================================================================
    // TEST 2 : Inscription Utilisateur B ("Boutique Beta")
    // ========================================================================
    const emailB = `beta-${runId}@boutique-beta.dz`;
    let tokenB = '';
    let merchantB: any = null;

    const resB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Boutique Beta',
        email: emailB,
        phone: '0550000002',
        password: 'PasswordBeta!456',
        mode: 'points',
        category: 'Restauration',
        address: '45 Boulevard Sidi Yahia, Hydra',
      }),
    });
    const dataB = (await resB.json()) as any;
    tokenB = dataB.token;
    merchantB = dataB.merchant;

    const regBPassed =
      resB.status === 201 &&
      dataB.ok === true &&
      Boolean(tokenB) &&
      merchantB?.name === 'Boutique Beta';

    logResult({
      step: 'Étape 2',
      name: 'Inscription Utilisateur B ("Boutique Beta")',
      passed: regBPassed,
      statusReceived: resB.status,
      expectedStatus: 201,
      details: `User ID: ${dataB.user?.id}, Commerce ID: ${merchantB?.id}, Slug: ${merchantB?.slug}, Token délivré: ${Boolean(tokenB)}`,
    });

    if (!regBPassed) {
      throw new Error("Échec critique à l'inscription de l'Utilisateur B");
    }

    // ========================================================================
    // TEST 3 : Adhésion d'un client chez Boutique Alpha
    // ========================================================================
    const resJoinA = await fetch(`${baseUrl}/api/join/${merchantA.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Client Fidèle Alpha',
        phone: '0770998877',
        email: 'client.alpha@test.dz',
      }),
    });
    const dataJoinA = (await resJoinA.json()) as any;
    const customerAlpha = dataJoinA.customer;

    const joinPassed = resJoinA.status === 201 && Boolean(customerAlpha?.code);
    logResult({
      step: 'Étape 3',
      name: 'Adhésion d’un client chez Boutique Alpha',
      passed: joinPassed,
      statusReceived: resJoinA.status,
      expectedStatus: 201,
      details: `Client créé : ${customerAlpha?.name} (Code: ${customerAlpha?.code}) rattaché au commerce ${merchantA.id}`,
    });

    // ========================================================================
    // TEST 4 : Isolation GET /api/state pour Utilisateur B
    // ========================================================================
    const resStateB = await fetch(`${baseUrl}/api/state`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
    });
    const stateB = (await resStateB.json()) as any;

    const bCommerces = stateB.commerces || [];
    const bCustomers = stateB.customers || [];
    const bTransactions = stateB.transactions || [];

    // Vérifications strictes :
    // 1. Boutique Beta doit être la seule boutique visible pour B
    const seesOnlyBeta =
      bCommerces.length === 1 &&
      bCommerces[0].id === merchantB.id &&
      bCommerces[0].name === 'Boutique Beta';

    // 2. Boutique Alpha ne doit JAMAIS apparaître
    const leakedAlphaStore = bCommerces.some(
      (c: any) => c.id === merchantA.id || c.name === 'Boutique Alpha'
    );

    // 3. Les mocks / démos ne doivent JAMAIS apparaître
    const leakedDemo = bCommerces.some(
      (c: any) =>
        c.id === 'com-1' ||
        c.id === 'com-support' ||
        c.slug === 'gourmand-klzq' ||
        c.slug === 'fidelio-alger'
    );

    // 4. Les clients de A ne doivent JAMAIS apparaître chez B
    const leakedAlphaCustomer = bCustomers.some(
      (c: any) => c.id === customerAlpha?.id || c.code === customerAlpha?.code
    );

    const stateIsolationPassed =
      resStateB.status === 200 &&
      seesOnlyBeta &&
      !leakedAlphaStore &&
      !leakedDemo &&
      !leakedAlphaCustomer &&
      bCustomers.length === 0 &&
      bTransactions.length === 0;

    logResult({
      step: 'Étape 4',
      name: 'Isolation des données (GET /api/state de l’Utilisateur B)',
      passed: stateIsolationPassed,
      statusReceived: resStateB.status,
      expectedStatus: 200,
      details: `Commerces visibles par B: [${bCommerces.map((c: any) => c.name).join(', ')}] (Alpha présent: ${leakedAlphaStore}, Démos présentes: ${leakedDemo}, Clients visibles: ${bCustomers.length})`,
    });

    // ========================================================================
    // TEST 5 : Tentative de consultation directe du commerce A par B (GET /api/merchants/:id) -> 403 Forbidden
    // ========================================================================
    const resGetOtherMerchant = await fetch(`${baseUrl}/api/merchants/${merchantA.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
    });
    const getOtherData = (await resGetOtherMerchant.json()) as any;
    const forbidGetPassed = resGetOtherMerchant.status === 403 && getOtherData.ok === false;

    logResult({
      step: 'Étape 5',
      name: 'Rejet consultation directe non autorisée (GET /api/merchants/:idA)',
      passed: forbidGetPassed,
      statusReceived: resGetOtherMerchant.status,
      expectedStatus: 403,
      details: `Réponse HTTP: ${resGetOtherMerchant.status} (${getOtherData.error})`,
    });

    // ========================================================================
    // TEST 6 : Tentative de modification frauduleuse du programme de A par B (PUT /api/merchants/:id/program) -> 403 Forbidden
    // ========================================================================
    const resHackProgram = await fetch(`${baseUrl}/api/merchants/${merchantA.id}/program`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        name: 'PIRATAGE PROGRAMME ALPHA PAR BETA',
        mode: 'points',
        stampsTarget: 999,
        rewards: [],
      }),
    });
    const hackProgramData = (await resHackProgram.json()) as any;
    const forbidProgramPassed = resHackProgram.status === 403 && hackProgramData.ok === false;

    logResult({
      step: 'Étape 6',
      name: 'Rejet modification frauduleuse du programme (PUT /api/merchants/:idA/program)',
      passed: forbidProgramPassed,
      statusReceived: resHackProgram.status,
      expectedStatus: 403,
      details: `Réponse HTTP: ${resHackProgram.status} (${hackProgramData.error})`,
    });

    // ========================================================================
    // TEST 7 : Tentative de scan frauduleux d’un client de A par B (POST /api/scan) -> 403 Forbidden
    // ========================================================================
    const resHackScan = await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        codeOrId: customerAlpha.code,
        merchantId: merchantB.id,
        type: 'earn',
        delta: 10,
        operator: 'Hacker Beta',
      }),
    });
    const hackScanData = (await resHackScan.json()) as any;
    const forbidScanPassed = resHackScan.status === 403 && hackScanData.ok === false;

    logResult({
      step: 'Étape 7',
      name: 'Rejet scan frauduleux cross-tenant (POST /api/scan)',
      passed: forbidScanPassed,
      statusReceived: resHackScan.status,
      expectedStatus: 403,
      details: `Réponse HTTP: ${resHackScan.status} (${hackScanData.error})`,
    });

    // ========================================================================
    // TEST 8 : Vérification de la purge totale des données démo dans la DB
    // ========================================================================
    const orphanDemos = await dbQueryAll<any>(
      "SELECT id, name, slug FROM merchants WHERE id IN ('com-1', 'com-support') OR slug IN ('gourmand-klzq', 'fidelio-alger')"
    );
    const purgePassed = orphanDemos.length === 0;

    logResult({
      step: 'Étape 8',
      name: 'Purge des faux établissements de test ("Gourmand", "fidelio-alger")',
      passed: purgePassed,
      statusReceived: orphanDemos.length,
      expectedStatus: 0,
      details: `Nombre d’établissements démo résiduels en base : ${orphanDemos.length}`,
    });

    // ========================================================================
    // TEST 9 : Vérification que l'Utilisateur A peut modifier son propre programme
    // ========================================================================
    const resLegitProgram = await fetch(`${baseUrl}/api/merchants/${merchantA.id}/program`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Programme Alpha Mis à Jour',
        mode: 'tampons',
        stampsTarget: 8,
        rewards: [
          {
            id: 'rew-alpha-1',
            title: 'Cadeau VIP Alpha',
            cost: 8,
            category: 'VIP',
            redemptions: 0,
          },
        ],
      }),
    });
    const legitProgramData = (await resLegitProgram.json()) as any;
    const legitProgramPassed = resLegitProgram.status === 200 && legitProgramData.ok === true;

    logResult({
      step: 'Étape 9',
      name: 'Autorisation légitime propriétaire (PUT /api/merchants/:idA/program par User A)',
      passed: legitProgramPassed,
      statusReceived: resLegitProgram.status,
      expectedStatus: 200,
      details: `Programme mis à jour avec succès : "${legitProgramData.program?.name}"`,
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // ========================================================================
  // RÉCAPITULATIF FINAL
  // ========================================================================
  console.log('\n=============================================================');
  console.log('📊 BILAN DU CONTRÔLE D’ISOLATION MULTI-TENANT');
  console.log('=============================================================');
  const allPassed = testResults.every((r) => r.passed);
  const total = testResults.length;
  const passedCount = testResults.filter((r) => r.passed).length;

  console.log(`Résultat : ${passedCount}/${total} tests réussis.`);
  if (allPassed) {
    console.log('🎉 TOUS LES TESTS D’ISOLATION MULTI-TENANT SONT AU VERT (100% SUCCÈS).\n');
    process.exit(0);
  } else {
    console.error('⚠️ CERTAINS TESTS ONT ÉCHOUÉ.\n');
    process.exit(1);
  }
}

runIsolationVerification().catch((err) => {
  console.error('Erreur fatale lors du test d’isolation :', err);
  process.exit(1);
});
