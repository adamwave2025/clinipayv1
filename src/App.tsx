
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "./components/common/ScrollToTop";
import AuthRedirectWrapper from "./components/common/AuthRedirectWrapper";
import ConnectivityMonitor from "./components/common/ConnectivityMonitor";

// Public Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import FeesPage from "./pages/FeesPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

// Clinic Dashboard Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import CreateLinkPage from "./pages/dashboard/CreateLinkPage";
import SendLinkPage from "./pages/dashboard/SendLinkPage";
import ReusableLinksPage from "./pages/dashboard/ReusableLinksPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import PaymentHistoryPage from "./pages/dashboard/PaymentHistoryPage";
import PatientsPage from "./pages/dashboard/PatientsPage";
import ManagePlansPage from "./pages/dashboard/ManagePlansPage";
import PaymentPlansPage from "./pages/dashboard/PaymentPlansPage";
import HelpPage from "./pages/dashboard/HelpPage";

// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ClinicsPage from "./pages/admin/ClinicsPage";
import ClinicProfilePage from "./pages/admin/ClinicProfilePage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

// Payment Pages
import PatientPaymentPage from "./pages/payment/PatientPaymentPage";
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";
import PaymentFailedPage from "./pages/payment/PaymentFailedPage";

// Auth callback page
import AuthCallbackPage from "./pages/AuthCallbackPage";

// Protected Route Components
import ProtectedRoute from "./components/common/ProtectedRoute";
import RoleBasedRoute from "./components/common/RoleBasedRoute";
import AdminRedirect from "./pages/admin/AdminRedirect";

// Configure React Query with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (replaces cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <ConnectivityMonitor>
            <Routes>
              {/* Public Routes - Home page will redirect to dashboard if authenticated */}
              <Route path="/" element={
                <AuthRedirectWrapper redirectTo="/dashboard">
                  <HomePage />
                </AuthRedirectWrapper>
              } />
              
              {/* Public Routes */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/fees" element={<FeesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              
              {/* Payment Routes (Public) */}
              <Route path="/payment" element={<PatientPaymentPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/failed" element={<PaymentFailedPage />} />
              <Route path="/payment/:linkId" element={<PatientPaymentPage />} />
              
              {/* Admin role check with redirect - For main dashboard */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AdminRedirect fallbackComponent={<DashboardPage />} />
                </ProtectedRoute>
              } />
              
              {/* Protected Clinic Routes */}
              <Route path="/dashboard/create-link" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <CreateLinkPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/send-link" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <SendLinkPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/reusable-links" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <ReusableLinksPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/settings" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <SettingsPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/help" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <HelpPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/payment-history" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <PaymentHistoryPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/patients" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <PatientsPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/manage-plans" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <ManagePlansPage />
                </RoleBasedRoute>
              } />
              <Route path="/dashboard/payment-plans" element={
                <RoleBasedRoute allowedRoles={['clinic']}>
                  <PaymentPlansPage />
                </RoleBasedRoute>
              } />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <RoleBasedRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <AdminDashboardPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/clinics" element={
                <RoleBasedRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <ClinicsPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/clinics/:clinicId" element={
                <RoleBasedRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <ClinicProfilePage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/settings" element={
                <RoleBasedRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <AdminSettingsPage />
                </RoleBasedRoute>
              } />
              
              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ConnectivityMonitor>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
