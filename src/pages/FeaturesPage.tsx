import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
import { Check, LineChart, CreditCard, Calendar, BarChart3, ArrowRight, RefreshCcw, Users, Wallet, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const FeatureSection = ({
  title,
  description,
  benefits,
  visual,
  reversed = false
}: {
  title: string;
  description: string;
  benefits: string[];
  visual: React.ReactNode;
  reversed?: boolean;
}) => <div className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 py-16 border-b items-center`}>
    <div className="flex-1">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-lg mb-8 text-gray-600">{description}</p>
      
      <ul className="space-y-3">
        {benefits.map((benefit, index) => <li key={index} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            <span>{benefit}</span>
          </li>)}
      </ul>
    </div>
    <div className="flex-1 flex justify-center">
      {visual}
    </div>
  </div>;

// Payment Link Visual Mockup
const ReusableLinkVisual = () => <Card className="w-full max-w-lg shadow-lg border-0">
    <CardContent className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold gradient-text">Consultation Fee</h3>
          <p className="text-gray-600">Dr. Sarah Johnson</p>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-bold">£75.00</span>
          <span className="text-sm text-gray-500">Initial consultation</span>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between text-sm mb-2">
          <span>Link status:</span>
          <span className="font-semibold text-green-600">Active</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Created on:</span>
          <span className="font-semibold">12 May 2025</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
          <CreditCard className="w-4 h-4" />
          <span>Reusable</span>
        </div>
        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>Multiple patients</span>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
          <RefreshCcw className="w-4 h-4" />
          <span>Always available</span>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" className="flex gap-2 items-center">
          <Users className="h-4 w-4" /> 
          Patients
        </Button>
        <Button className="btn-gradient rounded-full flex gap-2 items-center">
          Share Link <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>;

// Payment Plan Visual Mockup
const PaymentPlanVisual = () => <Card className="w-full max-w-lg shadow-lg border-0">
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
          Request Payment
        </Button>
      </div>
    </CardContent>
  </Card>;

// Dashboard Analytics Visual Mockup
const DashboardVisual = () => <Card className="w-full max-w-lg shadow-lg border-0">
    <CardContent className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold">Performance Overview</h3>
        <div className="bg-gray-100 px-3 py-1 rounded-md text-sm">Last 30 days</div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-blue-700 text-sm font-medium">Total Payments</span>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2">£4,280.00</div>
          <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
            <ArrowRight className="h-3 w-3 transform rotate-45" />
            <span>+12.5% vs last month</span>
          </div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-purple-700 text-sm font-medium">Payment Plans</span>
            <Calendar className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold mt-2">14</div>
          <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
            <ArrowRight className="h-3 w-3 transform rotate-45" />
            <span>+2 new this month</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" className="flex gap-2 items-center">
          <LineChart className="h-4 w-4" />
          View Details
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Export Report
        </Button>
      </div>
    </CardContent>
  </Card>;

const FeaturesPage = () => {
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

      {/* Hero Section */}
      <section className="py-16 px-6 md:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Powerful, easy, effective,</span> features designed for clinic success
          </h1>
          <p className="text-xl text-gray-600 mb-8">Our intuitive platform offers all you need to streamline payments and reduce no-shows.</p>
          <Button size="lg" className="btn-gradient rounded-full text-lg py-6 px-8" asChild>
            <Link to="/sign-up">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-8">
        <FeatureSection title="Reusable Payment Links" description="Flexible, branded and reusable? These links were made for sharing — and paying, for everything from common services to appointments." benefits={["Create unlimited payment links for any service", "Share via email, SMS, or your website", "Track usage and conversion rates", "Customize payment amounts and descriptions", "Brand the payment experience with your clinic's logo", "Perfect for consultation fees, deposits, and common treatments"]} visual={<ReusableLinkVisual />} />

        <FeatureSection title="Flexible Payment Plans" description="Get the best, in bits: offer your patients the convenience of splitting larger payments into manageable installments. Improved affordability and better cash flow all in one go." benefits={["Create custom payment schedules for any treatment", "Set flexible installment amounts and timings", "Automated payment reminders to patients", "Real-time tracking of payment progress", "Easily manage plans with pause, reschedule, and cancellation options", "Improve cash flow and reduce payment friction"]} visual={<PaymentPlanVisual />} reversed />

        <FeatureSection title="Comprehensive Analytics" description="Keep your finger on the pulse: Gain valuable insights into your clinic's financial performance with our intuitive dashboard and reporting tools." benefits={["Real-time overview of all payments and plans", "Track key metrics like payment completion rates", "Monitor no-show reductions over time", "Identify your most popular services", "Export detailed reports for accounting purposes", "Make data-driven decisions to optimize your practice"]} visual={<DashboardVisual />} />
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 md:px-8 bg-gradient-to-r from-blue-50 to-purple-50 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to transform your practice?
          </h2>
          <p className="text-lg text-gray-600 mb-8">Join the clinics using CliniPay!
Reduce admin, streamline payments, and keep your patients happy.

        </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-gradient rounded-full" asChild>
              <Link to="/sign-up">Let's get paid!</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              
            </Button>
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

export default FeaturesPage;
