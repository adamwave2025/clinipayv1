
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PaymentFormValues } from './FormSchema';
import PaymentSectionContainer from '../PaymentSectionContainer';

interface PersonalInfoSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const PersonalInfoSection = ({ control, isLoading }: PersonalInfoSectionProps) => {
  return (
    <PaymentSectionContainer title="Your Information">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="John Smith" 
                  className="h-11 text-base" 
                  disabled={isLoading}
                  {...field}
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
              <FormLabel className="text-base font-medium">Email Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="email@example.com" 
                  type="email" 
                  className="h-11 text-base"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+44 7700 900000" 
                  type="tel"
                  className="h-11 text-base" 
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </PaymentSectionContainer>
  );
};

export default PersonalInfoSection;
