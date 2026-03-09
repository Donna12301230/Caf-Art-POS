import { useQuery, useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { VendorData } from "@/types";

function toVendor(obj: Parse.Object): VendorData {
  return {
    id: obj.id,
    name: obj.get("name") ?? "",
    description: obj.get("description") ?? "",
    address: obj.get("address") ?? "",
    phone: obj.get("phone") ?? "",
    coverImage: obj.get("coverImage"),
    isApproved: obj.get("isApproved") ?? false,
    isActive: obj.get("isActive") ?? false,
    subscriptionStatus: obj.get("subscriptionStatus") ?? "trial",
    subscriptionEndDate: obj.get("subscriptionEndDate"),
    ownerId: obj.get("owner")?.id ?? "",
    createdAt: obj.createdAt ?? new Date(),
  };
}

export default function AdminVendors() {
  const { toast } = useToast();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["adminVendors"],
    queryFn: async () => {
      const q = new Parse.Query("Vendor");
      q.include("owner");
      q.descending("createdAt");
      const results = await q.find({ useMasterKey: false });
      return results.map(toVendor);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const obj = Parse.Object.fromJSON({ __type: "Object", className: "Vendor", objectId: id }) as Parse.Object;
      obj.set("isApproved", approved);
      obj.set("isActive", approved);
      return obj.save();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["adminVendors"] });
      toast({ title: vars.approved ? "已核准" : "已停用" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "操作失敗", description: err.message }),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-primary-foreground px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          <span className="font-semibold">管理後台 — 廠商管理</span>
        </div>
        <Link href="/" className="text-sm opacity-80 hover:opacity-100">回首頁</Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">所有廠商申請 ({vendors.length})</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>目前無廠商資料</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map(vendor => (
              <Card key={vendor.id}>
                <CardHeader className="pb-1 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{vendor.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">{vendor.address} · {vendor.phone}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vendor.isApproved
                      ? <Badge className="bg-green-100 text-green-800 border-0">已核准</Badge>
                      : <Badge className="bg-yellow-100 text-yellow-800 border-0">待審核</Badge>
                    }
                  </div>
                </CardHeader>
                <CardContent className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground line-clamp-1">{vendor.description}</span>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    {!vendor.isApproved ? (
                      <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => approveMutation.mutate({ id: vendor.id, approved: true })}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> 核准
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-500"
                        onClick={() => approveMutation.mutate({ id: vendor.id, approved: false })}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> 停用
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
