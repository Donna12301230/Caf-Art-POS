import { useQuery } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["parseCurrentUser"],
    queryFn: () => Parse.User.currentAsync(),
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
