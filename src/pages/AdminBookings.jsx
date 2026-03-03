import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, Users, Mail, Phone, DollarSign, Ban, CheckCircle2, XCircle, Info, Plus, Trash2, Filter, ArrowLeft, Gauge, PenSquare, Unlock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import AdminAuth, { useAuth } from '@/components/AdminAuth';
import ExpenseDataEntry from '@/components/ExpenseDataEntry';
import BoatManagement from '@/components/admin/BoatManagement';
import DestinationManagement from '@/components/admin/DestinationManagement';
import ExpeditionManagement from '@/components/admin/ExpeditionManagement';
import LocationsManagement from '@/components/admin/LocationsManagement';
import UserManagement from '@/components/admin/UserManagement';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle2,
  cancelled: XCircle,
  completed: CheckCircle2,
};

function AdminBookingsInner() {
  const { currentUser, handleLogout } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const isCrew = currentUser?.role === 'crew';
  const assignedBoat = currentUser?.assigned_boat || '';

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [boatFilter, setBoatFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockDate, setBlockDate] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockBoat, setBlockBoat] = useState('both');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseBooking, setExpenseBooking] = useState(null);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState(null);

  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: () => base44.entities.BlockedDate.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  const blockDateMutation = useMutation({
    mutationFn: (data) => base44.entities.BlockedDate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      setBlockDate(null);
      setBlockReason('');
      setBlockBoat('both');
    },
  });

  const unblockDateMutation = useMutation({
    mutationFn: (id) => base44.entities.BlockedDate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      setUnlockDialogOpen(false);
      setSelectedBlockedDate(null);
    },
  });

  const partialUnblockMutation = useMutation({
    mutationFn: ({ id, newBoat }) => base44.entities.BlockedDate.update(id, { boat_name: newBoat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      setUnlockDialogOpen(false);
      setSelectedBlockedDate(null);
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setSelectedCalendarDate(null);
    },
  });

  const filteredBookings = bookings.filter(booking => {
    if (!isSuperAdmin && assignedBoat && booking.boat_name !== assignedBoat) return false;
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
    if (boatFilter !== 'all' && booking.boat_name !== boatFilter) return false;
    if (locationFilter !== 'all' && booking.location !== locationFilter) return false;

    if (dateRangeFilter !== 'all') {
      const bookingDate = new Date(booking.date);
      const now = new Date();
      const daysDiff = Math.floor((now - bookingDate) / (1000 * 60 * 60 * 24));
      if (dateRangeFilter === 'week' && daysDiff > 7) return false;
      if (dateRangeFilter === 'month' && daysDiff > 30) return false;
      if (dateRangeFilter === 'year' && daysDiff > 365) return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        booking.guest_name?.toLowerCase().includes(search) ||
        booking.guest_email?.toLowerCase().includes(search) ||
        booking.confirmation_code?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleStatusChange = (bookingId, newStatus) => {
    updateStatusMutation.mutate({ id: bookingId, status: newStatus });
  };

  const handleBlockDate = () => {
    if (!blockDate) return;
    blockDateMutation.mutate({
      date: format(blockDate, 'yyyy-MM-dd'),
      reason: blockReason || 'Blocked by admin',
      boat_name: blockBoat,
    });
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const roleBadge = isSuperAdmin
    ? { label: 'Super Admin', cls: 'bg-purple-500' }
    : isAdmin
    ? { label: 'Admin', cls: 'bg-blue-500' }
    : { label: 'Crew', cls: 'bg-emerald-500' };

  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0c2340] to-[#1e88e5] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${roleBadge.cls}`}>{roleBadge.label}</span>
              <span className="font-semibold text-white bg-white/20 px-3 py-1 rounded-full">
                {currentUser?.full_name || currentUser?.username}
              </span>
              <button onClick={handleLogout} className="text-white/70 hover:text-white text-sm underline">Logout</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Booking Management</h1>
              <p className="text-white/80">View and manage all customer bookings</p>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
              onClick={() => alert('Simulation mode activated - Generate test bookings for demo purposes')}
            >
              <Gauge className="h-4 w-4 mr-2" />
              Simulation Mode
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
                <p className="text-sm text-slate-500">Confirmed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                <p className="text-sm text-slate-500">Cancelled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="bg-white/95 backdrop-blur-sm border shadow-sm">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="booked-dates">Booked Dates</TabsTrigger>
              <TabsTrigger value="blocked-dates">Blocked Dates</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
            <TabsList className="bg-white/95 backdrop-blur-sm border shadow-sm">
              <TabsTrigger value="boats">Boat Inventory</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="destinations">Destinations</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="expeditions">Expeditions</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="locations">Locations</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="users" className="text-purple-700 font-semibold">Users</TabsTrigger>}
            </TabsList>
          </div>

          {/* ── BOOKINGS TAB ── */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-6 gap-4">
                  <div>
                    <Label>Search</Label>
                    <Input
                      placeholder="Name, email, code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
                        <SelectItem value="acapulco">Acapulco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Boat</Label>
                    <Select value={boatFilter} onValueChange={setBoatFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Boats</SelectItem>
                        <SelectItem value="FILU">FILU</SelectItem>
                        <SelectItem value="TYCOON">TYCOON</SelectItem>
                        <SelectItem value="Pirula">Pirula</SelectItem>
                        <SelectItem value="La Güera">La Güera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time Range</Label>
                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter('all');
                        setBoatFilter('all');
                        setLocationFilter('all');
                        setDateRangeFilter('all');
                        setSearchTerm('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <p className="text-slate-500">No bookings found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => {
                  const StatusIcon = statusIcons[booking.status];
                  return (
                    <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="bg-white/95 backdrop-blur-sm hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-lg text-slate-800">{booking.guest_name}</h3>
                                    <Badge className={statusColors[booking.status]}>
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {booking.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <p className="text-sm text-slate-500">
                                      Code: <span className="font-mono font-semibold">{booking.confirmation_code}</span>
                                    </p>
                                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                                      {booking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}
                                    </span>
                                    {booking.boat_name && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-[#1e88e5]/10 text-[#1e88e5] font-medium">
                                        {booking.boat_name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span><strong>Scheduled:</strong> {format(parseISO(booking.date), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Clock className="h-4 w-4" />
                                      <span><strong>Booked on:</strong> {format(parseISO(booking.created_date), 'MMM d, yyyy h:mm a')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Clock className="h-4 w-4" />
                                      <span><strong>Time:</strong> {booking.time_slot}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <Users className="h-4 w-4" />
                                      {booking.guests} guests
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                      <DollarSign className="h-4 w-4" />
                                      ${booking.total_price?.toLocaleString()} MXN
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                onClick={() => { setExpenseBooking(booking); setExpenseDialogOpen(true); }}
                              >
                                <PenSquare className="h-4 w-4 mr-2" />
                                Data Entry
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
                                    <Info className="h-4 w-4 mr-2" />
                                    Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Booking Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedBooking && (
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><Label className="text-slate-500">Guest Name</Label><p className="font-medium">{selectedBooking.guest_name}</p></div>
                                        <div><Label className="text-slate-500">Status</Label><div className="mt-1"><Badge className={statusColors[selectedBooking.status]}>{selectedBooking.status}</Badge></div></div>
                                        <div><Label className="text-slate-500">Email</Label><p className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" />{selectedBooking.guest_email}</p></div>
                                        <div><Label className="text-slate-500">Phone</Label><p className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" />{selectedBooking.guest_phone}</p></div>
                                        <div><Label className="text-slate-500">Location</Label><p className="font-medium">{selectedBooking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}</p></div>
                                        <div><Label className="text-slate-500">Experience</Label><p className="font-medium">{selectedBooking.experience_type?.replace(/_/g, ' ')}</p></div>
                                        <div><Label className="text-slate-500">Boat</Label><p className="font-medium">{selectedBooking.boat_name || 'N/A'}</p></div>
                                        <div><Label className="text-slate-500">Pickup Location</Label><p className="font-medium">{selectedBooking.pickup_location || 'N/A'}</p></div>
                                        <div><Label className="text-slate-500">Scheduled Date</Label><p className="font-medium">{format(parseISO(selectedBooking.date), 'EEEE, MMMM d, yyyy')}</p></div>
                                        <div><Label className="text-slate-500">Booking Created</Label><p className="font-medium">{format(parseISO(selectedBooking.created_date), 'MMM d, yyyy h:mm a')}</p></div>
                                        <div><Label className="text-slate-500">Time</Label><p className="font-medium">{selectedBooking.time_slot}</p></div>
                                        <div><Label className="text-slate-500">Guests</Label><p className="font-medium">{selectedBooking.guests}</p></div>
                                        <div><Label className="text-slate-500">Total Price</Label><p className="font-medium">${selectedBooking.total_price?.toLocaleString()} MXN</p></div>
                                        <div><Label className="text-slate-500">Deposit Paid</Label><p className="font-medium">${selectedBooking.deposit_paid?.toLocaleString()} MXN</p></div>
                                        <div><Label className="text-slate-500">Payment Method</Label><p className="font-medium">{selectedBooking.payment_method}</p></div>
                                      </div>
                                      {selectedBooking.payment_screenshot && (
                                        <div>
                                          <Label className="text-slate-500">Payment Screenshot</Label>
                                          <div className="mt-2">
                                            <a href={selectedBooking.payment_screenshot} target="_blank" rel="noopener noreferrer">
                                              <img src={selectedBooking.payment_screenshot} alt="Payment proof" className="w-full max-w-md h-48 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer" />
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                      {selectedBooking.add_ons?.length > 0 && (
                                        <div>
                                          <Label className="text-slate-500">Add-ons</Label>
                                          <ul className="mt-1 list-disc list-inside">
                                            {selectedBooking.add_ons.map((addon, i) => <li key={i} className="text-sm">{addon.replace(/_/g, ' ')}</li>)}
                                          </ul>
                                        </div>
                                      )}
                                      {selectedBooking.special_requests && (
                                        <div>
                                          <Label className="text-slate-500">Special Requests</Label>
                                          <p className="mt-1 text-sm bg-slate-50 p-3 rounded-lg">{selectedBooking.special_requests}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-slate-500 mb-2 block">Change Status</Label>
                                        <div className="flex gap-2 flex-wrap">
                                          {['pending','confirmed','completed','cancelled'].map(s => (
                                            <Button key={s} size="sm" variant={selectedBooking.status === s ? 'default' : 'outline'} onClick={() => handleStatusChange(selectedBooking.id, s)} className="capitalize">{s}</Button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Select value={booking.status} onValueChange={(value) => handleStatusChange(booking.id, value)}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => { if (window.confirm(`Delete booking ${booking.confirmation_code}? This cannot be undone.`)) deleteBookingMutation.mutate(booking.id); }}
                                disabled={deleteBookingMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* ── BOOKED DATES TAB ── */}
          <TabsContent value="booked-dates" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Booked Dates Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={setSelectedCalendarDate}
                    className="rounded-md border"
                    modifiers={{ booked: (date) => bookings.some(b => b.date === format(date, 'yyyy-MM-dd') && b.status !== 'cancelled') }}
                    modifiersStyles={{ booked: { backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 'bold' } }}
                  />
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">Legend:</p>
                    <p>🔵 Blue dates = Bookings exist</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{selectedCalendarDate ? `Bookings for ${format(selectedCalendarDate, 'MMM d, yyyy')}` : 'Select a Date'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {!selectedCalendarDate ? (
                      <p className="text-slate-500 text-center py-8">Select a date to view bookings</p>
                    ) : (() => {
                      const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
                      const dateBookings = bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
                      return dateBookings.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No bookings for this date</p>
                      ) : dateBookings.map((booking) => {
                        const StatusIcon = statusIcons[booking.status];
                        return (
                          <div key={booking.id} className="p-4 bg-slate-50 rounded-lg space-y-2 border-l-4 border-blue-500">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-slate-800">{booking.guest_name}</p>
                                  {booking.boat_name && (
                                    <span className="text-sm px-3 py-1 rounded-full bg-[#1e88e5] text-white font-semibold flex items-center gap-1">
                                      {booking.boat_name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-mono">{booking.confirmation_code}</p>
                              </div>
                              <Badge className={statusColors[booking.status]}>
                                <StatusIcon className="h-3 w-3 mr-1" />{booking.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1 text-slate-600"><CalendarIcon className="h-3 w-3" /><div><p className="text-xs text-slate-500">Scheduled:</p><p className="font-medium">{format(parseISO(booking.date), 'MMM d')}</p></div></div>
                              <div className="flex items-center gap-1 text-slate-600"><Clock className="h-3 w-3" /><div><p className="text-xs text-slate-500">Booked:</p><p className="font-medium">{format(parseISO(booking.created_date), 'MMM d')}</p></div></div>
                              <div className="flex items-center gap-1 text-slate-600"><Clock className="h-3 w-3" />{booking.time_slot}</div>
                              <div className="flex items-center gap-1 text-slate-600"><Users className="h-3 w-3" />{booking.guests} guests</div>
                            </div>
                            <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3 text-slate-400" /><span className="text-slate-600">{booking.guest_email}</span></div>
                            <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-slate-400" /><span className="text-slate-600">{booking.guest_phone}</span></div>
                            <div className="flex gap-2 mt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedBooking(booking)}>
                                    <Info className="h-3 w-3 mr-2" />Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
                                  {selectedBooking && (
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div><Label className="text-slate-500">Guest Name</Label><p className="font-medium">{selectedBooking.guest_name}</p></div>
                                        <div><Label className="text-slate-500">Status</Label><div className="mt-1"><Badge className={statusColors[selectedBooking.status]}>{selectedBooking.status}</Badge></div></div>
                                        <div><Label className="text-slate-500">Email</Label><p className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" />{selectedBooking.guest_email}</p></div>
                                        <div><Label className="text-slate-500">Phone</Label><p className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" />{selectedBooking.guest_phone}</p></div>
                                        <div><Label className="text-slate-500">Location</Label><p className="font-medium">{selectedBooking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}</p></div>
                                        <div><Label className="text-slate-500">Experience</Label><p className="font-medium">{selectedBooking.experience_type?.replace(/_/g, ' ')}</p></div>
                                        <div><Label className="text-slate-500">Boat</Label><p className="font-medium">{selectedBooking.boat_name || 'N/A'}</p></div>
                                        <div><Label className="text-slate-500">Pickup Location</Label><p className="font-medium">{selectedBooking.pickup_location || 'N/A'}</p></div>
                                        <div><Label className="text-slate-500">Date</Label><p className="font-medium">{format(new Date(selectedBooking.date), 'EEEE, MMMM d, yyyy')}</p></div>
                                        <div><Label className="text-slate-500">Time</Label><p className="font-medium">{selectedBooking.time_slot}</p></div>
                                        <div><Label className="text-slate-500">Guests</Label><p className="font-medium">{selectedBooking.guests}</p></div>
                                        <div><Label className="text-slate-500">Total Price</Label><p className="font-medium">${selectedBooking.total_price?.toLocaleString()} MXN</p></div>
                                        <div><Label className="text-slate-500">Deposit Paid</Label><p className="font-medium">${selectedBooking.deposit_paid?.toLocaleString()} MXN</p></div>
                                        <div><Label className="text-slate-500">Payment Method</Label><p className="font-medium">{selectedBooking.payment_method}</p></div>
                                      </div>
                                      {selectedBooking.payment_screenshot && (
                                        <div>
                                          <Label className="text-slate-500">Payment Screenshot</Label>
                                          <div className="mt-2"><a href={selectedBooking.payment_screenshot} target="_blank" rel="noopener noreferrer"><img src={selectedBooking.payment_screenshot} alt="Payment proof" className="w-full max-w-md h-48 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer" /></a></div>
                                        </div>
                                      )}
                                      {selectedBooking.add_ons?.length > 0 && (
                                        <div>
                                          <Label className="text-slate-500">Add-ons</Label>
                                          <ul className="mt-1 list-disc list-inside">{selectedBooking.add_ons.map((addon, i) => <li key={i} className="text-sm">{addon.replace(/_/g, ' ')}</li>)}</ul>
                                        </div>
                                      )}
                                      {selectedBooking.special_requests && (
                                        <div>
                                          <Label className="text-slate-500">Special Requests</Label>
                                          <p className="mt-1 text-sm bg-slate-50 p-3 rounded-lg">{selectedBooking.special_requests}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-slate-500 mb-2 block">Change Status</Label>
                                        <div className="flex gap-2 flex-wrap">
                                          {['pending','confirmed','completed','cancelled'].map(s => (
                                            <Button key={s} size="sm" variant={selectedBooking.status === s ? 'default' : 'outline'} onClick={() => handleStatusChange(selectedBooking.id, s)} className="capitalize">{s}</Button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => { if (window.confirm(`Delete booking ${booking.confirmation_code}? This action cannot be undone.`)) deleteBookingMutation.mutate(booking.id); }}
                                disabled={deleteBookingMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── DASHBOARD TAB ── */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">
                      {bookings.filter(b => b.date === format(new Date(), 'yyyy-MM-dd') && b.status !== 'cancelled').length}
                    </p>
                    <p className="text-sm text-slate-500">Trips Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {(() => {
                        const today = new Date();
                        const next30Days = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); });
                        return next30Days.filter(dateStr => !bookings.some(b => b.date === dateStr && b.status !== 'cancelled')).length;
                      })()}
                    </p>
                    <p className="text-sm text-slate-500">Available (Next 30 Days)</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {(() => {
                        const today = new Date();
                        const next30Days = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); });
                        return next30Days.filter(dateStr => bookings.some(b => b.date === dateStr && b.status !== 'cancelled')).length;
                      })()}
                    </p>
                    <p className="text-sm text-slate-500">Booked (Next 30 Days)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" />Calendar Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Calendar
                      mode="single"
                      className="rounded-md border w-full"
                      modifiers={{
                        today: (date) => format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
                        available: (date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const todayStr = format(new Date(), 'yyyy-MM-dd');
                          return !blockedDates.some(b => b.date === dateStr) && !bookings.some(b => b.date === dateStr && b.status !== 'cancelled') && date >= new Date() && dateStr !== todayStr;
                        },
                        booked: (date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          return bookings.some(b => b.date === dateStr && b.status !== 'cancelled') && !blockedDates.some(b => b.date === dateStr) && dateStr !== format(new Date(), 'yyyy-MM-dd');
                        },
                        blocked: (date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          return blockedDates.some(b => b.date === dateStr) && dateStr !== format(new Date(), 'yyyy-MM-dd');
                        },
                      }}
                      modifiersStyles={{
                        today: { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold', border: '2px solid #fbbf24' },
                        available: { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' },
                        booked: { backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 'bold' },
                        blocked: { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', textDecoration: 'line-through' },
                      }}
                    />
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-2">
                      <p className="font-semibold mb-2">Legend:</p>
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-yellow-100 border-2 border-yellow-400"></div><span>Today</span></div>
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-green-100 border border-green-300"></div><span>Available</span></div>
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-blue-100 border border-blue-300"></div><span>Booked</span></div>
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-red-100 border border-red-300"></div><span>Blocked</span></div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2"><Info className="h-4 w-4" />Smart Suggestions</h4>
                      {(() => {
                        const suggestions = [];
                        const weekendBookings = bookings.filter(b => { const d = new Date(b.date); return (d.getDay() === 0 || d.getDay() === 6) && b.status !== 'cancelled'; }).length;
                        if (weekendBookings > 5) suggestions.push({ type: 'success', text: 'High weekend demand! Consider premium pricing.' });
                        const today = new Date();
                        const next7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); });
                        const avail7 = next7.filter(ds => !blockedDates.some(b => b.date === ds) && !bookings.some(b => b.date === ds && b.status !== 'cancelled')).length;
                        if (avail7 > 5) suggestions.push({ type: 'warning', text: `${avail7} days available in next week. Consider promotional campaigns.` });
                        if (blockedDates.length > 10) suggestions.push({ type: 'info', text: 'Multiple dates blocked. Review if all are still necessary.' });
                        return suggestions.length > 0 ? suggestions.map((s, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${s.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : s.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                            <p className="text-sm">{s.text}</p>
                          </div>
                        )) : <p className="text-sm text-slate-500 italic">No suggestions at this time</p>;
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-yellow-600" />Trips Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {(() => {
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'cancelled');
                        return todayBookings.length === 0 ? (
                          <div className="text-center py-8">
                            <CalendarIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500">No trips today</p>
                          </div>
                        ) : todayBookings.map((booking) => {
                          const StatusIcon = statusIcons[booking.status];
                          return (
                            <div key={booking.id} className="p-4 bg-yellow-50 rounded-lg space-y-2 border-l-4 border-yellow-500">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-slate-800">{booking.guest_name}</p>
                                    {booking.boat_name && <span className="text-sm px-3 py-1 rounded-full bg-[#1e88e5] text-white font-semibold">{booking.boat_name}</span>}
                                  </div>
                                  <p className="text-xs text-slate-500 font-mono">{booking.confirmation_code}</p>
                                </div>
                                <Badge className={statusColors[booking.status]}><StatusIcon className="h-3 w-3 mr-1" />{booking.status}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-1 text-slate-600"><Clock className="h-3 w-3" />{booking.time_slot}</div>
                                <div className="flex items-center gap-1 text-slate-600"><Users className="h-3 w-3" />{booking.guests} guests</div>
                              </div>
                              <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-slate-400" /><span className="text-slate-600">{booking.guest_phone}</span></div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6"></div>
            </div>
          </TabsContent>

          {/* ── BLOCKED DATES TAB ── */}
          <TabsContent value="blocked-dates" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Block New Date</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={blockDate}
                      onSelect={setBlockDate}
                      className="rounded-md border w-full"
                      modifiers={{ blocked: (date) => blockedDates.some(b => b.date === format(date, 'yyyy-MM-dd')) }}
                      modifiersStyles={{ blocked: { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' } }}
                    />
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800">
                    <p className="font-medium mb-1">Note:</p>
                    <p>🔴 Red dates are already blocked</p>
                  </div>
                  <div>
                    <Label>Select Boat</Label>
                    <Select value={blockBoat} onValueChange={setBlockBoat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Both Boats</SelectItem>
                        <SelectItem value="FILU">FILU Only</SelectItem>
                        <SelectItem value="TYCOON">TYCOON Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reason (Optional)</Label>
                    <Textarea placeholder="e.g., Weather, maintenance, private event..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} rows={3} />
                  </div>
                  <Button onClick={handleBlockDate} disabled={!blockDate || blockDateMutation.isPending} className="w-full bg-red-600 hover:bg-red-700">
                    <Ban className="h-4 w-4 mr-2" />
                    {blockDateMutation.isPending ? 'Blocking...' : 'Block Date'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Blocked Dates ({blockedDates.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {blockedDates.length === 0 ? (
                      <div className="text-center py-12">
                        <Ban className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No blocked dates</p>
                        <p className="text-sm text-slate-400 mt-1">Use the form to block dates</p>
                      </div>
                    ) : (
                      blockedDates.sort((a, b) => new Date(a.date) - new Date(b.date)).map((blocked) => (
                        <div key={blocked.id} className="flex items-start justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:border-red-200 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
                              <p className="font-semibold text-slate-800 truncate">{format(parseISO(blocked.date), 'EEE, MMM d, yyyy')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={blocked.boat_name === 'both' ? 'bg-slate-600 text-white' : blocked.boat_name === 'FILU' ? 'bg-[#1e88e5] text-white' : 'bg-purple-600 text-white'}>
                                {blocked.boat_name || 'both'}
                              </Badge>
                            </div>
                            {blocked.reason && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{blocked.reason}</p>}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 ml-2 flex-shrink-0"
                            onClick={() => { setSelectedBlockedDate(blocked); setUnlockDialogOpen(true); }}
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── BOATS TAB ── */}
          <TabsContent value="boats" className="space-y-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <BoatManagement restrictToBoat={!isSuperAdmin ? assignedBoat : null} readOnlyMode={isCrew} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── DESTINATIONS TAB (SuperAdmin only) ── */}
          {isSuperAdmin && (
            <TabsContent value="destinations" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  <DestinationManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── EXPEDITIONS TAB (SuperAdmin only) ── */}
          {isSuperAdmin && (
            <TabsContent value="expeditions" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  <ExpeditionManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── LOCATIONS TAB (SuperAdmin only) ── */}
          {isSuperAdmin && (
            <TabsContent value="locations" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  <LocationsManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── USERS TAB (SuperAdmin only) ── */}
          {isSuperAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  <UserManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Bottom Edge */}
      <div className="h-1 bg-gradient-to-r from-[#0c2340] via-[#1e88e5] to-[#0c2340]"></div>

      {/* Expense Data Entry Dialog */}
      {expenseBooking && (
        <ExpenseDataEntry
          booking={expenseBooking}
          isOpen={expenseDialogOpen}
          onClose={() => { setExpenseDialogOpen(false); setExpenseBooking(null); }}
        />
      )}

      {/* Unlock Date Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              Unlock Date
            </DialogTitle>
          </DialogHeader>
          {selectedBlockedDate && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-slate-600" />
                  <p className="font-semibold text-slate-800">{format(parseISO(selectedBlockedDate.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-600">Currently blocked for:</p>
                  <Badge className={selectedBlockedDate.boat_name === 'both' ? 'bg-slate-600 text-white' : selectedBlockedDate.boat_name === 'FILU' ? 'bg-[#1e88e5] text-white' : 'bg-purple-600 text-white'}>
                    {selectedBlockedDate.boat_name || 'both'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Select unlock option:</p>
                {selectedBlockedDate.boat_name === 'both' ? (
                  <>
                    <Button variant="outline" className="w-full justify-start hover:bg-green-50 border-green-200" onClick={() => partialUnblockMutation.mutate({ id: selectedBlockedDate.id, newBoat: 'TYCOON' })} disabled={partialUnblockMutation.isPending}>
                      <Unlock className="h-4 w-4 mr-2 text-green-600" />Unlock FILU only (keep TYCOON blocked)
                    </Button>
                    <Button variant="outline" className="w-full justify-start hover:bg-green-50 border-green-200" onClick={() => partialUnblockMutation.mutate({ id: selectedBlockedDate.id, newBoat: 'FILU' })} disabled={partialUnblockMutation.isPending}>
                      <Unlock className="h-4 w-4 mr-2 text-green-600" />Unlock TYCOON only (keep FILU blocked)
                    </Button>
                  </>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    Only one boat is blocked. Use "Unlock Both Boats" below to fully unblock this date.
                  </div>
                )}
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => unblockDateMutation.mutate(selectedBlockedDate.id)} disabled={unblockDateMutation.isPending}>
                  <Unlock className="h-4 w-4 mr-2" />
                  {unblockDateMutation.isPending ? 'Unlocking...' : 'Unlock Both Boats'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminBookings() {
  return (
    <AdminAuth>
      <AdminBookingsInner />
    </AdminAuth>
  );
}