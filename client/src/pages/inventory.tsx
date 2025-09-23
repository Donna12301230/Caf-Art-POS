import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['/api/inventory'],
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
  });

  const filteredItems = inventoryItems?.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalItems = inventoryItems?.length || 0;
  const lowStockCount = lowStockItems?.length || 0;
  const totalValue = inventoryItems?.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.currentStock) * parseFloat(item.unitCost || 0)), 0
  ) || 0;

  const getStockStatus = (currentStock: number, minLevel: number) => {
    const stockRatio = currentStock / minLevel;
    if (stockRatio <= 0.5) {
      return { label: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    } else if (stockRatio <= 1) {
      return { label: 'Low', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle };
    } else if (stockRatio <= 2) {
      return { label: 'Medium', color: 'bg-blue-100 text-blue-800', icon: Package };
    }
    return { label: 'Good', color: 'bg-green-100 text-green-800', icon: Package };
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
            <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
            <p className="text-muted-foreground">Track and manage your raw materials and supplies</p>
          </div>
          <Button data-testid="button-add-inventory">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-items">
                {totalItems}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Inventory items tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive" data-testid="text-low-stock-items">
                {lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-inventory-value">
                ${totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 mt-2">Total stock value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reorder Points</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-reorder-points">
                {inventoryItems?.filter((item: any) => 
                  parseFloat(item.currentStock) <= parseFloat(item.minStockLevel)
                ).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Items to reorder</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search inventory..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-inventory"
              />
            </div>
            <Button variant="secondary" data-testid="button-filter">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">
                  {lowStockCount} items are running low on stock and need to be restocked soon.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Item Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Current Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Min Level</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Unit Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Total Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No inventory items found
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item: any) => {
                      const currentStock = parseFloat(item.currentStock);
                      const minLevel = parseFloat(item.minStockLevel);
                      const unitCost = parseFloat(item.unitCost || 0);
                      const totalValue = currentStock * unitCost;
                      const status = getStockStatus(currentStock, minLevel);
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr key={item.id} className="hover:bg-muted/50" data-testid={`row-inventory-${item.id}`}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground" data-testid={`text-item-name-${item.id}`}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold" data-testid={`text-current-stock-${item.id}`}>
                            {currentStock.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {minLevel.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            ${unitCost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            ${totalValue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${status.color} flex items-center space-x-1 w-fit`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{status.label}</span>
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                data-testid={`button-delete-${item.id}`}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
