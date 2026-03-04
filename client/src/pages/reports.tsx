import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Coffee, Palette, Handshake, TrendingUp, Download, Users, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Parse from "@/lib/parseClient";
import { useToast } from "@/hooks/use-toast";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

const PERIOD_LABELS: Record<string, string> = { week: '本週', month: '本月', quarter: '本季', year: '今年' };

function getStartDate(period: string) {
  const now = new Date();
  const d = new Date(now);
  if (period === 'week')    { d.setDate(now.getDate() - 7); }
  if (period === 'month')   { d.setMonth(now.getMonth() - 1); }
  if (period === 'quarter') { d.setMonth(now.getMonth() - 3); }
  if (period === 'year')    { d.setFullYear(now.getFullYear() - 1); }
  d.setHours(0, 0, 0, 0);
  return d;
}

// Group orders into time buckets for the bar chart
function buildChartData(orders: any[], period: string) {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
  const buckets: Record<string, number> = {};

  if (period === 'week') {
    // Last 7 days
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
      buckets[key] = 0;
    }
    orders.forEach((o: any) => {
      const d = o.createdAt?.iso ? new Date(o.createdAt.iso) : new Date(o.createdAt);
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
      if (key in buckets) buckets[key] += parseFloat(o.total || 0);
    });
  } else if (period === 'month') {
    // Last 30 days grouped by week
    for (let i = 4; i >= 0; i--) {
      const label = i === 0 ? '本週' : `${i}週前`;
      buckets[label] = 0;
    }
    const now = new Date();
    orders.forEach((o: any) => {
      const d = o.createdAt?.iso ? new Date(o.createdAt.iso) : new Date(o.createdAt);
      const weeksAgo = Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 3600 * 1000));
      const label = weeksAgo === 0 ? '本週' : `${weeksAgo}週前`;
      if (label in buckets) buckets[label] += parseFloat(o.total || 0);
    });
  } else {
    // Quarter / Year: group by month
    const months: Record<number, string> = { 1:'1月',2:'2月',3:'3月',4:'4月',5:'5月',6:'6月',7:'7月',8:'8月',9:'9月',10:'10月',11:'11月',12:'12月' };
    const now = new Date();
    const numMonths = period === 'quarter' ? 3 : 12;
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const key = months[d.getMonth() + 1];
      buckets[key] = 0;
    }
    orders.forEach((o: any) => {
      const d = o.createdAt?.iso ? new Date(o.createdAt.iso) : new Date(o.createdAt);
      const key = months[d.getMonth() + 1];
      if (key in buckets) buckets[key] += parseFloat(o.total || 0);
    });
  }

  return Object.entries(buckets).map(([label, revenue]) => ({ label, revenue }));
}

