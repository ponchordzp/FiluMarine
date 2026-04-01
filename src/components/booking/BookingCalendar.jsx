import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, AlertTriangle, Users, Minus, Plus, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, isBefore, startOfDay, isSameDay, isToday } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// Fallback time slots when the vessel editor has no departure_time configured
const fallbackTimeSlots = {
  half_day_fishing: [{ time: '6:00 AM', label: 'Morning Departure' }],
  full_day_fishing:  [{ time: '6:00 AM', label: 'Morning Departure' }],
  extended_fishing:  [{ time: '6:00 AM', label: 'Morning Departure' }],
  snorkeling:        [{ time: '7:00 AM', label: 'Morning Departure' }],
  coastal_leisure:   [{ time: '7:00 AM', label: 'Departure' }],
  sunset_tour:       [{ time: '4:00 PM', label: 'Sunset Departure' }],
};

// Helper to extract max guests from capacity string
const getMaxGuests = (capacityStr) => {
  if (!capacityStr) return 6;
  const match = capacityStr.match(/\d+/);
  return match ? parseInt(match[0]) : 6;
};

export default function BookingCalendar({ experience, onBack, onContinue, bookingData, setBookingData }) {
  const location = bookingData.location || 'ixtapa_zihuatanejo';
  
  // Fetch boats from database
  const { data: boatsFromDB = [] } = useQuery({
    queryKey: ['boats', location],
    queryFn: () => base44.entities.BoatInventory.list('-created_date'),
  });

  const activeBoats = boatsFromDB.filter(boat => 
    boat.location === location && 
    boat.status === 'active' && 
    boat.boat_mode !== 'maintenance_only'
  );

  // Map database boats to required format
  const boats = activeBoats.map(boat => ({
    id: boat.id,
    name: boat.name,
    type: `${boat.size} ${boat.type}`,
    size: boat.size,
    multiplier: 1, // Will use actual pricing from expedition_pricing
    forLeisure: boat.available_expeditions?.some(exp => 
      ['snorkeling', 'coastal_leisure', 'sunset_tour', 'extended_fishing'].includes(exp)
    ) || false,
    maxGuests: getMaxGuests(boat.capacity),
    expedition_pricing: boat.expedition_pricing || [],
  }));

  const defaultBoat = boats.length > 0 ? boats[0].id : null;
  
  const [selectedDate, setSelectedDate] = useState(bookingData.date ? new Date(bookingData.date) : null);
  const [selectedTime, setSelectedTime] = useState(bookingData.time_slot || null);
  const [guests, setGuests] = useState(bookingData.guests || 2);
  const [selectedBoat, setSelectedBoat] = useState(bookingData.boat_id || defaultBoat);
  const [blockedDates, setBlockedDates] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);

  // Derive time slots from the selected boat's vessel-editor expedition_pricing
  // Reads all unique departure times from pickup_departures (authoritative)
  // then falls back to legacy departure_time field
  const getAvailableSlotsForBoat = (boatId) => {
    const boat = activeBoats.find(b => b.id === boatId);
    if (boat?.expedition_pricing) {
      const pricing = boat.expedition_pricing.find(p => p.expedition_type === experience.id);
      if (pricing) {
        // pickup_departures is authoritative — extract all unique departure times
        if (pricing.pickup_departures && pricing.pickup_departures.length > 0) {
          const times = [...new Set(
            pricing.pickup_departures.map(d => d.departure_time).filter(t => t && t.trim())
          )];
          if (times.length > 0) return times.map(t => ({ time: t, label: 'Departure' }));
        }
        // Legacy: single departure_time field
        if (pricing.departure_time && pricing.departure_time.trim()) {
          return [{ time: pricing.departure_time, label: 'Departure' }];
        }
      }
    }
    return fallbackTimeSlots[experience.id] || [];
  };

  // Get booked time slots on a specific date for the selected boat
  const getBookedTimesForDate = (boatName, dateStr) =>
    existingBookings
      .filter(b => b.date === dateStr && b.boat_name === boatName && b.status !== 'cancelled')
      .map(b => b.time_slot);

  const availableSlots = getAvailableSlotsForBoat(selectedBoat);
  const today = startOfDay(new Date());
  const minDate = addDays(today, 1); // Only allow booking from tomorrow onwards
  
  const isLeisureExperience = experience.id === 'snorkeling' || experience.id === 'coastal_leisure' || experience.id === 'sunset_tour' || experience.id === 'extended_fishing';
  
  // Filter boats based on experience availability
  // Show all boats for this location - pricing fallback (line 124) handles missing configs
  const availableBoats = boats.filter(boat => {
    const sourceBoat = activeBoats.find(b => b.id === boat.id);
    
    // Check expedition_pricing first - if configured, use it as primary source
    if (boat.expedition_pricing && boat.expedition_pricing.length > 0) {
      const hasPricing = boat.expedition_pricing.some(p => p.expedition_type === experience.id);
      if (hasPricing) return true;
    }
    
    // Check available_expeditions field as fallback
    if (sourceBoat?.available_expeditions && sourceBoat.available_expeditions.length > 0) {
      if (sourceBoat.available_expeditions.includes(experience.id)) return true;
    }
    
    // FALLBACK: Show all boats for the location even if not explicitly configured
    // This prevents empty boat lists while configs are being set up
    return true;
  });
  const currentBoat = boats.find(b => b.id === selectedBoat);
  const maxGuests = currentBoat ? currentBoat.maxGuests : 6;

  // Get actual price from boat's expedition pricing
  const getBoatPrice = (boat) => {
    if (!boat || !boat.expedition_pricing) return experience.price;
    const pricing = boat.expedition_pricing.find(p => p.expedition_type === experience.id);
    return pricing ? pricing.price_mxn : experience.price;
  };

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

  const handleBoatSelect = (boatId) => {
    setSelectedBoat(boatId);
    setSelectedTime(null); // reset time since slots may differ per boat
  };

  const handleContinue = () => {
    const boat = boats.find(b => b.id === selectedBoat);
    const actualPrice = getBoatPrice(boat);
    setBookingData({
      ...bookingData,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: selectedTime,
      guests,
      boat_id: selectedBoat,
      boat_name: boat.name,
      boat_price: actualPrice,
    });
    onContinue();
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#0a1f3d] via-[#0c2847] to-[#001529] py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to experiences</span>
          </button>

          {/* Selected Experience */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-white/20 mb-8 flex gap-4 items-center">
            <img 
              src={experience.image} 
              alt={experience.title}
              className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover flex-shrink-0"
            />
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white">{experience.title}</h2>
              <p className="text-white/70 text-sm flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                {experience.duration}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full overflow-hidden">
            {/* Calendar */}
            <div className="bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl p-8 border-2 border-white/30 hover:border-cyan-400/40 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/20">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">Select Date</h3>
              {!selectedBoat && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <p className="text-sm text-amber-800">Please select a boat first before choosing a date</p>
                </div>
              )}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                  disabled={(date) => {
                    if (isBefore(date, minDate)) return true;
                    if (!selectedBoat) return true;
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const currentBoat = boats.find(b => b.id === selectedBoat);
                    // Blocked by admin
                    const isBlockedForBoat = blockedDates.some(blocked => {
                      if (blocked.date !== dateStr) return false;
                      const blockBoatName = blocked.boat_name || 'both';
                      return blockBoatName === 'both' || (currentBoat && blockBoatName === currentBoat.name);
                    });
                    if (isBlockedForBoat) return true;
                    // Only disable if ALL available time slots are already booked
                    const slots = getAvailableSlotsForBoat(selectedBoat);
                    if (slots.length === 0) return false;
                    const bookedTimes = getBookedTimesForDate(currentBoat?.name, dateStr);
                    return slots.every(s => bookedTimes.includes(s.time));
                  }}
                  className="rounded-lg"
                  modifiers={{
                    past: (date) => isBefore(date, minDate),
                    blocked: (date) => {
                      if (!selectedBoat) return false;
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const currentBoat = boats.find(b => b.id === selectedBoat);
                      const isBlocked = blockedDates.some(blocked => {
                        if (blocked.date !== dateStr) return false;
                        const blockBoatName = blocked.boat_name || 'both';
                        return blockBoatName === 'both' || (currentBoat && blockBoatName === currentBoat.name);
                      });
                      const slots = getAvailableSlotsForBoat(selectedBoat);
                      const bookedTimes = getBookedTimesForDate(currentBoat?.name, dateStr);
                      const allSlotsTaken = slots.length > 0 && slots.every(s => bookedTimes.includes(s.time));
                      return isBlocked || allSlotsTaken;
                    },
                  }}
                  modifiersStyles={{
                    past: { color: '#94a3b8', textDecoration: 'line-through' },
                    blocked: { color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fee2e2' },
                  }}
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4 w-full",
                    caption: "flex justify-center pt-1 relative items-center text-white font-semibold text-lg",
                    caption_label: "text-lg font-bold",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-0 text-white rounded-lg border border-white/30 transition-all",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1 mt-4",
                    head_row: "flex",
                    head_cell: "text-cyan-300 rounded-md w-10 font-bold text-sm uppercase tracking-wider",
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center text-base focus-within:relative focus-within:z-20",
                    day: "h-10 w-10 p-0 font-semibold rounded-xl text-white hover:bg-cyan-400/30 hover:text-white transition-all border-2 border-transparent hover:border-cyan-400/50 hover:scale-110",
                    day_selected: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 scale-110",
                    day_today: "bg-white/20 text-white font-bold border-2 border-white/40",
                    day_outside: "text-white/30 opacity-50",
                    day_disabled: "text-white/20 line-through cursor-not-allowed hover:bg-transparent hover:border-transparent hover:scale-100",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-red-500/20 border-2 border-red-400/40 rounded-xl flex gap-3 items-start backdrop-blur-sm">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0 mt-0.5 shadow-lg"></div>
                  <p className="text-sm text-red-100">
                    <span className="font-semibold">Red dates are unavailable</span> and cannot be booked due to prior reservations or scheduling constraints.
                  </p>
                </div>
                <div className="p-4 bg-amber-500/20 border-2 border-amber-400/40 rounded-xl flex gap-3 items-start backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-100">
                    Trips operate only when weather and safety conditions allow. We'll contact you if changes are needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Boat Selection & Time & Guests */}
            <div className="space-y-6">
              {/* Boat Selection */}
              <div className="bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border-2 border-white/30 hover:border-cyan-400/40 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/20 w-full overflow-x-hidden">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">Select Boat</h3>
                <div className="space-y-3">
                  {availableBoats.map((boat) => {
                    const boatPrice = getBoatPrice(boat);
                    return (
                      <button
                        key={boat.id}
                        onClick={() => handleBoatSelect(boat.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          selectedBoat === boat.id
                            ? 'border-cyan-400 bg-cyan-400/20'
                            : 'border-white/20 hover:border-white/30 bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Anchor className={`h-5 w-5 ${selectedBoat === boat.id ? 'text-cyan-400' : 'text-white/60'}`} />
                          <div className="text-left">
                            <p className={`font-medium ${selectedBoat === boat.id ? 'text-white' : 'text-white/80'}`}>
                              {boat.name}
                            </p>
                            <p className="text-sm text-white/60">{boat.type} • ${boatPrice.toLocaleString()} MXN</p>
                          </div>
                        </div>
                        {selectedBoat === boat.id && (
                          <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className="bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border-2 border-white/30 hover:border-cyan-400/40 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/20 w-full overflow-x-hidden">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">Select Time</h3>
                {selectedDate ? (() => {
                  const dateStr = format(selectedDate, 'yyyy-MM-dd');
                  const currentBoatObj = boats.find(b => b.id === selectedBoat);
                  const bookedTimes = selectedBoat ? getBookedTimesForDate(currentBoatObj?.name, dateStr) : [];
                  const openSlots = availableSlots.filter(s => !bookedTimes.includes(s.time));
                  return openSlots.length > 0 ? (
                    <div className="space-y-3">
                      {openSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                            selectedTime === slot.time
                              ? 'border-cyan-400 bg-cyan-400/20'
                              : 'border-white/20 hover:border-white/30 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className={`h-5 w-5 ${selectedTime === slot.time ? 'text-cyan-400' : 'text-white/60'}`} />
                            <div className="text-left">
                              <p className={`font-medium ${selectedTime === slot.time ? 'text-white' : 'text-white/80'}`}>{slot.time}</p>
                              <p className="text-sm text-white/60">{slot.label}</p>
                            </div>
                          </div>
                          {selectedTime === slot.time && (
                            <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm text-center py-8">No available time slots for this date</p>
                  );
                })() : (
                  <p className="text-white/60 text-sm text-center py-8">Please select a date first</p>
                )}
              </div>

              {/* Guests */}
              <div className="bg-gradient-to-br from-white/12 via-white/8 to-white/4 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border-2 border-white/30 hover:border-cyan-400/40 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/20 w-full overflow-x-hidden">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">Number of Guests</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="h-5 w-5" />
                    <span>Guests</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-semibold w-8 text-center text-white">{guests}</span>
                    <button onClick={() => setGuests(Math.min(maxGuests, guests + 1))} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors text-white" disabled={!selectedBoat}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/60 mt-3">
                  {selectedBoat ? `Maximum ${maxGuests} guests per trip` : 'Please select a boat first'}
                </p>
              </div>

              {/* Extra Hours Info */}
              {selectedBoat && currentBoat && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-4 border border-amber-400/30"
                >
                  <p className="text-sm text-amber-200 flex items-start gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" />
                    <span>
                      <span className="font-semibold">Extra hours:</span> Additional time beyond scheduled duration is{' '}
                      <span className="font-semibold">
                        ${((activeBoats.find(b => b.id === selectedBoat)?.price_per_additional_hour) || 2500).toLocaleString()} MXN per hour
                      </span>
                    </span>
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <motion.div 
            className="mt-12 flex justify-center"
            whileHover={{ scale: 1.02 }}
          >
            <Button
              onClick={handleContinue}
              disabled={!selectedDate || !selectedTime || !selectedBoat}
              className="relative px-16 py-8 bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 text-white text-lg font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-cyan-500/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.8)] border-2 border-cyan-400/30 overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative">Continue to Pickup Location</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}