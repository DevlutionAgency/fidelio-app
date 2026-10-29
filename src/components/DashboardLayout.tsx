import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Users,
  Gift,
  Bell,
  MessageSquare,
  Store,
  ShieldCheck,
  QrCode,
  Palette,
  CodeXml,
  Settings,
  ScanLine,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Plus,
  Check,
  Ellipsis,
  X,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogo, BrandMark } from './BrandLogo';

/* ============================================================================
   SECTION SUB-NAVIGATION TABS (Exact replica of module 66313 from source-18)
   ============================================================================ */
export const DASHBOARD_SECTIONS: Record<
  string,
  {
    titre: string;
    onglets: { href: string; label: string; titulaire?: boolean }[];
  }
> = {
  programme: {
    titre: 'Programme',
    onglets: [
      { href: '/rewards', label: 'Récompenses' },
      { href: '/program', label: 'Règles', titulaire: true },
    ],
  },
  messages: {
    titre: 'Messages',
    onglets: [
      { href: '/notifications', label: 'Notifications' },
      { href: '/automations', label: 'Automatiques' },
      { href: '/campaigns', label: 'Emails' },
    ],
  },
  clients: {
    titre: 'Clients',
    onglets: [
      { href: '/customers', label: 'Mes clients' },
      { href: '/clients-import', label: 'Importer' },
    ],
  },
  equipe: {
    titre: 'Équipe',
    onglets: [
      { href: '/caisses', label: 'Caisses employé' },
      { href: '/equipe', label: 'Responsables' },
    ],
  },
  compte: {
    titre: 'Mon compte',
    onglets: [
      { href: '/settings', label: 'Paramètres', titulaire: true },
      { href: '/billing', label: 'Abonnement', titulaire: true },
      { href: '/donnees-clients', label: 'Données clients', titulaire: true },
    ],
  },
};

export function isSectionActive(sectionKey: string, pathname: string): boolean {
  const sec = DASHBOARD_SECTIONS[sectionKey];
  if (!sec) return false;
  return sec.onglets.some((t) => pathname === t.href || pathname.startsWith(t.href + '/'));
}

export function getActiveSectionKey(pathname: string): string | null {
  for (const key of Object.keys(DASHBOARD_SECTIONS)) {
    if (isSectionActive(key, pathname)) return key;
  }
  return null;
}

/* ============================================================================
   DESKTOP SIDEBAR NAV ITEMS (Exact replica of module 22595 from source-18)
   ============================================================================ */
const SIDEBAR_ITEMS = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/customers', label: 'Clients', icon: Users, section: 'clients' },
  { href: '/rewards', label: 'Programme', icon: Gift, section: 'programme' },
  { href: '/notifications', label: 'Messages', icon: Bell, section: 'messages' },
  { href: '/reviews', label: 'Avis Google', icon: MessageSquare },
  { href: '/caisses', label: 'Équipe', icon: ShieldCheck, section: 'equipe', reglage: true },
  { href: '/qrcode', label: 'QR Code', icon: QrCode, reglage: true },
  { href: '/branding', label: 'Apparence', icon: Palette, reglage: true },
  { href: '/api-cles', label: 'API', icon: CodeXml, reglage: true },
  { href: '/settings', label: 'Mon compte', icon: Settings, section: 'compte', reglage: true },
];

/* ============================================================================
   MOBILE BOTTOM BAR & DRAWER ITEMS (Exact replica of module 2872 from source-18)
   ============================================================================ */
const MOBILE_PRIMARY_TABS = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/customers', label: 'Clients', icon: Users, section: 'clients' },
  { href: '/scan', label: 'Scanner', icon: ScanLine, isCentral: true },
  { href: '/rewards', label: 'Programme', icon: Gift, section: 'programme' },
];

const MOBILE_DRAWER_ITEMS = [
  { href: '/points-de-vente', label: 'Points de vente', icon: Store },
  { href: '/notifications', label: 'Messages', icon: Bell, section: 'messages' },
  { href: '/reviews', label: 'Avis Google', icon: MessageSquare },
  { href: '/caisses', label: 'Équipe', icon: ShieldCheck, section: 'equipe' },
  { href: '/qrcode', label: 'QR Code', icon: QrCode },
  { href: '/branding', label: 'Apparence', icon: Palette },
  { href: '/api-cles', label: 'API', icon: CodeXml },
  { href: '/settings', label: 'Mon compte', icon: Settings, section: 'compte' },
];

