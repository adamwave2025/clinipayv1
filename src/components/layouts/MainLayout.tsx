
import React from 'react';
import { Toaster } from "@/components/ui/sonner";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-50">
      <Toaster position="top-right" />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
