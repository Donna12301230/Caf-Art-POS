import { useQuery, useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import VendorLayout from "@/components/VendorLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarDays, MapPin, Users, ClipboardList, TableProperties, RefreshCw, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { PreOrderData, TableOrderData } from "@/types";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待確認", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "已確認", color: "bg-blue-100 text-blue-800" },
  completed: { label: "已完成", color: "bg-green-100 text-green-800" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-600" },
};

function toOrder(obj: Parse.Object): PreOrderData {
  return {
    id: obj.id,
    customerId: obj.get("customer")?.id ?? "",
    vendorId: obj.get("vendor")?.id ?? "",
    vendorName: "",
    pickupDate: obj.get("pickupDate") ? new Date(obj.get("pickupDate")) : new Date(),
    pickupLocation: obj.get("pickupLocation") ?? "",
    orderType: obj.get("orderType") ?? "individual",
    groupName: obj.get("groupName"),
    totalAmount: obj.get("totalAmount") ?? 0,
    discountAmount: obj.get("discountAmount") ?? 0,
    finalAmount: obj.get("finalAmount") ?? 0,
    status: obj.get("status") ?? "pending",
    paymentMethod: "cash",
    paymentStatus: obj.get("paymentStatus") ?? "unpaid",
    items: [],
    createdAt: obj.createdAt ?? new Date(),
  };
}

function toTableOrder(obj: Parse.Object): TableOrderData {
  return {
    id: obj.id,
    vendorId: obj.get("vendor")?.id ?? "",
    tableName: obj.get("tableName") ?? "",
    customerName: obj.get("customerName") ?? "",
    customerPhone: obj.get("customerPhone") ?? "",
    totalAmount: obj.get("totalAmount") ?? 0,
    status: obj.get("status") ?? "pending",
    paymentMethod: "cash",
    paymentStatus: obj.get("paymentStatus") ?? "unpaid",
    note: obj.get("note") ?? "",
    items: [],
    createdAt: obj.createdAt ?? new Date(),
  };
}

