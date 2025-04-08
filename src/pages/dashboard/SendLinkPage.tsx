
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  url: string;
}

const SendLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    selectedLink: '',
    message: '',
  });

  // Mock data for existing payment links
  const paymentLinks: PaymentLink[] = [
    { id: '1', title: 'Consultation Deposit', amount: 50, type: 'deposit', url: 'https://clinipay.com/pay/abc123' },
    { id: '2', title: 'Full Treatment', amount: 200, type: 'treatment', url: 'https://clinipay.com/pay/def456' },
    { id: '3', title: 'Follow-up Session', amount: 75, type: 'consultation', url: 'https://clinipay.com/pay/ghi789' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, selectedLink: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.patientName || !formData.patientEmail || !formData.selectedLink) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.patientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    // Mock sending email
    setTimeout(() => {
      setIsLoading(false);
      
      toast.success('Payment link sent successfully');
      
      // Reset form
      setFormData({
        patientName: '',
        patientEmail: '',
        selectedLink: '',
        message: '',
      });
    }, 1500);
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Send Payment Link" 
        description="Email a payment link directly to your patient"
      />
      
      <Card className="card-shadow max-w-2xl mx-auto">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name*</Label>
              <Input
                id="patientName"
                name="patientName"
                placeholder="Enter patient name"
                value={formData.patientName}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full input-focus"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patientEmail">Patient Email*</Label>
              <Input
                id="patientEmail"
                name="patientEmail"
                type="email"
                placeholder="patient@example.com"
                value={formData.patientEmail}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full input-focus"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="selectedLink">Select Payment Link*</Label>
              <Select
                value={formData.selectedLink}
                onValueChange={handleSelectChange}
                disabled={isLoading}
              >
                <SelectTrigger id="selectedLink" className="input-focus">
                  <SelectValue placeholder="Choose a payment link" />
                </SelectTrigger>
                <SelectContent>
                  {paymentLinks.map(link => (
                    <SelectItem key={link.id} value={link.id}>
                      {link.title} - £{link.amount.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Add a personal message to your patient..."
                value={formData.message}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full input-focus min-h-[120px]"
              />
              <p className="text-sm text-gray-500">
                This message will be included in the email along with the payment link.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Email Preview</h4>
              <div className="text-sm text-blue-600">
                <p>Subject: Payment request from {formData.patientName ? formData.patientName + "'s" : "your"} clinic</p>
                <p className="mt-1">
                  Recipients: {formData.patientEmail || 'patient@example.com'}
                </p>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-gradient"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Send Payment Link
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default SendLinkPage;
