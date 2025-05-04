
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'white' | 'primary' | string;
}

const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  color = 'white'
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  // Handle predefined color options or use custom color
  let borderColor = '';
  if (color === 'white') {
    borderColor = 'border-white';
  } else if (color === 'primary') {
    borderColor = 'border-[#ab53de]';
  } else {
    borderColor = `border-[${color}]`;
  }

  return (
    <div className={`${className} flex justify-center items-center`}>
      <div className={`animate-spin rounded-full border-t-2 border-b-2 ${borderColor} ${sizeClasses[size]}`}></div>
    </div>
  );
};

export default LoadingSpinner;
