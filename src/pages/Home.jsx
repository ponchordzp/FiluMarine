import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Settings, Calendar } from 'lucide-react';
import LocationSelector from '@/components/booking/LocationSelector';
import Hero from '@/components/booking/Hero';
import IntroSection from '@/components/home/IntroSection';
import ExperienceCards from '@/components/booking/ExperienceCards';
import BoatBenefits from '@/components/home/BoatBenefits';
import Fleet from '@/components/home/Fleet';
import Destinations from '@/components/home/Destinations';
import JoinFilu from '@/components/home/JoinFilu';
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
    price: 9999,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  full_day_fishing: {
    id: 'full_day_fishing',
    title: 'Full-Day Sport Fishing',
    duration: '8 hours',
    price: 15999,
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
  },
  extended_fishing: {
    id: 'extended_fishing',
    title: 'Full Day Expedition',
    duration: '10 hours',
    price: 20000,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  snorkeling: {
    id: 'snorkeling',
    title: 'Snorkeling Expedition',
    duration: '5 hours',
    price: 9599,
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
  },
  coastal_leisure: {
    id: 'coastal_leisure',
    title: 'Coastal Leisure Tour',
    duration: '5 hours',
    price: 9599,
    image: 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80',
  },
  sunset_tour: {
    id: 'sunset_tour',
    title: 'Sunset Tour',
    duration: '5 hours',
    price: 9599,
    image: 'https://images.unsplash.com/photo-1495954484750-af469f2f9be5?w=800&q=80',
  },
};

