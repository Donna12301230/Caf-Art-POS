import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface ProductCustomizationModalProps {
  product: {
    id: string;
    name: string;
    price: string;
  };
  onConfirm: (options: any, specialInstructions: string) => void;
  onCancel: () => void;
}

export default function ProductCustomizationModal({ 
  product, 
  onConfirm, 
  onCancel 
}: ProductCustomizationModalProps) {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [selectedTemperature, setSelectedTemperature] = useState('hot');
  const [addOns, setAddOns] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const sizes = [
    { id: 'small', label: 'Small', price: 0 },
    { id: 'medium', label: 'Medium', price: 0 },
    { id: 'large', label: 'Large', price: 0.5 },
  ];

  const temperatures = [
    { id: 'iced', label: 'Iced' },
    { id: 'hot', label: 'Hot' },
  ];

  const availableAddOns = [
    { id: 'extra-shot', label: 'Extra Shot', price: 0.75 },
    { id: 'decaf', label: 'Decaf', price: 0 },
    { id: 'oat-milk', label: 'Oat Milk', price: 0.60 },
    { id: 'extra-hot', label: 'Extra Hot', price: 0 },
  ];

  const handleAddOnChange = (addOnId: string, checked: boolean) => {
    if (checked) {
      setAddOns(prev => [...prev, addOnId]);
    } else {
      setAddOns(prev => prev.filter(id => id !== addOnId));
    }
  };

  const handleConfirm = () => {
    const options = {
      size: selectedSize,
      temperature: selectedTemperature,
      addOns,
    };
    onConfirm(options, specialInstructions);
  };

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(product.price);
    const sizePrice = sizes.find(s => s.id === selectedSize)?.price || 0;
    const addOnsPrice = addOns.reduce((sum, addOnId) => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      return sum + (addOn?.price || 0);
    }, 0);
    return basePrice + sizePrice + addOnsPrice;
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="w-96 max-w-lg" data-testid="modal-customization">
        <DialogHeader>
          <DialogTitle>Customize Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{product.name}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Base price: ${parseFloat(product.price).toFixed(2)}
            </p>
          </div>

          {/* Size Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Size</Label>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={`p-2 rounded text-sm transition-colors ${
                    selectedSize === size.id
                      ? 'border-2 border-primary bg-primary/10 text-primary'
                      : 'border border-border hover:bg-muted'
                  }`}
                  data-testid={`button-size-${size.id}`}
                >
                  {size.label}
                  {size.price > 0 && <div className="text-xs">+${size.price}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Temperature</Label>
            <div className="grid grid-cols-2 gap-2">
              {temperatures.map((temp) => (
                <button
                  key={temp.id}
                  onClick={() => setSelectedTemperature(temp.id)}
                  className={`p-2 rounded text-sm transition-colors ${
                    selectedTemperature === temp.id
                      ? 'border-2 border-primary bg-primary/10 text-primary'
                      : 'border border-border hover:bg-muted'
                  }`}
                  data-testid={`button-temp-${temp.id}`}
                >
                  {temp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Add-ons</Label>
            <div className="space-y-2">
              {availableAddOns.map((addOn) => (
                <div key={addOn.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={addOn.id}
                    checked={addOns.includes(addOn.id)}
                    onCheckedChange={(checked) => handleAddOnChange(addOn.id, checked as boolean)}
                    data-testid={`checkbox-addon-${addOn.id}`}
                  />
                  <Label htmlFor={addOn.id} className="text-sm cursor-pointer">
                    {addOn.label}
                    {addOn.price > 0 && ` (+$${addOn.price.toFixed(2)})`}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <Label htmlFor="instructions" className="text-sm font-medium mb-2 block">
              Special Instructions
            </Label>
            <Textarea
              id="instructions"
              rows={3}
              placeholder="Any special requests..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              data-testid="textarea-instructions"
            />
          </div>

          {/* Total Price */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price:</span>
              <span className="text-lg font-bold text-primary" data-testid="text-total-price">
                ${calculateTotalPrice().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button 
            className="flex-1" 
            onClick={handleConfirm}
            data-testid="button-confirm-customization"
          >
            Add to Cart
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-customization"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
