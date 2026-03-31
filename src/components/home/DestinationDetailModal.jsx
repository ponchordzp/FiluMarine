import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, X } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherWidget from '@/components/booking/WeatherWidget';

export default function DestinationDetailModal({ destination, isOpen, onClose }) {
  if (!destination) return null;

  const images = destination.images && destination.images.length > 0
    ? destination.images.slice(0, 4)
    : [destination.image];

  // Pad with fallback if fewer than 4 images
  while (images.length < 4) {
    images.push('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800');
  }

  // Parse coordinates if available (format: "17.6617°N, 101.5528°W")
  const parseCoordinates = (coordStr) => {
    if (!coordStr) return null;
    const match = coordStr.match(/(-?\d+\.?\d*)[°]?([NS])?,?\s*(-?\d+\.?\d*)[°]?([EW])?/);
    if (match) {
      const lat = parseFloat(match[1]) * (match[2] === 'S' ? -1 : 1);
      const lon = parseFloat(match[3]) * (match[4] === 'W' ? -1 : 1);
      return { lat, lon };
    }
    return null;
  };

  const coords = parseCoordinates(destination.coordinates);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-[#0a1f3d] border-white/20">
        {/* Header with close button */}
        <div className="sticky top-0 z-20 bg-[#0a1f3d] border-b border-white/10 p-6 flex items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="h-6 w-6 text-cyan-400" />
            {destination.name}
          </DialogTitle>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Photo Album Grid (4 images) */}
          <div className="grid grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl overflow-hidden h-48"
              >
                <img
                  src={img}
                  alt={`${destination.name} - ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>

          {/* Coordinates & Weather */}
          <div className="grid md:grid-cols-2 gap-4">
            {destination.coordinates && (
              <div className="rounded-lg p-4" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Coordinates</h4>
                <p className="text-white font-mono text-sm">{destination.coordinates}</p>
                {coords && (
                  <p className="text-white/50 text-xs mt-1">
                    {coords.lat.toFixed(4)}°, {coords.lon.toFixed(4)}°
                  </p>
                )}
              </div>
            )}

            {/* Weather Widget */}
            {destination.coordinates && (
              <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <WeatherWidget coordinates={destination.coordinates} />
              </div>
            )}
          </div>

          {/* Full Description */}
          {destination.summary && (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">About</h4>
              <p className="text-white/70 leading-relaxed">
                {destination.summary}
              </p>
            </div>
          )}

          {/* Activities */}
          {destination.activities && destination.activities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white">Activities</h4>
              <div className="grid grid-cols-2 gap-2">
                {destination.activities.map((activity, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2 text-white/80 text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    {activity}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}