import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import VendorLayout from "@/components/VendorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Settings, QrCode, Plus, Trash2, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function VendorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [newTable, setNewTable] = useState("");

  const { data: vendorObj, isLoading } = useQuery({
    queryKey: ["myVendor", user?.id],
    queryFn: async () => {
      const q = new Parse.Query("Vendor");
      q.equalTo("owner", Parse.User.current());
      return q.first();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (vendorObj) {
      setName(vendorObj.get("name") ?? "");
      setDescription(vendorObj.get("description") ?? "");
      setAddress(vendorObj.get("address") ?? "");
      setPhone(vendorObj.get("phone") ?? "");
    }
  }, [vendorObj]);

  const tables: string[] = vendorObj?.get("tables") ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!vendorObj) throw new Error("找不到店家資料");
      vendorObj.set("name", name);
      vendorObj.set("description", description);
      vendorObj.set("address", address);
      vendorObj.set("phone", phone);
      return vendorObj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVendor", user?.id] });
      toast({ title: "儲存成功" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "儲存失敗", description: err.message }),
  });

  const addTableMutation = useMutation({
    mutationFn: async (tableName: string) => {
      if (!vendorObj) throw new Error("找不到店家資料");
      const current: string[] = vendorObj.get("tables") ?? [];
      if (current.includes(tableName)) throw new Error("桌位名稱已存在");
      vendorObj.set("tables", [...current, tableName]);
      return vendorObj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVendor", user?.id] });
      setNewTable("");
      toast({ title: "桌位已新增" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "新增失敗", description: err.message }),
  });

  const removeTableMutation = useMutation({
    mutationFn: async (tableName: string) => {
      if (!vendorObj) throw new Error("找不到店家資料");
      const current: string[] = vendorObj.get("tables") ?? [];
      vendorObj.set("tables", current.filter(t => t !== tableName));
      return vendorObj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVendor", user?.id] });
      toast({ title: "桌位已刪除" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "刪除失敗", description: err.message }),
  });

  function getMenuUrl(tableName: string) {
    const base = window.location.origin;
    return `${base}/menu/${vendorObj?.id}?table=${encodeURIComponent(tableName)}`;
  }

  function downloadQR(tableName: string) {
    const canvas = document.getElementById(`qr-${tableName}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${vendorObj?.get("name") ?? "table"}-${tableName}.png`;
    a.click();
  }

  if (isLoading) return (
    <VendorLayout>
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </VendorLayout>
  );

  return (
    <VendorLayout>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-orange-500" /> 店家設定
      </h2>

      <div className="max-w-lg space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">基本資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>店家名稱 *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label>店家簡介</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>地址</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>聯絡電話</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name}
            >
              {saveMutation.isPending ? "儲存中..." : "儲存設定"}
            </Button>
          </CardContent>
        </Card>

        {/* Table QR Code management */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="w-4 h-4 text-orange-500" /> 桌位 QR Code 管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add table */}
            <div className="flex gap-2">
              <Input
                placeholder="桌位名稱（如：A1、戶外1）"
                value={newTable}
                onChange={e => setNewTable(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newTable.trim()) addTableMutation.mutate(newTable.trim()); }}
              />
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                onClick={() => { if (newTable.trim()) addTableMutation.mutate(newTable.trim()); }}
                disabled={addTableMutation.isPending || !newTable.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Table list */}
            {tables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">尚未建立桌位，請新增桌位名稱</p>
            ) : (
              <div className="space-y-4">
                {tables.map(tableName => (
                  <div key={tableName} className="border rounded-xl p-4 flex flex-col items-center gap-3">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">桌號：{tableName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeTableMutation.mutate(tableName)}
                        disabled={removeTableMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <QRCodeCanvas
                      id={`qr-${tableName}`}
                      value={getMenuUrl(tableName)}
                      size={160}
                      level="M"
                      includeMargin
                    />
                    <div className="text-xs text-muted-foreground text-center break-all px-2">
                      {getMenuUrl(tableName)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadQR(tableName)}
                    >
                      <Download className="w-4 h-4 mr-1" /> 下載 QR Code
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
