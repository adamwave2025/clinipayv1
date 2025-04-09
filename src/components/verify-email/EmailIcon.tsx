
import React from 'react';
import { Mail } from 'lucide-react';

export const EmailIcon: React.FC = () => {
  return (
    <div className="flex justify-center my-8">
      <div className="bg-blue-50 rounded-full p-6">
        <Mail className="h-12 w-12 text-blue-500" />
      </div>
    </div>
  );
};
