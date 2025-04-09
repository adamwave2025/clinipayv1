
import React from 'react';
import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PaymentFormValues } from './FormSchema';

interface PersonalInfoSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const PersonalInfoSection = ({ control, isLoading }: PersonalInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Your Information</h2>
      
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input
                placeholder="John Smith"
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
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="you@example.com"
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
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input
                placeholder="+44 1234 567890"
                disabled={isLoading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PersonalInfoSection;
