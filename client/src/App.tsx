import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import VendorDetail from "@/pages/vendor-detail";
import Cart from "@/pages/cart";
import MyOrders from "@/pages/my-orders";
import Profile from "@/pages/profile";
import VendorRegister from "@/pages/vendor/register";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorMenu from "@/pages/vendor/menu";
import VendorOrders from "@/pages/vendor/orders";
import VendorSettings from "@/pages/vendor/settings";
import AdminVendors from "@/pages/admin/vendors";
import PublicMenu from "@/pages/menu";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, isVendor, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* 公開路由（不需登入）*/}
      <Route path="/menu/:vendorId" component={PublicMenu} />

      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Customer routes */}
          <Route path="/" component={Home} />
          <Route path="/vendor/:id" component={VendorDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/my-orders" component={MyOrders} />
          <Route path="/profile" component={Profile} />

          {/* Vendor portal */}
          <Route path="/vendor-apply" component={VendorRegister} />
          {isVendor && (
            <>
              <Route path="/vendor-portal" component={VendorDashboard} />
              <Route path="/vendor-portal/menu" component={VendorMenu} />
              <Route path="/vendor-portal/orders" component={VendorOrders} />
              <Route path="/vendor-portal/settings" component={VendorSettings} />
            </>
          )}

          {/* Admin */}
          {isAdmin && (
            <Route path="/admin/vendors" component={AdminVendors} />
          )}
        </>
      )}
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
