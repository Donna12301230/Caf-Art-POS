import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Parse from "@/lib/parseClient";
import VendorLayout from "@/components/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { MenuItemData } from "@/types";

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

const EMPTY_FORM = { name: "", description: "", price: "", category: "一般", isAvailable: true };

export default function VendorMenu() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: vendorObj } = useQuery({
    queryKey: ["myVendor", user?.id],
    queryFn: async () => {
      const q = new Parse.Query("Vendor");
      q.equalTo("owner", Parse.User.current());
      return q.first();
    },
    enabled: !!user,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["vendorMenu", vendorObj?.id],
    queryFn: async () => {
      if (!vendorObj) return [];
      const q = new Parse.Query("MenuItem");
      q.equalTo("vendor", vendorObj);
      q.ascending("category");
      const results = await q.find();
      return results.map(toMenuItem);
    },
    enabled: !!vendorObj,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!vendorObj) throw new Error("找不到店家資料");
      const obj = editId
        ? Parse.Object.fromJSON({ __type: "Object", className: "MenuItem", objectId: editId }) as Parse.Object
        : new Parse.Object("MenuItem");
      obj.set("name", form.name);
      obj.set("description", form.description);
      obj.set("price", Number(form.price));
      obj.set("category", form.category);
      obj.set("isAvailable", form.isAvailable);
      if (!editId) obj.set("vendor", vendorObj);
      return obj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorMenu", vendorObj?.id] });
      setDialogOpen(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      toast({ title: editId ? "已更新" : "已新增", description: form.name });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "儲存失敗", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const obj = Parse.Object.fromJSON({ __type: "Object", className: "MenuItem", objectId: id }) as Parse.Object;
      return obj.destroy();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorMenu", vendorObj?.id] });
      toast({ title: "已刪除" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "刪除失敗", description: err.message }),
  });

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: MenuItemData) {
    setEditId(item.id);
    setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, isAvailable: item.isAvailable });
    setDialogOpen(true);
  }

  return (
    <VendorLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">菜單管理</h2>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> 新增品項
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>尚無菜單品項，點擊上方按鈕新增</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    {!item.isAvailable && <Badge variant="secondary" className="text-xs">已下架</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                  <div className="text-orange-600 font-semibold text-sm">NT$ {item.price}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500"
                    onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "編輯品項" : "新增品項"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>名稱 *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>說明</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>價格 (NT$) *</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <Label>分類</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例：便當、湯品" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={form.isAvailable}
                onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="isAvailable">上架販售</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name || !form.price}
            >
              {saveMutation.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  );
}
