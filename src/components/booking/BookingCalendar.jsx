import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, AlertTriangle, Users, Minus, Plus, Car, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, isBefore, startOfDay, isSameDay } from 'date-fns';
import { base44 } from '@/api/base44Client';

const timeSlots = {
  half_day_fishing: [
    { time: '6:00 AM', label: 'Early Morning' },
    { time: '2:00 PM', label: 'Afternoon' },
  ],
  full_day_fishing: [
    { time: '6:00 AM', label: 'Full Day Start' },
  ],
  snorkeling: [
    { time: '7:00 AM', label: 'Morning' },
    { time: '2:00 PM', label: 'Afternoon' },
  ],
  coastal_leisure: [
    { time: '2:00 PM', label: 'Afternoon' },
    { time: '4:00 PM', label: 'Sunset' },
  ],
};

export default function BookingCalendar({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const [selectedDate, setSelectedDate] = useState(bookingData.date ? new Date(bookingData.date) : null);
  const [selectedTime, setSelectedTime] = useState(bookingData.time_slot || null);
  const [guests, setGuests] = useState(bookingData.guests || 2);
  const [needsTaxi, setNeedsTaxi] = useState(bookingData.needs_taxi || false);
  const [blockedDates, setBlockedDates] = useState([]);

  const availableSlots = timeSlots[experience.id] || [];
  const today = startOfDay(new Date());
  const minDate = addDays(today, 1);

  React.useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const blocked = await base44.entities.BlockedDate.list();
        setBlockedDates(blocked.map(b => new Date(b.date)));
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };
    fetchBlockedDates();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleContinue = () => {
    setBookingData({
      ...bookingData,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: selectedTime,
      guests,
      needs_taxi: needsTaxi,
      taxi_fee: needsTaxi ? 20 : 0,
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
                  return blockedDates.some(blocked => isSameDay(blocked, date));
                }}
                className="rounded-lg"
              />
              
              <div className="mt-4 p-3 bg-amber-50 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Trips operate only when weather and safety conditions allow. We'll contact you if changes are needed.
                </p>
              </div>
            </div>

            {/* Time & Guests */}
            <div className="space-y-6">
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
                      onClick={() => setGuests(Math.min(6, guests + 1))}
                      className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">Maximum 6 guests per trip</p>
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
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8">
            <Button
              onClick={handleContinue}
              disabled={!selectedDate || !selectedTime}
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