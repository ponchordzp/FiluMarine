import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, Gauge, DollarSign, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function TripHistoryCard({ trip }) {
  return (
    <div 
      className={`p-3 rounded-lg border-l-4 ${
        trip.type === 'rental' 
          ? 'bg-blue-50 border-blue-500' 
          : 'bg-green-50 border-green-500'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge className={`text-xs px-1.5 py-0 ${
              trip.type === 'rental' 
                ? 'bg-blue-600 text-white' 
                : 'bg-green-600 text-white'
            }`}>
              {trip.type}
            </Badge>
            <p className="text-xs font-semibold text-slate-800 capitalize truncate">
              {trip.title}
            </p>
          </div>
          <p className="text-xs text-slate-600">
            {format(parseISO(trip.date), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      
      {/* Financial Metrics - Always show for rental */}
      {trip.type === 'rental' && (
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="bg-green-100 px-2 py-1.5 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <DollarSign className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600 font-medium">Revenue</p>
            </div>
            <p className="text-xs font-bold text-green-800">${(trip.revenue / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-red-100 px-2 py-1.5 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <DollarSign className="h-3 w-3 text-red-600" />
              <p className="text-xs text-red-600 font-medium">Expenses</p>
            </div>
            <p className="text-xs font-bold text-red-800">${(trip.expenses / 1000).toFixed(1)}k</p>
          </div>
          <div className={`px-2 py-1.5 rounded ${trip.profit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className={`h-3 w-3 ${trip.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
              <p className={`text-xs font-medium ${trip.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Profit</p>
            </div>
            <p className={`text-xs font-bold ${trip.profit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
              ${(trip.profit / 1000).toFixed(1)}k
            </p>
          </div>
          <div className={`px-2 py-1.5 rounded ${trip.roi >= 0 ? 'bg-purple-100' : 'bg-rose-100'}`}>
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className={`h-3 w-3 ${trip.roi >= 0 ? 'text-purple-600' : 'text-rose-600'}`} />
              <p className={`text-xs font-medium ${trip.roi >= 0 ? 'text-purple-600' : 'text-rose-600'}`}>ROI</p>
            </div>
            <p className={`text-xs font-bold ${trip.roi >= 0 ? 'text-purple-800' : 'text-rose-800'}`}>
              {trip.roi.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
      
      {/* Personal trip expenses */}
      {trip.type === 'personal' && trip.expenses > 0 && (
        <div className="bg-amber-100 px-2 py-1.5 rounded mb-2">
          <div className="flex items-center gap-1 mb-0.5">
            <DollarSign className="h-3 w-3 text-amber-600" />
            <p className="text-xs text-amber-600 font-medium">Cost</p>
          </div>
          <p className="text-xs font-bold text-amber-800">${(trip.expenses / 1000).toFixed(1)}k</p>
        </div>
      )}
      
      <div className="flex gap-2 text-xs text-slate-600">
        {trip.guests && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {trip.guests}
          </span>
        )}
        {trip.hours > 0 && (
          <span className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            {trip.hours}h
          </span>
        )}
      </div>
    </div>
  );
}