import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Scissors,
  X,
  TrendingUp,
  Wallet,
  Gift,
  Palette,
  MapPin,
  Share2,
  ScanLine,
  WifiOff,
  Lock,
  GraduationCap,
  BarChart3,
  Zap,
  Mail,
  Users,
  Star,
  Sparkles,
  Minus,
  Plus,
  Shield,
  CreditCard,
  MessageCircle,
  Menu,
} from 'lucide-react';
import { BrandLogo, StickerBadge } from '../components/BrandLogo';
import { useStore } from '../context/StoreContext';

type Lang = 'fr' | 'ar' | 'en';

const BILLING_CYCLES = [
  {
    cle: 'mensuel' as const,
    label: 'Mensuel',
    moisCouverts: 1,
    moisFactures: 1,
    moisOfferts: 0,
    note: 'Facturé chaque mois, résiliable à tout moment.',
  },
  {
    cle: 'semestriel' as const,
    label: 'Semestriel',
    moisCouverts: 6,
    moisFactures: 5,
    moisOfferts: 1,
    note: 'Facturé tous les 6 mois, 1 mois offert.',
  },
  {
    cle: 'annuel' as const,
    label: 'Annuel',
    moisCouverts: 12,
    moisFactures: 10,
    moisOfferts: 2,
    note: 'Facturé chaque année, 2 mois offerts.',
  },
];

