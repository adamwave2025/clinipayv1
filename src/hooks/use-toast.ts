
// Import toast directly from sonner to avoid circular dependencies
import { toast } from "sonner";

// Export the toast function
export { toast };

// Export a useToast function that returns the toast function for compatibility
export const useToast = () => {
  return { toast };
};
