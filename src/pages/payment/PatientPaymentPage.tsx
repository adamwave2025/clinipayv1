
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Check, Lock } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  // Mock clinic and payment details
  const clinicDetails = {
    name: 'Greenfield Medical Clinic',
    logo: '',
    paymentType: 'Consultation Deposit',
    amount: 75.00,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }
    
    // Format expiry date with slash
    if (name === 'cardExpiry') {
      let formatted = value.replace(/\//g, '');
      if (formatted.length > 2) {
        formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || 
        !formData.cardNumber || !formData.cardExpiry || !formData.cardCvc) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Card validation (basic)
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      toast.error('Please enter a valid card number');
      return;
    }
    
    if (formData.cardCvc.length < 3) {
      toast.error('Please enter a valid CVC');
      return;
    }
    
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
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Your Information</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="w-full input-focus"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="w-full input-focus"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+44 1234 567890"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="w-full input-focus"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Payment Details</h2>
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      maxLength={19}
                      disabled={isLoading}
                      required
                      className="w-full input-focus"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Expiry Date</Label>
                      <Input
                        id="cardExpiry"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={handleChange}
                        maxLength={5}
                        disabled={isLoading}
                        required
                        className="w-full input-focus"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardCvc">CVC</Label>
                      <Input
                        id="cardCvc"
                        name="cardCvc"
                        placeholder="123"
                        value={formData.cardCvc}
                        onChange={handleChange}
                        maxLength={4}
                        disabled={isLoading}
                        required
                        className="w-full input-focus"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 btn-gradient text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Pay £{clinicDetails.amount.toFixed(2)}
                </Button>
                
                <div className="text-center text-sm text-gray-500 flex items-center justify-center">
                  <Lock className="h-4 w-4 mr-1" />
                  Secure payment processed by CliniPay
                </div>
              </form>
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
