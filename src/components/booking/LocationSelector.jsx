import React from 'react';
import { MapPin, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';

const locations = [
  {
    id: 'ixtapa_zihuatanejo',
    name: 'Ixtapa-Zihuatanejo',
    state: 'Guerrero',
    description: 'Pacific paradise with world-class sport fishing and pristine beaches',
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
    coordinates: '17.6617°N, 101.5528°W'
  },
  {
    id: 'acapulco',
    name: 'Acapulco',
    state: 'Guerrero',
    description: 'Legendary beach destination with stunning bays and vibrant marine life',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
    coordinates: '16.8531°N, 99.8237°W'
  }
];

export default function LocationSelector({ onSelectLocation }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c2340] via-[#1e3a5f] to-[#0c2340] py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-1 mb-3">
              <Anchor className="h-10 w-10 text-[#1e88e5]" />
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide">FILU</h1>
              <span className="text-2xl md:text-3xl font-light text-white/80">Marine</span>
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

          {/* Intro Message */}
          <div className="mb-8 max-w-3xl mx-auto">
            <p className="text-white/90 text-lg mb-4 leading-relaxed">
              Welcome to FILU Marine, your gateway to premium fishing and leisure expeditions across Mexico's most spectacular coastal destinations.
            </p>
            <p className="text-white/70 text-base">
              We're expanding our fleet to bring you world-class marine experiences at multiple locations. Select your preferred destination below to start your adventure.
            </p>
          </div>

          <h2 className="text-3xl font-light text-white mb-4">Choose Your Destination</h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Select your preferred location to explore premium marine experiences
          </p>
        </div>

        {/* Location Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {locations.map((location) => (
            <div 
              key={location.id}
              className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#1e88e5]/50 transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Location Image */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                {/* Location Badge */}
                <div className="absolute top-4 right-4 bg-[#1e88e5]/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-medium">{location.state}</span>
                </div>
              </div>

              {/* Location Info */}
              <div className="p-6">
                <h3 className="text-2xl font-light text-white mb-2">{location.name}</h3>
                <p className="text-white/60 text-sm mb-1">{location.coordinates}</p>
                <p className="text-white/70 mb-6">{location.description}</p>
                
                <Button 
                  onClick={() => onSelectLocation(location.id)}
                  className="w-full bg-[#1e88e5] hover:bg-[#1976d2] text-white"
                >
                  Explore {location.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-16 text-center">
          <p className="text-white/50 text-sm">
            More destinations coming soon across Mexico's Pacific and Caribbean coasts
          </p>
        </div>
      </div>
    </div>
  );
}