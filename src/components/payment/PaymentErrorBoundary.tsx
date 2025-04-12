
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentErrorBoundaryProps {
  children: React.ReactNode;
  errorMessage?: string | null;
  linkId?: string;
}

const PaymentErrorBoundary = ({ 
  children, 
  errorMessage, 
  linkId 
}: PaymentErrorBoundaryProps) => {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState<boolean>(!!errorMessage);

  useEffect(() => {
    if (hasError && !errorMessage) {
      // If we have an error state but no message, redirect to failed page
      navigate(`/payment/failed${linkId ? `?link_id=${linkId}` : ''}`);
    }
  }, [hasError, navigate, linkId, errorMessage]);

  if (errorMessage) {
    return (
      <>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/payment/failed')}
            className="text-blue-600 hover:underline"
          >
            Go to payment failed page
          </button>
        </div>
      </>
    );
  }

  return (
    <ErrorCatcher setHasError={setHasError} linkId={linkId}>
      {children}
    </ErrorCatcher>
  );
};

// Inner component to catch runtime errors
interface ErrorCatcherProps {
  children: React.ReactNode;
  setHasError: (hasError: boolean) => void;
  linkId?: string;
}

class ErrorCatcher extends React.Component<ErrorCatcherProps, { hasError: boolean }> {
  constructor(props: ErrorCatcherProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ErrorCatcherProps, prevState: { hasError: boolean }) {
    if (this.state.hasError && !prevState.hasError) {
      this.props.setHasError(true);
    }
  }

  render() {
    return this.props.children;
  }
}

export default PaymentErrorBoundary;
