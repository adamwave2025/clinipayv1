
import { toast as sonnerToast, ToastT, useToaster } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

// Create a custom useToast hook that provides the toast functionality
export const useToast = () => {
  const { toasts } = useToaster();
  return { toasts };
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
