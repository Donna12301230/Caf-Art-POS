import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Store } from "lucide-react";

export default function VendorRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("請先登入");
      const vendor = new Parse.Object("Vendor");
      vendor.set("name", name);
      vendor.set("description", description);
      vendor.set("address", address);
      vendor.set("phone", phone);
      vendor.set("owner", Parse.User.current());
      vendor.set("isApproved", false);
      vendor.set("isActive", false);
      vendor.set("subscriptionStatus", "trial");
      return vendor.save();
    },
    onSuccess: () => {
      toast({ title: "申請已送出", description: "管理員審核通過後即可使用廠商後台。" });
      navigate("/");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "申請失敗", description: err.message });
    },
  });

  return (
    <CustomerLayout>
      <div className="max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-orange-500" /> 申請成為廠商
        </h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">店家資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>店家名稱 *</Label>
              <Input placeholder="例：憶香軒快炒料理" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>店家簡介</Label>
              <Textarea placeholder="介紹您的店家..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>地址</Label>
              <Input placeholder="店家地址" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>聯絡電話</Label>
              <Input placeholder="電話號碼" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
              申請送出後，管理員將於 1-3 個工作天內審核。審核通過後您將能使用廠商後台管理菜單與訂單。
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || !name}
            >
              {applyMutation.isPending ? "送出中..." : "送出申請"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