/* ============================================================================
   MOBILE HEADER TITLES (Exact replica of module 19928 from source-18)
   ============================================================================ */
const MOBILE_TITLE_MAP: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/customers': 'Clients',
  '/clients-import': 'Clients',
  '/scan': 'Scanner',
  '/caisse': 'Scanner',
  '/campaigns': 'Messages',
  '/notifications': 'Messages',
  '/automations': 'Messages',
  '/rewards': 'Programme',
  '/program': 'Programme',
  '/caisses': 'Équipe',
  '/equipe': 'Équipe',
  '/qrcode': 'QR Code',
  '/reviews': 'Avis Google',
  '/conseiller': 'Fidelia AI',
  '/branding': 'Apparence',
  '/api-cles': 'API',
  '/donnees-clients': 'Mon compte',
  '/points-de-vente': 'Points de vente',
  '/billing': 'Mon compte',
  '/settings': 'Mon compte',
  '/admin': 'Console Admin',
};

/* ============================================================================
   LIQUID GLASS SVG DEFS + PREMIUM GRAIN (Exact replica of module 80996 & 91739)
   ============================================================================ */
const LiquidGlassAndBackground: React.FC<{ skin: 'premium' | 'classique' }> = ({ skin }) => {
  if (skin !== 'premium') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(at 15% 0%, #f94c3a 0px, transparent 45%), radial-gradient(at 100% 20%, #7c3aed 0px, transparent 40%)',
        }}
      />
    );
  }
  return (
    <>
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
            '--grain-image':
              "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")",
          } as React.CSSProperties
        }
      />
      <div aria-hidden="true" className="fond-premium pointer-events-none fixed inset-0" />
    </>
  );
};

/* ============================================================================
   COLLAPSED SIDEBAR TOOLTIP PORTAL (Exact replica of module 22595 `I` & `M`)
   ============================================================================ */
interface TooltipState {
  libelle: string;
  x: number;
  y: number;
}

function makeTooltipHandlers(
  label: string,
  setBulle: React.Dispatch<React.SetStateAction<TooltipState | null>>
) {
  const show = (e: React.PointerEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const asideRect = e.currentTarget.closest('aside')?.getBoundingClientRect();
    setBulle({
      libelle: label,
      y: rect.top + rect.height / 2,
      x: (asideRect ? asideRect.right : rect.right) + 10,
    });
  };
  const hide = () => setBulle(null);
  return {
    onPointerEnter: show,
    onPointerLeave: hide,
    onFocus: show,
    onBlur: hide,
  };
}

const SidebarTooltipPortal: React.FC<{ bulle: TooltipState | null }> = ({ bulle }) => {
  if (!bulle || typeof document === 'undefined') return null;
  return createPortal(
    <span
      role="tooltip"
      className="verre-flottant pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-lg [[data-skin=premium]_&]:text-ink"
      style={{ top: bulle.y, left: bulle.x }}
    >
      {bulle.libelle}
    </span>,
    document.body
  );
};

/* ============================================================================
   FIDELIA AI INTERACTIVE Q&A & FLOATING WIDGET (Exact replica of 30925 & 61566)
   ============================================================================ */
const FIDELIA_QUESTIONS: Record<string, string> = {
  relance_proches: 'Qui relancer cette semaine ?',
  avis_google: 'Comment obtenir plus d’avis Google 5★ ?',
  paliers: 'Mes paliers de récompense sont-ils bien réglés ?',
  caisse: 'Comment accélérer le scan en caisse ?',
};

const FIDELIA_ANSWERS: Record<
  string,
  { paragraphes: string[]; action?: { libelle: string; lien: string } }
