import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithGooglePopup,
  syncMerchantToFirestore,
  syncCustomerToFirestore,
  syncTransactionToFirestore,
  syncLeadToFirestore,
} from '../lib/firebase.ts';

export type ProgramMode = 'points' | 'tampons';

export interface RewardTier {
  id: string;
  title: string;
  cost: number;
  description: string;
  category: string;
  redemptions: number;
}

export interface Customer {
  id: string;
  merchantId?: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  visits: number;
  totalSpent: number;
  memberSince: string;
  lastVisit: string;
  walletAdded: 'apple' | 'google' | 'web';
  referredBy?: string;
  googleReviewDone: boolean;
  unlockedRewards?: string[];
}

export interface ScanTransaction {
  id: string;
  merchantId?: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  type: 'earn' | 'redeem';
  delta: number;
  amountDzd?: number;
  rewardTitle?: string;
  unlockedReward?: string;
  operator: string;
  timestamp: string;
  createdAt?: string;
  synced: boolean;
}

export interface CommerceSettings {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  category: string;
  programName?: string;
  mode: ProgramMode;
  pointsPerMad: number;
  pointsPerDzd?: number;
  stampsPerVisit: number;
  stampsTarget?: number;
  welcomeBonus: number;
  referralBonus: number;
  googleReviewBonus: number;
  googleReviewUrl: string;
  cardBgColor: string;
  cardAccentColor: string;
  cardCoverImage: string;
  cardLogoImage: string;
  address: string;
  geoNotificationText: string;
  rewards?: RewardTier[];
}

export interface LeadRecord {
  id: string;
  source: 'demo' | 'simulateur' | 'demarrer';
  prenom: string;
  commerce_name: string;
  phone: string;
  email: string;
  ville: string;
  points_de_vente: string;
  rappel_quand: string;
  sim_clients_par_jour?: number | null;
  sim_panier_moyen?: number | null;
  sim_gain_mensuel_dzd?: number | null;
  created_at: string;
}

export interface CampaignLog {
  id: string;
  title: string;
  channel: 'push' | 'email';
  segment: string;
  recipients: number;
  sentAt: string;
  status: 'Envoyé' | 'Programmé';
}

export interface EmployeeCounter {
  id: string;
  name: string;
  pinCode: string;
  location: string;
  scansToday: number;
  active: boolean;
}

export interface ScanResult {
  ok: boolean;
  message: string;
  customer?: Customer;
  transaction?: ScanTransaction;
  unlockedRewards?: RewardTier[];
  newlyUnlockedReward?: RewardTier | null;
}

interface StoreContextType {
  loading: boolean;
  apiError: string | null;
  clearApiError: () => void;
  refreshState: (merchantIdOrSlug?: string) => Promise<void>;
  commerce: CommerceSettings;
  commerces: CommerceSettings[];
  selectCommerce: (id: string) => void;
  updateCommerce: (patch: Partial<CommerceSettings>) => Promise<boolean>;
  registerMerchant: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    category?: string;
    address?: string;
    mode?: ProgramMode;
  }) => Promise<{ ok: boolean; error?: string; merchant?: CommerceSettings }>;
  loginMerchant: (input: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string; merchant?: CommerceSettings }>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string; merchant?: CommerceSettings }>;
  submitLead: (input: {
    source: 'demo' | 'simulateur' | 'demarrer';
    prenom: string;
    commerceName: string;
    phone: string;
    email?: string;
    ville?: string;
    pointsDeVente?: string;
    rappelQuand?: string;
    simClientsParJour?: number;
    simPanierMoyen?: number;
    simGainMensuelDzd?: number;
  }) => Promise<{ ok: boolean; error?: string; lead?: LeadRecord }>;
  leads: LeadRecord[];
  rewards: RewardTier[];
  addReward: (r: Omit<RewardTier, 'id' | 'redemptions'>) => Promise<boolean>;
  deleteReward: (id: string) => Promise<boolean>;
  customers: Customer[];
  addCustomer: (
    c: Omit<
      Customer,
      | 'id'
      | 'code'
      | 'points'
      | 'visits'
      | 'totalSpent'
      | 'memberSince'
      | 'lastVisit'
      | 'googleReviewDone'
    > & { merchantSlug?: string }
  ) => Promise<{ ok: boolean; error?: string; customer?: Customer }>;
  scanCustomer: (
    codeOrId: string,
    delta: number,
    type: 'earn' | 'redeem',
    rewardTitle?: string,
    operator?: string,
    amountDzd?: number
  ) => Promise<ScanResult>;
  claimGoogleReview: (customerId: string) => Promise<void>;
  transactions: ScanTransaction[];
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  syncOfflineQueue: () => void;
  campaigns: CampaignLog[];
  sendCampaign: (c: Omit<CampaignLog, 'id' | 'sentAt' | 'status'>) => void;
  employees: EmployeeCounter[];
  addEmployee: (name: string, location: string, pinCode: string) => void;
  toggleEmployee: (id: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  skin: 'premium' | 'classique';
  toggleSkin: () => void;
}

