
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-white to-gray-50">
      <div className="card-shadow w-full max-w-md bg-white rounded-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <Logo className="h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold gradient-text">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
