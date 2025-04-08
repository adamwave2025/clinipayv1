
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Logo from '@/components/common/Logo';

interface PaymentLayoutProps {
  children: React.ReactNode;
  cardClassName?: string;
}

const PaymentLayout = ({ children, cardClassName }: PaymentLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="py-6 px-4 border-b bg-white">
        <div className="max-w-xl mx-auto flex justify-center">
          <Logo className="h-8 w-auto" />
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-xl">
          <Card className={`card-shadow ${cardClassName || ''}`}>
            <CardContent className="p-6">
              {children}
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

export default PaymentLayout;
