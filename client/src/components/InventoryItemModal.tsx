import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Parse from "@/lib/parseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null;
}

const EMPTY = {
  name: "", currentStock: "", minStockLevel: "", unit: "", unitCost: "", supplier: "",
};

export function InventoryItemModal({ isOpen, onClose, initialData }: Props) {
  const isEdit = !!initialData;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        currentStock: String(initialData.currentStock ?? ""),
        minStockLevel: String(initialData.minStockLevel ?? ""),
        unit: initialData.unit ?? "",
        unitCost: String(initialData.unitCost ?? ""),
        supplier: initialData.supplier ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [isOpen, initialData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const obj = new Parse.Object("InventoryItem");
      if (isEdit) obj.id = initialData.id;
      obj.set("name", form.name.trim());
      obj.set("currentStock", parseFloat(form.currentStock) || 0);
      obj.set("minStockLevel", parseFloat(form.minStockLevel) || 0);
      obj.set("unit", form.unit.trim() || undefined);
      obj.set("unitCost", parseFloat(form.unitCost) || 0);
      obj.set("supplier", form.supplier.trim() || undefined);
      await obj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseInventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["parseLowStockCount"] });
      toast({ title: isEdit ? "庫存項目已更新" : "庫存項目已新增" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "儲存失敗", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.currentStock === "" || form.minStockLevel === "") {
      toast({ title: "請填寫必填欄位（名稱、目前庫存、最低庫存）", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯庫存項目" : "新增庫存項目"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label>名稱 *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="品項名稱" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>目前庫存 *</Label>
              <Input type="number" min="0" step="0.1" value={form.currentStock} onChange={e => set("currentStock", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>最低庫存 *</Label>
              <Input type="number" min="0" step="0.1" value={form.minStockLevel} onChange={e => set("minStockLevel", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>單位</Label>
              <Input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="kg / L / 個" />
            </div>
            <div className="space-y-1">
              <Label>單價</Label>
              <Input type="number" min="0" step="0.01" value={form.unitCost} onChange={e => set("unitCost", e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>供應商</Label>
            <Input value={form.supplier} onChange={e => set("supplier", e.target.value)} placeholder="供應商名稱" />
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