// Initials avatar
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
      {initials}
    </div>
  );
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { toast } = useToast();

  const { data: orders } = useQuery({
    queryKey: ["parseReportsOrders", selectedPeriod],
    queryFn: async () => {
      const q = new Parse.Query("Order");
      q.greaterThanOrEqualTo("createdAt", getStartDate(selectedPeriod));
      q.limit(1000);
      return (await q.find()).map(toPlain);
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ["parseReportsOrderItems"],
    queryFn: async () => {
      const q = new Parse.Query("OrderItem");
      q.limit(1000);
      return (await q.find()).map(toPlain);
    },
  });

  const { data: artists } = useQuery({
    queryKey: ["parseReportsArtists"],
    queryFn: async () => {
      const q = new Parse.Query("Artist");
      q.descending("totalSales");
      return (await q.find()).map(toPlain);
    },
  });

  // ── analytics ──────────────────────────────────────────
  const orderList    = Array.isArray(orders) ? orders : [];
  const totalRevenue = orderList.reduce((s: number, o: any) => s + parseFloat(o.total || 0), 0);
  const orderCount   = orderList.length;
  const avgOrder     = orderCount > 0 ? totalRevenue / orderCount : 0;

  const artistList   = Array.isArray(artists) ? artists : [];
  const totalCommission = artistList.reduce((s: number, a: any) =>
    s + parseFloat(a.totalSales || 0) * parseFloat(a.commissionRate || 30) / 100, 0
  );

  // Top products from orderItems
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  if (Array.isArray(orderItems)) {
    orderItems.forEach((item: any) => {
      const key = item.productName || item.productId || 'unknown';
      if (!productMap[key]) productMap[key] = { name: item.productName || key, qty: 0, revenue: 0 };
      productMap[key].qty     += item.quantity || 0;
      productMap[key].revenue += parseFloat(item.totalPrice || 0);
    });
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Chart
  const chartData = buildChartData(orderList, selectedPeriod);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const exportCSV = () => {
    if (orderList.length === 0) {
      toast({ title: "此期間沒有訂單可匯出", variant: "destructive" });
      return;
    }
    const rows = [
      ['訂單號', '日期', '類型', '付款方式', '狀態', '金額'],
      ...orderList.map((o: any) => {
        const d = o.createdAt?.iso ? new Date(o.createdAt.iso) : new Date(o.createdAt);
        return [
          o.orderNumber || '',
          d.toLocaleDateString('zh-TW'),
          o.orderType || '內用',
          o.paymentMethod || '-',
          o.orderStatus || '-',
          parseFloat(o.total || 0).toFixed(0),
        ];
      }),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `報表_${PERIOD_LABELS[selectedPeriod]}_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `已匯出 ${orderList.length} 筆訂單` });
  };

  const stats = [
    { label: `${PERIOD_LABELS[selectedPeriod]}營收`, value: `$${totalRevenue.toFixed(0)}`,    sub: `共 ${orderCount} 筆訂單`,   icon: DollarSign, color: 'text-green-600',  testId: 'text-total-revenue' },
    { label: '訂單數',                                value: orderCount,                        sub: PERIOD_LABELS[selectedPeriod], icon: Receipt,    color: 'text-blue-600',  testId: 'text-order-count' },
    { label: '平均訂單',                              value: `$${avgOrder.toFixed(0)}`,         sub: '每筆平均金額',               icon: TrendingUp, color: 'text-purple-600',testId: 'text-avg-order' },
    { label: '藝術家佣金',                            value: `$${totalCommission.toFixed(0)}`,  sub: '所有藝術家合計',             icon: Handshake,  color: 'text-amber-600', testId: 'text-commissions' },
  ];

  return (
    <Layout>
      <div className="p-2 md:p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">報表與分析</h2>
            <p className="text-xs md:text-sm text-muted-foreground">追蹤績效和業務洞察</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本週</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季</SelectItem>
                <SelectItem value="year">今年</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={exportCSV} data-testid="button-export-report">
              <Download className="w-4 h-4 mr-1" />匯出
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${s.color}`} data-testid={s.testId}>{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Chart + Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4">

          {/* Revenue Bar Chart */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />營收趨勢
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  此期間尚無資料
                </div>
              ) : (
                <div className="h-48 flex items-end gap-1" data-testid="chart-revenue-trends">
                  {chartData.map((d) => {
                    const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[10px] text-muted-foreground">{d.revenue > 0 ? `$${d.revenue.toFixed(0)}` : ''}</span>
                        <div className="w-full bg-muted rounded-t flex flex-col justify-end" style={{ height: '120px' }}>
                          <div
                            className="w-full bg-primary rounded-t transition-all duration-500 hover:bg-primary/80"
                            style={{ height: `${pct}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                            title={`${d.label}: $${d.revenue.toFixed(0)}`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coffee className="w-4 h-4" />熱銷產品
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topProducts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">尚無銷售資料</p>
              ) : topProducts.map((product, idx) => {
                const pct = topProducts[0].revenue > 0 ? product.revenue / topProducts[0].revenue * 100 : 0;
                return (
                  <div key={product.name} className="flex items-center px-4 py-2.5 border-b border-border last:border-0 gap-3" data-testid={`product-${idx}`}>
                    <span className="text-xs font-bold text-muted-foreground w-4">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full">
                          <div className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{product.qty} 件</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">${product.revenue.toFixed(0)}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Artist Performance */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />藝術家表現
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {artistList.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">尚無藝術家資料</p>
            ) : (
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {['藝術家', '風格', '總銷售額', '佣金%', '應付佣金'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {artistList.map((artist: any) => {
                    const sales      = parseFloat(artist.totalSales || 0);
                    const rate       = parseFloat(artist.commissionRate || 30);
                    const commission = sales * rate / 100;
                    return (
                      <tr key={artist.id} className="hover:bg-muted/50" data-testid={`row-artist-${artist.id}`}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={artist.name} />
                            <span className="text-sm font-medium">{artist.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{artist.style || '-'}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-green-600">${sales.toFixed(0)}</td>
                        <td className="px-4 py-2.5 text-sm">{rate}%</td>
                        <td className="px-4 py-2.5 text-sm font-bold text-primary">${commission.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted font-semibold">
                    <td className="px-4 py-2 text-sm" colSpan={2}>合計</td>
                    <td className="px-4 py-2 text-sm text-green-600">
                      ${artistList.reduce((s: number, a: any) => s + parseFloat(a.totalSales || 0), 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-2 text-sm">-</td>
                    <td className="px-4 py-2 text-sm text-primary">${totalCommission.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
