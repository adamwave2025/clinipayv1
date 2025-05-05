
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PaymentPlanFields from './PaymentPlanFields';
import { LinkFormData } from '@/hooks/useCreateLinkForm';

interface LinkFormFieldsProps {
  formData: LinkFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  isLoading: boolean;
}

const LinkFormFields: React.FC<LinkFormFieldsProps> = ({
  formData,
  onChange,
  onSelectChange,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="paymentTitle">Payment Title*</Label>
        <Input
          id="paymentTitle"
          name="paymentTitle"
          placeholder="e.g., Consultation Deposit"
          value={formData.paymentTitle}
          onChange={onChange}
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
            onChange={onChange}
            disabled={isLoading}
            required
            className="w-full input-focus pl-8"
          />
        </div>
        {formData.paymentPlan && (
          <p className="text-xs text-gray-500">
            This will be the amount per payment.
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="paymentType">Payment Type</Label>
        <Select
          value={formData.paymentType}
          onValueChange={(value) => onSelectChange('paymentType', value)}
          disabled={isLoading}
        >
          <SelectTrigger id="paymentType" className="input-focus">
            <SelectValue placeholder="Select payment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Recurring Payments</SelectLabel>
              <SelectItem value="payment_plan">Payment Plan</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Reusable Links</SelectLabel>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {formData.paymentPlan && (
        <PaymentPlanFields
          paymentCount={formData.paymentCount}
          paymentCycle={formData.paymentCycle}
          amount={formData.amount}
          onChange={onChange}
          onSelectChange={onSelectChange}
          isLoading={isLoading}
        />
      )}
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Enter details about this payment..."
          value={formData.description}
          onChange={onChange}
          disabled={isLoading}
          className="w-full input-focus min-h-[120px]"
        />
      </div>
    </div>
  );
};

export default LinkFormFields;
