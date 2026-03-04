import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingUp, Plus, Search, Edit, Trash2, Truck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Parse from "@/lib/parseClient";
import { InventoryItemModal } from "@/components/InventoryItemModal";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

const PAGE_SIZE = 15;

function getStatus(current: number, min: number) {
  const ratio = min > 0 ? current / min : 2;
  if (current === 0)   return { label: '無庫存', color: 'bg-red-100 text-red-800',    bar: 'bg-red-500',    level: 0 };
  if (ratio <= 0.5)    return { label: '危急',   color: 'bg-red-100 text-red-800',    bar: 'bg-red-500',    level: Math.round(ratio * 100) };
  if (ratio <= 1)      return { label: '低庫存', color: 'bg-amber-100 text-amber-800',bar: 'bg-amber-500',  level: Math.round(ratio * 100) };
  if (ratio <= 2)      return { label: '尚可',   color: 'bg-blue-100 text-blue-800',  bar: 'bg-blue-500',   level: Math.min(Math.round(ratio * 50), 100) };
  return               { label: '充足',   color: 'bg-green-100 text-green-800', bar: 'bg-green-500',  level: 100 };
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const { toast }   = useToast();
  const queryClient = useQueryClient();

  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ["parseInventoryItems"],
    queryFn: async () => {
      const q = new Parse.Query("InventoryItem");
      q.ascending("name");
      return (await q.find()).map(toPlain);
    },
  });

  const { data: supplierCount = 0 } = useQuery({
    queryKey: ["parseSupplierCount"],
    queryFn: async () => new Parse.Query("Supplier").count(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const obj = new Parse.Object("InventoryItem");
      obj.id = itemId;
      await obj.destroy();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseInventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["parseLowStockCount"] });
      toast({ title: "已刪除庫存項目" });
    },
    onError: (e: Error) => toast({ title: "刪除失敗", description: e.message, variant: "destructive" }),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`確定要刪除「${name}」嗎？`)) deleteMutation.mutate(id);
  };

  // ── helpers ─────────────────────────────────────────────
  const items = Array.isArray(inventoryItems) ? inventoryItems : [];
  const lowStockItems = items.filter((item: any) =>
    parseFloat(item.currentStock ?? 0) <= parseFloat(item.minStockLevel ?? 0)
  );
  const totalValue = items.reduce((sum: number, item: any) =>
    sum + parseFloat(item.currentStock ?? 0) * parseFloat(item.unitCost ?? 0), 0
  );

  const filterTabs = [
    { id: 'all',      label: '全部',   count: items.length },
    { id: 'low',      label: '需補貨', count: lowStockItems.length },
    { id: 'ok',       label: '狀態正常', count: items.length - lowStockItems.length },
  ];

  const filteredItems = items.filter((item: any) => {
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const current = parseFloat(item.currentStock ?? 0);
    const min     = parseFloat(item.minStockLevel ?? 0);
    const isLow   = current <= min;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'low' && isLow) || (filterStatus === 'ok' && !isLow);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = [
    { label: '庫存品項',  value: items.length,              sub: '追蹤中',             icon: Package,       color: 'text-blue-600' },
    { label: '低/無庫存', value: lowStockItems.length,      sub: lowStockItems.length > 0 ? '需補貨' : '狀態正常',  icon: AlertTriangle,  color: lowStockItems.length > 0 ? 'text-destructive' : 'text-green-600' },
    { label: '庫存總值',  value: `$${totalValue.toFixed(0)}`, sub: '按成本估算',        icon: TrendingUp,    color: 'text-green-600' },
    { label: '供應商',    value: supplierCount,              sub: '合作廠商數',          icon: Truck,         color: 'text-purple-600' },
  ];

  if (isLoading) return (
    <Layout>
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-2 md:p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">庫存管理</h2>
            <p className="text-xs md:text-sm text-muted-foreground">追蹤和管理原料與耗材</p>
          </div>
          <Button size="sm" data-testid="button-add-inventory" onClick={() => { setEditingItem(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-1" />新增項目
          </Button>
        </div>

        {/* Low stock alert */}
        {lowStockItems.length > 0 && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span><strong>{lowStockItems.length}</strong> 個項目庫存偏低，請儘快補貨</span>
            <button className="ml-auto text-xs underline" onClick={() => { setFilterStatus('low'); setCurrentPage(1); }}>
              查看
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search + Filter tabs */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜尋庫存名稱..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            data-testid="input-search-inventory"
          />
        </div>

        <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg w-fit">
          {filterTabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => { setFilterStatus(id); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'
              }`}
            >
              {label}
              <span className={`text-[10px] rounded-full px-1.5 ${filterStatus === id ? 'bg-white/20' : 'bg-muted-foreground/20'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Table (desktop) */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm">
              庫存品項
              <span className="ml-2 font-normal text-muted-foreground text-xs">共 {filteredItems.length} 筆</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {['品項', '目前庫存', '最低庫存', '單位', '單價', '總值', '狀態', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        {searchQuery ? '找不到符合的品項' : '尚無庫存資料'}
                      </td>
                    </tr>
                  ) : pagedItems.map((item: any) => {
                    const current   = parseFloat(item.currentStock ?? 0);
                    const min       = parseFloat(item.minStockLevel ?? 0);
                    const unitCost  = parseFloat(item.unitCost ?? 0);
                    const status    = getStatus(current, min);
                    return (
                      <tr key={item.id} className="hover:bg-muted/50" data-testid={`row-inventory-${item.id}`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium" data-testid={`text-item-name-${item.id}`}>{item.name}</p>
                          {item.supplier && <p className="text-xs text-muted-foreground">{item.supplier}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold" data-testid={`text-current-stock-${item.id}`}>{current.toFixed(1)}</p>
                          {/* mini progress bar */}
                          <div className="w-16 h-1 bg-muted rounded-full mt-1">
                            <div className={`h-1 rounded-full ${status.bar}`} style={{ width: `${status.level}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{min.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.unit || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">${unitCost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-semibold">${(current * unitCost).toFixed(0)}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-0.5">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`button-edit-${item.id}`} onClick={() => { setEditingItem(item); setShowModal(true); }}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id, item.name)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {pagedItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {searchQuery ? '找不到符合的品項' : '尚無庫存資料'}
                </p>
              ) : pagedItems.map((item: any) => {
                const current  = parseFloat(item.currentStock ?? 0);
                const min      = parseFloat(item.minStockLevel ?? 0);
                const unitCost = parseFloat(item.unitCost ?? 0);
                const status   = getStatus(current, min);
                return (
                  <div key={item.id} className="flex items-center px-3 py-2.5 gap-3" data-testid={`row-inventory-${item.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-medium">{item.name}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${status.color}`}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>現有 <strong className="text-foreground">{current.toFixed(1)}</strong> {item.unit || ''}</span>
                        <span>/ 最低 {min.toFixed(1)}</span>
                      </div>
                      <div className="w-24 h-1 bg-muted rounded-full mt-1">
                        <div className={`h-1 rounded-full ${status.bar}`} style={{ width: `${status.level}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">${(current * unitCost).toFixed(0)}</p>
                      <p className="text-[11px] text-muted-foreground">${unitCost.toFixed(2)}/{item.unit || '單位'}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {filteredItems.length > PAGE_SIZE && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} 筆，共 {filteredItems.length} 筆
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>上一頁</Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <Button key={p} size="sm" variant={p === currentPage ? "default" : "outline"} onClick={() => setCurrentPage(p)}>{p}</Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一頁</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InventoryItemModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingItem}
      />
    </Layout>
  );
}
