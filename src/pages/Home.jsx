import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import Hero from '@/components/booking/Hero';
import TrustSection from '@/components/booking/TrustSection';
import ExperienceCards from '@/components/booking/ExperienceCards';
import BoatBenefits from '@/components/home/BoatBenefits';
import Destinations from '@/components/home/Destinations';
import JoinFilu from '@/components/home/JoinFilu';
import LanguageSwitcher from '@/components/home/LanguageSwitcher';
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
    price: 8500,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  full_day_fishing: {
    id: 'full_day_fishing',
    title: 'Full-Day Sport Fishing',
    duration: '8 hours',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
  },
  extended_fishing: {
    id: 'extended_fishing',
    title: 'Full Day Expedition',
    duration: '12 hours',
    price: 20000,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  snorkeling: {
    id: 'snorkeling',
    title: 'Snorkeling Expedition',
    duration: '4 hours',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
  },
  coastal_leisure: {
    id: 'coastal_leisure',
    title: 'Coastal Leisure / Sunset Tour',
    duration: '3 hours',
    price: 5500,
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
  const [step, setStep] = useState('landing'); // landing, boat_selector, calendar, pickup, addons, summary, confirmation
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [bookingData, setBookingData] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferred-language') || 'en';
    }
    return 'en';
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dark-mode') === 'true';
    }
    return false;
  });
  
  const experiencesRef = useRef(null);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dark-mode', newMode.toString());
  };

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
        <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />
        <Hero onScrollToExperiences={scrollToExperiences} />
        <BoatBenefits />
        <div ref={experiencesRef}>
          <ExperienceCards onSelectExperience={handleSelectExperience} />
        </div>
        <Destinations />
        <JoinFilu />
        
        {/* Footer */}
        <footer className="bg-[#0c2340] text-white py-12">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h3 className="text-2xl font-light mb-2">Ready for your adventure?</h3>
            <p className="text-[#1e88e5]/80 mb-6">Book now and create unforgettable memories in Ixtapa-Zihuatanejo</p>
            <a 
              href="https://instagram.com/filumarine" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-[#1e88e5] transition-colors mb-4"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @filumarine
            </a>
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