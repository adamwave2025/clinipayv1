
import { toast as sonnerToast } from 'sonner';

// Re-export the sonner toast
export const toast = sonnerToast;

// For backward compatibility
export function useToast() {
  return {
    toast: sonnerToast
  };
}
