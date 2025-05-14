
// Import from sonner - which only exports toast, not useToast
import { toast } from "sonner";

// Re-export the toast utility
export { toast };

// Export a useToast function that returns the toast function for compatibility
export const useToast = () => {
  return { toast };
};
