import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
import { CreditCard, Check, Shield, TrendingUp, ShieldCheck, PhoneOff } from 'lucide-react';
const HomePage = () => {
  return <MainLayout>
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

      {/* Hero section */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="gradient-text">Clinic-friendly test</span> for your clinic
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">More cash in, less admin: start using CliniPay to manage payments, automate reminders & reduce no-shows. Get paid on time, every time with secure, branded links that work for your clinic.</p>
          <div className="flex justify-center">
            <Button className="btn-gradient rounded-full text-lg py-6 px-8" asChild>
              <Link to="/sign-up">Ready, set, collect</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 px-6 md:px-8 bg-gray-50" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">How CliniPay works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A simple, reliable way to take control of payments
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Create payment links</h3>
                    <p className="text-gray-600">
                      Generate branded links for treatments, consultations, or deposits in just a few clicks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Collect payments</h3>
                    <p className="text-gray-600">
                      Patients pay instantly using card or Apple Pay. No accounts, no logins, no fuss.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Manage everything</h3>
                    <p className="text-gray-600">
                      Track patient payments, process instant refunds, and download detailed reports seamlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <img src="https://jbtxxlkhiubuzanegtzn.supabase.co/storage/v1/object/public/clinipaywebsiteimages//clinicinfopaymentscreen.png" alt="CliniPay Payment Form Preview" className="w-full max-h-[630px] object-contain animate-fade-in" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="py-16 px-6 md:px-8 bg-white" id="benefits">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">Why CliniPay</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Old-school payments are costing you bookings. CliniPay converts more patients and saves your team hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="text-white h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 gradient-text">Increased conversion rates</h3>
                <p className="text-gray-600">Branded, mobile-friendly payment pages beat clunky bank transfers every single time. They’re seamless, secure & super-easy to use  — which means fewer abandoned payments and more committed patients..</p>
              </div>
            </div>

            <div className="group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="text-white h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 gradient-text">Built-in trust</h3>
                <p className="text-gray-600">
                  Patients are more likely to pay when the process feels professional. CliniPay is backed by Stripe and your clinic's branding, giving patients instant peace of mind.
                </p>
              </div>
            </div>

            <div className="group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <PhoneOff className="text-white h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 gradient-text">No more chasing</h3>
                <p className="text-gray-600">
                  Forget taking card details over the phone or waiting on manual transfers. CliniPay handles it all — and keeps your team focused on patient care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get paid your way?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join clinics using CliniPay! 
 Reduce admin, increase uptake, and keep your patients happy.</p>
          <Button className="btn-gradient-outline text-lg py-6 px-8 rounded-full" asChild>
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-8 border-t">
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
              <Link to="/gdpr" className="text-gray-600 hover:text-gray-900">GDPR</Link>
            </div>
          </div>
          <div className="mt-6 text-center md:text-left text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CliniPay. All rights reserved.
          </div>
        </div>
      </footer>
    </MainLayout>;
};
export default HomePage;