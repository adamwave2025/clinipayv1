
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
import { CreditCard, Check, Shield, TrendingUp, ShieldCheck, PhoneOff, LinkIcon } from 'lucide-react';

const FeaturesPage = () => {
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

      {/* Features Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful <span className="gradient-text">features</span> for modern clinics
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage payments and reduce no-shows
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Payment links that work</h2>
              <p className="text-lg text-gray-600">
                Create professional, branded payment links that patients can pay instantly with card or Apple Pay. No accounts, no logins, no fuss.
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Create one-time or reusable links</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Customize with your clinic's branding</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Send links via email or text</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Track payments in real-time</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl p-6 card-shadow max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-semibold text-xl">Consultation Fee</h4>
                  <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    Active
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">£75.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Link type</span>
                    <span className="font-medium">Reusable</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">10 May 2025</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600">
                    https://clinipay.co/pay/cnst75
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <span>Copy</span>
                  </Button>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10">
                <LinkIcon className="text-white h-6 w-6" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <img 
                src="https://jbtxxlkhiubuzanegtzn.supabase.co/storage/v1/object/public/clinipaywebsiteimages//analytics-dashboard.png" 
                alt="CliniPay Analytics Dashboard" 
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-bold mb-6">Track everything in one place</h2>
              <p className="text-lg text-gray-600">
                Access comprehensive reports and analytics to gain insights into your clinic's payment activity.
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Monitor payment statuses</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Track payment performance</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Generate reports for accounting</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Export data in multiple formats</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Flexible payment plans</h2>
              <p className="text-lg text-gray-600">
                Create customized payment plans for patients who need to split costs over time.
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Design custom installment schedules</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Automate payment reminders</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Track payments progress</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Pause, resume or adjust plans as needed</p>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://jbtxxlkhiubuzanegtzn.supabase.co/storage/v1/object/public/clinipaywebsiteimages//payment-plans-interface.png" 
                alt="CliniPay Payment Plans Interface" 
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to simplify your clinic payments?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join clinics using CliniPay to streamline their payment process and reduce no-shows.
          </p>
          <Button 
            className="btn-gradient-outline text-lg py-6 px-8 rounded-full" 
            asChild
          >
            <Link to="/sign-up">Start your free trial</Link>
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

export default FeaturesPage;
