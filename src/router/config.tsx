import { RouteObject } from 'react-router-dom'
import { lazy } from 'react'
import ProtectedRoute from '../components/base/ProtectedRoute'

/* ========= Pages ========= */

const HomePage = lazy(() => import('../pages/home/page'))
const LoginPage = lazy(() => import('../pages/auth/login'))
const RegisterPage = lazy(() => import('../pages/auth/register'))
const NotFoundPage = lazy(() => import('../pages/NotFound'))

// Brawl Stars
const BrawlStarsPage = lazy(() => import('../pages/brawlstars/page'))

// Order / Payment
const OrderNewPage = lazy(() => import('../pages/order/new/page'))
const PaymentSuccessPage = lazy(() => import('../pages/payment-success/page'))

// Services / Games
const ServicesPage = lazy(() => import('../pages/services/page'))
const GamesPage = lazy(() => import('../pages/games/page'))

// Legal
const TermsPage = lazy(() => import('../pages/legal/terms/page'))
const PrivacyPage = lazy(() => import('../pages/legal/privacy/page'))
const CompliancePage = lazy(() => import('../pages/legal/compliance/page'))

// Dashboard
const CustomerDashboardPage = lazy(() => import('../pages/dashboard/customer/page'))
const EmployeeDashboardPage = lazy(() => import('../pages/dashboard/employee/page'))
const AdminDashboardPage = lazy(() => import('../pages/dashboard/admin/page'))

// Admin子ページ
const AdminUsersPage = lazy(() => import('../pages/dashboard/admin/users/page'))
const AdminOrdersPage = lazy(() => import('../pages/dashboard/admin/orders/page'))
const AdminDisputesPage = lazy(() => import('../pages/dashboard/admin/disputes/page'))
const AdminLogsPage = lazy(() => import('../pages/dashboard/admin/logs/page'))
const AdminChatsPage = lazy(() => import('../pages/dashboard/admin/chats/page'))
const ChatPage = lazy(() => import('../pages/chat/page'))
const AdminMetricsPage = lazy(() => import('../pages/dashboard/admin/metrics/page'))
const AdminSecurityPage = lazy(() => import('../pages/dashboard/admin/security/page'))
const AdminSystemPage = lazy(() => import('../pages/dashboard/admin/system/page'))
const AdminInterventionChatPage = lazy(
  () => import('../pages/dashboard/admin/intervention-chat/page')
)

/* ========= Route定義（1ファイルに統一） ========= */

const routes: RouteObject[] = [
  // === 公開ページ ===
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/services', element: <ServicesPage /> },
  { path: '/games', element: <GamesPage /> },
  { path: '/games/brawl-stars', element: <BrawlStarsPage /> },
  { path: '/legal/terms', element: <TermsPage /> },
  { path: '/legal/privacy', element: <PrivacyPage /> },
  { path: '/legal/compliance', element: <CompliancePage /> },

  // === 注文・決済（ログイン必須） ===
  {
    path: '/order/new',
    element: (
      <ProtectedRoute allowedRoles={['customer']}>
        <OrderNewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment-success',
    element: (
      <ProtectedRoute allowedRoles={['customer']}>
        <PaymentSuccessPage />
      </ProtectedRoute>
    ),
  },

  // === Chat ===
  {
    path: '/chat/:threadId',
    element: (
      <ProtectedRoute allowedRoles={['customer', 'employee', 'worker', 'admin']}>
        <ChatPage />
      </ProtectedRoute>
    ),
  },

  // === Customer ===
  {
    path: '/dashboard/customer',
    element: (
      <ProtectedRoute allowedRoles={['customer']}>
        <CustomerDashboardPage />
      </ProtectedRoute>
    ),
  },

  // === Employee ===
  {
    path: '/dashboard/employee',
    element: (
      <ProtectedRoute allowedRoles={['employee', 'admin']}>
        <EmployeeDashboardPage />
      </ProtectedRoute>
    ),
  },

  // === Admin ===
  {
    path: '/dashboard/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/users',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminUsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/orders',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminOrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/disputes',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDisputesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/logs',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLogsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/chats',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminChatsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/metrics',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminMetricsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/security',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminSecurityPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/system',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminSystemPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/admin/intervention-chat/:disputeId',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminInterventionChatPage />
      </ProtectedRoute>
    ),
  },

  // === 404 ===
  { path: '*', element: <NotFoundPage /> },
]

export default routes
