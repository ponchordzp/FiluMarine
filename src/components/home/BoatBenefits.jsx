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
    icon: Shield,
    title: '360° Safety',
    description: 'Unobstructed visibility and easy access to all sides for maximum safety',
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
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 mb-4">
            Why a <span className="font-semibold">Center Console</span> Boat?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Experience the perfect combination of performance, safety, and versatility
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-[#f8f6f3] to-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-[#1e88e5]/10 rounded-xl flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-[#1e88e5]" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{benefit.title}</h3>
              <p className="text-sm text-slate-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}