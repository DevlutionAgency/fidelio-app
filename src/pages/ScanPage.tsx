import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  ScanLine,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ScanPage: React.FC = () => {
  const {
    commerce,
    customers,
    rewards,
    scanCustomer,
    offlineMode,
    setOfflineMode,
    syncOfflineQueue,
    transactions,
  } = useStore();
  const [searchParams] = useSearchParams();

  const [codeInput, setCodeInput] = useState(
    () => searchParams.get('code') || customers[0]?.code || ''
  );
  const [amountDa, setAmountDa] = useState(1000);
  const [selectedOperator, setSelectedOperator] = useState('Caisse Principale');
  const [scanningApi, setScanningApi] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
    unlockedReward?: string | null;
  } | null>(null);

  // Camera QR Scanner state (html5-qrcode)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const paramCode = searchParams.get('code');
    if (paramCode) {
      setCodeInput(paramCode);
    } else if (!codeInput && customers.length > 0) {
      setCodeInput(customers[0].code);
    }
  }, [searchParams, customers, codeInput]);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => undefined);
      }
    };
  }, []);

  const selectedCustomer = customers.find(
    (c) => c.code.toUpperCase() === codeInput.trim().toUpperCase()
  );

  const pointsToCredit =
    commerce.mode === 'tampons'
      ? commerce.stampsPerVisit
      : Math.max(1, Math.round((amountDa / 100) * commerce.pointsPerMad));

  const executeScan = async (targetCode: string) => {
    if (!targetCode.trim()) {
      setFeedback({ ok: false, message: 'Veuillez saisir ou scanner un code client (ex: C-XXXXXX).' });
      return;
    }
    setScanningApi(true);
    setFeedback(null);
    const res = await scanCustomer(
      targetCode.trim(),
      pointsToCredit,
      'earn',
      undefined,
      selectedOperator,
      amountDa
    );
    setScanningApi(false);
    setFeedback({
      ok: res.ok,
      message: res.message,
      unlockedReward: res.newlyUnlockedReward?.title ?? null,
    });
  };

  const toggleCameraScanner = async () => {
    setCameraError(null);
    if (cameraActive && qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch {
        // Ignore stop error
      }
      qrScannerRef.current = null;
      setCameraActive(false);
      return;
    }

    // Check secure context for camera permissions (HTTPS required except on localhost)
    if (
      typeof window !== 'undefined' &&
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setCameraError(
        'La caméra requiert une connexion sécurisée HTTPS sur mobile. Le champ de saisie manuelle ci-dessous est 100% disponible.'
      );
      manualInputRef.current?.focus();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Caméra non supportée par ce navigateur. Utilisez la saisie manuelle de secours ci-dessous.'
      );
      manualInputRef.current?.focus();
      return;
    }

    setCameraActive(true);
    // Yield brief frame to ensure container element is mounted
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const container = document.getElementById('caisse-qr-reader');
      if (!container) {
        throw new Error('Élément de caméra introuvable dans le DOM.');
      }
      const scanner = new Html5Qrcode('caisse-qr-reader');
      qrScannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const cleanCode = decodedText.trim();
          setCodeInput(cleanCode);
          void executeScan(cleanCode);
          scanner.stop().catch(() => undefined);
          qrScannerRef.current = null;
          setCameraActive(false);
        },
        () => {
          // Frame without QR code
        }
      );
    } catch (err) {
      setCameraActive(false);
      qrScannerRef.current = null;
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(
        `Caméra indisponible (${msg}). Le champ de saisie manuelle ci-dessous reste 100 % opérationnel.`
      );
      manualInputRef.current?.focus();
    }
  };

  const handleEarn = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeScan(codeInput);
  };

  const handleRedeem = async (rewardTitle: string, cost: number) => {
    setScanningApi(true);
    setFeedback(null);
    const res = await scanCustomer(codeInput, cost, 'redeem', rewardTitle, selectedOperator);
    setScanningApi(false);
    setFeedback({ ok: res.ok, message: res.message });
  };

  const unsyncedCount = transactions.filter((t) => !t.synced).length;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-impact text-3xl sm:text-4xl uppercase tracking-tight text-ink">
            SCANNER EN CAISSE
          </h1>
          <p className="text-xs text-ink/55">
            Scannez le QR code du client avec la caméra ou saisissez son code manuellement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOfflineMode(!offlineMode)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold border transition-colors ${
              offlineMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-800'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
            }`}
          >
            {offlineMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5" /> Hors-ligne ({unsyncedCount})
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" /> En ligne
              </>
            )}
          </button>

          {unsyncedCount > 0 && (
            <button
              type="button"
              onClick={syncOfflineQueue}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Synchroniser
            </button>
          )}
        </div>
      </div>

      {/* Camera QR Code Reader Section (html5-qrcode) */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <QrCode className="h-4 w-4 text-coral" />
            <span>Lecteur QR Code Caméra</span>
          </div>
          <button
            type="button"
            onClick={toggleCameraScanner}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
              cameraActive
                ? 'bg-red-600 text-white'
                : 'bg-ink text-white hover:bg-coral'
            }`}
          >
            <ScanLine className="h-3.5 w-3.5" />
            {cameraActive ? 'Arrêter la caméra' : 'Activer la caméra QR Code'}
          </button>
        </div>

        <div
          id="caisse-qr-reader"
          className={`overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.02] ${
            cameraActive ? 'min-h-[240px]' : 'hidden'
          }`}
        />

        {cameraError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-900">
            {cameraError}
          </div>
        )}
      </div>

      {/* Manual Fallback Input & Point/Stamp Credit Form */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            Saisie manuelle de secours — Code client (C-XXXXXX)
          </label>
          <div className="flex gap-2">
            <input
              ref={manualInputRef}
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Ex: C-7K4M2P"
              className="flex-1 rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 font-mono text-sm font-bold uppercase text-ink focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-xs font-bold text-ink"
            >
              <option value="Caisse Principale">Caisse Principale</option>
            </select>
          </div>

          {customers.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-ink/50">Clients inscrits :</span>
              {customers.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCodeInput(c.code)}
                  className={`rounded-lg px-2 py-1 font-mono text-[11px] font-bold transition-colors ${
                    codeInput.toUpperCase() === c.code.toUpperCase()
                      ? 'bg-coral text-white'
                      : 'bg-ink/[0.05] text-ink hover:bg-ink/10'
                  }`}
                >
                  {c.code} ({c.name} · {c.points})
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleEarn} className="space-y-3 pt-2 border-t border-ink/[0.06]">
          {commerce.mode === 'points' ? (
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Montant encaissé (DZD)
              </label>
              <input
                type="number"
                min={1}
                value={amountDa}
                onChange={(e) => setAmountDa(Number(e.target.value))}
                className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm font-bold text-ink"
              />
              <p className="mt-1 text-[11px] text-ink/50">
                Barème : {commerce.pointsPerMad} point(s) pour 100 DZD dépensés.
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink/60">
              Mode tampons : <strong>+{commerce.stampsPerVisit} tampon(s)</strong> par passage.
            </p>
          )}

          <button
            type="submit"
            disabled={scanningApi}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-coral py-3 text-sm font-bold text-white shadow-hard-coral disabled:opacity-50"
          >
            <ScanLine className="w-4 h-4" />
            {scanningApi
              ? 'Validation en base de données...'
              : `Créditer +${pointsToCredit} ${commerce.mode === 'tampons' ? 'tampon(s)' : 'points'}`}
          </button>
        </form>

        {feedback && (
          <div
            className={`rounded-xl p-3.5 text-xs font-bold ${
              feedback.ok
                ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-800 border border-red-500/30'
            }`}
          >
            <p>{feedback.message}</p>
            {feedback.unlockedReward && (
              <p className="mt-1 text-emerald-900">
                🎁 Palier atteint : Le client a débloqué « {feedback.unlockedReward} » !
              </p>
            )}
          </div>
        )}

        {selectedCustomer && rewards.length > 0 && (
          <div className="pt-3 border-t border-ink/[0.06] space-y-2">
            <p className="text-xs font-bold text-ink">
              Récompenses pour {selectedCustomer.name} ({selectedCustomer.code} — Solde :{' '}
              {selectedCustomer.points})
            </p>
            {rewards.map((rew) => {
              const canRedeem = selectedCustomer.points >= rew.cost;
              return (
                <div
                  key={rew.id}
                  className={`flex items-center justify-between rounded-xl border p-2.5 ${
                    canRedeem
                      ? 'border-emerald-500/40 bg-emerald-500/[0.05]'
                      : 'border-ink/10 bg-white'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-ink">
                      {rew.title} ({rew.cost} {commerce.mode === 'tampons' ? 'tampons' : 'pts'})
                    </span>
                    {canRedeem && (
                      <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        Débloquée
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!canRedeem || scanningApi}
                    onClick={() => handleRedeem(rew.title, rew.cost)}
                    className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white disabled:opacity-30"
                  >
                    Utiliser la récompense
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Transactions History from SQLite */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <Clock className="h-4 w-4 text-coral" />
            <span>Historique des transactions en caisse ({transactions.length})</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-ink/45 py-4 text-center">
            Aucune transaction enregistrée pour le moment.
          </p>
        ) : (
          <div className="divide-y divide-ink/[0.06]">
            {transactions.slice(0, 15).map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between text-xs gap-2"
              >
                <div>
                  <p className="font-bold text-ink">
                    {tx.customerName}{' '}
                    <span className="font-mono text-[11px] text-ink/55">({tx.customerCode})</span>
                  </p>
                  <p className="text-[11px] text-ink/45">
                    {tx.operator} · {tx.timestamp}
                    {tx.unlockedReward ? ` · 🎉 ${tx.unlockedReward}` : ''}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold px-2.5 py-1 rounded-lg ${
                    tx.type === 'earn'
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : 'bg-coral/10 text-coral'
                  }`}
                >
                  {tx.delta > 0 ? `+${tx.delta}` : tx.delta}{' '}
                  {commerce.mode === 'tampons' ? 'tampon(s)' : 'pts'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
