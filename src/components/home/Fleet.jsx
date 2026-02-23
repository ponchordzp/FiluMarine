import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Anchor, Users, Gauge, Shield, Wifi, Video, Zap, Wrench, Droplet, Fish, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

const fleetByLocation = {
  ixtapa_zihuatanejo: [
    {
      name: 'FILU',
      type: 'Sea Fox Center Console',
      size: '25ft',
      description: 'High-performance center console designed for serious sport fishing and coastal adventures. Features twin engines for speed and reliability.',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/3e48387ed_image.png',
      capacity: 'Up to 6 guests',
      strengths: [
        { icon: Gauge, text: 'Perfect for sport fishing' },
        { icon: Users, text: 'Stable & spacious' },
        { icon: Shield, text: 'Safety-first design' },
        { icon: Wifi, text: 'Starlink connectivity' },
        { icon: Video, text: 'CCTV safety system' },
        { icon: Zap, text: 'Premium audio system' },
      ],
    },
    {
      name: 'TYCOON',
      type: 'Azimut Yacht',
      size: '55ft',
      description: 'Pristine luxury yacht perfect for extended leisure trips. Includes ceviche, 24 beers, and a bottle of your choice. Spacious interior with full amenities.',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/ac63db837_image.png',
      capacity: 'Up to 12 guests',
      strengths: [
        { icon: Anchor, text: 'Luxury leisure cruising' },
        { icon: Users, text: 'Spacious cabin & deck' },
        { icon: Shield, text: 'Premium comfort' },
        { icon: Wifi, text: 'Starlink connectivity' },
        { icon: Video, text: 'CCTV safety system' },
        { icon: Zap, text: 'Premium audio system' },
      ],
    },
  ],
  acapulco: [
    {
      name: 'Pirula',
      type: 'Leisure Boat',
      size: '50ft',
      description: 'Spacious leisure vessel perfect for relaxed cruising and group excursions. Comfortable seating and smooth ride for extended trips.',
      image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
      capacity: 'Up to 10 guests',
      strengths: [
        { icon: Anchor, text: 'Ideal for leisure trips' },
        { icon: Users, text: 'Spacious deck area' },
        { icon: Shield, text: 'Comfortable seating' },
        { icon: Wifi, text: 'Modern amenities' },
        { icon: Video, text: 'Safety equipment' },
        { icon: Zap, text: 'Sound system' },
      ],
    },
    {
      name: 'La Güera',
      type: 'Center Console',
      size: '30ft',
      description: 'Versatile center console perfect for fishing enthusiasts. Nimble and efficient for exploring Acapulco\'s coastal waters.',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/1ab25cee2_image.png',
      capacity: 'Up to 7 guests',
      strengths: [
        { icon: Gauge, text: 'Excellent for fishing' },
        { icon: Users, text: 'Stable platform' },
        { icon: Shield, text: 'Reliable performance' },
        { icon: Wifi, text: 'GPS navigation' },
        { icon: Video, text: 'Safety features' },
        { icon: Zap, text: 'Quick & agile' },
      ],
    },
  ],
};

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

export default function Fleet({ location = 'ixtapa_zihuatanejo' }) {
  const { data: boatsFromDB = [] } = useQuery({
    queryKey: ['boats', location],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
  });

  const activeBoats = boatsFromDB.filter(boat => 
    boat.location === location && 
    boat.status === 'active' && 
    boat.boat_mode !== 'maintenance_only'
  );

  const fleet = activeBoats.length > 0 ? activeBoats.map(boat => {
    const strengths = [];
    
    if (boat.equipment) {
      Object.entries(boat.equipment).forEach(([key, value]) => {
        if (value) {
          const Icon = equipmentIcons[key] || Shield;
          strengths.push({
            icon: Icon,
            text: key.replace(/_/g, ' ')
          });
        }
      });
    }

    if (strengths.length === 0) {
      strengths.push({ icon: Shield, text: 'Quality equipment' });
    }

    return {
      name: boat.name,
      type: boat.type,
      size: boat.size,
      description: boat.description,
      image: boat.image,
      capacity: boat.capacity,
      strengths: strengths,
      maintenance_schedule: boat.maintenance_schedule,
      parts_inventory: boat.parts_inventory,
    };
  }) : (fleetByLocation[location] || fleetByLocation.ixtapa_zihuatanejo);

  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-[#0a1929] to-[#0c2340] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Our <span className="font-semibold">Fleet</span>
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Two exceptional vessels for every type of adventure
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {fleet.map((boat, i) => (
            <motion.div
              key={boat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-500"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <img 
                  src={boat.image} 
                  alt={boat.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1">{boat.name}</h3>
                  <p className="text-white/80 text-sm">{boat.type} • {boat.size}</p>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p className="text-white/80 text-sm mb-3">{boat.description}</p>
                
                <p className="text-white/80 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {boat.capacity}
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {boat.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-white">
                      <strength.icon className="h-4 w-4 text-[#1e88e5] flex-shrink-0" />
                      <span className="text-sm capitalize">{strength.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}