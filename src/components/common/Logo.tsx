
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  to?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "", to }) => {
  const logoImage = (
    <img 
      src="https://jbtxxlkhiubuzanegtzn.supabase.co/storage/v1/object/public/clinipaywebsiteimages//logo1.png" 
      alt="CliniPay Logo" 
      className="h-full w-auto max-h-10" 
    />
  );

  if (to) {
    return (
      <Link to={to} className={`${className}`}>
        {logoImage}
      </Link>
    );
  }

  return (
    <div className={`${className}`}>
      {logoImage}
    </div>
  );
};

export default Logo;
