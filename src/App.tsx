import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { LandingPage } from './pages/LandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import {
  DashboardHome,
  CustomersPage,
  RewardsPage,
  NotificationsPage,
  BrandingPage,
  ExtraDashboardPages,
} from './pages/DashboardPages';

const ScanPage = React.lazy(() => import('./pages/ScanPage'));
import { CustomerCardPublicPage, AuthOnboardingPage } from './pages/PublicAndAuthPages';

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing Routes (FR, AR, EN) */}
          <Route path="/" element={<LandingPage initialLang="fr" />} />
          <Route path="/ar" element={<LandingPage initialLang="ar" />} />
          <Route path="/en" element={<LandingPage initialLang="en" />} />

          {/* Public Auth & Onboarding Routes */}
          <Route path="/login" element={<AuthOnboardingPage mode="login" />} />
          <Route path="/connexion" element={<AuthOnboardingPage mode="login" />} />
          <Route path="/register" element={<AuthOnboardingPage mode="register" />} />
          <Route path="/inscription" element={<AuthOnboardingPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthOnboardingPage mode="forgot-password" />} />
          <Route path="/mot-de-passe-oublie" element={<AuthOnboardingPage mode="forgot-password" />} />
          <Route path="/onboarding" element={<AuthOnboardingPage mode="demarrer" />} />
          <Route path="/demarrer" element={<AuthOnboardingPage mode="demarrer" />} />
          <Route path="/rendez-vous" element={<AuthOnboardingPage mode="rendez-vous" />} />
          <Route path="/conditions" element={<AuthOnboardingPage mode="conditions" />} />
          <Route path="/confidentialite" element={<AuthOnboardingPage mode="confidentialite" />} />
          <Route path="/mentions-legales" element={<AuthOnboardingPage mode="mentions-legales" />} />
          <Route path="/docs/api" element={<AuthOnboardingPage mode="api-docs" />} />
          <Route path="/api-doc" element={<AuthOnboardingPage mode="api-docs" />} />

          {/* Public Customer Digital Wallet Pass & Join Route */}
          <Route path="/c/:slug" element={<CustomerCardPublicPage />} />
          <Route path="/join/:slug" element={<CustomerCardPublicPage />} />

          {/* Merchant Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            }
          />
          <Route
            path="/dashboard/customers"
            element={
              <DashboardLayout>
                <CustomersPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/dashboard/rewards"
            element={
              <DashboardLayout>
                <RewardsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/dashboard/program"
            element={
              <DashboardLayout>
                <RewardsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/dashboard/messages"
            element={
              <DashboardLayout>
                <NotificationsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/dashboard/qrcode"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="qrcode" />
              </DashboardLayout>
            }
          />
          <Route
            path="/scan"
            element={
              <DashboardLayout>
                <React.Suspense fallback={<div className="flex min-h-[400px] items-center justify-center text-sm font-semibold text-ink/40">Chargement de la caisse...</div>}>
                  <ScanPage />
                </React.Suspense>
              </DashboardLayout>
            }
          />
          <Route
            path="/caisse"
            element={
              <DashboardLayout>
                <React.Suspense fallback={<div className="flex min-h-[400px] items-center justify-center text-sm font-semibold text-ink/40">Chargement de la caisse...</div>}>
                  <ScanPage />
                </React.Suspense>
              </DashboardLayout>
            }
          />
          <Route
            path="/customers"
            element={
              <DashboardLayout>
                <CustomersPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/rewards"
            element={
              <DashboardLayout>
                <RewardsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/program"
            element={
              <DashboardLayout>
                <RewardsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/notifications"
            element={
              <DashboardLayout>
                <NotificationsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/campaigns"
            element={
              <DashboardLayout>
                <NotificationsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/branding"
            element={
              <DashboardLayout>
                <BrandingPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/reviews"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="reviews" />
              </DashboardLayout>
            }
          />
          <Route
            path="/qrcode"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="qrcode" />
              </DashboardLayout>
            }
          />
          <Route
            path="/caisses"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="caisses" />
              </DashboardLayout>
            }
          />
          <Route
            path="/points-de-vente"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="pdv" />
              </DashboardLayout>
            }
          />
          <Route
            path="/api-cles"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="api" />
              </DashboardLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="settings" />
              </DashboardLayout>
            }
          />
          <Route
            path="/billing"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="billing" />
              </DashboardLayout>
            }
          />
          <Route
            path="/donnees-clients"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="donnees-clients" />
              </DashboardLayout>
            }
          />
          <Route
            path="/conseiller"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="conseiller" />
              </DashboardLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="admin" />
              </DashboardLayout>
            }
          />
          <Route
            path="/clients-import"
            element={
              <DashboardLayout>
                <CustomersPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/automations"
            element={
              <DashboardLayout>
                <NotificationsPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/equipe"
            element={
              <DashboardLayout>
                <ExtraDashboardPages section="caisses" />
              </DashboardLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
};

export default App;
