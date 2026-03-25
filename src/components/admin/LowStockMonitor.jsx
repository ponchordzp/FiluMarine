import React, { useState } from 'react';
import { AlertTriangle, ShoppingCart, MessageCircle, ChevronDown, ChevronUp, ExternalLink, Package, CheckCircle, Clock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LOW_STOCK_THRESHOLD = 0.20; // 20%

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

function getLowStockInfo(item) {
  const qty = item.quantity ?? 0;
  const original = item.original_quantity ?? 0;
  const timeInfo = getTimeRemaining(item);

  if (original > 0) {
    const qtyPct = Math.round((qty / original) * 100);
    if (qtyPct <= LOW_STOCK_THRESHOLD * 100) {
      return { isLow: true, reason: 'quantity', pct: qtyPct, label: `${qty} / ${original} ${item.unit || 'units'} remaining (${qtyPct}%)` };
    }
  }

  if (item.minimum_stock > 0 && qty <= item.minimum_stock) {
    const pct = Math.round((qty / item.minimum_stock) * 100);
    return { isLow: true, reason: 'minimum_stock', pct, label: `${qty} / ${item.minimum_stock} min (${pct}%)` };
  }

  if (timeInfo && (timeInfo.expired || timeInfo.pct <= LOW_STOCK_THRESHOLD * 100)) {
    const label = timeInfo.expired
      ? `Expired — 0 days left`
      : `${timeInfo.remainingDays} days left (${timeInfo.pct}% of duration remaining)`;
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

function SupplyRow({ item, onEditSupplies }) {
  const info = item._lowInfo;
  const isDuration = info.reason === 'duration';

  return (
    <div className="px-3 py-3 bg-white">
      {/* Supply name + badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {isDuration
            ? <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            : <ShoppingCart className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          }
          <p className="text-xs font-semibold text-slate-800 leading-tight">{item.name}</p>
        </div>
        <Badge className="bg-red-100 text-red-700 text-xs border border-red-200 flex-shrink-0 whitespace-nowrap">
          Low Stock
        </Badge>
      </div>

      {/* Status label */}
      <p className={`text-xs font-medium mb-1.5 pl-5 ${isDuration ? 'text-amber-600' : 'text-red-600'}`}>
        {info.label}
      </p>

      {/* Progress bar */}
      <div className="pl-5 mb-2">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isDuration ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${info.pct}%` }}
          />
        </div>
      </div>

      {/* Edit link */}
      {onEditSupplies && (
        <button
          type="button"
          onClick={onEditSupplies}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline pl-5 transition-colors"
        >
          <Pencil className="h-2.5 w-2.5" />
          View in Supplies Editor
        </button>
      )}
    </div>
  );
}

export default function LowStockMonitor({ boat, onEditSupplies }) {
  const [expanded, setExpanded] = useState(false);

  const supplies = boat.supplies_inventory || [];
  const sellers = boat.supply_sellers || [];

  const lowStockItems = supplies
    .map((item) => ({ ...item, _lowInfo: getLowStockInfo(item) }))
    .filter((item) => item._lowInfo.isLow);

  const hasLowStock = lowStockItems.length > 0;

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
                {/* Supplier header */}
                <div className="px-3 py-2.5 bg-red-50 border-b border-red-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-red-800">{supplierName}</p>
                      {seller?.phone && <p className="text-xs text-red-600 mt-0.5">{seller.phone}</p>}
                      {seller?.specialty && <p className="text-xs text-slate-500 italic mt-0.5">{seller.specialty}</p>}
                    </div>
                    {hasPhone ? (
                      <a href={buildWhatsAppUrl(seller.phone, boat.name, items)} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <Button type="button" size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs gap-1 shadow-sm">
                          <MessageCircle className="h-3 w-3" />
                          Order
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </Button>
                      </a>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 text-xs border border-amber-300 flex-shrink-0">No phone</Badge>
                    )}
                  </div>
                </div>

                {/* Supply rows */}
                <div className="divide-y divide-red-100">
                  {items.map((item, idx) => (
                    <SupplyRow key={idx} item={item} onEditSupplies={onEditSupplies} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Items with no supplier */}
          {noSupplier.length > 0 && (
            <div className="rounded-lg border-2 border-amber-200 overflow-hidden">
              <div className="px-3 py-2.5 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-amber-700 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">No supplier assigned</p>
                    <p className="text-xs text-amber-600">Go to Manage Vessel → Supplies to assign a supplier</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-amber-100">
                {noSupplier.map((item, idx) => (
                  <SupplyRow key={idx} item={item} onEditSupplies={onEditSupplies} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}