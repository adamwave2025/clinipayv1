import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
import { CreditCard, Check, Shield } from 'lucide-react';

const HomePage = () => {
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

      {/* Hero section */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="gradient-text">Trusted payments</span> for your clinic
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Reduce no-shows and streamline bookings with secure payment collection. CliniPay helps private clinics build trust with a professional payment experience.
          </p>
          <div className="flex justify-center">
            <Button className="btn-gradient rounded-full text-lg py-6 px-8" asChild>
              <Link to="/sign-up">Start collecting payments</Link>
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
              A simple, secure way to manage payments and reduce no-shows for your clinic
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg text-center">
              <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CreditCard className="text-white h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Create payment links</h3>
              <p className="text-gray-600">
                Generate custom payment links for consultations, treatments or deposits in just a few clicks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg text-center">
              <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Check className="text-white h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Collect payments</h3>
              <p className="text-gray-600">
                Patients pay through your branded payment page with no account needed - just card details.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl card-shadow transition-all duration-300 hover:scale-105 hover:shadow-lg text-center">
              <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Shield className="text-white h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Manage everything</h3>
              <p className="text-gray-600">
                Track payments, process refunds, and connect with your accounting system seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join clinics already using CliniPay to streamline their payment process and reduce no-shows.
          </p>
          <Button 
            className="bg-white text-white hover:!bg-white border border-gray-200 shadow-sm text-lg py-6 px-8 rounded-full" 
            asChild
          >
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

export default HomePage;
