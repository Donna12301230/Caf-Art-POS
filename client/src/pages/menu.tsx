import { useState } from "react";
import { useRoute, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Plus, Minus, ShoppingCart, CheckCircle, QrCode } from "lucide-react";
import type { MenuItemData } from "@/types";

interface CartItem {
  item: MenuItemData;
  quantity: number;
  note: string;
}

function toMenuItem(obj: Parse.Object): MenuItemData {
  return {
    id: obj.id ?? "",
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

export default function PublicMenu() {
  const [, params] = useRoute("/menu/:vendorId");
  const vendorId = params?.vendorId ?? "";
  const search = useSearch();
  const tableName = new URLSearchParams(search).get("table") ?? "";

  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [noteItem, setNoteItem] = useState<MenuItemData | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: vendor, isLoading: loadingVendor } = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const q = new Parse.Query("Vendor");
      const obj = await q.get(vendorId);
      return {
        id: obj.id ?? "",
        name: obj.get("name") ?? "",
        description: obj.get("description") ?? "",
        address: obj.get("address") ?? "",
        phone: obj.get("phone") ?? "",
        coverImage: obj.get("coverImage"),
      };
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

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!customerName.trim() || !customerPhone.trim()) throw new Error("請填入姓名與電話");
      if (cart.length === 0) throw new Error("購物車是空的");

      const totalAmount = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);

      const TableOrder = Parse.Object.extend("TableOrder");
      const order = new TableOrder();
      const vendorPointer = Parse.Object.fromJSON({ __type: "Object", className: "Vendor", objectId: vendorId });
      order.set("vendor", vendorPointer);
      order.set("tableName", tableName);
      order.set("customerName", customerName.trim());
      order.set("customerPhone", customerPhone.trim());
      order.set("totalAmount", totalAmount);
      order.set("status", "pending");
      order.set("paymentMethod", "cash");
      order.set("paymentStatus", "unpaid");
      order.set("note", orderNote.trim());

      const acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(true);
      order.setACL(acl);

      const savedOrder = await order.save(null, { useMasterKey: false });

      const TableOrderItem = Parse.Object.extend("TableOrderItem");
      await Promise.all(cart.map(c => {
        const oi = new TableOrderItem();
        oi.set("order", savedOrder);
        oi.set("menuItemId", c.item.id);
        oi.set("menuItemName", c.item.name);
        oi.set("quantity", c.quantity);
        oi.set("unitPrice", c.item.price);
        oi.set("note", c.note);
        const itemAcl = new Parse.ACL();
        itemAcl.setPublicReadAccess(true);
        itemAcl.setPublicWriteAccess(true);
        oi.setACL(itemAcl);
        return oi.save(null, { useMasterKey: false });
      }));
      return savedOrder;
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => toast({ variant: "destructive", title: "送出失敗", description: err.message }),
  });

  const grouped = menuItems.reduce((acc, item) => {
    const cat = item.category || "一般";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItemData[]>);

  const totalAmount = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const totalCount = cart.reduce((s, c) => s + c.quantity, 0);

  function handleAdd(item: MenuItemData) {
    setNoteItem(item);
    setNoteText("");
  }

  function confirmAdd() {
    if (!noteItem) return;
    setCart(prev => {
      const existing = prev.find(c => c.item.id === noteItem.id && c.note === noteText);
      if (existing) return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item: noteItem, quantity: 1, note: noteText }];
    });
    toast({ title: "已加入訂單", description: noteItem.name });
    setNoteItem(null);
  }

  function changeQty(index: number, delta: number) {
    setCart(prev =>
      prev.map((c, i) => i === index ? { ...c, quantity: c.quantity + delta } : c)
         .filter(c => c.quantity > 0)
    );
  }

  // ── 送出成功畫面 ────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col">
        <PublicNavbar vendorName={vendor?.name} tableName={tableName} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-5" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">訂單已送出！</h2>
            <p className="text-gray-500 mb-1">
              桌號：<span className="font-semibold text-orange-600">{tableName || "未指定"}</span>
            </p>
            <p className="text-gray-500">請稍候，我們將盡快為您備餐 🍱</p>
          </div>
        </div>
      </div>
    );
  }

  // ── 載入中 ──────────────────────────────────────────────────────
  if (loadingVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">載入菜單中...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-muted-foreground">
        找不到此店家
      </div>
    );
  }

  // ── 主頁面 ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <PublicNavbar vendorName={vendor.name} tableName={tableName} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* 店家資訊 */}
        <div className="rounded-2xl overflow-hidden mb-5 shadow-sm">
          <div className="h-40 bg-gradient-to-br from-orange-200 to-amber-200 relative">
            {vendor.coverImage ? (
              <img src={vendor.coverImage} alt={vendor.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">🍱</div>
            )}
            {tableName && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-orange-500 text-white text-sm px-3 py-1 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> 桌號：{tableName}
                </Badge>
              </div>
            )}
          </div>
          <div className="bg-white px-4 py-3 border border-t-0 rounded-b-2xl">
            <h2 className="text-xl font-bold text-gray-800">{vendor.name}</h2>
            {vendor.description && <p className="text-sm text-muted-foreground mt-0.5">{vendor.description}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {vendor.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vendor.address}</span>}
              {vendor.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{vendor.phone}</span>}
            </div>
          </div>
        </div>

        {/* 現場點餐提示 */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700 mb-5 flex items-center gap-2">
          <span className="text-lg">🪑</span>
          <span>現場點餐・用餐後現金付款・無需登入</span>
        </div>

        {/* 菜單列表 */}
        {loadingMenu ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse shadow-sm" />)}
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">此店家尚未上架菜單</div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2 px-1 uppercase tracking-wide">{category}</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <Card key={item.id} className="overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍱</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800">{item.name}</div>
                        {item.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</div>}
                        <div className="text-orange-600 font-bold mt-1">NT$ {item.price}</div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl w-9 h-9 p-0 flex-shrink-0"
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
      </main>

      {/* 浮動購物車按鈕 */}
      {totalCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
          <Button
            className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 text-white shadow-xl rounded-full py-3 flex items-center justify-between px-5"
            onClick={() => setShowCheckout(true)}
          >
            <span className="bg-white/30 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
              {totalCount}
            </span>
            <span className="font-semibold flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" /> 確認訂單
            </span>
            <span className="font-bold">NT$ {totalAmount}</span>
          </Button>
        </div>
      )}

      {/* 加入備註彈窗 */}
      <Dialog open={!!noteItem} onOpenChange={() => setNoteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>加入訂單</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🍱</div>
              <div>
                <div className="font-semibold">{noteItem?.name}</div>
                <div className="text-orange-600 font-bold">NT$ {noteItem?.price}</div>
              </div>
            </div>
            <div>
              <Label className="text-sm">備註（選填）</Label>
              <Input
                placeholder="例：不要辣、少油..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteItem(null)}>取消</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={confirmAdd}>
              加入訂單
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 結帳彈窗 */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" /> 確認訂單
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* 品項清單 */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              {cart.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.item.name}</div>
                    {c.note && <div className="text-xs text-muted-foreground">{c.note}</div>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => changeQty(i, -1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-medium">{c.quantity}</span>
                    <button
                      onClick={() => changeQty(i, 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-orange-600 font-semibold w-16 text-right flex-shrink-0">
                    NT$ {c.item.price * c.quantity}
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 flex justify-between font-bold">
                <span>合計</span>
                <span className="text-orange-600">NT$ {totalAmount}</span>
              </div>
            </div>

            {/* 顧客資料 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">顧客資料</p>
              <div>
                <Label className="text-sm">姓名 *</Label>
                <Input
                  placeholder="請輸入姓名"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">電話 *</Label>
                <Input
                  placeholder="請輸入電話號碼"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  type="tel"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">備註（選填）</Label>
                <Input
                  placeholder="其他備注..."
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* 付款方式提示 */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700 flex items-center gap-2">
              <span>💵</span>
              <span>
                {tableName ? `桌號 ${tableName}・` : ""}用餐後現金付款
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
              繼續點餐
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || !customerName.trim() || !customerPhone.trim()}
            >
              {submitMutation.isPending ? "送出中..." : "送出訂單"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 公開頁面專用 Navbar（不需登入） ─────────────────────────────
function PublicNavbar({ vendorName, tableName }: { vendorName?: string; tableName: string }) {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍱</span>
          <div>
            <div className="font-bold text-gray-800 leading-tight text-sm sm:text-base">
              {vendorName ?? "嘉大便當預訂"}
            </div>
            <div className="text-xs text-muted-foreground">嘉大便當預訂平台</div>
          </div>
        </div>
        {tableName && (
          <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-sm px-3 py-1 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" /> 桌號 {tableName}
          </Badge>
        )}
      </div>
    </nav>
  );
}
