
import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  secondaryText?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  secondaryText, 
  trend, 
  className = '' 
}: StatCardProps) => {
  return (
    <Card className={`card-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {secondaryText && (
              <span className={`text-xs font-medium ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 
                'text-gray-500'
              }`}>
                {secondaryText}
              </span>
            )}
          </div>
          <div className="bg-gradient-primary p-2 rounded-full h-10 w-10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
