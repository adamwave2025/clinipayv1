
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardTrendProps { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: 'up' | 'down' | 'none'; 
  trendValue?: string;
}

const StatCardTrend = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue 
}: StatCardTrendProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
            
            {trend !== 'none' && trendValue && (
              <div className="flex items-center mt-1">
                {trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-full bg-gradient-primary bg-opacity-10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCardTrend;
