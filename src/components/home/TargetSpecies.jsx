import React from 'react';
import { Fish, Waves } from 'lucide-react';
import { motion } from 'framer-motion';

const species = [
  {
    name: 'Sailfish',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80',
    season: 'Year-round',
  },
  {
    name: 'Marlin',
    image: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=400&q=80',
    season: 'Nov-May',
  },
  {
    name: 'Dorado',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
    season: 'May-Oct',
  },
  {
    name: 'Tuna',
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=80',
    season: 'Year-round',
  },
  {
    name: 'Roosterfish',
    image: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&q=80',
    season: 'Apr-Sep',
  },
  {
    name: 'Snapper',
    image: 'https://images.unsplash.com/photo-1578507065211-1c4e99a5fd24?w=400&q=80',
    season: 'Year-round',
  },
];

export default function TargetSpecies() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#f8f6f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Waves className="h-6 w-6 text-[#1e88e5]" />
              <span className="text-sm font-medium text-[#1e88e5] uppercase tracking-wide">
                Target Species
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-slate-800 mb-4">
              What You'll <span className="font-semibold">Catch</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Experience world-class sport fishing in the Pacific waters of Ixtapa-Zihuatanejo
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {species.map((fish, index) => (
            <motion.div
              key={fish.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-xl aspect-square bg-slate-100">
                <img 
                  src={fish.image}
                  alt={fish.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Fish className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">{fish.name}</h3>
                  </div>
                  <p className="text-xs text-white/80">{fish.season}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e88e5]/10 rounded-full">
            <Fish className="h-5 w-5 text-[#1e88e5]" />
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Catch & Release</span> encouraged for conservation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}