import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, AlertTriangle, Users, Minus, Plus, Car, Check, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, isBefore, startOfDay, isSameDay, isToday } from 'date-fns';
import { base44 } from '@/api/base44Client';

const timeSlots = {
  half_day_fishing: [
    { time: '7:00 AM', label: 'Morning Departure' },
    { time: '8:00 AM', label: 'Morning Departure' },
  ],
  full_day_fishing: [
    { time: '7:00 AM', label: 'Morning Departure' },
    { time: '8:00 AM', label: 'Morning Departure' },
  ],
  extended_fishing: [
    { time: '7:00 AM', label: 'Morning Departure' },
  ],
  snorkeling: [
    { time: '9:00 AM', label: 'Morning' },
    { time: '12:00 PM', label: 'Afternoon' },
  ],
  coastal_leisure: [
    { time: '12:30 PM', label: 'Afternoon Departure' },
  ],
  sunset_tour: [
    { time: '2:30 PM', label: 'Sunset Departure' },
  ],
};

const boatsByLocation = {
  ixtapa_zihuatanejo: [
    {
      id: 'filu',
      name: 'FILU',
      type: '25ft Sea Fox',
      multiplier: 1,
      forLeisure: false,
      maxGuests: 6,
    },
    {
      id: 'tycoon',
      name: 'TYCOON',
      type: '55ft Azimut Yacht',
      multiplier: 3.2,
      forLeisure: true,
      maxGuests: 12,
    },
  ],
  acapulco: [
    {
      id: 'pirula',
      name: 'Pirula',
      type: '50ft Leisure Boat',
      multiplier: 2.5,
      forLeisure: true,
      maxGuests: 10,
    },
    {
      id: 'la_guera',
      name: 'La Güera',
      type: '30ft Center Console',
      multiplier: 1.2,
      forLeisure: false,
      maxGuests: 7,
    },
  ],
};

