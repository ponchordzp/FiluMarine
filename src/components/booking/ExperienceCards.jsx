import React from 'react';
import { Clock, Users, Fish, Waves, Sun, Camera, Anchor, Wifi, Video, Zap, Droplet, Navigation } from 'lucide-react';
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
    availableBoats: 'FILU, La Güera',
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
    availableBoats: 'FILU, TYCOON, La Güera, Pirula',
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
    availableBoats: 'FILU, TYCOON, Pirula',
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
    availableBoats: 'FILU, TYCOON, Pirula',
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
    availableBoats: 'FILU, La Güera',
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
  availableBoats: 'FILU, TYCOON, La Güera, Pirula',
};

// Location-specific boat availability
const boatsByLocation = {
  ixtapa_zihuatanejo: ['FILU', 'TYCOON'],
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
  const filteredRegular = regularExperiences;
  const filteredFullDay = fullDayExperiences;
  const showExtended = true;

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-[#0c2847] to-[#0a1f3d] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
            Choose Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Experience</span>
          </h2>
          <p className="text-white/70 text-xl max-w-xl mx-auto">
            Select the perfect adventure for your group
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {filteredRegular.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:border-cyan-400/40 hover:bg-white/15 transition-all duration-500 flex flex-col hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
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
                  {!selectedBoat && location && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Anchor className="h-3 w-3" />
                      <span>Available boats: {getAvailableBoatsForLocation(exp.availableBoats, location)}</span>
                    </div>
                  )}
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

          {/* Full Day Experiences */}
          {filteredFullDay.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (regularExperiences.length + i) * 0.1 }}
              className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:border-cyan-400/40 hover:bg-white/15 transition-all duration-500 flex flex-col hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
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
                  {!selectedBoat && location && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Anchor className="h-3 w-3" />
                      <span>Available boats: {getAvailableBoatsForLocation(exp.availableBoats, location)}</span>
                    </div>
                  )}
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
                {!selectedBoat && location && (
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Anchor className="h-3 w-3" />
                    <span>Available boats: {getAvailableBoatsForLocation(extendedExperience.availableBoats, location)}</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => onSelectExperience(extendedExperience)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] mt-auto"
              >
                Select This Experience
              </Button>
            </div>
          </motion.div>}
        </div>


      </div>
    </section>
  );
}