import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Fish, ChevronDown, ChevronUp, Clock, DollarSign, MapPin, Sparkles, Trash2, Plus } from 'lucide-react';
import { SectionLockButton } from './SectionLock';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PickupAndDeparture from './PickupAndDeparture';
import { useAuth } from '@/lib/AuthContext';

export default function BoatExpeditionsPanelFixed({
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
  locks = {},
  toggleLock = () => {},
  sectionKey = 'expeditions',
  currency = 'MXN',
}) {
  const { user: currentUser } = useAuth();
  const [expandedPickup, setExpandedPickup] = useState({});
  const [expandedExtras, setExpandedExtras] = useState({});
  const [selectedExtraId, setSelectedExtraId] = useState({});
  const [customPrice, setCustomPrice] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const isComplete = availableExpeditions.length > 0;

  const { data: allExtras = [] } = useQuery({
    queryKey: ['extras'],
    queryFn: () => base44.entities.Extra.list('sort_order'),
  });

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const operatorExtras = isSuperAdmin
    ? allExtras
    : allExtras.filter(e => {
        const userOp = currentUser?.operator || 'FILU';
        const allowed = e.allowed_operators || [];
        return allowed.length === 0 || allowed.some(o => o.toLowerCase() === userOp.toLowerCase());
      });

  const { data: allExpeditions = [] } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => base44.entities.Expedition.list('sort_order'),
  });

  const filteredExpeditions = (() => {
    if (!operator) return allExpeditions;
    const ownExps = allExpeditions.filter(e => e.operator && e.operator.toLowerCase() === operator.toLowerCase());
    const ownIds = new Set(ownExps.map(e => e.expedition_id));
    const globalExps = allExpeditions.filter(e => !e.operator && !ownIds.has(e.expedition_id));
    return [...globalExps, ...ownExps].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  })();

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

  const updateExtras = (expId, extrasArray) => {
    if (!onPricingChange) return;
    const existing = expeditionPricing.find(p => p.expedition_type === expId);
    if (existing) {
      onPricingChange(expeditionPricing.map(p =>
        p.expedition_type === expId
          ? { ...p, extras: extrasArray }
          : p
      ));
    } else {
      onPricingChange([...expeditionPricing, {
        expedition_type: expId,
        extras: extrasArray
      }]);
    }
  };

  const handleAddExtra = (expId) => {
    const extraId = selectedExtraId[expId];
    if (!extraId) return;
    const extra = operatorExtras.find(e => e.id === extraId);
    if (!extra) return;
    
    const pricing = getPricing(expId);
    const currentExtras = pricing.extras || [];
    const newPrice = customPrice[expId] !== undefined && customPrice[expId] !== '' ? parseFloat(customPrice[expId]) : (extra.price || 0);

    updateExtras(expId, [
      ...currentExtras,
      {
        extra_id: extra.id,
        extra_name: extra.name,
        description: extra.description || '',
        price: newPrice,
      },
    ]);
    setSelectedExtraId(prev => ({ ...prev, [expId]: '' }));
    setCustomPrice(prev => ({ ...prev, [expId]: '' }));
  };

  const handleRemoveExtra = (expId, extraId) => {
    const pricing = getPricing(expId);
    const currentExtras = pricing.extras || [];
    updateExtras(expId, currentExtras.filter(e => e.extra_id !== extraId));
  };

  const handleUpdateExtraPrice = (expId, extraId, newPrice) => {
    const pricing = getPricing(expId);
    const currentExtras = pricing.extras || [];
    updateExtras(expId, currentExtras.map(e =>
      e.extra_id === extraId ? { ...e, price: parseFloat(newPrice) || 0 } : e
    ));
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
      <button type="button" onClick={() => setCollapsed(p => !p)} className="w-full bg-indigo-600 px-5 py-3 flex items-center gap-2">
        <Fish className="h-4 w-4 text-white" />
        <h3 className="text-sm font-bold text-white tracking-wide uppercase flex-1 text-left">Available Expeditions</h3>
        <span className="text-xs text-white/80 mr-1">{availableExpeditions.length} selected</span>
        <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden mr-2">
          <div className="h-full bg-white transition-all rounded-full" style={{ width: availableExpeditions.length > 0 ? '100%' : '0%' }} />
        </div>
        <SectionLockButton sectionKey={sectionKey} locks={locks} toggle={toggleLock} isComplete={isComplete} />
        {collapsed ? <ChevronDown className="h-4 w-4 text-white/70" /> : <ChevronUp className="h-4 w-4 text-white/70" />}
      </button>

      {!collapsed && <div className="bg-indigo-50 p-4 space-y-3">
        {disabled && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5"><span>Section locked — unlock to edit.</span></div>}
        {/* Price per additional hour */}
        {onPricePerHourChange && (
          <div className="bg-white border border-indigo-200 rounded-lg p-3">
            <Label className="text-xs font-semibold text-indigo-800 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Price Per Additional Hour ({currency})
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
                          <DollarSign className="h-3 w-3" /> Price ({currency})
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

                    {/* Extras — expandable */}
                    <div>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setExpandedExtras(prev => ({ ...prev, [exp.expedition_id]: !prev[exp.expedition_id] }))}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium mb-2"
                      >
                        <Sparkles className="h-3 w-3" />
                        Extras / Add-ons ({(pricing.extras || []).length})
                        {expandedExtras[exp.expedition_id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      {expandedExtras[exp.expedition_id] && (
                        <div className="mt-2 space-y-2 mb-4">
                          {(pricing.extras || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No extras added yet.</p>
                          )}
                          {(pricing.extras || []).map(be => (
                            <div key={be.extra_id} className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg px-3 py-2">
                              <Sparkles className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                              <span className="text-xs font-medium text-slate-700 flex-1 truncate">{be.extra_name}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500">$</span>
                                <Input
                                  type="number"
                                  min="0"
                                  disabled={disabled}
                                  value={be.price}
                                  onChange={e => !disabled && handleUpdateExtraPrice(exp.expedition_id, be.extra_id, e.target.value)}
                                  className="h-6 w-16 text-xs px-1"
                                />
                                <span className="text-[10px] text-slate-400">{currency}</span>
                              </div>
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => !disabled && handleRemoveExtra(exp.expedition_id, be.extra_id)}
                                className={`text-red-400 hover:text-red-600 flex-shrink-0 ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          {operatorExtras.filter(e => !(pricing.extras || []).some(be => be.extra_id === e.id)).length > 0 && !disabled && (
                            <div className="flex items-center gap-2 pt-1">
                              <select
                                value={selectedExtraId[exp.expedition_id] || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSelectedExtraId(prev => ({ ...prev, [exp.expedition_id]: val }));
                                  const ex = operatorExtras.find(x => x.id === val);
                                  setCustomPrice(prev => ({ ...prev, [exp.expedition_id]: ex?.price?.toString() || '0' }));
                                }}
                                className="flex-1 h-7 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <option value="">Select extra...</option>
                                {operatorExtras.filter(e => !(pricing.extras || []).some(be => be.extra_id === e.id)).map(e => (
                                  <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">$</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={customPrice[exp.expedition_id] ?? ''}
                                  onChange={e => setCustomPrice(prev => ({ ...prev, [exp.expedition_id]: e.target.value }))}
                                  placeholder="Price"
                                  className="h-7 w-16 text-xs px-1"
                                />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleAddExtra(exp.expedition_id)}
                                disabled={!selectedExtraId[exp.expedition_id]}
                                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pickup & Departure — expandable */}
                    {onPickupDepartureChange && (
                      <div>
                        <button
                          type="button"
                          disabled={disabled}
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
      </div>}
    </div>
  );
}