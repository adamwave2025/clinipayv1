
import { toast as sonnerToast, Toaster } from 'sonner'

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Create a function that can be called directly as toast()
const toastFunction = (props: ToastProps) => {
  const { title, description, variant } = props;

  if (variant === 'destructive') {
    return sonnerToast.error(title || '', { description });
  }

  return sonnerToast(title || '', { description });
};

// Create the toast object with methods and function behavior
export const toast = Object.assign(
  toastFunction,
  {
    success: (message: string) => sonnerToast.success(message),
    error: (message: string) => sonnerToast.error(message),
    warning: (message: string) => sonnerToast.warning(message),
    info: (message: string) => sonnerToast.info(message),
  }
);

// Define the useToast hook with toasts property for compatibility
export const useToast = () => {
  return {
    toast,
    toasts: [] // Empty array for compatibility with the toaster component
  }
}

export { Toaster }
