import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Fish, ChevronDown, ChevronUp, Clock, DollarSign, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PickupAndDeparture from './PickupAndDeparture';

export default function BoatExpeditionsPanel({
  availableExpeditions = [],
  onChange,
  expeditionPricing = [],
  onPricingChange,
  pricePerAdditionalHour = 0,
  onPricePerHourChange,
  expeditionPickupDepartures = {},
  onPickupDepartureChange,
  operator = '',
  location = '',
  disabled = false,
}) {
  const [expandedPickup, setExpandedPickup] = useState({});

  const { data: allExpeditions = [] } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => base44.entities.Expedition.list('sort_order'),
  });

  const filteredExpeditions = operator
    ? allExpeditions.filter(e => !e.operator || e.operator.toLowerCase() === operator.toLowerCase())
    : allExpeditions;

  const toggle = (expeditionId) => {
    if (availableExpeditions.includes(expeditionId)) {
      onChange(availableExpeditions.filter(e => e !== expeditionId));
    } else {
      onChange([...availableExpeditions, expeditionId]);
    }
  };

  const getPricing = (expId) => expeditionPricing.find(p => p.expedition_type === expId) || {};

  const updatePrice = (expId, field, value) => {
    if (!onPricingChange) return;
    const existing = expeditionPricing.find(p => p.expedition_type === expId);
    if (existing) {
      onPricingChange(expeditionPricing.map(p =>
        p.expedition_type === expId
          ? { ...p, [field]: field.includes('hours') || field.includes('mxn') ? parseFloat(value) || 0 : value }
          : p
      ));
    } else {
      onPricingChange([...expeditionPricing, {
        expedition_type: expId,
        duration_hours: field === 'duration_hours' ? parseFloat(value) || 0 : 0,
        price_mxn: field === 'price_mxn' ? parseFloat(value) || 0 : 0,
      }]);
    }
  };

  if (filteredExpeditions.length === 0) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-700">
        <Fish className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
        <p className="text-sm font-medium">No expeditions in catalog yet.</p>
        <p className="text-xs text-indigo-500 mt-1">Add expeditions in the Expeditions tab first.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 overflow-hidden">
      <div className="bg-indigo-600 px-5 py-3 flex items-center gap-2">
        <Fish className="h-4 w-4 text-white" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1">Available Expeditions</h3>
        <span className="text-xs text-white/70">{availableExpeditions.length} selected</span>
      </div>

      <div className="bg-indigo-50 p-4 space-y-3">
        {/* Price per additional hour */}
        {onPricePerHourChange && (
          <div className="bg-white border border-indigo-200 rounded-lg p-3">
            <Label className="text-xs font-semibold text-indigo-800 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Price Per Additional Hour (MXN)
            </Label>
            <Input
              type="number"
              min="0"
              disabled={disabled}
              value={pricePerAdditionalHour || ''}
              onChange={(e) => onPricePerHourChange(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 2500"
              className="text-sm mt-1"
            />
          </div>
        )}

        {/* Expedition list */}
        <div className="space-y-2">
          {filteredExpeditions.map((exp) => {
            const isSelected = availableExpeditions.includes(exp.expedition_id);
            const pricing = getPricing(exp.expedition_id);
            const pickupExpanded = expandedPickup[exp.expedition_id];

            return (
              <div
                key={exp.id}
                className={`rounded-lg border-2 overflow-hidden transition-all ${
                  isSelected ? 'border-indigo-500 bg-white shadow-sm' : 'border-indigo-100 bg-white/60'
                }`}
              >
                {/* Toggle row */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(exp.expedition_id)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'bg-indigo-600' : 'bg-white border-2 border-indigo-300'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  {exp.image && (
                    <img src={exp.image} alt={exp.title} className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900">{exp.title}</p>
                    <p className="text-xs text-slate-400 font-mono">{exp.expedition_id}</p>
                  </div>
                  {isSelected && <Badge className="bg-indigo-100 text-indigo-700 text-xs flex-shrink-0">Selected</Badge>}
                </button>

                {/* Inline pricing — shown only when selected */}
                {isSelected && (
                  <div className="border-t border-indigo-100 bg-indigo-50 px-3 pb-3 pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-indigo-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Duration (hours)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          disabled={disabled}
                          value={pricing.duration_hours || ''}
                          onChange={(e) => updatePrice(exp.expedition_id, 'duration_hours', e.target.value)}
                          placeholder="e.g., 4"
                          className="text-sm h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-indigo-700 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Price (MXN)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          disabled={disabled}
                          value={pricing.price_mxn || ''}
                          onChange={(e) => updatePrice(exp.expedition_id, 'price_mxn', e.target.value)}
                          placeholder="e.g., 8000"
                          className="text-sm h-8 mt-1"
                        />
                      </div>
                    </div>

                    {/* Pickup & Departure — expandable */}
                    {onPickupDepartureChange && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedPickup(prev => ({ ...prev, [exp.expedition_id]: !prev[exp.expedition_id] }))}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <MapPin className="h-3 w-3" />
                          Pickup &amp; Departure
                          {pickupExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        {pickupExpanded && (
                          <div className="mt-2">
                            <PickupAndDeparture
                              pickupAndDepartures={expeditionPickupDepartures[exp.expedition_id] || []}
                              onUpdate={(items) => onPickupDepartureChange({ ...expeditionPickupDepartures, [exp.expedition_id]: items })}
                              expeditionType={exp.expedition_id}
                              location={location}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}