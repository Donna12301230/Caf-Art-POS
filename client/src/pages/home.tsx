import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Palette, ShoppingCart, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data: dailyRevenue } = useQuery({
    queryKey: ['/api/analytics/daily-revenue'],
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
  });

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening at your café today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-daily-revenue">
                ${parseFloat(dailyRevenue?.revenue || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12.5% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-daily-orders">47</div>
              <p className="text-xs text-muted-foreground">
                +8% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Artists</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-artists">12</div>
              <p className="text-xs text-muted-foreground">
                +2 new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive" data-testid="text-low-stock">
                {Array.isArray(lowStockItems) ? lowStockItems.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/pos'}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 coffee-gradient rounded-lg flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Point of Sale</CardTitle>
                  <p className="text-sm text-muted-foreground">Process orders and payments</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/orders'}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Order Management</CardTitle>
                  <p className="text-sm text-muted-foreground">View and manage orders</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/artists'}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary/50 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Artist Management</CardTitle>
                  <p className="text-sm text-muted-foreground">Manage artists and artwork</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Recent Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">#1847</p>
                    <p className="text-sm text-muted-foreground">Signature Latte, Cappuccino x2</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$16.76</p>
                    <p className="text-sm text-green-600">Completed</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">#1846</p>
                    <p className="text-sm text-muted-foreground">Cold Brew, Croissant</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$8.75</p>
                    <p className="text-sm text-amber-600">Preparing</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">#1845</p>
                    <p className="text-sm text-muted-foreground">Matcha Latte, Art Print</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$28.25</p>
                    <p className="text-sm text-green-600">Completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Top Artists This Month</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b882?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face" 
                    alt="Maya Chen" 
                    className="w-10 h-10 rounded-full" 
                  />
                  <div className="flex-1">
                    <p className="font-medium">Maya Chen</p>
                    <p className="text-sm text-muted-foreground">23 artworks sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">$1,247</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face" 
                    alt="Luna Kim" 
                    className="w-10 h-10 rounded-full" 
                  />
                  <div className="flex-1">
                    <p className="font-medium">Luna Kim</p>
                    <p className="text-sm text-muted-foreground">31 artworks sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">$1,408</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face" 
                    alt="David Rodriguez" 
                    className="w-10 h-10 rounded-full" 
                  />
                  <div className="flex-1">
                    <p className="font-medium">David Rodriguez</p>
                    <p className="text-sm text-muted-foreground">18 artworks sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">$892</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
