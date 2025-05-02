
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`${className}`}>
      <img 
        src="https://jbtxxlkhiubuzanegtzn.supabase.co/storage/v1/object/public/clinipaywebsiteimages//logo1.png" 
        alt="CliniPay Logo" 
        className="h-full w-auto max-h-10" 
      />
    </div>
  );
};

export default Logo;
