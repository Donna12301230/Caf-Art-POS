import { Link, useLocation } from "wouter";
import { ShoppingCart, User, ClipboardList, Store, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Parse from "@/lib/parseClient";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { user, isVendor, isAdmin } = useAuth();
  const { count } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: () => Parse.User.logOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "登出失敗", description: err.message });
    },
  });

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-primary text-lg">
          <span className="text-2xl">🍱</span>
          <span className="hidden sm:block">嘉大便當預訂</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-1">
          {/* Cart */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/cart")} className="relative">
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                {count}
              </Badge>
            )}
          </Button>

          {/* My orders */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/my-orders")}>
            <ClipboardList className="w-5 h-5" />
            <span className="hidden sm:inline ml-1 text-sm">我的訂單</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-sm max-w-[80px] truncate">
                  {user?.displayName || user?.username}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="w-4 h-4 mr-2" /> 會員中心
              </DropdownMenuItem>
              {(isVendor || isAdmin) && (
                <>
                  <DropdownMenuSeparator />
                  {isVendor && (
                    <DropdownMenuItem onClick={() => navigate("/vendor-portal")}>
                      <Store className="w-4 h-4 mr-2" /> 廠商後台
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin/vendors")}>
                      <Store className="w-4 h-4 mr-2" /> 管理後台
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {!isVendor && !isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/vendor-apply")}>
                    <Store className="w-4 h-4 mr-2" /> 申請成為廠商
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" /> 登出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
