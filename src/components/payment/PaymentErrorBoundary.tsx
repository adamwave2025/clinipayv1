
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
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);

  useEffect(() => {
    // Only set hasError if we have an explicit error message
    if (errorMessage) {
      setHasError(true);
      // Give a delay before considering redirect to avoid immediate jumps
      const timer = setTimeout(() => setShouldRedirect(true), 500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    // Only redirect if we have both hasError AND shouldRedirect flags
    if (hasError && shouldRedirect && !errorMessage) {
      console.log('PaymentErrorBoundary: Redirecting to failed page due to error state');
      navigate(`/payment/failed${linkId ? `?link_id=${linkId}` : ''}`);
    }
  }, [hasError, shouldRedirect, navigate, linkId, errorMessage]);

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
      console.log('ErrorCatcher: Error detected in payment component');
      this.props.setHasError(true);
    }
  }

  render() {
    return this.props.children;
  }
}

export default PaymentErrorBoundary;
