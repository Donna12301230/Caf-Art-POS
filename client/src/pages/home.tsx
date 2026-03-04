import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Palette, ShoppingCart, TrendingUp, AlertTriangle, Users, Receipt, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object) => ({ id: obj.id, ...obj.attributes });

export default function Home() {
  const { data: todaysOrders } = useQuery({
    queryKey: ["parseTodaysOrders"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const q = new Parse.Query("Order");
      q.greaterThanOrEqualTo("createdAt", today);
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["parseLowStockItems"],
    queryFn: async () => {
      const q = new Parse.Query("InventoryItem");
      const results = await q.find();
      const items = results.map(toPlain);
      return items.filter((item: any) =>
        parseFloat(item.currentStock) <= parseFloat(item.minStockLevel)
      );
    },
  });

  const { data: artists } = useQuery({
    queryKey: ["parseArtistsCount"],
    queryFn: async () => {
      const q = new Parse.Query("Artist");
      q.equalTo("status", "approved");
      return q.count();
    },
  });

  const dailyRevenue = Array.isArray(todaysOrders)
    ? todaysOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total || 0), 0)
    : 0;
  const ordersToday = Array.isArray(todaysOrders) ? todaysOrders.length : 0;
  const lowStockCount = Array.isArray(lowStockItems) ? lowStockItems.length : 0;

  const stats = [
    { label: '今日營收', value: `$${dailyRevenue.toFixed(0)}`, sub: '+12.5%', icon: TrendingUp, color: 'text-green-600', testId: 'text-daily-revenue' },
    { label: '今日訂單', value: ordersToday, sub: '+8%', icon: ShoppingCart, color: 'text-blue-600', testId: 'text-daily-orders' },
    { label: '合作藝術家', value: artists ?? 0, sub: '本月+2', icon: Palette, color: 'text-purple-600', testId: 'text-active-artists' },
    { label: '低庫存', value: lowStockCount, sub: '需關注', icon: AlertTriangle, color: lowStockCount > 0 ? 'text-destructive' : 'text-green-600', testId: 'text-low-stock' },
  ];

  const quickActions = [
    { href: '/pos', icon: Coffee, label: '點餐', color: 'coffee-gradient text-white' },
    { href: '/orders', icon: Receipt, label: '訂單', color: 'bg-accent/10 text-accent' },
    { href: '/products', icon: Package, label: '產品', color: 'bg-primary/10 text-primary' },
    { href: '/artists', icon: Palette, label: '藝術家', color: 'bg-secondary/50 text-secondary-foreground' },
    { href: '/inventory', icon: Package, label: '庫存', color: 'bg-orange-100 text-orange-600' },
    { href: '/customers', icon: Users, label: '客戶', color: 'bg-pink-100 text-pink-600' },
  ];

  return (
    <Layout>
      <div className="p-2 md:p-6">
        {/* Header — compact on mobile */}
        <div className="mb-3 md:mb-8">
          <h1 className="text-lg md:text-3xl font-bold text-foreground">主頁</h1>
          <p className="text-xs md:text-base text-muted-foreground">今日咖啡店狀況</p>
        </div>

        {/* Stats — 2x2 compact grid on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-3 md:mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="overflow-hidden">
                {/* Mobile: ultra-compact */}
                <div className="flex items-center p-2 md:hidden">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted mr-2 flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">{stat.label}</p>
                    <p className={`text-lg font-bold leading-tight ${stat.color}`} data-testid={stat.testId}>
                      {stat.value}
                    </p>
                  </div>
                </div>
                {/* Desktop: normal */}
                <CardHeader className="hidden md:flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent className="hidden md:block">
                  <div className="text-2xl font-bold" data-testid={stat.testId}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions — 3x2 icon grid on mobile */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3 md:mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="flex flex-col items-center justify-center p-2 md:p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer active:scale-95">
                  <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-1 md:mb-2 ${action.color}`}>
                    <Icon className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  <span className="text-[11px] md:text-sm font-medium text-foreground text-center">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent orders + artists — stacked on mobile, side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">
          <Card>
            <CardHeader className="py-2 px-3 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>最近訂單</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {Array.isArray(todaysOrders) && todaysOrders.length > 0 ? (
                todaysOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 hover:bg-muted/30">
                    <div>
                      <p className="text-xs font-medium">#{order.orderNumber}</p>
                      <p className="text-[10px] text-muted-foreground">{order.orderType || '內用'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">${parseFloat(order.total || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-green-600">{order.orderStatus}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4">今日無訂單</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2 px-3 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>本月最佳藝術家</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                { name: 'Maya Chen', sold: 23, revenue: 1247, img: 'https://images.unsplash.com/photo-1494790108755-2616b612b882?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face' },
                { name: 'Luna Kim', sold: 31, revenue: 1408, img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face' },
              ].map((artist) => (
                <div key={artist.name} className="flex items-center px-3 py-2 border-b border-border last:border-0 hover:bg-muted/30">
                  <img src={artist.img} alt={artist.name} className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{artist.name}</p>
                    <p className="text-[10px] text-muted-foreground">已售 {artist.sold} 件</p>
                  </div>
                  <p className="text-xs font-semibold text-green-600">${artist.revenue.toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
