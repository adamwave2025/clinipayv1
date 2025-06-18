import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
const TermsPage = () => {
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

      {/* Terms Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Terms of <span className="gradient-text">Service</span>
          </h1>
          
          <div className="prose prose-lg max-w-none">
            
            <p>Last updated: 8 June 2025</p>
            
            <p><strong>IMPORTANT – READ CAREFULLY.</strong> By creating an account or using the CliniPay platform you ("Clinic", "you") agree to these Terms. If you do not accept them, do not use the Service.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">1. The Service</h2>
            <p>CliniPay provides a web application that enables clinics to generate payment links, collect payments via Stripe Connect, and administer instalment plans. CliniPay itself is not a payment institution and does not hold client money; all funds are settled via your own Stripe connected account.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Intellectual Property</h2>
            <p><strong>2.1</strong> Platform IP – All software, documentation, and brand assets that constitute CliniPay are and shall remain the exclusive property of CliniPay Ltd or its licensors. No rights are granted other than the limited, non‑exclusive, revocable licence necessary for you to access and use the Service while these Terms remain in force.</p>
            <p><strong>2.2</strong> Clinic Data – You retain all title to patient and clinic data you upload or generate through the Service. You grant CliniPay a worldwide, non‑exclusive licence to host, copy, transmit, and display that data solely to provide the Service and to comply with applicable law.</p>
            <p><strong>2.3</strong> Feedback – If you provide comments or suggestions about the Service, CliniPay may use them without restriction and without any obligation to you.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Accounts and Security</h2>
            <p>You must keep your login credentials (including any API keys) secure and ensure that only authorised staff access the dashboard. You are responsible for all activity that occurs under your credentials. You must promptly notify CliniPay of any suspected unauthorised use or security breach.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Fees and Settlement</h2>
            <p><strong>4.1</strong> Stripe Fees – Credit‑/debit‑card processing fees are charged directly by Stripe under the Stripe Connected Account Agreement you accept when linking your account.</p>
            <p><strong>4.2</strong> CliniPay Service Fee – For each successful payment processed through the Service, CliniPay charges a service fee equal to the percentage displayed in your dashboard ("Service Fee"). The Service Fee is automatically deducted before funds are paid out by Stripe. CliniPay does not charge any subscription or set‑up fees.</p>
            <p><strong>4.3</strong> Taxes – All fees are exclusive of VAT and any other applicable taxes, which shall be added where required by law.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Protection</h2>
            <p>Each party shall comply with UK‑GDPR and the Data Protection Act 2018. The parties acknowledge: – Clinic is the Data Controller with respect to patient data. – CliniPay is the Data Processor. The Data Processing Schedule in Annex 1 forms part of these Terms.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Sub‑Processors</h2>
            <p>You authorise CliniPay to engage the sub‑processors listed in the Privacy & Cookie Notice. CliniPay will give at least 14 days' notice of any intended change to that list.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Confidentiality</h2>
            <p>Each party will keep the other party's Confidential Information secret and use it only to fulfil these Terms or as otherwise permitted in writing or required by law.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Warranties and Disclaimers</h2>
            <p>The Service is provided "as is" and "as available". Except as expressly stated in these Terms, CliniPay makes no warranties of any kind, whether express, implied, statutory or otherwise, including but not limited to warranties of merchantability, fitness for a particular purpose, or non‑infringement. CliniPay does not warrant that the Service will be uninterrupted or error‑free.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Liability</h2>
            <p>Nothing in these Terms limits or excludes liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation. Subject to the foregoing, each party's total aggregate liability arising under or in connection with the Service in any 12‑month period shall not exceed the greater of £10,000 or the Service Fees paid to CliniPay in that period.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Suspension and Termination</h2>
            <p><strong>10.1</strong> Clinic‑initiated – You may discontinue use of the Service at any time by disconnecting your Stripe account and ceasing all access.</p>
            <p><strong>10.2</strong> CliniPay‑initiated – CliniPay may suspend or terminate your access immediately if (a) you materially breach these Terms; (b) your use poses a security risk, could subject CliniPay to legal liability, or is fraudulent or abusive; or (c) required by law or a payment‑network rule.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Governing Law</h2>
            <p>These Terms are governed by the laws of England and Wales. The courts of England and Wales shall have exclusive jurisdiction over any dispute arising out of or in connection with them.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Annex 1 – Data Processing Schedule (Article 28 UK‑GDPR)</h2>
            
            <h3 className="text-xl font-bold mt-6 mb-3">1. Subject matter and duration</h3>
            <p>Processing of patient payment data for the term of the Agreement plus retention periods specified in the Privacy & Cookie Notice.</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">2. Nature and purpose of processing</h3>
            <p>Hosting, storage, transmission and retrieval of payment‑related personal data to facilitate payment collection and instalment plans.</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">3. Categories of data subjects</h3>
            <p>Patients of the Clinic; authorised clinic staff.</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">4. Categories of personal data</h3>
            <p>Patient: name, email, phone, treatment reference, payment amount, card network, last four digits, timestamps. Staff: name, business email, role, login activity.</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">5. Special category data</h3>
            <p>None intentionally collected.</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">6. Obligations of Processor</h3>
            <p><strong>6.1</strong> Process data only on documented instructions from the Controller.</p>
            <p><strong>6.2</strong> Ensure persons authorised to process data are bound by confidentiality.</p>
            <p><strong>6.3</strong> Implement appropriate technical and organisational security measures (see Section 7 of the Privacy & Cookie Notice).</p>
            <p><strong>6.4</strong> Assist the Controller in fulfilling data‑subject rights and breach obligations.</p>
            <p><strong>6.5</strong> Delete or return personal data on termination (except where law requires retention).</p>
            <p><strong>6.6</strong> Make available information necessary to demonstrate compliance and allow audits once per year with 30 days' notice.</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">7. Sub‑processors</h3>
            <p>Stripe Payments Europe Ltd (payments)</p>
            <p>Amazon Web Services EMEA SARL, London region (hosting)</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">8. International transfers</h3>
            <p>Not applicable. At the time of this Agreement CliniPay does not transfer personal data outside the United Kingdom.</p>
            
            <h3 className="text-xl font-bold mt-6 mb-3">9. Technical and organisational measures</h3>
            <p>Encryption in transit and at rest – All data are protected by TLS 1.2+ and AES‑256 encryption managed by our infrastructure providers, Supabase (database) and Stripe (payment processing).</p>
            <p>Provider‑managed backups – Supabase maintains automated encrypted backups with point‑in‑time recovery; Stripe secures all card data under PCI‑DSS. – No additional technical controls are implemented at this stage. CliniPay will continually review and enhance security measures as the platform scales.</p>
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
export default TermsPage;