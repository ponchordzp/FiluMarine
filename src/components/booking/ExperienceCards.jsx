import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Users, Fish, Waves, Sun, Anchor, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

// Icon mapping by expedition_id keywords
const getExpIcon = (expId = '') => {
  if (expId.includes('snorkel')) return Waves;
  if (expId.includes('sunset') || expId.includes('leisure') || expId.includes('coastal')) return Sun;
  return Fish;
};

const getDepartureTimes = (p) => {
  if (!p) return [];
  if (p.pickup_departures?.length > 0) {
    const times = [...new Set(p.pickup_departures.map(d => d.departure_time).filter(Boolean))];
    if (times.length > 0) return times;
  }
  if (p.departure_time) return [p.departure_time];
  return [];
};

const getPickupLocations = (p) => {
  if (!p) return [];
  if (p.pickup_departures?.length > 0)
    return [...new Set(p.pickup_departures.map(d => d.pickup_location).filter(Boolean))];
  if (p.pickup_location) return [p.pickup_location];
  return [];
};

// Card component shared between both views
function ExpCard({ exp, onSelect, index, departureTimes = [], boatNames = [] }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getExpIcon(exp.expedition_id);
  const includes = exp.includes || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/30 hover:border-cyan-400/60 hover:bg-white/20 transition-all duration-700 flex flex-col hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] hover:-translate-y-2"
    >
      <div className="aspect-[16/9] relative overflow-hidden">
        <img
          src={exp.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'}
          alt={exp.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        {exp.duration && (
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/80 text-sm flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {exp.duration}
            </p>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-white">{exp.title}</h3>
          <Icon className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
        </div>

        {exp.description && <p className="text-white/80 text-sm mb-3">{exp.description}</p>}

        {includes.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between text-xs font-medium text-cyan-400 uppercase tracking-wide hover:text-cyan-300 transition-colors mb-1"
            >
              <span>What's Included</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
            </button>
            {expanded && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {includes.map((item, idx) => (
                  <span key={idx} className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-400/30">{item}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-3 border-t border-white/20 mb-3">
          {exp.ideal_for && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Users className="h-4 w-4" />
              <span>{exp.ideal_for}</span>
            </div>
          )}
          {boatNames.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Anchor className="h-3 w-3 flex-shrink-0 text-cyan-400" />
              <span>{boatNames.join(', ')}</span>
            </div>
          )}
          {departureTimes.length > 0 && (
            <div className="flex items-start gap-1.5 text-xs text-cyan-300">
              <Clock className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>{departureTimes.join(' · ')}</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => onSelect(exp)}
          className="relative w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white py-6 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] mt-auto overflow-hidden border border-cyan-400/20"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <span className="relative">Select This Experience</span>
        </Button>
      </div>
    </motion.div>
  );
}

export default function ExperienceCards({ onSelectExperience, selectedBoat, location }) {
  const { data: dbBoats = [] } = useQuery({
    queryKey: ['boats-for-exp', location],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
    enabled: !selectedBoat,
  });

  const { data: dbExpeditions = [] } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => base44.entities.Expedition.list('sort_order'),
  });

  const activeBoats = useMemo(() => dbBoats.filter(b =>
    (!location || b.location === location) &&
    b.status === 'active' &&
    b.boat_mode !== 'maintenance_only'
  ), [dbBoats, location]);

  // ── BOAT-SELECTED VIEW ──────────────────────────────────────────────────
  if (selectedBoat?.available_expeditions?.length > 0) {
    const boatExperiences = selectedBoat.available_expeditions.map(expType => {
      const catalog = dbExpeditions.find(e => e.expedition_id === expType);
      if (!catalog || catalog.visible === false) return null;
      const pricing = (selectedBoat.expedition_pricing || []).find(p => p.expedition_type === expType);
      const departureTimes = getDepartureTimes(pricing);
      return {
        ...catalog,
        duration: pricing?.duration_hours ? `${pricing.duration_hours} hours` : catalog.duration,
        price: pricing?.price_mxn > 0 ? pricing.price_mxn : catalog.price,
        departureTimes,
      };
    }).filter(Boolean);

    if (boatExperiences.length === 0) return null;

    const colClass = boatExperiences.length === 1
      ? 'grid-cols-1 max-w-md mx-auto'
      : boatExperiences.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-3';

    return (
      <section className="relative py-8 md:py-12">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md p-8 md:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h2 className="text-5xl md:text-6xl font-light text-white mb-6">
                Choose Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Experience</span>
              </h2>
              <p className="text-white/80 text-xl md:text-2xl max-w-2xl mx-auto font-light">
                Select the perfect adventure for your group
              </p>
            </motion.div>
            <div className={`grid gap-6 ${colClass}`}>
              {boatExperiences.map((exp, i) => (
                <ExpCard
                  key={exp.expedition_id}
                  exp={exp}
                  onSelect={onSelectExperience}
                  index={i}
                  departureTimes={exp.departureTimes}
                  boatNames={[selectedBoat.name]}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── GENERIC LOCATION VIEW ───────────────────────────────────────────────
  // Collect all unique expedition_ids offered by active boats at this location
  const locationExpeditions = useMemo(() => {
    const expMap = new Map();
    activeBoats.forEach(boat => {
      (boat.available_expeditions || []).forEach(expId => {
        if (!expMap.has(expId)) {
          const catalog = dbExpeditions.find(e => e.expedition_id === expId);
          if (catalog && catalog.visible !== false) {
            expMap.set(expId, catalog);
          }
        }
      });
    });
    return Array.from(expMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [activeBoats, dbExpeditions]);

  // For each expedition, gather boat names + departure times from all offering boats
  const getExpMeta = (expId) => {
    const boatsWithExp = activeBoats.filter(b => (b.available_expeditions || []).includes(expId));
    const boatNames = boatsWithExp.map(b => b.name);
    const allDepartureTimes = [];
    boatsWithExp.forEach(b => {
      const p = (b.expedition_pricing || []).find(ep => ep.expedition_type === expId);
      getDepartureTimes(p).forEach(t => { if (!allDepartureTimes.includes(t)) allDepartureTimes.push(t); });
    });
    return { boatNames, departureTimes: allDepartureTimes };
  };

  if (locationExpeditions.length === 0) return null;

  const colClass = locationExpeditions.length === 1
    ? 'grid-cols-1 max-w-md mx-auto'
    : locationExpeditions.length === 2 || locationExpeditions.length === 4
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-3';

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

        <div className={`grid gap-6 mb-6 ${colClass}`}>
          {locationExpeditions.map((exp, i) => {
            const { boatNames, departureTimes } = getExpMeta(exp.expedition_id);
            return (
              <ExpCard
                key={exp.expedition_id}
                exp={exp}
                onSelect={onSelectExperience}
                index={i}
                boatNames={boatNames}
                departureTimes={departureTimes}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}