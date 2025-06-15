
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const HelpSettings = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Base Section */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <HelpCircle className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-medium">Knowledge Base</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Learn how to use CliniPay effectively with our comprehensive resources.
          </p>

          {/* FAQ Section */}
          <h4 className="font-medium mb-3">Frequently Asked Questions</h4>
          <div className="space-y-3 mb-6">
            {/* FAQ Item 1 */}
            <Collapsible
              open={openFaq === 'faq1'}
              onOpenChange={() => toggleFaq('faq1')}
              className="border rounded-md"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium">
                <span>How do I connect my Stripe account?</span>
                {openFaq === 'faq1' ? 
                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0 text-sm text-gray-600 border-t">
                <p>
                  To connect your Stripe account, go to Settings &gt; Payments and click on the 
                  "Connect Stripe" button. You'll be guided through the Stripe onboarding process 
                  to link your account to CliniPay.
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* FAQ Item 2 */}
            <Collapsible
              open={openFaq === 'faq2'}
              onOpenChange={() => toggleFaq('faq2')}
              className="border rounded-md"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium">
                <span>How are platform fees calculated?</span>
                {openFaq === 'faq2' ? 
                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0 text-sm text-gray-600 border-t">
                <p>
                  Platform fees are calculated as a percentage of the transaction amount. For detailed information, please see our 
                  <a href="#" className="text-primary hover:underline ml-1">Fees page</a>.
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* FAQ Item 3 */}
            <Collapsible
              open={openFaq === 'faq3'}
              onOpenChange={() => toggleFaq('faq3')}
              className="border rounded-md"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium">
                <span>How do I process a refund?</span>
                {openFaq === 'faq3' ? 
                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0 text-sm text-gray-600 border-t">
                <p>
                  To process a refund, navigate to Payment History, find the payment you want to refund, 
                  click on the options menu, and select "Refund". You can choose between a full refund 
                  or a partial refund.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-medium">Book a Support Call</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Need personalized assistance? Book a call with our support team to help solve your issues.
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h4 className="font-medium mb-1">Schedule a 30-minute consultation</h4>
              <p className="text-sm text-gray-600 mb-4 md:mb-0">
                Our team will help you with any questions or issues you're experiencing.
              </p>
            </div>
            <Button 
              className="bg-gradient-primary hover:bg-primary/90 flex items-center gap-2"
              onClick={() => window.open('https://api.leadconnectorhq.com/widget/booking/G8Z0dGlpeKfEqFBQIJy7', '_blank')}
            >
              <Calendar className="h-4 w-4" />
              Book a Call
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="text-center">
            <h4 className="font-medium mb-2">Need immediate help?</h4>
            <p className="text-sm text-gray-500 mb-4">
              Contact our support team directly via email.
            </p>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.open('mailto:support@clinipay.com', '_self')}
              >
                support@clinipay.com
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpSettings;
