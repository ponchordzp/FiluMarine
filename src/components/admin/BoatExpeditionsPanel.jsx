import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Fish, Plus, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function BoatExpeditionsPanel({ availableExpeditions = [], onChange }) {
  const { data: allExpeditions = [] } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => base44.entities.Expedition.list('sort_order'),
  });

  const toggle = (expeditionId) => {
    if (availableExpeditions.includes(expeditionId)) {
      onChange(availableExpeditions.filter(e => e !== expeditionId));
    } else {
      onChange([...availableExpeditions, expeditionId]);
    }
  };

  if (allExpeditions.length === 0) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-700">
        <Fish className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
        <p className="text-sm font-medium">No expeditions found in the catalog.</p>
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
      <div className="bg-indigo-50 p-4 space-y-2">
        <p className="text-xs text-indigo-700 mb-3">Select the expeditions this boat can offer. Pricing is configured in the <strong>Vessel Details → Expeditions & Pricing</strong> tab.</p>
        <div className="space-y-2">
          {allExpeditions.map((exp) => {
            const isSelected = availableExpeditions.includes(exp.expedition_id);
            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => toggle(exp.expedition_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-white shadow-sm'
                    : 'border-indigo-100 bg-white/50 hover:border-indigo-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'bg-indigo-600' : 'bg-white border-2 border-indigo-300'
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                {exp.image && (
                  <img src={exp.image} alt={exp.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-900">{exp.title}</p>
                  <div className="flex gap-2 flex-wrap mt-0.5">
                    {exp.duration && <span className="text-xs text-indigo-600">{exp.duration}</span>}
                    <span className="text-xs text-slate-400 font-mono">{exp.expedition_id}</span>
                  </div>
                </div>
                {isSelected && (
                  <Badge className="bg-indigo-100 text-indigo-700 text-xs">Selected</Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}