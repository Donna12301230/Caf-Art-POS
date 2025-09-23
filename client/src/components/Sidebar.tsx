import { useAuth } from "@/hooks/useAuth";
import { Coffee, Receipt, ShoppingBag, Palette, Package, BarChart3, Users, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navigationItems = [
    { path: "/", icon: Coffee, label: "Dashboard", testId: "nav-dashboard" },
    { path: "/pos", icon: Receipt, label: "Point of Sale", testId: "nav-pos" },
    { path: "/orders", icon: ShoppingBag, label: "Orders", testId: "nav-orders" },
    { path: "/products", icon: Coffee, label: "Products", testId: "nav-products" },
    { path: "/artists", icon: Palette, label: "Artists & Artwork", testId: "nav-artists" },
    { path: "/inventory", icon: Package, label: "Inventory", testId: "nav-inventory" },
    { path: "/reports", icon: BarChart3, label: "Reports", testId: "nav-reports" },
    { path: "/customers", icon: Users, label: "Customers", testId: "nav-customers" },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo and Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 coffee-gradient rounded-lg flex items-center justify-center">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">CaféArt POS</h1>
            <p className="text-sm text-muted-foreground">v2.1.0</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex items-center space-x-3">
          <img 
            src={(user && typeof user === 'object' && 'profileImageUrl' in user ? user.profileImageUrl as string : '') || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"} 
            alt="User Profile" 
            className="w-10 h-10 rounded-full border-2 border-primary/20" 
          />
          <div>
            <p className="font-medium text-sm" data-testid="text-user-name">
              {(user && typeof user === 'object' && 'firstName' in user && 'lastName' in user && user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user && typeof user === 'object' && 'email' in user ? user.email : null) || 'User'}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-user-role">
              {(user && typeof user === 'object' && 'role' in user ? user.role : null) || 'Cashier'}
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
              <Link key={item.path} href={item.path}>
                <a 
                  className={`sidebar-item flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'active bg-primary/15 text-primary border-l-3 border-primary' 
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                  {item.path === "/orders" && (
                    <span className="ml-auto bg-accent text-accent-foreground text-xs rounded-full px-2 py-0.5 cart-badge">
                      3
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="mt-6 pt-6 border-t border-border px-3">
          <Link href="/settings">
            <a className="sidebar-item flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </a>
          </Link>
          <button 
            onClick={() => window.location.href = '/api/logout'}
            className="w-full sidebar-item flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
