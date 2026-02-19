import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, MapPin, Activity, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const destinationsData = {
  'playa-las-gatas': {
    name: 'Playa Las Gatas',
    location: 'Ixtapa-Zihuatanejo, Guerrero, Mexico',
    coordinates: '17.6294° N, 101.5589° W',
    summary: 'Playa Las Gatas is a protected cove nestled on the south side of Zihuatanejo Bay, accessible only by boat or a steep hiking trail. Named after the harmless nurse sharks (locally called "gatas") that once inhabited the area, this beach is renowned for its exceptionally clear, calm waters and vibrant marine life. The natural rock formations create a natural breakwater, making it an ideal spot for snorkeling, diving, and swimming. The beach features several palapa restaurants serving fresh seafood and offers a tranquil escape from the busier beaches.',
    activities: [
      'Snorkeling and diving with tropical fish and coral formations',
      'Swimming in calm, protected waters',
      'Kayaking and paddleboarding',
      'Fresh seafood dining at beachside palapas',
      'Underwater photography',
      'Scuba diving certification courses',
      'Beach volleyball and relaxation',
      'Exploring the rocky coastline',
    ],
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1583737492602-38f2ae3b1f1e?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    ],
  },
  'isla-ixtapa': {
    name: 'Isla Ixtapa',
    location: 'Ixtapa-Zihuatanejo, Guerrero, Mexico',
    coordinates: '17.6847° N, 101.6444° W',
    summary: 'Isla Ixtapa is a pristine tropical island located just off the coast of Ixtapa, accessible by a short 10-minute boat ride from Playa Linda or Playa Quieta. This protected nature reserve features three beautiful beaches: Playa Cuachalalate, Playa Varadero, and Playa Coral. The island is home to diverse wildlife including iguanas, pelicans, and tropical birds. Crystal-clear waters surround the island, making it perfect for snorkeling, with abundant marine life visible just offshore. The island offers a perfect blend of adventure and relaxation with minimal development to preserve its natural beauty.',
    activities: [
      'Snorkeling in crystal-clear waters',
      'Beach hopping between three pristine beaches',
      'Wildlife observation (iguanas, birds, pelicans)',
      'Swimming and sunbathing',
      'Kayaking around the island',
      'Scuba diving adventures',
      'Fresh seafood at beachside restaurants',
      'Parasailing and water sports',
    ],
    images: [
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    ],
  },
  'zihuatanejo-bay': {
    name: 'Zihuatanejo Bay',
    location: 'Zihuatanejo, Guerrero, Mexico',
    coordinates: '17.6413° N, 101.5516° W',
    summary: 'Zihuatanejo Bay is a charming horseshoe-shaped bay that has maintained its authentic fishing village character despite growing tourism. The town wraps around the bay with its colorful buildings, traditional malecon (waterfront promenade), and bustling fish market. The bay offers calm, warm waters perfect for swimming and water activities. The town center features cobblestone streets, local artisan shops, and excellent seafood restaurants. Zihuatanejo serves as a gateway to several beautiful beaches and maintains a more relaxed, traditional Mexican atmosphere compared to its modern neighbor Ixtapa.',
    activities: [
      'Strolling the scenic malecon at sunset',
      'Visiting the traditional fish market',
      'Shopping for local handicrafts and art',
      'Dining at authentic Mexican restaurants',
      'Swimming in the calm bay waters',
      'Boat tours to nearby beaches',
      'Exploring colorful streets and architecture',
      'Sport fishing charters',
    ],
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
    ],
  },
  'playa-la-ropa': {
    name: 'Playa La Ropa',
    location: 'Zihuatanejo, Guerrero, Mexico',
    coordinates: '17.6286° N, 101.5464° W',
    summary: 'Playa La Ropa is one of the most popular beaches in Zihuatanejo, stretching for nearly a mile along a beautiful crescent-shaped bay. Named "the clothing beach" due to a legend of Chinese silk garments washing ashore from a wrecked ship, this beach is known for its soft golden sand and gentle waves. The beach is lined with palapa restaurants, boutique hotels, and luxury villas. The calm waters make it ideal for swimming, while consistent afternoon breezes attract windsurfers and kiteboarders. It\'s a perfect blend of natural beauty and convenient amenities.',
    activities: [
      'Swimming in calm, warm waters',
      'Windsurfing and kiteboarding',
      'Beach volleyball',
      'Dining at beachfront restaurants',
      'Sunset watching',
      'Beach massage services',
      'Water sports rentals (kayaks, paddleboards)',
      'Shopping at beach vendors',
    ],
    images: [
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    ],
  },
  'playa-quieta': {
    name: 'Playa Quieta',
    location: 'Ixtapa, Guerrero, Mexico',
    coordinates: '17.6694° N, 101.6531° W',
    summary: 'Playa Quieta, true to its name meaning "quiet beach," is a tranquil crescent-shaped beach protected by Isla Ixtapa, creating exceptionally calm waters perfect for families with children. This beach serves as the main departure point for boat trips to Isla Ixtapa. The gentle waves and shallow waters make it ideal for swimming and wading. Several palapa restaurants line the beach offering fresh seafood and cold drinks. The beach is less crowded than other Ixtapa beaches, providing a more relaxed atmosphere while still offering convenient amenities.',
    activities: [
      'Safe swimming in calm, shallow waters',
      'Boat trips to Isla Ixtapa',
      'Kayaking and paddleboarding',
      'Beach relaxation and sunbathing',
      'Fresh seafood dining',
      'Beach volleyball',
      'Children\'s beach activities',
      'Morning yoga on the beach',
    ],
    images: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    ],
  },
  'troncones-beach': {
    name: 'Troncones Beach',
    location: 'Troncones, Guerrero, Mexico',
    coordinates: '17.8431° N, 101.7431° W',
    summary: 'Troncones is a laid-back bohemian beach town located about 30 minutes north of Zihuatanejo, known for its excellent surf breaks and relaxed atmosphere. The long stretch of golden sand offers consistent waves suitable for all levels of surfers, from beginners to advanced. The town has maintained its rustic charm with small boutique hotels, yoga studios, and organic restaurants. The beach is relatively undeveloped, offering a more authentic and peaceful Mexican beach experience. It\'s become a haven for surfers, yogis, and travelers seeking tranquility away from larger resort areas.',
    activities: [
      'Surfing for all skill levels',
      'Surf lessons and board rentals',
      'Yoga retreats and classes',
      'Horseback riding on the beach',
      'Turtle conservation programs (seasonal)',
      'Beachfront dining at local restaurants',
      'Watching spectacular sunsets',
      'Exploring tide pools',
    ],
    images: [
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    ],
  },
  'la-saladita': {
    name: 'La Saladita Beach',
    location: 'Petatlan, Guerrero, Mexico',
    coordinates: '17.5844° N, 101.3819° W',
    summary: 'La Saladita is world-renowned among surfers for having one of Mexico\'s longest and most consistent left-hand point breaks. Located about 20 minutes south of Zihuatanejo, this small fishing village has become a mecca for surfers seeking perfect waves. The point break can offer rides lasting several minutes during good swells. The village maintains a relaxed, authentic atmosphere with basic accommodations and local eateries. The beach is relatively undeveloped, focusing on the surfing experience rather than tourism infrastructure. It\'s considered one of the top surf destinations in Mexico.',
    activities: [
      'World-class left-hand point break surfing',
      'Surf lessons for intermediate to advanced surfers',
      'Beach camping',
      'Fresh seafood at local eateries',
      'Fishing with local fishermen',
      'Watching surf competitions (seasonal)',
      'Photography of perfect waves',
      'Exploring the quiet fishing village',
    ],
    images: [
      'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800',
      'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    ],
  },
  'barra-de-potosi': {
    name: 'Barra de Potosí',
    location: 'Zihuatanejo, Guerrero, Mexico',
    coordinates: '17.5658° N, 101.4344° W',
    summary: 'Barra de Potosí is a unique ecological paradise where a freshwater lagoon meets the Pacific Ocean, located about 15 minutes south of Zihuatanejo. This protected area features extensive mangrove forests, pristine beaches, and a large lagoon system that serves as a sanctuary for numerous bird species and marine life. The area offers a rare combination of ecosystems in one location - ocean, lagoon, mangroves, and wetlands. Small palapa restaurants serve fresh seafood caught daily. The destination is perfect for nature lovers seeking tranquility and wildlife observation in an unspoiled setting.',
    activities: [
      'Kayaking through mangrove channels',
      'Bird watching (over 200 species)',
      'Swimming in both lagoon and ocean',
      'Fresh seafood dining',
      'Nature photography',
      'Crocodile observation (at safe distance)',
      'Fishing in the lagoon',
      'Eco-tours with local guides',
    ],
    images: [
      'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/8267f1a84_image.png',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    ],
  },
  'la-quebrada': {
    name: 'La Quebrada',
    location: 'Acapulco, Guerrero, Mexico',
    coordinates: '16.8506° N, 99.9097° W',
    summary: 'La Quebrada is Acapulco\'s most iconic attraction, famous for its daring cliff divers who have been performing death-defying leaps since the 1930s. Professional divers plunge from heights of 136 feet (45 meters) into a narrow ocean cove, timing their dives with incoming waves to ensure sufficient water depth. The spectacle requires incredible skill, courage, and precise timing. Shows are performed multiple times daily, including dramatic nighttime performances with torches. The viewing platforms offer thrilling perspectives of this dangerous art form that has become synonymous with Acapulco\'s identity.',
    activities: [
      'Watching professional cliff diving shows',
      'Photography of the dramatic dives',
      'Evening torch-lit performances',
      'Dining at the La Perla nightclub with views',
      'Learning about the history of cliff diving',
      'Exploring the viewing platforms',
      'Sunset watching from the cliffs',
      'Visiting the nearby chapel',
    ],
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800',
    ],
  },
  'playa-caleta': {
    name: 'Playa Caleta & Caletilla',
    location: 'Acapulco, Guerrero, Mexico',
    coordinates: '16.8286° N, 99.9158° W',
    summary: 'Playa Caleta and Playa Caletilla are two charming adjacent bays that were Acapulco\'s original tourist beaches in the 1950s. These twin beaches are protected by a natural rock barrier, creating exceptionally calm and shallow waters perfect for families with children. The beaches maintain a nostalgic, traditional Mexican atmosphere with local vendors, palapa restaurants, and a more relaxed vibe compared to the modern hotel zone. The nearby Mágico Mundo Marino aquarium adds to the family-friendly appeal. These beaches offer a glimpse into Acapulco\'s golden age of tourism.',
    activities: [
      'Swimming in calm, shallow waters',
      'Visiting the Mágico Mundo Marino aquarium',
      'Glass-bottom boat tours',
      'Snorkeling with tropical fish',
      'Beach games and volleyball',
      'Fresh seafood at local palapas',
      'Boat trips to Isla Roqueta',
      'Water sports and beach activities',
    ],
    images: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    ],
  },
  'isla-roqueta': {
    name: 'Isla Roqueta',
    location: 'Acapulco Bay, Guerrero, Mexico',
    coordinates: '16.8244° N, 99.9153° W',
    summary: 'Isla Roqueta is a small island paradise located in Acapulco Bay, accessible by boat from Playa Caleta or Playa Caletilla. The island features pristine beaches, crystal-clear waters, and is home to a historic lighthouse and a small zoo. The waters around the island are perfect for snorkeling and diving, with the famous underwater bronze statue of the Virgin of Guadalupe as the main underwater attraction. The island offers several beaches with different characteristics, from calm swimming areas to snorkeling spots. It\'s a peaceful escape from the bustling mainland with minimal development.',
    activities: [
      'Snorkeling and diving at the underwater Virgin shrine',
      'Beach hopping around the island',
      'Swimming in pristine waters',
      'Hiking to the lighthouse for panoramic views',
      'Visiting the small zoo',
      'Fresh seafood at island restaurants',
      'Underwater photography',
      'Kayaking around the island',
    ],
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    ],
  },
  'playa-revolcadero': {
    name: 'Playa Revolcadero',
    location: 'Zona Diamante, Acapulco, Guerrero, Mexico',
    coordinates: '16.8158° N, 99.8497° W',
    summary: 'Playa Revolcadero is a wild, untamed beach located in Acapulco\'s upscale Zona Diamante (Diamond Zone). This expansive beach features powerful waves, strong currents, and open ocean conditions, making it a popular spot for experienced surfers and bodyboarders. The beach is backed by luxury resorts and the Tres Vidas golf course. The name "Revolcadero" refers to the rolling, tumbling waves that characterize this beach. While swimming can be dangerous due to strong undertow, it\'s perfect for surfing, beach walks, horseback riding, and watching the powerful Pacific Ocean.',
    activities: [
      'Surfing and bodyboarding',
      'Horseback riding on the beach',
      'Beach running and walking',
      'Turtle conservation programs (seasonal)',
      'Kite flying',
      'Sunset photography',
      'Golf at nearby world-class courses',
      'ATV tours on the beach',
    ],
    images: [
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
      'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    ],
  },
  'puerto-marques': {
    name: 'Puerto Marqués',
    location: 'Acapulco, Guerrero, Mexico',
    coordinates: '16.8156° N, 99.8569° W',
    summary: 'Puerto Marqués is a sheltered bay with exceptionally tranquil turquoise waters, surrounded by lush green mountains in Acapulco\'s Diamante zone. This picturesque bay offers a more serene alternative to the busier beaches of Acapulco, with calm waters perfect for swimming and water sports. The beach is popular with locals and visitors seeking a quieter beach experience. Several beachfront restaurants serve fresh seafood with stunning bay views. The protected bay makes it ideal for families, water skiing, jet skiing, and sailing. The scenic beauty and calm waters make it one of Acapulco\'s most beautiful spots.',
    activities: [
      'Swimming in calm, protected waters',
      'Water skiing and jet skiing',
      'Sailing and boat rentals',
      'Paddleboarding and kayaking',
      'Fresh seafood dining with bay views',
      'Beach volleyball',
      'Parasailing',
      'Scenic photography',
    ],
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    ],
  },
  'pie-de-la-cuesta': {
    name: 'Playa Pie de la Cuesta',
    location: 'Acapulco, Guerrero, Mexico',
    coordinates: '16.8986° N, 99.9489° W',
    summary: 'Playa Pie de la Cuesta is a long, wild stretch of beach located about 15 minutes northwest of Acapulco, where the Coyuca Lagoon meets the Pacific Ocean. This beach is world-famous for its spectacular sunsets, considered among the most beautiful in Mexico. The beach features strong waves and currents on the ocean side, while the lagoon side offers calm waters. The area maintains a laid-back, bohemian atmosphere with simple beach restaurants and hammock vendors. Horseback riding along the beach at sunset is a popular activity. The dual ecosystem of ocean and lagoon makes it unique.',
    activities: [
      'Watching world-famous sunsets',
      'Horseback riding on the beach',
      'Lagoon kayaking and swimming',
      'Water skiing on the lagoon',
      'Fresh seafood at beach restaurants',
      'Hammock relaxation',
      'Birdwatching in the lagoon',
      'Beach photography',
    ],
    images: [
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    ],
  },
  'barra-vieja': {
    name: 'Barra Vieja',
    location: 'Acapulco, Guerrero, Mexico',
    coordinates: '16.7811° N, 99.7439° W',
    summary: 'Barra Vieja is an authentic fishing village located about 30 minutes east of Acapulco, famous throughout Mexico for its pescado a la talla - a local specialty of butterflied, grilled fish covered in spicy red sauce. This traditional village offers a genuine local experience away from tourist areas. The long beach features golden sand and powerful waves, while the lagoon behind provides calm waters for swimming. The village maintains its fishing heritage with colorful boats lining the shore. It\'s a culinary destination where visitors can enjoy some of the freshest and most authentic seafood in the region.',
    activities: [
      'Tasting authentic pescado a la talla',
      'Fresh seafood dining at beach restaurants',
      'Swimming in the calm lagoon',
      'Surfing and bodyboarding',
      'Observing traditional fishing methods',
      'Buying fresh fish directly from fishermen',
      'Beach walks and relaxation',
      'Exploring the fishing village',
    ],
    images: [
      'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    ],
  },
  'laguna-coyuca': {
    name: 'Laguna de Coyuca',
    location: 'Acapulco, Guerrero, Mexico',
    coordinates: '16.8856° N, 99.9781° W',
    summary: 'Laguna de Coyuca is a pristine freshwater lagoon spanning 28 square miles, surrounded by lush palm groves and mangrove forests. This tranquil lagoon is separated from the Pacific Ocean by a narrow strip of land at Pie de la Cuesta. The lagoon is an important bird sanctuary and migration stop, hosting over 100 bird species including herons, pelicans, storks, and egrets. Small islands dot the lagoon, serving as nesting grounds for various bird colonies. The calm waters are perfect for kayaking, fishing, and water skiing. Several rustic restaurants built over the water serve fresh fish and regional dishes.',
    activities: [
      'Kayaking through calm waters',
      'Bird watching and photography',
      'Fishing for tilapia and bass',
      'Water skiing',
      'Boat tours of the lagoon',
      'Fresh fish dining at overwater restaurants',
      'Exploring mangrove channels',
      'Wildlife observation',
    ],
    images: [
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
    ],
  },
};

