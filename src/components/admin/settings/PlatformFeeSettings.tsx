
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Percent } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PlatformFeeSettings = ({ initialFee }: { initialFee: string }) => {
  const [platformFee, setPlatformFee] = useState(initialFee);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveFee = async () => {
    setIsSubmitting(true);
    try {
      // Check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('platform_settings')
        .select('id')
        .eq('key', 'platform_fee_percent')
        .single();
      
      let result;
      
      if (checkError && checkError.code === 'PGRST116') {
        // Record doesn't exist, create it
        result = await supabase
          .from('platform_settings')
          .insert({ 
            key: 'platform_fee_percent', 
            value: platformFee,
            description: 'Platform fee percentage charged on all transactions'
          });
      } else {
        // Record exists, update it
        result = await supabase
          .from('platform_settings')
          .update({ value: platformFee })
          .eq('key', 'platform_fee_percent');
      }
      
      if (result.error) throw result.error;
      
      toast.success(`Platform fee updated to ${platformFee}%`);
    } catch (error) {
      console.error('Error updating platform fee:', error);
      toast.error('Failed to update platform fee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle>Platform Fee</CardTitle>
        <CardDescription>
          Set the global percentage fee charged on all payments processed through CliniPay
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4 max-w-md">
          <div className="flex-1">
            <Label htmlFor="platform-fee">Fee Percentage</Label>
            <div className="relative mt-1">
              <Input
                id="platform-fee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                className="pr-10"
                disabled={isSubmitting}
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <Button onClick={handleSaveFee} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformFeeSettings;
