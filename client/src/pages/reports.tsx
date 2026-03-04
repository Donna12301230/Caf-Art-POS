import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  Coffee,
  Palette,
  Handshake,
  TrendingUp,
  Download,
  Users
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object) => ({ id: obj.id, ...obj.attributes });

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const { data: orders } = useQuery({
    queryKey: ["parseReportsOrders", selectedPeriod],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      if (selectedPeriod === "week") startDate.setDate(now.getDate() - 7);
      else if (selectedPeriod === "month") startDate.setMonth(now.getMonth() - 1);
      else if (selectedPeriod === "quarter") startDate.setMonth(now.getMonth() - 3);
      else if (selectedPeriod === "year") startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);

      const q = new Parse.Query("Order");
      q.greaterThanOrEqualTo("createdAt", startDate);
      q.limit(1000);
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ["parseReportsOrderItems"],
    queryFn: async () => {
      const q = new Parse.Query("OrderItem");
      q.limit(1000);
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const { data: artists } = useQuery({
    queryKey: ["parseReportsArtists"],
    queryFn: async () => {
      const q = new Parse.Query("Artist");
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  // Client-side analytics
  const totalRevenue = Array.isArray(orders)
    ? orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0)
    : 0;

  // Mock chart data for visualization
  const chartData = [
    { day: 'Mon', revenue: 2800 },
    { day: 'Tue', revenue: 3200 },
    { day: 'Wed', revenue: 3800 },
    { day: 'Thu', revenue: 4200 },
    { day: 'Fri', revenue: 4800 },
    { day: 'Sat', revenue: 3600 },
    { day: 'Sun', revenue: 5200 },
  ];
  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  // Top products from order items
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  if (Array.isArray(orderItems)) {
    orderItems.forEach((item: any) => {
      const productId = item.productId?.objectId || item.productId;
      if (!productSales[productId]) {
        productSales[productId] = { name: item.productName || productId, qty: 0, revenue: 0 };
      }
      productSales[productId].qty += item.quantity || 0;
      productSales[productId].revenue += parseFloat(item.totalPrice || 0);
    });
  }
  const topProducts = Object.entries(productSales)
    .map(([id, v]) => ({ productId: id, productName: v.name, totalQuantity: v.qty, totalRevenue: v.revenue }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Artist performance
  const artistPerformance = Array.isArray(artists) ? artists.map((artist: any) => ({
    artistId: artist.id,
    artistName: artist.name,
    totalSales: parseFloat(artist.totalSales || 0),
    commission: parseFloat(artist.totalSales || 0) * parseFloat(artist.commissionRate || 30) / 100,
    totalOrders: 0,
  })) : [];

  return (
    <Layout>
      <div className="p-2 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">報表與分析</h2>
            <p className="text-muted-foreground">追蹤績效和業務洞察</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本週</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季</SelectItem>
                <SelectItem value="year">今年</SelectItem>
              </SelectContent>
            </Select>
            <Button data-testid="button-export-report">
              <Download className="w-4 h-4 mr-2" />
              匯出報表
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總營收</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground ml-2">與上期比較</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">飲品銷售</CardTitle>
              <Coffee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-beverage-sales">
                -
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+8.2%</span>
                  <span className="text-muted-foreground ml-2">與上月比較</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">藝術品銷售</CardTitle>
              <Palette className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-art-sales">
                -
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+24.8%</span>
                  <span className="text-muted-foreground ml-2">與上月比較</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">藝術家佣金</CardTitle>
              <Handshake className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-commissions">
                ${artistPerformance.reduce((s, a) => s + a.commission, 0).toFixed(0)}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+18.9%</span>
                  <span className="text-muted-foreground ml-2">與上月比較</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>營收趨勢</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2" data-testid="chart-revenue-trends">
                {chartData.map((data) => {
                  const height = (data.revenue / maxRevenue) * 200;
                  return (
                    <div key={data.day} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-primary/20 rounded-t flex items-end" style={{ height: '200px' }}>
                        <div
                          className="w-full bg-primary rounded-t transition-all duration-500"
                          style={{ height: `${height}px` }}
                          title={`${data.day}: $${data.revenue}`}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground mt-2">{data.day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>熱銷產品</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">無可用的產品數據</p>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between" data-testid={`product-${index}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Coffee className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">{product.totalQuantity} 件已売</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${product.totalRevenue.toFixed(0)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Artist Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>藝術家表現</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">藝術家</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">銷售</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">營收</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">佣金</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {artistPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        無可用的藝術家表現數據
                      </td>
                    </tr>
                  ) : (
                    artistPerformance.map((artist) => (
                      <tr key={artist.artistId} className="hover:bg-muted/50" data-testid={`row-artist-${artist.artistId}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src="https://images.unsplash.com/photo-1494790108755-2616b612b882?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"
                              alt={artist.artistName}
                              className="w-10 h-10 rounded-full"
                            />
                            <span className="font-medium text-foreground">{artist.artistName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{artist.totalOrders}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          ${artist.totalSales.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          ${artist.commission.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
