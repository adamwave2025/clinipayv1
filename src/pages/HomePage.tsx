import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
import { CreditCard, Check, Shield, TrendingUp, ShieldCheck, PhoneOff, Calendar, Wallet, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Payment Plan Visual Mockup
const PaymentPlanVisual = () => (
  <Card className="w-full max-w-lg shadow-lg border-0">
    <CardContent className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold gradient-text">Orthodontic Treatment</h3>
          <p className="text-gray-600">James Wilson</p>
        </div>
        <div className="text-right">
          <span className="block text-lg font-bold text-gray-600">£1,200.00 total</span>
          <span className="text-sm text-green-600">£400.00 paid</span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>33% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{
            width: "33%"
          }}></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-600 mb-1">Next payment</div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>June 15, 2025</span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-600 mb-1">Installment</div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-500" />
            <span>£400.00</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>2 of 3 installments remaining</span>
        </div>
        <Button className="btn-gradient rounded-full">
          Take Payment
        </Button>
      </div>
    </CardContent>
  </Card>
);

const HomePage = () => {
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

      {/* Hero section */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="gradient-text">Clinic friendly</span> payment solutions
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
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Paid & simple: discover a reliable way to manage your payments</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Create</h3>
                    <p className="text-gray-600">Generate your own branded links for treatments, consultations, or deposits in just a few clicks – secure, reusable, professional.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Collect</h3>
                    <p className="text-gray-600">Offer instant pay to your patients: no accounts, no logins, no fuss. Just a card or Apple Pay and they're good to go.</p>
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
                    <p className="text-gray-600">You get your very own clinic dashboard: track patient payments, process instant refunds, and download detailed reports seamlessly. </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <PaymentPlanVisual />
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
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Clunky bank transfers &amp; awkward phone payments are keeping you back. CliniPay is taking you forward: convert more patients, save more hours &amp; get paid on time, every time</p>
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
                <p className="text-gray-600">Patients need peace of mind and a no-stress process: and that’s what CliniPay offers. A professional, frictionless way to secure payments – backed by Stripe and covered in your clinic’s branding.</p>
              </div>
            </div>

            <div className="group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <PhoneOff className="text-white h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 gradient-text">No more chasing</h3>
                <p className="text-gray-600">Taking card details over the phone or waiting on manual transfers are a thing of the past. CliniPay is all about the future: you’ve got all the awkward admin sorted, so your team can finally focus on what matters most: patient care.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get paid your way?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join clinics using CliniPay! Reduce admin, increase uptake, and keep your patients happy.</p>
          <Button className="btn-gradient-outline text-lg py-6 px-8 rounded-full" asChild>
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-8 border-t">
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
export default HomePage;
