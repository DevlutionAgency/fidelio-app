import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Users,
  ArrowRight,
  QrCode,
  Gift,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Bell,
  Mail,
  Star,
  ShieldCheck,
  Check,
  Copy,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Trophy,
  Lock,
  MessageCircle,
  Upload,
  Send,
  ScanLine,
  Repeat,
  Percent,
  ChevronDown,
  Save,
  SlidersHorizontal,
  Inbox,
  Calendar,
  UploadCloud,
  Utensils,
  Coffee,
  Scissors,
  Sparkles,
  Shirt,
  ShoppingBag,
  Croissant,
  BookOpen,
  Store,
  Heart,
  Flame,
  Leaf,
  Gem,
  Wrench,
  Car,
  Paintbrush,
  ShoppingBasket,
  Smartphone,
  KeyRound,
  Eye,
  XCircle,
  CreditCard,
  Clock,
  Cake,
  Info,
  Download,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StickerBadge, QrCodeMatrix } from '../components/BrandLogo';

/* ============================================================================
   1. ACCUEIL (/dashboard) — Exact replica of Screenshot 2
   ============================================================================ */
export const DashboardHome: React.FC = () => {
  const { commerce, customers, rewards, transactions } = useStore();
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const currencyLabel = commerce.currency || 'MAD';

  // Visites sur les 30 derniers jours à partir des transactions SQLite réelles
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const tx30Days = transactions.filter((t) => {
    const tDate = new Date(t.timestamp || t.createdAt || '');
    return !isNaN(tDate.getTime()) && tDate >= thirtyDaysAgo;
  });

  const totalVisits = tx30Days.length > 0 ? tx30Days.length : customers.reduce((acc, c) => acc + c.visits, 0);

  // Clients inscrits ce mois-ci
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newCustomersThisMonth = customers.filter((c) => {
    const mDate = new Date(c.memberSince || '');
    return !isNaN(mDate.getTime()) && mDate >= firstDayThisMonth;
  }).length;

  const returningCount = customers.filter((c) => c.visits >= 2).length;
  const returningRate =
    customers.length > 0 ? Math.round((returningCount / customers.length) * 100) : 0;
  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  // Frequency chart buckets over last 30 days
  const dayBuckets = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (29 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const count = transactions.filter(
      (t) => (t.timestamp || t.createdAt || '').slice(0, 10) === dateStr
    ).length;
    return { dateStr, count };
  });
  const maxBucketCount = Math.max(1, ...dayBuckets.map((b) => b.count));

  return (
    <div className="space-y-4">
      <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink">
        ACCUEIL
      </h1>

      {/* Top Quota Banner: 0 / 30 clients avec barre de progression dynamique */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
                QUOTA CLIENTS ({commerce.name})
              </span>
              <span className="text-xs font-medium text-ink/50">
                <strong className="font-impact text-base text-ink">{customers.length}</strong> / 30 clients
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
              <div
                className="h-full rounded-full bg-coral transition-all duration-500"
                style={{ width: `${Math.min(100, (customers.length / 30) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-ink/60">
              Gratuit jusqu&apos;à 30 clients inscrits en base.
            </p>
          </div>
          <Link
            to="/billing"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:bg-ink/[0.03] shrink-0"
          >
            Voir l&apos;abonnement <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Banner: Créez votre première récompense */}
      {rewards.length === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-coral/35 bg-coral/[0.04] px-4 py-3.5">
          <div>
            <p className="text-sm font-bold text-ink">Créez votre première récompense</p>
            <p className="text-xs text-ink/60">
              Vos clients voient « Récompense fidélité » tant qu&apos;elle n&apos;existe pas.
            </p>
          </div>
          <Link
            to="/dashboard/rewards"
            className="inline-flex items-center justify-center rounded-xl bg-coral px-4 py-2 text-xs font-bold text-white shadow-sm shrink-0"
          >
            Créer
          </Link>
        </div>
      )}

      {/* 3 Quick Action Buttons Row */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Link
          to="/caisse"
          className="flex items-center gap-2.5 rounded-2xl bg-coral px-4 py-3.5 text-sm font-bold text-white shadow-hard-coral transition-transform active:scale-[0.99]"
        >
          <ScanLine className="h-4 w-4 shrink-0" />
          Scanner une carte
        </Link>
        <Link
          to="/dashboard/messages"
          className="flex items-center gap-2.5 rounded-2xl border border-ink/[0.08] bg-white px-4 py-3.5 text-sm font-bold text-ink shadow-soft transition-colors hover:bg-ink/[0.02]"
        >
          <Send className="h-4 w-4 shrink-0 text-coral" />
          Envoyer un message
        </Link>
        <Link
          to="/dashboard/qrcode"
          className="flex items-center gap-2.5 rounded-2xl border border-ink/[0.08] bg-white px-4 py-3.5 text-sm font-bold text-ink shadow-soft transition-colors hover:bg-ink/[0.02]"
        >
          <QrCode className="h-4 w-4 shrink-0 text-coral" />
          Mon QR code
        </Link>
      </div>

      {/* 4 KPI Cards with colored top borders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: CLIENTS */}
        <div className="relative overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft">
          <div className="absolute inset-x-0 top-0 h-1 bg-ink" />
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white">
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-3 font-impact text-3xl leading-none text-ink">{customers.length}</p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/50">
            CLIENTS
          </p>
          <p className="mt-0.5 text-[11px] text-ink/45">+{newCustomersThisMonth || customers.length} ce mois</p>
        </div>

        {/* Card 2: VISITES */}
        <div className="relative overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft">
          <div className="absolute inset-x-0 top-0 h-1 bg-violet-600" />
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-3 font-impact text-3xl leading-none text-ink">{totalVisits}</p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/50">
            VISITES
          </p>
          <p className="mt-0.5 text-[11px] text-ink/45">30 derniers jours</p>
        </div>

        {/* Card 3: REVIENNENT */}
        <div className="relative overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft">
          <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Repeat className="h-4 w-4" />
          </div>
          <p className="mt-3 font-impact text-3xl leading-none text-ink">{returningRate} %</p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/50">
            REVIENNENT
          </p>
          <p className="mt-0.5 text-[11px] text-ink/45">au moins 2 visites</p>
        </div>

        {/* Card 4: CA (MAD ou EUR) */}
        <div className="relative overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft">
          <div className="absolute inset-x-0 top-0 h-1 bg-coral" />
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral text-white">
            <Percent className="h-4 w-4" />
          </div>
          <p className="mt-3 font-impact text-3xl leading-none text-ink">
            {totalRevenue.toLocaleString('fr-FR')}
          </p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/50">
            CA ({currencyLabel})
          </p>
          <p className="mt-0.5 text-[11px] text-ink/45">30 j · total {totalRevenue} {currencyLabel}</p>
        </div>
      </div>

      {/* Plaque NFC Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-coral/25 bg-coral/[0.03] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral font-bold text-xs">
            )))
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Plaque NFC — Connectée à votre compte</p>
            <p className="text-[11px] text-ink/60">
              Vos clients approchent leur téléphone pour s&apos;inscrire. En attendant, votre{' '}
              <Link to="/dashboard/qrcode" className="underline hover:text-ink">
                QR code
              </Link>{' '}
              fonctionne déjà.
            </p>
          </div>
        </div>
        <a
          href="mailto:fidelioapp.support@gmail.com?subject=Commande%20Plaque%20NFC%20Fidelio"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-coral px-4 py-2.5 text-xs font-bold text-white shadow-sm shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Commander sur WhatsApp
        </a>
      </div>

      {/* VISITES · 30 JOURS Chart Card */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-impact text-2xl leading-none text-ink">{totalVisits}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink/45">
              VISITES · 30 JOURS
            </p>
          </div>
          <span className="text-[11px] text-ink/40">
            {totalVisits === 0 ? 'Aucune visite sur la période' : `${totalVisits} passage(s) enregistré(s)`}
          </span>
        </div>

        <div className="mt-8 pt-4 border-b border-ink/[0.08] flex items-end justify-between gap-1.5 h-24">
          {dayBuckets.map((bucket, i) => {
            const heightPct = bucket.count > 0 ? Math.max(15, Math.round((bucket.count / maxBucketCount) * 100)) : 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative" title={`${bucket.dateStr}: ${bucket.count} visite(s)`}>
                <div
                  className={`w-full rounded-t transition-all ${bucket.count > 0 ? 'bg-coral shadow-sm' : 'bg-ink/[0.06]'
                    }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-ink/40">
          <span>Il y a 30 jours</span>
          <span>Aujourd&apos;hui</span>
        </div>
      </div>

      {/* Plus de détails Accordion */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
        <button
          type="button"
          onClick={() => setMoreDetailsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-xs font-bold text-ink"
        >
          <span>Plus de détails</span>
          <ChevronDown
            className={`h-4 w-4 text-ink/40 transition-transform ${moreDetailsOpen ? 'rotate-180' : ''
              }`}
          />
        </button>
        {moreDetailsOpen && (
          <div className="border-t border-ink/[0.06] px-4 py-3.5 text-xs text-ink/60 grid sm:grid-cols-3 gap-3">
            <div>
              <p className="font-bold text-ink">Récompenses échangées</p>
              <p className="mt-0.5">0 ce mois-ci</p>
            </div>
            <div>
              <p className="font-bold text-ink">Parrainages validés</p>
              <p className="mt-0.5">0 ami invité</p>
            </div>
            <div>
              <p className="font-bold text-ink">Avis Google validés</p>
              <p className="mt-0.5">0 bonus crédité</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   2. POS COUNTER SCANNER (/scan & /caisse) — Loaded lazily in App.tsx via src/pages/ScanPage.tsx
   ============================================================================ */

/* ============================================================================
   3. CLIENTS (/customers & /clients-import) — Exact replica of Screenshot 3
   ============================================================================ */
export const CustomersPage: React.FC = () => {
  const { customers, addCustomer, commerce } = useStore();
  const location = useLocation();
  const isImportUrl = location.pathname.startsWith('/clients-import');
  const [activeTab, setActiveTab] = useState<'list' | 'import'>(isImportUrl ? 'import' : 'list');

  const [searchQuery, setSearchQuery] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importDone, setImportDone] = useState<string | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.code || '').toLowerCase().includes(q)
    );
  });

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    let count = 0;
    for (const line of lines) {
      const [n, p, em] = line.split(/[;,]/).map((s) => s?.trim());
      if (n) {
        addCustomer({
          name: n,
          phone: p || '+212 6 00 00 00 00',
          email: em || 'client@fidelio.ma',
          walletAdded: 'apple',
        });
        count++;
      }
    }
    setImportDone(`${count} client(s) importé(s) avec succès.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-impact text-3xl uppercase tracking-tight text-ink">
            CLIENTS
          </h1>
          <p className="text-xs text-ink/55">
            {customers.length} {customers.length > 1 ? 'clients inscrits' : 'client inscrit'} chez {commerce.name}
          </p>
        </div>

        {/* Sub-tabs header: Mes clients & Importer */}
        <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === 'list'
                ? 'bg-coral text-white shadow-sm'
                : 'text-ink/60 hover:text-ink'
              }`}
          >
            Mes clients ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === 'import'
                ? 'bg-coral text-white shadow-sm'
                : 'text-ink/60 hover:text-ink'
              }`}
          >
            <Upload className="h-3 w-3" />
            Importer
          </button>
        </div>
      </div>

      {activeTab === 'import' ? (
        <div className="max-w-xl space-y-4">
          <p className="text-xs text-ink/60">
            Importez vos clients existants au format CSV pour leur attribuer une carte Fidelio.
          </p>
          <form
            onSubmit={handleBulkImport}
            className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Upload className="h-4 w-4 text-coral" />
              <span>Importer un fichier CSV</span>
            </div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Nom;Téléphone;Email"
              className="w-full rounded-xl border border-ink/15 p-3 font-mono text-xs text-ink focus:border-coral outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-xs font-bold text-white shadow-hard-coral"
            >
              <Upload className="h-3.5 w-3.5" /> Importer pour {commerce.name}
            </button>
            {importDone && (
              <p className="text-xs font-semibold text-emerald-700">{importDone}</p>
            )}
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Users className="h-4 w-4 text-ink/60" />
              <span>Liste des clients ({filteredCustomers.length})</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher nom, code, tél..."
                className="w-full rounded-xl border border-ink/10 bg-white pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink/40 outline-none focus:border-coral"
              />
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-bold text-ink">Aucun client pour le moment</p>
              <p className="mt-0.5 text-[11px] text-ink/45">
                Partagez votre QR code pour commencer
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs font-bold text-ink">Aucun résultat pour « {searchQuery} »</p>
              <p className="text-[11px] text-ink/45 mt-1">Essayez un autre mot-clé ou réinitialisez la recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/[0.08] bg-ink/[0.02] text-[10px] font-bold uppercase tracking-wider text-ink/60">
                    <th className="py-3 px-4">Prénom</th>
                    <th className="py-3 px-4">Téléphone WhatsApp</th>
                    <th className="py-3 px-4">Code client</th>
                    <th className="py-3 px-4 text-center">Solde de tampons</th>
                    <th className="py-3 px-4 text-center">Total des visites</th>
                    <th className="py-3 px-4 text-right">Dernier passage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.06]">
                  {filteredCustomers.map((c) => {
                    const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
                    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : undefined;
                    const firstName = (c.name || 'Client').split(' ')[0];
                    const lastVisitStr = c.lastVisit
                      ? new Date(c.lastVisit).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                      : 'Premier passage';

                    return (
                      <tr key={c.id} className="hover:bg-ink/[0.01] transition-colors">
                        <td className="py-3 px-4 font-bold text-ink">{firstName}</td>
                        <td className="py-3 px-4">
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                              <span>{c.phone}</span>
                            </a>
                          ) : (
                            <span className="text-ink/60">{c.phone || 'Non renseigné'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-ink">{c.code}</td>
                        <td className="py-3 px-4 text-center font-bold text-coral">
                          {c.points} {commerce.mode === 'tampons' ? 'tampon(s)' : 'pts'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-ink">{c.visits}</td>
                        <td className="py-3 px-4 text-right text-ink/50">{lastVisitStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   4. PROGRAMME (/rewards & /program) — Exact replica of Screenshots 4 & 5
   ============================================================================ */
export const RewardsPage: React.FC = () => {
  const { commerce, updateCommerce, rewards, addReward, deleteReward } = useStore();
  const location = useLocation();
  const isReglesUrl = location.pathname.startsWith('/program') || location.pathname.endsWith('/program');
  const [activeTab, setActiveTab] = useState<'rewards' | 'rules'>(isReglesUrl ? 'rules' : 'rewards');

  const [addingReward, setAddingReward] = useState(false);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(10);
  const [programName, setProgramName] = useState(
    commerce.programName || `Programme ${commerce.name}`
  );
  const [programMode, setProgramMode] = useState<'tampons' | 'points'>(commerce.mode);
  const [currency, setCurrency] = useState<'MAD' | 'EUR'>(commerce.currency || 'MAD');
  const [stampsPerCard, setStampsPerCard] = useState(commerce.stampsTarget || 10);
  const [pointsPerDzd, setPointsPerDzd] = useState(commerce.pointsPerMad || 1);
  const [referralStamps, setReferralStamps] = useState(commerce.referralBonus || 0);
  const [googleBonusEnabled, setGoogleBonusEnabled] = useState(Boolean(commerce.googleReviewBonus));
  const [googleBonusStamps, setGoogleBonusStamps] = useState(commerce.googleReviewBonus || 0);
  const [googlePlaceUrl, setGooglePlaceUrl] = useState(
    commerce.googleReviewUrl || 'https://search.google.com/local/writereview?placeid='
  );
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSavedToast(false);
    const ok = await updateCommerce({
      programName,
      currency,
      mode: programMode,
      stampsTarget: stampsPerCard,
      pointsPerMad: pointsPerDzd,
      pointsPerDzd,
      referralBonus: referralStamps,
      googleReviewBonus: googleBonusEnabled ? googleBonusStamps : 0,
      googleReviewUrl: googlePlaceUrl,
    });
    setSaving(false);
    if (ok) {
      setSavedToast(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs header: Récompenses & Règles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-impact text-3xl uppercase tracking-tight text-ink">
            PROGRAMME & RÉCOMPENSES
          </h1>
          <p className="text-xs text-ink/55">
            Personnalisez les paliers et les récompenses de fidélité pour {commerce.name}
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === 'rewards'
                ? 'bg-coral text-white shadow-sm'
                : 'text-ink/60 hover:text-ink'
              }`}
          >
            <Gift className="h-3.5 w-3.5" />
            Récompenses ({rewards.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === 'rules'
                ? 'bg-coral text-white shadow-sm'
                : 'text-ink/60 hover:text-ink'
              }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Règles & Barème
          </button>
        </div>
      </div>

      {activeTab === 'rules' ? (
        <div className="max-w-xl space-y-4">
          {/* Card 1: Configuration */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <SlidersHorizontal className="h-4 w-4 text-coral" />
              <span>Configuration du programme</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink mb-1">
                Nom du programme de fidélité
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => {
                  setProgramName(e.target.value);
                  setSavedToast(false);
                }}
                placeholder="Programme Fidélité"
                className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:border-coral outline-none"
              />
            </div>

            {/* Devise : MAD ou EUR */}
            <div>
              <label className="block text-[11px] font-bold text-ink mb-1.5">
                Choix de devise
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('MAD');
                    setSavedToast(false);
                  }}
                  className={`rounded-xl border px-3.5 py-2.5 text-center text-xs font-bold transition-all ${currency === 'MAD'
                      ? 'border-coral bg-coral/[0.06] text-coral shadow-sm'
                      : 'border-ink/10 bg-white text-ink/70 hover:bg-ink/[0.02]'
                    }`}
                >
                  DZD (Dinar algerien)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('EUR');
                    setSavedToast(false);
                  }}
                  className={`rounded-xl border px-3.5 py-2.5 text-center text-xs font-bold transition-all ${currency === 'EUR'
                      ? 'border-coral bg-coral/[0.06] text-coral shadow-sm'
                      : 'border-ink/10 bg-white text-ink/70 hover:bg-ink/[0.02]'
                    }`}
                >
                  EUR (Euro €)
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-ink/45">
                Devise appliquée aux passages en caisse, au tableau de bord et aux statistiques de chiffre d&apos;affaires.
              </p>
            </div>

            {/* Nombre de tampons par carte */}
            <div>
              <label className="block text-[11px] font-bold text-ink mb-1.5">
                Nombre de tampons par carte
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[5, 6, 8, 10, 12, 15].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setStampsPerCard(n);
                      setSavedToast(false);
                    }}
                    className={`h-10 w-10 rounded-xl font-impact text-base transition-all ${stampsPerCard === n
                        ? 'bg-coral text-white shadow-hard-coral scale-105'
                        : 'bg-ink/[0.04] text-ink hover:bg-ink/[0.08]'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Dynamic Dark Stamp Preview Box */}
              <div className="mt-3 rounded-2xl bg-[#181818] p-4 text-white shadow-md">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
                  <span>APERÇU DU PASS NOIR — {stampsPerCard} TAMPONS</span>
                  <span className="text-coral">{commerce.name}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: stampsPerCard }).map((_, idx) => {
                    const filled = idx < Math.min(3, stampsPerCard);
                    return (
                      <div
                        key={idx}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${filled
                            ? 'bg-coral text-white shadow-sm'
                            : 'border-2 border-white/20 text-white/30 bg-white/[0.02]'
                          }`}
                      >
                        {filled ? '★' : idx + 1}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-[10px] text-white/60">
                  Grille dynamique de {stampsPerCard} tampons configurée pour la carte Apple &amp; Google Wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Parrainage */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Gift className="h-4 w-4 text-coral" />
              <span>Carte Parrainage</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink mb-1">
                Nombre de tampons offerts (parrain et filleul)
              </label>
              <input
                type="number"
                min={0}
                value={referralStamps}
                onChange={(e) => {
                  setReferralStamps(Math.max(0, Number(e.target.value)));
                  setSavedToast(false);
                }}
                className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:border-coral outline-none"
              />
              <p className="mt-1.5 text-[10px] leading-relaxed text-ink/50">
                Chaque nouvel invité et son parrain recevront automatiquement ce bonus de tampons lors de leur premier scan.
              </p>
            </div>
          </div>

          {/* Card 3: Bonus avis Google */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Star className="h-4 w-4 text-coral" />
              <span>Carte Bonus avis Google</span>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-bold text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={googleBonusEnabled}
                onChange={(e) => {
                  setGoogleBonusEnabled(e.target.checked);
                  setSavedToast(false);
                }}
                className="h-4 w-4 rounded accent-coral text-coral"
              />
              <span>Activer le bonus pour avis Google déposé</span>
            </label>

            <div>
              <label className="block text-[11px] font-bold text-ink mb-1">
                Nombre de tampons bonus accordés
              </label>
              <input
                type="number"
                min={0}
                value={googleBonusStamps}
                onChange={(e) => {
                  setGoogleBonusStamps(Math.max(0, Number(e.target.value)));
                  setSavedToast(false);
                }}
                className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:border-coral outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink mb-1">
                URL Google Place ID (fiche établissement)
              </label>
              <input
                type="text"
                value={googlePlaceUrl}
                onChange={(e) => {
                  setGooglePlaceUrl(e.target.value);
                  setSavedToast(false);
                }}
                placeholder="https://search.google.com/local/writereview?placeid=..."
                className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink focus:border-coral outline-none"
              />
              <p className="mt-1 text-[10px] text-ink/45">
                Redirige directement vos clients vers le formulaire 5 étoiles de votre fiche Google Maps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-xs font-bold text-white shadow-hard-coral disabled:opacity-50 transition-transform active:scale-95"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Sauvegarde SQLite en cours...' : savedToast ? 'Enregistré en base ✓' : 'Enregistrer les règles'}
            </button>
            {savedToast && (
              <span className="text-xs font-semibold text-emerald-700 animate-fade-in">
                Configuration sauvegardée avec succès !
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Sub-tab 1: Récompenses */
        <div className="grid lg:grid-cols-2 gap-5 max-w-4xl">
          {/* Left Column: Rewards List & Add Modal */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-coral" />
                  <span>Récompenses actives ({rewards.length})</span>
                </div>
                {!addingReward && (
                  <button
                    type="button"
                    onClick={() => setAddingReward(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-coral px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
                  >
                    <Plus className="h-3 w-3" /> Ajouter
                  </button>
                )}
              </div>

              {rewards.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-ink/50">
                    Aucune récompense active. Ajoutez votre première récompense pour motiver vos clients.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rewards.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-ink/10 px-3.5 py-2.5 hover:border-ink/20 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-ink">{r.title}</p>
                        <p className="text-[11px] text-ink/50">{r.cost} tampons requis</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteReward(r.id)}
                        title="Supprimer la récompense"
                        className="text-ink/40 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addingReward && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!title.trim()) return;
                    addReward({
                      title,
                      cost,
                      description: 'Récompense fidélité',
                      category: 'Fidélité',
                    });
                    setTitle('');
                    setAddingReward(false);
                  }}
                  className="space-y-3 pt-3 border-t border-ink/[0.06] rounded-xl bg-ink/[0.02] p-3"
                >
                  <p className="text-xs font-bold text-ink">Nouvelle récompense</p>
                  <div>
                    <label className="block text-[10px] font-bold text-ink mb-1">Titre de la récompense</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex : Café offert, -20% sur l'addition, Dessert au choix..."
                      className="w-full rounded-xl border border-ink/15 px-3 py-2 text-xs bg-white focus:border-coral outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-ink mb-1">Nombre de tampons requis</label>
                    <input
                      type="number"
                      min={1}
                      max={stampsPerCard}
                      value={cost}
                      onChange={(e) => setCost(Math.max(1, Number(e.target.value)))}
                      className="w-32 rounded-xl border border-ink/15 px-3 py-2 text-xs font-bold bg-white focus:border-coral outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-xl bg-coral px-4 py-2 text-xs font-bold text-white shadow-sm"
                    >
                      Enregistrer la récompense
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingReward(false)}
                      className="rounded-xl border border-ink/10 px-3 py-2 text-xs font-bold text-ink hover:bg-white"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Black Customer Pass Preview */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-ink mb-3">Aperçu dynamique du pass client noir</p>

              <div className="mx-auto rounded-3xl bg-[#141414] p-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-coral">CARTE DE FIDÉLITÉ</span>
                    <h3 className="font-impact text-xl text-white tracking-wide mt-0.5">{commerce.name}</h3>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-coral/20 flex items-center justify-center text-coral font-bold text-sm">
                    {commerce.name.charAt(0)}
                  </div>
                </div>

                <div className="my-5">
                  <div className="flex justify-between items-center text-[10px] text-white/50 mb-2">
                    <span>TAMPONS COLLECTÉS</span>
                    <span className="text-coral font-bold">{Math.min(stampsPerCard, 4)} / {stampsPerCard}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center py-2 bg-white/[0.03] rounded-2xl border border-white/5">
                    {Array.from({ length: stampsPerCard }).map((_, idx) => {
                      const collected = idx < 4;
                      return (
                        <div
                          key={idx}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${collected
                              ? 'bg-coral text-white shadow-md'
                              : 'border border-white/15 text-white/20'
                            }`}
                        >
                          {collected ? '✓' : idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">
                    <Gift className="h-3 w-3 text-coral" />
                    <span>RÉCOMPENSES À DÉBLOQUER</span>
                  </div>
                  {rewards.length === 0 ? (
                    <p className="text-xs text-white/40 italic">Aucune récompense configurée</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-white/85">
                      {rewards.map((r) => (
                        <li key={r.id} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                          <span>{r.title}</span>
                          <span className="font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-full text-[10px]">
                            {r.cost} tampons
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <p className="text-center text-[10px] text-ink/40 mt-3">
                Rendu temps réel tel qu&apos;affiché dans Apple Wallet et sur le pass web client.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   5. MESSAGES (/notifications, /automations, /campaigns) — Screenshot 1
   ============================================================================ */
export const NotificationsPage: React.FC = () => {
  const { campaigns, sendCampaign, customers } = useStore();
  const location = useLocation();
  const isAutoTab = location.pathname.startsWith('/automations');
  const isEmailTab = location.pathname.startsWith('/campaigns');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [optLink, setOptLink] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !message.trim()) return;
    sendCampaign({
      title: title || message,
      channel: isEmailTab ? 'email' : 'push',
      segment: 'Tous les clients',
      recipients: customers.length,
    });
    setTitle('');
    setMessage('');
    setOptLink('');
  };

  if (isAutoTab) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
          <p className="text-xs font-bold text-ink">Relances automatiques</p>
          <p className="text-xs text-ink/55">
            Vos clients reçoivent automatiquement un message de bienvenue, un rappel lorsqu&apos;ils
            sont proches d&apos;une récompense et un cadeau le jour de leur anniversaire.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-4">
      <form
        onSubmit={handleSend}
        className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            {isEmailTab ? (
              <Mail className="h-4 w-4 text-coral" />
            ) : (
              <Bell className="h-4 w-4 text-coral" />
            )}
            <span>{isEmailTab ? 'Nouvel email' : 'Nouvelle notification'}</span>
          </div>
          <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[10px] font-bold text-coral">
            {campaigns.length}/3 aujourd&apos;hui
          </span>
        </div>

        <p className="text-[11px] text-ink/50">
          Jusqu&apos;à 3 notifications par jour. Au-delà, les clients se lassent et suppriment leur
          carte.
        </p>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-ink">Titre</label>
            <span className="text-[10px] text-ink/40">{title.length}/50</span>
          </div>
          <input
            type="text"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Offre spéciale ce weekend !"
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-ink">Message</label>
            <span className="text-[10px] text-ink/40">{message.length}/150</span>
          </div>
          <textarea
            rows={3}
            maxLength={150}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Profitez de -20% sur votre prochaine visite. Valable jusqu'au 30 juin."
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink mb-1">
            Lien optionnel <span className="font-normal text-ink/45">(bouton dans la notif)</span>
          </label>
          <input
            type="url"
            value={optLink}
            onChange={(e) => setOptLink(e.target.value)}
            placeholder="https://votre-site.dz/offre"
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
          />
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-ink/[0.06] bg-ink/[0.02] p-3 text-[10px] leading-relaxed text-ink/55">
          <Info className="h-3.5 w-3.5 shrink-0 text-ink/40 mt-0.5" />
          <span>
            Les notifications sont modérées automatiquement. Tout contenu inapproprié (injures,
            contenu sexuel, texte non professionnel) sera bloqué et non publié.
          </span>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3 text-xs font-bold text-white shadow-hard-coral"
        >
          <Send className="h-3.5 w-3.5" />
          Envoyer la notification
        </button>
      </form>

      {/* Historique des notifications */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft">
        <p className="text-xs font-bold text-ink">Historique des notifications</p>
        {campaigns.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Bell className="h-5 w-5 text-ink/25" />
            <p className="mt-2 text-[11px] text-ink/45">Aucune notification envoyée</p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-ink/[0.06]">
            {campaigns.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">{c.title}</span>
                <span className="text-[10px] text-ink/45">{c.sentAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   6. APPARENCE (/branding) — Exact replica of Screenshot 8
   ============================================================================ */
export const BrandingPage: React.FC = () => {
  const { commerce, updateCommerce } = useStore();
  const [estType, setEstType] = useState('Restaurant');
  const [topMode, setTopMode] = useState<'tampons' | 'photo'>('tampons');
  const [stampsCount, setStampsCount] = useState(10);
  const [stampIconIdx, setStampIconIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        void updateCommerce({ cardLogoImage: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        void updateCommerce({ cardCoverImage: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const ESTABLISHMENT_TYPES = [
    { label: 'Restaurant', icon: Utensils },
    { label: 'Café', icon: Coffee },
    { label: 'Coiffure', icon: Scissors },
    { label: 'Barbershop', icon: Scissors },
    { label: 'Pressing', icon: Shirt },
    { label: 'Retoucherie', icon: Wrench },
    { label: 'Boucherie', icon: Utensils },
    { label: 'Pâtisserie', icon: Croissant },
    { label: 'Librairie', icon: BookOpen },
    { label: 'Autre', icon: Store },
  ];

  const SWATCH_COLORS = [
    '#1a1a1a',
    '#f85b04',
    '#1e3a8a',
    '#7c3aed',
    '#be123c',
    '#047857',
    '#9a3412',
    '#831843',
  ];

  const STAMP_ICONS = [
    Check,
    Heart,
    Star,
    Coffee,
    Utensils,
    Croissant,
    Gift,
    Scissors,
    Sparkles,
    Trophy,
    ThumbsUpIcon,
    Flame,
    Leaf,
    ShoppingBag,
    Shirt,
    Gem,
    Wrench,
    Car,
    Paintbrush,
    ShoppingBasket,
    Smartphone,
  ];

  const SelectedStampIcon = STAMP_ICONS[stampIconIdx] || Check;

  return (
    <div className="space-y-5 pb-16">
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />

      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink">
            APPARENCE
          </h1>
          <StickerBadge rotate={-3} tone="coral" className="text-xs px-2.5 py-1">
            Votre DA
          </StickerBadge>
        </div>
        <p className="mt-1 text-xs text-ink/55">
          Tout ce que vous changez ici apparaît aussitôt sur la carte, telle que vos clients la
          verront dans leur téléphone.
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Left: Live Black Apple Wallet Stamp Pass Preview */}
        <div>
          <div
            style={{ backgroundColor: commerce.cardBgColor || '#1a1a1a' }}
            className="w-[230px] rounded-[22px] p-4 text-white shadow-xl ring-1 ring-black/15 select-none relative overflow-hidden"
          >
            {topMode === 'photo' && commerce.cardCoverImage && (
              <img
                src={commerce.cardCoverImage}
                alt="Bannière couverture"
                className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              {commerce.cardLogoImage ? (
                <img
                  src={commerce.cardLogoImage}
                  alt="Logo"
                  className="h-6 w-6 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold">
                  {commerce.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold truncate">{commerce.name}</span>
            </div>

            {/* Stamp circles grid */}
            <div className="relative z-10 my-5 flex flex-wrap justify-center gap-2 px-2">
              {Array.from({ length: stampsCount }).map((_, idx) => {
                const filled = idx < 4;
                return (
                  <div
                    key={idx}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${filled
                        ? 'bg-white text-ink font-bold shadow-sm'
                        : 'border border-white/20 text-white/30'
                      }`}
                  >
                    {filled ? <SelectedStampIcon className="h-3 w-3 text-ink" /> : ''}
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-2 text-[8px] uppercase tracking-wider text-white/60">
              <div>
                <p>PROCHAINE RÉCOMPENSE</p>
                <p className="mt-0.5 text-[10px] font-bold normal-case text-white truncate">
                  Récompense fidélité
                </p>
              </div>
              <div className="text-right">
                <p>CODE CLIENT</p>
                <p className="mt-0.5 text-[10px] font-mono font-bold text-white">C-4F2A91</p>
              </div>
            </div>

            <div className="relative z-10 mt-2.5 grid grid-cols-2 gap-2 text-[8px] uppercase tracking-wider text-white/60">
              <div>
                <p>TAMPONS</p>
                <p className="mt-0.5 text-[11px] font-bold text-white">4 / {stampsCount}</p>
              </div>
              <div className="text-right">
                <p>DEPUIS</p>
                <p className="mt-0.5 text-[10px] font-semibold normal-case text-white">
                  octobre 2026
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-4 flex justify-center">
              <div className="rounded-xl bg-white p-2">
                <QrCodeMatrix code="C-4F2A91" size={72} />
              </div>
            </div>
          </div>

          <p className="mt-2.5 max-w-[230px] text-center text-[10px] leading-relaxed text-ink/45">
            Aperçu réel du pass Apple Wallet. La carte Google et la carte web reprennent les mêmes
            couleurs.
          </p>
        </div>

        {/* Right: 4 Numbered Sections */}
        <div className="space-y-6">
          {/* 1 · VOTRE COMMERCE */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
              1 · VOTRE COMMERCE
            </p>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Nom affiché sur la carte
              </label>
              <input
                type="text"
                value={commerce.name}
                onChange={(e) => updateCommerce({ name: e.target.value })}
                className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Logo</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white text-ink/45 hover:border-coral overflow-hidden"
                >
                  {commerce.cardLogoImage ? (
                    <img src={commerce.cardLogoImage} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs font-bold text-coral hover:underline text-left block"
                  >
                    {commerce.cardLogoImage ? 'Changer de logo' : 'Ajouter un logo'}
                  </button>
                  <p className="text-[10px] text-ink/45">
                    Carré de préférence · redimensionné automatiquement
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-0.5">
                Type d&apos;établissement
              </label>
              <p className="text-[10px] text-ink/45 mb-2">
                Sert d&apos;icône tant que vous n&apos;avez pas de logo.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ESTABLISHMENT_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = estType === t.label;
                  return (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setEstType(t.label)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 px-2 text-[11px] font-semibold transition-all ${active
                          ? 'border-coral bg-coral/[0.05] text-coral'
                          : 'border-ink/[0.07] bg-white text-ink/70 hover:bg-ink/[0.02]'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2 · VOTRE COULEUR */}
          <div className="space-y-2.5 pt-2 border-t border-ink/[0.06]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
              2 · VOTRE COULEUR
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCH_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => updateCommerce({ cardBgColor: hex })}
                  style={{ backgroundColor: hex }}
                  className={`h-8 w-8 rounded-full transition-transform ${commerce.cardBgColor === hex ? 'ring-2 ring-offset-2 ring-ink scale-110' : ''
                    }`}
                />
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-1.5">
                <span
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{ backgroundColor: commerce.cardBgColor || '#1a1a1a' }}
                />
                <input
                  type="text"
                  value={commerce.cardBgColor || '#1a1a1a'}
                  onChange={(e) => updateCommerce({ cardBgColor: e.target.value })}
                  className="w-16 font-mono text-xs text-ink focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3 · LE HAUT DE LA CARTE */}
          <div className="space-y-3 pt-2 border-t border-ink/[0.06]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
              3 · LE HAUT DE LA CARTE
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTopMode('tampons')}
                className={`rounded-xl border p-3.5 text-left transition-all ${topMode === 'tampons'
                    ? 'border-coral bg-coral/[0.04]'
                    : 'border-ink/10 bg-white'
                  }`}
              >
                <p className="text-xs font-bold text-ink">Les tampons</p>
                <p className="mt-0.5 text-[11px] text-ink/50">
                  Les cases se remplissent à chaque visite.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTopMode('photo')}
                className={`rounded-xl border p-3.5 text-left transition-all ${topMode === 'photo'
                    ? 'border-coral bg-coral/[0.04]'
                    : 'border-ink/10 bg-white'
                  }`}
              >
                <p className="text-xs font-bold text-ink">Votre photo</p>
                <p className="mt-0.5 text-[11px] text-ink/50">
                  Les cases se posent sur votre image.
                </p>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex h-12 w-16 flex-col items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white text-[10px] text-ink/45 hover:border-coral overflow-hidden"
              >
                {commerce.cardCoverImage ? (
                  <img src={commerce.cardCoverImage} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Image</span>
                  </>
                )}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="text-xs font-bold text-coral hover:underline text-left block"
                >
                  {commerce.cardCoverImage ? 'Changer d’image' : 'Ajouter une image'}
                </button>
                <p className="text-[10px] text-ink/45">
                  Visible si vous choisissez « Votre photo », ou au-delà de 12 cases.
                </p>
              </div>
            </div>
          </div>

          {/* 4 · TAMPONS PAR CARTE */}
          <div className="space-y-3 pt-2 border-t border-ink/[0.06]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
              4 · TAMPONS PAR CARTE
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {[5, 6, 8, 10, 12].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStampsCount(n)}
                  className={`h-9 w-9 rounded-xl font-impact text-sm transition-all ${stampsCount === n
                      ? 'bg-coral text-white shadow-hard-coral'
                      : 'bg-white border border-ink/10 text-ink'
                    }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={30}
                value={stampsCount}
                onChange={(e) => setStampsCount(Math.max(1, Number(e.target.value)))}
                className="h-9 w-14 rounded-xl border border-ink/10 bg-white px-2 text-center text-xs font-bold text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Icône dans les tampons
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STAMP_ICONS.map((IconComp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStampIconIdx(idx)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${stampIconIdx === idx
                        ? 'border-coral bg-coral/[0.08] text-coral'
                        : 'border-ink/10 bg-white text-ink/60 hover:text-ink'
                      }`}
                  >
                    <IconComp className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-ink/45">
                Dessinée dans les tampons acquis, sur la carte web comme dans Apple et Google
                Wallet. La récompense visée, elle, vient de votre Menu fidélité.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Save Bar */}
      <div className="fixed bottom-0 right-0 left-0 md:left-[var(--largeur-rail)] z-20 border-t border-ink/[0.08] bg-white/90 backdrop-blur-md px-6 py-3 flex justify-end">
        <button
          type="button"
          onClick={async () => {
            const ok = await updateCommerce({
              cardBgColor: commerce.cardBgColor,
              cardLogoImage: commerce.cardLogoImage,
              cardCoverImage: commerce.cardCoverImage,
              stampsTarget: stampsCount,
            });
            if (ok) {
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-xs font-bold text-white shadow-hard-coral"
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};

const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Sparkles className={className} />
);

/* ============================================================================
   7. EXTRA DASHBOARD PAGES:
      - /reviews (Screenshot 10)
      - /caisses & /equipe (Screenshots 6 & 7)
      - /qrcode (Screenshot 9)
      - /api-cles (Screenshot 12)
      - /settings (Screenshot 13)
      - /billing (Screenshot 15)
      - /donnees-clients (Screenshot 11)
   ============================================================================ */
export const ExtraDashboardPages: React.FC<{
  section:
  | 'reviews'
  | 'qrcode'
  | 'caisses'
  | 'pdv'
  | 'api'
  | 'settings'
  | 'billing'
  | 'donnees-clients'
  | 'conseiller'
  | 'admin';
}> = ({ section }) => {
  const { commerce, commerces, selectCommerce, employees, addEmployee, customers, updateCommerce, logout } =
    useStore();
  const location = useLocation();

  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState<'CAISSE' | 'MANAGER'>('CAISSE');
  const [empPin, setEmpPin] = useState('1234');
  const [respName, setRespName] = useState('');
  const [teamPeriod, setTeamPeriod] = useState<'7j' | '30j' | 'debut' | 'jour'>('30j');
  const [copied, setCopied] = useState(false);

  // Avis Google Claims state
  const [claims, setClaims] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsNotice, setClaimsNotice] = useState<string | null>(null);

  // Team state (SQLite backed)
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // API state
  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; token: string }[]>([]);

  // Mon compte — Abonnement state (Screenshot 15)
  const [rythme, setRythme] = useState<'mensuel' | 'semestriel' | 'annuel'>('mensuel');
  const [emailPack, setEmailPack] = useState<0 | 200 | 400 | 700>(0);
  const [payNotice, setPayNotice] = useState<string | null>(null);

  // Mon compte — Données clients state (Screenshot 11)
  const [canEmailClients, setCanEmailClients] = useState<'oui' | 'non'>('non');
  const [birthDateRule, setBirthDateRule] = useState<'facultative' | 'obligatoire'>('facultative');
  const [whyNoNamesOpen, setWhyNoNamesOpen] = useState(false);

  // Mon compte — Paramètres state (Screenshot 13)
  const [activityType, setActivityType] = useState(
    'Commerce physique — mes clients viennent sur place'
  );
  const [phoneInput, setPhoneInput] = useState('');
  const [cityInput, setCityInput] = useState('Alger');
  const [addrInput, setAddrInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [siteInput, setSiteInput] = useState('');
  const [resaInput, setResaInput] = useState('');
  const [instaInput, setInstaInput] = useState('');
  const [fbInput, setFbInput] = useState('');
  const [tiktokInput, setTiktokInput] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [geoRadius, setGeoRadius] = useState(1000);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const joinUrl = `https://fidelio.dz/join/${commerce.slug}`;

  const copyLink = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrSvg = () => {
    const svgEl = document.querySelector('.qr-matrix-container svg');
    let svgContent = '';
    if (svgEl) {
      svgContent = new XMLSerializer().serializeToString(svgEl);
    } else {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><text x="100" y="100" text-anchor="middle" font-family="sans-serif" font-size="12">${joinUrl}</text></svg>`;
    }
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fidelio-qrcode-${commerce.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchClaims = async () => {
    setClaimsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fidelio_auth_token') : null;
      const res = await fetch('/api/reviews/claims', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.claims)) {
        setClaims(data.claims);
      }
    } catch {
      // Fallback
    } finally {
      setClaimsLoading(false);
    }
  };

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fidelio_auth_token') : null;
      const res = await fetch('/api/team', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.team)) {
        setTeamMembers(data.team);
      }
    } catch {
      // Fallback
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (section === 'reviews') {
      void fetchClaims();
    } else if (section === 'caisses') {
      void fetchTeam();
    }
  }, [section]);

  const handleUpdateClaim = async (claimId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fidelio_auth_token') : null;
      const res = await fetch(`/api/reviews/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data?.ok) {
        setClaimsNotice(data.message || 'Mise à jour effectuée.');
        void fetchClaims();
      }
    } catch {
      setClaimsNotice('Erreur lors de la mise à jour.');
    }
  };

  const handleSimulateClaim = async () => {
    try {
      if (customers.length === 0) {
        setClaimsNotice("Créez d'abord au moins un client pour simuler une demande.");
        return;
      }
      const firstCust = customers[0];
      const res = await fetch('/api/reviews/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerCode: firstCust.code, merchantSlug: commerce.slug }),
      });
      const data = await res.json();
      if (data?.ok) {
        setClaimsNotice("Demande client de test créée avec succès !");
        void fetchClaims();
      }
    } catch {
      setClaimsNotice("Erreur lors de la simulation.");
    }
  };

  const handleAddTeamMember = async (name: string, role: 'CAISSE' | 'MANAGER', pin: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fidelio_auth_token') : null;
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, role, pinCode: pin }),
      });
      const data = await res.json();
      if (data?.ok) {
        addEmployee(name, commerce.name, pin);
        void fetchTeam();
      }
    } catch { }
  };

  const handleDeleteTeamMember = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fidelio_auth_token') : null;
      await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      void fetchTeam();
    } catch { }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordNotice({ type: 'err', text: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordNotice({ type: 'err', text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'err', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fidelio_auth_token') : null;
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setPasswordNotice({ type: 'ok', text: data.message || 'Mot de passe mis à jour avec succès.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordNotice({ type: 'err', text: data?.error || 'Erreur lors du changement de mot de passe.' });
      }
    } catch {
      setPasswordNotice({ type: 'err', text: 'Erreur réseau lors du changement de mot de passe.' });
    }
  };

  /* --------------------------------------------------------------------------
     AVIS GOOGLE (/reviews) — Exact replica of Screenshot 10
     -------------------------------------------------------------------------- */
  if (section === 'reviews') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink">
              AVIS GOOGLE
            </h1>
            <p className="text-xs text-ink/60">
              Validez les demandes de bonus <strong className="text-ink">après avoir vérifié l&apos;avis Google</strong>. Chaque client ne peut être crédité qu&apos;une seule fois.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSimulateClaim}
            className="inline-flex items-center gap-1.5 rounded-xl border border-coral/30 bg-coral/10 px-3.5 py-2 text-xs font-bold text-coral hover:bg-coral/20 self-start"
          >
            <Plus className="h-3.5 w-3.5" />
            Simuler une demande client
          </button>
        </div>

        {claimsNotice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            {claimsNotice}
          </div>
        )}

        {claimsLoading ? (
          <div className="py-12 text-center text-xs text-ink/40">Chargement des demandes...</div>
        ) : claims.length === 0 ? (
          <div className="rounded-2xl border border-ink/[0.08] bg-white py-14 flex flex-col items-center justify-center text-center shadow-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/[0.04] text-ink/40">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-bold text-ink">Aucune demande en attente</p>
            <p className="mt-0.5 text-[11px] text-ink/45">
              Les demandes de bonus avis de vos clients apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink/[0.08] bg-ink/[0.02] text-[10px] font-bold uppercase tracking-wider text-ink/60">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-ink/[0.01]">
                    <td className="py-3 px-4 font-bold text-ink">{claim.customer_name || 'Client anonyme'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-ink/70">{claim.customer_code || 'C-XXXXXX'}</td>
                    <td className="py-3 px-4 text-ink/60">{claim.customer_phone || '—'}</td>
                    <td className="py-3 px-4 text-ink/50 text-[11px]">
                      {claim.created_at ? new Date(claim.created_at).toLocaleDateString('fr-FR') : 'Récent'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${claim.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : claim.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        {claim.status === 'APPROVED' ? 'Validé' : claim.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {claim.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateClaim(claim.id, 'APPROVED')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                          >
                            <Check className="h-3 w-3" /> Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateClaim(claim.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100"
                          >
                            Refuser
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-ink/40">Traité</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     ÉQUIPE (/caisses & /equipe) — Exact replica of Screenshots 6 & 7
     -------------------------------------------------------------------------- */
  if (section === 'caisses') {
    const isResponsablesTab = location.pathname.startsWith('/equipe');

    if (isResponsablesTab) {
      const managers = teamMembers.filter((m) => m.role === 'MANAGER');
      return (
        <div className="max-w-lg space-y-4">
          <p className="text-xs text-ink/55">
            Un responsable gère un seul point de vente, sans accès à votre abonnement ni à vos
            autres établissements.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!respName.trim()) return;
              await handleAddTeamMember(respName, 'MANAGER', '9999');
              setRespName('');
            }}
            className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Plus className="h-3.5 w-3.5" />
              <span>Nouveau responsable — {commerce.name}</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-ink/60 mb-1">
                Prénom du responsable
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={respName}
                  onChange={(e) => setRespName(e.target.value)}
                  placeholder="Salma"
                  className="flex-1 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs font-bold text-white shadow-hard-coral"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Créer
                </button>
              </div>
            </div>
          </form>

          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-2">
            <p className="text-xs font-bold text-ink">Responsables actifs ({managers.length})</p>
            {managers.length === 0 ? (
              <p className="text-xs text-ink/50">
                Personne pour l&apos;instant. Vous êtes seul à accéder à ce point de vente.
              </p>
            ) : (
              <div className="divide-y divide-ink/[0.06]">
                {managers.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-ink">{m.name}</span>
                      <span className="ml-2 text-[10px] text-ink/40">PIN: {m.pin_code || '****'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeamMember(m.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Tab 1: Caisses employé (/caisses) — Screenshot 6
    const caissiers = teamMembers.filter((m) => m.role === 'CAISSE' || !m.role);
    const displayEmployees = caissiers.length > 0 ? caissiers : employees;

    return (
      <div className="max-w-lg space-y-4">
        <p className="text-xs text-ink/55">
          Un accès limité au scan pour chaque employé — sans vos chiffres ni vos réglages.
        </p>

        {/* Card 1: Nouvelle caisse */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!empName.trim()) return;
            await handleAddTeamMember(empName, 'CAISSE', empPin);
            setEmpName('');
          }}
          className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Plus className="h-3.5 w-3.5" />
            <span>Nouvelle caisse</span>
          </div>
          <div className="grid sm:grid-cols-[1fr_100px] gap-2">
            <div>
              <label className="block text-[10px] font-bold text-ink/60 mb-1">
                Prénom de l&apos;employé
              </label>
              <input
                type="text"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="Youssef"
                className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-ink/60 mb-1">
                Code PIN
              </label>
              <input
                type="text"
                maxLength={4}
                value={empPin}
                onChange={(e) => setEmpPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1234"
                className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-center text-xs font-mono font-bold text-ink"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs font-bold text-white shadow-hard-coral"
          >
            <ScanLine className="h-3.5 w-3.5" />
            Créer
          </button>
        </form>

        {/* Card 2: Classement de l'équipe */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Trophy className="h-3.5 w-3.5 text-coral" />
              <span>Classement de l&apos;équipe</span>
            </div>
            <div className="flex items-center gap-1">
              {(
                [
                  { k: '7j', l: '7 jours' },
                  { k: '30j', l: '30 jours' },
                  { k: 'debut', l: 'Depuis le début' },
                  { k: 'jour', l: 'Un jour précis' },
                ] as const
              ).map((p) => (
                <button
                  key={p.k}
                  type="button"
                  onClick={() => setTeamPeriod(p.k)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors ${teamPeriod === p.k
                      ? 'bg-ink text-white'
                      : 'bg-ink/[0.04] text-ink/60 hover:text-ink'
                    }`}
                >
                  {p.k === 'jour' && <Calendar className="h-2.5 w-2.5" />}
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <div className="py-5 text-center space-y-0.5">
            <p className="text-xs text-ink/50">Aucune activité sur cette période.</p>
            <p className="text-[11px] text-ink/40">
              Le classement se remplit dès qu&apos;un caissier fait créer une carte ou scanne un
              client.
            </p>
          </div>
        </div>

        {/* Card 3: Caisses actives */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-2">
          <p className="text-xs font-bold text-ink">Caisses actives ({displayEmployees.length})</p>
          {displayEmployees.length === 0 ? (
            <p className="text-xs text-ink/50">
              Aucune caisse pour l&apos;instant. Vous continuez à encaisser normalement depuis votre
              propre compte.
            </p>
          ) : (
            <div className="divide-y divide-ink/[0.06]">
              {displayEmployees.map((emp) => (
                <div key={emp.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink">{emp.name}</span>
                    <span className="ml-2 text-[10px] font-mono text-ink/40">PIN: {emp.pin_code || emp.pinCode || '1234'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold text-[11px]">Active</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeamMember(emp.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     QR CODE (/qrcode) — Exact replica of Screenshot 9
     -------------------------------------------------------------------------- */
  if (section === 'qrcode') {
    return (
      <div className="max-w-sm space-y-4">
        <div>
          <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink">
            QR CODE
          </h1>
          <p className="mt-1 text-xs text-ink/55">
            Affichez ce QR code dans votre établissement pour que vos clients s&apos;inscrivent
          </p>
        </div>

        <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-soft flex flex-col items-center text-center">
          <div className="rounded-2xl border-[3px] border-ink p-3 bg-white qr-matrix-container">
            <QrCodeMatrix code={joinUrl} size={148} />
          </div>

          <p className="mt-4 text-xs font-bold text-ink">{commerce.name}</p>
          <p className="mt-0.5 text-[10px] text-ink/45">{joinUrl}</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 w-full">
            <button
              type="button"
              onClick={() => copyLink(joinUrl)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-white py-2.5 text-xs font-bold text-ink hover:bg-ink/[0.02]"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copié ✓' : 'Copier le lien'}
            </button>
            <button
              type="button"
              onClick={downloadQrSvg}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-coral py-2.5 text-xs font-bold text-white shadow-hard-coral"
            >
              <Download className="h-3.5 w-3.5" />
              Télécharger SVG
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-2">
          <p className="text-xs font-bold text-ink">Comment utiliser ce QR code ?</p>
          <ol className="space-y-1.5 text-[11px] leading-relaxed text-ink/65">
            <li>
              <strong className="text-ink">1.</strong> Imprimez-le et affichez-le sur votre
              comptoir, table ou menu.
            </li>
            <li>
              <strong className="text-ink">2.</strong> Le client scanne et accepte — une adresse
              email lui est demandée seulement si vous avez choisi de pouvoir lui écrire.
            </li>
            <li>
              <strong className="text-ink">3.</strong> La carte de fidélité s&apos;installe
              directement dans son Apple ou Google Wallet.
            </li>
          </ol>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     API (/api-cles) — Exact replica of Screenshot 12
     -------------------------------------------------------------------------- */
  if (section === 'api') {
    return (
      <div className="max-w-lg space-y-4">
        <div>
          <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink">
            API
          </h1>
          <p className="mt-1 text-xs text-ink/55">
            Reliez votre boutique en ligne ou votre logiciel de caisse à Fidelio : vos clients
            gagnent leurs points partout.
          </p>
        </div>

        {/* Card 1: Créer une clé */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!apiKeyName.trim()) return;
            setApiKeys((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                name: apiKeyName,
                token: 'fdl_live_' + Math.random().toString(36).substring(2, 14),
              },
            ]);
            setApiKeyName('');
          }}
          className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <KeyRound className="h-3.5 w-3.5 text-ink/70" />
            <span>Créer une clé</span>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ink mb-1">Nom de la clé</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                placeholder="Boutique Shopify"
                className="flex-1 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-ink/55 px-4 py-2 text-xs font-bold text-white hover:bg-ink"
              >
                <Plus className="h-3.5 w-3.5" /> Créer
              </button>
            </div>
          </div>
        </form>

        {/* Card 2: Vos clés */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-2">
          <p className="text-xs font-bold text-ink">Vos clés</p>
          {apiKeys.length === 0 ? (
            <p className="text-xs text-ink/45">Aucune clé pour l&apos;instant.</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-xl border border-ink/10 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-ink">{k.name}</p>
                    <p className="font-mono text-[10px] text-ink/50">{k.token}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApiKeys((prev) => prev.filter((x) => x.id !== k.id))}
                    className="text-[11px] font-bold text-red-600"
                  >
                    Révoquer
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-ink/45">
            Une clé révoquée cesse de marcher immédiatement. Si une clé a pu fuiter, révoquez-la et
            créez-en une nouvelle.
          </p>
        </div>

        {/* Card 3: Documentation de l'API */}
        <Link
          to="/docs/api"
          className="flex w-full items-center gap-2 rounded-2xl border border-ink/[0.08] bg-white px-5 py-3.5 text-left text-xs font-bold text-ink shadow-soft hover:bg-ink/[0.01] transition-colors"
        >
          <BookOpen className="h-4 w-4 text-coral" />
          <span>Documentation de l&apos;API, pour votre développeur</span>
        </Link>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     MON COMPTE — DONNÉES CLIENTS (/donnees-clients) — Screenshot 11
     -------------------------------------------------------------------------- */
  if (section === 'donnees-clients') {
    return (
      <div className="max-w-lg space-y-4">
        <div className="flex items-center gap-1.5 text-[11px] text-ink/60">
          <Clock className="h-3.5 w-3.5 text-coral" />
          <span>Vous voyez un code par client, jamais son nom, son email ou son téléphone.</span>
        </div>

        {/* Card 1: Voulez-vous pouvoir écrire à vos clients ? */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
          <p className="text-xs font-bold text-ink">Voulez-vous pouvoir écrire à vos clients ?</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setCanEmailClients('oui')}
              className={`rounded-xl border p-3.5 text-left transition-all ${canEmailClients === 'oui'
                  ? 'border-coral bg-coral/[0.04]'
                  : 'border-ink/10 bg-white'
                }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Mail className="h-3.5 w-3.5" />
                <span>Oui</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-ink/55">
                L&apos;inscription demande un email. Vous pourrez envoyer des campagnes.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCanEmailClients('non')}
              className={`rounded-xl border p-3.5 text-left transition-all ${canEmailClients === 'non'
                  ? 'border-coral bg-coral/[0.04]'
                  : 'border-ink/10 bg-white'
                }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Mail className="h-3.5 w-3.5" />
                <span>Non</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-ink/55">
                L&apos;inscription ne demande rien. Pas de campagnes email.
              </p>
            </button>
          </div>
          <p className="text-[10px] text-ink/45">
            Vaut pour tous les points de vente de <strong className="text-ink">{commerce.name}</strong>. Les clients déjà inscrits ne sont pas touchés.
          </p>
        </div>

        {/* Card 2: La date de naissance à l'inscription */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
          <p className="text-xs font-bold text-ink">La date de naissance à l&apos;inscription</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setBirthDateRule('facultative')}
              className={`rounded-xl border p-3.5 text-left transition-all ${birthDateRule === 'facultative'
                  ? 'border-coral bg-coral/[0.04]'
                  : 'border-ink/10 bg-white'
                }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Calendar className="h-3.5 w-3.5" />
                <span>Facultative</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-ink/55">
                Le client peut la laisser vide. Le souhait d&apos;anniversaire ne touche que ceux
                qui l&apos;ont donnée.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBirthDateRule('obligatoire')}
              className={`rounded-xl border p-3.5 text-left transition-all ${birthDateRule === 'obligatoire'
                  ? 'border-coral bg-coral/[0.04]'
                  : 'border-ink/10 bg-white'
                }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Cake className="h-3.5 w-3.5" />
                <span>Obligatoire</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-ink/55">
                Pas de carte sans elle. Chaque nouveau client pourra recevoir votre souhait
                d&apos;anniversaire.
              </p>
            </button>
          </div>
          <p className="text-[10px] leading-relaxed text-ink/45">
            Vaut pour tous les points de vente de <strong className="text-ink">{commerce.name}</strong>. Les clients déjà inscrits ne sont pas touchés. Vous ne voyez jamais la date elle-même.
          </p>
        </div>

        {/* Accordion: Pourquoi je ne vois pas les noms ? */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-soft">
          <button
            type="button"
            onClick={() => setWhyNoNamesOpen((o) => !o)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-bold text-ink"
          >
            <span className="text-ink/40">{whyNoNamesOpen ? '▾' : '▸'}</span>
            <span>Pourquoi je ne vois pas les noms ?</span>
          </button>
          {whyNoNamesOpen && (
            <div className="border-t border-ink/[0.06] px-4 py-3 text-[11px] leading-relaxed text-ink/60">
              Conformément à la protection des données personnelles (Déclaration ANPDP / CNDP
              Algérie — Loi n° 18-07), l&apos;identité des porteurs est anonymisée par un code
              unique afin de garantir une inscription en 1 clic sans friction et une sécurité totale
              contre la fuite de fichiers clients.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     MON COMPTE — ABONNEMENT (/billing) — Exact replica of Screenshot 15
     -------------------------------------------------------------------------- */
  if (section === 'billing') {
    const cycleCfg = {
      mensuel: { l: 'Mensuel', moisFactures: 1, labelMois: "1 mois d'abonnement" },
      semestriel: { l: '6 mois', moisFactures: 5, labelMois: "6 mois d'abonnement (-1 mois)" },
      annuel: { l: '12 mois', moisFactures: 10, labelMois: "12 mois d'abonnement (-2 mois)" },
    }[rythme];

    const basePrice = 397 * cycleCfg.moisFactures;
    const nextCharge = basePrice + emailPack;

    return (
      <div className="max-w-md space-y-4">
        {/* Card 1: VOTRE ABONNEMENT */}
        <div className="rounded-2xl border border-coral/35 bg-white p-5 shadow-soft space-y-3.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">
              VOTRE ABONNEMENT
            </p>
            <p className="mt-1 font-impact text-2xl text-ink">397 DZD / mois</p>
            <p className="text-[11px] text-ink/50">397 DZD × 1 point de vente</p>
          </div>

          <div className="flex gap-1 rounded-xl bg-ink/[0.04] p-1">
            {(
              [
                { k: 'mensuel', l: 'Mensuel', o: '' },
                { k: 'semestriel', l: '6 mois', o: '-1 mois' },
                { k: 'annuel', l: '12 mois', o: '-2 mois' },
              ] as const
            ).map((c) => (
              <button
                key={c.k}
                type="button"
                onClick={() => setRythme(c.k)}
                className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition-all ${rythme === c.k ? 'bg-white text-ink shadow-sm' : 'text-ink/55'
                  }`}
              >
                {c.l} {c.o && <span className="text-coral">{c.o}</span>}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setPayNotice(`Abonnement activé (${basePrice} DZD). Merci de votre confiance !`)
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3 text-xs font-bold text-white shadow-hard-coral"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Activer — {basePrice} DZD
          </button>

          <p className="text-center text-[10px] text-ink/45">{cycleCfg.labelMois}</p>

          <div className="pt-2 border-t border-ink/[0.06] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-ink/70">
              <Store className="h-3.5 w-3.5 text-ink/50" />
              <span>
                <strong className="text-ink">1</strong> point de vente ouvert — 397 DZD chacun
              </span>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-coral/80 px-3.5 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un point de vente — 397 DZD
            </button>

            <p className="text-[10px] leading-relaxed text-ink/50">
              397 DZD aujourd&apos;hui pour le mois en cours, puis{' '}
              <strong className="text-ink">794 DZD par mois</strong> au prochain prélèvement.
            </p>
            <p className="text-[10px] text-ink/40">
              Un point de vente s&apos;ajoute à un abonnement en cours. Réglez d&apos;abord votre
              abonnement.
            </p>
          </div>

          {payNotice && (
            <p className="rounded-xl bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">
              {payNotice}
            </p>
          )}
        </div>

        {/* Card 2: EMAILS DU PRODUIT */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">
              EMAILS DU PRODUIT
            </span>
            <Mail className="h-3.5 w-3.5 text-ink/35" />
          </div>
          <p className="font-impact text-xl text-ink">
            0 <span className="text-ink/40">/ 5 000</span>
          </p>
          <div className="h-1.5 w-full rounded-full bg-ink/[0.06]" />
          <p className="text-[11px] leading-relaxed text-ink/55">
            Bienvenue, confirmation d&apos;inscription, relances automatiques : compris dans votre
            abonnement, 5 000 par point de vente.
          </p>
        </div>

        {/* Card 3: CAMPAGNES CE MOIS-CI */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">
              CAMPAGNES CE MOIS-CI
            </span>
            <Send className="h-3.5 w-3.5 text-ink/35" />
          </div>
          <p className="font-impact text-xl text-ink">
            0 <span className="text-ink/40">/ 0</span>
          </p>
          <p className="text-[11px] leading-relaxed text-ink/55">
            🔒 Les campagnes ne sont pas comprises dans l&apos;abonnement. Choisissez un pack : vous
            le réglez aujourd&apos;hui, et il est actif tout de suite.
          </p>

          <p className="text-xs font-bold text-ink pt-1">Ajouter des emails</p>

          <div className="space-y-2">
            {[
              { cost: 0 as const, title: 'Aucun pack', sub: 'Aucune campagne ne part', right: '' },
              {
                cost: 200 as const,
                title: '10 000 emails de campagne',
                sub: 'chaque mois, partagés entre vos points de vente',
                right: "200 DZD aujourd'hui",
              },
              {
                cost: 400 as const,
                title: '25 000 emails de campagne',
                sub: 'chaque mois, partagés entre vos points de vente',
                right: "400 DZD aujourd'hui",
              },
              {
                cost: 700 as const,
                title: '50 000 emails de campagne',
                sub: 'chaque mois, partagés entre vos points de vente',
                right: "700 DZD aujourd'hui",
              },
            ].map((pk) => {
              const active = emailPack === pk.cost;
              return (
                <button
                  key={pk.title}
                  type="button"
                  onClick={() => setEmailPack(pk.cost)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${active ? 'border-coral bg-coral/[0.03]' : 'border-ink/10 bg-white'
                    }`}
                >
                  <div>
                    <p className="text-xs font-bold text-ink">{pk.title}</p>
                    <p className="text-[10px] text-ink/45">{pk.sub}</p>
                  </div>
                  {pk.right ? (
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-coral">{pk.right}</p>
                      <p className="text-[9px] text-ink/40">pour le mois en cours</p>
                    </div>
                  ) : (
                    active && <Check className="h-3.5 w-3.5 text-coral" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-ink/[0.03] p-3">
            <div>
              <p className="text-xs font-bold text-ink">Prochain prélèvement</p>
              <p className="text-[10px] text-ink/45">
                Abonnement 397 DZD × 1 · par mois — en un seul prélèvement.
              </p>
            </div>
            <span className="font-impact text-xl text-ink">{nextCharge} DZD</span>
          </div>

          <div className="rounded-xl border border-ink/[0.06] p-3 space-y-1 text-[10px] leading-relaxed text-ink/55">
            <p className="font-bold text-ink">Conditions du pack</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Prendre un pack, ou un pack plus grand : vous le réglez aujourd&apos;hui et il est
                actif tout de suite.
              </li>
              <li>
                Vous payez chaque mois qui reste jusqu&apos;à votre échéance, au tarif mensuel du
                pack. Un mois entamé est dû en entier.
              </li>
              <li>
                Pour un pack plus grand, vous ne payez que la différence avec votre pack actuel,
                pour ces mêmes mois.
              </li>
              <li>Ensuite, le pack est compris dans chaque renouvellement de votre abonnement.</li>
              <li>
                Le volume vaut pour un mois civil : les emails non envoyés ne sont pas reportés au
                mois suivant.
              </li>
              <li>
                Réduire ou retirer votre pack : effet au prochain prélèvement, sans remboursement de
                la période déjà réglée.
              </li>
            </ul>
          </div>
          <p className="text-[10px] text-ink/40">
            Un pack s&apos;ajoute à un abonnement en cours. Réglez d&apos;abord votre abonnement.
          </p>
        </div>

        {/* Card 4: Offre gratuite bottom summary card */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-soft flex flex-col items-center text-center space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.05] text-ink/60">
            <CreditCard className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold text-ink">Offre gratuite</p>
          <p className="text-[11px] text-ink/55 max-w-xs">
            {customers.length} client sur 30 offerts. Votre programme fonctionne déjà ;
            l&apos;abonnement lève la limite.
          </p>

          <div className="w-full max-w-[260px] rounded-2xl bg-coral p-5 text-white shadow-hard-coral">
            <p className="font-impact text-3xl">397 DZD</p>
            <p className="text-[11px] text-white/85">/ mois TTC</p>
            <p className="mt-0.5 text-[10px] text-white/70">397 DZD par point de vente</p>
            <p className="mt-2 text-[10px] text-white/90">
              Clients illimités · Wallet · Push · Campagnes email
            </p>
          </div>

          <div className="w-full max-w-[260px] rounded-xl border border-ink/10 bg-white px-4 py-2.5">
            <p className="text-xs font-bold text-ink">
              150 DZD <span className="font-normal text-[10px] text-ink/50">· une seule fois</span>
            </p>
            <p className="text-[10px] text-ink/50">
              Carte NFC acrylique posée en caisse (optionnel)
            </p>
          </div>

          <p className="text-[10px] text-ink/45 pt-1">
            Une question avant de vous abonner ? Écrivez-nous sur{' '}
            <a
              href="mailto:fidelioapp.support@gmail.com"
              className="font-semibold text-coral underline"
            >
              fidelioapp.support@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     MES POINTS DE VENTE (/points-de-vente)
     -------------------------------------------------------------------------- */
  if (section === 'pdv') {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink">
          MES POINTS DE VENTE
        </h1>
        <div className="space-y-3">
          {commerces.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-2xl border border-ink/[0.08] bg-white p-4 shadow-soft"
            >
              <div>
                <p className="text-xs font-bold text-ink">{c.name}</p>
                <p className="text-[11px] text-ink/50">/{c.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => selectCommerce(c.id)}
                className="rounded-xl bg-ink px-3.5 py-2 text-xs font-bold text-white"
              >
                {c.id === commerce.id ? 'Actif ✓' : 'Choisir'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     MON COMPTE — PARAMÈTRES (/settings) — Exact replica of Screenshot 13
     -------------------------------------------------------------------------- */
  return (
    <div className="max-w-md space-y-4">
      {/* Card 1: Établissement */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3.5">
        <p className="text-xs font-bold text-ink">Établissement</p>

        <div>
          <label className="block text-[11px] font-bold text-ink mb-1">Nom *</label>
          <input
            type="text"
            value={commerce.name}
            onChange={(e) => updateCommerce({ name: e.target.value })}
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink mb-1">Type d&apos;activité</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-medium text-ink"
          >
            <option>Commerce physique — mes clients viennent sur place</option>
            <option>Commerce en ligne — e-commerce ou livraison</option>
          </select>
          <p className="mt-1 text-[10px] text-ink/45">
            Un commerce en ligne n&apos;a ni comptoir ni caisse : nous masquons ce qui ne le
            concerne pas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-ink mb-1">Téléphone</label>
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+213 5 50 00 00 00"
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-ink mb-1">Ville</label>
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Alger"
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink mb-1">Adresse</label>
          <input
            type="text"
            value={addrInput}
            onChange={(e) => setAddrInput(e.target.value)}
            placeholder="123 rue Didouche Mourad"
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink mb-1">Description courte</label>
          <input
            type="text"
            value={descInput}
            onChange={(e) => setDescInput(e.target.value)}
            placeholder="Restaurant traditionnel algérien..."
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
          />
        </div>

        <div className="pt-2 border-t border-ink/[0.06] space-y-2.5">
          <div>
            <p className="text-[11px] font-bold text-ink">Liens sur la carte</p>
            <p className="text-[10px] text-ink/45">
              Affichés au dos de la carte de vos clients, dans leur wallet. L&apos;adresse et le
              téléphone ci-dessus y figurent aussi, et sont cliquables.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-ink mb-1">Site web</label>
              <input
                type="text"
                value={siteInput}
                onChange={(e) => setSiteInput(e.target.value)}
                placeholder="moncafe.dz"
                className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-ink mb-1">
                Réservation en ligne
              </label>
              <input
                type="text"
                value={resaInput}
                onChange={(e) => setResaInput(e.target.value)}
                placeholder="moncafe.dz/reserver"
                className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-ink mb-1">Instagram</label>
              <input
                type="text"
                value={instaInput}
                onChange={(e) => setInstaInput(e.target.value)}
                placeholder="instagram.com/moncafe"
                className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-ink mb-1">Facebook</label>
              <input
                type="text"
                value={fbInput}
                onChange={(e) => setFbInput(e.target.value)}
                placeholder="facebook.com/moncafe"
                className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
              />
            </div>
          </div>

          <div className="w-1/2 pr-1.5">
            <label className="block text-[10px] font-bold text-ink mb-1">TikTok</label>
            <input
              type="text"
              value={tiktokInput}
              onChange={(e) => setTiktokInput(e.target.value)}
              placeholder="tiktok.com/@moncafe"
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Notification à proximité */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
        <p className="text-xs font-bold text-ink">Notification à proximité</p>
        <p className="text-[10px] leading-relaxed text-ink/55">
          Vos clients reçoivent une notification quand ils passent près de chez vous, sans que vous
          ayez rien à envoyer. Il faut que la carte soit dans leur wallet. Comptez quelques minutes
          après leur entrée dans la zone : le téléphone n&apos;écoute pas le GPS en continu, il se
          réveille par intermittence pour préserver la batterie.
        </p>

        <div>
          <label className="block text-[10px] font-bold text-ink mb-1">
            Emplacement de la boutique
          </label>
          <input
            type="text"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="Collez votre lien Google Maps"
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
          />
          <p className="mt-1 text-[9.5px] leading-relaxed text-ink/45">
            Sur Google Maps : trouvez votre boutique, appuyez sur{' '}
            <strong className="text-ink">Partager</strong>, puis copiez le lien. Vous pouvez aussi
            saisir vos coordonnées : <code>36.7538, 3.0588</code>. Laissez vide pour désactiver.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold text-ink mb-1">
              Distance de déclenchement
            </label>
            <input
              type="number"
              value={geoRadius}
              onChange={(e) => setGeoRadius(Number(e.target.value))}
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink"
            />
            <p className="mt-1 text-[9.5px] leading-relaxed text-ink/45">
              En mètres, jusqu&apos;à 2000. Couverture réelle :{' '}
              <strong className="text-ink">≈ 850 m</strong>. Apple et Google fixent eux-mêmes la
              portée de chaque point ; nous en plaçons plusieurs autour de votre boutique pour
              couvrir la zone, sans jamais pouvoir dépasser ce plafond.
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ink mb-1">Message affiché</label>
            <input
              type="text"
              value={commerce.geoNotificationText}
              onChange={(e) => updateCommerce({ geoNotificationText: e.target.value })}
              placeholder="Un café vous attend chez nous ☕"
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
            />
            <p className="mt-1 text-[9.5px] leading-relaxed text-ink/45">
              120 caractères maximum. Vide = « Vous êtes près de [votre commerce] ».
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={async () => {
          const ok = await updateCommerce({
            address: cityInput || commerce.address,
            geoNotificationText: commerce.geoNotificationText,
          });
          if (ok) setSettingsSaved(true);
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-xs font-bold text-white shadow-hard-coral"
      >
        <Save className="h-3.5 w-3.5" />
        {settingsSaved ? 'Enregistré ✓' : 'Enregistrer'}
      </button>

      {/* Card 3: Mot de passe */}
      <form onSubmit={handlePasswordChange} className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-ink">
          <KeyRound className="h-3.5 w-3.5 text-coral" />
          <span>Mot de passe</span>
        </div>

        {passwordNotice && (
          <div
            className={`rounded-xl p-2.5 text-xs font-semibold ${passwordNotice.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
              }`}
          >
            {passwordNotice.text}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-ink mb-1">Mot de passe actuel</label>
          <div className="relative">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
            />
            <Eye className="h-3.5 w-3.5 text-ink/35 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-ink mb-1">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="•••••••• (6 car. min)"
              className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
            />
            <Eye className="h-3.5 w-3.5 text-ink/35 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-ink mb-1">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs text-ink"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2.5 text-xs font-bold text-white shadow-hard-coral"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Changer le mot de passe
        </button>
      </form>

      {/* Card 4: Résiliation & Déconnexion */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
          <XCircle className="h-3.5 w-3.5 text-ink/45" />
          <span>Session & Résiliation</span>
        </div>
        <p className="text-[11px] text-ink/50">
          Aucun abonnement payant sur ce compte : rien ne vous sera prélevé.
        </p>
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = '/connexion';
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
        >
          <Lock className="h-3.5 w-3.5" />
          Se déconnecter de Fidelio
        </button>
      </div>
    </div>
  );
};