export default function Destination() {
  const urlParams = new URLSearchParams(window.location.search);
  const destinationId = urlParams.get('id');
  const [destination, setDestination] = useState(null);

  const { data: dbDestinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => base44.entities.DestinationContent.list(),
  });

  useEffect(() => {
    const dbDest = dbDestinations.find(d => d.destination_id === destinationId);
    if (dbDest) {
      setDestination(dbDest);
    } else {
      setDestination(destinationsData[destinationId]);
    }
  }, [destinationId, dbDestinations]);

  if (!destination) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1929] to-[#0c2340] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Destination Not Found</h1>
          <Link to={createPageUrl('Home')} className="text-[#1e88e5] hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1929] to-[#0c2340]">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={destination.images[0]}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1929] via-[#0a1929]/50 to-transparent" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-6 pb-12 w-full">
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {destination.name}
              </h1>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="h-5 w-5 text-[#1e88e5]" />
                <p className="text-lg">{destination.location}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#1e88e5]" />
            Overview
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-4">{destination.summary}</p>
          <p className="text-white/60 text-sm">
            <strong>Coordinates:</strong> {destination.coordinates}
          </p>
        </motion.div>

        {/* Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#1e88e5]" />
            Activities & Attractions
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {destination.activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
              >
                <div className="w-2 h-2 bg-[#1e88e5] rounded-full mt-2 flex-shrink-0" />
                <p className="text-white/90">{activity}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Photo Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-[#1e88e5]" />
            Photo Gallery
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {destination.images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="aspect-square rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src={image}
                  alt={`${destination.name} ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center bg-gradient-to-r from-[#1e88e5]/20 to-[#0c2340]/20 rounded-3xl p-12 border border-white/10"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Explore {destination.name}?
          </h3>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Book your marine adventure with FILU and discover this incredible destination
          </p>
          <Link to={createPageUrl('Home')}>
            <button className="bg-[#1e88e5] hover:bg-[#1976d2] text-white px-8 py-4 rounded-full font-semibold transition-colors">
              Book Your Experience
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}