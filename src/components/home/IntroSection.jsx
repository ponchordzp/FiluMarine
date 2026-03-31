import React from 'react';
import { Compass, Heart, Shield, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function IntroSection() {
  return (
    <section className="relative py-6 md:py-10 overflow-hidden" style={{ background: '#0a1f3d' }}>
      <div className="absolute inset-0" style={{ backgroundImage: 'url(https://media.base44.com/images/public/6987f0afff96227dd3af0e68/c6ed2e8cf_FILUMarine2.png)', backgroundRepeat: 'repeat', backgroundSize: '220px', opacity: 0.25 }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Welcome to <span className="font-bold text-white">FILU Marine</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white leading-relaxed mb-8 max-w-3xl mx-auto">
            Experience the Pacific Ocean like never before. Premium boats, professional crew, and unmatched pricing 
            make <span className="font-semibold text-white">FILU Marine the smartest choice</span> for your Ixtapa adventure.
          </p>

          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-white/10 mb-10">
            <h3 className="text-2xl md:text-3xl font-light text-white mb-4">
              Who <span className="font-semibold">Are We</span>
            </h3>
            <p className="text-lg md:text-xl text-white leading-relaxed max-w-3xl mx-auto">
              FILU connects you directly to Mexico's best boat operators and premium vessels across top destinations—Ixtapa-Zihuatanejo, Acapulco, and Cancún. We bring together exceptional operators with unmatched boat selection and competitive pricing, making world-class ocean experiences accessible to everyone. Whether you're seeking thrilling fishing adventures or serene coastal escapes, we've curated the best options so you get quality, value, and unforgettable memories.
            </p>
            </div>

          <div className="grid md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="w-14 h-14 bg-[#1e88e5]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-7 w-7 text-[#1e88e5]" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Best-in-Class Prices</h4>
              <p className="text-sm text-white">Unbeatable value without compromising on quality or experience</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="w-14 h-14 bg-[#1e88e5]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-[#1e88e5]" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Safety First</h4>
              <p className="text-sm text-white">Professional crew, top equipment, and comprehensive safety measures</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="w-14 h-14 bg-[#1e88e5]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="h-7 w-7 text-[#1e88e5]" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Endless Adventure</h4>
              <p className="text-sm text-white">From thrilling fishing to serene cruises, discover your perfect escape</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="w-14 h-14 bg-[#1e88e5]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-7 w-7 text-[#1e88e5]" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Simple Booking</h4>
              <p className="text-sm text-white">Reserve your adventure in minutes with our seamless process</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}