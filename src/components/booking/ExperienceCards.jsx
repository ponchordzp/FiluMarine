import React from 'react';
import { Clock, Users, Fish, Waves, Sun, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

const regularExperiences = [
  {
    id: 'half_day_fishing',
    title: 'Half-Day Sport Fishing',
    duration: '5 hours',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    includes: ['Fishing equipment', 'Bait & tackle', 'Ice & cooler', 'Gas included'],
    idealFor: 'First-timers & families',
    description: 'Morning or afternoon trip targeting Mahi-Mahi, Roosterfish, and Jack Crevalle.',
    icon: Fish,
  },
  {
    id: 'full_day_fishing',
    title: 'Full-Day Sport Fishing',
    duration: '8 hours',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
    includes: ['Premium gear', 'Bait & tackle', 'Lunch & drinks', 'Gas included'],
    idealFor: 'Serious anglers',
    description: 'Offshore adventure for Sailfish, Marlin, Tuna. Reach the best fishing grounds.',
    icon: Fish,
  },
  {
    id: 'snorkeling',
    title: 'Snorkeling Expedition',
    duration: '4 hours',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
    includes: ['Snorkel equipment', 'Life vests', 'Drinks', 'Gas included'],
    idealFor: 'Couples & families',
    description: 'Explore Playa Las Gatas and hidden coves with vibrant marine life.',
    icon: Waves,
  },
  {
    id: 'coastal_leisure',
    title: 'Coastal Leisure / Sunset Tour',
    duration: '3 hours',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80',
    includes: ['Drinks & snacks', 'Music system', 'Seating', 'Gas included'],
    idealFor: 'Relaxation & celebrations',
    description: 'Scenic cruise along the coastline with stunning sunset views.',
    icon: Sun,
  },
];

const extendedExperience = {
  id: 'extended_fishing',
  title: 'Full Day Expedition',
  duration: '12 hours',
  price: 20000,
  image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  includes: ['Premium gear', 'All equipment', 'Full meals & drinks', 'Gas included', 'Starlink & CCTV'],
  idealFor: 'All adventures',
  description: 'Ultimate 12-hour expedition for fishing or leisure. Choose your activity when scheduling - deep-sea fishing for trophy catches or extended coastal exploration and relaxation.',
  icon: Fish,
};

export default function ExperienceCards({ onSelectExperience }) {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 mb-4">
            Choose Your <span className="font-semibold">Experience</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Select the perfect adventure for your group
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {regularExperiences.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <img 
                  src={exp.image} 
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exp.duration}
                    </p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-slate-800 font-semibold">From ${exp.price.toLocaleString()} MXN</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-slate-800">{exp.title}</h3>
                  <exp.icon className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
                </div>
                
                <p className="text-slate-600 text-sm mb-3">{exp.description}</p>

                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Includes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.includes.map((item, idx) => (
                      <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>{exp.idealFor}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => onSelectExperience(exp)}
                  className="w-full bg-[#0c2340] hover:bg-[#1e88e5] text-white py-5 rounded-xl font-medium transition-all hover:scale-[1.02]"
                >
                  Select This Experience
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Extended Experience - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500"
        >
          <div className="md:flex">
            <div className="md:w-1/2 aspect-[16/9] md:aspect-auto relative overflow-hidden">
              <img 
                src={extendedExperience.image} 
                alt={extendedExperience.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent" />
            </div>
            <div className="md:w-1/2 p-6 flex flex-col justify-center">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-800">{extendedExperience.title}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4" />
                    {extendedExperience.duration}
                  </p>
                </div>
                <extendedExperience.icon className="h-8 w-8 text-[#1e88e5] flex-shrink-0 ml-2" />
              </div>
              
              <p className="text-slate-600 text-sm mb-3">{extendedExperience.description}</p>

              <div className="mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Includes</p>
                <div className="flex flex-wrap gap-1.5">
                  {extendedExperience.includes.map((item, idx) => (
                    <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  <span>{extendedExperience.idealFor}</span>
                </div>
                <div className="bg-[#1e88e5]/10 px-4 py-2 rounded-full">
                  <span className="text-[#1e88e5] font-semibold text-lg">From ${extendedExperience.price.toLocaleString()} MXN</span>
                </div>
              </div>

              <Button 
                onClick={() => onSelectExperience(extendedExperience)}
                className="w-full bg-[#0c2340] hover:bg-[#1e88e5] text-white py-5 rounded-xl font-medium transition-all hover:scale-[1.02]"
              >
                Select This Experience
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Extra Hours Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 inline-block">
            ⏱️ <span className="font-semibold">Extra hours:</span> Additional time beyond scheduled duration is <span className="font-semibold">$2,500 MXN per hour</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}