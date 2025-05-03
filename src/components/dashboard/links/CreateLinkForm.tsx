
import React, { useState, useEffect } from 'react';
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
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import { PaymentLink } from '@/types/payment';

export interface LinkFormData {
  paymentTitle: string;
  amount: string;
  paymentType: string;
  description: string;
  paymentPlan: boolean;
  paymentCount: string;
  paymentCycle: string;
}

interface CreateLinkFormProps {
  onLinkGenerated: (link: string, formData: LinkFormData) => void;
  isLoading: boolean;
  onCreateLink?: (data: Omit<PaymentLink, 'id' | 'url' | 'createdAt' | 'isActive'>) => Promise<{ success: boolean, paymentLink?: PaymentLink, error?: string }>;
}

const CreateLinkForm = ({ onLinkGenerated, isLoading, onCreateLink }: CreateLinkFormProps) => {
  const [formData, setFormData] = useState<LinkFormData>({
    paymentTitle: '',
    amount: '',
    paymentType: 'deposit',
    description: '',
    paymentPlan: false,
    paymentCount: '',
    paymentCycle: 'monthly',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If payment type changes to "payment_plan", set paymentPlan to true
    if (name === 'paymentType' && value === 'payment_plan') {
      setFormData(prev => ({ ...prev, paymentPlan: true }));
    } else if (name === 'paymentType' && value !== 'payment_plan') {
      setFormData(prev => ({ ...prev, paymentPlan: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    // Additional validation for payment plan
    if (formData.paymentPlan) {
      if (!formData.paymentCount || isNaN(Number(formData.paymentCount)) || Number(formData.paymentCount) <= 0) {
        toast.error('Please enter a valid number of payments');
        return;
      }

      if (!formData.paymentCycle) {
        toast.error('Please select a payment cycle');
        return;
      }
    }
    
    if (onCreateLink) {
      // Use Supabase to create the link
      try {
        const paymentData = {
          title: formData.paymentTitle,
          amount: Number(formData.amount),
          type: formData.paymentType,
          description: formData.description,
          paymentPlan: formData.paymentPlan,
          paymentCount: formData.paymentPlan ? Number(formData.paymentCount) : undefined,
          paymentCycle: formData.paymentPlan ? formData.paymentCycle : undefined,
          planTotalAmount: formData.paymentPlan ? Number(formData.amount) * Number(formData.paymentCount) : undefined
        };
        
        const result = await onCreateLink(paymentData);
        
        if (result.success && result.paymentLink) {
          onLinkGenerated(result.paymentLink.url, formData);
        } else {
          toast.error(result.error || 'Failed to create payment link');
        }
      } catch (error: any) {
        console.error('Error creating payment link:', error);
        toast.error('An error occurred while creating the payment link');
      }
    } else {
      // Fallback to mock link generation for development
      setTimeout(() => {
        const uniqueId = Math.random().toString(36).substring(2, 10);
        const mockLink = `https://clinipay.com/pay/${uniqueId}`;
        onLinkGenerated(mockLink, formData);
      }, 1500);
    }
  };

  return (
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
            {formData.paymentPlan && (
              <p className="text-xs text-gray-500">
                This will be the amount per payment. Total plan value: 
                £{!isNaN(Number(formData.amount) * Number(formData.paymentCount)) 
                  ? (Number(formData.amount) * Number(formData.paymentCount)).toFixed(2) 
                  : '0.00'}
              </p>
            )}
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
                <SelectItem value="payment_plan">Payment Plan</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.paymentPlan && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentCount">Number of Payments*</Label>
                  <Input
                    id="paymentCount"
                    name="paymentCount"
                    type="number"
                    min="2"
                    placeholder="e.g., 3"
                    value={formData.paymentCount}
                    onChange={handleChange}
                    disabled={isLoading}
                    required={formData.paymentPlan}
                    className="w-full input-focus"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentCycle">Payment Frequency*</Label>
                  <Select
                    value={formData.paymentCycle}
                    onValueChange={(value) => handleSelectChange('paymentCycle', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="paymentCycle" className="input-focus">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
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
            {formData.paymentPlan ? 'Create Payment Plan' : 'Generate Payment Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateLinkForm;
