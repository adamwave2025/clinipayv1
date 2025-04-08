
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`${className} flex justify-center items-center`}>
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-[#ab53de] ${sizeClasses[size]}`}></div>
    </div>
  );
};

export default LoadingSpinner;
