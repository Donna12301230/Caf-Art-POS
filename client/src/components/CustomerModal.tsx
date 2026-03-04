import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Parse from "@/lib/parseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null;
}

const EMPTY = {
  name: "", email: "", phone: "", loyaltyPoints: "0", totalSpent: "0", notes: "",
};

export function CustomerModal({ isOpen, onClose, initialData }: Props) {
  const isEdit = !!initialData;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        loyaltyPoints: String(initialData.loyaltyPoints ?? 0),
        totalSpent: String(initialData.totalSpent ?? 0),
        notes: initialData.notes ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [isOpen, initialData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const obj = new Parse.Object("Customer");
      if (isEdit) obj.id = initialData.id;
      obj.set("name", form.name.trim());
      obj.set("email", form.email.trim() || undefined);
      obj.set("phone", form.phone.trim() || undefined);
      obj.set("loyaltyPoints", parseInt(form.loyaltyPoints) || 0);
      obj.set("totalSpent", parseFloat(form.totalSpent) || 0);
      obj.set("notes", form.notes.trim() || undefined);
      await obj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCustomers"] });
      toast({ title: isEdit ? "客戶資料已更新" : "客戶已新增" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "儲存失敗", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "請填寫客戶姓名", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯客戶" : "新增客戶"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label>姓名 *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="客戶姓名" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label>電話</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0912-345-678" />
            </div>
            <div className="space-y-1">
              <Label>忠誠點數</Label>
              <Input type="number" min="0" value={form.loyaltyPoints} onChange={e => set("loyaltyPoints", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>累積消費</Label>
              <Input type="number" min="0" step="0.01" value={form.totalSpent} onChange={e => set("totalSpent", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>備註</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="客戶備註..." rows={2} />
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
