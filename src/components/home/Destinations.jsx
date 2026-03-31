import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Fallback hardcoded data per region (used only if DB has no records for a region)
const fallbackDestinations = {
  ixtapa_zihuatanejo: [
    { id: 'playa-las-gatas', name: 'Playa Las Gatas', description: 'Protected cove with crystal-clear waters, ideal for snorkeling and diving.', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800' },
    { id: 'isla-ixtapa', name: 'La Isla (Isla Ixtapa)', description: 'Pristine island accessible by boat, featuring beautiful beaches and snorkeling.', image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800' },
    { id: 'zihuatanejo-bay', name: 'Zihuatanejo Bay', description: 'Charming traditional fishing village with a picturesque bay.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
    { id: 'playa-la-ropa', name: 'Playa La Ropa', description: 'Long crescent beach with calm waters, perfect for swimming.', image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800' },
    { id: 'playa-quieta', name: 'Playa Quieta', description: 'Tranquil beach with gentle waves, ideal for families.', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800' },
    { id: 'barra-de-potosi', name: 'Barra de Potosí', description: 'Unique ecosystem where lagoon meets ocean with mangrove sanctuary.', image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/8267f1a84_image.png' },
  ],
  acapulco: [
    { id: 'la-quebrada', name: 'La Quebrada', description: 'Famous cliff diving spot where professional divers plunge from heights.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800' },
    { id: 'playa-caleta', name: 'Playa Caleta & Caletilla', description: 'Two charming adjacent bays with calm waters, perfect for families.', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800' },
    { id: 'isla-roqueta', name: 'Isla Roqueta', description: 'Small island paradise with pristine beaches and snorkeling spots.', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800' },
    { id: 'playa-revolcadero', name: 'Playa Revolcadero', description: 'Wild, untamed beach with powerful waves perfect for surfing.', image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800' },
    { id: 'puerto-marques', name: 'Puerto Marqués', description: 'Sheltered bay with tranquil turquoise waters, ideal for water sports.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
    { id: 'pie-de-la-cuesta', name: 'Playa Pie de la Cuesta', description: 'Long stretch of beach famous for spectacular sunsets.', image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800' },
  ],
  cancun: [
    { id: 'zona-hotelera', name: 'Zona Hotelera', description: 'Iconic hotel strip with turquoise Caribbean waters and white sand beaches.', image: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800' },
    { id: 'isla-mujeres', name: 'Isla Mujeres', description: 'Charming island reachable by ferry, famous for snorkeling with whale sharks.', image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800' },
    { id: 'contoy-island', name: 'Isla Contoy', description: 'Pristine uninhabited bird sanctuary with spectacular coral reefs.', image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800' },
    { id: 'playa-delfines', name: 'Playa Delfines', description: 'Scenic public beach with stunning open-sea views and consistent surf breaks.', image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800' },
    { id: 'nizuc', name: 'Nizuc Reef', description: 'Vibrant coral reef teeming with tropical fish, perfect for snorkeling and diving.', image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800' },
    { id: 'puerto-morelos', name: 'Puerto Morelos', description: 'Tranquil fishing village with a protected national marine park reef nearby.', image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=800' },
  ],
};

export default function Destinations({ location = 'ixtapa_zihuatanejo' }) {
  const normalizedLocation = (location || '').toLowerCase();

  const { data: dbDestinations = [] } = useQuery({
    queryKey: ['destinations', normalizedLocation],
    queryFn: () => base44.entities.DestinationContent.filter({ region: normalizedLocation }),
    enabled: !!normalizedLocation,
  });

  // Use DB destinations if available, otherwise fall back to hardcoded
  const destinations = dbDestinations.length > 0
    ? dbDestinations.map(d => ({
        id: d.destination_id || d.id,
        name: d.name,
        description: d.summary || '',
        image: (d.images && d.images[0]) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      }))
    : (fallbackDestinations[normalizedLocation] || []);

  if (destinations.length === 0) return null;

  return (
    <section className="relative py-6 md:py-10 overflow-hidden" style={{ backgroundImage: `url('https://media.base44.com/images/public/6987f0afff96227dd3af0e68/388bdd58c_FILUMarine3.png')`, backgroundRepeat: 'repeat', backgroundSize: '300px 300px', backgroundColor: '#050f1e' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #050f1edd, #0a1f3ddd)' }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
            Explore <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Destinations</span>
          </h2>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Discover the most beautiful spots along the coast
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {destinations.slice(0, 6).map((dest, i) => (
            <motion.div
              key={dest.id || i}
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