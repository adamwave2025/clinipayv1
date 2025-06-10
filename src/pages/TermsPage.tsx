
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';

const TermsPage = () => {
  return (
    <MainLayout>
      {/* Navigation */}
      <nav className="py-4 px-6 md:px-8 flex justify-between items-center">
        <Logo className="h-10 w-auto" to="/" />
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/sign-in">Sign In</Link>
          </Button>
          <Button className="btn-gradient rounded-full" asChild>
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Terms Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Terms of <span className="gradient-text">Service</span>
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p>Last updated: April 8, 2025</p>
            
            <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the CliniPay website and service operated by CliniPay Ltd.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
            <p>By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you do not have permission to access the Service.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of CliniPay Ltd and its licensors. The Service is protected by copyright, trademark, and other laws of both the United Kingdom and foreign countries.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">3. User Accounts</h2>
            <p>When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Payment Processing</h2>
            <p>CliniPay uses third-party payment processors (such as Stripe) to process payments. By using our Service, you agree to be bound by the terms of service of these payment processors.</p>
            <p>CliniPay charges a 3% transaction fee on all successful payments processed through the platform. This fee covers the use of the platform, payment processing, and associated services.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Refunds</h2>
            <p>Clinics using the platform have the ability to issue refunds to patients. CliniPay's transaction fee is non-refundable, even if the clinic issues a refund to the patient.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Limitation of Liability</h2>
            <p>In no event shall CliniPay, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Changes</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@clinipay.com.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-8 border-t mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo className="h-8 w-auto mb-4 md:mb-0" to="/" />
            <div className="flex gap-6">
              <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link to="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link to="/fees" className="text-gray-600 hover:text-gray-900">Fees</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              <Link to="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
              <Link to="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
            </div>
          </div>
          <div className="mt-6 text-center md:text-left text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CliniPay. All rights reserved.
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default TermsPage;