> = {
  relance_proches: {
    paragraphes: [
      'Vous avez **4 clients fidèles** à moins de 15 points de leur prochaine récompense.',
      '· Envoyez-leur une notification Push Wallet gratuite aujourd’hui : **38% reviennent sous 48h**.',
    ],
    action: { libelle: 'Envoyer une notification Push', lien: '/notifications' },
  },
  avis_google: {
    paragraphes: [
      'Offrir **+20 points** pour un avis Google Maps vérifié convertit en moyenne **1 client fidèle sur 3**.',
      '· Le lien Google s’affiche automatiquement au dos de leur carte Apple & Google Wallet après le 2e passage.',
    ],
    action: { libelle: 'Configurer mes Avis Google', lien: '/reviews' },
  },
  paliers: {
    paragraphes: [
      'Votre premier palier doit être atteignable dès la **2e ou 3e visite** pour créer l’habitude.',
      '· Gardez un cadeau d’appel rapide (ex: 30 pts) et un palier VIP plus généreux (ex: 120 pts).',
    ],
    action: { libelle: 'Ajuster mon menu de récompenses', lien: '/rewards' },
  },
  caisse: {
    paragraphes: [
      'Activez un **compte Caisse Employé** dédié sur le téléphone ou la tablette du comptoir.',
      '· Vos équipiers scannent en **2 secondes** sans avoir accès à vos réglages ni à votre chiffre d’affaires.',
    ],
    action: { libelle: 'Gérer les caisses employés', lien: '/caisses' },
  },
};

const FideliaFloatingWidget: React.FC<{ pathname: string; restaurantName: string }> = ({
  pathname,
  restaurantName,
}) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const hiddenRoutes = ['/scan', '/conseiller', '/branding'];
  if (hiddenRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  const askQuestion = (qKey: string) => {
    setHistory((prev) => [...prev.filter((k) => k !== qKey), qKey].slice(-6));
    setShowAllQuestions(false);
  };

  return (
    <>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
          />
          <div
            role="dialog"
            aria-label="Fidelia AI"
            className="fixed z-50 inset-x-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] verre-flottant flex max-h-[min(70dvh,560px)] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl md:inset-x-auto md:w-[380px] md:max-h-[min(75vh,600px)] md:right-6 md:bottom-24"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full brand-gradient">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-ink">Fidelia AI</p>
                <p className="text-xs text-muted-foreground">Vos chiffres, lus pour vous</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-slate-50 px-4 py-3 text-sm leading-relaxed text-ink">
                Bonjour <strong>{restaurantName}</strong> ! Votre taux de retour fidélité est de{' '}
                <strong>68%</strong> cette semaine. Voici vos priorités immédiates :
              </div>

              <div className="space-y-2">
                {[
                  {
                    urgence: 'haute',
                    titre: 'Relancer 4 clients à moins de 15 pts d’un cadeau',
                    lien: '/notifications',
                  },
                  {
                    urgence: 'moyenne',
                    titre: 'Activer le bonus Avis Google Maps (+20 pts)',
                    lien: '/reviews',
                  },
                ].map((c, idx) => (
                  <Link
                    key={idx}
                    to={c.lien}
                    className="group flex items-start gap-3 rounded-2xl border border-ink/[0.08] px-3 py-2.5 transition-colors hover:border-coral/40 hover:bg-coral/[0.03]"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        c.urgence === 'haute'
                          ? 'bg-rose-500'
                          : c.urgence === 'moyenne'
                          ? 'bg-amber-400'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink">
                      {c.titre}
                    </span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-coral transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>

              {/* Interactive Q&A module 61566 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-ink/40" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink/40">
                      Posez-moi une question
                    </h2>
                  </div>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHistory([])}
                      className="text-xs font-semibold text-muted-foreground transition-colors hover:text-ink"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="space-y-4">
                    {history.map((qKey, i) => {
                      const ans = FIDELIA_ANSWERS[qKey];
                      return (
                        <div key={`${qKey}-${i}`} className="space-y-2.5">
                          <div className="flex justify-end">
                            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">
                              {FIDELIA_QUESTIONS[qKey]}
                            </p>
                          </div>
                          <div className="flex justify-start">
                            <div className="max-w-[92%] space-y-2 rounded-2xl rounded-bl-md border border-ink/[0.08] bg-white px-4 py-3.5">
                              {ans.paragraphes.map((p, idx) => (
                                <p
                                  key={idx}
                                  className="text-sm leading-relaxed text-muted-foreground"
                                >
                                  {p.replace(/\*\*/g, '')}
                                </p>
                              ))}
                              {ans.action && (
                                <Link
                                  to={ans.action.lien}
                                  className="inline-flex items-center gap-1.5 pt-1 text-sm font-bold text-coral transition-transform hover:translate-x-0.5"
                                >
                                  {ans.action.libelle}
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {Object.keys(FIDELIA_QUESTIONS)
                    .slice(0, showAllQuestions ? 4 : 2)
                    .map((qKey) => (
                      <button
                        key={qKey}
                        type="button"
                        onClick={() => askQuestion(qKey)}
                        className="rounded-2xl border-2 border-coral/25 bg-coral/[0.04] px-3.5 py-2 text-left text-sm font-semibold text-ink transition-colors hover:border-coral/50 hover:bg-coral/[0.08]"
                      >
                        {FIDELIA_QUESTIONS[qKey]}
                      </button>
                    ))}
                  {!showAllQuestions && (
                    <button
                      type="button"
                      onClick={() => setShowAllQuestions(true)}
                      className="inline-flex items-center gap-1 rounded-2xl border-2 border-dashed border-ink/15 px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-ink/30 hover:text-ink"
                    >
                      Autres questions
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <Link
                to="/conseiller"
                className="block pt-1 text-center text-xs font-semibold text-muted-foreground transition-colors hover:text-ink"
              >
                Voir l'analyse complète
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Fermer Fidelia AI' : 'Ouvrir Fidelia AI — une action urgente vous attend'}
        title="Fidelia AI — glissez pour déplacer"
        data-mouvement=""
        className={`fixed z-50 flex h-14 w-14 cursor-grab items-center justify-center rounded-full brand-gradient shadow-lg shadow-coral/30 ring-4 ring-white active:cursor-grabbing dark:ring-[#1d1a18] right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6 ${
          open ? 'max-md:hidden' : ''
        }`}
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Sparkles className="h-6 w-6 text-white" />
        )}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-red-500 dark:border-[#1d1a18]" />
          </span>
        )}
      </button>
    </>
  );
};

