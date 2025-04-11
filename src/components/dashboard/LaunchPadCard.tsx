
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Rocket, X } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';

interface LaunchPadTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface LaunchPadCardProps {
  stripeConnected: boolean;
}

const LaunchPadCard = ({ stripeConnected }: LaunchPadCardProps) => {
  const [visible, setVisible] = useState(true);
  const { paymentLinks } = usePaymentLinks();
  
  // Check if the card has been dismissed before
  useEffect(() => {
    const launchPadDismissed = localStorage.getItem('launchPadDismissed');
    if (launchPadDismissed === 'true') {
      setVisible(false);
    }
  }, []);

  // Determine if they've sent a payment link (for now we'll just check if they have links)
  const hasPaymentLinks = paymentLinks.length > 0;
  
  // Task completion states
  const tasks: LaunchPadTask[] = [
    {
      id: 'connect-stripe',
      title: 'Connect Stripe',
      description: 'Set up your Stripe account to start accepting payments',
      completed: stripeConnected,
    },
    {
      id: 'create-link',
      title: 'Create your first payment link',
      description: 'Create a payment link to share with patients',
      completed: hasPaymentLinks,
    },
    {
      id: 'send-link',
      title: 'Send your first payment link',
      description: 'Share your payment link with a patient',
      completed: false, // This would need more complex logic to determine
    },
  ];

  const dismissCard = () => {
    localStorage.setItem('launchPadDismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Card className="mb-6 overflow-hidden border-0 card-shadow">
      <div className="bg-gradient-primary text-white p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Rocket className="h-7 w-7 mr-3" />
            <div>
              <h3 className="text-xl font-bold">Launch Pad</h3>
              <p className="text-white/80 text-sm mt-1">Complete these steps to get started with CliniPay</p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/90 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Dismiss Launch Pad?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to dismiss the Launch Pad? You can access these steps from the Help section later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={dismissCard}>Dismiss</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="mt-5 space-y-4">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex items-start">
              <div className="flex h-5 items-center mr-3">
                <Checkbox 
                  id={task.id} 
                  checked={task.completed} 
                  disabled 
                  className={`${task.completed ? 'bg-white text-primary border-white' : 'border-white/50'}`}
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor={task.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {index + 1}. {task.title}
                </label>
                <p className="text-xs text-white/70 mt-1">{task.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LaunchPadCard;
