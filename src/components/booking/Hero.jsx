import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero({ onScrollToExperiences }) {
  const whatsappLink = "https://wa.me/5217551234567?text=Hello!%20I'm%20interested%20in%20booking%20a%20boat%20experience%20in%20Ixtapa.";

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-20 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-sky-300 text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Ixtapa-Zihuatanejo, Mexico
          </p>
          
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight mb-6">
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
              className="bg-white text-slate-900 hover:bg-white/90 px-8 py-6 text-base font-medium rounded-full shadow-xl shadow-black/20 transition-all hover:scale-105"
            >
              Choose Your Experience
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              asChild
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base font-medium rounded-full backdrop-blur-sm"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact via WhatsApp
              </a>
            </Button>
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