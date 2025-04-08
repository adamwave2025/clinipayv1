
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`font-bold ${className}`}>
      <span className="gradient-text text-xl">Clini</span>
      <span className="text-black text-xl">Pay</span>
    </div>
  );
};

export default Logo;
