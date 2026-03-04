import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Receipt, TrendingUp, DollarSign, Clock, Search, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object) => ({ id: obj.id, ...obj.attributes });

const STATUS: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  pending:   { label: '待處理', color: 'bg-blue-100 text-blue-800',   next: 'preparing', nextLabel: '開始備餐' },
  preparing: { label: '備餐中', color: 'bg-amber-100 text-amber-800', next: 'completed', nextLabel: '完成出餐' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

const PERIOD_LABELS: Record<string, string> = { today: '今日', week: '本週', month: '本月' };

const PAGE_SIZE = 10;

function getStartDate(period: string) {
  const d = new Date();
  if (period === 'today') { d.setHours(0, 0, 0, 0); return d; }
  if (period === 'week')  { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
  if (period === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
  return d;
}

function formatTime(dateValue: any) {
  const d = dateValue?.iso ? new Date(dateValue.iso) : new Date(dateValue);
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(dateValue: any) {
  const d = dateValue?.iso ? new Date(dateValue.iso) : new Date(dateValue);
  return d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
}

export default function Orders() {
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [currentPage, setCurrentPage]     = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["parseOrders"],
    queryFn: async () => {
      const q = new Parse.Query("Order");
      q.descending("createdAt");
      q.limit(500);
      return (await q.find()).map(toPlain);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const obj = new Parse.Object("Order");
      obj.id = orderId;
      await obj.save({ orderStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["parseTodaysOrders"] });
      queryClient.invalidateQueries({ queryKey: ["parsePendingOrderCount"] });
      toast({ title: "狀態已更新" });
    },
    onError: (e: Error) => toast({ title: "更新失敗", description: e.message, variant: "destructive" }),
  });

  // ── 依期間過濾 ──────────────────────────────────────
  const startDate = getStartDate(selectedPeriod);
  const periodOrders = Array.isArray(orders) ? orders.filter((o: any) => {
    const d = o.createdAt?.iso ? new Date(o.createdAt.iso) : new Date(o.createdAt);
    return d >= startDate;
  }) : [];

  // ── 搜尋過濾（訂單號 / 客戶名 / 金額） ──────────────
  const filteredOrders = periodOrders.filter((o: any) =>
    !searchQuery ||
    o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.total?.toString().includes(searchQuery)
  );

  // ── 分頁 ────────────────────────────────────────────
  const totalPages    = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders   = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── 統計（依所選期間）──────────────────────────────
  const periodRevenue = periodOrders.reduce((s: number, o: any) => s + parseFloat(o.total || 0), 0);
  const avgOrder      = periodOrders.length > 0 ? periodRevenue / periodOrders.length : 0;
  const pendingCount  = (Array.isArray(orders) ? orders : []).filter(
    (o: any) => o.orderStatus === 'pending' || o.orderStatus === 'preparing'
  ).length;

  const stats = [
    { label: `${PERIOD_LABELS[selectedPeriod]}訂單`, value: periodOrders.length,       sub: `共 ${filteredOrders.length} 筆`,          icon: Receipt,    color: 'text-blue-600',  testId: 'text-todays-orders' },
    { label: `${PERIOD_LABELS[selectedPeriod]}營收`, value: `$${periodRevenue.toFixed(0)}`, sub: `${periodOrders.length} 筆訂單`,       icon: DollarSign, color: 'text-green-600', testId: 'text-revenue' },
    { label: '平均訂單',   value: `$${avgOrder.toFixed(0)}`,                           sub: '每筆平均金額',                             icon: TrendingUp, color: 'text-purple-600',testId: 'text-avg-order' },
    { label: '等待中',     value: pendingCount,                                         sub: pendingCount > 0 ? '需要處理' : '全部完成', icon: Clock,      color: pendingCount > 0 ? 'text-destructive' : 'text-green-600', testId: 'text-pending-orders' },
  ];

  if (isLoading) return (
    <Layout>
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-2 md:p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">訂單管理</h2>
            <p className="text-xs md:text-sm text-muted-foreground">查看和管理所有訂單</p>
          </div>
          <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本週</SelectItem>
              <SelectItem value="month">本月</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜尋訂單號、客戶名稱..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            data-testid="input-search-orders"
          />
        </div>

        {/* Orders */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm md:text-base">
                {PERIOD_LABELS[selectedPeriod]}訂單
                <span className="ml-2 text-muted-foreground font-normal text-xs">共 {filteredOrders.length} 筆</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {['訂單號', '客戶/桌號', '類型', '金額', '付款', '狀態', '時間', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                        {searchQuery ? '找不到符合的訂單' : `${PERIOD_LABELS[selectedPeriod]}尚無訂單`}
                      </td>
                    </tr>
                  ) : pagedOrders.map((order: any) => {
                    const sc = STATUS[order.orderStatus] ?? { label: order.orderStatus, color: 'bg-gray-100 text-gray-800' };
                    return (
                      <tr key={order.id} className="hover:bg-muted/50" data-testid={`row-order-${order.id}`}>
                        <td className="px-4 py-3 text-sm font-medium text-primary">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm">
                          <p>{order.customer?.name || '現場客戶'}</p>
                          {order.tableNumber && <p className="text-xs text-muted-foreground">桌 {order.tableNumber}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{order.orderType || '內用'}</td>
                        <td className="px-4 py-3 text-sm font-semibold">${parseFloat(order.total || 0).toFixed(0)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{order.paymentMethod || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatTime(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          {sc.next && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => updateStatus.mutate({ orderId: order.id, status: sc.next! })}
                              disabled={updateStatus.isPending}
                              data-testid={`button-advance-${order.id}`}
                            >
                              {sc.nextLabel} <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {pagedOrders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {searchQuery ? '找不到符合的訂單' : `${PERIOD_LABELS[selectedPeriod]}尚無訂單`}
                </p>
              ) : pagedOrders.map((order: any) => {
                const sc = STATUS[order.orderStatus] ?? { label: order.orderStatus, color: 'bg-gray-100 text-gray-800' };
                return (
                  <div key={order.id} className="flex items-center px-3 py-2 gap-2" data-testid={`row-order-${order.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-primary">{order.orderNumber}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${sc.color}`}>{sc.label}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {order.customer?.name || '現場客戶'}
                        {order.tableNumber ? ` · 桌${order.tableNumber}` : ''}
                        {' · '}{formatDate(order.createdAt)} {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">${parseFloat(order.total || 0).toFixed(0)}</p>
                      {sc.next && (
                        <button
                          onClick={() => updateStatus.mutate({ orderId: order.id, status: sc.next! })}
                          className="text-[10px] text-primary underline mt-0.5"
                        >
                          {sc.nextLabel}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {filteredOrders.length > PAGE_SIZE && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} 筆，共 {filteredOrders.length} 筆
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>上一頁</Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p} size="sm" variant={p === currentPage ? "default" : "outline"}
                      onClick={() => setCurrentPage(p)}
                    >{p}</Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一頁</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
