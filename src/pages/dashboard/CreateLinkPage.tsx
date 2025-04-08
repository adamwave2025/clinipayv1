
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
import { Copy, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const CreateLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    paymentTitle: '',
    amount: '',
    currency: 'GBP',
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
      toast.success('Payment link created successfully');
    }, 1500);
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Create Payment Link" 
        description="Generate a secure payment link to send to your patients"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="card-shadow">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount*</Label>
                    <Input
                      id="amount"
                      name="amount"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="w-full input-focus"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleSelectChange('currency', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="currency" className="input-focus">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
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
        </div>
        
        {/* Preview / Generated link */}
        <div>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Payment Link</h3>
              
              {generatedLink ? (
                <div className="space-y-4">
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
                  
                  <div className="flex flex-col gap-3">
                    <Button className="btn-gradient w-full" asChild>
                      <a href="/dashboard/send-link" className="flex items-center justify-center">
                        Send via Email
                      </a>
                    </Button>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <a 
                        href={generatedLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        Preview
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Your generated payment link will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateLinkPage;
