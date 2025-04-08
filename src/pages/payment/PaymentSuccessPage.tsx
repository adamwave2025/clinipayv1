
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Logo from '@/components/common/Logo';

const PaymentSuccessPage = () => {
  // Mock payment details
  const paymentDetails = {
    amount: 75.00,
    clinic: 'Greenfield Medical Clinic',
    paymentType: 'Consultation Deposit',
    date: new Date().toLocaleDateString(),
    reference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
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
                <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-6 mb-6">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">
                  Your payment has been processed successfully. A confirmation email has been sent to your email address.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-500">Amount Paid</p>
                      <p className="font-bold">£{paymentDetails.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{paymentDetails.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Clinic</p>
                      <p className="font-medium">{paymentDetails.clinic}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Type</p>
                      <p className="font-medium">{paymentDetails.paymentType}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Reference</p>
                      <p className="font-medium">{paymentDetails.reference}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full btn-gradient">
                    Download Receipt
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.close()}>
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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

export default PaymentSuccessPage;
