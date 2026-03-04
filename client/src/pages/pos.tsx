import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import ShoppingCart from "@/components/ShoppingCart";
import ProductCustomizationModal from "@/components/ProductCustomizationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Coffee, Cookie, ShoppingCart as CartIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Parse from "@/lib/parseClient";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: any;
  specialInstructions?: string;
}

const toPlain = (obj: Parse.Object): any => ({ id: obj.id, ...obj.attributes });

export default function POS() {
  const [activeCategory, setActiveCategory] = useState("beverage");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["parseCategories"],
    queryFn: async () => {
      const q = new Parse.Query("Category");
      q.ascending("name");
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

  const filteredProducts = Array.isArray(products) ? products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory ||
                           (Array.isArray(categories) && categories.find((cat: any) => cat.id === product.categoryId?.objectId)?.type === activeCategory);
    return matchesSearch && matchesCategory;
  }) : [];

  const categoryTabs = [
    { id: "beverage", label: "飲品", icon: Coffee },
    { id: "food", label: "食物", icon: Cookie },
  ];

  const addToCart = (product: any, options: any = {}, specialInstructions: string = '') => {
    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      options,
      specialInstructions,
    };
    setCartItems(prev => [...prev, cartItem]);
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeCartItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowCustomization(true);
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout>
      <div className="flex h-full">
        {/* Product Selection */}
        <div className="flex-1 p-2 md:p-6 overflow-y-auto pb-20 md:pb-6">
          {/* Header with Search */}
          <div className="flex items-center justify-between gap-2 mb-3 md:mb-6">
            <h2 className="text-base md:text-2xl font-bold text-foreground hidden md:block">點餐系統</h2>
            <div className="flex items-center space-x-2 flex-1 md:flex-none">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <Input
                  type="text"
                  placeholder="搜尋..."
                  className="pl-8 h-8 text-sm w-full md:w-56"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-products"
                />
              </div>
              <Button variant="secondary" size="icon" className="h-8 w-8 flex-shrink-0" data-testid="button-filter">
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-1 mb-2 md:mb-6 bg-muted p-0.5 md:p-1 rounded-lg">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex-1 py-1 md:py-2 px-2 md:px-4 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    activeCategory === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-background'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="w-3 h-3 md:w-4 md:h-4 mr-1 inline" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Product Grid — 3 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">找不到產品</p>
              </div>
            ) : (
              filteredProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              ))
            )}
          </div>
        </div>

        {/* Mobile floating cart button */}
        <div className="fixed bottom-6 right-6 md:hidden z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="relative w-14 h-14 coffee-gradient rounded-full shadow-lg flex items-center justify-center text-white"
            aria-label="開啟購物車"
          >
            <CartIcon className="w-6 h-6" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>

        {/* Shopping Cart */}
        <ShoppingCart
          items={cartItems}
          onUpdateItem={updateCartItem}
          onRemoveItem={removeCartItem}
          onClearCart={clearCart}
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
        />
      </div>

      {/* Product Customization Modal */}
      {showCustomization && selectedProduct && (
        <ProductCustomizationModal
          product={selectedProduct}
          onConfirm={(options, specialInstructions) => {
            addToCart(selectedProduct, options, specialInstructions);
            setShowCustomization(false);
            setSelectedProduct(null);
          }}
          onCancel={() => {
            setShowCustomization(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </Layout>
  );
}
