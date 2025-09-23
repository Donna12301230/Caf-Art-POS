import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: string;
    imageUrl?: string;
    stockQuantity?: number;
  };
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const imageUrl = product.imageUrl || "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&w=300&h=200&fit=crop";

  return (
    <Card 
      className="product-card cursor-pointer hover:shadow-lg transition-all"
      onClick={onClick}
      data-testid={`card-product-${product.id}`}
    >
      <CardContent className="p-4">
        <img 
          src={imageUrl}
          alt={product.name}
          className="w-full h-32 object-cover rounded-md mb-3"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&w=300&h=200&fit=crop";
          }}
        />
        <h3 className="font-semibold text-foreground mb-1" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <Button 
            size="sm" 
            className="hover:bg-primary/90 transition-colors"
            data-testid={`button-add-${product.id}`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {product.stockQuantity !== null && product.stockQuantity !== undefined && (
          <div className="mt-2">
            {product.stockQuantity <= 5 ? (
              <span className="text-xs text-destructive">
                {product.stockQuantity === 0 ? 'Out of stock' : `Only ${product.stockQuantity} left`}
              </span>
            ) : (
              <span className="text-xs text-green-600">In stock</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