export default function BookingCalendar({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const location = bookingData.location || 'ixtapa_zihuatanejo';
  const boats = boatsByLocation[location];
  
  const [selectedDate, setSelectedDate] = useState(bookingData.date ? new Date(bookingData.date) : null);
  const [selectedTime, setSelectedTime] = useState(bookingData.time_slot || null);
  const [guests, setGuests] = useState(bookingData.guests || 2);
  const [needsTaxi, setNeedsTaxi] = useState(bookingData.needs_taxi || false);
  const [taxiAddress, setTaxiAddress] = useState(bookingData.taxi_address || '');
  const [selectedBoat, setSelectedBoat] = useState(bookingData.boat_id || bookingData.boat_name);
  const [blockedDates, setBlockedDates] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);

  // Use time from expedition pricing if available, otherwise fall back to timeSlots
  const availableSlots = experience.pricing?.departure_time 
    ? [{ time: experience.pricing.departure_time, label: 'Departure' }]
    : (timeSlots[bookingData.experience_type] || []);
  const today = startOfDay(new Date());
  const minDate = addDays(today, 1); // Only allow booking from tomorrow onwards
  
  const isLeisureExperience = bookingData.experience_type === 'snorkeling' || bookingData.experience_type === 'coastal_leisure' || bookingData.experience_type === 'sunset_tour' || bookingData.experience_type === 'extended_fishing';
  const availableBoats = isLeisureExperience ? boats : boats.filter(b => !b.forLeisure);
  const currentBoat = boats.find(b => b.id === selectedBoat || b.name === selectedBoat);
  const maxGuests = currentBoat ? currentBoat.maxGuests : 6;

  React.useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const blocked = await base44.entities.BlockedDate.list();
        setBlockedDates(blocked); // Keep full objects to access boat_name
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };
    fetchBlockedDates();
  }, []);

  React.useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookings = await base44.entities.Booking.list();
        setExistingBookings(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    fetchBookings();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleContinue = () => {
    if (needsTaxi && !taxiAddress.trim()) {
      alert('Please enter your pickup address for taxi service');
      return;
    }
    
    const boat = boats.find(b => b.id === selectedBoat || b.name === selectedBoat);
    setBookingData({
      ...bookingData,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: selectedTime,
      guests,
      needs_taxi: needsTaxi,
      taxi_address: needsTaxi ? taxiAddress : '',
      taxi_fee: needsTaxi ? 400 : 0,
      boat_id: selectedBoat,
      boat_name: boat?.name || bookingData.boat_name,
      boat_multiplier: boat?.multiplier || 1,
    });
    onContinue();
  };

  return (
    <section className="min-h-screen bg-[#f8f6f3] py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to experiences</span>
          </button>

          {/* Selected Experience */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm mb-8 flex gap-4 items-center">
            <img 
              src={experience.image} 
              alt={experience.title}
              className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover flex-shrink-0"
            />
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-800">{experience.title}</h2>
              <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                {experience.duration}
              </p>
              <Badge variant="secondary" className="mt-2 bg-sky-50 text-sky-700">
                ${(experience.pricing?.price_mxn || experience.price || 0).toLocaleString()} MXN
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Calendar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  // Only allow dates from tomorrow onwards
                  if (isBefore(date, minDate)) return true;
                  
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const currentBoat = boats.find(b => b.id === selectedBoat || b.name === selectedBoat);
                  if (!currentBoat) return false;
                  
                  // Check if this exact date is blocked for the selected boat
                  const isBlockedForBoat = blockedDates.some(blocked => {
                    if (blocked.date !== dateStr) return false;
                    const blockBoatName = blocked.boat_name || 'both';
                    return blockBoatName === 'both' || blockBoatName === currentBoat.name;
                  });
                  
                  if (isBlockedForBoat) return true;
                  
                  // Check if the selected boat is already booked on this exact date only
                  const isBoatBooked = existingBookings.some(
                    booking => booking.date === dateStr && 
                               booking.boat_name === currentBoat.name && 
                               booking.status !== 'cancelled'
                  );
                  
                  return isBoatBooked;
                }}
                className="rounded-lg"
                modifiers={{
                  past: (date) => isBefore(date, minDate),
                  blocked: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const currentBoat = boats.find(b => b.id === selectedBoat || b.name === selectedBoat);
                    if (!currentBoat) return false;
                    
                    // Check blocked dates
                    const isBlocked = blockedDates.some(blocked => {
                      if (blocked.date !== dateStr) return false;
                      const blockBoatName = blocked.boat_name || 'both';
                      return blockBoatName === 'both' || blockBoatName === currentBoat.name;
                    });
                    
                    // Check booked dates
                    const isBooked = existingBookings.some(
                      booking => booking.date === dateStr && 
                                 booking.boat_name === currentBoat.name && 
                                 booking.status !== 'cancelled'
                    );
                    
                    return isBlocked || isBooked;
                  },
                }}
                modifiersStyles={{
                  past: { color: '#cbd5e1', textDecoration: 'line-through' },
                  blocked: { color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fee2e2' },
                }}
              />
              
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0 mt-0.5"></div>
                  <p className="text-sm text-red-900">
                    <span className="font-semibold">Red dates are unavailable</span> and cannot be booked due to prior reservations or scheduling constraints.
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl flex gap-3 items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Trips operate only when weather and safety conditions allow. We'll contact you if changes are needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Boat Selection & Time & Guests */}
            <div className="space-y-6">
              {/* Boat Info - Pre-selected */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Boat</h3>
                <div className="p-4 rounded-xl border-2 border-[#1e88e5] bg-[#1e88e5]/5">
                  <div className="flex items-center gap-3">
                    <Anchor className="h-5 w-5 text-[#1e88e5]" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-[#1e88e5]">
                        {bookingData.boat_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {currentBoat?.type} • ${(experience.pricing?.price_mxn || experience.price || 0).toLocaleString()} MXN
                      </p>
                    </div>
                    <div className="w-5 h-5 bg-[#1e88e5] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* Time Slots */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Time</h3>
                {selectedDate ? (
                  <div className="space-y-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          selectedTime === slot.time
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`h-5 w-5 ${selectedTime === slot.time ? 'text-sky-600' : 'text-slate-400'}`} />
                          <div className="text-left">
                            <p className={`font-medium ${selectedTime === slot.time ? 'text-sky-700' : 'text-slate-700'}`}>
                              {slot.time}
                            </p>
                            <p className="text-sm text-slate-500">{slot.label}</p>
                          </div>
                        </div>
                        {selectedTime === slot.time && (
                          <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-8">
                    Please select a date first
                  </p>
                )}
              </div>

              {/* Guests */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Number of Guests</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="h-5 w-5" />
                    <span>Guests</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-semibold w-8 text-center">{guests}</span>
                    <button
                      onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                      className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                      disabled={!selectedBoat}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  {selectedBoat ? `Maximum ${maxGuests} guests per trip` : 'Please select a boat first'}
                </p>
              </div>

              {/* Taxi Option */}
              <button
                onClick={() => setNeedsTaxi(!needsTaxi)}
                className={`w-full bg-white rounded-2xl p-6 shadow-sm text-left border-2 transition-all ${
                  needsTaxi ? 'border-[#1e88e5] bg-[#1e88e5]/5' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      needsTaxi ? 'bg-[#1e88e5]' : 'bg-slate-100'
                    }`}>
                      <Car className={`h-6 w-6 ${needsTaxi ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Need a taxi pickup?</h3>
                      <p className="text-sm text-slate-500">From your hotel or residence to the dock</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${needsTaxi ? 'text-[#1e88e5]' : 'text-slate-600'}`}>+$400 MXN</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      needsTaxi ? 'border-[#1e88e5] bg-[#1e88e5]' : 'border-slate-300'
                    }`}>
                      {needsTaxi && <Check className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                </div>
              </button>

              {/* Taxi Address Input */}
              {needsTaxi && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200"
                >
                  <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    🚕 Enter Pickup Address
                  </h3>
                  <input
                    type="text"
                    placeholder="e.g., Hotel Barceló Ixtapa, Main Lobby"
                    value={taxiAddress}
                    onChange={(e) => setTaxiAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                  <p className="text-xs text-amber-700 mt-2">
                    Please provide your hotel name and specific pickup location
                  </p>
                </motion.div>
              )}

              {/* Extra Hours Info */}
              {selectedBoat && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 rounded-2xl p-4 border border-amber-200"
                >
                  <p className="text-sm text-amber-900">
                    ⏱️ <span className="font-semibold">Extra hours:</span> Additional time beyond scheduled duration is{' '}
                    <span className="font-semibold">
                      ${currentBoat.id === 'tycoon' ? '7,500' : '2,500'} MXN per hour
                    </span>
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8">
            <Button
              onClick={handleContinue}
              disabled={!selectedDate || !selectedTime || !selectedBoat}
              className="w-full md:w-auto md:min-w-[200px] bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              Continue to Pickup Location
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}