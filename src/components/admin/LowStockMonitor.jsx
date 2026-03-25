import React, { useState } from 'react';
import { AlertTriangle, ShoppingCart, MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Builds a WhatsApp purchase order message and opens wa.me link.
 * Groups low-stock items by supplier, then sends one message per supplier.
 */
function buildWhatsAppUrl(phone, boatName, items) {
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  const lines = [
    `📦 *ORDEN DE COMPRA — ${boatName}*`,
    `📅 Fecha: ${date}`,
    ``,
    `Estimado proveedor, necesitamos reponer los siguientes suministros:`,
    ``,
    ...items.map((item, i) => {
      const needed = item.minimum_stock
        ? Math.max(0, (item.minimum_stock * 2) - (item.quantity || 0))
        : 1;
      return `${i + 1}. *${item.name}*\n   • Stock actual: ${item.quantity || 0} ${item.unit || 'unidades'}\n   • Mínimo requerido: ${item.minimum_stock || 1} ${item.unit || 'unidades'}\n   • Cantidad sugerida a pedir: ${needed} ${item.unit || 'unidades'}`;
    }),
    ``,
    `Por favor confirmar disponibilidad y precio. Gracias.`,
  ];

  const msg = lines.join('\n');
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

export default function LowStockMonitor({ boat }) {
  const [expanded, setExpanded] = useState(false);

  const supplies = boat.supplies_inventory || [];
  const sellers = boat.supply_sellers || [];

  // Find items that are low stock (quantity <= minimum_stock, and minimum_stock > 0)
  const lowStockItems = supplies.filter(
    (item) => item.minimum_stock > 0 && (item.quantity || 0) <= item.minimum_stock
  );

  if (lowStockItems.length === 0) return null;

  // Group by supplier_name
  const grouped = {};
  const noSupplier = [];

  lowStockItems.forEach((item) => {
    if (item.supplier_name) {
      if (!grouped[item.supplier_name]) grouped[item.supplier_name] = [];
      grouped[item.supplier_name].push(item);
    } else {
      noSupplier.push(item);
    }
  });

  return (
    <div className="mt-3 rounded-xl border-2 border-red-300 overflow-hidden shadow-md">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-red-600 text-white"
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
        <span className="font-bold text-sm flex-1 text-left">
          Low Stock Alert — {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need restocking
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="bg-red-50 p-3 space-y-3">
          {/* Items with a known supplier */}
          {Object.entries(grouped).map(([supplierName, items]) => {
            const seller = sellers.find((s) => s.name === supplierName);
            const hasPhone = !!seller?.phone;

            return (
              <div key={supplierName} className="bg-white rounded-lg border border-red-200 overflow-hidden">
                {/* Supplier header */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-100 border-b border-red-200">
                  <div>
                    <p className="text-xs font-bold text-red-800">{supplierName}</p>
                    {seller?.phone && (
                      <p className="text-xs text-red-600">{seller.phone}</p>
                    )}
                    {seller?.specialty && (
                      <p className="text-xs text-red-500">{seller.specialty}</p>
                    )}
                  </div>
                  {hasPhone ? (
                    <a
                      href={buildWhatsAppUrl(seller.phone, boat.name, items)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5 shadow"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Send Purchase Order
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </Button>
                    </a>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">No phone on file</Badge>
                  )}
                </div>

                {/* Items list */}
                <div className="divide-y divide-red-100">
                  {items.map((item, idx) => {
                    const pct = item.minimum_stock > 0
                      ? Math.min(100, Math.round(((item.quantity || 0) / item.minimum_stock) * 100))
                      : 0;
                    return (
                      <div key={idx} className="px-3 py-2 flex items-center gap-3">
                        <ShoppingCart className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-red-600 font-medium">
                              {item.quantity || 0} / {item.minimum_stock} {item.unit || 'units'} min
                            </span>
                            <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-700 text-xs flex-shrink-0">Low Stock</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Items with no supplier assigned */}
          {noSupplier.length > 0 && (
            <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
              <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                <p className="text-xs font-bold text-amber-800">No supplier assigned</p>
                <p className="text-xs text-amber-600">Assign a supplier to these items to send purchase orders</p>
              </div>
              <div className="divide-y divide-amber-100">
                {noSupplier.map((item, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center gap-3">
                    <ShoppingCart className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-amber-600">
                        {item.quantity || 0} / {item.minimum_stock} {item.unit || 'units'} min
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 text-xs flex-shrink-0">Low Stock</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}