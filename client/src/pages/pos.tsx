import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import ShoppingCart from "@/components/ShoppingCart";
import ProductCustomizationModal from "@/components/ProductCustomizationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Coffee, Cookie, Palette, Shirt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: any;
  specialInstructions?: string;
}

export default function POS() {
  const [activeCategory, setActiveCategory] = useState("beverage");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products', { isActive: true }],
  });

  const filteredProducts = products?.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || 
                           categories?.find((cat: any) => cat.id === product.categoryId)?.type === activeCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categoryTabs = [
    { id: "beverage", label: "Beverages", icon: Coffee },
    { id: "food", label: "Food", icon: Cookie },
    { id: "artwork", label: "Artwork", icon: Palette },
    { id: "merchandise", label: "Merchandise", icon: Shirt },
  ];

  const addToCart = (product: any, options?: any, specialInstructions?: string) => {
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
    // Check if product has customizable options
    const hasOptions = true; // You would check if product has options from API
    
    if (hasOptions) {
      setSelectedProduct(product);
      setShowCustomization(true);
    } else {
      addToCart(product);
    }
  };

  return (
    <Layout>
      <div className="flex h-full">
        {/* Product Selection */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header with Search */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Point of Sale</h2>
              <p className="text-muted-foreground">Select products to add to order</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-products"
                />
              </div>
              <Button variant="secondary" data-testid="button-filter">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    activeCategory === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-background'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="w-4 h-4 mr-2 inline" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
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

        {/* Shopping Cart */}
        <ShoppingCart
          items={cartItems}
          onUpdateItem={updateCartItem}
          onRemoveItem={removeCartItem}
          onClearCart={clearCart}
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
