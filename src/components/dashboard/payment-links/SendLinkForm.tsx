
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PatientCombobox from '@/components/dashboard/patients/PatientCombobox';
import { Patient } from '@/hooks/usePatients';
import { PaymentLink } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';

interface SendLinkFormProps {
  isLoading: boolean;
  paymentLinks: PaymentLink[];
  paymentPlans: PaymentLink[];
  isLoadingLinks: boolean;
  isPaymentPlan: boolean;
  formData: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    selectedLink: string;
    customAmount: string;
    message: string;
    startDate: Date;
  };
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onPatientSelect: (patient: Patient | null) => void;
  onCreateNew: (searchTerm: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SendLinkForm: React.FC<SendLinkFormProps> = ({
  isLoading,
  paymentLinks,
  paymentPlans,
  isLoadingLinks,
  isPaymentPlan,
  formData,
  onFormChange,
  onSelectChange,
  onDateChange,
  onPatientSelect,
  onCreateNew,
  onSubmit,
}) => {
  // Function to determine if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Create a new date object for today with time values set to 0
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set the time values of the input date to 0
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    // Return true if the date is before today
    return compareDate < today;
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="patientName">Patient Name*</Label>
        <PatientCombobox 
          onSelect={onPatientSelect}
          value={formData.patientName}
          onCreate={onCreateNew}
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
              onChange={onFormChange}
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
              onChange={onFormChange}
              disabled={isLoading}
              className="w-full input-focus pl-10"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="selectedLink">Select Payment (Optional)</Label>
          <Select
            value={formData.selectedLink}
            onValueChange={onSelectChange}
            disabled={isLoading || isLoadingLinks}
          >
            <SelectTrigger id="selectedLink" className="input-focus">
              <SelectValue placeholder={isLoadingLinks ? "Loading..." : "Choose a payment option"} />
            </SelectTrigger>
            <SelectContent>
              {paymentLinks.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Reusable Links</SelectLabel>
                  {paymentLinks.map(link => (
                    <SelectItem key={link.id} value={link.id}>
                      {link.title} - {formatCurrency(link.amount)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              
              {paymentPlans.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Payment Plans</SelectLabel>
                  {paymentPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title} - {formatCurrency(plan.amount)}{plan.paymentCount ? ` × ${plan.paymentCount}` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Select an existing payment option or enter a custom amount</p>
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
              onChange={onFormChange}
              disabled={isLoading || !!formData.selectedLink}
              className="w-full input-focus pl-8"
            />
          </div>
          <p className="text-xs text-gray-500">
            Enter a custom amount if not using an existing payment option
          </p>
        </div>
      </div>

      {isPaymentPlan && (
        <div className="space-y-2">
          <Label htmlFor="startDate">Payment Start Date*</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={onDateChange}
                disabled={isDateDisabled}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-500">
            This is when the first payment will be due
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="message">Custom Message (Optional)</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Add a personal message to your patient..."
          value={formData.message}
          onChange={onFormChange}
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
        {isPaymentPlan ? 'Schedule Payment Plan' : 'Send Payment Link'}
      </Button>
    </form>
  );
};

export default SendLinkForm;
