
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Lock } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PaymentForm, { PaymentFormValues } from '@/components/payment/PaymentForm';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Mock clinic and payment details
  const clinicDetails = {
    name: 'Greenfield Medical Clinic',
    logo: '',
    paymentType: 'Consultation Deposit',
    amount: 75.00,
  };

  const handlePaymentSubmit = (formData: PaymentFormValues) => {
    setIsLoading(true);
    
    // Mock payment processing
    setTimeout(() => {
      setIsLoading(false);
      navigate('/payment/success');
    }, 2000);
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
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  {clinicDetails.logo ? (
                    <img 
                      src={clinicDetails.logo} 
                      alt={clinicDetails.name} 
                      className="h-16 w-16 rounded-full" 
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                      {clinicDetails.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h1 className="text-xl font-bold">{clinicDetails.name}</h1>
                <div className="mt-4 bg-gray-50 py-3 px-4 rounded-lg">
                  <p className="text-gray-600">
                    {clinicDetails.paymentType}
                  </p>
                  <p className="text-2xl font-bold">
                    £{clinicDetails.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <PaymentForm 
                onSubmit={handlePaymentSubmit}
                isLoading={isLoading}
              />
              
              <div className="text-center text-sm text-gray-500 flex items-center justify-center mt-6">
                <Lock className="h-4 w-4 mr-1" />
                Secure payment processed by CliniPay
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8 text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Check className="h-4 w-4 text-green-500" />
              <span>Your payment is secure and encrypted</span>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <img src="https://cdn.gpteng.co/gptengineer.js/card-visa.svg" alt="Visa" className="h-6" />
              <img src="https://cdn.gpteng.co/gptengineer.js/card-mastercard.svg" alt="Mastercard" className="h-6" />
              <img src="https://cdn.gpteng.co/gptengineer.js/card-amex.svg" alt="American Express" className="h-6" />
            </div>
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

export default PatientPaymentPage;
