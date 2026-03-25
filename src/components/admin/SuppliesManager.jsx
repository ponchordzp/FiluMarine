import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from 'lucide-react';

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

export default function SuppliesManager({ supplies, sellers = [], onAddSupply, onRemoveSupply, onUpdateSupply }) {
  const [selectedSupply, setSelectedSupply] = React.useState('');
  const [customSupplyName, setCustomSupplyName] = React.useState('');
  const [customSupplySupplier, setCustomSupplySupplier] = React.useState('');
  const [customSupplyMinStock, setCustomSupplyMinStock] = React.useState('');
  const [selectedCommonSupplier, setSelectedCommonSupplier] = React.useState('');
  const [selectedCommonMinStock, setSelectedCommonMinStock] = React.useState('');

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
          notes: '',
          minimum_stock: parseFloat(selectedCommonMinStock) || 0,
          supplier_name: selectedCommonSupplier || '',
        });
      }
      setSelectedSupply('');
      setSelectedCommonSupplier('');
      setSelectedCommonMinStock('');
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
        notes: '',
        minimum_stock: parseFloat(customSupplyMinStock) || 0,
        supplier_name: customSupplySupplier || '',
      });
      setCustomSupplyName('');
      setCustomSupplySupplier('');
      setCustomSupplyMinStock('');
    }
  };

  const availableCommonSupplies = commonSupplyOptions.filter(
    opt => !supplies.some(s => s.name === opt.name)
  );

  return (
    <div>
      {/* Add Common Supply Dropdown */}
      {availableCommonSupplies.length > 0 && (
        <div className="mb-3 bg-white border border-emerald-200 rounded-lg p-3 space-y-2">
          <Label className="text-xs font-semibold text-emerald-800 block">Quick Add Common Supply</Label>
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
          </div>
          {selectedSupply && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-600">Min Stock Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  value={selectedCommonMinStock}
                  onChange={(e) => setSelectedCommonMinStock(e.target.value)}
                  placeholder="e.g., 2"
                  className="h-7 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Supplier (optional)</Label>
                <Select value={selectedCommonSupplier} onValueChange={setSelectedCommonSupplier}>
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue placeholder="Assign supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {sellers.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button
            type="button"
            onClick={handleAddCommonSupply}
            size="sm"
            variant="outline"
            className="w-full border-emerald-400 text-emerald-700 hover:bg-emerald-50"
            disabled={!selectedSupply}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Supply
          </Button>
        </div>
      )}

      {/* Add Custom Supply */}
      <div className="mb-4 bg-white border border-emerald-200 rounded-lg p-3 space-y-2">
        <Label className="text-xs font-semibold text-emerald-800 block">Add Custom Supply</Label>
        <Input
          value={customSupplyName}
          onChange={(e) => setCustomSupplyName(e.target.value)}
          placeholder="e.g., Custom supply name"
          className="text-sm"
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSupply())}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-slate-600">Min Stock Threshold</Label>
            <Input
              type="number"
              min="0"
              value={customSupplyMinStock}
              onChange={(e) => setCustomSupplyMinStock(e.target.value)}
              placeholder="e.g., 2"
              className="h-7 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600">Supplier (optional)</Label>
            <Select value={customSupplySupplier} onValueChange={setCustomSupplySupplier}>
              <SelectTrigger className="h-7 text-sm">
                <SelectValue placeholder="Assign supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {sellers.map((s) => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddCustomSupply}
          size="sm"
          variant="outline"
          className="w-full border-emerald-400 text-emerald-700 hover:bg-emerald-50"
          disabled={!customSupplyName.trim()}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Supply
        </Button>
      </div>
    </div>
  );
}