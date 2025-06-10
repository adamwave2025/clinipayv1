import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
import { Check } from 'lucide-react';
import { usePlatformFee } from '@/hooks/useAdminSettings';
import LoadingSpinner from '@/components/common/LoadingSpinner';
const FeesPage = () => {
  const {
    platformFee,
    isLoading
  } = usePlatformFee();
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

      {/* Fees Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">One fee,</span> zero hassle
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Our fee structure is simple, transparent &amp; all-inclusive</p>
          </div>

          <Card className="w-full mx-auto shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-primary text-white text-center py-8">
              <CardTitle className="text-3xl font-bold">Simple. Flat. Transparent</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                {isLoading ? <div className="flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div> : <p className="text-5xl font-bold mb-2">{platformFee}%</p>}
                <p className="text-gray-500">per successful transaction</p>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-start">
                  <Check className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p>No monthly fees or setup costs - just setting you up for success 😎</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p>No charges for failed payments or refunds - we’re fair 😇</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p>Unlimited payment links &amp; patients - so you can grow with the flow 💸</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p>Fully branded payment experience - so put that pretty logo everywhere! ✨</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p>Access to all platform features - all the value, all the time 👌</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <p>Nothing else to pay - forget about other payment processing fees 💳</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 bg-gray-50 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4">It pays to use CliniPay</h2>
            <div className="space-y-4">
              <p>Our 3% transaction fee doesn’t just cover our awesome features – it includes everything you need to improve patient attendance and streamline your payment process:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Reduced no-shows through payment commitment</li>
                <li>Improved cash flow with secure pre-payments</li>
                <li>Professional, trusted payment experience for your patients</li>
                <li>Streamlined administrative processes and payment tracking</li>
                <li>All payment processing fees and infrastructure costs</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button className="btn-gradient rounded-full text-lg py-6 px-8" asChild>
              <Link to="/sign-up">Get Started Today</Link>
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
export default FeesPage;