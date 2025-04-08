
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, RefreshCcw } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useNavigate } from 'react-router-dom';

const PaymentFailedPage = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    // Go back to the payment page
    navigate('/payment');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="py-6 px-4 border-b bg-white">
        <div className="max-w-xl mx-auto flex justify-center">
          <Logo className="h-8 w-auto" />
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-xl">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-6 mb-6">
                  <X className="h-12 w-12 text-red-600" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-6">
                  Your payment could not be processed. Please check your payment details and try again.
                </p>
                
                <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium text-red-800 mb-2">Possible reasons:</h3>
                  <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
                    <li>Insufficient funds in your account</li>
                    <li>Card details entered incorrectly</li>
                    <li>Card has expired or been cancelled</li>
                    <li>Transaction was declined by your bank</li>
                    <li>Temporary issue with payment processor</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full btn-gradient" onClick={handleTryAgain}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.close()}>
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              If you continue to experience issues, please contact the clinic directly.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="py-4 px-4 border-t bg-white">
        <div className="max-w-xl mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} CliniPay. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PaymentFailedPage;
