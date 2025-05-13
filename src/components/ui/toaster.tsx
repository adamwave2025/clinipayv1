
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  // Since our implementation doesn't actually store toasts, we'll render nothing
  // in the original toast component but rely on the Sonner toaster
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
