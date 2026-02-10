import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import Hero from '@/components/booking/Hero';
import TrustSection from '@/components/booking/TrustSection';
import ExperienceCards from '@/components/booking/ExperienceCards';
import BookingCalendar from '@/components/booking/BookingCalendar';
import PickupLocation from '@/components/booking/PickupLocation';
import AddOns from '@/components/booking/AddOns';
import BookingSummary from '@/components/booking/BookingSummary';
import Confirmation from '@/components/booking/Confirmation';

const experiences = {
  half_day_fishing: {
    id: 'half_day_fishing',
    title: 'Half-Day Sport Fishing',
    duration: '5 hours',
    price: 450,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  full_day_fishing: {
    id: 'full_day_fishing',
    title: 'Full-Day Sport Fishing',
    duration: '8 hours',
    price: 750,
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
  },
  snorkeling: {
    id: 'snorkeling',
    title: 'Snorkeling Expedition',
    duration: '4 hours',
    price: 350,
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
  },
  coastal_leisure: {
    id: 'coastal_leisure',
    title: 'Coastal Leisure / Sunset Tour',
    duration: '3 hours',
    price: 300,
    image: 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80',
  },
};

const generateConfirmationCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IXT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function Home() {
  const [step, setStep] = useState('landing'); // landing, calendar, pickup, addons, summary, confirmation
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [bookingData, setBookingData] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  
  const experiencesRef = useRef(null);

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: (data) => {
      setConfirmedBooking(data);
      setStep('confirmation');
    },
  });

  const scrollToExperiences = () => {
    experiencesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectExperience = (experience) => {
    setSelectedExperience(experience);
    setBookingData({ experience_type: experience.id });
    setStep('calendar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmBooking = async (data) => {
    const confirmationCode = generateConfirmationCode();
    const bookingPayload = {
      ...data,
      confirmation_code: confirmationCode,
      status: 'pending',
    };
    
    createBookingMutation.mutate(bookingPayload);
  };

  // Landing page view
  if (step === 'landing') {
    return (
      <div className="min-h-screen">
        <Hero onScrollToExperiences={scrollToExperiences} />
        <TrustSection />
        <div ref={experiencesRef}>
          <ExperienceCards onSelectExperience={handleSelectExperience} />
        </div>
        
        {/* Footer */}
        <footer className="bg-[#0c2340] text-white py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h3 className="text-2xl font-light mb-2">Ready for your adventure?</h3>
            <p className="text-[#1e88e5]/80 mb-6">Book now and create unforgettable memories in Ixtapa-Zihuatanejo</p>
            <p className="text-sm text-white/50">© 2026 Filu Marine. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Calendar step
  if (step === 'calendar') {
    return (
      <BookingCalendar 
        experience={selectedExperience}
        onBack={() => setStep('landing')}
        onContinue={() => setStep('pickup')}
        bookingData={bookingData}
        setBookingData={setBookingData}
      />
    );
  }

  // Pickup location step
  if (step === 'pickup') {
    return (
      <PickupLocation 
        experience={selectedExperience}
        onBack={() => setStep('calendar')}
        onContinue={() => setStep('addons')}
        bookingData={bookingData}
        setBookingData={setBookingData}
      />
    );
  }

  // Add-ons step
  if (step === 'addons') {
    return (
      <AddOns 
        experience={selectedExperience}
        onBack={() => setStep('pickup')}
        onContinue={() => setStep('summary')}
        bookingData={bookingData}
        setBookingData={setBookingData}
      />
    );
  }

  // Summary & Payment step
  if (step === 'summary') {
    return (
      <BookingSummary 
        experience={selectedExperience}
        onBack={() => setStep('addons')}
        onConfirm={handleConfirmBooking}
        bookingData={bookingData}
        setBookingData={setBookingData}
        isSubmitting={createBookingMutation.isPending}
      />
    );
  }

  // Confirmation step
  if (step === 'confirmation' && confirmedBooking) {
    return (
      <Confirmation 
        booking={confirmedBooking}
        experience={experiences[confirmedBooking.experience_type]}
      />
    );
  }

  return null;
}