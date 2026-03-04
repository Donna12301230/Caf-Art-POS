import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  Coffee,
  Cookie,
  Palette,
  Shirt
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["parseProducts", { isActive: true }],
    queryFn: async () => {
      const q = new Parse.Query("Product");
      q.equalTo("isActive", true);
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["parseCategories"],
    queryFn: async () => {
      const q = new Parse.Query("Category");
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const filteredProducts = Array.isArray(products) ? products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const catId = product.categoryId?.objectId || product.categoryId;
    const matchesCategory = activeCategory === "all" ||
                           (Array.isArray(categories) && categories.find((cat: any) => cat.id === catId)?.type === activeCategory);
    return matchesSearch && matchesCategory;
  }) : [];

  const categoryTabs = [
    { id: "all", label: "所有產品", icon: Package },
    { id: "beverage", label: "飲品", icon: Coffee },
    { id: "food", label: "食物", icon: Cookie },
    { id: "artwork", label: "藝術品", icon: Palette },
    { id: "merchandise", label: "商品", icon: Shirt },
  ];

  const getStockStatus = (stockQuantity: number | null, lowStockThreshold: number = 5) => {
    if (stockQuantity === null) return null;
    if (stockQuantity === 0) return { label: '無庫存', color: 'bg-red-100 text-red-800' };
    if (stockQuantity <= lowStockThreshold) return { label: '低庫存', color: 'bg-amber-100 text-amber-800' };
    return { label: '有庫存', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-2 md:p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-2 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">產品管理</h2>
            <p className="text-muted-foreground">管理咖啡店的產品目錄</p>
          </div>
          <Button data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            新增產品
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜尋產品..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-products"
              />
            </div>
            <Button variant="secondary" data-testid="button-filter">
              <Filter className="w-4 h-4 mr-2" />
              篩選
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-background'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">找不到產品</p>
            </div>
          ) : (
            filteredProducts.map((product: any) => {
              const stockStatus = getStockStatus(product.stockQuantity, product.lowStockThreshold);
              const imageUrl = product.imageUrl || "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&w=300&h=200&fit=crop";

              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&w=300&h=200&fit=crop";
                        }}
                      />
                      {!product.isActive && (
                        <Badge className="absolute top-2 right-2 bg-red-100 text-red-800">
                          停用
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-foreground line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </h3>
                        <span className="text-lg font-bold text-primary ml-2" data-testid={`text-product-price-${product.id}`}>
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col space-y-1">
                          {stockStatus && (
                            <Badge className={`text-xs ${stockStatus.color}`}>
                              {stockStatus.label}
                            </Badge>
                          )}
                          {product.stockQuantity !== null && (
                            <span className="text-xs text-muted-foreground">
                              庫存: {product.stockQuantity}
                            </span>
                          )}
                          {product.isLimited && (
                            <Badge variant="outline" className="text-xs">
                              限量版
                            </Badge>
                          )}
                        </div>

                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost" data-testid={`button-edit-${product.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {product.artistId && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">藝術家合作</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm" disabled>上一頁</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">下一頁</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
