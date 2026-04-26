import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, SuperAdminRoute } from '@/components/auth/ProtectedRoute'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { isSuperAdmin } from '@/types/auth'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const GoogleCallbackPage = lazy(() => import('@/pages/GoogleCallbackPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ChurchesPage = lazy(() => import('@/pages/ChurchesPage'))
const ChurchDetailPage = lazy(() => import('@/pages/ChurchDetailPage'))
const ChurchNewPage = lazy(() => import('@/pages/ChurchNewPage'))
const MessagesPage = lazy(() => import('@/pages/MessagesPage'))
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage'))
const CampaignDetailPage = lazy(() => import('@/pages/CampaignDetailPage'))
const CampaignAnalyticsPage = lazy(() => import('@/pages/CampaignAnalyticsPage'))
const GroupsPage = lazy(() => import('@/pages/GroupsPage'))
const GroupDetailPage = lazy(() => import('@/pages/GroupDetailPage'))
const DonationsPage = lazy(() => import('@/pages/DonationsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const DonationFormPage = lazy(() => import('@/pages/DonationFormPage'))
const ManualDonationPage = lazy(() => import('@/pages/ManualDonationPage'))

function PageFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/** Redirect authenticated users to the correct home page based on role. */
function RoleHome() {
  const user = useAuthStore((s) => s.user)
  return isSuperAdmin(user)
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/form/:churchCode" element={<DonationFormPage />} />
          <Route path="/form/:churchCode/:campaignId" element={<DonationFormPage />} />

          {/* All authenticated users — AppShell wraps everything */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              {/* Root redirect based on role */}
              <Route index element={<RoleHome />} />

              {/* Tier 1 — super admin only */}
              <Route element={<SuperAdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/templates" element={<TemplatesPage />} />
              </Route>

              {/* Church admin dashboard (redirects super_admin to /admin) */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Shared pages — backend scopes data by role */}
              <Route path="/churches" element={<ChurchesPage />} />
              <Route path="/churches/new" element={<ChurchNewPage />} />
              <Route path="/churches/:churchId" element={<ChurchDetailPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/analytics" element={<CampaignAnalyticsPage />} />
              <Route path="/campaigns/:campaignId" element={<CampaignDetailPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:groupId" element={<GroupDetailPage />} />
              <Route path="/donations" element={<DonationsPage />} />
              <Route path="/manual-donations" element={<ManualDonationPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