/* ============================================================================
   MAIN DASHBOARD LAYOUT (Exact 1:1 DOM of source-18)
   ============================================================================ */
export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    commerce,
    commerces,
    selectCommerce,
    customers,
    darkMode,
    toggleDarkMode,
    skin,
    toggleSkin,
    logout,
  } = useStore();

  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [bulle, setBulle] = useState<TooltipState | null>(null);

  const asideRef = useRef<HTMLElement | null>(null);

  // Sync documentElement classes & attributes exactly like modules 14586 & 49679
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-skin', skin);
    el.classList.toggle('dark', darkMode);
    return () => {
      el.classList.remove('dark');
    };
  }, [skin, darkMode]);

  // Pointer cursor reflection on sidebar (`--reflet-x`, `--reflet-y`, `--reflet`) from module 22595
  useEffect(() => {
    const t = asideRef.current;
    if (!t || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let raf = 0;
    let nx = 0;
    let ny = 0;
    function apply() {
      raf = 0;
      if (!t) return;
      t.style.setProperty('--reflet-x', `${nx}px`);
      t.style.setProperty('--reflet-y', `${ny}px`);
    }
    function onMove(e: PointerEvent) {
      if (!t) return;
      const rect = t.getBoundingClientRect();
      nx = e.clientX - rect.left;
      ny = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(apply);
    }
    const onEnter = () => t.style.setProperty('--reflet', '1');
    const onLeave = () => t.style.setProperty('--reflet', '0');

    t.addEventListener('pointermove', onMove);
    t.addEventListener('pointerenter', onEnter);
    t.addEventListener('pointerleave', onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      t.removeEventListener('pointermove', onMove);
      t.removeEventListener('pointerenter', onEnter);
      t.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const isNavItemActive = (item: { href: string; section?: string }) => {
    if (item.section) {
      return isSectionActive(item.section, location.pathname);
    }
    return (
      location.pathname === item.href || location.pathname.startsWith(item.href + '/')
    );
  };

  const activeSectionKey = getActiveSectionKey(location.pathname);
  const activeSection = activeSectionKey ? DASHBOARD_SECTIONS[activeSectionKey] : null;

  const mobileTitle =
    MOBILE_TITLE_MAP[location.pathname] ||
    MOBILE_TITLE_MAP[
      Object.keys(MOBILE_TITLE_MAP).find((k) => location.pathname.startsWith(k)) || ''
    ] ||
    'Dashboard';

  const isDrawerRouteActive = MOBILE_DRAWER_ITEMS.some(isNavItemActive);

  return (
    <div
      data-skin={skin}
      data-rail={collapsed ? 'ferme' : 'ouvert'}
      className={`min-h-screen bg-[#faf9f8] text-ink relative${darkMode ? ' dark' : ''}`}
    >
      <LiquidGlassAndBackground skin={skin} />

      {/* ====================================================================
          DESKTOP SIDEBAR (Exact replica of module 22595)
          ==================================================================== */}
      <aside
        ref={asideRef}
        className="verre-fort verre-refracte barre-flottante reflet-curseur transition-rail fixed left-0 top-0 z-20 hidden h-screen w-[var(--largeur-rail)] flex-col border-r border-slate-100 bg-white/80 backdrop-blur-xl md:flex"
      >
        {/* Top Logo + Restaurant Name + Collapse Toggle */}
        <div
          className={`flex items-center border-b border-slate-100 py-5 ${
            collapsed ? 'justify-center px-3' : 'px-5'
          }`}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Déplier le menu"
              aria-label="Déplier le menu"
              aria-expanded={false}
              className="rounded-xl p-1 transition-transform active:scale-95"
            >
              <BrandMark size={30} />
            </button>
          ) : (
            <div className="min-w-0 flex-1">
              <Link to="/">
                <BrandLogo size={28} variant={darkMode ? 'light' : 'dark'} />
              </Link>
              <p className="mt-2 truncate pl-0.5 text-[11px] text-muted-foreground">
                {commerce.name}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Ranger le menu"
              aria-label="Ranger le menu"
              aria-expanded={true}
              className="-mr-1 ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-ink/35 transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Primary CTA: Scanner un client */}
        <div className={collapsed ? 'px-2.5 pt-3' : 'px-3 pt-3'}>
          <Link
            to="/scan"
            aria-label={collapsed ? 'Scanner un client' : undefined}
            {...(collapsed ? makeTooltipHandlers('Scanner un client', setBulle) : {})}
            className={`flex items-center rounded-2xl bg-coral py-3 text-sm font-bold text-white shadow-hard-coral transition-transform active:scale-[0.97] ${
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'
            }`}
          >
            <ScanLine className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && 'Scanner un client'}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav
          className={`bord-defilant min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden py-4 ${
            collapsed ? 'px-2.5' : 'px-3'
          }`}
        >
          {SIDEBAR_ITEMS.map((item, idx, arr) => {
            const Icon = item.icon;
            const isFirstReglage = item.reglage && !arr[idx - 1]?.reglage;
            const active = isNavItemActive(item);

            return (
              <div key={item.href}>
                {isFirstReglage &&
                  (collapsed ? (
                    <div className="mx-3 my-2.5 h-px bg-ink/[0.08]" aria-hidden="true" />
                  ) : (
                    <p className="px-3 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/35">
                      Réglages
                    </p>
                  ))}
                <Link
                  to={item.href}
                  aria-label={collapsed ? item.label : undefined}
                  {...(collapsed ? makeTooltipHandlers(item.label, setBulle) : {})}
                  className={`group relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 brand-gradient-soft rounded-xl" />
                  )}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 brand-gradient rounded-full" />
                  )}
                  <Icon
                    className={`w-4 h-4 relative z-10 transition-colors ${
                      active
                        ? 'text-coral'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {!collapsed && (
                    <span
                      className={`relative z-10 whitespace-nowrap transition-colors ${
                        active
                          ? 'font-semibold text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom Controls (Theme, Skin, SignOut) */}
        <div
          className={`space-y-1 border-t border-slate-100 py-4 ${
            collapsed ? 'px-2.5' : 'px-3'
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                title="Déplier le menu"
                aria-label="Déplier le menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/45 transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-ink/60 hover:text-ink hover:bg-ink/[0.05] transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleSkin}
                aria-label={
                  skin === 'premium' ? "Revenir à l'ancien look" : 'Essayer le nouveau look'
                }
                title={
                  skin === 'premium' ? "Revenir à l'ancien look" : 'Essayer le nouveau look'
                }
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  skin === 'premium'
                    ? 'text-coral hover:bg-coral/[0.08]'
                    : 'text-ink/60 hover:bg-ink/[0.05] hover:text-ink'
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-ink/[0.04] transition-colors w-full"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {darkMode ? 'Mode clair' : 'Mode sombre'}
              </button>
              <button
                type="button"
                onClick={toggleSkin}
                aria-label={
                  skin === 'premium' ? "Revenir à l'ancien look" : 'Essayer le nouveau look'
                }
                title={
                  skin === 'premium' ? "Revenir à l'ancien look" : 'Essayer le nouveau look'
                }
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  skin === 'premium'
                    ? 'text-coral hover:bg-coral/[0.07]'
                    : 'text-muted-foreground hover:bg-ink/[0.04] hover:text-foreground'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {skin === 'premium' ? 'Ancien look' : 'Nouveau look'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            aria-label={collapsed ? 'Se déconnecter' : undefined}
            {...(collapsed ? makeTooltipHandlers('Se déconnecter', setBulle) : {})}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive ${
              collapsed ? 'justify-center px-0' : 'gap-3 px-3'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && 'Se déconnecter'}
          </button>
        </div>

        {collapsed && <SidebarTooltipPortal bulle={bulle} />}
      </aside>

      {/* ====================================================================
          MOBILE TOP HEADER (Exact replica of module 19928)
          ==================================================================== */}
      <header
        className="vitre fixed inset-x-0 top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-xl md:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <BrandMark size={30} />
            </div>
            <div className="min-w-0">
              <h1 className="font-impact text-base text-ink leading-none uppercase tracking-tight truncate">
                {mobileTitle}
              </h1>
              <p className="text-xs text-ink/60 font-medium truncate max-w-[160px]">
                {commerce.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ink/60 hover:text-ink hover:bg-ink/[0.05] transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT AREA (with rail transition & section sub-tabs)
          ==================================================================== */}
      <main className="transition-rail relative z-10 min-h-screen pt-16 pb-28 md:ml-[var(--largeur-rail)] md:pt-8 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Top Utility Bar: Multi-Store Switcher (module 33626) + Public Card Link */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Store Switcher (Exact replica of module 33626) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setStoreDropdownOpen((o) => !o)}
              aria-expanded={storeDropdownOpen}
              aria-haspopup="listbox"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.03]"
            >
              <Store className="h-4 w-4 flex-shrink-0 text-ink/50" />
              <span className="max-w-[10rem] truncate">{commerce.name}</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-ink/40 transition-transform ${
                  storeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {storeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setStoreDropdownOpen(false)}
                />
                <ul
                  role="listbox"
                  className="verre-flottant absolute left-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-ink/10 bg-white py-1 shadow-hard"
                >
                  {commerces.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={c.id === commerce.id}
                        onClick={() => {
                          selectCommerce(c.id);
                          setStoreDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-ink/[0.04]"
                      >
                        <span className="w-4 flex-shrink-0">
                          {c.id === commerce.id ? (
                            <Check className="h-4 w-4 text-coral" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">
                            {c.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            /{c.slug}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-ink/[0.06] pt-1">
                    <Link
                      to="/points-de-vente"
                      onClick={() => setStoreDropdownOpen(false)}
                      className="flex items-start gap-2.5 px-3 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/[0.04]"
                    >
                      <Plus className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="min-w-0">
                        Ajouter un point de vente
                        <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                          Gérer mes établissements
                        </span>
                      </span>
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </div>

          {/* Top Utility Bar: Multi-Store Switcher */}
          </div>

        {/* Offre Gratuite Global Banner (Exact replica of top card across all dashboard screenshots) */}
        <div className="mb-6 rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
                  OFFRE GRATUITE
                </span>
                <span className="text-xs font-medium text-ink/50">
                  <strong className="font-impact text-base text-ink">{customers.length}</strong> / 30 clients
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
                <div
                  className="h-full rounded-full bg-coral transition-all"
                  style={{ width: `${Math.min(100, (customers.length / 30) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink/60">
                Gratuit jusqu&apos;à 30 clients, sans aucune autre limite.
              </p>
            </div>
            <Link
              to="/billing"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:bg-ink/[0.03] shrink-0"
            >
              Voir l&apos;abonnement <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-ink/[0.06] pt-2.5 text-[11px] text-ink/60">
            <span className="text-coral">)))</span>
            <p>
              <strong className="font-bold text-ink">
                La plaque NFC n&apos;est pas comprise dans l&apos;offre gratuite.
              </strong>{' '}
              Elle se commande à part, 150 DZD une seule fois, depuis votre{' '}
              <Link to="/dashboard" className="underline hover:text-ink">
                tableau de bord
              </Link>
              . Sans elle, vos clients s&apos;inscrivent avec votre QR code.
            </p>
          </div>
        </div>

        {/* Section Page Title + Sub-Navigation Tabs (Exact replica of module 66313) */}
        {activeSection && (
          <div className="mb-5">
            <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink mb-3">
              {activeSection.titre}
            </h1>
            <div className="inline-flex items-center gap-1 rounded-2xl border border-ink/[0.08] bg-ink/[0.04] p-1 max-w-full overflow-x-auto">
              {activeSection.onglets.map((tab) => {
                const isTabActive =
                  location.pathname === tab.href ||
                  location.pathname.startsWith(tab.href + '/');
                return (
                  <Link
                    key={tab.href}
                    to={tab.href}
                    aria-current={isTabActive ? 'page' : undefined}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      isTabActive
                        ? 'onglet-actif bg-white text-ink shadow-sm'
                        : 'text-ink/55 hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {children}
      </main>

      {/* ====================================================================
          MOBILE BOTTOM BAR & DRAWER (Exact replica of module 2872)
          ==================================================================== */}
      {mobileDrawerOpen && (
        <>
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 z-[55] bg-black/20 md:hidden"
          />
          <div
            className="vitre vitre-menu fixed inset-x-4 bottom-24 z-[60] flex max-h-[calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col overflow-y-auto overscroll-contain rounded-[28px] border border-slate-100 bg-white p-2.5 shadow-2xl md:hidden"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_DRAWER_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    data-mouvement=""
                    className="tuile-menu flex min-h-[60px] min-w-0 items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-[14px] font-semibold leading-tight text-ink/85"
                  >
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                        active ? 'bg-coral text-white' : 'bg-ink/[0.06] text-ink/70'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false);
                logout();
                navigate('/login');
              }}
              data-mouvement=""
              className="tuile-menu mt-2 flex min-h-[56px] w-full items-center gap-2.5 rounded-2xl px-2.5 text-[14px] font-semibold text-red-600"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                <LogOut className="h-[18px] w-[18px]" />
              </span>
              Se déconnecter
            </button>
          </div>
        </>
      )}

      <nav
        className="fixed bottom-3 inset-x-3 z-30 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="vitre flex items-center gap-1 rounded-[28px] border border-slate-100 bg-white/95 px-1.5 py-1.5 shadow-float backdrop-blur-xl">
          {MOBILE_PRIMARY_TABS.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item);
            if (item.isCentral) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-label={item.label}
                  className="flex-1 flex justify-center -mt-5"
                >
                  <div className="w-14 h-14 rounded-full bg-coral shadow-hard-coral flex items-center justify-center border-4 border-white dark:border-[#1d1a18]">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </Link>
              );
            }
            return (
              <Link key={item.href} to={item.href} className="onglet-barre flex-1">
                <div className="flex flex-col items-center gap-0.5 py-2 rounded-2xl relative">
                  {active && (
                    <div className="absolute inset-0 bg-coral/10 rounded-2xl" />
                  )}
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-colors ${
                      active ? 'text-coral' : 'text-ink/60'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold relative z-10 transition-colors ${
                      active ? 'text-coral' : 'text-ink/60'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileDrawerOpen((o) => !o)}
            className="onglet-barre flex-1"
            data-mouvement=""
          >
            <div className="flex flex-col items-center gap-0.5 py-2 rounded-2xl relative">
              {(isDrawerRouteActive || mobileDrawerOpen) && (
                <div className="absolute inset-0 bg-coral/10 rounded-2xl" />
              )}
              <Ellipsis
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isDrawerRouteActive || mobileDrawerOpen ? 'text-coral' : 'text-ink/60'
                }`}
              />
              <span
                className={`text-[10px] font-bold relative z-10 transition-colors ${
                  isDrawerRouteActive || mobileDrawerOpen ? 'text-coral' : 'text-ink/60'
                }`}
              >
                Plus
              </span>
            </div>
          </button>
        </div>
      </nav>

      {/* ====================================================================
          FIDELIA AI FLOATING WIDGET (Exact replica of module 30925 & 61566)
          ==================================================================== */}
      <FideliaFloatingWidget
        pathname={location.pathname}
        restaurantName={commerce.name}
      />
    </div>
  );
};
