
import { type ToastT } from "sonner";
import { toast } from "sonner";

export type Toast = ToastT;

export {
  toast,
  type ToastT,
};

export function useToast() {
  return {
    toast
  };
}
