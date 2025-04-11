
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "./components/common/ScrollToTop";

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
import SettingsPage from "./pages/dashboard/SettingsPage";
import PaymentHistoryPage from "./pages/dashboard/PaymentHistoryPage";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
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
            <Route path="/dashboard/settings" element={
              <RoleBasedRoute allowedRoles={['clinic']}>
                <SettingsPage />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard/payment-history" element={
              <RoleBasedRoute allowedRoles={['clinic']}>
                <PaymentHistoryPage />
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
