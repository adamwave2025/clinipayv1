
// Import toast from the shadcn implementation
import { useToast as useShadcnToast, toast as shadcnToast } from "@/components/ui/use-toast";

// Re-export the shadcn toast utilities
export const useToast = useShadcnToast;
export const toast = shadcnToast;
