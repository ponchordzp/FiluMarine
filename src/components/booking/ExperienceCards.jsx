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

const getIdealFor = (exp) => {
  if (exp.ideal_for) return `Ideal for: ${exp.ideal_for}`;
  const id = exp.expedition_id || '';
  if (id.includes('snorkel')) return 'Ideal for: Ocean explorers and underwater enthusiasts';
  if (id.includes('sunset')) return 'Ideal for: Couples, romantics, and photography lovers';
  if (id.includes('leisure') || id.includes('coastal')) return 'Ideal for: Couples, families, and friend groups looking to relax';
  if (id.includes('fishing')) {
    if (id.includes('half')) return 'Ideal for: Casual anglers and families';
    if (id.includes('full') || id.includes('extended')) return 'Ideal for: Serious anglers and fishing aficionados';
    return 'Ideal for: Fishing enthusiasts of all levels';
  }
  return 'Ideal for: Everyone looking for a great time on the water';
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

const defaultDurations = {
  half_day_fishing: 5, full_day_fishing: 8,
  extended_fishing: 10, snorkeling: 5,
  coastal_leisure: 5, sunset_tour: 3,
};

// Card component shared between both views
function ExpCard({ exp, onSelect, index, departureTimes = [], boatNames = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedIdeal, setExpandedIdeal] = useState(false);
  const [expandedBoats, setExpandedBoats] = useState(false);

  const Icon = getExpIcon(exp.expedition_id);
  const includes = exp.includes || [];
  const idealText = getIdealFor(exp);
  const boatsText = boatNames.length > 0 ? boatNames.join(', ') : 'All Fleet';

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
        {/* Header - Fixed min Height to align nicely */}
        <div className="flex items-start justify-between mb-4 min-h-[3.5rem]">
          <h3 className="text-xl font-semibold text-white line-clamp-2">{exp.title}</h3>
          <Icon className="h-6 w-6 text-cyan-400 flex-shrink-0 ml-3" />
        </div>

        {/* Description - Fixed min height and line clamp */}
        <div className="mb-4 flex-shrink-0">
          <div className={`text-white/80 text-sm ${expandedDesc ? '' : 'line-clamp-3'} min-h-[3.75rem]`}>
            {exp.description || 'No description available.'}
          </div>
          {exp.description && exp.description.length > 110 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpandedDesc(v => !v); }}
              className="text-cyan-400 text-xs font-medium mt-1 hover:text-cyan-300"
            >
              {expandedDesc ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>

        {/* Included items */}
        {includes.length > 0 && (
          <div className="mb-4 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
              className="w-full flex items-center justify-between text-xs font-semibold text-white/50 uppercase tracking-wide hover:text-white/70 transition-colors"
            >
              <span>What's Included</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
            </button>
            {expanded && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {includes.map((item, idx) => (
                  <span key={idx} className="text-xs bg-cyan-500/10 text-cyan-300 px-2.5 py-1.5 rounded-lg border border-cyan-500/20">{item}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details list */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/10 mb-6 flex-shrink-0">
          {/* Ideal for dropdown */}
          <div 
            className="flex items-start justify-between cursor-pointer group/ideal"
            onClick={(e) => { e.stopPropagation(); setExpandedIdeal(!expandedIdeal); }}
          >
            <div className="flex items-start gap-2 text-sm text-white/70 pr-2">
              <Users className="h-4 w-4 text-white/50 flex-shrink-0 mt-0.5" />
              <span className={`${expandedIdeal ? '' : 'line-clamp-2'}`}>{idealText}</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-white/50 flex-shrink-0 transition-transform duration-200 mt-1 group-hover/ideal:text-white/80 ${expandedIdeal ? '' : '-rotate-90'}`} />
          </div>
          
          {/* Available boats dropdown */}
          <div 
            className="flex items-start justify-between cursor-pointer group/boats"
            onClick={(e) => { e.stopPropagation(); setExpandedBoats(!expandedBoats); }}
          >
            <div className="flex items-start gap-2 text-sm text-white/70 pr-2">
              <Anchor className="h-4 w-4 text-white/50 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-medium text-white/90">Available Boats</span>
                <span className={`${expandedBoats ? '' : 'line-clamp-2'} text-white/60`}>{boatsText}</span>
              </div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-white/50 flex-shrink-0 transition-transform duration-200 mt-1 group-hover/boats:text-white/80 ${expandedBoats ? '' : '-rotate-90'}`} />
          </div>
        </div>

        <Button
          onClick={(e) => { e.stopPropagation(); onSelect(exp); }}
          className="relative w-full bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white py-4 sm:py-6 rounded-xl sm:rounded-2xl font-semibold transition-all duration-500 hover:scale-105 shadow-[0_4px_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] mt-auto overflow-hidden border border-cyan-400/20 h-auto"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <span className="relative">Select This Experience</span>
        </Button>
      </div>
    </motion.div>
  );
}

const isHiddenForOperator = (catalog, operator) => {
  if (!catalog) return true;
  if (catalog.visible === false) return true;
  if (operator && (catalog.hidden_for_operators || []).includes(operator)) return true;
  return false;
};

export default function ExperienceCards({ onSelectExperience, selectedBoat, location }) {
  const { data: dbBoats = [] } = useQuery({
    queryKey: ['boats-for-exp', location],
    queryFn: () => base44.entities.BoatInventory.list('sort_order'),
    enabled: !selectedBoat,
  });

  const { data: dbExpeditions = [] } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => base44.entities.Expedition.list('sort_order'),
  });

  const activeBoats = useMemo(() => dbBoats.filter(b => {
    const matchLocation = !location || (b.location || '').toLowerCase().trim() === (location || '').toLowerCase().trim();
    const matchStatus = !b.status || b.status === 'active';
    const matchMode = b.boat_mode !== 'maintenance_only';
    return matchLocation && matchStatus && matchMode;
  }), [dbBoats, location]);

  // Always compute locationExpeditions unconditionally
  const locationExpeditions = useMemo(() => {
    if (selectedBoat) return [];
    const expMap = new Map();
    activeBoats.forEach(boat => {
      (boat.available_expeditions || []).forEach(expId => {
        if (!expMap.has(expId)) {
          const opCatalog = dbExpeditions.find(e => e.expedition_id === expId && e.operator && e.operator.toLowerCase() === (boat.operator || '').toLowerCase());
          const globalCatalog = dbExpeditions.find(e => e.expedition_id === expId && !e.operator);
          const catalog = opCatalog || globalCatalog || dbExpeditions.find(e => e.expedition_id === expId);

          if (catalog && !isHiddenForOperator(catalog, boat.operator)) {
            const pricing = (boat.expedition_pricing || []).find(p => p.expedition_type === expId);
            const duration_hours = pricing?.duration_hours || parseFloat(catalog.duration) || defaultDurations[expId] || 5;
            expMap.set(expId, { ...catalog, title: catalog.title || expId.replace(/_/g, ' '), duration_hours });
          }
        }
      });
    });
    return Array.from(expMap.values()).sort((a, b) => b.duration_hours - a.duration_hours);
  }, [activeBoats, dbExpeditions, selectedBoat]);

  // ── BOAT-SELECTED VIEW ──────────────────────────────────────────────────
  if (selectedBoat) {
    const boatExperiences = (selectedBoat.available_expeditions || []).map(expType => {
      const opCatalog = dbExpeditions.find(e => e.expedition_id === expType && e.operator && e.operator.toLowerCase() === (selectedBoat.operator || '').toLowerCase());
      const globalCatalog = dbExpeditions.find(e => e.expedition_id === expType && !e.operator);
      const catalog = opCatalog || globalCatalog || dbExpeditions.find(e => e.expedition_id === expType);

      if (isHiddenForOperator(catalog, selectedBoat.operator)) return null;
      const pricing = (selectedBoat.expedition_pricing || []).find(p => p.expedition_type === expType);
      const departureTimes = getDepartureTimes(pricing);
      const durationHours = pricing?.duration_hours || parseFloat(catalog?.duration) || defaultDurations[expType] || 5;

      return {
        ...catalog,
        title: catalog?.title || expType.replace(/_/g, ' '),
        duration: pricing?.duration_hours ? `${pricing.duration_hours} hours` : catalog?.duration,
        duration_hours: durationHours,
        price: pricing?.price_mxn > 0 ? pricing.price_mxn : catalog?.price,
        departureTimes,
      };
    }).filter(Boolean).sort((a, b) => b.duration_hours - a.duration_hours);

    if (boatExperiences.length === 0) {
      return (
        <section className="relative py-8 md:py-12">
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-3xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md p-8 md:p-10 text-center">
              <h2 className="text-3xl font-light text-white mb-4">No Experiences Available</h2>
              <p className="text-white/60 text-lg">This boat does not have any experiences configured yet.</p>
            </div>
          </div>
        </section>
      );
    }

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
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-white mb-3 sm:mb-6">
                Choose Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Experience</span>
              </h2>
              <p className="text-white/80 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto font-light">
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
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-white mb-3 sm:mb-6">
            Choose Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Experience</span>
          </h2>
          <p className="text-white/80 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto font-light">
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