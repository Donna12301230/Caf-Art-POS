import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Star,
  Mail,
  Phone,
  Edit,
  Trash2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Parse from "@/lib/parseClient";

const toPlain = (obj: Parse.Object) => ({ id: obj.id, ...obj.attributes });

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["parseCustomers"],
    queryFn: async () => {
      const q = new Parse.Query("Customer");
      q.ascending("name");
      const results = await q.find();
      return results.map(toPlain);
    },
  });

  const filteredCustomers = Array.isArray(customers) ? customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  ) : [];

  const totalCustomers = Array.isArray(customers) ? customers.length : 0;
  const totalLoyaltyPoints = Array.isArray(customers) ? customers.reduce((sum: number, c: any) =>
    sum + (c.loyaltyPoints || 0), 0
  ) : 0;
  const totalSpent = Array.isArray(customers) ? customers.reduce((sum: number, c: any) =>
    sum + parseFloat(c.totalSpent || 0), 0
  ) : 0;
  const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { label: '黃金', color: 'bg-yellow-100 text-yellow-800' };
    if (points >= 500) return { label: '白銀', color: 'bg-gray-100 text-gray-800' };
    if (points >= 100) return { label: '青銅', color: 'bg-amber-100 text-amber-800' };
    return { label: '會員', color: 'bg-blue-100 text-blue-800' };
  };

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
      <div className="p-2 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">客戶管理</h2>
            <p className="text-muted-foreground">管理客戶關係與忠誠度計劃</p>
          </div>
          <Button data-testid="button-add-customer">
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">新增客戶</span>
          </Button>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-customers">
                {totalCustomers}
              </div>
              <p className="text-xs text-green-600 mt-2">本月 +12 位</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總忠誠點數</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-loyalty-points">
                {totalLoyaltyPoints.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">已分配點數</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總營收</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                ${totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 mt-2">客戶終身價值</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均消費</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-average-spend">
                ${averageSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">每位客戶</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜尋客戶..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-customers"
            />
          </div>
          <Button variant="secondary" data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">篩選</span>
          </Button>
        </div>

        {/* Customers */}
        <Card>
          <CardHeader>
            <CardTitle>客戶名單</CardTitle>
          </CardHeader>
          <CardContent className="p-0">

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">客戶</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">聯絡方式</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">忠誠點數</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">總消費</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">等級</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">加入日期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        {Array.isArray(customers) && customers.length === 0 ? '尚無客戶資料' : '找不到符合的客戶'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer: any) => {
                      const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
                      const joinedDate = customer.createdAt?.iso
                        ? new Date(customer.createdAt.iso)
                        : new Date(customer.createdAt);
                      return (
                        <tr key={customer.id} className="hover:bg-muted/50" data-testid={`row-customer-${customer.id}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground" data-testid={`text-customer-name-${customer.id}`}>
                                  {customer.name}
                                </p>
                                <p className="text-sm text-muted-foreground">ID: {customer.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground truncate max-w-[160px]">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground">{customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-semibold text-foreground" data-testid={`text-loyalty-points-${customer.id}`}>
                                {customer.loyaltyPoints || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground" data-testid={`text-total-spent-${customer.id}`}>
                              ${parseFloat(customer.totalSpent || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={loyaltyTier.color}>{loyaltyTier.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {joinedDate.toLocaleDateString('zh-TW')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="ghost" data-testid={`button-edit-${customer.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                data-testid={`button-delete-${customer.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile — ultra-compact single-line rows */}
            <div className="md:hidden divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {Array.isArray(customers) && customers.length === 0 ? '尚無客戶資料' : '找不到符合的客戶'}
                </div>
              ) : (
                filteredCustomers.map((customer: any) => {
                  const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
                  return (
                    <div key={customer.id} className="flex items-center px-3 py-2 hover:bg-muted/30" data-testid={`row-customer-${customer.id}`}>
                      {/* Avatar */}
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center space-x-1">
                          <p className="text-xs font-medium text-foreground truncate" data-testid={`text-customer-name-${customer.id}`}>
                            {customer.name}
                          </p>
                          <Badge className={`${loyaltyTier.color} text-[9px] px-1 py-0 flex-shrink-0`}>{loyaltyTier.label}</Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                          {customer.email && <span className="truncate max-w-[120px]">{customer.email}</span>}
                          {customer.phone && !customer.email && <span>{customer.phone}</span>}
                        </div>
                      </div>
                      {/* Stats */}
                      <div className="text-right flex-shrink-0 mr-1">
                        <div className="flex items-center justify-end space-x-0.5">
                          <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                          <span className="text-[10px] font-semibold" data-testid={`text-loyalty-points-${customer.id}`}>{customer.loyaltyPoints || 0}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-foreground" data-testid={`text-total-spent-${customer.id}`}>
                          ${parseFloat(customer.totalSpent || 0).toFixed(0)}
                        </span>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center space-x-0.5 flex-shrink-0">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" data-testid={`button-edit-${customer.id}`}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" data-testid={`button-delete-${customer.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredCustomers.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-muted-foreground">
                    顯示 1–{Math.min(10, filteredCustomers.length)} / 共 {filteredCustomers.length} 位客戶
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>上一頁</Button>
                    <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                    <Button variant="outline" size="sm">下一頁</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
