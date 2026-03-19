import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { useAuthStore } from '@/stores/authStore';

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TileFormatsPage = lazy(() => import('@/features/tile-formats/TileFormatsPage').then(m => ({ default: m.TileFormatsPage })));
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage').then(m => ({ default: m.CustomersPage })));
const CreateCustomerPage = lazy(() => import('@/features/customers/CreateCustomerPage').then(m => ({ default: m.CreateCustomerPage })));
const CustomerDetailPage = lazy(() => import('@/features/customers/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));
const DealsPage = lazy(() => import('@/features/deals/DealsPage').then(m => ({ default: m.DealsPage })));
const CreateDealPage = lazy(() => import('@/features/deals/CreateDealPage').then(m => ({ default: m.CreateDealPage })));
const DealDetailPage = lazy(() => import('@/features/deals/DealDetailPage').then(m => ({ default: m.DealDetailPage })));
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('@/features/users/UsersPage').then(m => ({ default: m.UsersPage })));

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tile-formats" element={<TileFormatsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/new" element={<CreateCustomerPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/new" element={<CreateDealPage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </>
  );
}
