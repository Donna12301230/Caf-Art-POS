import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  TrendingUp,
  DollarSign,
  Clock,
  Search,
  Eye,
  Printer,
  Download
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object) => ({ id: obj.id, ...obj.attributes });

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["parseOrders"],
    queryFn: async () => {
      const q = new Parse.Query("Order");
      q.descending("createdAt");
      q.limit(200);
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const order = new Parse.Object("Order");
      order.id = orderId;
      await order.save({ orderStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseOrders"] });
      toast({ title: "訂單已更新", description: "訂單狀態已成功更新。" });
    },
    onError: (error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });

  const filteredOrders = Array.isArray(orders) ? orders.filter((order: any) =>
    order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.total?.toString().includes(searchQuery)
  ) : [];

  const todaysOrders = Array.isArray(orders) ? orders.filter((order: any) => {
    const orderDate = new Date(order.createdAt?.iso || order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }) : [];

  const totalRevenue = todaysOrders.reduce((sum: number, order: any) =>
    sum + parseFloat(order.total || 0), 0
  );

  const averageOrder = todaysOrders.length > 0 ? totalRevenue / todaysOrders.length : 0;

  const pendingOrders = Array.isArray(orders) ? orders.filter((order: any) =>
    order.orderStatus === 'pending' || order.orderStatus === 'preparing'
  ) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateValue: any) => {
    const d = dateValue?.iso ? new Date(dateValue.iso) : new Date(dateValue);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-2 md:p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-2 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">訂單管理</h2>
            <p className="text-muted-foreground">查看和管理所有訂單</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="week">本週</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>
            <Button data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              匯出
            </Button>
          </div>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日訂單</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-todays-orders">
                {todaysOrders.length}
              </div>
              <p className="text-xs text-green-600 mt-2">比昨天 +12%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">營收</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-revenue">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 mt-2">比昨天 +8%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均訂單</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-avg-order">
                ${averageOrder.toFixed(2)}
              </div>
              <p className="text-xs text-red-600 mt-2">比昨天 -3%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">等待中</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-pending-orders">
                {pendingOrders.length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">排隊中的訂單</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle>最近訂單</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="搜尋訂單..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-orders"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">訂單號</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">客戶</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">項目</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">總計</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">付款</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">狀態</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">時間</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        找不到訂單
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-muted/50" data-testid={`row-order-${order.id}`}>
                        <td className="px-4 py-3 text-sm font-medium text-primary">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {order.customer?.name || '現場客戶'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {order.tableNumber && `桌號 ${order.tableNumber}`}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">
                          ${parseFloat(order.total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                          {order.paymentMethod}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${getStatusColor(order.orderStatus)} capitalize`}>
                            {order.orderStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" data-testid={`button-view-${order.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-print-${order.id}`}>
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredOrders.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    顯示 1-{Math.min(10, filteredOrders.length)} / 共 {filteredOrders.length} 筆訂單
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>上一頁</Button>
                    <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                    <Button variant="outline" size="sm">2</Button>
                    <Button variant="outline" size="sm">下一頁</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
