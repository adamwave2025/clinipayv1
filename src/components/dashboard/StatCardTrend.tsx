
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardTrendProps { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
}

const StatCardTrend = ({ 
  title, 
  value, 
  icon
}: StatCardTrendProps) => {
  return (
    <Card className="card-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
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
