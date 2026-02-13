import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const destinations = [
  {
    name: 'Playa Las Gatas',
    description: 'Protected cove with crystal-clear waters, ideal for snorkeling and diving. Home to vibrant marine life and coral formations.',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/playas/las-gatas',
  },
  {
    name: 'La Isla (Isla Ixtapa)',
    description: 'Pristine island accessible by boat, featuring beautiful beaches, snorkeling spots, and wildlife observation opportunities.',
    image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/playas/la-isla',
  },
  {
    name: 'Zihuatanejo Bay',
    description: 'Charming traditional fishing village with a picturesque bay, colorful streets, and authentic local culture.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/',
  },
  {
    name: 'Playa La Ropa',
    description: 'Long crescent beach with calm waters, perfect for swimming and water sports. Lined with beachfront restaurants.',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/playas/la-ropa',
  },
  {
    name: 'Playa Quieta',
    description: 'Tranquil beach with gentle waves, ideal for families. Gateway to Isla Ixtapa with calm, swimmable waters.',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/playas/playa-quieta',
  },
  {
    name: 'Troncones Beach',
    description: 'Laid-back surf town with consistent waves for all levels. Known for its bohemian vibe and beautiful sunset views.',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/playas/troncones',
  },
  {
    name: 'La Saladita Beach',
    description: 'World-renowned left-hand point break, one of Mexico\'s best surf spots. Long rides and consistent waves year-round.',
    image: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/playas/la-saladita',
  },
  {
    name: 'Barra de Potosí',
    description: 'Unique ecosystem where lagoon meets ocean. Mangrove sanctuary with bird watching, kayaking, and pristine beaches.',
    image: 'https://images.unsplash.com/photo-1535024966711-67607dc2d48e?w=800',
    link: 'https://www.ixtapazihuatanejo.travel/',
  },
];

export default function Destinations() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#f8f6f3] to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-slate-800 mb-4">
            Explore <span className="font-semibold">Destinations</span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Discover the most beautiful spots along the Pacific coast
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {destinations.map((dest, i) => (
            <motion.a
              key={i}
              href={dest.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer block"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-[#1e88e5]" />
                  <h3 className="font-semibold text-sm">{dest.name}</h3>
                </div>
                <p className="text-xs text-white/80 line-clamp-2">{dest.description}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}