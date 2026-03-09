import { useQuery } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import type { UserProfile } from "@/types";

export function useAuth() {
  const { data: parseUser, isLoading } = useQuery({
    queryKey: ["parseCurrentUser"],
    queryFn: () => Parse.User.currentAsync(),
    retry: false,
  });

  const user: UserProfile | null = parseUser
    ? {
        id: parseUser.id,
        username: parseUser.get("username"),
        email: parseUser.get("email"),
        displayName: parseUser.get("displayName"),
        phone: parseUser.get("phone"),
        studentId: parseUser.get("studentId"),
        department: parseUser.get("department"),
        role: parseUser.get("role") ?? "customer",
      }
    : null;

  return {
    user,
    parseUser,
    isLoading,
    isAuthenticated: !!parseUser,
    isVendor: user?.role === "vendor",
    isAdmin: user?.role === "admin",
    isCustomer: !user || user.role === "customer",
  };
}
