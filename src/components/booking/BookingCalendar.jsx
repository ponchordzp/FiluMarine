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

const boats = [
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
];

export default function BookingCalendar({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const [selectedDate, setSelectedDate] = useState(bookingData.date ? new Date(bookingData.date) : null);
  const [selectedTime, setSelectedTime] = useState(bookingData.time_slot || null);
  const [guests, setGuests] = useState(bookingData.guests || 2);
  const [needsTaxi, setNeedsTaxi] = useState(bookingData.needs_taxi || false);
  const [selectedBoat, setSelectedBoat] = useState(bookingData.boat_id || null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);

  const availableSlots = timeSlots[experience.id] || [];
  const today = startOfDay(new Date());
  const minDate = addDays(today, 1); // Only allow booking from tomorrow onwards
  
  const isLeisureExperience = experience.id === 'snorkeling' || experience.id === 'coastal_leisure' || experience.id === 'sunset_tour' || experience.id === 'extended_fishing';
  const availableBoats = isLeisureExperience ? boats : boats.filter(b => !b.forLeisure);
  const currentBoat = boats.find(b => b.id === selectedBoat);
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
    const boat = boats.find(b => b.id === selectedBoat);
    setBookingData({
      ...bookingData,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: selectedTime,
      guests,
      needs_taxi: needsTaxi,
      taxi_fee: needsTaxi ? 20 : 0,
      boat_id: selectedBoat,
      boat_name: boat.name,
      boat_multiplier: boat.multiplier,
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
                From ${experience.price}
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
                  if (isBefore(date, minDate)) return true;
                  
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const currentBoat = boats.find(b => b.id === selectedBoat);
                  
                  // Check if this date is blocked for the selected boat
                  const isBlockedForBoat = blockedDates.some(blocked => {
                    const blockedDate = new Date(blocked.date);
                    if (!isSameDay(blockedDate, date)) return false;
                    const blockBoatName = blocked.boat_name || 'both';
                    return blockBoatName === 'both' || (currentBoat && blockBoatName === currentBoat.name);
                  });
                  
                  if (isBlockedForBoat) return true;
                  
                  // Check if the selected boat is already booked on this specific date
                  if (currentBoat) {
                    const isBoatBooked = existingBookings.some(
                      booking => booking.date === dateStr && 
                                 booking.boat_name === currentBoat.name && 
                                 booking.status !== 'cancelled'
                    );
                    if (isBoatBooked) return true;
                  }
                  
                  return false;
                }}
                className="rounded-lg"
                modifiers={{
                  past: (date) => isBefore(date, today) && !isToday(date),
                  blocked: (date) => {
                    const currentBoat = boats.find(b => b.id === selectedBoat);
                    return blockedDates.some(blocked => {
                      const blockedDate = new Date(blocked.date);
                      if (!isSameDay(blockedDate, date)) return false;
                      const blockBoatName = blocked.boat_name || 'both';
                      return blockBoatName === 'both' || (currentBoat && blockBoatName === currentBoat.name);
                    });
                  },
                }}
                modifiersStyles={{
                  past: { color: '#cbd5e1', textDecoration: 'line-through' },
                  blocked: { color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fee2e2' },
                }}
              />
              
              <div className="mt-4 p-3 bg-amber-50 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Trips operate only when weather and safety conditions allow. We'll contact you if changes are needed.
                </p>
              </div>
            </div>

            {/* Boat Selection & Time & Guests */}
            <div className="space-y-6">
              {/* Boat Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Boat</h3>
                <div className="space-y-3">
                  {availableBoats.map((boat) => {
                    const boatPrice = Math.round(experience.price * boat.multiplier);
                    return (
                      <button
                        key={boat.id}
                        onClick={() => setSelectedBoat(boat.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          selectedBoat === boat.id
                            ? 'border-[#1e88e5] bg-[#1e88e5]/5'
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Anchor className={`h-5 w-5 ${selectedBoat === boat.id ? 'text-[#1e88e5]' : 'text-slate-400'}`} />
                          <div className="text-left">
                            <p className={`font-medium ${selectedBoat === boat.id ? 'text-[#1e88e5]' : 'text-slate-700'}`}>
                              {boat.name}
                            </p>
                            <p className="text-sm text-slate-500">{boat.type} • ${boatPrice.toLocaleString()} MXN</p>
                          </div>
                        </div>
                        {selectedBoat === boat.id && (
                          <div className="w-5 h-5 bg-[#1e88e5] rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
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
                    <span className={`font-semibold ${needsTaxi ? 'text-[#1e88e5]' : 'text-slate-600'}`}>+$20</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      needsTaxi ? 'border-[#1e88e5] bg-[#1e88e5]' : 'border-slate-300'
                    }`}>
                      {needsTaxi && <Check className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                </div>
              </button>

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