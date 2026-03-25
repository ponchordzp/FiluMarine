import React, { useState } from 'react';
import { AlertTriangle, ShoppingCart, MessageCircle, ChevronDown, ChevronUp, ExternalLink, Package, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LOW_STOCK_THRESHOLD = 0.20; // 20%

// Mirrors the calculateSupplyTimeRemaining logic from BoatManagement
function getTimeRemaining(item) {
  if (!item.purchased_date || !item.duration_months) return null;
  const purchased = new Date(item.purchased_date);
  const now = new Date();
  const totalDays = item.duration_months * 30;
  const elapsedDays = Math.floor((now - purchased) / (1000 * 60 * 60 * 24));
  const baseQty = item.original_quantity ?? item.quantity ?? 0;
  let effectiveTotalDays = totalDays;
  if (baseQty > 0 && item.quantity !== undefined && item.quantity < baseQty) {
    const remainingFraction = Math.max(0, item.quantity / baseQty);
    effectiveTotalDays = totalDays * remainingFraction;
  }
  const remainingDays = Math.max(0, effectiveTotalDays - elapsedDays);
  const pct = effectiveTotalDays > 0
    ? Math.max(0, Math.min(100, (remainingDays / effectiveTotalDays) * 100))
    : 0;
  return { remainingDays: Math.round(remainingDays), pct: Math.round(pct), expired: remainingDays === 0 };
}

// Item is low stock if EITHER quantity ≤ 20% of original OR time remaining ≤ 20%
function getLowStockInfo(item) {
  const qty = item.quantity ?? 0;
  const original = item.original_quantity ?? 0;
  const timeInfo = getTimeRemaining(item);

  // Quantity-based check
  if (original > 0) {
    const qtyPct = Math.round((qty / original) * 100);
    if (qtyPct <= LOW_STOCK_THRESHOLD * 100) {
      return { isLow: true, reason: 'quantity', pct: qtyPct, label: `${qty} / ${original} ${item.unit || 'units'} (${qtyPct}%)` };
    }
  }

  // Fallback minimum_stock check
  if (item.minimum_stock > 0 && qty <= item.minimum_stock) {
    const pct = Math.round((qty / item.minimum_stock) * 100);
    return { isLow: true, reason: 'minimum_stock', pct, label: `${qty} / ${item.minimum_stock} min (${pct}%)` };
  }

  // Time/duration-based check
  if (timeInfo && (timeInfo.expired || timeInfo.pct <= LOW_STOCK_THRESHOLD * 100)) {
    const label = timeInfo.expired
      ? `Expired — 0 days left`
      : `${timeInfo.remainingDays} days left (${timeInfo.pct}% remaining)`;
    return { isLow: true, reason: 'duration', pct: timeInfo.pct, label };
  }

  return { isLow: false };
}

function buildWhatsAppUrl(phone, boatName, items) {
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const itemLines = items.map((item, i) => {
    const qty = item.quantity ?? 0;
    const original = item.original_quantity ?? 0;
    const timeInfo = getTimeRemaining(item);
    const suggested = original > qty ? Math.ceil(original - qty) : original > 0 ? original : 1;
    const statusLine = timeInfo
      ? `Tiempo restante: ${timeInfo.remainingDays} días (${timeInfo.pct}%)`
      : `Stock actual: ${qty} ${item.unit || 'unidades'}`;
    return `${i + 1}. *${item.name}*\n   • ${statusLine}\n   • Cantidad original: ${original || 'N/A'} ${item.unit || 'unidades'}\n   • Cantidad sugerida a reponer: ${suggested} ${item.unit || 'unidades'}`;
  });
  const message = [
    `📦 *ORDEN DE COMPRA — ${boatName}*`,
    `📅 Fecha: ${date}`,
    ``,
    `Estimado proveedor, los siguientes suministros están por agotarse y necesitamos reponerlos:`,
    ``,
    ...itemLines,
    ``,
    `Por favor confirmar disponibilidad y precio. Gracias.`,
  ].join('\n');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default function LowStockMonitor({ boat }) {
  const [expanded, setExpanded] = useState(false);

  const supplies = boat.supplies_inventory || [];
  const sellers = boat.supply_sellers || [];

  // Evaluate every supply item
  const lowStockItems = supplies
    .map((item) => ({ ...item, _lowInfo: getLowStockInfo(item) }))
    .filter((item) => item._lowInfo.isLow);

  const hasLowStock = lowStockItems.length > 0;

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
    <div className="mt-3 pt-3 border-t">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between gap-2 mb-2 group"
      >
        <h4 className={`font-semibold text-xs flex items-center gap-2 ${hasLowStock ? 'text-red-700' : 'text-slate-700'}`}>
          {hasLowStock
            ? <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
            : <ShoppingCart className="h-3 w-3 text-slate-500" />
          }
          Low Stock Monitor
          {hasLowStock && (
            <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {lowStockItems.length}
            </span>
          )}
        </h4>
        {expanded
          ? <ChevronUp className="h-3 w-3 text-slate-400" />
          : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-3">
          {!hasLowStock && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">All supplies are above 20% — no restocking needed.</p>
            </div>
          )}

          {/* Per-supplier groups */}
          {Object.entries(grouped).map(([supplierName, items]) => {
            const seller = sellers.find((s) => s.name === supplierName);
            const hasPhone = !!seller?.phone;
            return (
              <div key={supplierName} className="rounded-lg border-2 border-red-200 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 border-b border-red-200">
                  <div>
                    <p className="text-xs font-bold text-red-800">{supplierName}</p>
                    {seller?.phone && <p className="text-xs text-red-600">{seller.phone}</p>}
                    {seller?.specialty && <p className="text-xs text-slate-500 italic">{seller.specialty}</p>}
                  </div>
                  {hasPhone ? (
                    <a href={buildWhatsAppUrl(seller.phone, boat.name, items)} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs gap-1 shadow-sm">
                        <MessageCircle className="h-3 w-3" />
                        Purchase Order
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                      </Button>
                    </a>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 text-xs border border-amber-300">No phone on file</Badge>
                  )}
                </div>
                <div className="divide-y divide-red-100 bg-white">
                  {items.map((item, idx) => {
                    const info = item._lowInfo;
                    const isDuration = info.reason === 'duration';
                    return (
                      <div key={idx} className="px-3 py-2 flex items-center gap-3">
                        {isDuration
                          ? <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          : <ShoppingCart className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-medium whitespace-nowrap ${isDuration ? 'text-amber-600' : 'text-red-600'}`}>
                              {info.label}
                            </span>
                            <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isDuration ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${info.pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <Badge className={`text-xs border flex-shrink-0 ${isDuration ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                          {isDuration ? 'Expiring' : 'Low Stock'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Items with no supplier */}
          {noSupplier.length > 0 && (
            <div className="rounded-lg border-2 border-amber-200 overflow-hidden">
              <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                <Package className="h-3 w-3 text-amber-700" />
                <div>
                  <p className="text-xs font-bold text-amber-800">No supplier assigned</p>
                  <p className="text-xs text-amber-600">Go to Manage Vessel → Supplies to assign a supplier</p>
                </div>
              </div>
              <div className="divide-y divide-amber-100 bg-white">
                {noSupplier.map((item, idx) => {
                  const info = item._lowInfo;
                  const isDuration = info.reason === 'duration';
                  return (
                    <div key={idx} className="px-3 py-2 flex items-center gap-3">
                      {isDuration
                        ? <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        : <ShoppingCart className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-amber-700 font-medium whitespace-nowrap">{info.label}</span>
                          <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${info.pct}%` }} />
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 text-xs border border-amber-200 flex-shrink-0">
                        {isDuration ? 'Expiring' : 'Low Stock'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}