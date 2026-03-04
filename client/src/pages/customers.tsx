import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search, Star, Mail, Phone, Edit, Trash2, DollarSign, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Parse from "@/lib/parseClient";
import { CustomerModal } from "@/components/CustomerModal";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

const PAGE_SIZE = 12;

const TIERS: { min: number; label: string; color: string }[] = [
  { min: 1000, label: '黃金', color: 'bg-yellow-100 text-yellow-800' },
  { min: 500,  label: '白銀', color: 'bg-gray-100 text-gray-600' },
  { min: 100,  label: '青銅', color: 'bg-amber-100 text-amber-800' },
  { min: 0,    label: '會員', color: 'bg-blue-100 text-blue-800' },
];

function getTier(points: number) {
  return TIERS.find(t => points >= t.min) ?? TIERS[TIERS.length - 1];
}

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
      {initials}
    </div>
  );
}

export default function Customers() {
  const [searchQuery, setSearchQuery]       = useState("");
  const [tierFilter, setTierFilter]         = useState("all");
  const [currentPage, setCurrentPage]       = useState(1);
  const [showModal, setShowModal]           = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const { toast }   = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["parseCustomers"],
    queryFn: async () => {
      const q = new Parse.Query("Customer");
      q.descending("totalSpent");
      return (await q.find()).map(toPlain);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const obj = new Parse.Object("Customer");
      obj.id = customerId;
      await obj.destroy();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseCustomers"] });
      toast({ title: "已刪除客戶" });
    },
    onError: (e: Error) => toast({ title: "刪除失敗", description: e.message, variant: "destructive" }),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`確定要刪除客戶「${name}」嗎？`)) deleteMutation.mutate(id);
  };

  // ── analytics ──────────────────────────────────────────
  const allCustomers   = Array.isArray(customers) ? customers : [];
  const totalPoints    = allCustomers.reduce((s: number, c: any) => s + (c.loyaltyPoints || 0), 0);
  const totalSpent     = allCustomers.reduce((s: number, c: any) => s + parseFloat(c.totalSpent || 0), 0);
  const avgSpent       = allCustomers.length > 0 ? totalSpent / allCustomers.length : 0;
  const goldCount      = allCustomers.filter((c: any) => (c.loyaltyPoints || 0) >= 1000).length;

  const tierTabs = [
    { id: 'all',    label: '全部',  count: allCustomers.length },
    { id: '黃金',   label: '黃金',  count: allCustomers.filter((c: any) => (c.loyaltyPoints || 0) >= 1000).length },
    { id: '白銀',   label: '白銀',  count: allCustomers.filter((c: any) => (c.loyaltyPoints || 0) >= 500 && (c.loyaltyPoints || 0) < 1000).length },
    { id: '青銅',   label: '青銅',  count: allCustomers.filter((c: any) => (c.loyaltyPoints || 0) >= 100 && (c.loyaltyPoints || 0) < 500).length },
    { id: '會員',   label: '會員',  count: allCustomers.filter((c: any) => (c.loyaltyPoints || 0) < 100).length },
  ];

  const filteredCustomers = allCustomers.filter((c: any) => {
    const matchSearch = !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery);
    const tier = getTier(c.loyaltyPoints || 0);
    const matchTier = tierFilter === 'all' || tier.label === tierFilter;
    return matchSearch && matchTier;
  });

  const totalPages  = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const pagedItems  = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = [
    { label: '客戶數',    value: allCustomers.length,       sub: `黃金會員 ${goldCount} 位`,   icon: Users,      color: 'text-blue-600',   testId: 'text-total-customers' },
    { label: '忠誠點數',  value: totalPoints.toLocaleString(), sub: '已累積點數',              icon: Star,       color: 'text-yellow-600', testId: 'text-loyalty-points' },
    { label: '客戶總消費', value: `$${totalSpent.toFixed(0)}`, sub: '累積消費金額',           icon: DollarSign, color: 'text-green-600',  testId: 'text-total-revenue' },
    { label: '平均消費',  value: `$${avgSpent.toFixed(0)}`,   sub: '每位客戶',               icon: TrendingUp, color: 'text-purple-600', testId: 'text-average-spend' },
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
            <h2 className="text-xl md:text-2xl font-bold text-foreground">客戶管理</h2>
            <p className="text-xs md:text-sm text-muted-foreground">管理客戶關係與忠誠度計劃</p>
          </div>
          <Button size="sm" data-testid="button-add-customer" onClick={() => { setEditingCustomer(null); setShowModal(true); }}>
            <UserPlus className="w-4 h-4 mr-1" />新增客戶
          </Button>
        </div>

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
                  <div className={`text-2xl font-bold ${s.color}`} data-testid={s.testId}>{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜尋客戶姓名、Email、電話..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            data-testid="input-search-customers"
          />
        </div>

        {/* Tier filter tabs */}
        <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg overflow-x-auto">
          {tierTabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => { setTierFilter(id); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                tierFilter === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'
              }`}
            >
              {id !== 'all' && <Star className="w-3 h-3 fill-current" />}
              {label}
              <span className={`text-[10px] rounded-full px-1.5 ${tierFilter === id ? 'bg-white/20' : 'bg-muted-foreground/20'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm">
              客戶名單
              <span className="ml-2 font-normal text-muted-foreground text-xs">共 {filteredCustomers.length} 位</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    {['客戶', '聯絡方式', '忠誠點數', '總消費', '等級', '加入日期', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        {searchQuery || tierFilter !== 'all' ? '找不到符合的客戶' : '尚無客戶資料'}
                      </td>
                    </tr>
                  ) : pagedItems.map((customer: any) => {
                    const tier = getTier(customer.loyaltyPoints || 0);
                    const joinDate = customer.createdAt?.iso
                      ? new Date(customer.createdAt.iso) : new Date(customer.createdAt);
                    return (
                      <tr key={customer.id} className="hover:bg-muted/50" data-testid={`row-customer-${customer.id}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={customer.name} />
                            <div>
                              <p className="text-sm font-medium" data-testid={`text-customer-name-${customer.id}`}>{customer.name}</p>
                              <p className="text-xs text-muted-foreground">#{customer.id.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {customer.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold" data-testid={`text-loyalty-points-${customer.id}`}>
                              {customer.loyaltyPoints || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold" data-testid={`text-total-spent-${customer.id}`}>
                          ${parseFloat(customer.totalSpent || 0).toFixed(0)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${tier.color}`}>{tier.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {joinDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-0.5">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`button-edit-${customer.id}`} onClick={() => { setEditingCustomer(customer); setShowModal(true); }}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(customer.id, customer.name)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${customer.id}`}
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
                  {searchQuery || tierFilter !== 'all' ? '找不到符合的客戶' : '尚無客戶資料'}
                </p>
              ) : pagedItems.map((customer: any) => {
                const tier = getTier(customer.loyaltyPoints || 0);
                return (
                  <div key={customer.id} className="flex items-center px-3 py-2.5 gap-2 hover:bg-muted/30" data-testid={`row-customer-${customer.id}`}>
                    <Avatar name={customer.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate" data-testid={`text-customer-name-${customer.id}`}>{customer.name}</p>
                        <Badge className={`text-[9px] px-1 py-0 flex-shrink-0 ${tier.color}`}>{tier.label}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {customer.email || customer.phone || '-'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">${parseFloat(customer.totalSpent || 0).toFixed(0)}</p>
                      <div className="flex items-center justify-end gap-0.5">
                        <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                        <span className="text-[10px]">{customer.loyaltyPoints || 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" data-testid={`button-edit-${customer.id}`} onClick={() => { setEditingCustomer(customer); setShowModal(true); }}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                        onClick={() => handleDelete(customer.id, customer.name)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${customer.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {filteredCustomers.length > PAGE_SIZE && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} 位，共 {filteredCustomers.length} 位
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

      <CustomerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingCustomer}
      />
    </Layout>
  );
}
