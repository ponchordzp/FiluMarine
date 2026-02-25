import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package } from 'lucide-react';

const commonSupplyOptions = [
  { name: 'Bottom Paint', category: 'Paint' },
  { name: 'Boat Soap', category: 'Cleaning' },
  { name: 'Wax/Polish', category: 'Cleaning' },
  { name: 'Oil Filter', category: 'Engine' },
  { name: 'Fuel Filter', category: 'Engine' },
  { name: 'Spark Plugs', category: 'Engine' },
  { name: 'Engine Oil', category: 'Engine' },
  { name: 'Life Jackets', category: 'Safety' },
  { name: 'Fire Extinguisher', category: 'Safety' },
  { name: 'First Aid Kit', category: 'Safety' },
  { name: 'Flares', category: 'Safety' },
  { name: 'Anchor Line', category: 'Materials' },
  { name: 'Fenders', category: 'Materials' },
  { name: 'Dock Lines', category: 'Materials' },
  { name: 'Battery', category: 'Electrical' }
];

export default function SuppliesManager({ supplies, onAddSupply, onRemoveSupply, onUpdateSupply }) {
  const [selectedSupply, setSelectedSupply] = React.useState('');
  const [customSupplyName, setCustomSupplyName] = React.useState('');

  const handleAddCommonSupply = () => {
    if (selectedSupply) {
      const supply = commonSupplyOptions.find(s => s.name === selectedSupply);
      if (supply) {
        onAddSupply({ 
          ...supply, 
          quantity: 1, 
          unit: '', 
          price_per_unit: 0, 
          purchased_date: '', 
          duration_months: 0, 
          status: 'in_stock', 
          notes: '' 
        });
      }
      setSelectedSupply('');
    }
  };

  const handleAddCustomSupply = () => {
    if (customSupplyName.trim()) {
      onAddSupply({ 
        name: customSupplyName.trim(), 
        category: '', 
        quantity: 1, 
        unit: '', 
        price_per_unit: 0, 
        purchased_date: '', 
        duration_months: 0, 
        status: 'in_stock', 
        notes: '' 
      });
      setCustomSupplyName('');
    }
  };

  const availableCommonSupplies = commonSupplyOptions.filter(
    opt => !supplies.some(s => s.name === opt.name)
  );

  return (
    <div>
      {/* Add Common Supply Dropdown */}
      {availableCommonSupplies.length > 0 && (
        <div className="mb-3">
          <Label className="text-xs mb-2 block">Quick Add Common Supply</Label>
          <div className="flex gap-2">
            <Select value={selectedSupply} onValueChange={setSelectedSupply}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a common supply" />
              </SelectTrigger>
              <SelectContent>
                {availableCommonSupplies.map((supply) => (
                  <SelectItem key={supply.name} value={supply.name}>
                    {supply.name} ({supply.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handleAddCommonSupply}
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              disabled={!selectedSupply}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Custom Supply */}
      <div className="mb-4">
        <Label className="text-xs mb-2 block">Or Add Custom Supply</Label>
        <div className="flex gap-2">
          <Input
            value={customSupplyName}
            onChange={(e) => setCustomSupplyName(e.target.value)}
            placeholder="e.g., Custom supply name"
            className="text-sm"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSupply())}
          />
          <Button
            type="button"
            onClick={handleAddCustomSupply}
            size="sm"
            variant="outline"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}