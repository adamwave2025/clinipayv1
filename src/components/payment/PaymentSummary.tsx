
import React from 'react';

interface PaymentSummaryProps {
  clinic: {
    name: string;
    logo: string;
  };
  paymentType: string;
  amount: number;
}

const PaymentSummary = ({ clinic, paymentType, amount }: PaymentSummaryProps) => {
  return (
    <div className="text-center mb-8">
      <div className="mb-4 flex justify-center">
        {clinic.logo ? (
          <img 
            src={clinic.logo} 
            alt={clinic.name} 
            className="h-16 w-16 rounded-full" 
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
            {clinic.name.charAt(0)}
          </div>
        )}
      </div>
      <h1 className="text-xl font-bold">{clinic.name}</h1>
      <div className="mt-4 bg-gray-50 py-3 px-4 rounded-lg">
        <p className="text-gray-600">
          {paymentType}
        </p>
        <p className="text-2xl font-bold">
          £{amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default PaymentSummary;
