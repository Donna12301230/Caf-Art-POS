import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Smartphone 
} from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: any;
  specialInstructions?: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateItem: (id: string, updates: Partial<CartItem>) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export default function ShoppingCart({ 
  items, 
  onUpdateItem, 
  onRemoveItem, 
  onClearCart 
}: ShoppingCartProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const { toast } = useToast();

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax - discount;

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        paymentMethod,
        orderType: 'dine_in',
        tableNumber: '7',
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price.toFixed(2),
          totalPrice: (item.price * item.quantity).toFixed(2),
          options: item.options,
          specialInstructions: item.specialInstructions,
        })),
      };

      if (paymentMethod === 'card') {
        // Create payment intent for card payments
        const paymentResponse = await apiRequest('POST', '/api/create-payment-intent', {
          amount: total,
        });
        const { clientSecret } = await paymentResponse.json();
        
        // In a real app, you would redirect to Stripe checkout
        // For now, we'll simulate successful payment
        orderData.paymentStatus = 'completed';
      } else {
        orderData.paymentStatus = 'completed';
      }

      return apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Order has been processed successfully!",
      });
      onClearCart();
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyCoupon = () => {
    if (couponCode.toLowerCase() === 'student') {
      setDiscount(subtotal * 0.1); // 10% student discount
      toast({
        title: "Coupon Applied",
        description: "Student discount (10%) applied successfully!",
      });
    } else {
      toast({
        title: "Invalid Coupon",
        description: "Please check your coupon code and try again.",
        variant: "destructive",
      });
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setCouponCode('');
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
  ] as const;

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col">
      {/* Cart Header */}
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Current Order</h3>
          <Badge variant="secondary" data-testid="text-order-number">Order #1847</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Table 7 • Dine In</p>
      </CardHeader>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No items in cart</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
              data-testid={`cart-item-${item.id}`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-foreground" data-testid={`text-item-name-${item.id}`}>
                  {item.name}
                </h4>
                {item.options && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-muted-foreground">Large, Extra Hot</span>
                    <button className="text-xs text-accent hover:text-accent/80">
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                  </div>
                )}
                {item.specialInstructions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: {item.specialInstructions}
                  </p>
                )}
                <p className="text-sm font-semibold text-primary mt-1" data-testid={`text-item-total-${item.id}`}>
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.id}`}>
                  {item.quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateItem(item.id, { quantity: item.quantity + 1 })}
                  data-testid={`button-increase-${item.id}`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveItem(item.id)}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                data-testid={`button-remove-${item.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}

        {/* Add Customer */}
        <div className="border-t border-border pt-4 mt-6">
          <Button 
            variant="outline" 
            className="w-full border-dashed"
            data-testid="button-add-customer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Discount/Coupon */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              data-testid="input-coupon"
            />
            <Button 
              variant="secondary" 
              onClick={applyCoupon}
              data-testid="button-apply-coupon"
            >
              Apply
            </Button>
          </div>
          {discount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Student Discount (10%)</span>
                <button 
                  onClick={removeCoupon}
                  className="text-green-600 hover:text-green-700"
                  data-testid="button-remove-coupon"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      {items.length > 0 && (
        <div className="border-t border-border p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="text-green-600" data-testid="text-discount">-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span data-testid="text-tax">${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary" data-testid="text-total">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg transition-colors text-center ${
                      paymentMethod === method.id
                        ? 'border-2 border-primary bg-primary/10 text-primary'
                        : 'border border-border hover:border-primary hover:bg-primary/10 hover:text-primary'
                    }`}
                    data-testid={`button-payment-${method.id}`}
                  >
                    <Icon className="w-4 h-4 mb-1 mx-auto" />
                    <div className="text-xs">{method.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full coffee-gradient text-white hover:opacity-90 transition-opacity"
              onClick={() => processPaymentMutation.mutate()}
              disabled={processPaymentMutation.isPending}
              data-testid="button-process-payment"
            >
              {processPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="secondary"
                data-testid="button-save-order"
              >
                Save Order
              </Button>
              <Button 
                variant="outline" 
                onClick={onClearCart}
                data-testid="button-clear-cart"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
