import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageCircle, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero({ onScrollToExperiences }) {
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
      <div className="relative z-10 px-6 py-20 text-center max-w-3xl mx-auto">
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

          <p className="text-[#1e88e5] text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Ixtapa-Zihuatanejo, Mexico
          </p>
          
          <h1 className="text-3xl md:text-5xl font-light text-white leading-tight mb-6">
            Premium Fishing & Leisure
            <span className="block font-semibold">Expeditions in Ixtapa</span>
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
            
            <div className="flex flex-col items-center gap-2">
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
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/fc470a313_image.png" 
                alt="WhatsApp QR Code" 
                className="w-24 h-24 mt-2"
              />
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}