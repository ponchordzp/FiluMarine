import React from 'react';
import { Gauge, Shield, Anchor, Waves, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  {
    icon: Gauge,
    title: 'Superior Performance',
    description: 'Center console design offers better speed, agility, and fuel efficiency',
  },
  {
    icon: Anchor,
    title: 'Stable & Smooth',
    description: 'Balanced weight distribution provides exceptional stability in all conditions',
  },
  {
    icon: Waves,
    title: 'Open Layout',
    description: 'Spacious deck layout perfect for fishing, diving, and group activities',
  },
  {
    icon: Users,
    title: 'Versatile Space',
    description: 'Adaptable setup for fishing, leisure, or water sports activities',
  },
  {
    icon: Zap,
    title: 'Professional Grade',
    description: 'Premium equipment and modern technology for the ultimate experience',
  },
];

export default function BoatBenefits() {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#001529] via-[#0a1f3d] to-[#0c2847] border-t border-white/10 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-600/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-light text-white mb-6">
            Why <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Choose Us?</span>
          </h2>
          <p className="text-white/80 text-xl md:text-2xl max-w-2xl mx-auto font-light">
            Premium vessels, experienced crew, and unforgettable experiences
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.slice(0, 3).map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/20 hover:border-cyan-400/40 hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <benefit.icon className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
              <p className="text-base text-white/70 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mt-8 max-w-5xl mx-auto">
          {benefits.slice(3).map((benefit, i) => (
            <motion.div
              key={i + 3}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i + 3) * 0.1 }}
              className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/20 hover:border-cyan-400/40 hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <benefit.icon className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
              <p className="text-base text-white/70 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}