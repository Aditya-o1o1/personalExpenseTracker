import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import { PageLoader } from './components/ui';
import AppShell from './components/AppShell';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const RecurringTransactionsPage = lazy(() => import('./pages/RecurringTransactionsPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RouteGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/recurring" element={<RecurringTransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
