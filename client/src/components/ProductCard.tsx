import { Card, CardContent } from "@/components/ui/card";
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
  const outOfStock = product.stockQuantity === 0;

  return (
    <Card
      className={`product-card cursor-pointer hover:shadow-md transition-all active:scale-95 ${outOfStock ? 'opacity-50' : ''}`}
      onClick={outOfStock ? undefined : onClick}
      data-testid={`card-product-${product.id}`}
    >
      {/* Mobile: compact horizontal-ish card */}
      <CardContent className="p-0 md:p-0">
        {/* Image */}
        <div className="relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-20 md:h-28 object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&w=300&h=200&fit=crop";
            }}
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-black/40 rounded-t-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">售完</span>
            </div>
          )}
          {/* Low stock badge */}
          {!outOfStock && product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity <= 5 && (
            <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-1 rounded">
              剩{product.stockQuantity}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-2 md:p-3">
          <h3
            className="font-semibold text-foreground text-xs md:text-sm leading-tight line-clamp-2 mb-1"
            data-testid={`text-product-name-${product.id}`}
          >
            {product.name}
          </h3>
          {/* Description — desktop only */}
          {product.description && (
            <p className="hidden md:block text-xs text-muted-foreground mb-2 line-clamp-1">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span
              className="text-sm md:text-base font-bold text-primary"
              data-testid={`text-product-price-${product.id}`}
            >
              ${parseFloat(product.price).toFixed(0)}
            </span>
            <button
              className="w-6 h-6 md:w-7 md:h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
              data-testid={`button-add-${product.id}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
