import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Parse from "@/lib/parseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null;
}

const EMPTY = {
  name: "", price: "", description: "", categoryId: "",
  imageUrl: "", stockQuantity: "", lowStockThreshold: "5",
  isLimited: false, isActive: true,
};

export function ProductModal({ isOpen, onClose, initialData }: Props) {
  const isEdit = !!initialData;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: categories } = useQuery({
    queryKey: ["parseCategories"],
    queryFn: async () => (await new Parse.Query("Category").find()).map(toPlain),
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        price: String(initialData.price ?? ""),
        description: initialData.description ?? "",
        categoryId: initialData.categoryId?.objectId ?? initialData.categoryId?.id ?? "",
        imageUrl: initialData.imageUrl ?? "",
        stockQuantity: initialData.stockQuantity != null ? String(initialData.stockQuantity) : "",
        lowStockThreshold: String(initialData.lowStockThreshold ?? 5),
        isLimited: !!initialData.isLimited,
        isActive: initialData.isActive !== false,
      });
    } else {
      setForm(EMPTY);
    }
  }, [isOpen, initialData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const obj = new Parse.Object("Product");
      if (isEdit) obj.id = initialData.id;
      obj.set("name", form.name.trim());
      obj.set("price", parseFloat(form.price));
      obj.set("description", form.description.trim() || undefined);
      obj.set("imageUrl", form.imageUrl.trim() || undefined);
      obj.set("lowStockThreshold", parseInt(form.lowStockThreshold) || 5);
      obj.set("isLimited", form.isLimited);
      obj.set("isActive", form.isActive);
      if (form.stockQuantity !== "") obj.set("stockQuantity", parseFloat(form.stockQuantity));
      if (form.categoryId) {
        obj.set("categoryId", Parse.Object.fromJSON({ className: "Category", objectId: form.categoryId }));
      }
      await obj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseProducts"] });
      toast({ title: isEdit ? "產品已更新" : "產品已新增" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "儲存失敗", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast({ title: "請填寫必填欄位（名稱、價格）", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯產品" : "新增產品"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>名稱 *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="產品名稱" />
            </div>
            <div className="space-y-1">
              <Label>價格 *</Label>
              <Input type="number" min="0" step="1" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>類別</Label>
              <Select value={form.categoryId} onValueChange={v => set("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇類別" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="產品描述" rows={2} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>圖片網址</Label>
              <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>庫存數量</Label>
              <Input type="number" min="0" value={form.stockQuantity} onChange={e => set("stockQuantity", e.target.value)} placeholder="（不追蹤）" />
            </div>
            <div className="space-y-1">
              <Label>低庫存門檻</Label>
              <Input type="number" min="0" value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", e.target.value)} placeholder="5" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="prod-isLimited" checked={form.isLimited} onChange={e => set("isLimited", e.target.checked)} className="w-4 h-4 cursor-pointer" />
              <Label htmlFor="prod-isLimited" className="cursor-pointer">限量商品</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="prod-isActive" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 cursor-pointer" />
              <Label htmlFor="prod-isActive" className="cursor-pointer">上架中</Label>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>取消</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
