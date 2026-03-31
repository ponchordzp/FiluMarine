import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Users, Fish, Waves, Sun, Camera, Anchor, Wifi, Video, Zap, Droplet, Navigation, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';

const regularExperiences = [
  {
    id: 'half_day_fishing',
    title: 'Half-Day Sport Fishing',
    duration: '5 hours',
    price: 9999,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    includes: ['Fishing equipment', 'Bait & tackle', 'Ice & cooler', 'Gas included'],
    idealFor: 'First-timers & families',
    description: 'Morning trip targeting Mahi-Mahi, Roosterfish, and Jack Crevalle.',
    targetSpecies: ['Dorado', 'Roosterfish', 'Snapper'],
    icon: Fish,
    availableBoats: 'FILU, WAHOO, La Güera, Pirula',
  },
  {
    id: 'snorkeling',
    title: 'Snorkeling Expedition',
    duration: '5 hours',
    price: 9599,
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
    includes: ['Snorkel equipment', 'Life vests', 'Drinks', 'Gas included'],
    idealFor: 'Couples & families',
    description: 'Explore Playa Las Gatas and hidden coves with vibrant marine life.',
    icon: Waves,
    availableBoats: 'FILU, La Güera, Pirula',
  },
  {
    id: 'coastal_leisure',
    title: 'Coastal Leisure Tour',
    duration: '5 hours',
    price: 9599,
    image: 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80',
    includes: ['Drinks & snacks', 'Music system', 'Seating', 'Gas included', 'Restaurant stops available'],
    idealFor: 'Relaxation & celebrations',
    description: 'Scenic coastal cruise with optional restaurant visits via panga delivery from select locations.',
    icon: Sun,
    availableBoats: 'FILU, TYCOON, La Güera',
  },
  {
    id: 'sunset_tour',
    title: 'Sunset Tour',
    duration: '5 hours',
    price: 9599,
    image: 'https://images.unsplash.com/photo-1495954484750-af469f2f9be5?w=800&q=80',
    includes: ['Drinks & snacks', 'Music system', 'Seating', 'Gas included', 'Restaurant stops available'],
    idealFor: 'Romantic & celebrations',
    description: 'Evening cruise with stunning Pacific sunset views. Restaurant visits available via panga delivery.',
    icon: Sun,
    availableBoats: 'FILU, TYCOON',
  },
];

const fullDayExperiences = [
  {
    id: 'full_day_fishing',
    title: 'Full-Day Sport Fishing',
    duration: '8 hours',
    price: 15999,
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
    includes: ['Premium gear', 'Bait & tackle', 'Lunch & drinks', 'Gas included'],
    idealFor: 'Serious anglers',
    description: 'Offshore adventure for Sailfish, Marlin, Tuna. Reach the best fishing grounds.',
    targetSpecies: ['Sailfish', 'Marlin', 'Tuna', 'Dorado'],
    icon: Fish,
    availableBoats: 'FILU, WAHOO, Pirula',
  },
];

const extendedExperience = {
  id: 'extended_fishing',
  title: 'Full Day Expedition',
  duration: '10 hours',
  price: 20000,
  image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  includes: ['Premium gear', 'All equipment', 'Full meals & drinks', 'Gas included', 'Starlink & CCTV', 'Restaurant stops available'],
  idealFor: 'All adventures',
  description: 'Ultimate 10-hour expedition for fishing or leisure. Choose your activity when scheduling - deep-sea fishing for trophy catches or extended coastal exploration with restaurant visits.',
  targetSpecies: ['Sailfish', 'Marlin', 'Tuna', 'Dorado', 'Roosterfish'],
  icon: Fish,
  availableBoats: 'FILU, TYCOON',
};

// Location-specific boat availability
const boatsByLocation = {
  ixtapa_zihuatanejo: ['FILU', 'TYCOON', 'WAHOO'],
  acapulco: ['La Güera', 'Pirula']
};

