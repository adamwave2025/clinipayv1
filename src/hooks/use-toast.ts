
import { toast as sonnerToast, Toaster } from 'sonner'

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  warning: (message: string) => sonnerToast.warning(message),
  info: (message: string) => sonnerToast.info(message),
  // Add the direct function version too with toast({title, description, variant})
  // This is to support the old usage pattern
  ...{
    // Define a default function for the base toast call
    default: (props: ToastProps) => {
      const { title, description, variant } = props;

      if (variant === 'destructive') {
        return sonnerToast.error(title || '', { description });
      }

      return sonnerToast(title || '', { description });
    }
  }
};

// Define the overloaded call signature to allow direct function calls
export const useToast = () => {
  return {
    toast,
  }
}

export { Toaster }
