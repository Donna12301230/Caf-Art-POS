import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Parse from "@/lib/parseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null;
}

const EMPTY = {
  name: "", style: "", email: "", bio: "", commissionRate: "30",
  status: "pending", imageUrl: "",
};

export function ArtistModal({ isOpen, onClose, initialData }: Props) {
  const isEdit = !!initialData;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        style: initialData.style ?? "",
        email: initialData.email ?? "",
        bio: initialData.bio ?? "",
        commissionRate: String(initialData.commissionRate ?? 30),
        status: initialData.status ?? "pending",
        imageUrl: initialData.imageUrl ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [isOpen, initialData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const obj = new Parse.Object("Artist");
      if (isEdit) obj.id = initialData.id;
      obj.set("name", form.name.trim());
      obj.set("style", form.style.trim() || undefined);
      obj.set("email", form.email.trim() || undefined);
      obj.set("bio", form.bio.trim() || undefined);
      obj.set("commissionRate", parseFloat(form.commissionRate) || 30);
      obj.set("status", form.status);
      obj.set("imageUrl", form.imageUrl.trim() || undefined);
      await obj.save();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseArtists"] });
      queryClient.invalidateQueries({ queryKey: ["parseArtistsCount"] });
      queryClient.invalidateQueries({ queryKey: ["parseTopArtists"] });
      toast({ title: isEdit ? "藝術家資料已更新" : "藝術家已新增" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "儲存失敗", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "請填寫藝術家姓名", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯藝術家" : "新增藝術家"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label>姓名 *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="藝術家姓名" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>風格</Label>
              <Input value={form.style} onChange={e => set("style", e.target.value)} placeholder="水彩 / 插畫..." />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label>佣金比例 (%)</Label>
              <Input type="number" min="0" max="100" step="1" value={form.commissionRate} onChange={e => set("commissionRate", e.target.value)} placeholder="30" />
            </div>
            <div className="space-y-1">
              <Label>狀態</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待審核</SelectItem>
                  <SelectItem value="approved">已核准</SelectItem>
                  <SelectItem value="rejected">已拒絕</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>大頭貼網址</Label>
            <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label>簡介</Label>
            <Textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="藝術家簡介..." rows={3} />
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
