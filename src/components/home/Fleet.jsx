import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BoatImageCarousel from '@/components/booking/BoatImageCarousel';
import { base44 } from '@/api/base44Client';
import { Anchor, Users, Gauge, Shield, Wifi, Video, Zap, Wrench, Droplet, Fish, Navigation, Waves, Sun, Clock, AlertTriangle, MapPin, Lock, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import BoatDetailModal from '@/components/booking/BoatDetailModal';

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
      available_expeditions: ['snorkeling', 'coastal_leisure', 'sunset_tour'],
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
      available_expeditions: ['half_day_fishing', 'full_day_fishing', 'snorkeling'],
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

export default function Fleet({ location = 'ixtapa_zihuatanejo', onSelectBoat }) {
  const [selectedBoatDetail, setSelectedBoatDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedEquipment, setExpandedEquipment] = useState({});
  const [expandedExperiences, setExpandedExperiences] = useState({});
  const [expandedDesc, setExpandedDesc] = useState({});
  
  const toggleEquipment = (name) => setExpandedEquipment(prev => ({ ...prev, [name]: !prev[name] }));
  const toggleExperiences = (name) => setExpandedExperiences(prev => ({ ...prev, [name]: !prev[name] }));
  const toggleDesc = (name) => setExpandedDesc(prev => ({ ...prev, [name]: !prev[name] }));

  const { data: boatsFromDB = [] } = useQuery({
    queryKey: ['boats', location],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-availability'],
    queryFn: () => base44.entities.Booking.list(),
  });

  const activeBoats = boatsFromDB.filter(boat => {
    const matchLocation = (boat.location || '').toLowerCase().trim() === (location || '').toLowerCase().trim();
    const matchStatus = !boat.status || boat.status === 'active';
    const matchMode = boat.boat_mode !== 'maintenance_only';
    return matchLocation && matchStatus && matchMode;
  });

  const fleet = activeBoats.map(boat => {
    const strengths = [];
    if (boat.equipment) {
      Object.entries(boat.equipment).forEach(([key, value]) => {
        if (value && boat.equipment_visibility?.[key] !== false) {
          const Icon = equipmentIcons[key] || Shield;
          strengths.push({ icon: Icon, text: key.replace(/_/g, ' ') });
        }
      });
    }
    if (boat.custom_equipment && Array.isArray(boat.custom_equipment)) {
      boat.custom_equipment.forEach((eq, idx) => {
        if (boat.custom_equipment_visibility?.[idx] !== false) {
          strengths.push({ icon: Shield, text: eq });
        }
      });
    }
    if (strengths.length === 0) strengths.push({ icon: Shield, text: 'Quality equipment' });
    return { ...boat, strengths };
  });

  const handleBoatClick = (boat) => {
    setSelectedBoatDetail(boat);
    setShowDetailModal(true);
  };

  const handleSelectBoat = (boat) => {
    setShowDetailModal(false);
    onSelectBoat?.(boat);
  };

  const isAvailableTomorrow = (boatName) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowBookings = bookings.filter(b =>
      b.boat_name === boatName &&
      b.date === tomorrowStr &&
      b.status !== 'cancelled'
    );
    return tomorrowBookings.length === 0;
  };

  return (
    <section className="relative py-6 md:py-10 overflow-hidden" style={{ backgroundImage: `url('https://media.base44.com/images/public/6987f0afff96227dd3af0e68/388bdd58c_FILUMarine3.png')`, backgroundRepeat: 'repeat', backgroundSize: '300px 300px', backgroundColor: '#081830' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0d2a50cc, #081830cc)' }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
            Our <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Fleet</span>
          </h2>
          <p className="text-white/70 text-xl max-w-xl mx-auto">
            Two exceptional vessels for every type of adventure
          </p>
        </motion.div>

        <div className={`grid gap-8 ${fleet.length === 3 ? 'md:grid-cols-3' : fleet.length % 2 === 0 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {fleet.map((boat, i) => (
            <motion.div
              key={boat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleBoatClick(boat)}
              className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:border-cyan-400/40 hover:bg-white/15 transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.3)] flex flex-col"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <BoatImageCarousel boat={boat} aspectClass="aspect-[16/9]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                  <h3 className="text-2xl font-bold text-white mb-1">{boat.name}</h3>
                  <p className="text-white/80 text-sm">{boat.type} • {boat.size}</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                {/* Description */}
                <div className="mb-4 flex-shrink-0">
                  <div className={`text-white/80 text-sm ${expandedDesc[boat.name] ? '' : 'line-clamp-3'} min-h-[3.75rem]`}>
                    {boat.description || 'No description available.'}
                  </div>
                  {boat.description && boat.description.length > 110 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleDesc(boat.name); }}
                      className="text-cyan-400 text-xs font-medium mt-1 hover:text-cyan-300"
                    >
                      {expandedDesc[boat.name] ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>

                {/* Available Tomorrow Alert Container (Fixed Height to align elements below) */}
                <div className="h-10 mb-4 flex-shrink-0">
                  {isAvailableTomorrow(boat.name) && (
                    <div className="h-full px-3 flex items-center justify-center bg-red-500/20 border border-red-500/40 rounded-lg animate-pulse">
                      <p className="text-xs font-semibold text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />Available Tomorrow
                      </p>
                    </div>
                  )}
                </div>

                {/* Capacity (Fixed Height) */}
                <div className="h-6 mb-4 flex items-center gap-2 flex-shrink-0">
                  <Users className="h-4 w-4 text-white/50" />
                  <span className="text-white/80 text-sm truncate">{boat.capacity || 'Up to 6 guests'}</span>
                </div>

                {/* Equipment */}
                <div className="mb-4 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleEquipment(boat.name); }}
                    className="w-full flex items-center justify-between text-xs font-semibold text-white/50 uppercase tracking-wide hover:text-white/70 transition-colors"
                  >
                    <span>Standard Equipment</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedEquipment[boat.name] ? '' : '-rotate-90'}`} />
                  </button>
                  {expandedEquipment[boat.name] && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
                      {boat.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-white">
                          <strength.icon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-xs capitalize truncate">{strength.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Experiences */}
                {boat.available_expeditions && boat.available_expeditions.length > 0 && (
                  <div className="pt-4 border-t border-white/10 mb-6 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExperiences(boat.name); }}
                      className="w-full flex items-center justify-between text-xs font-semibold text-white/50 uppercase tracking-wide hover:text-white/70 transition-colors"
                    >
                      <span>Available Experiences</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedExperiences[boat.name] ? '' : '-rotate-90'}`} />
                    </button>
                    {expandedExperiences[boat.name] && (
                      <div className="space-y-3 mt-4">
                        {boat.available_expeditions.map((exp) => {
                          const pricing = boat.expedition_pricing?.find(p => p.expedition_type === exp);
                          const defaultDurations = {
                            half_day_fishing: { hours: 5 }, full_day_fishing: { hours: 8 },
                            extended_fishing: { hours: 10 }, snorkeling: { hours: 5 },
                            coastal_leisure: { hours: 5 }, sunset_tour: { hours: 3 },
                          };
                          const durationHours = pricing?.duration_hours || (defaultDurations[exp]?.hours ?? 5);
                          const expIcons = {
                            half_day_fishing: Fish, full_day_fishing: Fish, extended_fishing: Anchor,
                            snorkeling: Waves, coastal_leisure: Navigation, sunset_tour: Sun,
                          };
                          const ExpIcon = expIcons[exp] || Anchor;
                          const displayName = exp === 'extended_fishing' ? 'Full Day Expedition' : exp.replace(/_/g, ' ');
                          
                          let departureLocations = [];
                          let departureTimes = [];
                          if (pricing) {
                            if (pricing.pickup_departures && pricing.pickup_departures.length > 0) {
                              departureLocations = [...new Set(pricing.pickup_departures.map(d => d.pickup_location).filter(Boolean))];
                              departureTimes = [...new Set(pricing.pickup_departures.map(d => d.departure_time).filter(Boolean))];
                            } else {
                              if (pricing.pickup_location) departureLocations = [pricing.pickup_location];
                              if (pricing.departure_time) departureTimes = [pricing.departure_time];
                            }
                          }

                          return (
                            <div key={exp} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <ExpIcon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                                <p className="text-sm font-medium text-cyan-300 capitalize">{displayName}</p>
                                <span className="text-xs text-white/50 ml-auto">{durationHours}h</span>
                              </div>
                              {(departureLocations.length > 0 || departureTimes.length > 0) && (
                                <div className="pl-6 space-y-1.5">
                                  {departureLocations.length > 0 && (
                                    <div className="flex items-start gap-1.5 text-xs text-white/60">
                                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-cyan-500/70" />
                                      <span className="leading-snug">{departureLocations.join(' · ')}</span>
                                    </div>
                                  )}
                                  {departureTimes.length > 0 && (
                                    <div className="flex items-start gap-1.5 text-xs text-white/60">
                                      <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-cyan-500/70" />
                                      <span className="leading-snug">{departureTimes.join(' · ')}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectBoat(boat);
                  }}
                  className="mt-auto w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white py-3.5 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-[0_4px_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] border border-cyan-400/20"
                >
                  Select This Boat
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <BoatDetailModal 
          boat={selectedBoatDetail} 
          isOpen={showDetailModal} 
          onClose={() => setShowDetailModal(false)} 
        />
      </div>
    </section>
  );
}