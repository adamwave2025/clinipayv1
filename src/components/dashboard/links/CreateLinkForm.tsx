
import React, { useState } from 'react';
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

export interface LinkFormData {
  paymentTitle: string;
  amount: string;
  paymentType: string;
  description: string;
}

interface CreateLinkFormProps {
  onLinkGenerated: (link: string, formData: LinkFormData) => void;
  isLoading: boolean;
}

const CreateLinkForm = ({ onLinkGenerated, isLoading }: CreateLinkFormProps) => {
  const [formData, setFormData] = useState<LinkFormData>({
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
    
    // Mock link generation
    setTimeout(() => {
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const mockLink = `https://clinipay.com/pay/${uniqueId}`;
      
      onLinkGenerated(mockLink, formData);
    }, 1500);
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
  );
};

export default CreateLinkForm;
