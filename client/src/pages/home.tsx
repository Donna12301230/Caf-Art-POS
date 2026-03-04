import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Palette, ShoppingCart, TrendingUp, AlertTriangle, Users, Receipt, Package, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object) => ({ id: obj.id, ...obj.attributes });

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: "完成",   color: "bg-green-100 text-green-800" },
  preparing: { label: "備餐中", color: "bg-amber-100 text-amber-800" },
  pending:   { label: "待處理", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "取消",   color: "bg-red-100 text-red-800" },
};

export default function Home() {
  const { data: todaysOrders } = useQuery({
    queryKey: ["parseTodaysOrders"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const q = new Parse.Query("Order");
      q.greaterThanOrEqualTo("createdAt", today);
      q.descending("createdAt");
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

  const { data: artistCount } = useQuery({
    queryKey: ["parseArtistsCount"],
    queryFn: async () => {
      const q = new Parse.Query("Artist");
      q.equalTo("status", "approved");
      return q.count();
    },
  });

  const { data: topArtists } = useQuery({
    queryKey: ["parseTopArtists"],
    queryFn: async () => {
      const q = new Parse.Query("Artist");
      q.equalTo("status", "approved");
      q.descending("totalSales");
      q.limit(3);
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ["parsePendingOrders"],
    queryFn: async () => {
      const q = new Parse.Query("Order");
      q.containedIn("orderStatus", ["pending", "preparing"]);
      return q.count();
    },
    refetchInterval: 30000,
  });

  const dailyRevenue = Array.isArray(todaysOrders)
    ? todaysOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total || 0), 0)
    : 0;
  const ordersToday   = Array.isArray(todaysOrders) ? todaysOrders.length : 0;
  const lowStockCount = Array.isArray(lowStockItems) ? lowStockItems.length : 0;
  const pendingCount  = pendingOrders ?? 0;

  const stats = [
    {
      label: '今日營收', value: `$${dailyRevenue.toFixed(0)}`,
      sub: ordersToday > 0 ? `共 ${ordersToday} 筆訂單` : '今日尚無訂單',
      icon: TrendingUp, color: 'text-green-600', testId: 'text-daily-revenue',
    },
    {
      label: '今日訂單', value: ordersToday,
      sub: pendingCount > 0 ? `${pendingCount} 筆待處理` : '全部已完成',
      icon: ShoppingCart, color: 'text-blue-600', testId: 'text-daily-orders',
    },
    {
      label: '合作藝術家', value: artistCount ?? 0,
      sub: '已核准合作',
      icon: Palette, color: 'text-purple-600', testId: 'text-active-artists',
    },
    {
      label: '低庫存警示', value: lowStockCount,
      sub: lowStockCount > 0 ? '需立即補貨' : '庫存狀態正常',
      icon: AlertTriangle,
      color: lowStockCount > 0 ? 'text-destructive' : 'text-green-600',
      testId: 'text-low-stock',
    },
  ];

  const quickActions = [
    { href: '/pos',       icon: Coffee,    label: '點餐',   color: 'coffee-gradient text-white' },
    { href: '/orders',    icon: Receipt,   label: '訂單',   color: 'bg-accent/10 text-accent' },
    { href: '/products',  icon: Package,   label: '產品',   color: 'bg-primary/10 text-primary' },
    { href: '/artists',   icon: Palette,   label: '藝術家', color: 'bg-secondary/50 text-secondary-foreground' },
    { href: '/inventory', icon: BarChart3, label: '庫存',   color: 'bg-orange-100 text-orange-600' },
    { href: '/customers', icon: Users,     label: '客戶',   color: 'bg-pink-100 text-pink-600' },
  ];

  return (
    <Layout>
      <div className="p-2 md:p-6">
        {/* Header */}
        <div className="mb-3 md:mb-6">
          <h1 className="text-lg md:text-3xl font-bold text-foreground">主頁</h1>
          <p className="text-xs md:text-base text-muted-foreground">今日咖啡店狀況</p>
        </div>

        {/* 待處理訂單警示 */}
        {pendingCount > 0 && (
          <div className="mb-3 md:mb-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              目前有 <strong>{pendingCount}</strong> 筆訂單正在等待或備餐中
            </span>
            <Link href="/orders" className="ml-auto text-xs underline whitespace-nowrap">前往查看</Link>
          </div>
        )}

        {/* Stats 2×2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`} data-testid={stat.testId}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-3 md:mb-6">
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

        {/* 最近訂單 + 最佳藝術家 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4">
          {/* 最近訂單 */}
          <Card>
            <CardHeader className="py-2 px-3 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>今日最近訂單</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {Array.isArray(todaysOrders) && todaysOrders.length > 0 ? (
                todaysOrders.slice(0, 6).map((order: any) => {
                  const sc = statusConfig[order.orderStatus] ?? { label: order.orderStatus, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <div key={order.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 hover:bg-muted/30">
                      <div>
                        <p className="text-xs font-medium">#{order.orderNumber}</p>
                        <p className="text-[10px] text-muted-foreground">{order.orderType || '內用'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] px-1.5 py-0 ${sc.color}`}>{sc.label}</Badge>
                        <p className="text-xs font-semibold">${parseFloat(order.total || 0).toFixed(0)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-muted-foreground py-6">今日尚無訂單</p>
              )}
            </CardContent>
          </Card>

          {/* 本月最佳藝術家 */}
          <Card>
            <CardHeader className="py-2 px-3 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>最佳藝術家</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {Array.isArray(topArtists) && topArtists.length > 0 ? (
                topArtists.map((artist: any, idx: number) => (
                  <div key={artist.id} className="flex items-center px-3 py-2 border-b border-border last:border-0 hover:bg-muted/30">
                    <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">#{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                      <Palette className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{artist.name}</p>
                      <p className="text-[10px] text-muted-foreground">{artist.style || '藝術家'}</p>
                    </div>
                    <p className="text-xs font-semibold text-green-600">
                      ${parseFloat(artist.totalSales || 0).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground py-6">尚無藝術家資料</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
