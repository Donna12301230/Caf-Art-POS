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

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
  });

  const filteredCustomers = customers?.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  ) || [];

  const totalCustomers = customers?.length || 0;
  const totalLoyaltyPoints = customers?.reduce((sum: number, customer: any) => 
    sum + (customer.loyaltyPoints || 0), 0
  ) || 0;
  const totalSpent = customers?.reduce((sum: number, customer: any) => 
    sum + parseFloat(customer.totalSpent || 0), 0
  ) || 0;
  const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (points >= 500) return { label: 'Silver', color: 'bg-gray-100 text-gray-800' };
    if (points >= 100) return { label: 'Bronze', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Member', color: 'bg-blue-100 text-blue-800' };
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
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Customer Management</h2>
            <p className="text-muted-foreground">Manage customer relationships and loyalty programs</p>
          </div>
          <Button data-testid="button-add-customer">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-customers">
                {totalCustomers}
              </div>
              <p className="text-xs text-green-600 mt-2">+12 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loyalty Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-loyalty-points">
                {totalLoyaltyPoints.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Points distributed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                ${totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 mt-2">Customer lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Spend</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-average-spend">
                ${averageSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-customers"
              />
            </div>
            <Button variant="secondary" data-testid="button-filter">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Loyalty Points</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Total Spent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tier</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        {customers?.length === 0 ? 'No customers found' : 'No customers match your search'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer: any) => {
                      const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
                      
                      return (
                        <tr key={customer.id} className="hover:bg-muted/50" data-testid={`row-customer-${customer.id}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground" data-testid={`text-customer-name-${customer.id}`}>
                                  {customer.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Customer ID: {customer.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
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
                            <Badge className={loyaltyTier.color}>
                              {loyaltyTier.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                data-testid={`button-edit-${customer.id}`}
                              >
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

            {filteredCustomers.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing 1-{Math.min(10, filteredCustomers.length)} of {filteredCustomers.length} customers
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                      1
                    </Button>
                    <Button variant="outline" size="sm">
                      2
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
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
