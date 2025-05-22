
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UnifiedAuthProvider } from "./contexts/UnifiedAuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "./components/common/ScrollToTop";
import AuthRedirectWrapper from "./components/common/AuthRedirectWrapper";

// Public Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import FeaturesPage from "./pages/FeaturesPage";  // Added import for FeaturesPage
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
import AuthRoute from "./components/auth/AuthRoute";
import RoleRoute from "./components/auth/RoleRoute";
import ClinicRoute from "./components/auth/ClinicRoute";
import AdminRedirect from "./components/auth/AdminRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <UnifiedAuthProvider>
          <AuthProvider>
            <Routes>
              {/* Public Routes - Home page will redirect to dashboard if authenticated */}
              <Route path="/" element={
                <AuthRedirectWrapper redirectTo="/dashboard">
                  <HomePage />
                </AuthRedirectWrapper>
              } />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} /> {/* Added route for FeaturesPage */}
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
                <AuthRoute>
                  <AdminRedirect fallbackComponent={<DashboardPage />} />
                </AuthRoute>
              } />
              
              {/* Protected Clinic Routes */}
              <Route path="/dashboard/create-link" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <CreateLinkPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/send-link" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <SendLinkPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/reusable-links" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <ReusableLinksPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/settings" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <SettingsPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/help" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <HelpPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/payment-history" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <PaymentHistoryPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/patients" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <PatientsPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/manage-plans" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <ManagePlansPage />
                </RoleRoute>
              } />
              <Route path="/dashboard/payment-plans" element={
                <RoleRoute allowedRoles={['clinic']}>
                  <PaymentPlansPage />
                </RoleRoute>
              } />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <RoleRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <AdminDashboardPage />
                </RoleRoute>
              } />
              <Route path="/admin/clinics" element={
                <RoleRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <ClinicsPage />
                </RoleRoute>
              } />
              <Route path="/admin/clinics/:clinicId" element={
                <RoleRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <ClinicProfilePage />
                </RoleRoute>
              } />
              <Route path="/admin/settings" element={
                <RoleRoute allowedRoles={['admin']} redirectTo="/dashboard">
                  <AdminSettingsPage />
                </RoleRoute>
              } />
              
              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </UnifiedAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
