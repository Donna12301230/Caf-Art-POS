import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Package, Coffee, Cookie, Palette, Shirt, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Parse from "@/lib/parseClient";
import { ProductModal } from "@/components/ProductModal";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

const PAGE_SIZE = 12;

const STOCK_STATUS = (qty: number | null, threshold = 5) => {
  if (qty === null || qty === undefined) return null;
  if (qty === 0)         return { label: '無庫存', color: 'bg-red-100 text-red-800' };
  if (qty <= threshold)  return { label: '低庫存', color: 'bg-amber-100 text-amber-800' };
  return                        { label: '有庫存', color: 'bg-green-100 text-green-800' };
};

export default function Products() {
  const [searchQuery, setSearchQuery]     = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage]     = useState(1);
  const [showModal, setShowModal]         = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["parseProducts", { isActive: true }],
    queryFn: async () => {
      const q = new Parse.Query("Product");
      q.equalTo("isActive", true);
      q.ascending("name");
      return (await q.find()).map(toPlain);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["parseCategories"],
    queryFn: async () => (await new Parse.Query("Category").find()).map(toPlain),
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const obj = new Parse.Object("Product");
      obj.id = productId;
      await obj.destroy();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parseProducts"] });
      toast({ title: "產品已刪除" });
    },
    onError: (e: Error) => toast({ title: "刪除失敗", description: e.message, variant: "destructive" }),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) {
      deleteMutation.mutate(id);
    }
  };

  // ── helpers ──────────────────────────────────────────
  const getCatType = (product: any) => {
    const catId = product.categoryId?.id ?? product.categoryId?.objectId;
    return (Array.isArray(categories) ? categories.find((c: any) => c.id === catId) : null)?.type ?? '';
  };

  const countByType = (type: string) =>
    Array.isArray(products) ? products.filter((p: any) => getCatType(p) === type).length : 0;

  const lowStockCount = Array.isArray(products)
    ? products.filter((p: any) => {
        const qty = p.stockQuantity;
        return qty !== null && qty !== undefined && qty <= (p.lowStockThreshold ?? 5);
      }).length
    : 0;

  // ── 篩選 ──────────────────────────────────────────────
  const filteredProducts = Array.isArray(products) ? products.filter((p: any) => {
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = activeCategory === "all" || getCatType(p) === activeCategory;
    return matchSearch && matchCat;
  }) : [];

  // ── 分頁 ──────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedItems  = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const categoryTabs = [
    { id: "all",         label: "全部",   icon: Package, count: Array.isArray(products) ? products.length : 0 },
    { id: "beverage",    label: "飲品",   icon: Coffee,  count: countByType("beverage") },
    { id: "food",        label: "食物",   icon: Cookie,  count: countByType("food") },
    { id: "artwork",     label: "藝術品", icon: Palette, count: countByType("artwork") },
    { id: "merchandise", label: "商品",   icon: Shirt,   count: countByType("merchandise") },
  ];

  const stats = [
    { label: '總產品數',   value: Array.isArray(products) ? products.length : 0, sub: '上架中',     color: 'text-blue-600' },
    { label: '飲品',       value: countByType("beverage"),                        sub: '飲品品項',   color: 'text-primary' },
    { label: '食物',       value: countByType("food"),                            sub: '食物品項',   color: 'text-amber-600' },
    { label: '低/無庫存',  value: lowStockCount,                                  sub: lowStockCount > 0 ? '需補貨' : '庫存正常', color: lowStockCount > 0 ? 'text-destructive' : 'text-green-600' },
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
            <h2 className="text-xl md:text-2xl font-bold text-foreground">產品管理</h2>
            <p className="text-xs md:text-sm text-muted-foreground">管理咖啡店的產品目錄</p>
          </div>
          <Button size="sm" data-testid="button-add-product" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-1" />新增
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                {s.label === '低/無庫存' && lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-destructive" />}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜尋產品名稱或描述..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            data-testid="input-search-products"
          />
        </div>

        {/* Category Tabs — scrollable on mobile */}
        <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg overflow-x-auto">
          {categoryTabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => { setActiveCategory(id); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'
              }`}
              data-testid={`tab-${id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`text-[10px] rounded-full px-1.5 ${activeCategory === id ? 'bg-white/20' : 'bg-muted-foreground/20'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Product Grid — 2 cols mobile, 3 md, 4 xl */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {pagedItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{searchQuery ? '找不到符合的產品' : '此分類尚無產品'}</p>
            </div>
          ) : pagedItems.map((product: any) => {
            const stockStatus = STOCK_STATUS(product.stockQuantity, product.lowStockThreshold);
            const imageUrl = product.imageUrl || "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop";
            const catType  = getCatType(product);

            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-product-${product.id}`}>
                {/* Image */}
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-28 md:h-36 object-cover"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop"; }}
                  />
                  {/* Badges overlay */}
                  <div className="absolute top-1 left-1 flex flex-col gap-1">
                    {product.isLimited && (
                      <Badge className="text-[9px] px-1 py-0 bg-purple-600 text-white">限量</Badge>
                    )}
                    {stockStatus && (
                      <Badge className={`text-[9px] px-1 py-0 ${stockStatus.color}`}>{stockStatus.label}</Badge>
                    )}
                  </div>
                  {catType === 'artwork' || catType === 'merchandise' ? (
                    <Badge className="absolute top-1 right-1 text-[9px] px-1 py-0 bg-black/60 text-white">
                      {catType === 'artwork' ? '藝術' : '商品'}
                    </Badge>
                  ) : null}
                </div>

                {/* Info */}
                <CardContent className="p-2 md:p-3">
                  <h3 className="text-xs md:text-sm font-semibold line-clamp-1 mb-0.5" data-testid={`text-product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="hidden md:block text-xs text-muted-foreground line-clamp-1 mb-1">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-base font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                      ${parseFloat(product.price).toFixed(0)}
                    </span>
                    <div className="flex gap-0.5">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" data-testid={`button-edit-${product.id}`} onClick={() => { setEditingProduct(product); setShowModal(true); }}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {product.stockQuantity !== null && product.stockQuantity !== undefined && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">庫存 {product.stockQuantity}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {filteredProducts.length > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} 筆，共 {filteredProducts.length} 件
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
      </div>

      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingProduct}
      />
    </Layout>
  );
}
