import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Palette,
  TrendingUp,
  DollarSign,
  Clock,
  UserPlus,
  Plus,
  Mail,
  Star,
  Search,
  Shirt
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

export default function Artists() {
  const [activeTab, setActiveTab] = useState("artists");
  const [artworkCategory, setArtworkCategory] = useState("artwork");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: artists, isLoading } = useQuery({
    queryKey: ["parseArtists", { status: "approved" }],
    queryFn: async () => {
      const q = new Parse.Query("Artist");
      q.equalTo("status", "approved");
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const { data: artworkSubmissions } = useQuery({
    queryKey: ["parseArtworkSubmissions"],
    queryFn: async () => {
      const q = new Parse.Query("ArtworkSubmission");
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

  const { data: products } = useQuery({
    queryKey: ["parseProducts", { isActive: true }],
    queryFn: async () => {
      const q = new Parse.Query("Product");
      q.equalTo("isActive", true);
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const pendingSubmissions = Array.isArray(artworkSubmissions)
    ? artworkSubmissions.filter((s: any) => s.status === 'pending')
    : [];

  const totalArtists = Array.isArray(artists) ? artists.length : 0;

  const artworkProducts = Array.isArray(products) ? products.filter((product: any) => {
    const catId = product.categoryId?.objectId || product.categoryId;
    const productCategory = Array.isArray(categories)
      ? categories.find((cat: any) => cat.id === catId)
      : null;
    const matchesArtworkCategory = productCategory?.type === artworkCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArtworkCategory && matchesSearch;
  }) : [];

  const totalArtworks = Array.isArray(products) ? products.filter((product: any) => {
    const catId = product.categoryId?.objectId || product.categoryId;
    const productCategory = Array.isArray(categories)
      ? categories.find((cat: any) => cat.id === catId)
      : null;
    return productCategory?.type === 'artwork' || productCategory?.type === 'merchandise';
  }).length : 0;

  const tabs = [
    { id: "artists", label: "藝術家" },
    { id: "artworks", label: "藝術品" },
    { id: "commissions", label: "佣金" },
  ];

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
            <h2 className="text-2xl font-bold text-foreground">藝術家與作品</h2>
            <p className="text-muted-foreground">管理創意合作伙伴及藝術品目錄</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="secondary" data-testid="button-add-artist">
              <UserPlus className="w-4 h-4 mr-2" />
              新增藝術家
            </Button>
            <Button data-testid="button-add-artwork">
              <Plus className="w-4 h-4 mr-2" />
              新增藝術品
            </Button>
          </div>
        </div>

        {/* Artist Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">合作藝術家</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-active-artists">
                {totalArtists}
              </div>
              <p className="text-xs text-green-600 mt-2">本月 +2 位</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">藝術品</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-artworks">
                {totalArtworks}
              </div>
              <p className="text-xs text-green-600 mt-2">本月 +23 件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">月營業額</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-monthly-sales">
                $0.00
              </div>
              <p className="text-xs text-green-600 mt-2">比上月 +18%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待審核</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-pending-reviews">
                {pendingSubmissions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">等待批准</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-background'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Artists Grid */}
        {activeTab === "artists" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(artists) && artists.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">找不到藝術家</p>
              </div>
            ) : (
              Array.isArray(artists) && artists.map((artist: any) => (
                <Card key={artist.id} className="hover:shadow-lg transition-shadow" data-testid={`card-artist-${artist.id}`}>
                  <CardContent className="p-2 md:p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b882?ixlib=rb-4.0.3&w=80&h=80&fit=crop&crop=face"
                        alt={artist.name}
                        className="w-16 h-16 rounded-full border-2 border-primary/20"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground" data-testid={`text-artist-name-${artist.id}`}>
                          {artist.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {artist.style || 'Mixed Media'}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">4.9 (42 reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">總銷售額：</span>
                        <span className="font-semibold" data-testid={`text-artist-sales-${artist.id}`}>
                          ${parseFloat(artist.totalSales || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">佣金比例：</span>
                        <span className="font-semibold text-green-600">
                          {artist.commissionRate || 30}%
                        </span>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button className="flex-1" size="sm" data-testid={`button-view-artist-${artist.id}`}>
                          查看資料
                        </Button>
                        <Button variant="secondary" size="sm" data-testid={`button-contact-artist-${artist.id}`}>
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Artworks Content */}
        {activeTab === "artworks" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="搜尋藝術品..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-artworks"
                  />
                </div>
                <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setArtworkCategory("artwork")}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      artworkCategory === "artwork"
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-background'
                    }`}
                    data-testid="tab-artwork"
                  >
                    <Palette className="w-4 h-4 mr-2 inline" />
                    藝術品
                  </button>
                  <button
                    onClick={() => setArtworkCategory("merchandise")}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      artworkCategory === "merchandise"
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-background'
                    }`}
                    data-testid="tab-merchandise"
                  >
                    <Shirt className="w-4 h-4 mr-2 inline" />
                    商品
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworkProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  {artworkCategory === "artwork" ? (
                    <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  ) : (
                    <Shirt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  )}
                  <p className="text-muted-foreground">
                    找不到{artworkCategory === "artwork" ? "藝術品" : "商品"}
                  </p>
                </div>
              ) : (
                artworkProducts.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => console.log(`Selected ${artworkCategory}:`, product.name)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Commissions Content */}
        {activeTab === "commissions" && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">佣金追蹤介面將在此實現</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
