import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Coffee, 
  Palette, 
  Handshake, 
  TrendingUp,
  Download,
  Users
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const { data: dailyRevenue } = useQuery({
    queryKey: ['/api/analytics/daily-revenue'],
  });

  const { data: topProducts } = useQuery({
    queryKey: ['/api/analytics/top-products', { limit: 5 }],
  });

  const { data: artistPerformance } = useQuery({
    queryKey: ['/api/analytics/artist-performance'],
  });

  const totalRevenue = 24589;
  const beverageRevenue = 18420;
  const artRevenue = 6169;
  const commissions = 1851;

  // Mock data for chart visualization (in real app, use a chart library like recharts)
  const chartData = [
    { day: 'Mon', revenue: 2800 },
    { day: 'Tue', revenue: 3200 },
    { day: 'Wed', revenue: 3800 },
    { day: 'Thu', revenue: 4200 },
    { day: 'Fri', revenue: 4800 },
    { day: 'Sat', revenue: 3600 },
    { day: 'Sun', revenue: 5200 },
  ];

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
            <p className="text-muted-foreground">Track performance and business insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button data-testid="button-export-report">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                ${totalRevenue.toLocaleString()}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground ml-2">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beverage Sales</CardTitle>
              <Coffee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-beverage-sales">
                ${beverageRevenue.toLocaleString()}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+8.2%</span>
                  <span className="text-muted-foreground ml-2">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Art Sales</CardTitle>
              <Palette className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-art-sales">
                ${artRevenue.toLocaleString()}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+24.8%</span>
                  <span className="text-muted-foreground ml-2">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Artist Commissions</CardTitle>
              <Handshake className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-commissions">
                ${commissions.toLocaleString()}
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+18.9%</span>
                  <span className="text-muted-foreground ml-2">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Revenue Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2" data-testid="chart-revenue-trends">
                {chartData.map((data, index) => {
                  const height = (data.revenue / maxRevenue) * 200;
                  return (
                    <div key={data.day} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-primary/20 rounded-t flex items-end" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-primary rounded-t transition-all duration-500"
                          style={{ height: `${height}px` }}
                          title={`${data.day}: $${data.revenue}`}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground mt-2">{data.day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No product data available</p>
                ) : (
                  topProducts?.map((product: any, index: number) => (
                    <div key={product.productId} className="flex items-center justify-between" data-testid={`product-${index}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Coffee className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">{product.totalQuantity} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${parseFloat(product.totalRevenue || 0).toFixed(0)}</p>
                        <p className="text-sm text-green-600">+{Math.floor(Math.random() * 20 + 5)}%</p>
                      </div>
                    </div>
                  )) || [
                    // Default display when no data
                    <div key="default" className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Coffee className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No product data</p>
                          <p className="text-sm text-muted-foreground">0 sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">$0</p>
                        <p className="text-sm text-muted-foreground">-</p>
                      </div>
                    </div>
                  ]
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Artist Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Artist Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Artist</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Artworks</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Sales</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Revenue</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Commission</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {artistPerformance?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        No artist performance data available
                      </td>
                    </tr>
                  ) : (
                    artistPerformance?.map((artist: any) => (
                      <tr key={artist.artistId} className="hover:bg-muted/50" data-testid={`row-artist-${artist.artistId}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              src="https://images.unsplash.com/photo-1494790108755-2616b612b882?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face" 
                              alt={artist.artistName}
                              className="w-10 h-10 rounded-full" 
                            />
                            <span className="font-medium text-foreground">{artist.artistName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">-</td>
                        <td className="px-6 py-4 text-sm text-foreground">{artist.totalOrders || 0}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          ${parseFloat(artist.totalSales || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          ${parseFloat(artist.commission || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600">
                          +{Math.floor(Math.random() * 30 + 5)}%
                        </td>
                      </tr>
                    )) || [
                      // Default display when no data
                      <tr key="no-data">
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          No artist performance data available
                        </td>
                      </tr>
                    ]
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
