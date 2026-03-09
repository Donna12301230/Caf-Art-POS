import { useQuery } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ClipboardList, MapPin, CalendarDays, Users } from "lucide-react";
import type { PreOrderData } from "@/types";
import { useAuth } from "@/hooks/useAuth";

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
    vendorName: obj.get("vendorName") ?? "",
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

function OrderCard({ order }: { order: PreOrderData }) {
  const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <div className="font-semibold text-sm">{order.vendorName || "便當店家"}</div>
          <div className="text-xs text-muted-foreground">訂單號：{order.id.slice(-8).toUpperCase()}</div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
      </CardHeader>
      <CardContent className="text-sm space-y-1.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          取餐日：{format(order.pickupDate, "yyyy/MM/dd (EEE)", { locale: zhTW })}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {order.pickupLocation}
        </div>
        {order.orderType === "group" && order.groupName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {order.groupName}
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {order.discountAmount > 0 && <span>優惠折扣 -NT$ {order.discountAmount} · </span>}
            付款方式：現金
          </div>
          <div className="font-bold text-orange-600">NT$ {order.finalAmount}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyOrders() {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["myOrders", user?.id],
    queryFn: async () => {
      const q = new Parse.Query("PreOrder");
      q.equalTo("customer", Parse.User.current());
      q.include("vendor");
      q.descending("createdAt");
      const results = await q.find();
      return results.map(obj => {
        const order = toOrder(obj);
        order.vendorName = obj.get("vendor")?.get("name") ?? "便當店家";
        return order;
      });
    },
    enabled: !!user,
  });

  const active = orders.filter(o => ["pending", "confirmed"].includes(o.status));
  const done = orders.filter(o => ["completed", "cancelled"].includes(o.status));

  return (
    <CustomerLayout>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-orange-500" /> 我的預約訂單
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>尚無預約訂單</p>
          <Button className="mt-3 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => window.location.href = "/"}>
            去預訂便當
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">進行中 {active.length > 0 && `(${active.length})`}</TabsTrigger>
            <TabsTrigger value="done">歷史訂單</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            {active.length === 0
              ? <p className="text-center text-muted-foreground py-8">目前沒有進行中的訂單</p>
              : active.map(o => <OrderCard key={o.id} order={o} />)
            }
          </TabsContent>
          <TabsContent value="done">
            {done.length === 0
              ? <p className="text-center text-muted-foreground py-8">尚無歷史訂單</p>
              : done.map(o => <OrderCard key={o.id} order={o} />)
            }
          </TabsContent>
        </Tabs>
      )}
    </CustomerLayout>
  );
}
