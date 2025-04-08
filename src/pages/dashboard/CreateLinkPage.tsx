
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Copy, Send, Check } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const CreateLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    paymentTitle: '',
    amount: '',
    paymentType: 'deposit',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.paymentTitle || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    
    // Mock link generation
    setTimeout(() => {
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const mockLink = `https://clinipay.com/pay/${uniqueId}`;
      
      setGeneratedLink(mockLink);
      setIsLoading(false);
      setShowConfirmation(true);
    }, 1500);
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied to clipboard');
    }
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setShowConfirmation(false);
    setFormData({
      paymentTitle: '',
      amount: '',
      paymentType: 'deposit',
      description: '',
    });
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Create Payment Link" 
        description="Generate a secure payment link to send to your patients"
      />
      
      <Card className="card-shadow max-w-2xl mx-auto">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="paymentTitle">Payment Title*</Label>
              <Input
                id="paymentTitle"
                name="paymentTitle"
                placeholder="e.g., Consultation Deposit"
                value={formData.paymentTitle}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full input-focus"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount*</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  £
                </span>
                <Input
                  id="amount"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full input-focus pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) => handleSelectChange('paymentType', value)}
                disabled={isLoading}
              >
                <SelectTrigger id="paymentType" className="input-focus">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter details about this payment..."
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full input-focus min-h-[120px]"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-gradient"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Generate Payment Link
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Check className="h-6 w-6 text-green-500 mr-2" />
              Payment Link Created
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 rounded-lg text-green-700 text-center">
              <p className="font-medium">Your payment link has been generated successfully!</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Payment Details:</p>
              <p className="text-sm">
                {formData.paymentTitle} - £{Number(formData.amount).toFixed(2)}
              </p>
              {formData.description && (
                <p className="text-sm text-gray-500 mt-1">{formData.description}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Payment Link:</p>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg break-all">
                <p className="text-sm text-gray-600 flex-1">{generatedLink}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCopyLink}
                  className="flex-shrink-0 ml-2"
                  aria-label="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="btn-gradient w-full" 
              asChild
            >
              <Link to="/dashboard/send-link" className="flex items-center justify-center">
                <Send className="mr-2 h-4 w-4" />
                Send Link
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CreateLinkPage;
