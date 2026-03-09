import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Parse from "@/lib/parseClient";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Plus, Minus, ShoppingCart, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import type { VendorData, MenuItemData } from "@/types";

function toMenuItem(obj: Parse.Object): MenuItemData {
  return {
    id: obj.id,
    name: obj.get("name") ?? "",
    description: obj.get("description") ?? "",
    price: obj.get("price") ?? 0,
    image: obj.get("image"),
    isAvailable: obj.get("isAvailable") ?? true,
    category: obj.get("category") ?? "一般",
    vendorId: obj.get("vendor")?.id ?? "",
    createdAt: obj.createdAt ?? new Date(),
  };
}

export default function VendorDetail() {
  const [, params] = useRoute("/vendor/:id");
  const vendorId = params?.id ?? "";
  const [, navigate] = useLocation();
  const { addItem, count } = useCart();
  const { toast } = useToast();
  const [noteItem, setNoteItem] = useState<MenuItemData | null>(null);
  const [note, setNote] = useState("");

  const { data: vendor, isLoading: loadingVendor } = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const q = new Parse.Query("Vendor");
      const obj = await q.get(vendorId);
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
        ownerId: obj.get("owner")?.id ?? "",
        createdAt: obj.createdAt ?? new Date(),
      } as VendorData;
    },
    enabled: !!vendorId,
  });

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({
    queryKey: ["menuItems", vendorId],
    queryFn: async () => {
      const q = new Parse.Query("MenuItem");
      q.equalTo("vendor", Parse.Object.fromJSON({ __type: "Object", className: "Vendor", objectId: vendorId }));
      q.equalTo("isAvailable", true);
      q.ascending("category");
      const results = await q.find();
      return results.map(toMenuItem);
    },
    enabled: !!vendorId,
  });

  // Group by category
  const grouped = menuItems.reduce((acc, item) => {
    const cat = item.category || "一般";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItemData[]>);

  function handleAdd(item: MenuItemData) {
    setNoteItem(item);
    setNote("");
  }

  function confirmAdd() {
    if (!noteItem) return;
    addItem(noteItem, vendorId, note);
    toast({ title: `已加入購物車`, description: noteItem.name });
    setNoteItem(null);
  }

  if (loadingVendor) return (
    <CustomerLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </CustomerLayout>
  );

  if (!vendor) return (
    <CustomerLayout>
      <div className="text-center py-20 text-muted-foreground">找不到此店家</div>
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      {/* Back button */}
      <button onClick={() => navigate("/")} className="flex items-center text-sm text-muted-foreground mb-3 hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回店家列表
      </button>

      {/* Vendor header */}
      <div className="rounded-2xl overflow-hidden mb-5">
        <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-100 relative">
          {vendor.coverImage ? (
            <img src={vendor.coverImage} alt={vendor.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🍱</div>
          )}
        </div>
        <div className="bg-white px-4 py-3 border border-t-0 rounded-b-2xl">
          <h2 className="text-xl font-bold">{vendor.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{vendor.description}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            {vendor.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vendor.address}</span>}
            {vendor.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{vendor.phone}</span>}
          </div>
        </div>
      </div>

      {/* Early bird reminder */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700 mb-5 flex items-center gap-2">
        <span>⏰</span>
        <span>提前 7 天訂購享 <b>9 折</b>・3 天享 <b>95 折</b>・1 天享 <b>98 折</b>，結帳時自動計算</span>
      </div>

      {/* Menu */}
      {loadingMenu ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">此店家尚未上架菜單</div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-5">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 px-1">{category}</h3>
            <div className="space-y-2">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🍱</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.name}</div>
                      {item.description && <div className="text-xs text-muted-foreground line-clamp-2">{item.description}</div>}
                      <div className="text-orange-600 font-semibold mt-1">NT$ {item.price}</div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                      onClick={() => handleAdd(item)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Floating cart button */}
      {count > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg px-6 py-3 rounded-full flex items-center gap-2"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart className="w-5 h-5" />
            查看購物車（{count} 項）
          </Button>
        </div>
      )}

      {/* Note dialog */}
      <Dialog open={!!noteItem} onOpenChange={() => setNoteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>加入購物車</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="font-medium">{noteItem?.name}</div>
            <div className="text-orange-600">NT$ {noteItem?.price}</div>
            <div>
              <Label>備註（選填）</Label>
              <Input
                placeholder="例：不要辣、少油..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteItem(null)}>取消</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={confirmAdd}>
              加入購物車
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
