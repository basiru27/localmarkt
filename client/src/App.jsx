import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { track } from '@vercel/analytics';
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy Pages
const ListingFeed = lazy(() => import('./pages/ListingFeed'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const EditListing = lazy(() => import('./pages/EditListing'));
const MyListings = lazy(() => import('./pages/MyListings'));
const SavedListings = lazy(() => import('./pages/SavedListings'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SellerProfile = lazy(() => import('./pages/SellerProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminListings = lazy(() => import('./pages/admin/AdminListings'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C8622A]"></div>
  </div>
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/** Tracks page views on route change for Vercel Analytics */
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    track('page_view', { url: location.pathname + location.search });
  }, [location]);

  return null;
}

function App() {
  // Wake up the backend (Render free tier) on initial load
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/health`).catch(() => {
      // Silently fail if offline or unreachable
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <OfflineProvider>
            <BrowserRouter>
              <Analytics />
              <SpeedInsights />
              <RouteTracker />
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      {/* Public routes */}
                      <Route index element={<ListingFeed />} />
                      <Route path="listings/:id" element={<ListingDetail />} />
                      <Route path="sellers/:id" element={<SellerProfile />} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                      <Route path="reset-password" element={<ResetPassword />} />

                      {/* Protected routes */}
                      <Route
                        path="listings/new"
                        element={
                          <ProtectedRoute>
                            <CreateListing />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="listings/:id/edit"
                        element={
                          <ProtectedRoute>
                            <EditListing />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="my-listings"
                        element={
                          <ProtectedRoute>
                            <MyListings />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="saved"
                        element={
                          <ProtectedRoute>
                            <SavedListings />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="my-listings/analytics"
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AnalyticsDashboard />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin routes */}
                      <Route
                        path="admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="listings" element={<AdminListings />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route
                          path="logs"
                          element={
                            <AdminRoute requireSuperAdmin>
                              <AdminLogs />
                            </AdminRoute>
                          }
                        />
                      </Route>

                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </OfflineProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
