
import React from 'react';

interface CustomMessageSectionProps {
  message: string | undefined;
}

const CustomMessageSection = ({ message }: CustomMessageSectionProps) => {
  if (!message) return null;
  
  return (
    <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
      <h4 className="text-sm font-medium text-blue-700 mb-2">Message to Patient</h4>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};

export default CustomMessageSection;
