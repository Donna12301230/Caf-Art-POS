import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard } from "lucide-react";
import Layout from "@/components/Layout";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "付款失敗",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "付款成功",
        description: "感謝您的購買！",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>完成付款</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border rounded-lg p-4">
            <PaymentElement />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isProcessing}
            data-testid="button-submit-payment"
          >
            {isProcessing ? '處理中...' : '完成付款'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回 POS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);

  useEffect(() => {
    // In a real implementation, you would get the order details from props or context
    // For now, we'll simulate an order
    const simulatedTotal = 16.76;
    setOrderTotal(simulatedTotal);
    
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: simulatedTotal 
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
      });
  }, []);

  if (!clientSecret) {
    return (
      <Layout>
        <div className="p-6 min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" aria-label="Loading"/>
            <p className="text-muted-foreground">準備結帳.....</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Layout>
      <div className="p-6 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">結帳</h1>
          <p className="text-muted-foreground">完成您的訂單付款</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>訂單摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">特色拿鐵</span>
                  <span>$4.50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">經典卡布奇諾 x2</span>
                  <span>$8.50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">冷萃咖啡</span>
                  <span>$4.25</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">小計:</span>
                  <span>$17.25</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">折扣:</span>
                  <span className="text-green-600">-$1.73</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">稅金:</span>
                  <span>$1.24</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>合計:</span>
                  <span className="text-primary" data-testid="text-order-total">
                    ${orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          </div>
        </div>
      </div>
    </Layout>
  );
}
