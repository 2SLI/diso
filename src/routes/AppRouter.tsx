import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/ui';
const HomePage = lazy(async () => ({ default: (await import('../pages/HomePage')).HomePage }));
const LoginPage = lazy(async () => ({ default: (await import('../pages/AuthPages')).LoginPage }));
const RegisterPage = lazy(async () => ({
  default: (await import('../pages/AuthPages')).RegisterPage,
}));
const JoinCompanyPage = lazy(async () => ({
  default: (await import('../pages/AuthPages')).JoinCompanyPage,
}));
const CompaniesPage = lazy(async () => ({
  default: (await import('../pages/CompanyPages')).CompaniesPage,
}));
const CompanyDetailPage = lazy(async () => ({
  default: (await import('../pages/CompanyPages')).CompanyDetailPage,
}));
const MyCompanyPage = lazy(async () => ({
  default: (await import('../pages/CompanyPages')).MyCompanyPage,
}));
const DashboardPage = lazy(async () => ({
  default: (await import('../pages/WorkspacePages')).DashboardPage,
}));
const PersonalProfilePage = lazy(async () => ({
  default: (await import('../pages/WorkspacePages')).PersonalProfilePage,
}));
const TeamPage = lazy(async () => ({
  default: (await import('../pages/WorkspacePages')).TeamPage,
}));
const RfqPage = lazy(async () => ({
  default: (await import('../pages/CollaborationPages')).RfqPage,
}));
const QuotesPage = lazy(async () => ({
  default: (await import('../pages/CollaborationPages')).QuotesPage,
}));
const ConnectionsPage = lazy(async () => ({
  default: (await import('../pages/CollaborationPages')).ConnectionsPage,
}));
const PlaceholderPage = lazy(async () => ({
  default: (await import('../pages/WorkspacePages')).PlaceholderPage,
}));
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? <DashboardLayout /> : <Navigate to="/login" replace />;
}
export function AppRouter() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/join-company" element={<JoinCompanyPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-company" element={<MyCompanyPage />} />
            <Route path="/profile" element={<PersonalProfilePage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/rfqs" element={<RfqPage />} />
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/settings" element={<PlaceholderPage title="설정" />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
