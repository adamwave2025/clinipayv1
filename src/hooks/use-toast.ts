
import { toast as sonnerToast, type ToastT } from 'sonner';

// Re-export the sonner toast
export const toast = sonnerToast;

// For backward compatibility with shadcn/ui toast
// This creates a compatibility layer that mimics the shadcn/ui toast API
export function useToast() {
  // For compatibility with the shadcn/ui toast API which expects a toasts array
  // We provide an empty array as this is not used with sonner
  return {
    toast: sonnerToast,
    toasts: [] as ToastT[], // Add the toasts property as an empty array
    dismiss: (toastId?: string | number) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      }
    },
  };
}
