import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Users, Anchor, Wifi, Video, Zap, Droplet, Fish, Navigation } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const equipmentIcons = {
  bathroom: Droplet,
  live_well: Fish,
  starlink: Wifi,
  cctv: Video,
  audio_system: Zap,
  gps: Navigation,
  fishing_gear: Fish,
  snorkeling_gear: Droplet,
};

export default function BoatDetailModal({ boat, isOpen, onClose }) {
  if (!boat) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 text-white border-white/20">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {boat.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Boat Image */}
          <div className="aspect-video rounded-2xl overflow-hidden">
            <img 
              src={boat.image} 
              alt={boat.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 px-4 py-2">
              {boat.type}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 px-4 py-2">
              {boat.size}
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 px-4 py-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {boat.capacity}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-cyan-400">About</h3>
            <p className="text-white/80 leading-relaxed">{boat.description}</p>
          </div>

          {/* Equipment & Features */}
          {boat.equipment && Object.keys(boat.equipment).some(key => boat.equipment[key]) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-cyan-400">Equipment & Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(boat.equipment).map(([key, value]) => {
                  if (!value) return null;
                  const Icon = equipmentIcons[key] || Anchor;
                  return (
                    <div key={key} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                      <Icon className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                      <span className="text-sm capitalize text-white/90">{key.replace(/_/g, ' ')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Experiences */}
          {boat.available_expeditions && boat.available_expeditions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-cyan-400">Available Experiences</h3>
              <div className="flex flex-wrap gap-2">
                {boat.available_expeditions.map((exp) => (
                  <span 
                    key={exp} 
                    className="text-sm bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 px-4 py-2 rounded-full border border-cyan-400/30 capitalize"
                  >
                    {exp.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Engine Details */}
          {boat.engine_name && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-cyan-400">Engine</h3>
              <p className="text-white/80">{boat.engine_name}</p>
              {boat.engine_config && (
                <p className="text-white/60 text-sm mt-1 capitalize">{boat.engine_config}</p>
              )}
            </div>
          )}

          {/* Crew */}
          {boat.crew_members > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-cyan-400">Crew</h3>
              <p className="text-white/80">{boat.crew_members} crew member{boat.crew_members > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}