
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';

const AboutPage = () => {
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

      {/* About Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            About <span className="gradient-text">CliniPay</span>
          </h1>
          
          <div className="space-y-8 text-lg">
            <p>
              CliniPay was founded with a simple mission: to help private healthcare providers reduce no-shows and streamline their payment processes while building trust with patients.
            </p>
            
            <p>
              We understand the unique challenges faced by clinics and practitioners. That's why we've created a platform that seamlessly handles payments, ensuring that your focus remains on what matters most—providing excellent care to your patients.
            </p>
            
            <h2 className="text-2xl font-bold mt-12 mb-4">Our Vision</h2>
            <p>
              To be the trusted payment platform for healthcare providers worldwide, improving operational efficiency and patient commitment through secure, transparent payment processes.
            </p>
            
            <h2 className="text-2xl font-bold mt-12 mb-4">Why Choose CliniPay?</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Reduced No-Shows:</strong> When patients commit with a deposit, they're significantly more likely to attend appointments.
              </li>
              <li>
                <strong>Trusted Platform:</strong> Our secure, professional payment experience builds confidence with your patients.
              </li>
              <li>
                <strong>Streamlined Operations:</strong> Manage all payments in one place, saving you time and reducing administrative burden.
              </li>
              <li>
                <strong>Simple Integration:</strong> No complex setup or technical knowledge required—start accepting payments in minutes.
              </li>
            </ul>
          </div>
          
          <div className="mt-12 text-center">
            <Button className="btn-gradient rounded-full text-lg py-6 px-8" asChild>
              <Link to="/sign-up">Join CliniPay Today</Link>
            </Button>
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

export default AboutPage;
