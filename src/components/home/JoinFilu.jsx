import React from 'react';
import { Button } from "@/components/ui/button";
import { Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function JoinFilu() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0a1f3d, #061428)' }}>
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-cyan-500/30">
            <Anchor className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Have a Boat? <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Join FILU!</span>
          </h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Partner with us and expand your reach. Join our network of premium boat operators and unlock new opportunities for revenue and operational excellence.
          </p>
          
          <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-7 rounded-2xl font-semibold text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            <Link to="/JoinFiluLanding">Learn More & Apply</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}