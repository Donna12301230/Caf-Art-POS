import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useQueryWithToast<T>(
  options: UseQueryOptions<T> & {
    errorTitle?: string;
    errorDescription?: string;
    showErrorToast?: boolean;
  }
) {
  const { toast } = useToast();
  const {
    errorTitle = "Error",
    errorDescription = "Failed to load data. Please try again.",
    showErrorToast = true,
    ...queryOptions
  } = options;

  const query = useQuery<T>(queryOptions);

  useEffect(() => {
    if (query.error && showErrorToast) {
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    }
  }, [query.error, errorTitle, errorDescription, showErrorToast, toast]);

  return query;
}