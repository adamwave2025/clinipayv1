import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { isPaymentRoute } from '@/utils/routeUtils';

const CookieConsentBanner: React.FC = () => {
  const { showBanner, acceptCookies, rejectCookies } = useCookieConsent();
  const location = useLocation();

  // Don't show banner on payment pages
  if (isPaymentRoute(location.pathname)) {
    return null;
  }

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t shadow-lg">
      <Card className="max-w-6xl mx-auto border-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                We use cookies and similar technologies to help personalise content, tailor and measure ads, and provide a better experience. By clicking OK or turning an option on in Cookie Preferences, you agree to this, as outlined in our{' '}
                <Link 
                  to="/privacy" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  cookie Policy
                </Link>.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={rejectCookies}
                className="flex-1 md:flex-none"
              >
                Reject
              </Button>
              <Button
                onClick={acceptCookies}
                size="sm"
                className="btn-gradient flex-1 md:flex-none"
              >
                Allow All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsentBanner;
