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
import { useQueryWithToast } from "@/hooks/useQueryWithToast";
import { useState } from "react";

export default function Artists() {
  const [activeTab, setActiveTab] = useState("artists");
  const [artworkCategory, setArtworkCategory] = useState("artwork");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: artists, isLoading } = useQueryWithToast({
    queryKey: ['/api/artists', { status: 'approved' }],
    errorTitle: "Artists Error",
    errorDescription: "Failed to load artists data",
  });

  const { data: artworkSubmissions } = useQueryWithToast({
    queryKey: ['/api/artwork-submissions'],
    errorTitle: "Submissions Error", 
    errorDescription: "Failed to load artwork submissions",
  });

  const { data: artistPerformance } = useQueryWithToast({
    queryKey: ['/api/analytics/artist-performance'],
    errorTitle: "Performance Error",
    errorDescription: "Failed to load artist performance data",
  });

  const { data: categories } = useQueryWithToast({
    queryKey: ['/api/categories'],
    errorTitle: "Categories Error",
    errorDescription: "Failed to load categories",
  });

  const { data: products } = useQueryWithToast({
    queryKey: ['/api/products', { isActive: true }],
    errorTitle: "Products Error",
    errorDescription: "Failed to load products",
  });

  const pendingSubmissions = Array.isArray(artworkSubmissions) ? artworkSubmissions.filter((submission: any) => 
    submission.status === 'pending'
  ) : [];

  const totalArtists = Array.isArray(artists) ? artists.length : 0;
  // Filter artwork and merchandise products
  const artworkProducts = Array.isArray(products) ? products.filter((product: any) => {
    const productCategory = Array.isArray(categories) ? categories.find((cat: any) => cat.id === product.categoryId) : null;
    const matchesArtworkCategory = productCategory?.type === artworkCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArtworkCategory && matchesSearch;
  }) : [];

  const totalArtworks = Array.isArray(products) ? products.filter((product: any) => {
    const productCategory = Array.isArray(categories) ? categories.find((cat: any) => cat.id === product.categoryId) : null;
    return productCategory?.type === 'artwork' || productCategory?.type === 'merchandise';
  }).length : 0;
  const monthlyArtSales = Array.isArray(artistPerformance) ? artistPerformance.reduce((sum: number, artist: any) => sum + parseFloat(artist.totalSales || 0), 0) : 0;

  const tabs = [
    { id: "artists", label: "Artists" },
    { id: "artworks", label: "Artworks" },
    { id: "commissions", label: "Commissions" },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Artists & Artwork</h2>
            <p className="text-muted-foreground">Manage creative partnerships and artwork catalog</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="secondary" data-testid="button-add-artist">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Artist
            </Button>
            <Button data-testid="button-add-artwork">
              <Plus className="w-4 h-4 mr-2" />
              Add Artwork
            </Button>
          </div>
        </div>

        {/* Artist Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Artists</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-active-artists">
                {totalArtists}
              </div>
              <p className="text-xs text-green-600 mt-2">+2 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Artworks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-artworks">
                {totalArtworks}
              </div>
              <p className="text-xs text-green-600 mt-2">+23 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-monthly-sales">
                ${monthlyArtSales.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 mt-2">+18% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-pending-reviews">
                {pendingSubmissions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Artists and Artworks */}
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
                <p className="text-muted-foreground">No artists found</p>
              </div>
            ) : (
              Array.isArray(artists) && artists.map((artist: any) => {
                const performance = Array.isArray(artistPerformance) ? artistPerformance.find((perf: any) => perf.artistId === artist.id) : null;
                const totalSales = parseFloat(performance?.totalSales || 0);
                const commission = parseFloat(performance?.commission || 0);
                
                return (
                  <Card key={artist.id} className="hover:shadow-lg transition-shadow" data-testid={`card-artist-${artist.id}`}>
                    <CardContent className="p-6">
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
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <img 
                          src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=100&h=100&fit=crop" 
                          alt="Artwork sample" 
                          className="w-full h-16 object-cover rounded-md" 
                        />
                        <img 
                          src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&w=100&h=100&fit=crop" 
                          alt="Artwork sample" 
                          className="w-full h-16 object-cover rounded-md" 
                        />
                        <img 
                          src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&w=100&h=100&fit=crop" 
                          alt="Artwork sample" 
                          className="w-full h-16 object-cover rounded-md" 
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Sales:</span>
                          <span className="font-semibold" data-testid={`text-artist-sales-${artist.id}`}>
                            ${totalSales.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Commission:</span>
                          <span className="font-semibold text-green-600" data-testid={`text-artist-commission-${artist.id}`}>
                            ${commission.toFixed(2)} ({artist.commissionRate}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Artworks:</span>
                          <span className="font-semibold">
                            {performance?.totalOrders || 0} active
                          </span>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button 
                            className="flex-1" 
                            size="sm"
                            data-testid={`button-view-artist-${artist.id}`}
                          >
                            View Profile
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            data-testid={`button-contact-artist-${artist.id}`}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Artworks Content */}
        {activeTab === "artworks" && (
          <div>
            {/* Artwork Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search artworks..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-artworks"
                  />
                </div>

                {/* Category Toggle */}
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
                    Artwork
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
                    Merchandise
                  </button>
                </div>
              </div>
            </div>

            {/* Artwork Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworkProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  {artworkCategory === "artwork" ? (
                    <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  ) : (
                    <Shirt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  )}
                  <p className="text-muted-foreground">
                    No {artworkCategory === "artwork" ? "artworks" : "merchandise"} found
                  </p>
                </div>
              ) : (
                artworkProducts.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => {
                      // Handle artwork/merchandise selection - could open details modal
                      console.log(`Selected ${artworkCategory}:`, product.name);
                    }}
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
            <p className="text-muted-foreground">Commission tracking interface would be implemented here</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
