import React from 'react';
import { MousePointerClick, ShieldCheck, MessageCircle, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

const journeySteps = [
  {
    icon: MousePointerClick,
    title: '1. Select Your Adventure',
    description: 'Browse our curated fleet and choose your ideal experience. Enjoy transparent pricing with no hidden fees.',
  },
  {
    icon: ShieldCheck,
    title: '2. Secure with a Deposit',
    description: 'Reserve your date instantly with just a partial deposit, processed safely through secure, bank-level encryption.',
  },
  {
    icon: MessageCircle,
    title: '3. Instant Itinerary',
    description: 'Receive immediate confirmation with precise meeting instructions and your captain’s direct contact info.',
  },
  {
    icon: Anchor,
    title: '4. Pay the Rest On-Site',
    description: 'Meet us at the marina, verify your vessel in person, and comfortably settle your remaining balance before setting sail.',
  },
];

export default function CustomerJourney() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ backgroundImage: `url('https://media.base44.com/images/public/6987f0afff96227dd3af0e68/388bdd58c_FILUMarine3.png')`, backgroundRepeat: 'repeat', backgroundSize: '300px 300px', backgroundColor: '#0a1f3d' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0a1f3ddd, #0d2a50dd)' }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            How It <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Works</span>
          </h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto font-light">
            A seamless, secure booking process designed for your peace of mind
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-blue-500/0 z-0"></div>
          
          {journeySteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#0d2a50] to-[#0a1f3d] rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,211,238,0.15)] border border-cyan-500/30 group-hover:border-cyan-400/60 group-hover:scale-110 transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <step.icon className="h-8 w-8 text-cyan-400 relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-base text-white/70 leading-relaxed max-w-[260px]">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}