import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from 'lucide-react';

export default function OffsiteBookingModal({ allBoats = [], operators = [] }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Form State
  const [operator, setOperator] = useState('');
  const [boatId, setBoatId] = useState('');
  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [guests, setGuests] = useState(1);
  const [pickup, setPickup] = useState('');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [experience, setExperience] = useState('');
  
  const [guestName, setGuestName] = useState('Offsite Guest');
  const [guestEmail, setGuestEmail] = useState('offsite@filumarine.com');
  const [guestPhone, setGuestPhone] = useState('0000000000');
  
  // Queries
  const { data: pickupLocations = [] } = useQuery({
    queryKey: ['pickup-locations'],
    queryFn: () => base44.entities.PickupLocation.list()
  });

  const { data: allExtras = [] } = useQuery({
    queryKey: ['extras'],
    queryFn: () => base44.entities.Extra.list()
  });
  
  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: () => base44.entities.BlockedDate.list('', 5000)
  });

  const { data: existingBookings = [] } = useQuery({
    queryKey: ['bookings-offsite'],
    queryFn: () => base44.entities.Booking.list('', 5000)
  });
  
  // Derived state
  const selectedBoatObj = allBoats.find(b => b.id === boatId);
  const filteredBoats = operator && operator !== 'all' ? allBoats.filter(b => (b.operator || 'FILU').toLowerCase() === operator.toLowerCase()) : allBoats;
  
  const boatExpeditions = selectedBoatObj?.expedition_pricing?.length > 0 
    ? selectedBoatObj.expedition_pricing 
    : (selectedBoatObj?.available_expeditions?.map(e => ({ expedition_type: e })) || []);

  const getBookedTimesForDate = (boatName, dateStr) =>
    existingBookings
      .filter(b => {
        const bDate = b.date ? b.date.split('T')[0] : '';
        return bDate === dateStr && b.boat_name === boatName && b.status !== 'cancelled';
      })
      .map(b => b.time_slot);

  const availablePickupLocations = pickupLocations.filter(loc => {
    if (!selectedBoatObj) return true;
    if (loc.location !== selectedBoatObj.location) return false;
    if (loc.applicable_boats && loc.applicable_boats.length > 0) {
      return loc.applicable_boats.includes(selectedBoatObj.name);
    }
    return true;
  });
  
  const availableExtras = useMemo(() => {
    if (!selectedBoatObj || !experience) return [];
    const expObj = boatExpeditions.find(e => e.expedition_type === experience);
    
    // De-duplicate extras by extra_name
    const extraMap = new Map();
    
    if (expObj && expObj.extras && expObj.extras.length > 0) {
      expObj.extras.forEach(ex => {
        if (ex.extra_name) extraMap.set(ex.extra_name, ex);
      });
    }
    if (selectedBoatObj.boat_extras && selectedBoatObj.boat_extras.length > 0) {
      selectedBoatObj.boat_extras.forEach(ex => {
        if (ex.extra_name && !extraMap.has(ex.extra_name)) extraMap.set(ex.extra_name, ex);
      });
    }
    
    return Array.from(extraMap.values());
  }, [selectedBoatObj, experience, boatExpeditions]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedBoatObj || !experience) return [];
    const expObj = boatExpeditions.find(e => e.expedition_type === experience);
    if (!expObj) return [];
    
    const times = new Set();
    if (expObj.pickup_departures && expObj.pickup_departures.length > 0) {
      expObj.pickup_departures.forEach(pd => {
        if (pd.departure_time) times.add(pd.departure_time);
      });
    }
    if (expObj.departure_time) {
      times.add(expObj.departure_time);
    }
    
    if (times.size === 0) {
      return ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    }
    
    return Array.from(times).sort();
  }, [selectedBoatObj, experience, boatExpeditions]);

  const maxGuests = useMemo(() => {
    if (!selectedBoatObj || !selectedBoatObj.capacity) return 15;
    const match = selectedBoatObj.capacity.match(/\d+/);
    return match ? parseInt(match[0], 10) : 15;
  }, [selectedBoatObj]);

  const currency = selectedBoatObj?.currency || 'MXN';

  // Calculate Price
  const totalPrice = useMemo(() => {
    if (!selectedBoatObj) return 0;
    let total = 0;
    const expObj = boatExpeditions.find(e => e.expedition_type === experience);
    if (expObj && expObj.price_mxn) {
      total += expObj.price_mxn;
    } else {
      total += selectedBoatObj.minor_maintenance_cost || 1000;
    }
    
    selectedExtras.forEach(exName => {
      const ex = availableExtras.find(e => e.extra_name === exName);
      if (ex && ex.price) total += ex.price;
    });
    
    return total;
  }, [selectedBoatObj, experience, selectedExtras, availableExtras, boatExpeditions]);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const code = `OFFSITE-${Date.now().toString().slice(-6)}`;
      const bookingData = {
        location: selectedBoatObj.location || 'ixtapa_zihuatanejo',
        experience_type: experience || 'half_day_fishing',
        date: format(date, 'yyyy-MM-dd'),
        time_slot: timeSlot,
        guests: parseInt(guests, 10),
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        boat_name: selectedBoatObj.name,
        pickup_location: pickup,
        add_ons: selectedExtras,
        total_price: totalPrice,
        currency: currency,
        deposit_paid: paymentMethod === 'cash' ? 0 : Math.round(totalPrice * 0.4),
        payment_method: paymentMethod === 'direct deposit' ? 'bank_transfer' : paymentMethod,
        payment_status: 'payment_done',
        remaining_payment_status: 'pending_collection',
        remaining_payment_method: paymentMethod === 'direct deposit' ? 'bank_transfer' : paymentMethod,
        status: 'confirmed',
        confirmation_code: code,
        is_practice: false
      };
      
      const booking = await base44.entities.Booking.create(bookingData);
      
      await base44.entities.BookingExpense.create({
        booking_id: booking.id,
        fuel_cost: 0,
        crew_cost: 0,
        maintenance_cost: 0,
        cleaning_cost: 0,
        supplies_cost: 0,
        other_cost: 0,
        notes: 'Offsite booking expenses pending'
      });
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setOpen(false);
      // reset
      setOperator('');
      setBoatId('');
      setDate(null);
      setTimeSlot('');
      setExperience('');
      setGuests(1);
      setPickup('');
      setSelectedExtras([]);
      setPaymentMethod('');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
          <Plus className="h-3 w-3 mr-1" /> Offsite Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-emerald-400">Create Offsite Booking</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-white/70">Operator</Label>
            <Select value={operator} onValueChange={(val) => { setOperator(val); setBoatId(''); setExperience(''); setTimeSlot(''); setDate(null); }}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select operator..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operators</SelectItem>
                <SelectItem value="FILU">FILU</SelectItem>
                {operators.filter(op => op && op.name && op.name.toLowerCase() !== 'filu').map(op => (
                  <SelectItem key={op.name} value={op.name}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-white/70">Boat</Label>
            <Select value={boatId} onValueChange={(val) => { setBoatId(val); setExperience(''); setTimeSlot(''); setDate(null); }}>
              <SelectTrigger className="bg-white/5 border-white/10" disabled={!operator}><SelectValue placeholder="Select boat..." /></SelectTrigger>
              <SelectContent>
                {filteredBoats.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedBoatObj && (
            <>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-white/70">Experience / Trip</Label>
                <Select value={experience} onValueChange={(val) => { setExperience(val); setTimeSlot(''); }}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select experience..." /></SelectTrigger>
                  <SelectContent>
                    {boatExpeditions.map(e => (
                      <SelectItem key={e.expedition_type} value={e.expedition_type}>
                        {e.expedition_type.replace(/_/g, ' ')} - ${(e.price_mxn || 0).toLocaleString()} {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-white/70">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`w-full bg-white/5 border-white/10 justify-start text-left font-normal ${!date && 'text-white/40'} hover:bg-white/10 hover:text-white`}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => { setDate(d); setTimeSlot(''); }}
                      disabled={(d) => {
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        const dateStr = format(d, 'yyyy-MM-dd');
                        if (dateStr < todayStr) return true; // Block past
                        
                        const isBlocked = blockedDates.some(blocked => {
                          const bDate = blocked.date ? blocked.date.split('T')[0] : '';
                          if (bDate !== dateStr) return false;
                          const blockBoatName = blocked.boat_name || 'both';
                          return blockBoatName === 'both' || blockBoatName === selectedBoatObj.name;
                        });
                        
                        const bookedTimes = getBookedTimesForDate(selectedBoatObj.name, dateStr);
                        const isBooked = bookedTimes.length > 0;
                        
                        return isBlocked || isBooked;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label className="text-white/70">Time Slot</Label>
                <Select value={timeSlot} onValueChange={setTimeSlot} disabled={!date}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select time..." /></SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label className="text-white/70">Guests (Max: {maxGuests})</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max={maxGuests}
                  className="bg-white/5 border-white/10 text-white" 
                  value={guests} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > maxGuests) setGuests(maxGuests);
                    else setGuests(val || 1);
                  }} 
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label className="text-white/70">Pickup Location</Label>
                <Select value={pickup} onValueChange={setPickup}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select pickup..." /></SelectTrigger>
                  <SelectContent>
                    {availablePickupLocations.map(l => (
                      <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label className="text-white/70">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select payment..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="direct deposit">Direct Deposit</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 border border-white/10 p-4 rounded-lg mt-2">
                <Label className="text-white/70 mb-2 block">Guest Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Name" value={guestName} onChange={e => setGuestName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                  <Input placeholder="Email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                  <Input placeholder="Phone" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div className="col-span-2">
                <Label className="text-white/70 mb-2 block">Extras</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                  {availableExtras.map(ex => (
                    <div key={ex.extra_name} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`extra-${ex.extra_name}`} 
                        checked={selectedExtras.includes(ex.extra_name)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedExtras([...selectedExtras, ex.extra_name]);
                          else setSelectedExtras(selectedExtras.filter(e => e !== ex.extra_name));
                        }}
                      />
                      <label htmlFor={`extra-${ex.extra_name}`} className="text-sm text-white font-medium leading-none cursor-pointer">
                        {ex.extra_name} (${(ex.price || 0).toLocaleString()} {currency})
                      </label>
                    </div>
                  ))}
                  {availableExtras.length === 0 && <span className="text-white/40 text-sm">No extras available</span>}
                </div>
              </div>

              <div className="col-span-2 mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex justify-between items-center text-lg font-bold text-emerald-400">
                  <span>Total Price:</span>
                  <span>${totalPrice.toLocaleString()} {currency}</span>
                </div>
              </div>
            </>
          )}

          <div className="col-span-2 mt-4 flex gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white">Cancel</Button>
            <Button 
              onClick={() => createBookingMutation.mutate()} 
              disabled={createBookingMutation.isPending || !boatId || !date || !timeSlot || !experience || !pickup || !paymentMethod || !guestName} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}