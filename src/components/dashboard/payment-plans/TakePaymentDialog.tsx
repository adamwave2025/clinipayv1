
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import PaymentForm from '@/components/payment/PaymentForm';
import { useInstallmentPayment } from '@/hooks/payment-plans/useInstallmentPayment';
import { formatCurrency } from '@/utils/formatters';
import { AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import StripeProvider from '@/components/payment/StripeProvider';

interface TakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  onPaymentProcessed: () => Promise<void>;
  // Optional props that can be provided if available
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  amount?: number;
}

const TakePaymentDialog: React.FC<TakePaymentDialogProps> = ({
  open,
  onOpenChange,
  paymentId,
  onPaymentProcessed,
  patientName: initialPatientName,
  patientEmail: initialPatientEmail,
  patientPhone: initialPatientPhone,
  amount: initialAmount
}) => {
  // State for payment processing
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // State for payment data
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState(initialPatientName || '');
  const [patientEmail, setPatientEmail] = useState(initialPatientEmail || '');
  const [patientPhone, setPatientPhone] = useState(initialPatientPhone || '');
  const [amount, setAmount] = useState<number | undefined>(initialAmount);
  const [hasValidId, setHasValidId] = useState(false);
  const [validatedPaymentId, setValidatedPaymentId] = useState<string | null>(null);

  // Log all props for debugging as soon as component mounts
  useEffect(() => {
    console.log("TakePaymentDialog - Constructor Props:", {
      open,
      paymentId: typeof paymentId === 'string' ? paymentId : 'NOT A STRING',
      paymentIdLength: typeof paymentId === 'string' ? paymentId.length : 'N/A',
      hasInitialAmount: Boolean(initialAmount),
      initialAmount,
      hasInitialName: Boolean(initialPatientName),
      initialPatientName
    });
    
    // Immediate ID validation
    validatePaymentId(paymentId);
  }, []);

  // Function to validate payment ID
  const validatePaymentId = (id: string) => {
    console.log("TakePaymentDialog - Validating paymentId:", id);
    console.log("  - Type:", typeof id);
    console.log("  - Length:", id ? id.length : 'undefined');
    console.log("  - Content:", id || 'empty');
    
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error("TakePaymentDialog - CRITICAL ERROR: Invalid or empty payment ID");
      setDataError("No valid payment ID provided. Cannot process payment.");
      setHasValidId(false);
      setValidatedPaymentId(null);
      toast.error("Missing payment ID");
      return false;
    } 
    
    // Valid ID found - trim and store
    const trimmedId = id.trim();
    console.log("TakePaymentDialog - Valid payment ID confirmed:", trimmedId);
    setHasValidId(true);
    setValidatedPaymentId(trimmedId);
    setDataError(null);
    return true;
  };

  // Effect to validate payment ID whenever props change
  useEffect(() => {
    if (open) {
      const isValid = validatePaymentId(paymentId);
      if (!isValid) {
        // If ID isn't valid, close the dialog after a short delay to show the error
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    }
  }, [paymentId, open]);

  // Effect to load payment data when dialog opens and we have a valid ID
  useEffect(() => {
    if (open && hasValidId) {
      // Only load data if we don't already have it
      if (!initialAmount || !initialPatientName) {
        console.log("TakePaymentDialog - No pre-loaded data, loading payment data for ID:", validatedPaymentId);
        loadPaymentData();
      } else {
        console.log("TakePaymentDialog - Using provided data:", {
          name: initialPatientName,
          email: initialPatientEmail,
          amount: initialAmount
        });
      }
    }
  }, [open, hasValidId, initialAmount, initialPatientName, validatedPaymentId]);

  // Function to load payment data
  const loadPaymentData = async () => {
    if (!validatedPaymentId) {
      console.error("TakePaymentDialog - Cannot load payment data: Missing payment ID");
      setDataError("Cannot load payment data: Missing payment ID");
      return;
    }
    
    setIsLoadingData(true);
    setDataError(null);
    
    try {
      // Here we would typically fetch payment data from the API
      // For now, we'll simulate this with a timeout
      console.log('Loading payment data for ID:', validatedPaymentId);
      
      // In a real implementation, this would be an API call to get installment details
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // This is where you would fetch actual data
      // For now, we'll use dummy values if none were provided
      if (!patientName) setPatientName('Patient Name');
      if (!patientEmail) setPatientEmail('patient@example.com');
      if (!patientPhone) setPatientPhone('');
      if (!amount) setAmount(1000); // $10.00
      
      setIsLoadingData(false);
      
      console.log("TakePaymentDialog - Payment data loaded:", {
        patientName: patientName || 'Patient Name',
        amount: amount || 1000
      });
    } catch (error) {
      console.error('Error loading payment data:', error);
      setDataError('Failed to load payment details. Please try again.');
      setIsLoadingData(false);
    }
  };

  // The inner component wrapped by StripeProvider
  const PaymentDialogContent = () => {
    // We need to ensure we always have a valid paymentId and amount before using useInstallmentPayment
    if (!validatedPaymentId) {
      return (
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unable to Process Payment</AlertTitle>
            <AlertDescription>
              A valid payment ID is required to process this payment. 
              Please try again or contact support.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              variant="default"
            >
              Close
            </Button>
          </div>
        </div>
      );
    }
    
    const validAmount = amount || 0;

    console.log("PaymentDialogContent - Rendering with:", {
      hasValidId,
      validatedPaymentId,
      validAmount
    });

    const {
      isProcessing,
      isLoading,
      isStripeReady,
      handlePaymentSubmit,
    } = useInstallmentPayment(validatedPaymentId, validAmount, onPaymentProcessed);

    // Prepare default values for the payment form
    const defaultValues: Partial<PaymentFormValues> = {
      name: patientName || '',
      email: patientEmail || '',
      phone: patientPhone || '',
    };

    const handlePaymentFormSubmit = async (formData: PaymentFormValues) => {
      try {
        if (!validatedPaymentId) {
          throw new Error("Cannot process payment: Missing payment ID");
        }
        
        if (!amount || amount <= 0) {
          throw new Error(`Cannot process payment: Invalid amount ${amount}`);
        }
        
        console.log("PaymentDialogContent - Submitting payment form with valid ID:", validatedPaymentId);
        const result = await handlePaymentSubmit(formData);
        
        if (result.success) {
          setPaymentSuccess(true);
          setPaymentError(null);
          console.log("PaymentDialogContent - Payment submission succeeded");
        } else {
          setPaymentError(result.error || 'Payment processing failed');
          setPaymentSuccess(false);
          console.error("PaymentDialogContent - Payment submission failed:", result.error);
        }
      } catch (error: any) {
        console.error('Payment submission error:', error);
        setPaymentError(error.message || 'An unexpected error occurred');
        setPaymentSuccess(false);
      }
    };

    // Format amount for display
    const displayAmount = React.useMemo(() => {
      if (!amount) return "Loading...";
      try {
        return formatCurrency(amount);
      } catch (error) {
        console.error("Error formatting amount:", error);
        return "Invalid amount";
      }
    }, [amount]);

    // Render the data loading state
    if (isLoadingData) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      );
    }

    // Render if there was an error loading data
    if (dataError) {
      return (
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unable to Load Payment Information</AlertTitle>
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              variant="default"
            >
              Close
            </Button>
            <Button 
              onClick={loadPaymentData}
              variant="outline"
              className="ml-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (!isStripeReady) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-gray-600">Loading payment system...</p>
        </div>
      );
    }

    if (paymentSuccess) {
      return (
        <div className="p-6 space-y-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-medium text-green-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Payment Successful
            </h3>
            <p className="mt-2 text-green-700">
              Payment of {displayAmount} has been successfully processed for {patientName}.
            </p>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              Close
            </Button>
          </div>
        </div>
      );
    }
    
    if (paymentError) {
      return (
        <div className="p-6 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setPaymentError(null);
              }}
            >
              Try Again
            </Button>
            <Button 
              onClick={() => onOpenChange(false)}
              variant="default"
            >
              Close
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Processing payment for:</p>
          <p className="font-medium">{patientName}</p>
          <p className="text-sm text-gray-600 mb-1 mt-2">Amount:</p>
          <p className="text-lg font-bold">{displayAmount}</p>
          <p className="text-xs text-gray-500 mt-1">Payment ID: {validatedPaymentId}</p>
        </div>
        
        <PaymentForm 
          onSubmit={handlePaymentFormSubmit}
          isLoading={isProcessing || isLoading}
          amount={amount || 0}
          defaultValues={defaultValues}
        />
      </div>
    );
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Small delay to prevent flickering during close animation
      setTimeout(() => {
        setPaymentSuccess(false);
        setPaymentError(null);
        setDataError(null);
      }, 300);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        
        {/* Wrap the content with Stripe Provider */}
        <StripeProvider>
          <PaymentDialogContent />
        </StripeProvider>
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
