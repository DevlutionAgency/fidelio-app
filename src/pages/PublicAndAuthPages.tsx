import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone,
  Star,
  Gift,
  Share2,
  Eye,
  EyeOff,
  Check,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { useStore, type Customer, type CommerceSettings, type RewardTier } from '../context/StoreContext';
import { BrandLogo, StickerBadge, WalletPassCard } from '../components/BrandLogo';

/* ============================================================================
   1. PUBLIC CUSTOMER WALLET PASS & JOIN PAGE (/c/:slug & /join/:slug)
   ============================================================================ */
export const CustomerCardPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { commerces, rewards, customers, addCustomer, claimGoogleReview } = useStore();

  const [remoteShop, setRemoteShop] = useState<CommerceSettings | null>(null);
  const [remoteRewards, setRemoteRewards] = useState<RewardTier[] | null>(null);
  const [loadingShop, setLoadingShop] = useState(false);

  const shop = remoteShop || commerces.find((c) => c.slug === slug) || commerces[0];
  const activeRewards = remoteRewards ?? rewards;

  const isJoinRoute = location.pathname.startsWith('/join');
  const [activeCustomer, setActiveCustomer] = useState<Customer | undefined>(customers[0]);
  const [joinMode, setJoinMode] = useState<boolean>(isJoinRoute || !customers[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [walletNotice, setWalletNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoadingShop(true);
    fetch(`/api/merchants/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.ok && json.merchant) {
          setRemoteShop(json.merchant);
          setRemoteRewards(Array.isArray(json.rewards) ? json.rewards : []);
          if (!activeCustomer && Array.isArray(json.customers) && json.customers.length > 0 && !isJoinRoute) {
            setActiveCustomer(json.customers[0]);
            setJoinMode(false);
          }
        }
      })
      .catch(() => {
        // Fallback to context shop
      })
      .finally(() => {
        if (!cancelled) setLoadingShop(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isJoinRoute, activeCustomer]);

  const currentPoints = activeCustomer?.points ?? 0;
  const sortedRewards = [...activeRewards].sort((a, b) => a.cost - b.cost);
  const nextReward =
    sortedRewards.find((r) => r.cost > currentPoints) || sortedRewards[sortedRewards.length - 1];
  const pointsNeeded = nextReward ? Math.max(0, nextReward.cost - currentPoints) : 0;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setSubmitting(true);
    const res = await addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: 'client@fidelio.dz',
      walletAdded: 'web',
      merchantSlug: slug || shop.slug,
    });
    setSubmitting(false);
    if (!res.ok || !res.customer) {
      setJoinError(res.error || 'Veuillez vérifier votre prénom et numéro de téléphone.');
      return;
    }
    setActiveCustomer(res.customer);
    setJoinMode(false);
    setWalletNotice(
      `Bienvenue ${res.customer.name} ! Votre carte ${res.customer.code} est active${
        shop.welcomeBonus > 0 ? ` (+${shop.welcomeBonus} points offerts)` : ''
      }.`
    );
  };

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <BrandLogo size={24} />
          </Link>
          {activeCustomer && (
            <button
              type="button"
              onClick={() => setJoinMode(!joinMode)}
              className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white"
            >
              {joinMode ? 'Voir ma carte existante' : '+ Créer une nouvelle carte'}
            </button>
          )}
        </div>

        {loadingShop && (
          <div className="rounded-2xl bg-white/80 p-3 text-center text-xs font-semibold text-ink/60">
            Chargement du programme de fidélité...
          </div>
        )}

        {joinMode || !activeCustomer ? (
          <form
            onSubmit={handleJoin}
            className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard space-y-4"
          >
            <StickerBadge rotate={-2} tone="coral">
              {shop.welcomeBonus > 0 ? `+${shop.welcomeBonus} points offerts` : 'Carte 100% gratuite'}
            </StickerBadge>
            <h1 className="font-impact text-3xl uppercase text-ink">
              REJOIGNEZ {shop.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Recevez votre carte de fidélité avec QR code unique sur votre téléphone sans télécharger d’application.
            </p>
            {joinError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-700">
                {joinError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Votre prénom &amp; nom</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lina Mansouri"
                className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Téléphone WhatsApp</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+213 5 50 12 34 56"
                className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-coral py-3.5 text-sm font-bold text-white shadow-hard-coral disabled:opacity-50"
            >
              {submitting ? 'Génération du QR Code unique...' : 'Obtenir ma carte maintenant'}
            </button>
          </form>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <WalletPassCard
                shopName={shop.name}
                logoUrl={shop.cardLogoImage}
                coverUrl={shop.cardCoverImage}
                bgColor={shop.cardBgColor}
                points={activeCustomer.points}
                unitLabel={shop.mode === 'tampons' ? 'TAMPONS' : 'POINTS'}
                code={activeCustomer.code}
                nextRewardText={
                  pointsNeeded > 0
                    ? `Dans ${pointsNeeded} ${shop.mode === 'tampons' ? 'tampon(s)' : 'pts'}`
                    : 'Récompense débloquée 🎉'
                }
                memberSince={activeCustomer.memberSince}
                className="w-[275px]"
              />
            </div>

            {/* Dedicated Dynamic SVG QR Code Pass Box for Cashier Scanning */}
            <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard flex flex-col items-center text-center space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 px-3 py-1 text-[11px] font-bold text-coral">
                <QrCode className="w-3.5 h-3.5" />
                QR Code Client Dynamique ({activeCustomer.name})
              </div>
              <div className="rounded-2xl border-2 border-ink/15 bg-white p-3">
                <QRCodeSVG
                  value={activeCustomer.code}
                  size={148}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#161514"
                />
              </div>
              <p className="font-mono text-base font-bold tracking-widest text-ink">
                {activeCustomer.code}
              </p>
              <p className="text-[11px] text-ink/55">
                Présentez ce QR code ou ce code en caisse pour cumuler vos{' '}
                {shop.mode === 'tampons' ? 'tampons' : 'points'}.
              </p>
              <Link
                to={`/caisse?code=${encodeURIComponent(activeCustomer.code)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-coral transition-colors"
              >
                <ScanLine className="w-3.5 h-3.5" />
                Simuler le passage en caisse ({activeCustomer.code})
              </Link>
            </div>

            {walletNotice && (
              <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-center text-xs font-bold text-emerald-800">
                {walletNotice}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setWalletNotice('Pass .pkpass généré et ajouté à Apple Wallet (iOS) ✓')
                }
                className="flex items-center justify-center gap-2 rounded-2xl bg-ink py-3 px-3 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                <Smartphone className="w-4 h-4 text-coral" />
                Ajouter à Apple Wallet
              </button>
              <button
                type="button"
                onClick={() =>
                  setWalletNotice('Pass JWT synchronisé avec Google Wallet (Android) ✓')
                }
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-white py-3 px-3 text-xs font-bold text-ink hover:bg-ink/5"
              >
                <Smartphone className="w-4 h-4 text-coral" />
                Google Wallet
              </button>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <Gift className="w-4 h-4 text-coral" /> Menu de récompenses
                </h2>
                <span className="text-xs font-bold text-coral">
                  Solde : {activeCustomer.points} {shop.mode === 'tampons' ? 'tampon(s)' : 'pts'}
                </span>
              </div>

              {sortedRewards.length === 0 ? (
                <p className="text-xs text-ink/50">Aucune récompense configurée pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {sortedRewards.map((rew) => {
                    const unlocked = activeCustomer.points >= rew.cost;
                    const pct = Math.min(100, Math.round((activeCustomer.points / rew.cost) * 100));
                    return (
                      <div
                        key={rew.id}
                        className={`rounded-2xl border p-3.5 ${
                          unlocked
                            ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                            : 'border-ink/10 bg-ink/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-ink">{rew.title}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              unlocked
                                ? 'bg-emerald-600 text-white'
                                : 'bg-ink/10 text-ink/70'
                            }`}
                          >
                            {unlocked ? 'Débloquée 🎉' : `${rew.cost} ${shop.mode === 'tampons' ? 'tampons' : 'pts'}`}
                          </span>
                        </div>
                        <div className="mt-2 w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
                          <div
                            className="h-full bg-coral rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={activeCustomer.googleReviewDone}
                onClick={async () => {
                  await claimGoogleReview(activeCustomer.id);
                  setActiveCustomer((prev) =>
                    prev
                      ? {
                          ...prev,
                          points: prev.points + shop.googleReviewBonus,
                          googleReviewDone: true,
                        }
                      : prev
                  );
                  setWalletNotice(
                    `Merci pour votre avis 5★ ! +${shop.googleReviewBonus} points crédités.`
                  );
                }}
                className="rounded-2xl border border-ink/10 bg-white p-4 text-left shadow-soft hover:border-coral/40 disabled:opacity-50"
              >
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <p className="mt-2 text-xs font-bold text-ink">Avis Google 5★</p>
                <p className="text-[11px] text-coral font-bold">
                  {activeCustomer.googleReviewDone
                    ? 'Bonus déjà reçu ✓'
                    : `+${shop.googleReviewBonus} points offerts`}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setWalletNotice(
                    `Lien de parrainage copié ! +${shop.referralBonus} points dès le 1er achat de votre ami(e).`
                  );
                }}
                className="rounded-2xl border border-ink/10 bg-white p-4 text-left shadow-soft hover:border-coral/40"
              >
                <Share2 className="w-5 h-5 text-coral" />
                <p className="mt-2 text-xs font-bold text-ink">Parrainer un ami</p>
                <p className="text-[11px] text-coral font-bold">
                  +{shop.referralBonus} points chacun
                </p>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   2. EXACT 1:1 AUTHENTICATION, ONBOARDING, RENDEZ-VOUS & LEGAL PAGES
      (/login, /register, /forgot-password, /demarrer, /rendez-vous, /conditions, /confidentialite, /mentions-legales)
      Injected directly from https://fidelio captured DOM
   ============================================================================ */

const GRAIN_SVG_STYLE = {
  '--grain-image': `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
} as React.CSSProperties;

const LiquidGlassDefs: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
  >
    <defs>
      <filter
        id="verre-liquide"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.012"
          numOctaves={2}
          seed={3}
          result="ondes"
        >
          <animate
            attributeName="baseFrequency"
            dur="18s"
            values="0.008 0.012;0.012 0.008;0.008 0.012"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="ondes"
          scale={10}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);

export const AuthOnboardingPage: React.FC<{
  mode:
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'demarrer'
  | 'rendez-vous'
  | 'conditions'
  | 'confidentialite'
  | 'mentions-legales'
  | 'api-docs';
}> = ({ mode }) => {
  const navigate = useNavigate();
  const { registerMerchant, loginMerchant, submitLead } = useStore();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consentementCndp, setConsentementCndp] = useState(false);

  // Rendez-vous & Demarrer states
  const [prenom, setPrenom] = useState('');
  const [commerceName, setCommerceName] = useState('');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [pointsDeVente, setPointsDeVente] = useState('1');
  const [rappelQuand, setRappelQuand] = useState('Peu importe');
  const [honeypotSite, setHoneypotSite] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (mode === 'forgot-password') {
      setSubmittedNotice('Un lien de réinitialisation a été envoyé à votre adresse email.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setFormError('Les deux mots de passe ne correspondent pas.');
        return;
      }
      setFormSubmitting(true);
      const res = await registerMerchant({
        name: fullName.trim() || commerceName.trim() || 'Mon Commerce',
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setFormSubmitting(false);
      if (!res.ok) {
        setFormError(res.error || 'Erreur lors de la création du compte.');
        return;
      }
      navigate('/dashboard');
      return;
    }

    if (mode === 'login') {
      setFormSubmitting(true);
      const res = await loginMerchant({
        email: email.trim(),
        password,
      });
      setFormSubmitting(false);
      if (!res.ok) {
        setFormError(res.error || 'Identifiants incorrects.');
        return;
      }
      navigate('/dashboard');
    }
  };

  const handleRdvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotSite.trim() !== '') return;
    setFormError(null);
    setFormSubmitting(true);
    const res = await submitLead({
      source: 'demo',
      prenom: prenom.trim(),
      commerceName: commerceName.trim(),
      phone: phone.trim(),
      ville: ville.trim() || 'Alger',
      pointsDeVente,
      rappelQuand,
    });
    setFormSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'Veuillez vérifier les champs du formulaire.');
      return;
    }
    setSubmittedNotice(
      'Merci ! Votre demande de démo est enregistrée en base. Un conseiller Fidelio vous rappelle très vite sur WhatsApp.'
    );
  };

  const handleDemarrerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotSite.trim() !== '') return;
    setFormError(null);
    setFormSubmitting(true);
    const res = await submitLead({
      source: 'demarrer',
      prenom: prenom.trim(),
      commerceName: commerceName.trim(),
      phone: phone.trim(),
      ville: 'Alger',
      pointsDeVente: '1',
      rappelQuand: 'Peu importe',
    });
    setFormSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'Veuillez renseigner votre prénom, commerce et WhatsApp.');
      return;
    }
    navigate('/register');
  };

  /* --------------------------------------------------------------------------
     API DOCS PAGE (/docs/api & /api-doc)
     Exact 1:1 DOM from screenshot customized for FIDELIO (DZD, fdl_live_, fidelio.dz, ANPDP)
     -------------------------------------------------------------------------- */
  if (mode === 'api-docs') {
    return (
      <div className="min-h-screen bg-[#FCEEE6] text-ink py-10 px-6">
        <div className="mx-auto max-w-2xl">
          {/* Top Centered Logo */}
          <div className="flex justify-center mb-12">
            <Link to="/api-cles" className="inline-flex items-center gap-2">
              <BrandLogo size={26} variant="dark" />
            </Link>
          </div>

          {/* Header */}
          <header className="mb-8">
            <p className="font-script text-xl text-coral mb-1">Développeurs</p>
            <h1 className="font-impact text-4xl sm:text-5xl uppercase leading-none tracking-tight text-ink">
              L&apos;API FIDELIO
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">
              Reliez votre boutique en ligne (Shopify, WooCommerce, YouCan…) ou votre logiciel de
              caisse à Fidelio. À chaque commande payée, le client gagne ses points sur la même
              carte qu&apos;en boutique, et son téléphone se met à jour tout seul.
            </p>
          </header>

          {/* Sommaire White Card */}
          <nav className="rounded-3xl bg-white p-6 sm:p-7 shadow-soft border border-ink/[0.06] mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45 mb-3">
              SOMMAIRE
            </p>
            <ul className="space-y-2 text-xs font-semibold text-ink/80">
              <li>
                <a href="#demarrer" className="hover:text-coral transition-colors">
                  Démarrer
                </a>
              </li>
              <li>
                <a href="#securite" className="hover:text-coral transition-colors">
                  Authentification et sécurité
                </a>
              </li>
              <li>
                <a href="#solde" className="hover:text-coral transition-colors">
                  Lire le solde d&apos;un client
                </a>
              </li>
              <li>
                <a href="#crediter" className="hover:text-coral transition-colors">
                  Créditer un achat
                </a>
              </li>
              <li>
                <a href="#annuler" className="hover:text-coral transition-colors">
                  Annuler un achat remboursé
                </a>
              </li>
              <li>
                <a href="#parcours" className="hover:text-coral transition-colors">
                  Le parcours conseillé en boutique en ligne
                </a>
              </li>
              <li>
                <a href="#erreurs" className="hover:text-coral transition-colors">
                  Erreurs
                </a>
              </li>
            </ul>
          </nav>

          {/* 1. DÉMARRER */}
          <section id="demarrer" className="py-8 border-b border-ink/[0.08] space-y-4">
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink">DÉMARRER</h2>
            <ol className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-ink/75">
              <li>
                <strong className="text-ink">1.</strong> Le commerçant ouvre son espace{' '}
                <strong className="text-ink">Fidelio, Réglages → API</strong>, et crée une clé. Elle
                n&apos;est affichée qu&apos;une seule fois.
              </li>
              <li>
                <strong className="text-ink">2.</strong> Le développeur range cette clé côté
                serveur dans ses variables d&apos;environnement.
              </li>
              <li>
                <strong className="text-ink">3.</strong> À chaque commande payée, le serveur appelle{' '}
                <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                  POST /api/v1/achats
                </code>{' '}
                avec le code de la carte du client.
              </li>
            </ol>
            <p className="text-xs leading-relaxed text-ink/65">
              Les clients sont désignés par leur <strong className="text-ink">code client</strong> (
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                C-XXXXXX
              </code>
              ), affiché sous le QR code. L&apos;API n&apos;a pas besoin et ne renvoie aucune donnée
              personnelle : ni nom, ni email, ni téléphone (conformément à la loi algérienne n° 18-07
              / ANPDP).
            </p>
          </section>

          {/* 2. AUTHENTIFICATION ET SÉCURITÉ */}
          <section id="securite" className="py-8 border-b border-ink/[0.08] space-y-4">
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink">
              AUTHENTIFICATION ET SÉCURITÉ
            </h2>
            <pre className="rounded-2xl bg-[#161514] text-white p-4 font-mono text-xs overflow-x-auto">
              <code>Authorization: Bearer fdl_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
            </pre>
            <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed text-ink/75">
              <li>
                <strong className="text-ink">Serveur uniquement.</strong> Jamais dans le code source
                d&apos;une page web, d&apos;un thème ou d&apos;une application mobile. L&apos;API
                refuse les appels venant d&apos;un navigateur (aucune autorisation CORS).
              </li>
              <li>
                Pour changer de clé (fuite, départ d&apos;un prestataire), révoquez l&apos;ancienne
                dans <strong className="text-ink">Réglages → API</strong> et créez-en une nouvelle.
                La révocation est immédiate.
              </li>
              <li>
                Une clé n&apos;agit que sur les points de vente de votre compte — jamais ailleurs.
              </li>
              <li>120 appels par minute et par clé ; au-delà, vous recevez un code HTTP 429.</li>
            </ul>
          </section>

          {/* 3. LIRE LE SOLDE D'UN CLIENT */}
          <section id="solde" className="py-8 border-b border-ink/[0.08] space-y-4">
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink">
              LIRE LE SOLDE D&apos;UN CLIENT
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                GET
              </span>
              <code className="font-mono text-xs font-semibold text-ink">
                /api/v1/clients/&#123;code_client&#125;
              </code>
            </div>
            <pre className="rounded-2xl bg-[#161514] text-white p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`curl https://fidelio.dz/api/v1/clients/C-7K4M2P \\
  -H "Authorization: Bearer VOTRE_CLE_SECRETE"`}</code>
            </pre>
            <pre className="rounded-2xl bg-[#161514] text-white p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`{
  "code_client": "C-7K4M2P",
  "unite": "points",
  "solde": 85,
  "recompenses_disponibles": [ { "titre": "Café offert", "cout": 50 } ],
  "prochaine_recompense": { "titre": "Menu offert", "cout": 100, "manquant": 15 }
}`}</code>
            </pre>
          </section>

          {/* 4. CRÉDITER UN ACHAT */}
          <section id="crediter" className="py-8 border-b border-ink/[0.08] space-y-4">
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink">
              CRÉDITER UN ACHAT
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-coral px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                POST
              </span>
              <code className="font-mono text-xs font-semibold text-ink">/api/v1/achats</code>
            </div>
            <pre className="rounded-2xl bg-[#161514] text-white p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`curl -X POST https://fidelio.dz/api/v1/achats \\
  -H "Authorization: Bearer VOTRE_CLE_SECRETE" \\
  -H "Content-Type: application/json" \\
  -d '{"code_client": "C-7K4M2P", "montant": 1500, "reference": "CMD-2026-1042"}'`}</code>
            </pre>
            <pre className="rounded-2xl bg-[#161514] text-white p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`{
  "statut": "credite",
  "code_client": "C-7K4M2P",
  "reference": "CMD-2026-1042",
  "unite": "points",
  "gagne": 15,
  "solde": 100
}`}</code>
            </pre>
            <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed text-ink/75">
              <li>
                <code className="font-mono font-bold text-ink">montant</code> : le total payé, en{' '}
                <strong className="text-ink">Dinars Algériens (DZD)</strong>. Les points sont
                calculés selon les règles du commerce dans Fidelio. Si votre programme est au
                passage (tampons), ce paramètre est optionnel mais conseillé pour vos statistiques de
                chiffre d&apos;affaires.
              </li>
              <li>
                <code className="font-mono font-bold text-ink">reference</code> : le numéro unique de
                votre commande ou ticket de caisse (120 caractères au plus). Si votre serveur
                renvoie deux fois la même référence par erreur (double clic, webhook rejoué), le
                client n&apos;est crédité qu&apos;une seule fois et l&apos;API répond avec{' '}
                <code className="font-mono text-ink">&quot;statut&quot;: &quot;deja_enregistre&quot;</code>.
              </li>
              <li>
                HTTP <strong className="text-ink">201</strong> au premier enregistrement,{' '}
                <strong className="text-ink">200</strong> si la commande était déjà enregistrée.
              </li>
            </ul>
          </section>

          {/* 5. ANNULER UN ACHAT REMBOURSÉ */}
          <section id="annuler" className="py-8 border-b border-ink/[0.08] space-y-4">
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink">
              ANNULER UN ACHAT REMBOURSÉ
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-coral px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                POST
              </span>
              <code className="font-mono text-xs font-semibold text-ink">
                /api/v1/achats/annuler
              </code>
            </div>
            <pre className="rounded-2xl bg-[#161514] text-white p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`curl -X POST https://fidelio.dz/api/v1/achats/annuler \\
  -H "Authorization: Bearer VOTRE_CLE_SECRETE" \\
  -H "Content-Type: application/json" \\
  -d '{"reference": "CMD-2026-1042"}'`}</code>
            </pre>
            <pre className="rounded-2xl bg-[#161514] text-white p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{`{ "statut": "annule", "reference": "CMD-2026-1042", "unite": "points", "retire": 15, "solde": 85 }`}</code>
            </pre>
            <p className="text-xs leading-relaxed text-ink/65">
              Retire les points donnés par cet achat (le solde ne descend jamais sous zéro).
              Redemander la même annulation renvoie l&apos;erreur HTTP <strong className="text-ink">409</strong>.
            </p>
          </section>

          {/* 6. LE PARCOURS CONSEILLÉ EN BOUTIQUE EN LIGNE */}
          <section id="parcours" className="py-8 border-b border-ink/[0.08] space-y-4">
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink">
              LE PARCOURS CONSEILLÉ EN BOUTIQUE EN LIGNE
            </h2>
            <ol className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-ink/75">
              <li>
                <strong className="text-ink">1.</strong> Sur la page panier ou paiement, proposez un
                champ facultatif :{' '}
                <em>
                  « Vous avez notre carte Fidelio ? Entrez votre code (ex : C-7K4M2P, écrit sous
                  votre QR code) pour cumuler vos points. »
                </em>
              </li>
              <li>
                <strong className="text-ink">2.</strong> Dès que le client saisit son code, vous
                pouvez appeler <code className="font-mono text-ink">GET /api/v1/clients/&#123;code&#125;</code>{' '}
                pour lui confirmer que sa carte est reconnue et afficher son solde actuel.
              </li>
              <li>
                <strong className="text-ink">3.</strong> Créditez uniquement quand la commande est
                payée ou livrée (par exemple au déclenchement du webhook paiement ou validation de
                livraison).
              </li>
              <li>
                <strong className="text-ink">4.</strong> Sur la page de confirmation de commande,
                proposez aux nouveaux clients d&apos;ajouter leur carte Fidelio en 1 clic via votre
                lien public d&apos;inscription.
              </li>
            </ol>
          </section>

          {/* 7. ERREURS */}
          <section id="erreurs" className="py-8 space-y-4">
            <h2 className="font-impact text-2xl uppercase tracking-tight text-ink">ERREURS</h2>
            <p className="text-xs leading-relaxed text-ink/70">
              Les erreurs suivent toutes la forme{' '}
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                &#123; &quot;erreur&quot;: &#123; &quot;code&quot;: &quot;...&quot;, &quot;message&quot;: &quot;...&quot; &#125; &#125;
              </code>
              . Le message est écrit en français clair.
            </p>

            <div className="rounded-2xl bg-white shadow-soft border border-ink/[0.06] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/[0.06] bg-ink/[0.02] text-[10px] font-bold uppercase tracking-wider text-ink/50">
                    <th className="py-3 px-4">HTTP</th>
                    <th className="py-3 px-4">CODE</th>
                    <th className="py-3 px-4">QUAND</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.06] text-ink/80">
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">400</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      requete_invalide · code_invalide
                    </td>
                    <td className="py-3 px-4">
                      Le corps JSON ou le code client n&apos;a pas la bonne forme.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">401</td>
                    <td className="py-3 px-4 font-mono text-[11px]">cle_invalide</td>
                    <td className="py-3 px-4">Clé absente, mal formée, inconnue ou révoquée.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">403</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      abonnement_inactif · limite_gratuite_atteinte
                    </td>
                    <td className="py-3 px-4">
                      Le compte du commerce est expiré ou suspendu.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">404</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      client_introuvable · achat_introuvable
                    </td>
                    <td className="py-3 px-4">
                      Aucun client de ce commerce avec ce code, ou aucune commande avec cette
                      référence.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">409</td>
                    <td className="py-3 px-4 font-mono text-[11px]">deja_annule</td>
                    <td className="py-3 px-4">Cette commande a déjà été annulée.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">422</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      montant_minimum · aucun_gain
                    </td>
                    <td className="py-3 px-4">
                      Le montant est sous le minimum du programme ou trop faible pour donner 1
                      point.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">429</td>
                    <td className="py-3 px-4 font-mono text-[11px]">trop_de_requetes</td>
                    <td className="py-3 px-4">
                      Plus de 120 appels en une minute avec cette clé. Attendez le délai indiqué par
                      Retry-After.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-ink">500</td>
                    <td className="py-3 px-4 font-mono text-[11px]">erreur_interne</td>
                    <td className="py-3 px-4">
                      Un problème côté Fidelio — réessayez avec la même référence dans quelques
                      secondes.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer Contact */}
          <footer className="mt-10 pt-6 border-t border-ink/[0.08] text-center text-xs text-ink/60">
            Une question, une intégration à faire ensemble ?{' '}
            <a
              href="mailto:fidelioapp.support@gmail.com"
              className="font-bold text-coral hover:underline"
            >
              fidelioapp.support@gmail.com
            </a>
          </footer>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     LEGAL PAGES (/conditions, /confidentialite, /mentions-legales)
     Exact 1:1 DOM from https://fidelio
     -------------------------------------------------------------------------- */
  if (mode === 'conditions' || mode === 'confidentialite' || mode === 'mentions-legales') {
    return (
      <div className="min-h-screen bg-cream-soft">
        <header className="border-b border-ink/[0.06] bg-white/60 px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <Link className="flex items-center gap-2" to="/">
              <BrandLogo size={22} variant="dark" />
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 transition-colors hover:text-ink"
              to="/"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-left h-3.5 w-3.5"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Retour
            </Link>
          </div>
        </header>

        {mode === 'conditions' && (
          <main className="mx-auto max-w-2xl px-6 py-10">
            <h1 className="font-impact text-3xl uppercase leading-none tracking-tight text-ink sm:text-4xl">
              Conditions générales de vente et d'utilisation
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Ces conditions encadrent l'utilisation de Fidelio, aussi bien par les commerces abonnés que par les clients titulaires d'une carte de fidélité.
            </p>
            <p className="mt-2 text-xs text-ink/40">Dernière mise à jour : 20 octobre 2026</p>
            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-base font-bold text-ink">Objet</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Fidelio met à disposition des commerces une plateforme leur permettant de gérer un programme de fidélité, et à leurs clients une carte de fidélité numérique accessible sans installer d'application.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Le service pour les commerces</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    L'accès à la plateforme suppose la création d'un compte et la souscription d'un abonnement. Le commerçant est responsable de la confidentialité de ses identifiants et de l'usage fait de son espace, y compris par ses salariés.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le commerçant définit librement son programme : nature des récompenses, coût de chacune, et conditions d'obtention. Il est responsable de la véracité de ces informations et de l'honneur des récompenses promises à ses clients.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Fidelio fournit un outil ; il ne se substitue pas au commerçant dans sa relation avec ses clients et n'est pas partie aux avantages qu'il accorde.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Les données des clients porteurs de carte</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Fidelio est responsable du traitement des données personnelles des clients porteurs de carte, au sens de la loi algérienne n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel. Le commerçant n'en est ni responsable ni sous-traitant : il n'y a pas accès. De chaque client, il ne voit qu'un code, et ne peut lire ni exporter un nom, une adresse email, un numéro de téléphone ou une date de naissance.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    C'est Fidelio qui recueille le consentement des clients, qui répond à leurs demandes d'accès, de rectification et d'opposition, et qui expédie les messages du programme. Le commerçant choisit un critère et un texte ; il ne manipule jamais les coordonnées.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le commerçant s'interdit de reconstituer par d'autres moyens un fichier nominatif de ces clients à partir de Fidelio. Tout manquement engage sa seule responsabilité et peut entraîner la suspension de son accès.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Le service pour les clients</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    L'inscription à une carte de fidélité est gratuite et réservée aux personnes d'au moins 16 ans, ou disposant de l'accord de leur représentant légal.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    La carte est rattachée au commerce auprès duquel le client s'est inscrit. Les points ou tampons n'ont aucune valeur monétaire, ne peuvent être ni vendus ni échangés contre de l'argent, et ne sont pas transférables entre commerces.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le commerce peut faire évoluer son catalogue de récompenses. Les points déjà acquis restent utilisables selon les conditions en vigueur au moment de leur utilisation.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Utilisation loyale</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Il est interdit de tenter d'obtenir des points ou des récompenses par un moyen détourné, d'utiliser la carte d'un tiers sans son accord, ou de perturber le fonctionnement du service.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Fidelio peut suspendre un compte ou une carte en cas d'usage manifestement abusif.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Disponibilité</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Fidelio met en œuvre les moyens raisonnables pour assurer la continuité du service, sans pouvoir garantir une disponibilité ininterrompue. Des interruptions peuvent survenir pour maintenance ou pour des causes extérieures, notamment une défaillance de connexion du commerce.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    La caisse continue de fonctionner sans connexion pour l'ajout de points et de tampons ; l'utilisation d'une récompense nécessite en revanche une connexion, afin de vérifier le solde réel du client.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Abonnement, paiement et résiliation</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    L'abonnement est souscrit et réglé depuis le site fidelio. Les tarifs en vigueur y sont indiqués, en dinars algériens, et s'entendent par point de vente actif.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le paiement s'effectue par carte bancaire, via la plateforme sécurisée de notre prestataire. Fidelio ne conserve aucune donnée de carte.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    L'abonnement est mensuel, semestriel ou annuel, selon le rythme choisi au moment du paiement. Il se renouvelle automatiquement à son échéance, pour la même durée, sauf résiliation.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le commerçant peut résilier à tout moment depuis son espace, rubrique Mon compte → Paramètres. La résiliation arrête immédiatement le renouvellement automatique : aucun prélèvement n'est effectué après elle. Une confirmation écrite est envoyée par email.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Droit applicable</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Les présentes conditions sont soumises au droit algérien.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Toute difficulté fera l'objet d'une recherche de solution amiable, à l'adresse fidelioapp.support@gmail.com, avant toute autre démarche.
                  </p>
                </div>
              </section>
            </div>
            <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/[0.08] pt-6 text-xs text-ink/50">
              <Link className="hover:text-ink" to="/confidentialite">Confidentialité</Link>
              <Link className="hover:text-ink" to="/conditions">Conditions d'utilisation</Link>
              <Link className="hover:text-ink" to="/mentions-legales">Mentions légales</Link>
            </nav>
          </main>
        )}

        {mode === 'confidentialite' && (
          <main className="mx-auto max-w-2xl px-6 py-10">
            <h1 className="font-impact text-3xl uppercase leading-none tracking-tight text-ink sm:text-4xl">
              Politique de confidentialité
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Fidelio édite une plateforme de fidélité utilisée par des commerces. Cette page explique quelles données sont collectées, pourquoi, combien de temps, et comment en garder le contrôle.
            </p>
            <p className="mt-2 text-xs text-ink/40">Dernière mise à jour : 21 octobre 2026</p>
            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-base font-bold text-ink">Qui est responsable de vos données</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Fidelio édite et exploite la plateforme accessible sur fidelio. Pour toute question relative à vos données, vous pouvez écrire à fidelioapp.support@gmail.com.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Une distinction est importante. Fidelio est responsable du traitement des données des commerçants abonnés comme de celles des clients finaux. Le commerce auprès duquel vous vous inscrivez n'a pas accès à votre identité : il ne voit de vous qu'un code, et ne peut ni lire ni exporter votre nom, votre adresse email, votre numéro de téléphone ou votre date de naissance.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Déclaration CNDP / ANPDP (Algérie — Loi n° 18-07)</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le traitement des données personnelles en Algérie est encadré par la loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel (modifiée et complétée par la loi n° 25-11) et soumis au contrôle de l'Autorité Nationale de Protection des Données à Caractère Personnel (ANPDP / CNDP Algérie).
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Par le biais de ce formulaire, Fidelio collecte vos données personnelles en vue de la création et la gestion de votre carte de fidélité, de l'attribution de vos points et récompenses, et de l'envoi des messages liés à votre programme. Ce traitement fait l'objet d'une déclaration de conformité auprès de l'Autorité Nationale (ANPDP / CNDP Algérie) conformément aux articles 12 et suivants de la loi n° 18-07.
                  </p>
                  <p className="text-sm leading-relaxed text-ink/75">
                    Vous pouvez vous adresser à <a href="mailto:fidelioapp.support@gmail.com" className="font-semibold text-ink underline hover:text-coral">fidelioapp.support@gmail.com</a> pour exercer vos droits d'information, d'accès, de rectification et d'opposition conformément aux articles 32 à 36 de la loi algérienne n° 18-07.
                  </p>
                </div>
              </section>
            </div>
            <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/[0.08] pt-6 text-xs text-ink/50">
              <Link className="hover:text-ink" to="/confidentialite">Confidentialité</Link>
              <Link className="hover:text-ink" to="/conditions">Conditions d'utilisation</Link>
              <Link className="hover:text-ink" to="/mentions-legales">Mentions légales</Link>
            </nav>
          </main>
        )}

        {mode === 'mentions-legales' && (
          <main className="mx-auto max-w-2xl px-6 py-10">
            <h1 className="font-impact text-3xl uppercase leading-none tracking-tight text-ink sm:text-4xl">
              Mentions légales
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Informations relatives à l'éditeur du site fidelio.
            </p>
            <p className="mt-2 text-xs text-ink/40">Dernière mise à jour : 5 octobre 2026</p>
            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-base font-bold text-ink">Éditeur</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">Le site fidelio est édité par Toubal Walid</p>
                  <p className="text-sm leading-relaxed text-ink/75">Contact : fidelioapp.support@gmail.com.</p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Hébergement</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le site est hébergé par un prestataire d'hébergement d'applications web. Ses coordonnées peuvent être obtenues sur demande à l'adresse de contact ci-dessus.
                  </p>
                </div>
              </section>
              <section>
                <h2 className="text-base font-bold text-ink">Protection des données</h2>
                <div className="mt-2 space-y-3">
                  <p className="text-sm leading-relaxed text-ink/75">
                    Le traitement des données personnelles est décrit dans la politique de confidentialité, accessible depuis le pied de page du site.
                  </p>
                </div>
              </section>
            </div>
            <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/[0.08] pt-6 text-xs text-ink/50">
              <Link className="hover:text-ink" to="/confidentialite">Confidentialité</Link>
              <Link className="hover:text-ink" to="/conditions">Conditions d'utilisation</Link>
              <Link className="hover:text-ink" to="/mentions-legales">Mentions légales</Link>
            </nav>
          </main>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     RENDEZ-VOUS PAGE (/rendez-vous)
     Exact 1:1 DOM from https://fidelio/rendez-vous
     -------------------------------------------------------------------------- */
  if (mode === 'rendez-vous') {
    return (
      <div className="min-h-screen bg-cream-soft">
        <header className="mx-auto max-w-5xl px-5 py-6">
          <Link className="inline-flex" to="/">
            <BrandLogo size={30} variant="dark" />
          </Link>
        </header>
        <main className="mx-auto max-w-5xl px-5 pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <section className="lg:pt-6">
              <p className="font-script text-2xl text-coral">Sans engagement</p>
              <h1 className="mt-2 font-impact text-4xl uppercase leading-[0.95] tracking-tight text-ink md:text-5xl">
                Voyez Fidelio
                <br />
                <span className="text-coral">sur un vrai téléphone</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Une carte de fidélité qui vit dans le wallet de vos clients. Pas d'application à installer, pas de carton à tamponner. On vous montre en quinze minutes.
              </p>
              <ul className="mt-8 space-y-5">
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-coral/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-wallet h-5 w-5 text-coral"
                    >
                      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display font-bold text-ink">On vous montre une vraie carte</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      Dans un vrai wallet, sur un vrai téléphone. Vous voyez le tampon s'ajouter en direct.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-coral/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-clock h-5 w-5 text-coral"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display font-bold text-ink">15 minutes, pas une heure</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      Le temps d'un café. Vous repartez en sachant si c'est fait pour votre commerce.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-coral/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-map-pin h-5 w-5 text-coral"
                    >
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display font-bold text-ink">Sur place à Alger</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      On se déplace dans votre commerce. Ailleurs en Algérie, on fait la démo en visio.
                    </p>
                  </div>
                </li>
              </ul>
              <div className="mt-9 rounded-2xl border-2 border-dashed border-coral/30 bg-white/60 p-5">
                <p className="font-display font-bold text-ink">Ou essayez tout de suite</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Ajoutez notre carte de démonstration à votre wallet. Dix secondes, et vous voyez exactement ce que vivront vos clients.
                </p>
                <Link
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                  to="/c/demo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-wallet h-4 w-4"
                  >
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                  </svg>
                  Ajouter la carte démo
                </Link>
              </div>
              <div className="mt-7 flex items-center gap-2 text-sm text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-circle-check h-4 w-4 text-coral"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Déjà utilisé par des commerces en Algérie
              </div>
            </section>
            <section>
              <div className="rounded-3xl border-2 border-black/5 bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-display text-xl font-bold text-ink">Prendre rendez-vous</h2>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">
                  On vous rappelle sur WhatsApp, au moment qui vous arrange.
                </p>
                {submittedNotice ? (
                  <div className="rounded-2xl bg-emerald-500/15 p-6 text-center space-y-3">
                    <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-display font-bold text-ink">{submittedNotice}</p>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white"
                    >
                      Explorer l'espace commerçant →
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleRdvSubmit} className="space-y-4">
                    {formError && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-700">
                        {formError}
                      </div>
                    )}
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="absolute left-[-9999px] h-0 w-0 opacity-0"
                      name="site"
                      value={honeypotSite}
                      onChange={(e) => setHoneypotSite(e.target.value)}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">Votre prénom</span>
                        <input
                          required
                          placeholder="Reda"
                          autoComplete="given-name"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          className="h-12 w-full rounded-xl border-2 border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">Votre WhatsApp</span>
                        <input
                          required
                          type="tel"
                          inputMode="tel"
                          placeholder="06 12 34 56 78"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 w-full rounded-xl border-2 border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral"
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">Nom de votre commerce</span>
                        <input
                          required
                          placeholder="Café des Amis"
                          value={commerceName}
                          onChange={(e) => setCommerceName(e.target.value)}
                          className="h-12 w-full rounded-xl border-2 border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">Votre ville</span>
                        <input
                          required
                          placeholder="Alger"
                          value={ville}
                          onChange={(e) => setVille(e.target.value)}
                          className="h-12 w-full rounded-xl border-2 border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">
                        Adresse du commerce (facultatif)
                      </span>
                      <input
                        placeholder="Rue Didouche Mourad, Hydra, Alger"
                        autoComplete="street-address"
                        value={adresse}
                        onChange={(e) => setAdresse(e.target.value)}
                        className="h-12 w-full rounded-xl border-2 border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">
                        Combien de points de vente ?
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {['1', '2', '3', '4', '5+'].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPointsDeVente(n)}
                            className={`h-11 min-w-[3rem] rounded-xl border-2 px-4 text-sm font-bold transition-colors ${pointsDeVente === n
                              ? 'border-coral bg-coral text-white'
                              : 'border-black/10 bg-white text-ink hover:border-coral/40'
                              }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">
                        Quand vous rappeler ?
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {['Le matin', "L'après-midi", 'Le soir', 'Peu importe'].map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setRappelQuand(label)}
                            className={`h-11 rounded-xl border-2 px-4 text-sm font-semibold transition-colors ${rappelQuand === label
                              ? 'border-coral bg-coral text-white'
                              : 'border-black/10 bg-white text-ink hover:border-coral/40'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </label>
                    <button
                      type="submit"
                      className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-coral px-6 py-4 text-base font-bold text-white transition-colors hover:bg-coral-dark disabled:opacity-60"
                    >
                      Demander ma démo
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right h-5 w-5"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                    <p className="text-center text-xs leading-relaxed text-muted-foreground">
                      15 minutes, sans engagement. On vous montre la carte sur un vrai téléphone.
                    </p>
                  </form>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     DEMARRER PAGE (/demarrer & /onboarding)
     Exact 1:1 DOM from https://fidelio/demarrer
     -------------------------------------------------------------------------- */
  if (mode === 'demarrer') {
    return (
      <div data-skin="premium" className="relative min-h-[100dvh]">
        <LiquidGlassDefs />
        <div aria-hidden="true" className="grain-premium" style={GRAIN_SVG_STYLE} />
        <div aria-hidden="true" className="fond-premium pointer-events-none fixed inset-0" />
        <div className="relative z-[1]">
          <div className="racine-page min-h-[100dvh] bg-cream-soft">
            <header className="mx-auto max-w-md px-5 pb-2 pt-[calc(1.25rem+env(safe-area-inset-top))]">
              <Link className="inline-flex" to="/">
                <BrandLogo size={28} variant="dark" />
              </Link>
            </header>
            <main className="mx-auto max-w-md px-5 pb-[calc(3rem+env(safe-area-inset-bottom))]">
              <h1 className="mt-3 font-impact text-[2rem] uppercase leading-[0.95] tracking-tight text-ink">
                Tes clients reviennent.
                <br />
                <span className="text-coral">Grâce à une carte sur leur téléphone.</span>
              </h1>
              <p className="mt-3 text-base leading-snug text-ink/65">
                Fidélise gratuitement tes clients en moins de 3 minutes !
              </p>
              <div className="mt-5 rounded-3xl border-2 border-black/5 bg-white p-5 shadow-sm">
                <ol className="grid grid-cols-3" aria-label="Étapes">
                  <li aria-current="step" className="relative flex flex-col items-center gap-1.5 text-center">
                    <span aria-hidden="true" className="absolute left-1/2 top-3.5 h-0.5 w-full bg-black/10" />
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-coral text-white">
                      1
                    </span>
                    <span className="text-xs leading-tight font-bold text-ink">Tes infos</span>
                  </li>
                  <li className="relative flex flex-col items-center gap-1.5 text-center">
                    <span aria-hidden="true" className="absolute left-1/2 top-3.5 h-0.5 w-full bg-black/10" />
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-[#e9e2de] text-ink/45">
                      2
                    </span>
                    <span className="text-xs leading-tight font-medium text-ink/45">La vidéo</span>
                  </li>
                  <li className="relative flex flex-col items-center gap-1.5 text-center">
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-[#e9e2de] text-ink/45">
                      3
                    </span>
                    <span className="text-xs leading-tight font-medium text-ink/45">Ton compte</span>
                  </li>
                </ol>
                <div className="mt-5">
                  <form noValidate onSubmit={handleDemarrerSubmit} className="space-y-3.5">
                    {formError && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-700">
                        {formError}
                      </div>
                    )}
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="absolute left-[-9999px] h-0 w-0 opacity-0"
                      name="site"
                      value={honeypotSite}
                      onChange={(e) => setHoneypotSite(e.target.value)}
                    />
                    <div>
                      <label htmlFor="prenom" className="mb-1.5 block text-[15px] font-semibold text-ink">
                        Ton prénom
                      </label>
                      <input
                        id="prenom"
                        placeholder="Karim"
                        autoComplete="given-name"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className="h-[3.25rem] w-full rounded-2xl border-2 bg-white px-4 text-[17px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral border-black/10"
                      />
                    </div>
                    <div>
                      <label htmlFor="commerce" className="mb-1.5 block text-[15px] font-semibold text-ink">
                        Le nom de ton commerce
                      </label>
                      <input
                        id="commerce"
                        placeholder="Café des Amis"
                        autoComplete="organization"
                        value={commerceName}
                        onChange={(e) => setCommerceName(e.target.value)}
                        className="h-[3.25rem] w-full rounded-2xl border-2 bg-white px-4 text-[17px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral border-black/10"
                      />
                    </div>
                    <div>
                      <label htmlFor="whatsapp" className="mb-1.5 block text-[15px] font-semibold text-ink">
                        Ton numéro WhatsApp
                      </label>
                      <input
                        id="whatsapp"
                        type="tel"
                        inputMode="tel"
                        placeholder="06 12 34 56 78"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-[3.25rem] w-full rounded-2xl border-2 bg-white px-4 text-[17px] text-ink outline-none transition-colors placeholder:text-black/25 focus:border-coral border-black/10"
                      />
                    </div>
                    <div>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={consentementCndp}
                          onChange={(e) => setConsentementCndp(e.target.checked)}
                          className="mt-1 h-5 w-5 flex-shrink-0 accent-coral"
                        />
                        <span className="text-[14px] leading-snug text-ink/70">
                          J'accepte que Fidelio utilise mes informations pour me recontacter au sujet de son service, et que Meta mesure ma visite pour améliorer ses publicités.{' '}
                          <Link
                            target="_blank"
                            className="font-semibold text-ink underline underline-offset-2 hover:text-coral"
                            to="/confidentialite"
                          >
                            Politique de confidentialité
                          </Link>
                        </span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-coral px-6 text-base font-bold text-white shadow-hard-coral transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
                    >
                      Voir comment ça marche
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right h-5 w-5"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                    <p className="text-center text-xs leading-relaxed text-ink/45">
                      Fidelio peut t'écrire sur WhatsApp pour t'aider à démarrer.{' '}
                      <Link
                        target="_blank"
                        className="underline underline-offset-2 hover:text-coral"
                        to="/confidentialite"
                      >
                        Tes données
                      </Link>
                    </p>
                  </form>
                </div>
              </div>
              <ul className="mt-7 space-y-3.5">
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-coral/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-smartphone h-[18px] w-[18px] text-coral"
                    >
                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                    </svg>
                  </span>
                  <span className="pt-1.5 text-[15px] leading-snug text-ink/75">
                    Tes clients scannent un QR code. La carte s'ajoute à leur téléphone.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-coral/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-badge-check h-[18px] w-[18px] text-coral"
                    >
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <span className="pt-1.5 text-[15px] leading-snug text-ink/75">
                    Gratuit jusqu'à 30 clients.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-coral/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-credit-card h-[18px] w-[18px] text-coral"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </span>
                  <span className="pt-1.5 text-[15px] leading-snug text-ink/75">
                    Aucune carte bancaire demandée pour commencer.
                  </span>
                </li>
              </ul>
            </main>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     SPLIT-SCREEN AUTH PAGES (/login, /register, /forgot-password)
     Exact 1:1 DOM from https://fidelio/login & https://fidelio/register
     -------------------------------------------------------------------------- */
  return (
    <div data-skin="premium" className="relative min-h-[100dvh]">
      <LiquidGlassDefs />
      <div aria-hidden="true" className="grain-premium" style={GRAIN_SVG_STYLE} />
      <div aria-hidden="true" className="fond-premium pointer-events-none fixed inset-0" />
      <div className="relative z-[1]">
        <div className="min-h-[100dvh] lg:grid lg:grid-cols-[1fr_1.1fr]">
          {/* Left Coral Branding Column */}
          <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-coral p-12">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute bottom-0 -left-16 w-80 h-80 rounded-full bg-black/10" />
            <span
              style={{ transform: 'rotate(-9deg)' }}
              className="inline-block rounded-full px-3.5 py-1.5 font-semibold shadow-sticker font-script text-base leading-none bg-white text-ink absolute top-36 right-10 z-10"
            >
              Gratuit jusqu'à 30 clients
            </span>
            <span
              style={{ transform: 'rotate(7deg)' }}
              className="inline-block rounded-full px-3.5 py-1.5 font-semibold shadow-sticker font-script text-base leading-none bg-ink text-white absolute top-64 right-4 z-10"
            >
              Apple Wallet
            </span>
            <span
              style={{ transform: 'rotate(-5deg)' }}
              className="inline-block rounded-full px-3.5 py-1.5 font-semibold shadow-sticker font-script text-base leading-none bg-white text-ink absolute bottom-52 left-12 z-10"
            >
              Scan en caisse
            </span>
            <Link className="relative z-10" to="/">
              <BrandLogo size={34} variant="light" />
            </Link>
            <div className="relative z-10 max-w-sm">
              <h2 className="font-impact text-[4.5rem] text-white uppercase leading-[0.88] tracking-tight">
                FIDÉLISEZ
                <br />
                VOS CLIENTS
              </h2>
              <p className="mt-6 text-white/75 leading-relaxed text-base">
                Rejoignez les commerçants qui transforment leurs clients en habitués grâce à une carte dans le wallet.
              </p>
              <ul className="mt-8 space-y-3">
                <li className="flex items-center gap-3 text-white/90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-circle-check w-5 h-5 text-white/80 flex-shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="text-sm font-medium">Carte dans Apple &amp; Google Wallet</span>
                </li>
                <li className="flex items-center gap-3 text-white/90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-circle-check w-5 h-5 text-white/80 flex-shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="text-sm font-medium">Scan en caisse en un tap</span>
                </li>
                <li className="flex items-center gap-3 text-white/90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-circle-check w-5 h-5 text-white/80 flex-shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="text-sm font-medium">Notifications push &amp; campagnes email</span>
                </li>
              </ul>
            </div>
            <div className="relative z-10 text-white/40 text-xs">Fait en Algérie</div>
          </div>

          {/* Right Cream Form Column */}
          <div className="flex items-center justify-center px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:p-8 racine-page bg-cream-soft min-h-[100dvh] lg:min-h-0">
            <div className="w-full max-w-md">
              <div className="lg:hidden text-center mb-8">
                <Link className="inline-flex" to="/">
                  <BrandLogo size={32} variant="dark" />
                </Link>
                <p className="text-sm text-muted-foreground mt-2">
                  Fidélisation pour tous les commerces
                </p>
              </div>

              {formError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-bold text-red-700">
                  {formError}
                </div>
              )}

              {mode === 'login' && (
                <div>
                  <div className="mb-8">
                    <h1 className="font-impact text-5xl text-ink uppercase leading-[0.9] tracking-tight">
                      BON
                      <br />
                      RETOUR
                    </h1>
                    <p className="mt-3 text-ink/55 text-sm font-medium">
                      Connectez-vous à votre espace commerçant
                    </p>
                  </div>
                  <div className="mb-5" />
                  <form onSubmit={handleAuthSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                        htmlFor="email"
                      >
                        Email professionnel
                      </label>
                      <input
                        type="email"
                        className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white transition-colors focus:border-coral border-ink/15"
                        id="email"
                        placeholder="fidelioapp.support@gmail.com"
                        autoComplete="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                          htmlFor="password"
                        >
                          Mot de passe
                        </label>
                        <Link
                          className="-my-2 py-2 text-sm text-ink/55 transition-colors hover:text-coral"
                          to="/forgot-password"
                        >
                          Mot de passe oublié ?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white pr-12 transition-colors focus:border-coral border-ink/15"
                          id="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          name="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Afficher le mot de passe"
                          aria-pressed={showPassword}
                          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-ink/40 transition-colors hover:text-ink"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="group w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-coral text-white font-bold text-base shadow-hard-coral active:scale-95 transition-all disabled:opacity-60 disabled:scale-100 mt-2"
                      style={{ height: '3.25rem' }}
                    >
                      Se connecter
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                    <p className="text-sm text-center text-ink/50 pt-1">
                      Pas encore de compte ?{' '}
                      <Link
                        className="font-bold text-ink hover:text-coral transition-colors underline underline-offset-4"
                        to="/register"
                      >
                        Créer un compte
                      </Link>
                    </p>
                  </form>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <div className="mb-8">
                    <h1 className="font-impact text-5xl text-ink uppercase leading-[0.9] tracking-tight">
                      CRÉEZ
                      <br />
                      VOTRE ESPACE
                    </h1>
                    <p className="mt-3 text-ink/55 text-sm font-medium">
                      Programme de fidélité en 2 minutes
                    </p>
                  </div>
                  <div className="mb-5" />
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                        htmlFor="fullName"
                      >
                        Nom complet
                      </label>
                      <input
                        className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white transition-colors focus:border-coral border-ink/15"
                        id="fullName"
                        placeholder="Walid Toubal"
                        autoComplete="name"
                        name="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                        htmlFor="email"
                      >
                        Email professionnel
                      </label>
                      <input
                        type="email"
                        className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white transition-colors focus:border-coral border-ink/15"
                        id="email"
                        placeholder="fidelioapp.support@gmail.com"
                        autoComplete="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                        htmlFor="phone"
                      >
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white transition-colors focus:border-coral border-ink/15"
                        id="phone"
                        placeholder="06 12 34 56 78"
                        autoComplete="tel"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                        htmlFor="password"
                      >
                        Mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white pr-12 transition-colors focus:border-coral border-ink/15"
                          id="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          name="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Afficher le mot de passe"
                          aria-pressed={showPassword}
                          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-ink/40 transition-colors hover:text-ink"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                        htmlFor="confirmPassword"
                      >
                        Confirmer le mot de passe
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white transition-colors focus:border-coral border-ink/15"
                        id="confirmPassword"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-coral"
                          name="consentementCndp"
                          checked={consentementCndp}
                          onChange={(e) => setConsentementCndp(e.target.checked)}
                        />
                        <span className="text-xs leading-relaxed text-ink/55">
                          J'accepte les{' '}
                          <Link
                            target="_blank"
                            className="font-semibold text-ink/75 underline underline-offset-4 hover:text-coral"
                            to="/conditions"
                          >
                            conditions d'utilisation
                          </Link>{' '}
                          et la{' '}
                          <Link
                            target="_blank"
                            className="font-semibold text-ink/75 underline underline-offset-4 hover:text-coral"
                            to="/confidentialite"
                          >
                            politique de confidentialité
                          </Link>
                          .
                        </span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="group w-full flex items-center justify-center gap-2 rounded-xl bg-coral text-white font-bold text-base shadow-hard-coral active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
                      style={{ height: '3.25rem' }}
                    >
                      Créer mon compte gratuitement
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                    <p className="text-sm text-center text-ink/50 pt-1">
                      Déjà un compte ?{' '}
                      <Link
                        className="font-bold text-ink hover:text-coral transition-colors underline underline-offset-4"
                        to="/login"
                      >
                        Se connecter
                      </Link>
                    </p>
                  </form>
                </div>
              )}

              {mode === 'forgot-password' && (
                <div>
                  <div className="mb-8">
                    <h1 className="font-impact text-5xl text-ink uppercase leading-[0.9] tracking-tight">
                      MOT DE PASSE
                      <br />
                      OUBLIÉ ?
                    </h1>
                    <p className="mt-3 text-ink/55 text-sm font-medium">
                      Entrez votre email, on vous envoie un lien de réinitialisation
                    </p>
                  </div>
                  {submittedNotice && (
                    <div className="mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-xs font-semibold text-emerald-800">
                      {submittedNotice}
                    </div>
                  )}
                  <form onSubmit={handleAuthSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-ink font-semibold text-sm"
                        htmlFor="email"
                      >
                        Email professionnel
                      </label>
                      <input
                        type="email"
                        className="flex w-full px-3.5 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-brand-rose/40 focus-visible:ring-4 focus-visible:ring-brand-rose/10 disabled:cursor-not-allowed disabled:opacity-50 h-12 rounded-xl border-2 bg-white transition-colors focus:border-coral border-ink/15"
                        id="email"
                        placeholder="fidelioapp.support@gmail.com"
                        autoComplete="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="group w-full flex items-center justify-center gap-2 rounded-xl bg-coral text-white font-bold text-base shadow-hard-coral active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
                      style={{ height: '3.25rem' }}
                    >
                      Envoyer le lien
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                    <p className="text-sm text-center text-ink/50 pt-1">
                      <Link
                        className="font-bold text-ink hover:text-coral transition-colors underline underline-offset-4"
                        to="/login"
                      >
                        Retour à la connexion
                      </Link>
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
