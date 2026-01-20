import { toast } from "@/components/ui/use-toast";
import { getErrorDescription, getErrorMessage } from "@/lib/errors";

export const notifyError = (error: unknown, fallback?: string) => {
  const title = getErrorMessage(error, fallback ?? "Something went wrong");
  const description = getErrorDescription(error);
  console.error("[notifyError]", { error, title, description });
  toast({
    title,
    description,
    variant: "destructive",
  });
};

export const notifySuccess = (title: string, description?: string) => {
  toast({
    title,
    description,
  });
};

