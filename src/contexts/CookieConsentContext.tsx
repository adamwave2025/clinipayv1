
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CookieConsentContextType {
  hasConsent: boolean | null;
  acceptCookies: () => void;
  rejectCookies: () => void;
  showBanner: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

interface CookieConsentProviderProps {
  children: ReactNode;
}

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({ children }) => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookie-consent');
    if (storedConsent) {
      setHasConsent(storedConsent === 'accepted');
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    setHasConsent(true);
    setShowBanner(false);
    localStorage.setItem('cookie-consent', 'accepted');
    
    // Trigger Meta pixel initialization
    window.dispatchEvent(new CustomEvent('cookiesAccepted'));
  };

  const rejectCookies = () => {
    setHasConsent(false);
    setShowBanner(false);
    localStorage.setItem('cookie-consent', 'rejected');
  };

  return (
    <CookieConsentContext.Provider value={{
      hasConsent,
      acceptCookies,
      rejectCookies,
      showBanner
    }}>
      {children}
    </CookieConsentContext.Provider>
  );
};
