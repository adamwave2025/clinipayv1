
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
import { Mail, Phone, CheckCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  url: string;
}

const SendLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    selectedLink: '',
    customAmount: '',
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
    if (!formData.patientName || !formData.patientEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate either selectedLink or customAmount is filled
    if (!formData.selectedLink && !formData.customAmount) {
      toast.error('Please either select a payment link or enter a custom amount');
      return;
    }
    
    // Custom amount validation
    if (formData.customAmount && (isNaN(Number(formData.customAmount)) || Number(formData.customAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.patientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Phone validation (if provided)
    if (formData.patientPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.patientPhone)) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }
    
    // Show confirmation dialog instead of proceeding directly
    setShowConfirmation(true);
  };

  const sendPaymentLink = () => {
    setIsLoading(true);
    
    // Mock sending email
    setTimeout(() => {
      setIsLoading(false);
      setShowConfirmation(false);
      
      toast.success('Payment link sent successfully');
      
      // Reset form
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        selectedLink: '',
        customAmount: '',
        message: '',
      });
    }, 1500);
  };

  // Find the selected payment link for the preview
  const selectedPaymentLink = formData.selectedLink 
    ? paymentLinks.find(link => link.id === formData.selectedLink) 
    : null;
  
  // Determine the payment amount for the preview
  const paymentAmount = selectedPaymentLink 
    ? `£${selectedPaymentLink.amount.toFixed(2)}` 
    : (formData.customAmount ? `£${Number(formData.customAmount).toFixed(2)}` : '');

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Patient Email*</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="patientEmail"
                    name="patientEmail"
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.patientEmail}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="w-full input-focus pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patientPhone">Patient Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="patientPhone"
                    name="patientPhone"
                    type="tel"
                    placeholder="+44 7700 900000"
                    value={formData.patientPhone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full input-focus pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectedLink">Select Payment Link (Optional)</Label>
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
                <p className="text-xs text-gray-500">Select an existing payment link or enter a custom amount</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customAmount">Custom Amount (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                  <Input
                    id="customAmount"
                    name="customAmount"
                    type="text"
                    placeholder="0.00"
                    value={formData.customAmount}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full input-focus pl-8"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter a custom amount if not using an existing payment link
                </p>
              </div>
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              Confirm Payment Link Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Recipient:</p>
              <p className="text-sm">{formData.patientName}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Send to:</p>
              <p className="text-sm">
                Email: {formData.patientEmail}
                {formData.patientPhone && <span> | Phone: {formData.patientPhone}</span>}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Payment Details:</p>
              <p className="text-sm">
                {selectedPaymentLink ? (
                  <>Payment for: {selectedPaymentLink.title} ({paymentAmount})</>
                ) : (
                  <>Custom payment amount: {paymentAmount}</>
                )}
              </p>
            </div>
            
            {formData.message && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Custom Message:</p>
                <p className="text-sm">{formData.message}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendPaymentLink}
              disabled={isLoading}
              className="btn-gradient"
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Send Payment Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SendLinkPage;
