import React from 'react';
import { Anchor, Users, Gauge, Shield, Wifi, Video, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const fleet = [
  {
    name: 'FILU',
    type: 'Sea Fox Center Console',
    size: '25ft',
    description: 'High-performance center console designed for serious sport fishing and coastal adventures. Features twin engines for speed and reliability.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/3e48387ed_image.png',
    capacity: 'Up to 6 guests',
    strengths: [
      { icon: Gauge, text: 'Perfect for sport fishing' },
      { icon: Users, text: 'Stable & spacious' },
      { icon: Shield, text: 'Safety-first design' },
      { icon: Wifi, text: 'Starlink connectivity' },
      { icon: Video, text: 'CCTV safety system' },
      { icon: Zap, text: 'Premium audio system' },
    ],
  },
  {
    name: 'TYCOON',
    type: 'Azimut Yacht',
    size: '55ft',
    description: 'Pristine luxury yacht perfect for extended leisure trips. Includes ceviche, 24 beers, and a bottle of your choice. Spacious interior with full amenities.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/ac63db837_image.png',
    capacity: 'Up to 12 guests',
    strengths: [
      { icon: Anchor, text: 'Luxury leisure cruising' },
      { icon: Users, text: 'Spacious cabin & deck' },
      { icon: Shield, text: 'Premium comfort' },
      { icon: Wifi, text: 'Starlink connectivity' },
      { icon: Video, text: 'CCTV safety system' },
      { icon: Zap, text: 'Premium audio system' },
    ],
  },
];

export default function Fleet() {
  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-[#1a4a6a] to-[#2c5a7a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            Our <span className="font-semibold">Fleet</span>
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Two exceptional vessels for every type of adventure
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {fleet.map((boat, i) => (
            <motion.div
              key={boat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-500"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <img 
                  src={boat.image} 
                  alt={boat.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1">{boat.name}</h3>
                  <p className="text-white/80 text-sm">{boat.type} • {boat.size}</p>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p className="text-white/80 text-sm mb-3">{boat.description}</p>
                
                <p className="text-white/80 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {boat.capacity}
                </p>

                <div className="space-y-2">
                  {boat.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-white">
                      <strength.icon className="h-5 w-5 text-[#1e88e5] flex-shrink-0" />
                      <span className="text-sm">{strength.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}