import React from 'react';
import { Shield, Award, Users, Anchor, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const trustPoints = [
  { icon: Shield, title: "Safety First", desc: "Licensed captain & experienced crew" },
  { icon: Award, title: "Premium Equipment", desc: "25ft Sea Fox center console boat" },
  { icon: Users, title: "Trusted Partners", desc: "Recommended by hotels & concierges" },
  { icon: Anchor, title: "Local Expertise", desc: "Best fishing & snorkeling spots" },
];

const comparison = [
  { feature: "Licensed & insured captain", us: true, panga: false },
  { feature: "Safety equipment on board", us: true, panga: false },
  { feature: "Premium fishing gear", us: true, panga: false },
  { feature: "Comfortable seating", us: true, panga: false },
  { feature: "Reliable booking system", us: true, panga: false },
  { feature: "English-speaking crew", us: true, panga: false },
];

export default function TrustSection() {
  return (
    <section className="py-20 md:py-28 bg-[#f8f6f3]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Trust Points */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 mb-4">
            Why Choose <span className="font-semibold">Our Experience</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            A premium alternative to traditional boats, designed for travelers who value safety, comfort, and quality service.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {trustPoints.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 text-center shadow-sm"
            >
              <div className="w-14 h-14 bg-sky-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <point.icon className="h-7 w-7 text-sky-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{point.title}</h3>
              <p className="text-sm text-slate-500">{point.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Boat Images */}
        <div className="grid md:grid-cols-3 gap-4 mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:col-span-2 aspect-[16/10] rounded-2xl overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80" 
              alt="Premium fishing boat"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="grid grid-rows-2 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=80" 
                alt="Fishing experience"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1476673160081-cf065607f449?w=600&q=80" 
                alt="Ocean view"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>

        {/* Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-8 md:p-10 shadow-sm max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-semibold text-slate-800 text-center mb-8">
            Premium Experience vs Traditional Pangas
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 text-sm font-medium text-slate-500 pb-2 border-b">
              <span>Feature</span>
              <span className="text-center text-sky-600">Our Service</span>
              <span className="text-center">Local Pangas</span>
            </div>
            
            {comparison.map((item, i) => (
              <div key={i} className="grid grid-cols-3 py-2 text-sm">
                <span className="text-slate-700">{item.feature}</span>
                <span className="flex justify-center">
                  <Check className="h-5 w-5 text-emerald-500" />
                </span>
                <span className="flex justify-center">
                  <X className="h-5 w-5 text-slate-300" />
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}