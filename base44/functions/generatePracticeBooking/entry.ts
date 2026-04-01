import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { count = 1, boatName, daysBackStart = 0, daysBackEnd = 30 } = await req.json();

    // Get boats to randomly select from if no boat specified
    const boats = await base44.entities.BoatInventory.list();
    if (!boats || boats.length === 0) {
      return Response.json({ error: 'No boats found' }, { status: 400 });
    }

    const selectedBoat = boatName
      ? boats.find(b => b.name === boatName)
      : boats[Math.floor(Math.random() * boats.length)];

    if (!selectedBoat) {
      return Response.json({ error: 'Boat not found' }, { status: 400 });
    }

    const experiences = ['half_day_fishing', 'full_day_fishing', 'snorkeling', 'coastal_leisure'];
    const locations = selectedBoat.location || 'ixtapa_zihuatanejo';
    const timeSlots = ['6:00 AM', '7:00 AM', '2:00 PM', '4:00 PM'];
    const createdBookings = [];

    for (let i = 0; i < count; i++) {
      // Random date between daysBackStart and daysBackEnd
      const daysAgo = Math.floor(Math.random() * (daysBackEnd - daysBackStart)) + daysBackStart;
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() - daysAgo);
      const dateStr = bookingDate.toISOString().split('T')[0];

      // Generate realistic fake data
      const guests = Math.floor(Math.random() * 4) + 2; // 2-5 guests
      const experience = experiences[Math.floor(Math.random() * experiences.length)];
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const basePrice = experience === 'half_day_fishing' ? 2500 : experience === 'full_day_fishing' ? 4500 : 3000;
      const totalPrice = basePrice + (guests > 2 ? (guests - 2) * 800 : 0);
      
      // Create booking
      const booking = await base44.entities.Booking.create({
        location: locations,
        experience_type: experience,
        date: dateStr,
        time_slot: timeSlot,
        guests,
        guest_name: `Practice Guest ${i + 1}`,
        guest_email: `practice${i + 1}@test.local`,
        guest_phone: '+525551234567',
        boat_name: selectedBoat.name,
        total_price: totalPrice,
        deposit_paid: Math.round(totalPrice * 0.4),
        payment_status: 'payment_done',
        remaining_payment_status: 'collected_on_site',
        status: Math.random() > 0.2 ? 'completed' : 'confirmed',
        confirmation_code: `PRACTICE${Date.now()}${i}`,
        engine_hours_used: Math.floor(Math.random() * 8) + 2,
      });

      // Create corresponding expense record
      const fuelCost = Math.floor(Math.random() * 1500) + 500;
      const crewCost = Math.floor(Math.random() * 2000) + 1000;
      const maintenanceCost = Math.floor(Math.random() * 800);
      const cleaningCost = 300;
      const suppliesCost = Math.floor(Math.random() * 500);
      const otherCost = Math.floor(Math.random() * 200);

      await base44.entities.BookingExpense.create({
        booking_id: booking.id,
        fuel_cost: fuelCost,
        crew_cost: crewCost,
        maintenance_cost: maintenanceCost,
        cleaning_cost: cleaningCost,
        supplies_cost: suppliesCost,
        other_cost: otherCost,
        notes: '[PRACTICE DATA] Auto-generated for testing financial dashboard',
      });

      createdBookings.push(booking);
    }

    return Response.json({
      success: true,
      count: createdBookings.length,
      boatName: selectedBoat.name,
      message: `Created ${createdBookings.length} practice booking${createdBookings.length > 1 ? 's' : ''} with expenses`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});