import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageCircle, Anchor, Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero({ onScrollToExperiences, location, locationName, onChangeLocation, backgroundImage }) {
  const whatsappLink = "https://wa.me/525513782169?text=Hello!%20I'm%20interested%20in%20booking%20a%20boat%20experience%20with%20Filu%20Marine.";
  const heroBg = backgroundImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80';

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroBg}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#001529] via-[#0c2340]/95 to-[#1e3a5f]/90" />
        {/* Animated gradients */}
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
            <div className="flex items-center justify-center gap-2 mb-4">
              <Anchor className="h-12 w-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 tracking-wide">FILU</h2>
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

          <motion.button
            onClick={onChangeLocation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-white text-sm tracking-[0.3em] uppercase mb-6 font-medium bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full transition-all border border-white/30 hover:border-cyan-400/60 shadow-lg hover:shadow-cyan-500/30"
          >
            <MapPin className="h-4 w-4" />
            {locationName}, Mexico
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
          
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight mb-6">
            Premium Fishing & Leisure
            <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Expeditions in {locationName}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 font-light mb-12 max-w-2xl mx-auto">
            Private, safe and fully equipped boat experiences on the Pacific coast
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg"
                onClick={onScrollToExperiences}
                className="group bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-cyan-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] border border-cyan-400/20 backdrop-blur-sm relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center">
                  Choose Your Experience
                  <ChevronDown className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg"
                asChild
                className="group bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-400 hover:via-blue-500 hover:to-indigo-500 text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-blue-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] border border-blue-400/20 backdrop-blur-sm relative overflow-hidden"
              >
                <Link to={createPageUrl('BookingSearch')}>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative flex items-center">
                    <Search className="mr-2 h-5 w-5" />
                    Find My Booking
                  </span>
                </Link>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg"
                asChild
                className="group bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-400 hover:via-green-500 hover:to-teal-500 text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-emerald-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] border border-emerald-400/20 backdrop-blur-sm relative overflow-hidden"
              >
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contact via WhatsApp
                  </span>
                </a>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}