import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Minus, Trash2, UserPlus, CreditCard, Banknote, Smartphone, X, UtensilsCrossed, ShoppingBag
} from "lucide-react";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Parse from "@/lib/parseClient";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: { size?: string; temperature?: string; addOns?: string[] };
  specialInstructions?: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateItem: (id: string, updates: Partial<CartItem>) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const SIZE_LABEL: Record<string, string> = { small: '小杯', medium: '中杯', large: '大杯' };
const TEMP_LABEL: Record<string, string> = { hot: '熱', iced: '冰' };
const ADDON_LABEL: Record<string, string> = {
  'extra-shot': '加濃', decaf: '低咖啡因', 'oat-milk': '燕麥奶', 'extra-hot': '特熱',
};

export default function ShoppingCart({
  items, onUpdateItem, onRemoveItem, onClearCart, isOpen = false, onClose,
}: ShoppingCartProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [orderType, setOrderType] = useState<'內用' | '外帶'>('內用');
  const [tableNumber, setTableNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orderNumber = useMemo(() => `ORD-${Date.now().toString().slice(-6)}`, []);

  const { data: customerResults } = useQuery({
    queryKey: ["customerSearch", customerSearch],
    queryFn: async () => {
      const q = new Parse.Query("Customer");
      q.startsWith("name", customerSearch);
      q.limit(5);
      return (await q.find()).map(c => ({ id: c.id as string, name: c.get("name") as string, phone: c.get("phone") as string }));
    },
    enabled: showCustomerPicker && customerSearch.length > 0,
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax      = subtotal * 0.05;   // 台灣稅率 5%
  const total    = subtotal + tax - discount;

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      const order = new Parse.Object("Order");
      order.set("orderNumber", orderNumber);
      order.set("subtotal",     subtotal.toFixed(2));
      order.set("tax",          tax.toFixed(2));
      order.set("discount",     discount.toFixed(2));
      order.set("total",        total.toFixed(2));
      order.set("paymentMethod", paymentMethod === 'cash' ? '現金' : paymentMethod === 'card' ? '刷卡' : '行動支付');
      order.set("paymentStatus", "completed");
      order.set("orderStatus",   "pending");
      order.set("orderType",     orderType);
      if (orderType === '內用' && tableNumber) order.set("tableNumber", tableNumber);
      const currentUser = Parse.User.current();
      if (currentUser) order.set("cashierId", currentUser.id);
      if (selectedCustomer) {
        order.set("customer", Parse.Object.fromJSON({ className: "Customer", objectId: selectedCustomer.id }));
      }

      const savedOrder = await order.save();

      await Promise.all(items.map(item => {
        const oi = new Parse.Object("OrderItem");
        oi.set("orderId",       savedOrder.id);
        oi.set("productId",     item.productId);
        oi.set("productName",   item.name);
        oi.set("quantity",      item.quantity);
        oi.set("unitPrice",     item.price.toFixed(2));
        oi.set("totalPrice",    (item.price * item.quantity).toFixed(2));
        if (item.options) oi.set("options", item.options);
        if (item.specialInstructions) oi.set("specialInstructions", item.specialInstructions);
        return oi.save();
      }));

      // Update loyalty points & totalSpent if customer is linked
      if (selectedCustomer) {
        const custObj = new Parse.Object("Customer");
        custObj.id = selectedCustomer.id;
        custObj.increment("loyaltyPoints", Math.floor(total));
        custObj.increment("totalSpent", parseFloat(total.toFixed(2)));
        await custObj.save();
      }

      return savedOrder;
    },
    onSuccess: () => {
      const pts = selectedCustomer ? `，已累積 ${Math.floor(total)} 點` : '';
      toast({ title: "✅ 付款成功", description: `訂單 ${orderNumber} 已建立${pts}！` });
      queryClient.invalidateQueries({ queryKey: ["parseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["parseTodaysOrders"] });
      queryClient.invalidateQueries({ queryKey: ["parsePendingOrderCount"] });
      queryClient.invalidateQueries({ queryKey: ["parseCustomers"] });
      setSelectedCustomer(null);
      setShowCustomerPicker(false);
      setCustomerSearch('');
      onClearCart();
      onClose?.();
    },
    onError: (error: Error) => {
      toast({ title: "付款失敗", description: error.message, variant: "destructive" });
    },
  });

  const applyCoupon = () => {
    if (couponCode.toLowerCase() === 'student') {
      setDiscount(subtotal * 0.1);
      toast({ title: "優惠券已套用", description: "學生折扣 10% 已套用" });
    } else {
      toast({ title: "優惠券無效", description: "請確認代碼後再試", variant: "destructive" });
    }
  };

  const formatOptions = (options: CartItem['options']) => {
    if (!options) return null;
    const parts: string[] = [];
    if (options.size) parts.push(SIZE_LABEL[options.size] ?? options.size);
    if (options.temperature) parts.push(TEMP_LABEL[options.temperature] ?? options.temperature);
    if (options.addOns?.length) parts.push(...options.addOns.map(a => ADDON_LABEL[a] ?? a));
    return parts.length ? parts.join(' · ') : null;
  };

  const paymentMethods = [
    { id: 'cash',   label: '現金', icon: Banknote },
    { id: 'card',   label: '刷卡', icon: CreditCard },
    { id: 'mobile', label: '行動', icon: Smartphone },
  ] as const;

  const cartContent = (
    <>
      {/* Header */}
      <CardHeader className="border-b border-border py-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">目前訂單</h3>
            <p className="text-xs text-muted-foreground">{orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 內用 / 外帶 */}
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              {(['內用', '外帶'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`px-2 py-1 flex items-center gap-1 transition-colors ${
                    orderType === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  {t === '內用' ? <UtensilsCrossed className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                  {t}
                </button>
              ))}
            </div>
            {onClose && (
              <button onClick={onClose} className="md:hidden p-1 rounded hover:bg-muted" aria-label="關閉">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* 桌號 (僅內用) */}
        {orderType === '內用' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">桌號</span>
            <Input
              className="h-7 text-xs w-20"
              placeholder="e.g. 5"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div>
        )}
      </CardHeader>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>尚未加入任何品項</p>
            <p className="text-xs mt-1">點擊左側產品加入訂單</p>
          </div>
        ) : (
          items.map((item) => {
            const optStr = formatOptions(item.options);
            return (
              <div key={item.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg" data-testid={`cart-item-${item.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid={`text-item-name-${item.id}`}>{item.name}</p>
                  {optStr && <p className="text-[11px] text-muted-foreground">{optStr}</p>}
                  {item.specialInstructions && (
                    <p className="text-[11px] text-muted-foreground">備：{item.specialInstructions}</p>
                  )}
                  <p className="text-sm font-semibold text-primary mt-0.5" data-testid={`text-item-total-${item.id}`}>
                    ${(item.price * item.quantity).toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-6 w-6 p-0"
                    onClick={() => item.quantity === 1 ? onRemoveItem(item.id) : onUpdateItem(item.id, { quantity: item.quantity - 1 })}
                    data-testid={`button-decrease-${item.id}`}
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3" />}
                  </Button>
                  <span className="w-5 text-center text-sm font-medium" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                  <Button size="sm" variant="outline" className="h-6 w-6 p-0"
                    onClick={() => onUpdateItem(item.id, { quantity: item.quantity + 1 })}
                    data-testid={`button-increase-${item.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* 客戶關聯 */}
        {!showCustomerPicker && !selectedCustomer && (
          <Button variant="outline" className="w-full border-dashed text-xs h-8 mt-2"
            onClick={() => setShowCustomerPicker(true)} data-testid="button-add-customer">
            <UserPlus className="w-3 h-3 mr-1" />關聯會員（累積點數）
          </Button>
        )}
        {selectedCustomer && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg mt-2">
            <UserPlus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-medium flex-1 truncate">{selectedCustomer.name}</span>
            <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-foreground" aria-label="取消關聯">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {showCustomerPicker && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1.5">
              <Input
                autoFocus
                className="h-7 text-xs"
                placeholder="搜尋會員姓名..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                data-testid="input-customer-search"
              />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => { setShowCustomerPicker(false); setCustomerSearch(''); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            {Array.isArray(customerResults) && customerResults.length > 0 && (
              <div className="border border-border rounded-md overflow-hidden">
                {customerResults.map((c) => (
                  <button key={c.id}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 border-b border-border last:border-0 transition-colors"
                    onClick={() => { setSelectedCustomer({ id: c.id, name: c.name }); setShowCustomerPicker(false); setCustomerSearch(''); }}
                    data-testid={`customer-result-${c.id}`}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
            {customerSearch.length > 0 && Array.isArray(customerResults) && customerResults.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-2">找不到會員</p>
            )}
          </div>
        )}

        {/* 優惠券 */}
        <div className="flex gap-2">
          <Input className="h-8 text-xs" placeholder="優惠券代碼（如 student）"
            value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
            data-testid="input-coupon"
          />
          <Button variant="secondary" className="h-8 text-xs px-3" onClick={applyCoupon} data-testid="button-apply-coupon">
            套用
          </Button>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-1.5 text-xs text-green-800">
            <span>學生折扣 10%</span>
            <button onClick={() => { setDiscount(0); setCouponCode(''); }} data-testid="button-remove-coupon">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Summary + Payment */}
      {items.length > 0 && (
        <div className="border-t border-border p-3 space-y-3">
          {/* 金額明細 */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>小計</span><span data-testid="text-subtotal">${subtotal.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>折扣</span><span data-testid="text-discount">-${discount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>稅金 (5%)</span><span data-testid="text-tax">${tax.toFixed(0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>總計</span>
              <span className="text-primary" data-testid="text-total">${total.toFixed(0)}</span>
            </div>
          </div>

          {/* 付款方式 */}
          <div className="grid grid-cols-3 gap-1.5">
            {paymentMethods.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={`py-2 rounded-lg text-xs flex flex-col items-center gap-0.5 border transition-colors ${
                  paymentMethod === id
                    ? 'border-2 border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
                data-testid={`button-payment-${id}`}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* 動作按鈕 */}
          <Button
            className="w-full coffee-gradient text-white hover:opacity-90"
            onClick={() => processPaymentMutation.mutate()}
            disabled={processPaymentMutation.isPending}
            data-testid="button-process-payment"
          >
            {processPaymentMutation.isPending ? '處理中...' : `結帳 $${total.toFixed(0)}`}
          </Button>
          <Button variant="outline" className="w-full text-xs h-8" onClick={onClearCart} data-testid="button-clear-cart">
            清除全部
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: fixed right sidebar */}
      <div className="hidden md:flex w-80 lg:w-96 bg-card border-l border-border flex-col">
        {cartContent}
      </div>

      {/* Mobile: bottom sheet */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        {cartContent}
      </div>
    </>
  );
}