const getAvailableBoatsForLocation = (boatList, location) => {
  if (!location) return boatList;
  const locationBoats = boatsByLocation[location] || [];
  return boatList.split(', ').filter(boat => locationBoats.includes(boat)).join(', ');
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

export default function ExperienceCards({ onSelectExperience, selectedBoat, location }) {
  const { data: dbBoats = [] } = useQuery({
    queryKey: ['boats-for-exp', location],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
    enabled: !selectedBoat,
  });

  // For generic view: get active boats for this location that have each expedition
  const activeBoats = dbBoats.filter(b =>
    (!location || b.location === location) &&
    b.status === 'active' &&
    b.boat_mode !== 'maintenance_only'
  );

  // Returns { boatNames, duration, price, departureTimes, pickupLocations } for an expedition type
  const getExpDataFromDB = (expId) => {
    const boatsWithExp = activeBoats.filter(b => (b.available_expeditions || []).includes(expId));
    const boatNames = boatsWithExp.map(b => b.name);
    // Gather pricing from all boats — use first valid entry per field
    let duration = null, price = null;
    const allDepartureTimes = [];
    const allPickupLocations = [];
    boatsWithExp.forEach(b => {
      const p = (b.expedition_pricing || []).find(ep => ep.expedition_type === expId);
      if (!p) return;
      if (!duration && p.duration_hours) duration = p.duration_hours;
      if (!price && p.price_mxn > 0) price = p.price_mxn;
      // Collect departure times from pickup_departures array or legacy single field
      if (p.pickup_departures && p.pickup_departures.length > 0) {
        p.pickup_departures.forEach(d => {
          if (d.departure_time && !allDepartureTimes.includes(d.departure_time)) allDepartureTimes.push(d.departure_time);
          if (d.pickup_location && !allPickupLocations.includes(d.pickup_location)) allPickupLocations.push(d.pickup_location);
        });
      } else {
        if (p.departure_time && !allDepartureTimes.includes(p.departure_time)) allDepartureTimes.push(p.departure_time);
        if (p.pickup_location && !allPickupLocations.includes(p.pickup_location)) allPickupLocations.push(p.pickup_location);
      }
    });
    return { boatNames, duration, price, departureTimes: allDepartureTimes, pickupLocations: allPickupLocations };
  };

  // If boat is selected, only show experiences configured for that boat
  if (selectedBoat?.available_expeditions && selectedBoat?.expedition_pricing) {
    const boatExperiences = selectedBoat.available_expeditions.map(expType => {
      const pricing = selectedBoat.expedition_pricing.find(p => p.expedition_type === expType);
      const baseExp = [...regularExperiences, ...fullDayExperiences, extendedExperience].find(e => e.id === expType);
      
      if (!baseExp) return null;
      
      // Always use vessel-editor values — they are the authoritative locked source
      const lockIcon = '🔒 ';
      return {
        ...baseExp,
        duration: pricing?.duration_hours ? `${pricing.duration_hours} hours` : baseExp.duration,
        price: pricing?.price_mxn > 0 ? pricing.price_mxn : baseExp.price,
        availableBoats: selectedBoat.name,
      };
    }).filter(Boolean);

    return (
      <section className="relative py-8 md:py-12">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md p-8 md:p-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-5xl md:text-6xl font-light text-white mb-6">
                Choose Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Experience</span>
              </h2>
              <p className="text-white/80 text-xl md:text-2xl max-w-2xl mx-auto font-light">
                Select the perfect adventure for your group
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {boatExperiences.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/30 hover:border-cyan-400/60 hover:bg-white/20 transition-all duration-700 flex flex-col hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] hover:-translate-y-2"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img 
                      src={exp.image} 
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white/80 text-sm flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exp.duration}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-white">{exp.title}</h3>
                      <exp.icon className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
                    </div>

                    <p className="text-white/80 text-sm mb-3">{exp.description}</p>

                    <div className="mb-3">
                      <p className="text-xs font-medium text-cyan-400 uppercase tracking-wide mb-1.5">Includes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {exp.includes.map((item, idx) => (
                          <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-400/30">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-white/20 mb-3">
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Users className="h-4 w-4" />
                        <span>{exp.idealFor}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => onSelectExperience(exp)}
                      className="relative w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white py-6 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] mt-auto overflow-hidden border border-cyan-400/20"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <span className="relative">Select This Experience</span>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Generic view — augment each experience with live DB data
  const filteredRegular = regularExperiences;
  const filteredFullDay = fullDayExperiences;
  const showExtended = true;

  // Helper to render live DB boat names only
  const renderExpMeta = (expId) => {
    const { boatNames } = getExpDataFromDB(expId);
    if (!boatNames.length) return null;
    return (
      <div className="mt-2">
        <div className="flex items-start gap-1.5 text-xs text-white/60">
          <Anchor className="h-3 w-3 mt-0.5 flex-shrink-0 text-cyan-400" />
          <span>{boatNames.join(', ')}</span>
        </div>
      </div>
    );
  };

  return (
    <section className="relative py-8 md:py-12 overflow-hidden" style={{ backgroundImage: `url('https://media.base44.com/images/public/6987f0afff96227dd3af0e68/c6ed2e8cf_FILUMarine2.png')`, backgroundRepeat: 'repeat', backgroundSize: '300px 300px', backgroundColor: '#081830' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #081830cc, #050f1ecc)' }} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-light text-white mb-6">
            Choose Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Experience</span>
          </h2>
          <p className="text-white/80 text-xl md:text-2xl max-w-2xl mx-auto font-light">
            Select the perfect adventure for your group
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {filteredRegular.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/30 hover:border-cyan-400/60 hover:bg-white/20 transition-all duration-700 flex flex-col hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] hover:-translate-y-2"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <img 
                  src={exp.image} 
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {exp.duration}
                  </p>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-white">{exp.title}</h3>
                  <exp.icon className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
                </div>

                <p className="text-white/80 text-sm mb-3">{exp.description}</p>

                <div className="mb-3">
                  <p className="text-xs font-medium text-cyan-400 uppercase tracking-wide mb-1.5">Includes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.includes.map((item, idx) => (
                      <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-400/30">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-white/20 mb-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Users className="h-4 w-4" />
                    <span>{exp.idealFor}</span>
                  </div>
                  {renderExpMeta(exp.id)}
                </div>

                <Button 
                  onClick={() => onSelectExperience(exp)}
                  className="relative w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white py-6 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] mt-auto overflow-hidden border border-cyan-400/20"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative">Select This Experience</span>
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Full Day Experiences */}
          {filteredFullDay.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (regularExperiences.length + i) * 0.1 }}
              className="group bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/30 hover:border-cyan-400/60 hover:bg-white/20 transition-all duration-700 flex flex-col hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] hover:-translate-y-2"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <img 
                  src={exp.image} 
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {exp.duration}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-white">{exp.title}</h3>
                  <exp.icon className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
                </div>

                <p className="text-white/80 text-sm mb-3">{exp.description}</p>

                <div className="mb-3">
                  <p className="text-xs font-medium text-cyan-400 uppercase tracking-wide mb-1.5">Includes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.includes.map((item, idx) => (
                      <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-400/30">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-white/20 mb-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Users className="h-4 w-4" />
                    <span>{exp.idealFor}</span>
                  </div>
                  {exp.targetSpecies && (
                    <div className="flex items-start gap-2 text-xs text-white/70">
                      <Fish className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Target: {exp.targetSpecies.join(', ')}</span>
                    </div>
                  )}
                  {renderExpMeta(exp.id)}
                </div>

                <Button 
                  onClick={() => onSelectExperience(exp)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] mt-auto"
                >
                  Select This Experience
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Extended Experience */}
          {showExtended && <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (regularExperiences.length + fullDayExperiences.length) * 0.1 }}
            className="group bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-500 flex flex-col"
          >
            <div className="aspect-[16/9] relative overflow-hidden">
              <img 
                src={extendedExperience.image} 
                alt={extendedExperience.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {extendedExperience.duration}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">{extendedExperience.title}</h3>
                <extendedExperience.icon className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
              </div>

              <p className="text-white/80 text-sm mb-3">{extendedExperience.description}</p>

              <div className="mb-3">
                <p className="text-xs font-medium text-cyan-400 uppercase tracking-wide mb-1.5">Includes</p>
                <div className="flex flex-wrap gap-1.5">
                  {extendedExperience.includes.map((item, idx) => (
                    <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-400/30">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-white/20 mb-3">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Users className="h-4 w-4" />
                  <span>{extendedExperience.idealFor}</span>
                </div>
                {extendedExperience.targetSpecies && (
                  <div className="flex items-start gap-2 text-xs text-white/70">
                    <Fish className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Target: {extendedExperience.targetSpecies.join(', ')}</span>
                  </div>
                )}
                {renderExpMeta(extendedExperience.id)}
              </div>

              <Button 
                onClick={() => onSelectExperience(extendedExperience)}
                className="relative w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white py-6 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] mt-auto overflow-hidden border border-cyan-400/20"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative">Select This Experience</span>
              </Button>
            </div>
          </motion.div>}
        </div>


      </div>
    </section>
  );
}