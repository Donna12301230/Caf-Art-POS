import { useQuery } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Store, Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
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
    isActive: obj.get("isActive") ?? true,
    subscriptionStatus: obj.get("subscriptionStatus") ?? "trial",
    subscriptionEndDate: obj.get("subscriptionEndDate"),
    ownerId: obj.get("owner")?.id ?? "",
    createdAt: obj.createdAt ?? new Date(),
  };
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors", "approved"],
    queryFn: async () => {
      const q = new Parse.Query("Vendor");
      q.equalTo("isApproved", true);
      q.equalTo("isActive", true);
      q.descending("createdAt");
      const results = await q.find();
      return results.map(toVendor);
    },
  });

  const filtered = vendors.filter(v =>
    v.name.includes(search) || v.description.includes(search) || v.address.includes(search)
  );

  return (
    <CustomerLayout>
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 md:p-8 mb-6 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-1">今天吃什麼？</h2>
        <p className="opacity-90 mb-4">提前預訂、享早鳥優惠，便當準時取餐免等候</p>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜尋店家..."
            className="pl-9 bg-white text-gray-800"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Vendor list */}
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Store className="w-5 h-5 text-orange-500" /> 合作店家
      </h3>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{search ? "找不到符合的店家" : "目前尚無合作店家"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(vendor => (
            <Card
              key={vendor.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => navigate(`/vendor/${vendor.id}`)}
            >
              {/* Cover image */}
              <div className="h-36 bg-gradient-to-br from-orange-100 to-amber-100 relative">
                {vendor.coverImage ? (
                  <img src={vendor.coverImage} alt={vendor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🍱</div>
                )}
                <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
                  接單中
                </Badge>
              </div>
              <CardContent className="p-3">
                <h4 className="font-semibold text-base mb-1">{vendor.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{vendor.description}</p>
                <div className="flex items-center text-xs text-muted-foreground gap-3">
                  {vendor.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {vendor.address}
                    </span>
                  )}
                  {vendor.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {vendor.phone}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Early bird info */}
      <Card className="mt-6 border-orange-200 bg-orange-50">
        <CardContent className="p-4 flex items-start gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <div className="font-semibold text-orange-800 mb-1">早鳥優惠說明</div>
            <div className="text-sm text-orange-700 space-y-0.5">
              <div>• 提前 <b>7 天以上</b>訂購 → <b>9 折</b></div>
              <div>• 提前 <b>3～6 天</b>訂購 → <b>95 折</b></div>
              <div>• 提前 <b>1～2 天</b>訂購 → <b>98 折</b></div>
              <div>• 當天訂購 → 原價（視店家是否開放）</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </CustomerLayout>
  );
}
