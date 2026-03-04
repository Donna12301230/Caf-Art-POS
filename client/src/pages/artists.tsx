import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Palette, TrendingUp, DollarSign, Clock, UserPlus, Plus,
  Mail, Search, Shirt, CheckCircle, XCircle, AlertTriangle,
  Package,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Parse from "@/lib/parseClient";
import { ArtistModal } from "@/components/ArtistModal";

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

// Avatar with initials fallback
function ArtistAvatar({ name, imageUrl, size = 'md' }: { name: string; imageUrl?: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-14 h-14 text-base';
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={`${cls} rounded-full object-cover border-2 border-primary/20`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />;
  }
  return (
    <div className={`${cls} rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
      {initials}
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending:  'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
};
const STATUS_LABEL: Record<string, string> = {
  approved: '已核准', pending: '待審核', rejected: '已拒絕',
};

export default function Artists() {
  const [activeTab, setActiveTab]           = useState("artists");
  const [artworkCategory, setArtworkCategory] = useState("artwork");
  const [searchQuery, setSearchQuery]       = useState("");
  const [artistSearch, setArtistSearch]     = useState("");
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [editingArtist, setEditingArtist]   = useState<any | null>(null);
  const { toast }  = useToast();
  const queryClient = useQueryClient();

  const { data: artists, isLoading } = useQuery({
    queryKey: ["parseArtists"],
    queryFn: async () => {
      const q = new Parse.Query("Artist");
      q.descending("totalSales");
      return (await q.find()).map(toPlain);
    },
  });

  const { data: artworkSubmissions } = useQuery({
    queryKey: ["parseArtworkSubmissions"],
    queryFn: async () => (await new Parse.Query("ArtworkSubmission").find()).map(toPlain),
  });

  const { data: categories } = useQuery({
    queryKey: ["parseCategories"],
    queryFn: async () => (await new Parse.Query("Category").find()).map(toPlain),
  });

  const { data: products } = useQuery({
    queryKey: ["parseProducts", { isActive: true }],
    queryFn: async () => {
      const q = new Parse.Query("Product");
      q.equalTo("isActive", true);
      return (await q.find()).map(toPlain);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: 'approved' | 'rejected' }) => {
      const obj = new Parse.Object("ArtworkSubmission");
      obj.id = submissionId;
      await obj.save({ status, reviewedAt: new Date() });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["parseArtworkSubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["parsePendingArtworkCount"] });
      toast({ title: vars.status === 'approved' ? "已核准作品" : "已拒絕作品" });
    },
    onError: (e: Error) => toast({ title: "操作失敗", description: e.message, variant: "destructive" }),
  });

  // ── helpers ─────────────────────────────────────────────
  const approvedArtists = Array.isArray(artists)
    ? artists.filter((a: any) => a.status === 'approved') : [];
  const pendingSubmissions = Array.isArray(artworkSubmissions)
    ? artworkSubmissions.filter((s: any) => s.status === 'pending') : [];

  const totalRevenue = Array.isArray(artists)
    ? artists.reduce((sum: number, a: any) => sum + parseFloat(a.totalSales || 0), 0) : 0;

  const totalArtworks = Array.isArray(products) ? products.filter((product: any) => {
    const catId = product.categoryId?.id ?? product.categoryId?.objectId;
    const cat = Array.isArray(categories) ? categories.find((c: any) => c.id === catId) : null;
    return cat?.type === 'artwork' || cat?.type === 'merchandise';
  }).length : 0;

  // Filtered artists for artist tab
  const filteredArtists = approvedArtists.filter((a: any) =>
    !artistSearch ||
    a.name?.toLowerCase().includes(artistSearch.toLowerCase()) ||
    a.style?.toLowerCase().includes(artistSearch.toLowerCase())
  );

  // Artwork products for artworks tab
  const artworkProducts = Array.isArray(products) ? products.filter((product: any) => {
    const catId = product.categoryId?.id ?? product.categoryId?.objectId;
    const cat = Array.isArray(categories) ? categories.find((c: any) => c.id === catId) : null;
    const matchCat = cat?.type === artworkCategory;
    const matchSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }) : [];

  const stats = [
    { label: '合作藝術家', value: approvedArtists.length,           sub: `共 ${Array.isArray(artists) ? artists.length : 0} 位`,  icon: Palette,    color: 'text-purple-600' },
    { label: '藝術品/商品', value: totalArtworks,                   sub: '上架中品項',                                             icon: TrendingUp, color: 'text-blue-600' },
    { label: '總銷售額',    value: `$${totalRevenue.toFixed(0)}`,   sub: '所有藝術家合計',                                         icon: DollarSign, color: 'text-green-600' },
    { label: '待審核',      value: pendingSubmissions.length,        sub: pendingSubmissions.length > 0 ? '需處理' : '無待審項目',   icon: Clock,      color: pendingSubmissions.length > 0 ? 'text-destructive' : 'text-green-600' },
  ];

  const tabs = [
    { id: "artists",     label: "藝術家" },
    { id: "artworks",    label: "藝術品" },
    { id: "submissions", label: "待審核", count: pendingSubmissions.length },
    { id: "commissions", label: "佣金" },
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
            <h2 className="text-xl md:text-2xl font-bold text-foreground">藝術家與作品</h2>
            <p className="text-xs md:text-sm text-muted-foreground">管理合作藝術家及藝術品目錄</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" data-testid="button-add-artist" onClick={() => { setEditingArtist(null); setShowArtistModal(true); }}>
              <UserPlus className="w-4 h-4 mr-1" />新增藝術家
            </Button>
            <Button size="sm" data-testid="button-add-artwork">
              <Plus className="w-4 h-4 mr-1" />新增作品
            </Button>
          </div>
        </div>

        {/* Pending alert */}
        {pendingSubmissions.length > 0 && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>有 <strong>{pendingSubmissions.length}</strong> 件作品等待審核</span>
            <button className="ml-auto text-xs underline" onClick={() => setActiveTab('submissions')}>前往審核</button>
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

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] rounded-full px-1.5 ${activeTab === tab.id ? 'bg-white/20' : 'bg-destructive/20 text-destructive'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── 藝術家 ── */}
        {activeTab === "artists" && (
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜尋藝術家姓名或風格..."
                className="pl-10 h-9"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
              />
            </div>

            {filteredArtists.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{artistSearch ? '找不到符合的藝術家' : '尚無核准藝術家'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredArtists.map((artist: any) => {
                  const commission = parseFloat(artist.totalSales || 0) * (parseFloat(artist.commissionRate || 30) / 100);
                  return (
                    <Card key={artist.id} className="hover:shadow-md transition-shadow" data-testid={`card-artist-${artist.id}`}>
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <ArtistAvatar name={artist.name} imageUrl={artist.imageUrl} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate" data-testid={`text-artist-name-${artist.id}`}>
                              {artist.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{artist.style || '藝術家'}</p>
                            {artist.email && (
                              <p className="text-[11px] text-muted-foreground truncate">{artist.email}</p>
                            )}
                          </div>
                          <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${STATUS_BADGE[artist.status] ?? 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABEL[artist.status] ?? artist.status}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-sm border-t border-border pt-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">總銷售額</span>
                            <span className="font-semibold text-green-600 text-xs" data-testid={`text-artist-sales-${artist.id}`}>
                              ${parseFloat(artist.totalSales || 0).toFixed(0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">佣金比例</span>
                            <span className="font-semibold text-xs">{artist.commissionRate || 30}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">應付佣金</span>
                            <span className="font-semibold text-primary text-xs">${commission.toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 mt-3">
                          <Button className="flex-1 h-7 text-xs" size="sm" data-testid={`button-view-artist-${artist.id}`} onClick={() => { setEditingArtist(artist); setShowArtistModal(true); }}>查看資料</Button>
                          <Button variant="secondary" size="sm" className="h-7 w-7 p-0" data-testid={`button-contact-artist-${artist.id}`}>
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 藝術品 ── */}
        {activeTab === "artworks" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜尋藝術品..."
                  className="pl-10 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-artworks"
                />
              </div>
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setArtworkCategory("artwork")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    artworkCategory === "artwork" ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'
                  }`}
                  data-testid="tab-artwork"
                >
                  <Palette className="w-3.5 h-3.5" />藝術品
                </button>
                <button
                  onClick={() => setArtworkCategory("merchandise")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    artworkCategory === "merchandise" ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'
                  }`}
                  data-testid="tab-merchandise"
                >
                  <Shirt className="w-3.5 h-3.5" />商品
                </button>
              </div>
            </div>

            {artworkProducts.length === 0 ? (
              <div className="text-center py-12">
                {artworkCategory === "artwork"
                  ? <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  : <Shirt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />}
                <p className="text-sm text-muted-foreground">找不到{artworkCategory === "artwork" ? "藝術品" : "商品"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {artworkProducts.map((product: any) => {
                  const imageUrl = product.imageUrl || "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop";
                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-32 object-cover"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop"; }}
                      />
                      <CardContent className="p-2">
                        <p className="text-xs font-semibold line-clamp-1">{product.name}</p>
                        <p className="text-sm font-bold text-primary">${parseFloat(product.price).toFixed(0)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 待審核 ── */}
        {activeTab === "submissions" && (
          <div>
            {artworkSubmissions === undefined ? (
              <div className="text-center py-12">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : Array.isArray(artworkSubmissions) && artworkSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">目前沒有待審核的作品</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(artworkSubmissions) && artworkSubmissions.map((sub: any) => (
                  <Card key={sub.id} className="p-3 md:p-4">
                    <div className="flex items-start gap-3">
                      {sub.imageUrl && (
                        <img src={sub.imageUrl} alt={sub.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{sub.title}</h3>
                          <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE[sub.status] ?? 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABEL[sub.status] ?? sub.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{sub.description}</p>
                        {sub.price && (
                          <p className="text-xs font-medium">建議售價：<span className="text-primary">${parseFloat(sub.price).toFixed(0)}</span></p>
                        )}
                      </div>
                      {sub.status === 'pending' && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button
                            size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => reviewMutation.mutate({ submissionId: sub.id, status: 'approved' })}
                            disabled={reviewMutation.isPending}
                            data-testid={`button-approve-${sub.id}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />核准
                          </Button>
                          <Button
                            size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => reviewMutation.mutate({ submissionId: sub.id, status: 'rejected' })}
                            disabled={reviewMutation.isPending}
                            data-testid={`button-reject-${sub.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />拒絕
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 佣金 ── */}
        {activeTab === "commissions" && (
          <div>
            {approvedArtists.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">尚無藝術家佣金資料</p>
              </div>
            ) : (
              <Card>
                <CardHeader className="py-3 px-4 border-b border-border">
                  <CardTitle className="text-sm">佣金明細</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        {['藝術家', '風格', '總銷售額', '佣金%', '應付佣金'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {approvedArtists.map((artist: any) => {
                        const sales      = parseFloat(artist.totalSales || 0);
                        const rate       = parseFloat(artist.commissionRate || 30);
                        const commission = sales * rate / 100;
                        return (
                          <tr key={artist.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <ArtistAvatar name={artist.name} imageUrl={artist.imageUrl} size="sm" />
                                <span className="text-sm font-medium">{artist.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{artist.style || '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600">${sales.toFixed(0)}</td>
                            <td className="px-4 py-3 text-sm">{rate}%</td>
                            <td className="px-4 py-3 text-sm font-bold text-primary">${commission.toFixed(0)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted font-semibold">
                        <td className="px-4 py-2 text-sm" colSpan={2}>合計</td>
                        <td className="px-4 py-2 text-sm text-green-600">${totalRevenue.toFixed(0)}</td>
                        <td className="px-4 py-2 text-sm">-</td>
                        <td className="px-4 py-2 text-sm text-primary">
                          ${approvedArtists.reduce((s: number, a: any) =>
                            s + parseFloat(a.totalSales || 0) * parseFloat(a.commissionRate || 30) / 100, 0
                          ).toFixed(0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </div>

      <ArtistModal
        isOpen={showArtistModal}
        onClose={() => setShowArtistModal(false)}
        initialData={editingArtist}
      />
    </Layout>
  );
}