const generateConfirmationCode = (location) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix = location === 'acapulco' ? 'ACA-' : 'IXT-';
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function Home() {
  const [step, setStep] = useState('location'); // location, landing, boat_selector, calendar, pickup, addons, summary, confirmation
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [bookingData, setBookingData] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const experiencesRef = useRef(null);

  React.useEffect(() => {
    // Load Google Translate script
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', includedLanguages: 'en,es,fr' },
        'google_translate_element'
      );
    };
  }, []);

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

  const handleSelectLocation = (locationId) => {
    setSelectedLocation(locationId);
    setBookingData({ location: locationId });
    setStep('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectExperience = (experience) => {
    setSelectedExperience(experience);
    setBookingData(prev => ({ ...prev, experience_type: experience.id }));
    setStep('calendar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmBooking = async (data) => {
    const confirmationCode = generateConfirmationCode(data.location);
    const bookingPayload = {
      ...data,
      confirmation_code: confirmationCode,
      status: 'pending',
    };
    
    // Send confirmation email
    const experience = experiences[data.experience_type];
    const emailBody = `
      <h2>Booking Confirmed - Filu Marine</h2>
      <p>Thank you for booking with Filu Marine! Your adventure awaits.</p>
      
      <h3>Confirmation Code: ${confirmationCode}</h3>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Experience:</strong> ${experience.title}</li>
        <li><strong>Date:</strong> ${format(parseISO(data.date), 'EEEE, MMMM d, yyyy')}</li>
        <li><strong>Time:</strong> ${data.time_slot}</li>
        <li><strong>Guests:</strong> ${data.guests}</li>
        <li><strong>Boat:</strong> ${data.boat_name}</li>
        <li><strong>Pickup Location:</strong> ${data.pickup_location || 'Marina Ixtapa'}</li>
      </ul>
      
      <h3>Meeting Point:</h3>
      <p><strong>Marina Ixtapa</strong><br/>
      Dock #12, near the main entrance. Look for the boat with our logo.<br/>
      Please arrive <strong>15 minutes before</strong> your scheduled departure time.</p>
      
      <h3>What to Bring:</h3>
      <ul>
        <li>Sunscreen & sunglasses</li>
        <li>Light, comfortable clothing</li>
        <li>Camera (waterproof recommended)</li>
        <li>Towel & change of clothes</li>
      </ul>
      
      <h3>Weather & Safety Policy:</h3>
      <p>Your safety is our priority. If weather conditions are unsuitable, we will contact you to reschedule at no extra cost. Final decision is made by our captain on the day of departure.</p>
      
      <h3>Questions?</h3>
      <p>Contact us on WhatsApp: +52 55 1378 2169</p>
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/fc470a313_image.png" alt="WhatsApp QR Code" style="width: 150px; height: 150px;"/>
      
      <p>We look forward to seeing you!</p>
      <p><em>- Filu Marine Team</em></p>
    `;
    
    try {
      // Send confirmation email to guest
      await base44.integrations.Core.SendEmail({
        from_name: 'Filu Marine',
        to: data.guest_email,
        subject: `Booking Confirmed - ${confirmationCode}`,
        body: emailBody
      });

      // Send notification to management
      const managementEmailBody = `
        <h2>New Booking Received - Filu Marine</h2>
        <h3>Confirmation Code: ${confirmationCode}</h3>
        
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Experience:</strong> ${experience.title}</li>
          <li><strong>Date:</strong> ${format(parseISO(data.date), 'EEEE, MMMM d, yyyy')}</li>
          <li><strong>Time:</strong> ${data.time_slot}</li>
          <li><strong>Guests:</strong> ${data.guests}</li>
          <li><strong>Boat:</strong> ${data.boat_name}</li>
          <li><strong>Pickup Location:</strong> ${data.pickup_location || 'Marina Ixtapa'}</li>
          ${data.taxi_needed ? '<li><strong>Taxi Needed:</strong> Yes</li>' : ''}
        </ul>
        
        <h3>Guest Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.guest_name}</li>
          <li><strong>Email:</strong> ${data.guest_email}</li>
          <li><strong>Phone:</strong> ${data.guest_phone}</li>
        </ul>
        
        <h3>Payment:</h3>
        <ul>
          <li><strong>Total Price:</strong> $${data.total_price.toLocaleString()} MXN</li>
          <li><strong>Deposit:</strong> $${data.deposit_paid.toLocaleString()} MXN</li>
          <li><strong>Payment Method:</strong> ${data.payment_method}</li>
        </ul>
        
        ${data.add_ons && data.add_ons.length > 0 ? `
        <h3>Add-ons:</h3>
        <ul>
          ${data.add_ons.map(addon => `<li>${addon}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${data.special_requests ? `
        <h3>Special Requests:</h3>
        <p>${data.special_requests}</p>
        ` : ''}
      `;
      
      await base44.integrations.Core.SendEmail({
        from_name: 'Filu Marine Booking System',
        to: 'arodriguezpenam@gmail.com',
        subject: `New Booking: ${confirmationCode} - ${experience.title}`,
        body: managementEmailBody
      });

      // Send WhatsApp notification (note: this creates a message URL that can be used)
      const whatsappMessage = `*NEW BOOKING - FILU MARINE*%0A%0A*Confirmation:* ${confirmationCode}%0A*Experience:* ${experience.title}%0A*Date:* ${format(parseISO(data.date), 'EEEE, MMMM d, yyyy')}%0A*Time:* ${data.time_slot}%0A*Guests:* ${data.guests}%0A*Boat:* ${data.boat_name}%0A${data.taxi_needed ? '*Taxi Needed:* Yes%0A' : ''}%0A*Guest:* ${data.guest_name}%0A*Phone:* ${data.guest_phone}%0A*Total:* $${data.total_price.toLocaleString()} MXN`;
      
      // Open WhatsApp link in new window (this will notify management)
      window.open(`https://wa.me/5215513782169?text=${whatsappMessage}`, '_blank');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
    
    createBookingMutation.mutate(bookingPayload);
  };
  
  const handleBackToMain = () => {
    setStep('location');
    setSelectedLocation(null);
    setSelectedExperience(null);
    setBookingData({});
    setConfirmedBooking(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeLocation = () => {
    setStep('location');
    setSelectedExperience(null);
    setBookingData({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Location selector
  if (step === 'location') {
    return <LocationSelector onSelectLocation={handleSelectLocation} />;
  }

  const locationName = selectedLocation === 'ixtapa_zihuatanejo' ? 'Ixtapa-Zihuatanejo' : 'Acapulco';

  // Landing page view
  if (step === 'landing') {
    return (
      <div className="min-h-screen">
        <div id="google_translate_element" className="fixed top-0 left-0 right-0 z-50"></div>
        <Hero 
          onScrollToExperiences={scrollToExperiences} 
          location={selectedLocation}
          locationName={locationName}
          onChangeLocation={handleChangeLocation}
        />
        <BoatBenefits />
        <Fleet location={selectedLocation} />
        <div ref={experiencesRef}>
          <ExperienceCards onSelectExperience={handleSelectExperience} />
        </div>
        <Destinations location={selectedLocation} />
        <JoinFilu />
        
        {/* Footer */}
        <footer className="bg-[#0c2340] text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-2xl font-light mb-2">Ready for your adventure?</h3>
            <p className="text-[#1e88e5]/80 mb-6">Book now and create unforgettable memories in Ixtapa-Zihuatanejo</p>
            <a 
              href="https://instagram.com/filumarine" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-[#1e88e5] transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @filumarine
            </a>
            <p className="text-white/80 mt-4">Phone: +52 55 1378 2169</p>
            <a 
              href="https://wa.me/525513782169?text=Hello!%20I'm%20interested%20in%20booking%20a%20boat%20experience%20with%20Filu%20Marine." 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-emerald-400 transition-colors mt-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Contact via WhatsApp
            </a>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6987f0afff96227dd3af0e68/fc470a313_image.png" 
              alt="WhatsApp QR Code" 
              className="w-32 h-32 mx-auto mt-4"
            />
            
            {/* Admin Links */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link 
                  to={createPageUrl('BookingSearch')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e88e5] hover:bg-[#1976d2] border border-[#1e88e5] rounded-lg text-sm transition-colors font-medium"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find My Booking
                </Link>
                <Link 
                  to={createPageUrl('AdminBookings')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Link>
              </div>
            </div>
            
            <p className="text-sm text-white/50 mt-4">© 2026 Filu Marine. All rights reserved.</p>
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
        onBackToMain={handleBackToMain}
      />
    );
  }

  return null;
}