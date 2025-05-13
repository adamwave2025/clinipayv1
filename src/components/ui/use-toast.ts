
// We're re-exporting toast from sonner directly to avoid creating circular dependencies
import { useToast as useOriginalToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export { useOriginalToast as useToast, toast };
