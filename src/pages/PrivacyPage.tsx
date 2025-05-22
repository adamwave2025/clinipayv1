import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';

const PrivacyPage = () => {
  return (
    <MainLayout>
      {/* Navigation */}
      <nav className="py-4 px-6 md:px-8 flex justify-between items-center">
        <Logo className="h-10 w-auto" />
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/sign-in">Sign In</Link>
          </Button>
          <Button className="btn-gradient rounded-full" asChild>
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Privacy Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p>Last updated: April 8, 2025</p>
            
            <p>CliniPay Ltd ("us", "we", or "our") operates the CliniPay website and service. This page informs you of our policies regarding the collection, use, and disclosure of Personal Information we receive from users of the Service.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information Collection and Use</h2>
            <p>While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to, your name, email address, phone number, and business details ("Personal Information").</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">For Clinics</h3>
            <p>We collect the following information from clinics using our platform:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Business name and contact details</li>
              <li>Staff names and email addresses</li>
              <li>Banking information for payment processing</li>
              <li>Business logo and branding elements</li>
            </ul>
            
            <h3 className="text-xl font-bold mt-6 mb-3">For Patients</h3>
            <p>When patients make payments through our platform, we collect:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and contact information</li>
              <li>Payment card details (processed securely through our payment processor)</li>
              <li>Information about the services being paid for</li>
            </ul>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Data Storage and Security</h2>
            <p>The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>
            <p>We implement a variety of security measures to maintain the safety of your personal information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>All supplied sensitive information is transmitted via Secure Socket Layer (SSL) technology</li>
              <li>Payment information is never stored on our servers</li>
              <li>All data is stored in secure, encrypted databases</li>
            </ul>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Sharing and Third Parties</h2>
            <p>We do not sell, trade, or rent users' personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers.</p>
            <p>We use third-party service providers to help us operate our business and the Service or administer activities on our behalf, such as sending out newsletters or surveys. We may share your information with these third parties for those limited purposes.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information. If you wish to exercise any of these rights, please contact us at privacy@clinipay.com.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Changes to This Privacy Policy</h2>
            <p>This Privacy Policy is effective as of the date stated at the top and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.</p>
            <p>We reserve the right to update or change our Privacy Policy at any time and you should check this Privacy Policy periodically. Your continued use of the Service after we post any modifications to the Privacy Policy on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Privacy Policy.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@clinipay.com.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-8 border-t mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo className="h-8 w-auto mb-4 md:mb-0" />
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

export default PrivacyPage;