export default function VendorOrders() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: vendorObj } = useQuery({
    queryKey: ["myVendor", user?.id],
    queryFn: async () => {
      const q = new Parse.Query("Vendor");
      q.equalTo("owner", Parse.User.current());
      return q.first();
    },
    enabled: !!user,
  });

  // PreOrders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["vendorOrders", vendorObj?.id],
    queryFn: async () => {
      if (!vendorObj) return [];
      const q = new Parse.Query("PreOrder");
      q.equalTo("vendor", vendorObj);
      q.include("customer");
      q.descending("pickupDate");
      const results = await q.find();
      return results.map(obj => {
        const order = toOrder(obj);
        const customer = obj.get("customer");
        order.vendorName = customer?.get("displayName") || customer?.get("username") || "會員";
        return order;
      });
    },
    enabled: !!vendorObj,
    refetchInterval: 60000,
  });

  // TableOrders (現場訂單)
  const { data: tableOrders = [], isLoading: loadingTable, refetch: refetchTable } = useQuery({
    queryKey: ["vendorTableOrders", vendorObj?.id],
    queryFn: async () => {
      if (!vendorObj) return [];
      const q = new Parse.Query("TableOrder");
      q.equalTo("vendor", vendorObj);
      q.descending("createdAt");
      q.limit(200);
      const results = await q.find();
      return results.map(toTableOrder);
    },
    enabled: !!vendorObj,
    refetchInterval: 30000, // 每 30 秒自動輪詢
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, className }: { orderId: string; status: string; className: string }) => {
      const obj = Parse.Object.fromJSON({ __type: "Object", className, objectId: orderId }) as Parse.Object;
      obj.set("status", status);
      return obj.save();
    },
    onSuccess: (_, vars) => {
      if (vars.className === "PreOrder") {
        queryClient.invalidateQueries({ queryKey: ["vendorOrders", vendorObj?.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["vendorTableOrders", vendorObj?.id] });
      }
      toast({ title: "訂單狀態已更新" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "更新失敗", description: err.message }),
  });

  const pending = orders.filter(o => o.status === "pending");
  const confirmed = orders.filter(o => o.status === "confirmed");
  const done = orders.filter(o => ["completed", "cancelled"].includes(o.status));

  const tablePending = tableOrders.filter(o => o.status === "pending");
  const tableActive = tableOrders.filter(o => o.status === "confirmed");
  const tableDone = tableOrders.filter(o => ["completed", "cancelled"].includes(o.status));

  function PreOrderCard({ order }: { order: PreOrderData }) {
    const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
    return (
      <Card className="mb-3">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <div className="font-semibold text-sm">{order.vendorName}</div>
            <div className="text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            取餐：{format(order.pickupDate, "yyyy/MM/dd (EEE)", { locale: zhTW })}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" /> {order.pickupLocation}
          </div>
          {order.orderType === "group" && order.groupName && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> {order.groupName}
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-border">
            <div className="font-bold text-orange-600">NT$ {order.finalAmount}</div>
            <div className="flex gap-1.5">
              {order.status === "pending" && (
                <>
                  <Button size="sm" className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "confirmed", className: "PreOrder" })}>
                    確認
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-500"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "cancelled", className: "PreOrder" })}>
                    拒絕
                  </Button>
                </>
              )}
              {order.status === "confirmed" && (
                <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "completed", className: "PreOrder" })}>
                  完成取餐
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function TableOrderCard({ order }: { order: TableOrderData }) {
    const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
    return (
      <Card className="mb-3">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              <QrCode className="w-3.5 h-3.5 text-orange-500" />
              桌號：{order.tableName || "未指定"}
            </div>
            <div className="text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5">
          <div className="flex gap-4 text-muted-foreground">
            <span>姓名：<b className="text-foreground">{order.customerName}</b></span>
            <span>電話：<b className="text-foreground">{order.customerPhone}</b></span>
          </div>
          {order.note && (
            <div className="text-muted-foreground">備註：{order.note}</div>
          )}
          <div className="text-xs text-muted-foreground">
            {format(order.createdAt, "MM/dd HH:mm", { locale: zhTW })}
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border">
            <div className="font-bold text-orange-600">NT$ {order.totalAmount}</div>
            <div className="flex gap-1.5">
              {order.status === "pending" && (
                <>
                  <Button size="sm" className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "confirmed", className: "TableOrder" })}>
                    確認
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-500"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "cancelled", className: "TableOrder" })}>
                    取消
                  </Button>
                </>
              )}
              {order.status === "confirmed" && (
                <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "completed", className: "TableOrder" })}>
                  完成出餐
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <VendorLayout>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-orange-500" /> 訂單管理
      </h2>

      <Tabs defaultValue="table">
        <TabsList className="mb-4">
          <TabsTrigger value="table" className="flex items-center gap-1">
            <TableProperties className="w-3.5 h-3.5" />
            現場訂單
            {tablePending.length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {tablePending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preorder">預約訂購</TabsTrigger>
        </TabsList>

        {/* 現場訂單 Tab */}
        <TabsContent value="table">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted-foreground">每 30 秒自動更新</p>
            <Button size="sm" variant="outline" onClick={() => refetchTable()} disabled={loadingTable}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingTable ? "animate-spin" : ""}`} /> 手動更新
            </Button>
          </div>

          {loadingTable ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <Tabs defaultValue="t-pending">
              <TabsList className="mb-3">
                <TabsTrigger value="t-pending">待確認 {tablePending.length > 0 && `(${tablePending.length})`}</TabsTrigger>
                <TabsTrigger value="t-confirmed">備餐中 {tableActive.length > 0 && `(${tableActive.length})`}</TabsTrigger>
                <TabsTrigger value="t-done">歷史</TabsTrigger>
              </TabsList>
              <TabsContent value="t-pending">
                {tablePending.length === 0
                  ? <p className="text-center text-muted-foreground py-8">無待確認現場訂單</p>
                  : tablePending.map(o => <TableOrderCard key={o.id} order={o} />)
                }
              </TabsContent>
              <TabsContent value="t-confirmed">
                {tableActive.length === 0
                  ? <p className="text-center text-muted-foreground py-8">無備餐中訂單</p>
                  : tableActive.map(o => <TableOrderCard key={o.id} order={o} />)
                }
              </TabsContent>
              <TabsContent value="t-done">
                {tableDone.length === 0
                  ? <p className="text-center text-muted-foreground py-8">無歷史現場訂單</p>
                  : tableDone.map(o => <TableOrderCard key={o.id} order={o} />)
                }
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* 預約訂購 Tab */}
        <TabsContent value="preorder">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">待確認 {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
                <TabsTrigger value="confirmed">已確認 {confirmed.length > 0 && `(${confirmed.length})`}</TabsTrigger>
                <TabsTrigger value="done">歷史</TabsTrigger>
              </TabsList>
              <TabsContent value="pending">
                {pending.length === 0
                  ? <p className="text-center text-muted-foreground py-8">無待確認訂單</p>
                  : pending.map(o => <PreOrderCard key={o.id} order={o} />)
                }
              </TabsContent>
              <TabsContent value="confirmed">
                {confirmed.length === 0
                  ? <p className="text-center text-muted-foreground py-8">無已確認訂單</p>
                  : confirmed.map(o => <PreOrderCard key={o.id} order={o} />)
                }
              </TabsContent>
              <TabsContent value="done">
                {done.length === 0
                  ? <p className="text-center text-muted-foreground py-8">無歷史訂單</p>
                  : done.map(o => <PreOrderCard key={o.id} order={o} />)
                }
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </VendorLayout>
  );
}