const DEFAULT_COMMERCE: CommerceSettings = {
  id: 'com-1',
  name: 'Gourmand',
  slug: 'gourmand-klzq',
  category: 'Restaurant',
  programName: 'Programme Fidélité Gourmand',
  mode: 'tampons',
  pointsPerMad: 1,
  pointsPerDzd: 1,
  stampsPerVisit: 1,
  stampsTarget: 10,
  welcomeBonus: 0,
  referralBonus: 0,
  googleReviewBonus: 0,
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=',
  cardBgColor: '#1a1a1a',
  cardAccentColor: '#f85b04',
  cardCoverImage: '/landing/cartes/ongles.webp',
  cardLogoImage: '/brand/logo-mark.png',
  address: 'Alger',
  geoNotificationText: 'Un café vous attend chez nous ☕',
};

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [commerces, setCommerces] = useState<CommerceSettings[]>([DEFAULT_COMMERCE]);
  const [activeId, setActiveId] = useState<string>(() => {
    return localStorage.getItem('fidelio_active_merchant_id') || 'com-1';
  });
  const [rewards, setRewards] = useState<RewardTier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<ScanTransaction[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [employees, setEmployees] = useState<EmployeeCounter[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [skin, setSkin] = useState<'premium' | 'classique'>('premium');

  const clearApiError = useCallback(() => setApiError(null), []);

  /**
   * Robust fetch wrapper guaranteeing NO unhandled JSON parse exceptions (Unexpected end of JSON)
   */
  const safeFetchJson = async <T = any>(
    url: string,
    options?: RequestInit
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let parsed: any = null;
      if (text && text.trim().length > 0) {
        try {
          parsed = JSON.parse(text);
        } catch {
          return {
            ok: false,
            status: res.status,
            error: `Le serveur a renvoyé une réponse invalide (HTTP ${res.status}).`,
          };
        }
      }
      if (!res.ok) {
        const errorMsg =
          parsed?.error ||
          parsed?.erreur?.message ||
          (res.status === 404
            ? "L'API Cloudflare Worker n'est pas encore prête ou joignable (HTTP 404)."
            : `Erreur serveur (HTTP ${res.status}).`);
        return { ok: false, status: res.status, data: parsed, error: errorMsg };
      }
      if (parsed && parsed.ok === false) {
        return {
          ok: false,
          status: res.status,
          data: parsed,
          error: parsed.error || parsed.erreur?.message || 'Opération refusée par le serveur',
        };
      }
      return { ok: true, status: res.status, data: parsed };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      return { ok: false, status: 0, error: msg };
    }
  };

  const refreshState = useCallback(
    async (merchantIdOrSlug?: string) => {
      const target = merchantIdOrSlug ?? activeId;
      try {
        setLoading(true);
        const { ok, data: json, error } = await safeFetchJson(`/api/state?merchant=${encodeURIComponent(target)}`);
        if (!ok || !json) {
          throw new Error(error || 'Erreur lors du chargement des données');
        }
        if (Array.isArray(json.commerces) && json.commerces.length > 0) {
          setCommerces(json.commerces);
        }
        if (json.activeCommerce) {
          setActiveId(json.activeCommerce.id);
          localStorage.setItem('fidelio_active_merchant_id', json.activeCommerce.id);
        }
        setRewards(Array.isArray(json.rewards) ? json.rewards : []);
        setCustomers(Array.isArray(json.customers) ? json.customers : []);
        setTransactions(Array.isArray(json.transactions) ? json.transactions : []);
        setLeads(Array.isArray(json.leads) ? json.leads : []);
        setApiError(null);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Erreur réseau');
      } finally {
        setLoading(false);
      }
    },
    [activeId]
  );

  useEffect(() => {
    void refreshState(activeId);
  }, [activeId, refreshState]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', skin);
  }, [skin]);

  const commerce = commerces.find((c) => c.id === activeId) || commerces[0] || DEFAULT_COMMERCE;

  const selectCommerce = (id: string) => {
    setActiveId(id);
    localStorage.setItem('fidelio_active_merchant_id', id);
    void refreshState(id);
  };

  const updateCommerce = async (patch: Partial<CommerceSettings>): Promise<boolean> => {
    // Optimistic UI update + immediate persistence to SQLite
    setCommerces((prev) => prev.map((c) => (c.id === commerce.id ? { ...c, ...patch } : c)));
    try {
      const { ok, data: json, error } = await safeFetchJson(
        `/api/merchants/${encodeURIComponent(commerce.id)}/program`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }
      );
      if (!ok || !json) {
        setApiError(error || 'Impossible de sauvegarder la configuration');
        return false;
      }
      if (json.merchant) {
        setCommerces((prev) =>
          prev.map((c) => (c.id === json.merchant.id ? json.merchant : c))
        );
      }
      if (Array.isArray(json.rewards)) {
        setRewards(json.rewards);
      }
      setApiError(null);
      return true;
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur réseau');
      return false;
    }
  };

  const registerMerchant = async (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    category?: string;
    address?: string;
    mode?: ProgramMode;
  }) => {
    try {
      setLoading(true);
      const { ok, data: json, error } = await safeFetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!ok || !json?.merchant) {
        const errMsg = error || json?.error || 'Erreur lors de la création du compte';
        setApiError(errMsg);
        return { ok: false, error: errMsg };
      }
      const created: CommerceSettings = json.merchant;
      setCommerces((prev) => [...prev, created]);
      setActiveId(created.id);
      localStorage.setItem('fidelio_active_merchant_id', created.id);
      await refreshState(created.id);
      return { ok: true, merchant: created };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur réseau';
      setApiError(errMsg);
      return { ok: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const loginMerchant = async (input: { email: string; password: string }) => {
    try {
      setLoading(true);
      const { ok, data: json, error } = await safeFetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!ok || !json?.merchant) {
        const errMsg = error || json?.error || 'Identifiants invalides';
        setApiError(errMsg);
        return { ok: false, error: errMsg };
      }
      const logged: CommerceSettings = json.merchant;
      setActiveId(logged.id);
      localStorage.setItem('fidelio_active_merchant_id', logged.id);
      await refreshState(logged.id);
      void syncMerchantToFirestore(logged);
      return { ok: true, merchant: logged };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur réseau';
      setApiError(errMsg);
      return { ok: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const googleRes = await signInWithGooglePopup();
      if (!googleRes.ok || !googleRes.user) {
        const errMsg = googleRes.error || 'Connexion Google annulée';
        setApiError(errMsg);
        return { ok: false, error: errMsg };
      }

      const { ok, data: json, error } = await safeFetchJson('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleRes.user.email,
          name: googleRes.user.displayName,
          googleId: googleRes.user.uid,
          photoURL: googleRes.user.photoURL,
        }),
      });

      if (!ok || !json?.merchant) {
        const errMsg = error || json?.error || 'Erreur lors de la synchronisation du compte Google';
        setApiError(errMsg);
        return { ok: false, error: errMsg };
      }

      const logged: CommerceSettings = json.merchant;
      setActiveId(logged.id);
      localStorage.setItem('fidelio_active_merchant_id', logged.id);
      await refreshState(logged.id);
      void syncMerchantToFirestore(logged);
      return { ok: true, merchant: logged };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erreur réseau';
      setApiError(errMsg);
      return { ok: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const submitLead = async (input: {
    source: 'demo' | 'simulateur' | 'demarrer';
    prenom: string;
    commerceName: string;
    phone: string;
    email?: string;
    ville?: string;
    pointsDeVente?: string;
    rappelQuand?: string;
    simClientsParJour?: number;
    simPanierMoyen?: number;
    simGainMensuelDzd?: number;
  }) => {
    try {
      const { ok, data: json, error } = await safeFetchJson('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!ok || !json?.lead) {
        return { ok: false, error: error || json?.error || 'Données invalides' };
      }
      setLeads((prev) => [json.lead, ...prev]);
      void syncLeadToFirestore(json.lead);
      return { ok: true, lead: json.lead as LeadRecord };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l’envoi du formulaire',
      };
    }
  };

  const addReward = async (r: Omit<RewardTier, 'id' | 'redemptions'>): Promise<boolean> => {
    const newReward: RewardTier = {
      ...r,
      id: `rew-${Date.now()}`,
      redemptions: 0,
    };
    const nextRewards = [...rewards, newReward];
    setRewards(nextRewards);
    return updateCommerce({ rewards: nextRewards });
  };

  const deleteReward = async (id: string): Promise<boolean> => {
    const nextRewards = rewards.filter((r) => r.id !== id);
    setRewards(nextRewards);
    return updateCommerce({ rewards: nextRewards });
  };

  const addCustomer = async (
    c: Omit<
      Customer,
      | 'id'
      | 'code'
      | 'points'
      | 'visits'
      | 'totalSpent'
      | 'memberSince'
      | 'lastVisit'
      | 'googleReviewDone'
    > & { merchantSlug?: string }
  ): Promise<{ ok: boolean; error?: string; customer?: Customer }> => {
    try {
      const slug = c.merchantSlug || commerce.slug;
      const { ok, data: json, error } = await safeFetchJson(
        `/api/join/${encodeURIComponent(slug)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: c.name,
            phone: c.phone,
            email: c.email,
            walletAdded: c.walletAdded,
            merchantId: commerce.id,
          }),
        }
      );
      if (!ok || !json?.customer) {
        return { ok: false, error: error || json?.error || 'Erreur lors de la création de la carte' };
      }
      const created: Customer = json.customer;
      setCustomers((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
      void syncCustomerToFirestore(created);
      return { ok: true, customer: created };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur réseau lors de l’inscription',
      };
    }
  };

  const scanCustomer = async (
    codeOrId: string,
    delta: number,
    type: 'earn' | 'redeem',
    rewardTitle?: string,
    operator = 'Caisse Principale',
    amountDzd?: number
  ): Promise<ScanResult> => {
    try {
      const { ok, data: json, error } = await safeFetchJson('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeOrId,
          merchantId: commerce.id,
          type,
          delta: Math.abs(delta),
          amountDzd,
          rewardTitle,
          operator,
        }),
      });
      if (!ok || !json?.ok) {
        return {
          ok: false,
          message: error || json?.message || json?.error || `Erreur lors du scan du code "${codeOrId}".`,
        };
      }

      const updatedCustomer: Customer = json.customer;
      const createdTx: ScanTransaction = json.transaction;

      setCustomers((prev) => {
        const exists = prev.some((c) => c.id === updatedCustomer.id);
        return exists
          ? prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
          : [updatedCustomer, ...prev];
      });
      void syncCustomerToFirestore(updatedCustomer);
      if (createdTx) {
        setTransactions((prev) => [createdTx, ...prev]);
        void syncTransactionToFirestore(createdTx);
      }
      if (type === 'redeem' && rewardTitle) {
        setRewards((prev) =>
          prev.map((r) =>
            r.title === rewardTitle ? { ...r, redemptions: r.redemptions + 1 } : r
          )
        );
      }

      return {
        ok: true,
        message: json.message,
        customer: updatedCustomer,
        transaction: createdTx,
        unlockedRewards: json.unlockedRewards,
        newlyUnlockedReward: json.newlyUnlockedReward,
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Erreur réseau lors du scan en caisse.',
      };
    }
  };

  const claimGoogleReview = async (customerId: string): Promise<void> => {
    try {
      const { ok, data: json } = await safeFetchJson(
        `/api/customers/${encodeURIComponent(customerId)}/google-review`,
        {
          method: 'POST',
        }
      );
      if (ok && json?.customer) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === json.customer.id ? json.customer : c))
        );
      }
    } catch {
      // Ignore network error
    }
  };

  const syncOfflineQueue = () => {
    setTransactions((prev) => prev.map((t) => ({ ...t, synced: true })));
    setOfflineMode(false);
  };

  const sendCampaign = (c: Omit<CampaignLog, 'id' | 'sentAt' | 'status'>) => {
    setCampaigns((prev) => [
      {
        ...c,
        id: `camp-${Date.now()}`,
        sentAt: 'À l’instant',
        status: 'Envoyé',
      },
      ...prev,
    ]);
  };

  const addEmployee = (name: string, location: string, pinCode: string) => {
    setEmployees((prev) => [
      ...prev,
      { id: `emp-${Date.now()}`, name, location, pinCode, scansToday: 0, active: true },
    ]);
  };

  const toggleEmployee = (id: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e)));
  };

  return (
    <StoreContext.Provider
      value={{
        loading,
        apiError,
        clearApiError,
        refreshState,
        commerce,
        commerces,
        selectCommerce,
        updateCommerce,
        registerMerchant,
        loginMerchant,
        loginWithGoogle,
        submitLead,
        leads,
        rewards,
        addReward,
        deleteReward,
        customers,
        addCustomer,
        scanCustomer,
        claimGoogleReview,
        transactions,
        offlineMode,
        setOfflineMode,
        syncOfflineQueue,
        campaigns,
        sendCampaign,
        employees,
        addEmployee,
        toggleEmployee,
        darkMode,
        toggleDarkMode: () => setDarkMode((d) => !d),
        skin,
        toggleSkin: () => setSkin((s) => (s === 'premium' ? 'classique' : 'premium')),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
};
