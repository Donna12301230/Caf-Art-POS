import { useQuery } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import VendorLayout from "@/components/VendorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, UtensilsCrossed, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function VendorDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["vendorStats", user?.id],
    queryFn: async () => {
      const vendorQ = new Parse.Query("Vendor");
      vendorQ.equalTo("owner", Parse.User.current());
      const vendor = await vendorQ.first();
      if (!vendor) return null;

      const orderQ = new Parse.Query("PreOrder");
      orderQ.equalTo("vendor", vendor);
      const totalOrders = await orderQ.count();

      const pendingQ = new Parse.Query("PreOrder");
      pendingQ.equalTo("vendor", vendor);
      pendingQ.equalTo("status", "pending");
      const pendingOrders = await pendingQ.count();

      const menuQ = new Parse.Query("MenuItem");
      menuQ.equalTo("vendor", vendor);
      const menuCount = await menuQ.count();

      return { vendorName: vendor.get("name"), totalOrders, pendingOrders, menuCount };
    },
    enabled: !!user,
  });

  return (
    <VendorLayout>
      <h2 className="text-xl font-bold mb-4">
        {stats?.vendorName ? `${stats.vendorName} — 總覽` : "廠商總覽"}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" /> 待處理訂單
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.pendingOrders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 總訂單數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <UtensilsCrossed className="w-3.5 h-3.5" /> 菜單項目
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.menuCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 狀態
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-green-600">營業中</div>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
