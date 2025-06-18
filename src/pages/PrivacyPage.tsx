import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
const PrivacyPage = () => {
  return <MainLayout>
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

      {/* Privacy Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          
          <div className="prose prose-lg max-w-none">
            
            <p>Last updated: 8 June 2025</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Who we are</h2>
            <p>Wave Growth Ltd (trading as "CliniPay", "we", "us") is a private limited company registered in England and Wales. We provide a software platform that lets UK clinics send payment links and manage flexible payment plans for their patients.</p>
            <p><strong>Contact:</strong> privacy@clinipay.co.uk</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">2. The data we process</h2>
            <p><strong>2.1</strong> Clinic data – names and contact details of clinic staff, login credentials, usage logs.</p>
            <p><strong>2.2</strong> Patient data – name, email, phone, reference for treatment, payment amount, card network and last four digits, transaction timestamps. Card information is tokenised and processed directly by Stripe; CliniPay never stores full card numbers or CVV. We do not intentionally collect special‑category medical data.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Why we process your data</h2>
            <p>To perform our contract with the clinic (Article 6(1)(b) UK‑GDPR). – To pursue our legitimate interests in protecting the service and improving usability (Article 6(1)(f)). – To satisfy legal obligations to keep accounting records (Article 6(1)(c)).</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Sharing and sub‑processing</h2>
            <p>We use two sub‑processors: – Stripe Payments Europe Ltd – payment processing and fraud prevention. – Amazon Web Services EMEA SARL – cloud hosting in the London (eu‑west‑2) region.</p>
            <p>Both act under written agreements incorporating Article 28 UK‑GDPR requirements.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">5. International transfers</h2>
            <p>Patient and clinic data are stored in the UK. Where Stripe transfers data to the US, it relies on the UK International Data Transfer Addendum (IDTA) to the EU Standard Contractual Clauses.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">6. How long we keep data</h2>
            <p>Financial transaction records: six (6) years after the end of the tax year in which the transaction occurred. – Application audit logs: twelve (12) months. – Support tickets: twenty‑four (24) months. After these periods the data are permanently deleted or anonymised.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Security</h2>
            <p>All data are encrypted in transit (TLS 1.2+) and at rest (AES‑256). Production access is protected by role‑based permissions and multi‑factor authentication. Daily encrypted backups are stored separately. We maintain an incident‑response plan that requires notification to affected clinics within 24 hours of becoming aware of a breach.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Your rights</h2>
            <p>Clinic staff and patients can ask us to access, correct, erase, restrict or port their personal data, or object to its processing. Please email privacy@clinipay.co.uk. If you are not satisfied, you may complain to the Information Commissioner's Office at ico.org.uk.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Cookies</h2>
            <p>We use only a handful of cookies. They fall into two groups:</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">Essential cookies (always on)</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>clinipay_session</strong> – keeps you securely logged in and protects against CSRF attacks. Expires after 1 day.</li>
              <li><strong>__stripe_mid and __stripe_sid</strong> – set by Stripe to prevent fraud and ensure secure payment processing. Expire after 1 year and 30 minutes respectively.</li>
            </ul>
            
            <h3 className="text-xl font-bold mt-6 mb-3">Optional cookies (load only with consent)</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>_ga / _ga**</strong> – Google Analytics. Help us understand which pages are popular so we can improve the site. Persist for up to 2 years.</li>
              <li><strong>_fbp</strong> – Meta Pixel. Allows us to measure marketing performance and show relevant ads. Expires after 90 days.</li>
            </ul>
            
            <p>On your first visit we show a short banner. We will set the optional cookies only if you click "Accept all". You can withdraw consent or fine‑tune your choices at any time via the "Cookie settings" link in the footer.</p>
            <p>We do not use any other cookies, local‑storage items, or similar trackers.</p>
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
    </MainLayout>;
};
export default PrivacyPage;