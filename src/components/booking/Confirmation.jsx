import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, Users, MapPin, MessageCircle, Sun, Shirt, Camera, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const whatToBring = [
  { icon: Sun, text: 'Sunscreen & sunglasses' },
  { icon: Shirt, text: 'Light, comfortable clothing' },
  { icon: Camera, text: 'Camera (waterproof recommended)' },
  { icon: Droplets, text: 'Towel & change of clothes' },
];

export default function Confirmation({ booking, experience, onBackToMain }) {
  const whatsappLink = "https://wa.me/525513782169?text=Hello!%20I%20have%20a%20booking%20with%20confirmation%20code:%20" + booking.confirmation_code;

  return (
    <section className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-12 md:py-20">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-light text-slate-800 mb-3">
            Booking <span className="font-semibold">Confirmed!</span>
          </h1>
          <p className="text-slate-600 text-lg">
            Your adventure awaits. Check your email for details.
          </p>
        </motion.div>

        {/* Confirmation Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500 mb-1">Confirmation Code</p>
            <p className="text-3xl font-bold text-slate-800 tracking-wider">{booking.confirmation_code}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Date</span>
              </div>
              <p className="font-semibold text-slate-800">
                {format(new Date(booking.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Time</span>
              </div>
              <p className="font-semibold text-slate-800">{booking.time_slot}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
            <p className="font-semibold text-slate-800 mb-1">{experience.title}</p>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {booking.guests} guest{booking.guests > 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>

        {/* Meeting Point */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-600" />
            Meeting Point
          </h3>
          <p className="text-slate-600 mb-2">
            <strong>{booking.pickup_location || 'Marina Ixtapa'}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {booking.location === 'acapulco' 
              ? 'Our crew will contact you 24 hours before departure with exact meeting details.'
              : 'Dock #12, near the main entrance. Look for our boat with the FILU Marine logo.'}
          </p>
          <p className="text-sm text-slate-600">
            Please arrive <strong>15 minutes before</strong> your scheduled departure time.
          </p>
        </motion.div>

        {/* What to Bring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <h3 className="font-semibold text-slate-800 mb-4">What to Bring</h3>
          <div className="grid grid-cols-2 gap-3">
            {whatToBring.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <item.icon className="h-4 w-4 text-slate-400" />
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weather Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-amber-50 rounded-2xl p-6 mb-8"
        >
          <h3 className="font-semibold text-amber-800 mb-2">Weather & Safety Policy</h3>
          <p className="text-sm text-amber-700">
            Your safety is our priority. If weather conditions are unsuitable, we will contact you to reschedule at no extra cost. Final decision is made by our captain on the day of departure.
          </p>
        </motion.div>

        {/* WhatsApp Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <p className="text-slate-600 mb-4">Questions? We're here to help.</p>
          <Button
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-full font-medium"
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Contact us on WhatsApp
            </a>
          </Button>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/fc470a313_image.png" 
            alt="WhatsApp QR Code" 
            className="w-32 h-32 mx-auto mt-4"
          />
        </motion.div>

        {/* Back to Main Page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <Button
            onClick={onBackToMain}
            variant="outline"
            size="lg"
            className="px-8 py-6 rounded-full font-medium"
          >
            Back to Main Page
          </Button>
        </motion.div>
      </div>
    </section>
  );
}