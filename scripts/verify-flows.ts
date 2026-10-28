import * as http from 'node:http';
import * as assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { apiMiddleware } from '../src/server/apiRouter.ts';
import { dbQueryOne, runMigrations, DB_PATH } from '../src/db/index.ts';

async function startTestServer(): Promise<{ server: http.Server; baseUrl: string }> {
  await runMigrations();
  const server = http.createServer((req, res) => {
    apiMiddleware(req, res, () => {
      res.statusCode = 404;
      res.end('Not found');
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 AUTO-VALIDATION DE BOUT EN BOUT — FIDELIO (SQLite + API + QR)');
  console.log('================================================================');
  console.log(`📂 Base de données SQLite : ${DB_PATH}\n`);

  const { server, baseUrl } = await startTestServer();

  try {
    /* ------------------------------------------------------------------
       ÉTAPE 1 : FLUX A — Insertion d'un lead (Démo + Simulateur) & Zod
       ------------------------------------------------------------------ */
    console.log('▶ [FLUX A] Test de validation Zod et insertion dans la table `leads`...');

    // 1a. Vérification du rejet Zod sur données invalides
    const badLeadRes = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom: 'A', commerceName: '', phone: '123' }),
    });
    assert.equal(badLeadRes.status, 400, 'Zod doit rejeter un lead invalide avec HTTP 400');
    console.log('  ✓ Validation stricte Zod confirmée (HTTP 400 sur payload invalide)');

    // 1b. Insertion d'un lead "Demander une démo"
    const demoLeadRes = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'demo',
        prenom: 'Karim',
        commerceName: 'Le Jardin d’Alger',
        phone: '+213 5 55 12 34 56',
        ville: 'Alger',
        pointsDeVente: '2',
        rappelQuand: 'Le matin',
      }),
    });
    assert.equal(demoLeadRes.status, 201, 'Lead démo doit retourner HTTP 201');
    const demoLeadJson = await demoLeadRes.json();
    assert.equal(demoLeadJson.ok, true);

    // 1c. Insertion d'un lead "Simulateur ROI"
    const simLeadRes = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'simulateur',
        prenom: 'Nassim',
        commerceName: 'Boulangerie El Bahia',
        phone: '+213 6 61 98 76 54',
        ville: 'Oran',
        simClientsParJour: 80,
        simPanierMoyen: 450,
        simGainMensuelDzd: 93203,
      }),
    });
    assert.equal(simLeadRes.status, 201, 'Lead simulateur doit retourner HTTP 201');
    const simLeadJson = await simLeadRes.json();

    const dbLeadCount = (await dbQueryOne<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM leads WHERE id IN (?, ?)',
      [demoLeadJson.lead.id, simLeadJson.lead.id]
    ))!;
    assert.equal(dbLeadCount.cnt, 2, 'Les 2 leads doivent être présents dans la table SQLite `leads`');
    console.log(
      `  ✅ [FLUX A VALIDÉ] Leads enregistrés en base SQLite : #${demoLeadJson.lead.id} (Démo) & #${simLeadJson.lead.id} (Simulateur ROI)\n`
    );

    /* ------------------------------------------------------------------
       ÉTAPE 2 : FLUX B — Inscription/Connexion Commerçant & Programme
       ------------------------------------------------------------------ */
    console.log(
      '▶ [FLUX B] Création d’un commerce (`merchants`) et configuration du programme (`loyalty_programs`)...'
    );

    const uniqueEmail = `casbah.${Date.now()}@fidelio.dz`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Casbah Coffee Roasters',
        email: uniqueEmail,
        phone: '+213 5 40 11 22 33',
        password: 'SecretPassword2026!',
        category: 'Café',
        address: 'Hydra, Alger',
        mode: 'points',
      }),
    });
    assert.equal(regRes.status, 201, 'Inscription commerçant doit retourner HTTP 201');
    const regJson = await regRes.json();
    const merchantId: string = regJson.merchant.id;
    const merchantSlug: string = regJson.merchant.slug;

    // Test de connexion réelle
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'SecretPassword2026!',
      }),
    });
    assert.equal(loginRes.status, 200, 'Connexion commerçant doit retourner HTTP 200');

    // Configuration du programme de fidélité (nom, mode points, paliers de récompense)
    const configRes = await fetch(`${baseUrl}/api/merchants/${merchantId}/program`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programName: 'Club Fidélité Casbah',
        mode: 'points',
        pointsPerDzd: 2,
        welcomeBonus: 10,
        referralBonus: 15,
        googleReviewBonus: 20,
        rewards: [
          {
            id: 'rew-espresso',
            title: 'Espresso Artisanal Offert',
            cost: 30,
            description: '1 Espresso 100% Arabica',
            category: 'Boisson',
            redemptions: 0,
          },
          {
            id: 'rew-brunch',
            title: 'Brunch Casbah Complet Offert',
            cost: 80,
            description: 'Brunch pour 1 personne',
            category: 'Repas',
            redemptions: 0,
          },
        ],
      }),
    });
    assert.equal(configRes.status, 200, 'Mise à jour du programme doit retourner HTTP 200');
    const configJson = await configRes.json();
    assert.equal(configJson.merchant.mode, 'points');
    assert.equal(configJson.rewards.length, 2);

    const dbProg = (await dbQueryOne<{
      name: string;
      mode: string;
      welcome_bonus: number;
      rewards_json: string;
    }>('SELECT name, mode, welcome_bonus, rewards_json FROM loyalty_programs WHERE merchant_id = ?', [
      merchantId,
    ]))!;
    assert.equal(dbProg.name, 'Club Fidélité Casbah');
    assert.equal(dbProg.mode, 'points');
    assert.equal(dbProg.welcome_bonus, 10);
    console.log(
      `  ✅ [FLUX B VALIDÉ] Commerce "${regJson.merchant.name}" (slug: ${merchantSlug}) & programme "${dbProg.name}" sauvegardés en base.\n`
    );

    /* ------------------------------------------------------------------
       ÉTAPE 3 : FLUX C — Inscription Client (/join/[slug]) & QR Code SVG
       ------------------------------------------------------------------ */
    console.log(
      `▶ [FLUX C] Inscription d’un client sur /api/join/${merchantSlug} et génération du QR Code SVG...`
    );

    const joinRes = await fetch(`${baseUrl}/api/join/${merchantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Yasmine Benali',
        phone: '+213 5 58 44 55 66',
        email: 'yasmine.benali@example.dz',
        walletAdded: 'apple',
      }),
    });
    assert.equal(joinRes.status, 201, 'Inscription client doit retourner HTTP 201');
    const joinJson = await joinRes.json();
    const customer = joinJson.customer;
    assert.match(customer.code, /^C-[A-Z0-9]{6}$/, 'Le code client doit être au format C-XXXXXX');
    assert.equal(customer.points, 10, 'Le bonus de bienvenue (10 pts) doit être crédité');

    // Génération réelle du QR Code SVG dynamique avec qrcode.react
    const svgMarkup = renderToStaticMarkup(
      React.createElement(QRCodeSVG, {
        value: customer.code,
        size: 148,
        level: 'M',
      })
    );
    assert.ok(
      svgMarkup.startsWith('<svg') && svgMarkup.includes('<path'),
      'qrcode.react doit générer un élément <svg> valide contenant le tracé vectoriel du QR code'
    );
    console.log(
      `  ✅ [FLUX C VALIDÉ] Client "${customer.name}" inscrit (ID: ${customer.id}, Code: ${customer.code}, Solde initial: ${customer.points} pts)`
    );
    console.log(
      `  ✅ [QR CODE SVG] Généré avec succès via qrcode.react (${svgMarkup.length} octets SVG)\n`
    );

    /* ------------------------------------------------------------------
       ÉTAPE 4 : FLUX D — Transaction de Scan en Caisse (/caisse -> /api/scan)
       ------------------------------------------------------------------ */
    console.log(
      `▶ [FLUX D] Scan en caisse du code ${customer.code}, incrémentation des points, déblocage récompense & historique \`transactions\`...`
    );

    const scanRes = await fetch(`${baseUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codeOrId: customer.code,
        merchantId,
        type: 'earn',
        delta: 25,
        amountDzd: 1250,
        operator: 'Caisse Principale - Alger',
        reference: `CMD-TEST-${Date.now()}`,
      }),
    });
    assert.equal(scanRes.status, 201, 'Le scan en caisse doit retourner HTTP 201');
    const scanJson = await scanRes.json();
    assert.equal(scanJson.ok, true);
    assert.equal(scanJson.customer.points, 35, 'Le solde client doit passer de 10 à 35 points');
    assert.equal(scanJson.customer.visits, 2, 'Le compteur de visites doit passer à 2');
    assert.equal(
      scanJson.newlyUnlockedReward?.title,
      'Espresso Artisanal Offert',
      'Le palier de 30 points doit débloquer la récompense "Espresso Artisanal Offert"'
    );

    // Vérification directe dans la table `transactions` de SQLite
    const dbTx = (await dbQueryOne<{
      id: string;
      customer_code: string;
      delta: number;
      amount_dzd: number;
      unlocked_reward: string;
    }>('SELECT * FROM transactions WHERE id = ?', [scanJson.transaction.id]))!;
    assert.ok(dbTx, 'La transaction doit exister dans la table SQLite `transactions`');
    assert.equal(dbTx.customer_code, customer.code);
    assert.equal(dbTx.delta, 25);
    assert.equal(dbTx.amount_dzd, 1250);
    assert.equal(dbTx.unlocked_reward, 'Espresso Artisanal Offert');

    console.log(`  ✅ [FLUX D VALIDÉ] Scan exécuté : ${scanJson.message}`);
    console.log(
      `  ✅ [TRANSACTION SQLITE] ID: ${dbTx.id} | Client: ${dbTx.customer_code} | Delta: +${dbTx.delta} pts | Montant: ${dbTx.amount_dzd} DZD | Récompense débloquée: "${dbTx.unlocked_reward}"\n`
    );

    console.log('================================================================');
    console.log('🎉 100 % DES 4 PARCOURS SONT VALIDÉS DE BOUT EN BOUT SANS ERREUR');
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ ÉCHEC DE LA VÉRIFICATION :', err);
  process.exit(1);
});
