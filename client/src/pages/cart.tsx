import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Minus, Plus, Trash2, ShoppingCart, MapPin } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ORDER_UNIT_OPTIONS } from "@/constants/ncyuDepartments";
import { cn } from "@/lib/utils";

// Early bird discount calculation
function calcDiscount(pickupDate: Date, baseTotal: number): { rate: number; amount: number; label: string } {
  const days = differenceInDays(pickupDate, new Date());
  if (days >= 7) return { rate: 0.9, amount: Math.round(baseTotal * 0.1), label: "早鳥 9 折（7 天以上）" };
  if (days >= 3) return { rate: 0.95, amount: Math.round(baseTotal * 0.05), label: "早鳥 95 折（3 天以上）" };
  if (days >= 1) return { rate: 0.98, amount: Math.round(baseTotal * 0.02), label: "早鳥 98 折（1 天以上）" };
  return { rate: 1, amount: 0, label: "當日訂購（原價）" };
}

export default function Cart() {
  const { items, total, updateQuantity, removeItem, clearCart, vendorId } = useCart();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [pickupDate, setPickupDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [pickupLocation, setPickupLocation] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [orderType, setOrderType] = useState<"individual" | "group">("individual");
  const [groupName, setGroupName] = useState("");
  const [calOpen, setCalOpen] = useState(false);

  // Fetch recent pickup locations from past orders
  const { data: recentLocations = [] } = useQuery({
    queryKey: ["recentLocations"],
    queryFn: async () => {
      const q = new Parse.Query("PreOrder");
      q.equalTo("customer", Parse.User.current());
      q.descending("createdAt");
      q.limit(20);
      q.select("pickupLocation");
      const results = await q.find();
      const locs = results.map(r => r.get("pickupLocation") as string).filter(Boolean);
      return [...new Set(locs)]; // unique
    },
    enabled: !!user,
  });

  const discount = pickupDate ? calcDiscount(pickupDate, total) : { rate: 1, amount: 0, label: "" };
  const finalAmount = total - discount.amount;

  // Combine recent locations with static options
  const locationOptions = [
    ...recentLocations,
    "嘉大民雄校區一樓大廳",
    "嘉大蘭潭校區正門口",
    "嘉大新民校區",
    "學生宿舍大廳",
  ].filter((v, i, arr) => arr.indexOf(v) === i); // unique

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!pickupDate) throw new Error("請選擇取餐日期");
      const location = pickupLocation || locationInput;
      if (!location) throw new Error("請填寫取餐地點");
      if (!vendorId) throw new Error("購物車為空");

      const order = new Parse.Object("PreOrder");
      order.set("customer", Parse.User.current());
      order.set("vendor", Parse.Object.fromJSON({ __type: "Object", className: "Vendor", objectId: vendorId }));
      order.set("pickupDate", pickupDate);
      order.set("pickupLocation", location);
      order.set("orderType", orderType);
      order.set("groupName", groupName || undefined);
      order.set("totalAmount", total);
      order.set("discountAmount", discount.amount);
      order.set("finalAmount", finalAmount);
      order.set("status", "pending");
      order.set("paymentMethod", "cash");
      order.set("paymentStatus", "unpaid");

      // Set ACL so only customer + vendor owner can read
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
      if (Parse.User.current()) acl.setReadAccess(Parse.User.current()!, true);
      order.setACL(acl);

      await order.save();

      // Save order items
      const itemSaves = items.map(ci => {
        const oi = new Parse.Object("PreOrderItem");
        oi.set("order", order);
        oi.set("menuItemId", ci.menuItem.id);
        oi.set("menuItemName", ci.menuItem.name);
        oi.set("quantity", ci.quantity);
        oi.set("unitPrice", ci.menuItem.price);
        oi.set("note", ci.note || "");
        return oi.save();
      });
      await Promise.all(itemSaves);

      return order.id;
    },
    onSuccess: () => {
      clearCart();
      toast({ title: "預約成功！", description: "訂單已送出，請記得準時取餐並現場付款。" });
      navigate("/my-orders");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "送出失敗", description: err.message });
    },
  });

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">購物車是空的</h2>
          <p className="text-muted-foreground mb-4">快去選幾道便當吧！</p>
          <Button onClick={() => navigate("/")} className="bg-orange-500 hover:bg-orange-600 text-white">
            瀏覽店家
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <h2 className="text-xl font-bold mb-4">購物車 & 預約資訊</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">訂購項目</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.menuItem.name}</div>
                    {item.note && <div className="text-xs text-muted-foreground">備註：{item.note}</div>}
                    <div className="text-orange-600 text-sm">NT$ {item.menuItem.price} × {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="w-7 h-7"
                      onClick={() => updateQuantity(item.menuItem.id, item.note, item.quantity - 1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="w-7 h-7"
                      onClick={() => updateQuantity(item.menuItem.id, item.note, item.quantity + 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500"
                      onClick={() => removeItem(item.menuItem.id, item.note)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-sm font-medium w-16 text-right">
                    NT$ {item.menuItem.price * item.quantity}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pickup settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">取餐設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pickup date */}
              <div>
                <Label className="mb-1 block">取餐日期 *</Label>
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !pickupDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {pickupDate ? format(pickupDate, "yyyy年M月d日（EEE）", { locale: zhTW }) : "選擇日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={(d) => { setPickupDate(d); setCalOpen(false); }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {pickupDate && (
                  <p className="text-xs text-orange-600 mt-1">
                    距取餐日：{differenceInDays(pickupDate, new Date())} 天 → {discount.label}
                  </p>
                )}
              </div>

              {/* Pickup location */}
              <div>
                <Label className="mb-1 block">取餐地點 *</Label>
                {locationOptions.length > 0 ? (
                  <Select onValueChange={(v) => { if (v === "__custom") { setPickupLocation(""); } else { setPickupLocation(v); setLocationInput(""); } }}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇或自填取餐地點" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                      <SelectItem value="__custom">✏️ 自填其他地點</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {(!pickupLocation || pickupLocation === "") && (
                  <Input
                    className="mt-2"
                    placeholder="例：理工館一樓大廳、宿舍7棟門口..."
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                  />
                )}
              </div>

              {/* Order type */}
              <div>
                <Label className="mb-1 block">訂購性質</Label>
                <Select value={orderType} onValueChange={(v: any) => setOrderType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">個人訂購</SelectItem>
                    <SelectItem value="group">系所 / 團體訂購</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === "group" && (
                <div>
                  <Label className="mb-1 block">單位名稱 / 活動名稱</Label>
                  <Input
                    placeholder="例：資訊管理學系迎新、XX辦公室..."
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">訂單摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">小計</span>
                <span>NT$ {total}</span>
              </div>
              {discount.amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{discount.label}</span>
                  <span>- NT$ {discount.amount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>應付金額</span>
                <span className="text-orange-600">NT$ {finalAmount}</span>
              </div>
              <div className="text-xs text-muted-foreground bg-muted rounded p-2 mt-2">
                💵 付款方式：<b>取餐時現金付款</b>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={submitMutation.isPending || !pickupDate || (!pickupLocation && !locationInput)}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? "送出中..." : "確認預約"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
}
