import { useAuth } from "@/hooks/useAuth";
import { Coffee, Receipt, ShoppingBag, Palette, Package, BarChart3, Users, Settings, LogOut, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import Parse from "@/lib/parseClient";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    await Parse.User.logOut();
    queryClient.invalidateQueries({ queryKey: ["parseCurrentUser"] });
    onClose?.();
  };

  const parseUser = user as Parse.User | null | undefined;
  const displayName = parseUser
    ? (parseUser.get("firstName") && parseUser.get("lastName")
        ? `${parseUser.get("firstName")} ${parseUser.get("lastName")}`
        : parseUser.getUsername() || parseUser.get("email") || "User")
    : "User";
  const displayRole = parseUser?.get("role") || "Cashier";
  const profileImageUrl = parseUser?.get("profileImageUrl") || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face";

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["parsePendingOrderCount"],
    queryFn: async () => {
      const q = new Parse.Query("Order");
      q.containedIn("orderStatus", ["pending", "preparing"]);
      return q.count();
    },
    refetchInterval: 30000,
  });

  const { data: pendingArtworkCount = 0 } = useQuery({
    queryKey: ["parsePendingArtworkCount"],
    queryFn: async () => {
      const q = new Parse.Query("ArtworkSubmission");
      q.equalTo("status", "pending");
      return q.count();
    },
    refetchInterval: 60000,
  });

  const { data: lowStockCount = 0 } = useQuery({
    queryKey: ["parseLowStockCount"],
    queryFn: async () => {
      const q = new Parse.Query("InventoryItem");
      const results = await q.find();
      return results.filter((item) => {
        const current = parseFloat(item.get("currentStock") ?? 0);
        const min = parseFloat(item.get("minStockLevel") ?? 0);
        return current <= min;
      }).length;
    },
    refetchInterval: 60000,
  });

  const navigationItems = [
    { path: "/", icon: Coffee, label: "主頁", testId: "nav-dashboard", badge: 0 },
    { path: "/pos", icon: Receipt, label: "點餐系統", testId: "nav-pos", badge: 0 },
    { path: "/orders", icon: ShoppingBag, label: "訂單管理", testId: "nav-orders", badge: pendingCount },
    { path: "/products", icon: Coffee, label: "產品管理", testId: "nav-products", badge: 0 },
    { path: "/artists", icon: Palette, label: "藝術家與作品", testId: "nav-artists", badge: pendingArtworkCount },
    { path: "/inventory", icon: Package, label: "庫存管理", testId: "nav-inventory", badge: lowStockCount },
    { path: "/reports", icon: BarChart3, label: "報表分析", testId: "nav-reports", badge: 0 },
    { path: "/customers", icon: Users, label: "客戶管理", testId: "nav-customers", badge: 0 },
  ];

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:z-auto
      `}
    >
      {/* Logo and Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 coffee-gradient rounded-lg flex items-center justify-center">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">CaféArt POS</h1>
              <p className="text-sm text-muted-foreground">v2.1.0</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="關閉選單"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex items-center space-x-3">
          <img
            src={profileImageUrl}
            alt="User Profile"
            className="w-10 h-10 rounded-full border-2 border-primary/20"
          />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate" data-testid="text-user-name">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-user-role">
              {displayRole}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleNavClick}
                className={`sidebar-item flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'active bg-primary/15 text-primary border-l-3 border-primary'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
                {item.badge > 0 && (
                  <span className="ml-auto bg-accent text-accent-foreground text-xs rounded-full px-2 py-0.5 cart-badge">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="mt-6 pt-6 border-t border-border px-3">
          <Link
            href="/settings"
            onClick={handleNavClick}
            className="sidebar-item flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
            設定
          </Link>
          <button
            onClick={handleLogout}
            className="w-full sidebar-item flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            登出
          </button>
        </div>
      </nav>
    </aside>
  );
}
