
import { toast as sonnerToast, Toaster, Toast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

// Create a custom useToast hook that provides the toast functionality
// Since sonner doesn't export useToaster, we'll create a minimal implementation
export const useToast = () => {
  // Return an empty toasts array since we're using the direct toast function
  return { 
    toasts: [] as Toast[] 
  };
};

export const toast = {
  success: (message: string, options?: Omit<ToastProps, "variant">) => {
    console.log("🟢 Toast Success:", message);
    return sonnerToast.success(options?.title || "Success", {
      description: message,
      ...options
    });
  },
  error: (message: string, options?: Omit<ToastProps, "variant">) => {
    console.log("🔴 Toast Error:", message);
    return sonnerToast.error(options?.title || "Error", {
      description: message,
      ...options
    });
  },
  info: (message: string, options?: Omit<ToastProps, "variant">) => {
    console.log("🔵 Toast Info:", message);
    return sonnerToast.info(options?.title || "Info", {
      description: message,
      ...options
    });
  },
  warning: (message: string, options?: Omit<ToastProps, "variant">) => {
    console.log("🟠 Toast Warning:", message);
    return sonnerToast.warning(options?.title || "Warning", {
      description: message,
      ...options
    });
  }
};
