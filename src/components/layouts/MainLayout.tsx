
import React from 'react';
import { Toaster } from "@/components/ui/sonner";
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import MetaPixel from '@/components/common/MetaPixel';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <CookieConsentProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-50">
        <Toaster position="top-right" />
        <main className="flex-1">
          {children}
        </main>
        <CookieConsentBanner />
        <MetaPixel />
      </div>
    </CookieConsentProvider>
  );
};

export default MainLayout;
