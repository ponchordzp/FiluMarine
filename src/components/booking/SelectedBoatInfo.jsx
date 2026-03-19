import React from 'react';
import { Users, Anchor, Wifi, Video, Zap, Droplet, Fish, Navigation, Wind } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';

const equipmentIcons = {
  bathroom: Droplet,
  live_well: Fish,
  starlink: Wifi,
  cctv: Video,
  audio_system: Zap,
  gps: Navigation,
  fishing_gear: Fish,
  snorkeling_gear: Droplet,
  wifi: Wifi,
  air_conditioning: Wind,
  refrigerator: Droplet,
  ice_maker: Droplet,
  shower: Droplet,
  bimini_top: Anchor,
  anchor: Anchor,
};

export default function SelectedBoatInfo({ boat }) {
  if (!boat) return null;

  const activeEquipment = boat.equipment
    ? Object.entries(boat.equipment).filter(([, v]) => v)
    : [];

  const activeCustomEquipment = (boat.custom_equipment || []).filter((_, i) =>
    boat.custom_equipment_visibility?.[i] !== false
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 mb-10"
    >
      <div className="rounded-3xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md">
        {/* Image + basic info */}
        <div className="grid md:grid-cols-2 gap-0">
          {boat.image && (
            <div className="aspect-video md:aspect-auto md:h-72 overflow-hidden">
              <img
                src={boat.image}
                alt={boat.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 flex flex-col justify-center gap-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {boat.type && (
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 px-3 py-1.5">
                  {boat.type}
                </Badge>
              )}
              {boat.size && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-1.5">
                  {boat.size}
                </Badge>
              )}
              {boat.capacity && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 px-3 py-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {boat.capacity}
                </Badge>
              )}
            </div>

            {/* Description */}
            {boat.description && (
              <p className="text-white/80 text-sm leading-relaxed">{boat.description}</p>
            )}

            {/* Engine */}
            {boat.engine_name && (
              <div className="flex items-start gap-2">
                <Anchor className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide mb-0.5">Engine</p>
                  <p className="text-white/80 text-sm">{boat.engine_name}</p>
                  {boat.engine_config && (
                    <p className="text-white/50 text-xs capitalize">{boat.engine_config}</p>
                  )}
                </div>
              </div>
            )}

            {/* Crew */}
            {boat.crew_members > 0 && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide mb-0.5">Crew</p>
                  <p className="text-white/80 text-sm">
                    {boat.crew_members} crew member{boat.crew_members > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Equipment */}
        {(activeEquipment.length > 0 || activeCustomEquipment.length > 0) && (
          <div className="px-6 pb-6 border-t border-white/10 pt-5">
            <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide mb-3">Equipment & Features</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {activeEquipment.map(([key]) => {
                const Icon = equipmentIcons[key] || Anchor;
                return (
                  <div key={key} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                    <Icon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs capitalize text-white/80">{key.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
              {activeCustomEquipment.map((item, i) => (
                <div key={`custom-${i}`} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <Anchor className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-xs text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}