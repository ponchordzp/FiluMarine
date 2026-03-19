import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const destinationsByLocation = {
  ixtapa_zihuatanejo: [
    {
      id: 'playa-las-gatas',
      name: 'Playa Las Gatas',
      description: 'Protected cove with crystal-clear waters, ideal for snorkeling and diving.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    },
    {
      id: 'isla-ixtapa',
      name: 'La Isla (Isla Ixtapa)',
      description: 'Pristine island accessible by boat, featuring beautiful beaches and snorkeling.',
      image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
    },
    {
      id: 'zihuatanejo-bay',
      name: 'Zihuatanejo Bay',
      description: 'Charming traditional fishing village with a picturesque bay.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    },
    {
      id: 'playa-la-ropa',
      name: 'Playa La Ropa',
      description: 'Long crescent beach with calm waters, perfect for swimming.',
      image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    },
    {
      id: 'playa-quieta',
      name: 'Playa Quieta',
      description: 'Tranquil beach with gentle waves, ideal for families.',
      image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
    },
    {
      id: 'troncones-beach',
      name: 'Troncones Beach',
      description: 'Laid-back surf town with consistent waves for all levels.',
      image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
    },
    {
      id: 'la-saladita',
      name: 'La Saladita Beach',
      description: 'World-renowned left-hand point break, one of Mexico\'s best surf spots.',
      image: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800',
    },
    {
      id: 'barra-de-potosi',
      name: 'Barra de Potosí',
      description: 'Unique ecosystem where lagoon meets ocean with mangrove sanctuary.',
      image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/8267f1a84_image.png',
    },
  ],
  acapulco: [
    {
      id: 'la-quebrada',
      name: 'La Quebrada',
      description: 'Famous cliff diving spot where professional divers plunge from heights.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    },
    {
      id: 'playa-caleta',
      name: 'Playa Caleta & Caletilla',
      description: 'Two charming adjacent bays with calm waters, perfect for families.',
      image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
    },
    {
      id: 'isla-roqueta',
      name: 'Isla Roqueta',
      description: 'Small island paradise with pristine beaches and snorkeling spots.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    },
    {
      id: 'playa-revolcadero',
      name: 'Playa Revolcadero',
      description: 'Wild, untamed beach with powerful waves perfect for surfing.',
      image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    },
    {
      id: 'puerto-marques',
      name: 'Puerto Marqués',
      description: 'Sheltered bay with tranquil turquoise waters, ideal for water sports.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    },
    {
      id: 'pie-de-la-cuesta',
      name: 'Playa Pie de la Cuesta',
      description: 'Long stretch of beach famous for spectacular sunsets.',
      image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
    },
    {
      id: 'barra-vieja',
      name: 'Barra Vieja',
      description: 'Traditional fishing village famous for fresh seafood.',
      image: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800',
    },
    {
      id: 'laguna-coyuca',
      name: 'Laguna de Coyuca',
      description: 'Pristine freshwater lagoon perfect for kayaking and bird watching.',
      image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
    },
  ],
};

export default function Destinations({ location = 'ixtapa_zihuatanejo' }) {
  const { data: dbDestinations = [] } = useQuery({
    queryKey: ['destinations', location],
    queryFn: () => base44.entities.DestinationContent.list(),
    refetchInterval: 5000,
  });

  const filteredDbDests = dbDestinations.filter(d => d.region === location);
  
  const destinations = filteredDbDests.length > 0 
    ? filteredDbDests.map(d => ({
        id: d.destination_id,
        name: d.name,
        description: d.summary?.substring(0, 100) + '...' || '',
        image: d.images?.[0] || 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
      }))
    : (destinationsByLocation[location] || destinationsByLocation.ixtapa_zihuatanejo);

  return (
    <section className="relative py-6 md:py-10 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #050f1e, #0a1f3d)' }}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
            Explore <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Destinations</span>
          </h2>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Discover the most beautiful spots along the Pacific coast
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {destinations.slice(0, 6).map((dest, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="group relative rounded-3xl overflow-hidden aspect-[4/3] cursor-pointer border border-white/20 hover:border-cyan-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-bold text-base">{dest.name}</h3>
                  </div>
                  <p className="text-sm text-white/80 line-clamp-2">{dest.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}