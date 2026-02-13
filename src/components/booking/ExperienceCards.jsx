import React from 'react';
import { Clock, Users, Fish, Waves, Sun, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

const experiences = [
  {
    id: 'half_day_fishing',
    title: 'Half-Day Sport Fishing',
    duration: '5 hours',
    price: 450,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    includes: ['All fishing equipment', 'Bait & tackle', 'Ice & cooler', 'Bottled water'],
    idealFor: 'First-timers & families',
    description: 'Perfect morning or afternoon trip targeting local species like Mahi-Mahi, Roosterfish, and Jack Crevalle.',
    icon: Fish,
  },
  {
    id: 'full_day_fishing',
    title: 'Full-Day Sport Fishing',
    duration: '8 hours',
    price: 750,
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
    includes: ['Premium fishing gear', 'Bait & tackle', 'Lunch & drinks', 'Ice & cooler'],
    idealFor: 'Serious anglers',
    description: 'Extended offshore adventure for Sailfish, Marlin, Tuna, and more. Reach the best fishing grounds.',
    icon: Fish,
  },
  {
    id: 'snorkeling',
    title: 'Snorkeling Expedition',
    duration: '4 hours',
    price: 350,
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
    includes: ['Snorkel equipment', 'Life vests', 'Fresh fruit & drinks', 'Towels'],
    idealFor: 'Couples & families',
    description: 'Explore crystal-clear waters at Playa Las Gatas and hidden coves with abundant marine life.',
    icon: Waves,
  },
  {
    id: 'coastal_leisure',
    title: 'Coastal Leisure / Sunset Tour',
    duration: '3 hours',
    price: 300,
    image: 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80',
    includes: ['Drinks & snacks', 'Music system', 'Comfortable seating', 'Photo opportunities'],
    idealFor: 'Relaxation & celebrations',
    description: 'Scenic cruise along the coastline with stunning sunset views. Perfect for special occasions.',
    icon: Sun,
  },
];

export default function ExperienceCards({ onSelectExperience }) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 mb-4">
            Choose Your <span className="font-semibold">Experience</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Select the perfect adventure for your group
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {experiences.map((exp, i) => (
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
                    <span className="text-slate-800 font-semibold">From ${exp.price}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-slate-800">{exp.title}</h3>
                  <exp.icon className="h-6 w-6 text-[#1e88e5] flex-shrink-0 ml-2" />
                </div>
                
                <p className="text-slate-600 text-sm mb-4">{exp.description}</p>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">What's included</p>
                  <div className="flex flex-wrap gap-2">
                    {exp.includes.map((item, idx) => (
                      <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-3 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>Ideal for: {exp.idealFor}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => onSelectExperience(exp)}
                  className="w-full bg-[#0c2340] hover:bg-[#1e88e5] text-white py-6 rounded-xl font-medium transition-all hover:scale-[1.02]"
                >
                  Select This Experience
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}