import React from 'react';
import { Anchor, Users, Gauge, Shield, Wifi, Video } from 'lucide-react';
import { motion } from 'framer-motion';

const fleet = [
  {
    name: 'FILU',
    type: 'Sea Fox Center Console',
    size: '25ft',
    description: 'High-performance center console designed for serious sport fishing and coastal adventures. Features twin engines for speed and reliability.',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    capacity: 'Up to 6 guests',
    strengths: [
      { icon: Gauge, text: 'Perfect for sport fishing' },
      { icon: Users, text: 'Stable & spacious' },
      { icon: Shield, text: 'Safety-first design' },
      { icon: Wifi, text: 'Starlink connectivity' },
      { icon: Video, text: 'CCTV safety system' },
    ],
  },
  {
    name: 'TYCOON',
    type: 'Azimut Yacht',
    size: '55ft',
    description: 'Pristine luxury yacht perfect for extended leisure trips. Includes ceviche, 24 beers, and a bottle of your choice. Spacious interior with full amenities.',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
    capacity: 'Up to 12 guests',
    strengths: [
      { icon: Anchor, text: 'Luxury leisure cruising' },
      { icon: Users, text: 'Spacious cabin & deck' },
      { icon: Shield, text: 'Premium comfort' },
      { icon: Wifi, text: 'Starlink connectivity' },
      { icon: Video, text: 'CCTV safety system' },
    ],
  },
];

export default function Fleet() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-[#f8f6f3]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 mb-4">
            Our <span className="font-semibold">Fleet</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
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
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
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

              <div className="p-6">
                <p className="text-slate-600 text-sm mb-3">{boat.description}</p>
                
                <p className="text-slate-600 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {boat.capacity}
                </p>

                <div className="space-y-2">
                  {boat.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-700">
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