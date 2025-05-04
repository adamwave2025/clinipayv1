import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';

interface PaymentPlanFieldsProps {
  paymentCount: string;
  paymentCycle: string;
  amount: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  isLoading: boolean;
}

const PaymentPlanFields: React.FC<PaymentPlanFieldsProps> = ({
  paymentCount,
  paymentCycle,
  amount,
  onChange,
  onSelectChange,
  isLoading
}) => {
  // Calculate total amount properly handling decimal values
  const totalAmount = !isNaN(parseFloat(amount) * Number(paymentCount)) 
    ? parseFloat(amount) * Number(paymentCount) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="paymentCount">Number of Payments*</Label>
        <Input
          id="paymentCount"
          name="paymentCount"
          type="number"
          min="2"
          placeholder="e.g., 3"
          value={paymentCount}
          onChange={onChange}
          disabled={isLoading}
          required={true}
          className="w-full input-focus"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="paymentCycle">Payment Frequency*</Label>
        <Select
          value={paymentCycle}
          onValueChange={(value) => onSelectChange('paymentCycle', value)}
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
      
      <div className="col-span-1 md:col-span-2">
        <p className="text-xs text-gray-500">
          Total plan value: {formatCurrency(totalAmount)}
        </p>
      </div>
    </div>
  );
};

export default PaymentPlanFields;
