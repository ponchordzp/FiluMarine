import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageCircle, Anchor, Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero({ onScrollToExperiences, location, locationName, onChangeLocation }) {
  const whatsappLink = "https://wa.me/525513782169?text=Hello!%20I'm%20interested%20in%20booking%20a%20boat%20experience%20with%20Filu%20Marine.";

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c2340]/80 via-[#0c2340]/60 to-[#0c2340]/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 py-20 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-1 mb-3">
              <Anchor className="h-10 w-10 text-[#1e88e5]" />
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wide">FILU</h2>
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

          <button
            onClick={onChangeLocation}
            className="inline-flex items-center gap-2 text-[#1e88e5] hover:text-white text-sm tracking-[0.3em] uppercase mb-4 font-medium bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full transition-all border border-white/20 hover:border-[#1e88e5]"
          >
            <MapPin className="h-4 w-4" />
            {locationName}, Mexico
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <h1 className="text-3xl md:text-5xl font-light text-white leading-tight mb-6">
            Premium Fishing & Leisure
            <span className="block font-semibold">Expeditions in {locationName}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 font-light mb-10 max-w-xl mx-auto">
            Private, safe and fully equipped boat experiences on the Pacific coast
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={onScrollToExperiences}
              className="bg-[#1e88e5] text-white hover:bg-[#1976d2] px-8 py-6 text-base font-medium rounded-full shadow-xl shadow-black/20 transition-all hover:scale-105"
            >
              Choose Your Experience
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg"
              asChild
              className="bg-[#1e88e5] text-white hover:bg-[#1976d2] px-8 py-6 text-base font-medium rounded-full shadow-xl shadow-black/20 transition-all hover:scale-105"
            >
              <Link to={createPageUrl('BookingSearch')}>
                <Search className="mr-2 h-5 w-5" />
                Find My Booking
              </Link>
            </Button>
            
            <Button 
              size="lg"
              asChild
              className="bg-[#1e88e5] text-white hover:bg-[#1976d2] px-8 py-6 text-base font-medium rounded-full shadow-xl shadow-black/20 transition-all hover:scale-105"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact via WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}