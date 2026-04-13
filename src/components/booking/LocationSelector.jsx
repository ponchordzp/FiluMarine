import React from 'react';
import { MapPin, Anchor, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import WeatherWidget from './WeatherWidget';

const FALLBACK_LOCATIONS = [
  {
    location_id: 'ixtapa_zihuatanejo',
    name: 'Ixtapa-Zihuatanejo',
    state: 'Guerrero',
    description: 'Pacific paradise with world-class sport fishing and pristine beaches',
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
    coordinates: '17.6617°N, 101.5528°W',
    visible: true,
  },
  {
    location_id: 'acapulco',
    name: 'Acapulco',
    state: 'Guerrero',
    description: 'Legendary beach destination with stunning bays and vibrant marine life',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
    coordinates: '16.8531°N, 99.8237°W',
    visible: true,
  }
];

export default function LocationSelector({ onSelectLocation }) {
  const [expandedDesc, setExpandedDesc] = React.useState({});

  const { data: dbLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('sort_order'),
    refetchInterval: 5000,
  });

  const { data: dbBoats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const locations = dbLocations.length > 0
    ? dbLocations.filter(l => l.visible !== false)
    : FALLBACK_LOCATIONS;

  const toggleDesc = (id) => {
    setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative min-h-screen py-20 px-4 sm:px-6 overflow-hidden" style={{ backgroundColor: '#0a1f3d' }}>
      {/* Background pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('https://media.base44.com/images/public/6987f0afff96227dd3af0e68/a0f069719_FILUMarine2.png')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '320px 320px',
          opacity: 0.35,
        }}
      />
      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f3d]/80 via-[#0c2847]/70 to-[#001529]/80" />
      {/* Animated glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-1 mb-3">
              <Anchor className="h-12 w-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 tracking-wide">FILU</h1>
              <span className="text-3xl md:text-4xl font-light text-white/90">Marine</span>
            </div>
            {/* Nautical Flags: F-I-L-U */}
            <div className="flex items-center justify-center gap-2">
              {/* F - Foxtrot: White diamond on red */}
              <div className="w-8 h-6 bg-red-600 relative flex items-center justify-center">
                <div className="w-4 h-4 bg-white transform rotate-45"></div>
              </div>
              {/* I - India: Yellow circle on black */}
              <div className="w-8 h-6 bg-black flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              </div>
              {/* L - Lima: Yellow and black quarters */}
              <div className="w-8 h-6 grid grid-cols-2 grid-rows-2">
                <div className="bg-yellow-400"></div>
                <div className="bg-black"></div>
                <div className="bg-black"></div>
                <div className="bg-yellow-400"></div>
              </div>
              {/* U - Uniform: Red and white quarters */}
              <div className="w-8 h-6 grid grid-cols-2 grid-rows-2">
                <div className="bg-red-600"></div>
                <div className="bg-white"></div>
                <div className="bg-white"></div>
                <div className="bg-red-600"></div>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="mb-16 max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl"></div>
              <div className="relative">
                <h3 className="text-3xl font-light text-white mb-6 text-center">
                  Our <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Mission</span>
                </h3>
                <div className="space-y-4 text-white/80 text-lg leading-relaxed">
                  <p>
                    Welcome to FILU Marine, your gateway to premium fishing and leisure expeditions across Mexico's most spectacular coastal destinations.
                  </p>
                  <p>
                    We believe that every journey on the water should be more than just a trip—it should be an unforgettable adventure. Our mission is to provide world-class marine experiences that combine safety, luxury, and authenticity.
                  </p>
                  <p>
                    From professional sport fishing expeditions to serene coastal cruises, we're dedicated to creating memories that last a lifetime. With our expanding fleet and expert crew, we bring the best of Mexico's Pacific coast to life, one voyage at a time.
                  </p>
                  <p className="text-cyan-400 font-medium text-center pt-2">
                    Your adventure begins here. Choose your destination and let's set sail.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-light text-white mb-4">Choose Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Destination</span></h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Select your preferred location to explore premium marine experiences
          </p>
        </div>

        {/* Location Cards */}
        <div className={`grid gap-10 ${
          locations.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
          locations.length === 4 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 sm:grid-cols-2'
        }`}>
          {locations.map((location, index) => (
            <div 
              key={location.location_id || location.id}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:border-cyan-400/50 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(34,211,238,0.3)] flex flex-col"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Location Image */}
              <div className="relative h-48 overflow-hidden flex-shrink-0">
                <img 
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                
                {/* Location Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-cyan-500/90 to-blue-500/90 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <MapPin className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-semibold">{location.state}</span>
                </div>
              </div>

              {/* Location Info */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-2xl font-light text-white mb-1">
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{location.name}</span>
                </h3>
                <p className="text-cyan-300/60 text-sm mb-1 font-mono">{location.coordinates}</p>
                <div className="flex flex-col gap-3 mb-2">
                  <WeatherWidget locationId={location.location_id} coordinates={location.coordinates} />
                  
                  {/* Stats Badges */}
                  {(() => {
                    const locId = location.location_id || location.id;
                    const locationBoatsList = dbBoats.filter(b => {
                      const matchLocation = (b.location || '').toLowerCase().trim() === (locId || '').toLowerCase().trim();
                      const matchStatus = !b.status || b.status === 'active';
                      const matchMode = b.boat_mode !== 'maintenance_only';
                      return matchLocation && matchStatus && matchMode;
                    });
                    const boatCount = locationBoatsList.length;
                    
                    const uniqueExperiences = new Set();
                    locationBoatsList.forEach(boat => {
                      if (Array.isArray(boat.available_expeditions)) {
                        boat.available_expeditions.forEach(e => {
                          if (e) uniqueExperiences.add(e);
                        });
                      }
                      if (Array.isArray(boat.expedition_pricing)) {
                        boat.expedition_pricing.forEach(e => {
                          if (e && e.expedition_type) uniqueExperiences.add(e.expedition_type);
                        });
                      }
                    });
                    const experienceCount = uniqueExperiences.size;

                    return (
                      <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-400/30 text-blue-100 text-xs font-semibold shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center gap-1.5">
                          <Anchor className="h-3.5 w-3.5 text-cyan-300" />
                          {boatCount} {boatCount === 1 ? 'boat' : 'boats'} available
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/30 text-purple-100 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-1.5">
                          <Waves className="h-3.5 w-3.5 text-pink-300" />
                          {experienceCount} {experienceCount === 1 ? 'experience' : 'experiences'} available
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="mt-2 mb-3 relative">
                  <p className={`text-white/80 text-base leading-relaxed transition-all duration-300 ${expandedDesc[location.location_id || location.id] ? '' : 'line-clamp-3'}`} style={{ minHeight: '4.5rem' }}>
                    {location.description}
                  </p>
                  {location.description && location.description.length > 100 && (
                    <button 
                      onClick={() => toggleDesc(location.location_id || location.id)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm mt-1 font-medium focus:outline-none flex items-center gap-1 transition-colors"
                    >
                      {expandedDesc[location.location_id || location.id] ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                <Button 
                  onClick={() => onSelectLocation(location.location_id || location.id)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] text-base mt-auto"
                >
                  Explore {location.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-20 text-center">
          <div className="inline-block bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3">
            <p className="text-white/60 text-sm flex items-center justify-center gap-2">
              <Waves className="h-4 w-4 text-cyan-400/60 flex-shrink-0" /> More destinations coming soon across Mexico's Pacific and Caribbean coasts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}