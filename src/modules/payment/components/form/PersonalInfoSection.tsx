
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PaymentFormValues } from './FormSchema';
import PaymentSectionContainer from '../PaymentSectionContainer';

interface PersonalInfoSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
  showPhone?: boolean;
  defaultValues?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const PersonalInfoSection = ({ 
  control, 
  isLoading, 
  showPhone = true,
  defaultValues
}: PersonalInfoSectionProps) => {
  return (
    <PaymentSectionContainer title="Personal Information">
      <div className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your full name" 
                  disabled={isLoading} 
                  {...field} 
                  defaultValue={defaultValues?.name || field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="Enter your email address" 
                  disabled={isLoading} 
                  {...field} 
                  defaultValue={defaultValues?.email || field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPhone && (
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder="Enter your phone number" 
                    disabled={isLoading} 
                    {...field} 
                    defaultValue={defaultValues?.phone || field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </PaymentSectionContainer>
  );
};

export default PersonalInfoSection;