export const LandingPage: React.FC<{ initialLang?: Lang }> = ({ initialLang = 'fr' }) => {
  const { submitLead } = useStore();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [navSur, setNavSur] = useState<'orange' | 'encre' | 'clair'>('orange');
  const navRef = useRef<HTMLElement>(null);

  // Exact ROI state from module 32176
  const [roi, setRoi] = useState({ clients: 50, panier: 70, jours: 26, gain: 10 });
  const [simPrenom, setSimPrenom] = useState('');
  const [simCommerce, setSimCommerce] = useState('');
  const [simPhone, setSimPhone] = useState('');
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  // Exact Pricing state from module 26545
  const [pdv, setPdv] = useState(1);
  const [rythme, setRythme] = useState<'mensuel' | 'semestriel' | 'annuel'>('mensuel');

  // Exact scroll detector from module 24230
  useEffect(() => {
    let raf = 0;
    const checkBg = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nav = navRef.current;
        if (!nav) return;
        const rect = nav.getBoundingClientRect();
        const els = document.elementsFromPoint(
          window.innerWidth / 2,
          rect.top + rect.height / 2
        );
        for (const el of els) {
          if (nav.contains(el)) continue;
          const fondEl = el.closest('[data-fond]') as HTMLElement | null;
          const fond = fondEl?.dataset?.fond;
          if (fond === 'orange' || fond === 'encre') {
            setNavSur(fond);
            return;
          }
        }
        setNavSur('clair');
      });
    };
    checkBg();
    window.addEventListener('scroll', checkBg, { passive: true });
    window.addEventListener('resize', checkBg);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', checkBg);
      window.removeEventListener('resize', checkBg);
    };
  }, []);

  const roiCalc = useMemo(() => {
    const cost = 397;
    const caAdditionnel = roi.clients * roi.jours * roi.panier * (roi.gain / 100);
    const net = caAdditionnel - cost;
    const ratio = caAdditionnel / cost;
    return {
      caAdditionnel,
      net,
      ratio,
      annuel: net * 12,
      cost,
    };
  }, [roi]);

  const priceCalc = useMemo(() => {
    const cycle = BILLING_CYCLES.find((c) => c.cle === rythme) || BILLING_CYCLES[0];
    const total = 397 * pdv * cycle.moisFactures;
    const perMonth = total / cycle.moisCouverts;
    const saved = 397 * pdv * cycle.moisOfferts;
    return { cycle, total, perMonth, saved };
  }, [pdv, rythme]);

  const fmtDh = (n: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} DA`;
  const fmtNum = (n: number) => Math.round(n).toLocaleString('fr-FR');

  const isClair = navSur === 'clair';
  const navTextClass = isClair ? 'text-ink/75 hover:text-ink' : 'text-white/90 hover:text-white';
  const ctaBtnClass =
    navSur === 'orange'
      ? 'bg-ink text-white shadow-[3px_3px_0_0_rgb(var(--coral-dark-rgb))]'
      : 'bg-coral text-white shadow-hard-coral';

  return (
    <div data-skin="premium" className="relative min-h-[100dvh]">
      {/* Exact SVG Liquid Glass Filter & Grain from module 80996 */}
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

      <div
        aria-hidden="true"
        className="grain-premium"
        style={
          {
            '--grain-image': `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`,
          } as React.CSSProperties
        }
      />
      <div aria-hidden="true" className="fond-premium pointer-events-none fixed inset-0" />

      <div className="relative z-[1]">
        <main className="racine-page sans-lueur overflow-x-clip">
          {/* ==============================================================
              EXACT NAVBAR (Module 24230)
              ============================================================== */}
          <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <nav
              ref={navRef}
              data-sur={navSur}
              aria-label="Navigation principale"
              className="vitre mx-auto flex h-14 w-full max-w-5xl items-center justify-between rounded-full border pe-2 ps-4 md:ps-5"
            >
              <Link
                aria-label="Fidelio — accueil"
                className="relative flex min-h-11 items-center"
                to="/"
              >
                <BrandLogo
                  size={28}
                  variant="dark"
                  className={`transition-opacity duration-300 ${isClair ? 'opacity-100' : 'opacity-0'
                    }`}
                />
                <BrandLogo
                  size={28}
                  variant="light"
                  className={`absolute start-0 transition-opacity duration-300 ${isClair ? 'opacity-0' : 'opacity-100'
                    }`}
                />
              </Link>

              <div className="hidden items-center gap-1 md:flex">
                <a
                  href="#fonctionnalites"
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-300 lg:px-4 ${navTextClass}`}
                >
                  Fonctionnalités
                </a>
                <a
                  href="#etapes"
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-300 lg:px-4 ${navTextClass}`}
                >
                  Comment ça marche
                </a>
                <a
                  href="#tarifs"
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-300 lg:px-4 ${navTextClass}`}
                >
                  Tarifs
                </a>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <div
                  role="group"
                  aria-label="Choisir la langue"
                  className={`flex items-center gap-0.5 rounded-full p-0.5 ${isClair ? 'bg-ink/[0.06]' : 'bg-white/15'
                    }`}
                >
                  {(['fr', 'ar', 'en'] as Lang[]).map((l) => {
                    const active = lang === l;
                    return (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center justify-center rounded-full font-bold transition-colors duration-300 min-h-8 px-2.5 text-xs ${active
                            ? isClair
                              ? 'bg-ink text-white'
                              : 'bg-white text-ink'
                            : isClair
                              ? 'text-ink/60 hover:text-ink'
                              : 'text-white/80 hover:text-white'
                          }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                <Link
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-300 lg:px-4 ${navTextClass}`}
                  to="/login"
                >
                  Connexion
                </Link>
                <Link
                  className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-5 text-sm font-bold transition-colors duration-300 ${ctaBtnClass}`}
                  to="/register"
                >
                  Commencer
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenu(!mobileMenu)}
                aria-expanded={mobileMenu}
                aria-label="Ouvrir le menu"
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 md:hidden ${isClair ? 'text-ink' : 'text-white'
                  }`}
              >
                {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </nav>

            {mobileMenu && (
              <div className="verre-flottant mx-auto mt-2 max-w-5xl rounded-[1.75rem] p-2 md:hidden">
                <a
                  href="#fonctionnalites"
                  onClick={() => setMobileMenu(false)}
                  className="flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold text-ink"
                >
                  Fonctionnalités
                </a>
                <a
                  href="#etapes"
                  onClick={() => setMobileMenu(false)}
                  className="flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold text-ink"
                >
                  Comment ça marche
                </a>
                <a
                  href="#tarifs"
                  onClick={() => setMobileMenu(false)}
                  className="flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold text-ink"
                >
                  Tarifs
                </a>
                <Link
                  to="/login"
                  className="flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold text-ink/70"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="mt-1 flex min-h-12 items-center justify-center rounded-2xl bg-coral text-base font-bold text-white shadow-hard-coral"
                >
                  Commencer gratuitement
                </Link>
              </div>
            )}
          </header>

          {/* ==============================================================
              EXACT HERO SECTION & 3 WALLET CARDS FAN
              ============================================================== */}
          <section data-fond="orange" className="aplat relative overflow-hidden bg-coral text-white">
            <div className="mx-auto max-w-6xl">
              <div className="grid items-center gap-10 px-6 pb-6 pt-[calc(6.5rem+env(safe-area-inset-top))] sm:px-10 md:pt-[calc(8rem+env(safe-area-inset-top))] lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-8 lg:pb-8">
                <div className="text-center lg:text-start">
                  <span
                    style={{ transform: 'rotate(-3deg)' }}
                    className="inline-block font-semibold shadow-sticker font-script text-base bg-ink text-white mb-6 max-w-[20rem] rounded-2xl px-4 py-2 leading-tight sm:max-w-none sm:rounded-full"
                  >
                    Sans appli pour vos clients — carte ajoutée en 10 secondes
                  </span>
                  <h1 className="font-impact text-[3.1rem] uppercase leading-[0.94] tracking-tight sm:text-7xl lg:text-[5.5rem] lg:leading-[0.9]">
                    Rendez chaque client fidèle
                  </h1>
                  <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-white/80 lg:mx-0">
                    Créez une carte de fidélité digitale que vos clients gardent dans leur wallet. Ils l&apos;ajoutent en un tap, sans aucune appli à installer. Scannez en caisse, récompensez, et transformez vos clients en habitués.
                  </p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
                    <Link
                      className="inline-flex min-h-14 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-ink px-7 text-base font-bold text-white shadow-[4px_4px_0_0_rgb(var(--coral-dark-rgb))]"
                      to="/register"
                    >
                      Commencer gratuitement
                      <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                    </Link>
                    <Link
                      className="inline-flex min-h-14 items-center justify-center whitespace-nowrap rounded-2xl border-2 border-white/40 px-7 text-base font-bold text-white"
                      to="/rendez-vous"
                    >
                      Demander une démo
                    </Link>
                  </div>
                </div>

                {/* Exact 3-Card Wallet Showcase from captured DOM */}
                <div className="garder-clair relative mx-auto h-[360px] w-[min(320px,86vw)] sm:h-[400px] sm:w-[350px]">
                  {/* Card 1: Pharmacie les Lilas */}
                  <div className="absolute left-0 top-10 origin-bottom -rotate-[11deg] max-sm:scale-[0.86]">
                    <div
                      className="w-[232px] overflow-hidden rounded-[22px] text-white shadow-float"
                      style={{ backgroundColor: '#0b6249' }}
                    >
                      <div className="flex items-center gap-2.5 px-3.5 py-3">
                        <img
                          alt=""
                          width={34}
                          height={34}
                          className="h-[34px] w-[34px] object-contain"
                          src="/landing/cartes/pharmacie-logo.png"
                        />
                        <p className="truncate text-[15px] font-semibold leading-none">
                          Pharmacie les Lilas
                        </p>
                      </div>
                      <div className="relative aspect-[2.6/1] w-full">
                        <img
                          alt=""
                          className="object-cover absolute inset-0 h-full w-full"
                          src="/landing/cartes/pharmacie.webp"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
                        <div className="absolute bottom-2 left-3.5 leading-none">
                          <p className="text-[40px] font-light leading-[0.9] tracking-tight">45</p>
                          <p className="mt-0.5 text-[11px] font-light tracking-wide">POINTS</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-3.5 pt-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            CODE CLIENT
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">C-6H4BSM</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            IL VOUS MANQUE
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">45 pts</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            DEPUIS
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">juin 2026</p>
                        </div>
                      </div>
                      <div className="flex justify-center px-3.5 pb-4 pt-5">
                        <div className="h-[126px]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Le barbier */}
                  <div className="absolute right-0 top-3 origin-bottom rotate-[11deg] max-sm:scale-[0.86]">
                    <div
                      className="w-[232px] overflow-hidden rounded-[22px] text-white shadow-float"
                      style={{ backgroundColor: '#1f1b19' }}
                    >
                      <div className="flex items-center gap-2.5 px-3.5 py-3">
                        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-white/15">
                          <Scissors className="h-4 w-4" />
                        </span>
                        <p className="truncate text-[15px] font-semibold leading-none">
                          Le barbier
                        </p>
                      </div>
                      <div className="relative aspect-[2.6/1] w-full">
                        <img
                          alt=""
                          className="object-cover absolute inset-0 h-full w-full"
                          src="/landing/cartes/barbier.webp"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
                        <div className="absolute bottom-2 left-3.5 leading-none">
                          <p className="text-[40px] font-light leading-[0.9] tracking-tight">85</p>
                          <p className="mt-0.5 text-[11px] font-light tracking-wide">POINTS</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-3.5 pt-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            CODE CLIENT
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">C-GGUHY8</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            IL VOUS MANQUE
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">15 pts</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            DEPUIS
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">août 2026</p>
                        </div>
                      </div>
                      <div className="flex justify-center px-3.5 pb-4 pt-5">
                        <div className="h-[126px]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: My Nails (Center Front) */}
                  <div className="absolute left-1/2 top-12 -translate-x-1/2 rotate-[2deg] max-sm:scale-[0.9]">
                    <div
                      className="w-[232px] overflow-hidden rounded-[22px] text-white shadow-float"
                      style={{ backgroundColor: '#5b2349' }}
                    >
                      <div className="flex items-center gap-2.5 px-3.5 py-3">
                        <img
                          alt=""
                          width={34}
                          height={34}
                          className="h-[34px] w-[34px] object-contain"
                          src="/landing/cartes/ongles-logo.png"
                        />
                        <p className="truncate text-[15px] font-semibold leading-none">My Nails</p>
                      </div>
                      <div className="relative aspect-[2.6/1] w-full">
                        <img
                          alt=""
                          className="object-cover absolute inset-0 h-full w-full"
                          src="/landing/cartes/ongles.webp"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
                        <div className="absolute bottom-2 left-3.5 leading-none">
                          <p className="text-[40px] font-light leading-[0.9] tracking-tight">120</p>
                          <p className="mt-0.5 text-[11px] font-light tracking-wide">POINTS</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-3.5 pt-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            CODE CLIENT
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">C-ZBSQUC</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            IL VOUS MANQUE
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">30 pts</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[7px] font-semibold tracking-wide text-white/75">
                            DEPUIS
                          </p>
                          <p className="truncate text-[9.5px] text-white/95">octobre 2026</p>
                        </div>
                      </div>
                      <div className="flex justify-center px-3.5 pb-4 pt-5">
                        <div className="rounded-lg bg-white px-2 pb-1.5 pt-2">
                          <img
                            alt="QR de la carte de démonstration"
                            width={96}
                            height={96}
                            className="h-24 w-24 [image-rendering:pixelated]"
                            src="/landing/cartes/qr-demo.gif"
                          />
                          <p className="mt-1 text-center text-[8px] text-ink">
                            Votre carte de fidélité
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Sticker Badges on the Cards */}
                  <StickerBadge
                    rotate={7}
                    tone="white"
                    className="absolute -right-1 top-0 z-10"
                  >
                    Apple Wallet
                  </StickerBadge>
                  <StickerBadge
                    rotate={-6}
                    tone="white"
                    className="absolute -left-2 bottom-6 z-10"
                  >
                    Scan en caisse
                  </StickerBadge>
                </div>
              </div>
            </div>
          </section>

          {/* Coral Wave Divider */}
          <div aria-hidden="true" className="relative leading-[0] -mt-px">
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="block h-[56px] w-full md:h-[110px] fill-coral"
              style={{ transform: 'scale(1, -1)' }}
            >
              <path
                d="M0,64 C240,128 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
                data-fond="orange"
              />
            </svg>
          </div>

          {/* ==============================================================
              SECTION 2: "ON A BÂTI LE SYSTÈME QUI LES FAIT REVENIR"
              ============================================================== */}
          <section className="relative px-5 pb-20 pt-14 md:pb-28 md:pt-20">
            <div className="relative mx-auto max-w-4xl text-center">
              <StickerBadge
                rotate={-8}
                tone="white"
                className="absolute -left-28 top-4 hidden xl:inline-block"
              >
                Cartes wallet
              </StickerBadge>
              <StickerBadge
                rotate={6}
                tone="coral"
                className="absolute -right-24 top-0 hidden xl:inline-block"
              >
                Scan caisse
              </StickerBadge>
              <StickerBadge
                rotate={-5}
                tone="white"
                className="absolute -left-20 bottom-10 hidden xl:inline-block"
              >
                Récompenses
              </StickerBadge>
              <StickerBadge
                rotate={8}
                tone="white"
                className="absolute -right-28 bottom-8 hidden xl:inline-block"
              >
                Campagnes email
              </StickerBadge>

              <div>
                <p className="font-script text-2xl text-coral md:text-3xl">
                  Vous avez des clients.
                </p>
                <h2 className="mx-auto mt-2 max-w-3xl font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight text-ink sm:text-5xl md:text-6xl">
                  On a bâti le système qui les fait revenir
                </h2>
              </div>

              <div>
                <a
                  href="#etapes"
                  className="mt-9 inline-flex min-h-14 items-center gap-2 rounded-2xl bg-coral px-7 text-base font-bold text-white shadow-hard-coral"
                >
                  Voir comment ça marche
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </a>
              </div>

              <div className="mt-9 flex flex-wrap justify-center gap-2 xl:hidden">
                <StickerBadge rotate={-4} tone="white">
                  Cartes wallet
                </StickerBadge>
                <StickerBadge rotate={3} tone="coral">
                  Scan caisse
                </StickerBadge>
                <StickerBadge rotate={-2} tone="white">
                  Récompenses
                </StickerBadge>
              </div>
            </div>
          </section>

          {/* ==============================================================
              SECTION 3: "ON SAIT QUAND ÇA COINCE" (SANS / AVEC FIDELIO)
              ============================================================== */}
          <section className="px-5 pb-20 md:pb-28">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12">
                <div className="mx-auto text-center max-w-2xl">
                  <h2 className="mt-1 font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl text-ink">
                    On sait quand ça coince.
                  </h2>
                </div>
                <p className="mt-2 text-center font-script text-2xl text-ink/60 md:text-3xl">
                  Et on a conçu Fidelio pour ce moment précis.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                <div className="h-full rounded-[2rem] border border-ink/5 bg-white p-7 md:p-8">
                  <p className="font-script text-2xl text-ink/55">Sans Fidelio</p>
                  <ul className="mt-5">
                    {[
                      'Les mêmes offres pour tous, même vos meilleurs clients',
                      'Les clients oubliés après une seule visite',
                      'Aucune idée de qui revient vraiment',
                      'Vos meilleurs clients partent sans un mot',
                    ].map((txt) => (
                      <li
                        key={txt}
                        className="flex items-start gap-3 border-b border-ink/[0.06] py-4 last:border-0"
                      >
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink/[0.07]">
                          <X className="h-3.5 w-3.5 text-ink/45" />
                        </span>
                        <span className="text-[16px] leading-snug text-ink/65">{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="h-full rounded-[2rem] bg-ink p-7 md:p-8">
                  <p className="font-script text-2xl text-coral">Avec Fidelio</p>
                  <ul className="mt-5">
                    {[
                      'Vos meilleurs clients sont reconnus et chouchoutés',
                      'Relances automatiques, enfin',
                      'Vous voyez qui revient, et à quelle fréquence',
                      'Chaque visite construit la fidélité',
                    ].map((txt) => (
                      <li
                        key={txt}
                        className="flex items-start gap-3 border-b border-white/10 py-4 last:border-0"
                      >
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-coral">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </span>
                        <span className="text-[16px] leading-snug text-white/90">{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ==============================================================
              SECTION 4: ROI CALCULATOR (#roi — Exact module 32176)
              ============================================================== */}
          <section id="roi" className="px-5 pb-16 md:pb-20">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <div className="mx-auto text-center max-w-2xl">
                  <p className="font-script text-2xl md:text-3xl text-coral">Faites le calcul</p>
                  <h2 className="mt-1 font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl text-ink">
                    Combien Fidelio
                    <br /> peut vous rapporter
                  </h2>
                  <p className="mt-4 text-[17px] leading-relaxed text-ink/60">
                    Une estimation à partir de vos propres chiffres. Ajustez, comparez, décidez.
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
                <div className="rounded-3xl bg-white border-2 border-ink/5 p-6 md:p-8 shadow-soft">
                  <p className="font-display font-bold text-lg text-ink">Vos chiffres</p>
                  <p className="text-sm text-ink/50 mt-0.5">
                    Ajustez les curseurs à votre réalité.
                  </p>

                  <div className="mt-6 space-y-6">
                    {[
                      {
                        key: 'clients' as const,
                        label: 'Clients par jour',
                        min: 10,
                        max: 500,
                        step: 5,
                        suffix: '',
                      },
                      {
                        key: 'panier' as const,
                        label: 'Panier moyen',
                        min: 20,
                        max: 500,
                        step: 5,
                        suffix: ' DA',
                      },
                      {
                        key: 'jours' as const,
                        label: "Jours d'ouverture / mois",
                        min: 20,
                        max: 31,
                        step: 1,
                        suffix: '',
                      },
                      {
                        key: 'gain' as const,
                        label: 'Gain de fréquentation estimé',
                        min: 5,
                        max: 20,
                        step: 1,
                        suffix: ' %',
                      },
                    ].map((s) => (
                      <div key={s.key}>
                        <div className="flex items-baseline justify-between mb-2">
                          <label
                            htmlFor={`roi-${s.key}`}
                            className="text-sm font-semibold text-ink"
                          >
                            {s.label}
                          </label>
                          <span className="font-impact text-xl text-coral tabular-nums">
                            {roi[s.key]}
                            {s.suffix}
                          </span>
                        </div>
                        <input
                          id={`roi-${s.key}`}
                          type="range"
                          min={s.min}
                          max={s.max}
                          step={s.step}
                          value={roi[s.key]}
                          onChange={(e) =>
                            setRoi((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))
                          }
                          className="w-full h-2 rounded-full bg-ink/10 appearance-none cursor-pointer"
                          style={{ accentColor: '#f94c3a' }}
                        />
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 text-xs text-ink/60 leading-relaxed">
                    Les programmes de fidélité augmentent en général le chiffre d&apos;affaires de 5 à 20 %. Le curseur « gain » vous laisse choisir une hypothèse prudente.
                  </p>
                </div>

                <div className="rounded-3xl bg-ink p-6 md:p-8 shadow-float flex flex-col">
                  <div className="inline-flex items-center gap-2 self-start rounded-full bg-coral/15 px-3 py-1">
                    <TrendingUp className="w-4 h-4 text-coral" />
                    <span className="text-xs font-bold text-coral uppercase tracking-wide">
                      Estimation
                    </span>
                  </div>
                  <p className="mt-6 text-sm text-white/60">Chiffre d&apos;affaires additionnel</p>
                  <p className="font-impact text-5xl md:text-6xl text-white leading-none mt-1">
                    {fmtDh(roiCalc.caAdditionnel)}
                    <span className="text-lg text-white/50 font-sans font-medium"> / mois</span>
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-white/60 text-sm">Coût Fidelio</span>
                      <span className="font-bold text-white">{fmtDh(roiCalc.cost)} / mois</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-white/60 text-sm">Bénéfice net</span>
                      <span
                        className={`font-impact text-2xl ${roiCalc.net > 0 ? 'text-coral' : 'text-white/50'
                          }`}
                      >
                        {roiCalc.net > 0 ? '+' : ''}
                        {fmtDh(roiCalc.net)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Retour sur investissement</span>
                      <span className="font-impact text-2xl text-coral">
                        ×
                        {roiCalc.ratio >= 10
                          ? Math.round(roiCalc.ratio)
                          : roiCalc.ratio.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 space-y-4">
                    <div className="rounded-2xl bg-coral px-5 py-4 text-center">
                      <p className="text-white/85 text-sm">Sur une année, cela représente</p>
                      <p className="font-impact text-3xl text-white mt-0.5">
                        {roiCalc.net > 0 ? '+' : ''}
                        {fmtDh(roiCalc.annuel)}
                      </p>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setSimError(null);
                        setSimSuccess(null);
                        setSimSubmitting(true);
                        const res = await submitLead({
                          source: 'simulateur',
                          prenom: simPrenom,
                          commerceName: simCommerce,
                          phone: simPhone,
                          simClientsParJour: roi.clients,
                          simPanierMoyen: roi.panier,
                          simGainMensuelDzd: Math.round(roiCalc.net),
                        });
                        setSimSubmitting(false);
                        if (!res.ok) {
                          setSimError(res.error || 'Veuillez vérifier vos informations');
                          return;
                        }
                        setSimSuccess(
                          `Simulation enregistrée (#${res.lead?.id.slice(0, 10)}) ! Un conseiller vous contactera.`
                        );
                        setSimPrenom('');
                        setSimCommerce('');
                        setSimPhone('');
                      }}
                      className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2.5"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                        Recevoir cette simulation &amp; demander une démo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Votre prénom"
                          value={simPrenom}
                          onChange={(e) => setSimPrenom(e.target.value)}
                          className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-coral"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Nom du commerce"
                          value={simCommerce}
                          onChange={(e) => setSimCommerce(e.target.value)}
                          className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-coral"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Téléphone (+213...)"
                          value={simPhone}
                          onChange={(e) => setSimPhone(e.target.value)}
                          className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-coral"
                        />
                      </div>
                      {simError && (
                        <p className="text-xs font-semibold text-red-400">{simError}</p>
                      )}
                      {simSuccess && (
                        <p className="text-xs font-semibold text-emerald-400">{simSuccess}</p>
                      )}
                      <button
                        type="submit"
                        disabled={simSubmitting}
                        className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-ink hover:bg-white/90 transition-colors disabled:opacity-50"
                      >
                        {simSubmitting
                          ? 'Enregistrement en base...'
                          : 'Enregistrer ma simulation & demander une démo'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Coral Wave Divider Top */}
          <div aria-hidden="true" className="relative leading-[0] -mb-px">
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="block h-[56px] w-full md:h-[110px] fill-coral"
              style={{ transform: 'scale(1, 1)' }}
            >
              <path
                d="M0,64 C240,128 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
                data-fond="orange"
              />
            </svg>
          </div>

          {/* ==============================================================
              SECTION 5: "FIDELIO EST FAIT POUR VOUS SI..."
              ============================================================== */}
          <section data-fond="orange" className="aplat bg-coral text-white">
            <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 md:py-14">
              <h2 className="max-w-3xl font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl">
                Fidelio est fait pour vous si…
              </h2>
              <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
                <div className="border-t-2 border-white/40 pt-6">
                  <p className="text-2xl font-bold leading-snug md:text-[1.7rem]">
                    vous voulez que vos clients reviennent, encore et encore
                  </p>
                  <p className="mt-3 text-[17px] leading-relaxed text-white/80">
                    Chaque visite construit une habitude : vos clients repartent avec une vraie raison de revenir — et ils reviennent.
                  </p>
                </div>
                <div className="border-t-2 border-white/40 pt-6">
                  <p className="text-2xl font-bold leading-snug md:text-[1.7rem]">
                    vous voulez savoir ce qui marche, pas deviner
                  </p>
                  <p className="mt-3 text-[17px] leading-relaxed text-white/80">
                    Qui revient, à quelle fréquence, quelles récompenses cartonnent : vous pilotez votre fidélité au lieu de la subir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Coral Wave Divider Bottom */}
          <div aria-hidden="true" className="relative leading-[0] -mt-px">
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="block h-[56px] w-full md:h-[110px] fill-coral"
              style={{ transform: 'scale(-1, -1)' }}
            >
              <path
                d="M0,64 C240,128 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
                data-fond="orange"
              />
            </svg>
          </div>

          {/* ==============================================================
              SECTION 6: TOUT POUR FIDÉLISER VOS CLIENTS (#fonctionnalites)
              ============================================================== */}
          <section
            id="fonctionnalites"
            className="scroll-mt-24 px-5 pb-20 pt-14 md:pb-28 md:pt-20"
          >
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <div className="mx-auto text-center max-w-2xl">
                  <p className="font-script text-2xl md:text-3xl text-coral">Tout-en-un</p>
                  <h2 className="mt-1 font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl text-ink">
                    Tout pour fidéliser vos clients
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
                {/* Column 1: Pour vos clients */}
                <div className="h-full rounded-[2rem] border border-ink/5 bg-white p-6 md:p-7">
                  <p className="font-script text-xl text-coral">Une carte qu&apos;ils gardent</p>
                  <h3 className="font-impact text-3xl uppercase leading-none tracking-tight text-ink">
                    Pour vos clients
                  </h3>
                  <ul className="mt-5">
                    {[
                      {
                        icon: Wallet,
                        title: 'Carte dans le wallet',
                        desc: "Apple Wallet & Google Wallet. Vos clients ajoutent leur carte en un tap, sans télécharger d'appli.",
                      },
                      {
                        icon: Gift,
                        title: 'Menu de récompenses',
                        desc: 'Plusieurs récompenses, chacune à son prix en points ou en tampons. Le client choisit, ou économise pour la plus belle.',
                      },
                      {
                        icon: Palette,
                        title: 'À vos couleurs',
                        desc: 'Logo, couleur, récompenses : votre programme reflète votre marque.',
                      },
                      {
                        icon: MapPin,
                        title: 'Notification à proximité',
                        desc: "Votre client passe devant votre boutique : sa carte s'affiche sur son écran, avec votre message. Sans rien envoyer.",
                      },
                      {
                        icon: Share2,
                        title: 'Page à partager',
                        desc: 'Vos récompenses sur une page publique, à mettre en story Instagram ou à envoyer sur WhatsApp.',
                      },
                    ].map((it) => (
                      <li key={it.title} className="flex gap-4 border-t border-ink/[0.07] py-4">
                        <it.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral" />
                        <div>
                          <p className="font-bold leading-snug text-ink">{it.title}</p>
                          <p className="mt-1 text-[15px] leading-relaxed text-ink/60">{it.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Au comptoir */}
                <div className="h-full rounded-[2rem] border border-ink/5 bg-white p-6 md:p-7">
                  <p className="font-script text-xl text-coral">Rien qui ralentisse</p>
                  <h3 className="font-impact text-3xl uppercase leading-none tracking-tight text-ink">
                    Au comptoir
                  </h3>
                  <ul className="mt-5">
                    {[
                      {
                        icon: ScanLine,
                        title: 'Scan en caisse',
                        desc: 'Pointez le QR code du client, ajoutez un tampon ou des points. Instantané.',
                      },
                      {
                        icon: WifiOff,
                        title: 'Marche sans internet',
                        desc: 'Le wifi tombe en plein rush ? La caisse continue. Tout se synchronise au retour du réseau.',
                      },
                      {
                        icon: Lock,
                        title: 'Accès employés',
                        desc: "Chaque serveur a son propre accès, limité à l'encaissement. Ni votre chiffre d'affaires, ni vos clients. Révocable en un clic.",
                      },
                      {
                        icon: GraduationCap,
                        title: 'Vos équipes formées',
                        desc: "Nous prenons vos employés en main : prise en main de la caisse, gestes du comptoir, quoi dire au client. Compris dans l'abonnement.",
                      },
                      {
                        icon: BarChart3,
                        title: 'Tableau de bord',
                        desc: 'Suivez clients, transactions et récompenses en temps réel, depuis votre téléphone.',
                      },
                    ].map((it) => (
                      <li key={it.title} className="flex gap-4 border-t border-ink/[0.07] py-4">
                        <it.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral" />
                        <div>
                          <p className="font-bold leading-snug text-ink">{it.title}</p>
                          <p className="mt-1 text-[15px] leading-relaxed text-ink/60">{it.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Pour qu'ils reviennent */}
                <div className="h-full rounded-[2rem] border border-ink/5 bg-white p-6 md:p-7">
                  <p className="font-script text-xl text-coral">Sans y penser</p>
                  <h3 className="font-impact text-3xl uppercase leading-none tracking-tight text-ink">
                    Pour qu&apos;ils reviennent
                  </h3>
                  <ul className="mt-5">
                    {[
                      {
                        icon: Zap,
                        title: 'Relances automatiques',
                        desc: 'Un client ne revient plus ? Il est relancé seul. Bientôt sa récompense ? Il est prévenu.',
                      },
                      {
                        icon: Mail,
                        title: 'Notifications & emails',
                        desc: "Vos messages sur l'écran verrouillé, iPhone comme Android. Campagnes email à votre nom, bienvenue et récompense automatiques.",
                      },
                      {
                        icon: Users,
                        title: 'Parrainage',
                        desc: 'Vos clients invitent leurs amis — les deux gagnent un bonus. La fidélité qui recrute pour vous.',
                      },
                      {
                        icon: Star,
                        title: 'Bonus avis Google',
                        desc: "Récompensez ceux qui vous laissent un avis. Plus d'avis, plus de visibilité, plus de clients.",
                      },
                      {
                        icon: Sparkles,
                        title: 'Fidelia AI',
                        desc: 'Il lit vos chiffres et vous dit quoi faire cette semaine : qui relancer, quelle récompense ajuster, quand envoyer.',
                      },
                    ].map((it) => (
                      <li key={it.title} className="flex gap-4 border-t border-ink/[0.07] py-4">
                        <it.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral" />
                        <div>
                          <p className="font-bold leading-snug text-ink">{it.title}</p>
                          <p className="mt-1 text-[15px] leading-relaxed text-ink/60">{it.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ==============================================================
              SECTION 7: LANCEZ-VOUS EN 3 ÉTAPES (#etapes)
              ============================================================== */}
          <section id="etapes" className="scroll-mt-24 px-5 pb-16 md:pb-20">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <div className="mx-auto text-center max-w-2xl">
                  <p className="font-script text-2xl md:text-3xl text-coral">
                    Simple comme bonjour
                  </p>
                  <h2 className="mt-1 font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl text-ink">
                    Lancez-vous en 3 étapes
                  </h2>
                </div>
              </div>

              <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
                <li className="relative">
                  <div className="flex items-center gap-4">
                    <span className="font-impact text-7xl leading-none text-coral">01</span>
                    <span aria-hidden="true" className="hidden h-px flex-1 bg-ink/15 md:block" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">Créez votre programme</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
                    Tampons ou points, votre récompense et vos couleurs. En 2 minutes.
                  </p>
                </li>
                <li className="relative">
                  <div className="flex items-center gap-4">
                    <span className="font-impact text-7xl leading-none text-coral">02</span>
                    <span aria-hidden="true" className="hidden h-px flex-1 bg-ink/15 md:block" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">Partagez votre QR code</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
                    Affichez-le en salle. Vos clients scannent et obtiennent leur carte. Vous avez déjà un fichier clients ? Importez-le, ils sont invités automatiquement.
                  </p>
                </li>
                <li className="relative">
                  <div className="flex items-center gap-4">
                    <span className="font-impact text-7xl leading-none text-coral">03</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">Récompensez &amp; fidélisez</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
                    Scannez à chaque visite. Vos clients reviennent pour leur récompense.
                  </p>
                </li>
              </ol>
            </div>
          </section>

          {/* Ink Wave Top */}
          <div aria-hidden="true" className="relative leading-[0] -mb-px">
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="block h-[56px] w-full md:h-[110px] fill-ink"
              style={{ transform: 'scale(-1, 1)' }}
            >
              <path
                d="M0,64 C240,128 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
                data-fond="encre"
              />
            </svg>
          </div>

          {/* ==============================================================
              SECTION 8: PERFORMANCE ("LA FIDÉLITÉ, ÇA CHANGE TOUT")
              ============================================================== */}
          <section id="performance" data-fond="encre" className="bg-ink">
            <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 md:py-14">
              <div className="mb-12">
                <div className="mx-auto text-center max-w-2xl">
                  <p className="font-script text-2xl md:text-3xl text-coral">
                    Des chiffres, pas des promesses
                  </p>
                  <h2 className="mt-1 font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl text-white">
                    La fidélité, ça change tout
                  </h2>
                  <p className="mt-4 text-[17px] leading-relaxed text-white/60">
                    Ce que montrent les études sur la rétention — la logique même de Fidelio.
                  </p>
                </div>
              </div>

              <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
                {[
                  {
                    stat: '5×',
                    text: "moins cher de fidéliser un client existant que d'en conquérir un nouveau",
                    source: 'Harvard Business Review',
                  },
                  {
                    stat: '+25 %',
                    text: "de bénéfices, et jusqu'à +95 %, pour seulement 5 % de rétention gagnée",
                    source: 'Bain & Company',
                  },
                  {
                    stat: '67 %',
                    text: 'de dépense en plus, en moyenne, pour un client fidèle face à un nouveau',
                    source: 'BIA Advisory Services',
                  },
                  {
                    stat: '80/20',
                    text: "vos 20 % de meilleurs clients pèsent souvent 80 % du chiffre d'affaires",
                    source: 'Principe de Pareto',
                  },
                ].map((item) => (
                  <div key={item.stat} className="flex h-full flex-col py-6 sm:px-5 lg:py-2">
                    <p className="font-impact text-6xl leading-none text-coral">{item.stat}</p>
                    <p className="mt-4 flex-1 text-[15px] leading-relaxed text-white/75">
                      {item.text}
                    </p>
                    <p className="mt-4 text-xs font-medium text-white/40">{item.source}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Ink Wave Bottom */}
          <div aria-hidden="true" className="relative leading-[0] -mt-px">
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="block h-[56px] w-full md:h-[110px] fill-ink"
              style={{ transform: 'scale(1, -1)' }}
            >
              <path
                d="M0,64 C240,128 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
                data-fond="encre"
              />
            </svg>
          </div>

          {/* ==============================================================
              SECTION 9: TÉMOIGNAGES (#temoignages)
              ============================================================== */}
          <section id="temoignages" className="bg-cream pt-20 md:pt-28">
            <div className="max-w-6xl mx-auto px-5">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <p className="font-script text-2xl text-coral">Ils en parlent</p>
                <h2 className="font-impact text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-ink leading-[0.95]">
                  Ce qu&apos;en disent les commerçants
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {[
                  {
                    quote:
                      "Mes clients n'installent rien : ils scannent, et ils ont la carte. Et ça marche : un passage sur deux vient d'un client fidèle.",
                    name: 'Burger Chwaya',
                    city: '',
                    logo: '/landing/logos/burger-chwaya.png',
                    rot: '-rotate-1',
                  },
                  {
                    quote:
                      'Plus de 280 clients ont pris la carte en une semaine, et ceux qui reviennent dépensent un peu plus que les autres.',
                    name: 'ADN Restaurant',
                    city: 'Oran',
                    logo: '/landing/logos/adn-restaurant.png',
                    rot: 'rotate-1',
                  },
                  {
                    quote:
                      "Un passage sur deux, c'est un client qui revient. La carte est dans son téléphone, il l'a toujours sur lui.",
                    name: 'BELATI',
                    city: 'Alger',
                    logo: '/landing/logos/belati.png',
                    rot: '-rotate-[0.5deg]',
                  },
                  {
                    quote: "Le client scanne le QR à table, et il a sa carte avant l'addition.",
                    name: 'Darb Side',
                    city: '',
                    logo: '/landing/logos/darb-side.png',
                    rot: '-rotate-1',
                  },
                  {
                    quote:
                      "La carte est à nos couleurs, et l'équipe a compris le scan en caisse tout de suite.",
                    name: 'La Table Du Burger',
                    city: '',
                    logo: '/landing/logos/la-table-du-burger.png',
                    rot: 'rotate-1',
                  },
                ].map((tItem) => (
                  <div
                    key={tItem.name}
                    className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                  >
                    <figure
                      className={`h-full rounded-3xl border-2 border-ink bg-white p-6 shadow-hard flex flex-col ${tItem.rot}`}
                    >
                      <span
                        aria-hidden="true"
                        className="font-impact text-6xl leading-none text-coral"
                      >
                        “
                      </span>
                      <blockquote className="-mt-3 flex-1 text-base leading-relaxed text-ink/80">
                        {tItem.quote}
                      </blockquote>
                      <figcaption className="mt-6 flex items-center gap-3 border-t-2 border-ink/10 pt-4">
                        <img
                          alt={tItem.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 flex-shrink-0 rounded-2xl border-2 border-ink/10 bg-white object-contain"
                          src={tItem.logo}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-ink">
                            {tItem.name}
                          </span>
                          <span className="block truncate text-xs text-ink/50">{tItem.city}</span>
                        </span>
                      </figcaption>
                    </figure>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==============================================================
              SECTION 10: TARIFS (#tarifs — Exact module 26545)
              ============================================================== */}
          <section id="tarifs" className="scroll-mt-24 px-5 pb-16 pt-14 md:pb-20 md:pt-20">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <div className="mx-auto text-center max-w-2xl">
                  <p className="font-script text-2xl md:text-3xl text-coral">Tarifs</p>
                  <h2 className="mt-1 font-impact text-[2.6rem] uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl text-ink">
                    Un prix clair, par point de vente.
                  </h2>
                  <p className="mt-4 text-[17px] leading-relaxed text-ink/60">
                    Toutes les fonctionnalités, sans option ni palier : 397 DZD par mois et par adresse. Vous n&apos;en réglez que ce que vous exploitez.
                  </p>
                </div>
              </div>

              <div className="mx-auto max-w-md space-y-5">
                <div className="max-w-md mx-auto space-y-4">
                  {/* Free Tier Card */}
                  <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard">
                    <StickerBadge rotate={-3} tone="coral">
                      Pour démarrer
                    </StickerBadge>
                    <p className="mt-3 font-impact text-3xl uppercase leading-[0.95] tracking-tight text-ink">
                      Gratuit jusqu&apos;à 30 clients
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">
                      Toutes les fonctionnalités, sans carte bancaire. Vous ne payez que le jour où votre 30e client s&apos;inscrit.
                    </p>
                    <ul className="mt-4 space-y-2.5">
                      <li className="flex items-start gap-2.5 text-sm text-ink/80">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" />
                        Scan, récompenses, notifications et relances
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-ink/80">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" />
                        Cartes Apple Wallet et Google Wallet
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-ink/80">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-coral" />
                        Plaque NFC à commander à part : 150 DZD, une seule fois
                      </li>
                    </ul>
                    <Link
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                      to="/demarrer"
                    >
                      Créer mon espace gratuit
                    </Link>
                  </div>

                  <p className="pt-3 text-center font-bold uppercase tracking-[0.16em] text-xs text-ink/55">
                    Au-delà de 30 clients
                  </p>

                  {/* Points de vente stepper */}
                  <div>
                    <p className="mb-2 font-bold uppercase tracking-[0.16em] text-xs text-ink/55">
                      Nombre de points de vente
                    </p>
                    <div className="flex items-center justify-between rounded-2xl border-2 border-ink/[0.07] bg-white p-1.5">
                      <button
                        type="button"
                        aria-label="Un point de vente de moins"
                        disabled={pdv <= 1}
                        onClick={() => setPdv((v) => Math.max(1, v - 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-ink/[0.05] disabled:opacity-25"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="flex items-baseline gap-2">
                        <span className="font-impact text-3xl leading-none text-ink">{pdv}</span>
                        <span className="text-sm font-bold text-ink/55">
                          {pdv > 1 ? 'points de vente' : 'point de vente'}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label="Un point de vente de plus"
                        onClick={() => setPdv((v) => Math.min(99, v + 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-ink/[0.05] disabled:opacity-25"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Billing cycle radio group */}
                  <div
                    role="radiogroup"
                    aria-label="Rythme de facturation"
                    className="flex gap-1 rounded-2xl border-2 border-ink/[0.07] bg-white p-1"
                  >
                    {BILLING_CYCLES.map((c) => (
                      <button
                        key={c.cle}
                        type="button"
                        role="radio"
                        aria-checked={rythme === c.cle}
                        onClick={() => setRythme(c.cle)}
                        className={`flex-1 rounded-xl font-bold transition-colors min-h-11 text-sm ${rythme === c.cle ? 'bg-ink text-white' : 'text-ink/55 hover:text-ink'
                          }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Main Coral Subscription Card */}
                  <div className="relative flex flex-col rounded-3xl bg-coral p-8 text-white shadow-hard-coral">
                    <StickerBadge
                      rotate={8}
                      tone="ink"
                      className="absolute -top-3 right-5"
                    >
                      Tout inclus
                    </StickerBadge>
                    <p className="font-display text-lg font-bold">Fidelio</p>
                    <p className="mt-1 text-sm text-white/75">
                      Tout inclus · TTC · sans surprise
                    </p>
                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="font-impact text-5xl">{fmtNum(priceCalc.perMonth)}</span>
                      <span className="text-lg font-bold text-white/80">
                        DZD<span className="text-sm font-medium">/ mois</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/70">
                      397 DZD × {pdv} {pdv > 1 ? 'points de vente' : 'point de vente'} —{' '}
                      {priceCalc.cycle.note}
                    </p>

                    {priceCalc.saved > 0 && (
                      <p className="mt-3 inline-flex self-start rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                        {priceCalc.cycle.moisOfferts} mois offert
                        {priceCalc.cycle.moisOfferts > 1 ? 's' : ''} — Économisez{' '}
                        {fmtNum(priceCalc.saved)} DZD
                      </p>
                    )}

                    <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-sm font-bold text-white">
                        5 000 emails par point de vente, chaque mois
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Bienvenue, confirmations, relances automatiques. Les campagnes s’ajoutent par pack. Notifications push sans limite.
                      </p>
                    </div>

                    <ul className="mt-6 flex-1 space-y-3">
                      {[
                        'Clients illimités',
                        'Carte digitale personnalisée à votre image',
                        'Apple & Google Wallet',
                        'Menu de récompenses par paliers',
                        'Scan en caisse illimité, même sans internet',
                        'Accès employés limités et révocables',
                        'Relances automatiques',
                        'Notifications & campagnes email',
                        'Parrainage et bonus avis Google',
                        'Statistiques en temps réel',
                        'Formation de vos employés',
                        'Conseiller IA et notification à proximité',
                        'Support prioritaire',
                      ].map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5 text-sm">
                          <Check className="h-4 w-4 flex-shrink-0 text-white" />
                          <span className="text-white/90">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 flex flex-col gap-2.5">
                      <Link
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-bold text-white shadow-[3px_3px_0_0_rgb(var(--coral-dark-rgb))]"
                        to="/register"
                      >
                        Commencer maintenant
                      </Link>
                      <Link
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                        to="/rendez-vous"
                      >
                        Demander une démo
                      </Link>
                    </div>
                  </div>

                  {/* Email Packs */}
                  <div className="rounded-3xl border-2 border-ink/[0.07] bg-white p-4">
                    <p className="mb-3 text-center font-bold uppercase tracking-[0.16em] text-xs text-ink/55">
                      Pour envoyer des campagnes
                    </p>
                    <div className="space-y-2">
                      {[
                        { emails: '10 000', mad: 200 },
                        { emails: '25 000', mad: 400 },
                        { emails: '50 000', mad: 700 },
                      ].map((pk) => (
                        <div
                          key={pk.emails}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-ink/[0.03] px-4 py-2.5"
                        >
                          <span className="text-sm font-bold text-ink">
                            +{pk.emails} emails / mois
                          </span>
                          <span className="text-sm font-bold text-coral">
                            +{pk.mad} DZD/ mois
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                      Les campagnes ne partent que sur un pack, ajouté à votre abonnement en un seul prélèvement. Un pack plus grand s&apos;active tout de suite ; réduire ou retirer prend effet au prélèvement suivant.
                    </p>
                  </div>

                  {/* Sur devis */}
                  <div className="rounded-3xl border-2 border-ink/[0.07] bg-white p-5">
                    <p className="font-display text-base font-bold text-ink">Sur devis</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Toute demande personnalisée est sur devis : API avec pare-feu dédié, commande de cartes en grand volume, etc.
                    </p>
                    <ul className="mt-4 space-y-2.5">
                      <li className="flex items-center gap-2.5 text-sm text-ink/80">
                        <Shield className="h-4 w-4 flex-shrink-0 text-coral" />
                        API avec pare-feu dédié
                      </li>
                      <li className="flex items-center gap-2.5 text-sm text-ink/80">
                        <CreditCard className="h-4 w-4 flex-shrink-0 text-coral" />
                        Commande de cartes en grand volume
                      </li>
                    </ul>
                    <a
                      href="https://wa.me/212642695137?text=Bonjour%2C%20je%20souhaite%20un%20tarif%20sur%20mesure%20pour%20Fidelio%20(API%20ou%20commande%20de%20cartes%20en%20volume).%20Mon%20commerce%20%3A%20"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink/10 py-3 text-sm font-bold text-ink transition-colors hover:bg-ink/[0.04]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Demander mon tarif
                    </a>
                  </div>
                </div>

                {/* NFC Acrylic Card Box */}
                <div className="flex items-center gap-5 rounded-[2rem] border border-ink/5 bg-white p-5">
                  <img
                    src="/nfc-card.png"
                    alt="Carte NFC acrylique Fidelio"
                    className="garder-clair h-auto w-24 flex-shrink-0 rounded-xl object-contain sm:w-28"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="font-impact text-3xl text-ink">150</span>
                      <span className="text-sm font-bold text-ink/60">DZD</span>
                      <span className="text-xs font-medium text-ink/50">· une seule fois</span>
                    </div>
                    <p className="mt-0.5 font-bold text-ink">Carte NFC acrylique</p>
                    <p className="mt-0.5 text-sm leading-snug text-ink/60">
                      Posée en caisse. Vos clients approchent leur téléphone pour rejoindre le programme — sans QR, sans appli.
                    </p>
                    <p className="mt-1 text-xs text-ink/50">
                      Le prix baisse avec la quantité commandée.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Coral Wave Divider */}
          <div aria-hidden="true" className="relative leading-[0] -mb-px">
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="block h-[56px] w-full md:h-[110px] fill-coral"
              style={{ transform: 'scale(1, 1)' }}
            >
              <path
                d="M0,64 C240,128 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
                data-fond="orange"
              />
            </svg>
          </div>

          {/* ==============================================================
              SECTION 11: FINAL CTA ("PRÊT À FAIRE REVENIR VOS CLIENTS ?")
              ============================================================== */}
          <section data-fond="orange" className="aplat bg-coral text-white">
            <div className="mx-auto max-w-6xl px-6 py-12 text-center sm:px-10 md:py-20">
              <h2 className="mx-auto max-w-3xl font-impact text-[2.8rem] uppercase leading-[0.88] tracking-tight sm:text-6xl md:text-7xl">
                Prêt à faire revenir vos clients ?
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-white/80">
                Créez votre programme de fidélité en quelques minutes et transformez vos clients en habitués.
              </p>
              <Link
                className="mt-9 inline-flex min-h-14 items-center gap-2 rounded-2xl bg-ink px-8 text-base font-bold text-white shadow-[4px_4px_0_0_rgb(var(--coral-dark-rgb))]"
                to="/register"
              >
                Créer mon espace gratuit
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Link>
            </div>
          </section>

          {/* Coral to Ink Wave */}
          <div
            aria-hidden="true"
            data-fond="orange"
            className="relative leading-[0] -mb-px aplat bg-coral"
          >
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="block h-[56px] w-full md:h-[110px] fill-ink"
              style={{ transform: 'scale(-1, 1)' }}
            >
              <path
                d="M0,64 C240,128 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
                data-fond="encre"
              />
            </svg>
          </div>

          {/* ==============================================================
              EXACT FOOTER
              ============================================================== */}
          <footer
            data-fond="encre"
            className="relative overflow-hidden bg-ink pb-[env(safe-area-inset-bottom)] text-white"
          >
            {/* Giant Watermark Wordmark ("FIDELIO") centered behind the footer text at low opacity */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none"
            >
              <span
                className="block text-center font-sans font-black uppercase tracking-[-0.04em] leading-none text-white/[0.045]"
                style={{ fontSize: 'clamp(5rem, 20vw, 18rem)' }}
              >
                FIDELIO
              </span>
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 sm:px-10">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="flex flex-col items-center gap-2 md:items-start">
                  <BrandLogo size={30} variant="light" />
                  <p className="text-sm text-white/55">La fidélité qui régale.</p>
                </div>
                <nav
                  aria-label="Pied de page"
                  className="flex flex-wrap items-center justify-center gap-1 text-sm text-white/70"
                >
                  <a
                    href="#fonctionnalites"
                    className="flex min-h-11 items-center rounded-full px-3 hover:text-white"
                  >
                    Fonctionnalités
                  </a>
                  <a
                    href="#tarifs"
                    className="flex min-h-11 items-center rounded-full px-3 hover:text-white"
                  >
                    Tarifs
                  </a>
                  <Link
                    className="flex min-h-11 items-center rounded-full px-3 hover:text-white"
                    to="/login"
                  >
                    Connexion
                  </Link>
                  <Link
                    className="flex min-h-11 items-center rounded-full px-3 text-coral font-bold hover:text-white"
                    to="/dashboard"
                  >
                    Dashboard Démo
                  </Link>
                </nav>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 text-sm text-white/55 md:justify-start">
                <Link className="flex min-h-11 items-center px-2 hover:text-white" to="/confidentialite">
                  Confidentialité
                </Link>
                <Link className="flex min-h-11 items-center px-2 hover:text-white" to="/conditions">
                  Conditions générales de vente
                </Link>
                <Link className="flex min-h-11 items-center px-2 hover:text-white" to="/mentions-legales">
                  Mentions légales
                </Link>
              </div>

              <div className="garder-clair mt-6 flex justify-center md:justify-start">
                <img
                  alt="Ce site web est sécurisé 3D Secure — Payzone, Visa, Mastercard"
                  width={680}
                  height={70}
                  className="h-8 w-auto opacity-80 sm:h-9"
                  src="/paiement/payzone-3ds-clair.png"
                />
              </div>

              <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
                <p>© 2026 Fidelio. Tous droits réservés. · Contact : <a href="mailto:fidelioapp.support@gmail.com" className="underline hover:text-white">fidelioapp.support@gmail.com</a></p>
                <p className="inline-flex items-center gap-1">
                  Fait avec <Star className="h-3 w-3 fill-coral text-coral" /> en Algérie
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
