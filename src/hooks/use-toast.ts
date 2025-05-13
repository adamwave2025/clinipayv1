
import { toast as sonnerToast, type ToastT } from 'sonner';

// Re-export the sonner toast
export const toast = sonnerToast;

// Define a consistent interface for the toast hook
export function useToast() {
  // Empty toasts array to satisfy the Toaster component's needs
  const toasts: ToastT[] = [];
  
  return {
    toast,
    toasts
  };
}
