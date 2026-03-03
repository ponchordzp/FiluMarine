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
import MechanicPortal from '@/components/admin/MechanicPortal';

const statusColors = {
  pending:   'bg-amber-400/20 text-amber-200 border border-amber-400/40',
  confirmed: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40',
  cancelled: 'bg-red-400/20 text-red-200 border border-red-400/40',
  completed: 'bg-blue-400/20 text-blue-200 border border-blue-400/40',
};

const statusBorderColor = {
  pending:   'border-l-amber-400',
  confirmed: 'border-l-emerald-400',
  cancelled: 'border-l-red-400',
  completed: 'border-l-blue-400',
};

const statusGlow = {
  pending:   'shadow-amber-500/10',
  confirmed: 'shadow-emerald-500/10',
  cancelled: 'shadow-red-500/10',
  completed: 'shadow-blue-500/10',
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
      <div className="min-h-screen bg-[#060d14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/10 border-t-[#1e88e5] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading bookings...</p>
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060d14 0%, #0c1f30 50%, #060d14 100%)' }}>
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #1e88e5 0%, transparent 70%)' }} />
        <div className="absolute top-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-6" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, rgba(12,35,64,0.95) 0%, rgba(30,136,229,0.6) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-5">
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full text-white ${roleBadge.cls}`}>{roleBadge.label}</span>
              <span className="font-medium text-white text-sm px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {currentUser?.full_name || currentUser?.username}
              </span>
              <button onClick={handleLogout} className="text-white/50 hover:text-white text-sm transition-colors">Logout</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="https://i.imgur.com/YourLogo.png" alt="FILU" className="h-10 hidden" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-tight" style={{ background: 'linear-gradient(135deg, #1e88e5 0%, #0c2340 100%)', border: '1px solid rgba(30,136,229,0.5)' }}>F</div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-0.5 tracking-tight">FILU <span className="text-white/50 font-light">Admin</span></h1>
                  <p className="text-white/40 text-sm">Booking Management Portal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)', text: 'text-white', sub: 'text-white/50' },
            { label: 'Pending', value: stats.pending, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300', sub: 'text-amber-400/70' },
            { label: 'Confirmed', value: stats.confirmed, color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'text-emerald-300', sub: 'text-emerald-400/70' },
            { label: 'Completed', value: stats.completed, color: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: 'text-blue-300', sub: 'text-blue-400/70' },
            { label: 'Cancelled', value: stats.cancelled, color: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: 'text-red-300', sub: 'text-red-400/70' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.color, border: `1px solid ${s.border}`, backdropFilter: 'blur(16px)' }}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className={`text-xs mt-1 ${s.sub}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="admin-tabs-list p-1 h-auto flex-wrap" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
              <TabsTrigger value="bookings" className="font-medium">Bookings</TabsTrigger>
              <TabsTrigger value="booked-dates" className="font-medium">Booked Dates</TabsTrigger>
              <TabsTrigger value="blocked-dates" className="font-medium">Blocked Dates</TabsTrigger>
              <TabsTrigger value="dashboard" className="font-medium">Dashboard</TabsTrigger>
            </TabsList>
            <TabsList className="admin-tabs-list p-1 h-auto flex-wrap" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
              <TabsTrigger value="boats" className="font-medium">Boat Inventory</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="destinations" className="font-medium">Destinations</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="expeditions" className="font-medium">Expeditions</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="locations" className="font-medium">Locations</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="mechanic" className="font-medium tab-mechanic">Mechanic Portal</TabsTrigger>}
              {isSuperAdmin && <TabsTrigger value="users" className="font-medium tab-users">Users</TabsTrigger>}
            </TabsList>
          </div>

          {/* ── BOOKINGS TAB ── */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-white/40" />
                <span className="text-sm font-medium text-white/60 uppercase tracking-wider">Filters</span>
              </div>
              <div className="grid md:grid-cols-6 gap-3">
                <div>
                  <Label className="text-white/50 text-xs">Search</Label>
                  <Input
                    placeholder="Name, email, code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#1e88e5]/50"
                  />
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
                      <SelectItem value="acapulco">Acapulco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
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
                  <Label className="text-white/50 text-xs">Boat</Label>
                  <Select value={boatFilter} onValueChange={setBoatFilter}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
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
                  <Label className="text-white/50 text-xs">Time Range</Label>
                  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <button
                    className="w-full px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-white/15"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}
                    onClick={() => { setStatusFilter('all'); setBoatFilter('all'); setLocationFilter('all'); setDateRangeFilter('all'); setSearchTerm(''); }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-white/40">No bookings found</p>
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const StatusIcon = statusIcons[booking.status];
                  return (
                    <motion.div key={booking.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                      <div
                        className={`rounded-2xl border-l-4 ${statusBorderColor[booking.status]} overflow-hidden`}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
                      >
                        <div className="p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="font-semibold text-base text-white">{booking.guest_name}</h3>
                                    <Badge className={statusColors[booking.status]}>
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                      {booking.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <p className="text-xs text-white/40">
                                      Code: <span className="font-mono text-white/60">{booking.confirmation_code}</span>
                                    </p>
                                    <span className="text-xs px-2 py-0.5 rounded-full text-white/50" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                      {booking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}
                                    </span>
                                    {booking.boat_name && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(30,136,229,0.2)', border: '1px solid rgba(30,136,229,0.35)', color: '#60b4ff' }}>
                                        {booking.boat_name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-white/50">
                                    <div className="flex items-center gap-1.5"><CalendarIcon className="h-3 w-3 text-[#1e88e5]/60" /><span>{format(parseISO(booking.date), 'MMM d, yyyy')}</span></div>
                                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-white/30" /><span>{booking.time_slot}</span></div>
                                    <div className="flex items-center gap-1.5"><Users className="h-3 w-3 text-white/30" /><span>{booking.guests} guests</span></div>
                                    <div className="flex items-center gap-1.5"><DollarSign className="h-3 w-3 text-emerald-400/60" /><span className="text-emerald-300/80 font-medium">${booking.total_price?.toLocaleString()} MXN</span></div>
                                    <div className="flex items-center gap-1.5 col-span-2"><Clock className="h-3 w-3 text-white/20" /><span className="text-white/30">Booked {format(parseISO(booking.created_date), 'MMM d, yyyy')}</span></div>
                                  </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/25"
                                style={{ border: '1px solid rgba(16,185,129,0.25)' }}
                                onClick={() => { setExpenseBooking(booking); setExpenseDialogOpen(true); }}
                              >
                                <PenSquare className="h-3 w-3 mr-1.5" />
                                Data Entry
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-blue-500/25" style={{ background: 'rgba(30,136,229,0.18)', border: '1px solid rgba(30,136,229,0.35)', color: 'rgb(147,197,253)' }} onClick={() => setSelectedBooking(booking)}>
                                    <Info className="h-3 w-3" />
                                    Details
                                  </button>
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
                                <SelectTrigger className="w-[130px] text-xs bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                                style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                onClick={() => { if (window.confirm(`Delete booking ${booking.confirmation_code}? This cannot be undone.`)) deleteBookingMutation.mutate(booking.id); }}
                                disabled={deleteBookingMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            </div>
                            </div>
                            </div>
                            </motion.div>
                            );
                            })
                            )}
                            </div>
                            </TabsContent>

                            {/* ── BOOKED DATES TAB ── */}
          <TabsContent value="booked-dates" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-[#1e88e5]" />
                  <span className="text-sm font-medium text-white/70">Booked Dates Calendar</span>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedCalendarDate}
                  onSelect={setSelectedCalendarDate}
                  className="rounded-xl border-white/10 bg-transparent text-white"
                  modifiers={{ booked: (date) => bookings.some(b => b.date === format(date, 'yyyy-MM-dd') && b.status !== 'cancelled') }}
                  modifiersStyles={{ booked: { backgroundColor: 'rgba(30,136,229,0.35)', color: '#93c5fd', fontWeight: 'bold', borderRadius: '6px' } }}
                />
                <div className="mt-3 p-3 rounded-xl text-xs text-blue-300/70" style={{ background: 'rgba(30,136,229,0.1)', border: '1px solid rgba(30,136,229,0.2)' }}>
                  🔵 Highlighted dates have active bookings
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-white/40" />
                  <span className="text-sm font-medium text-white/70">{selectedCalendarDate ? `Bookings for ${format(selectedCalendarDate, 'MMM d, yyyy')}` : 'Select a Date'}</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {!selectedCalendarDate ? (
                      <p className="text-white/30 text-center py-8 text-sm">Select a date to view bookings</p>
                    ) : (() => {
                      const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
                      const dateBookings = bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
                      return dateBookings.length === 0 ? (
                        <p className="text-white/30 text-center py-8 text-sm">No bookings for this date</p>
                      ) : dateBookings.map((booking) => {
                        const StatusIcon = statusIcons[booking.status];
                        return (
                          <div key={booking.id} className={`p-4 rounded-xl space-y-2 border-l-4 ${statusBorderColor[booking.status]}`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-white text-sm">{booking.guest_name}</p>
                                  {booking.boat_name && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(30,136,229,0.2)', border: '1px solid rgba(30,136,229,0.3)', color: '#60b4ff' }}>
                                      {booking.boat_name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/30 font-mono">{booking.confirmation_code}</p>
                              </div>
                              <Badge className={statusColors[booking.status]}>
                                <StatusIcon className="h-3 w-3 mr-1" />{booking.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                              <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.time_slot}</div>
                              <div className="flex items-center gap-1"><Users className="h-3 w-3" />{booking.guests} guests</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/40"><Mail className="h-3 w-3" />{booking.guest_email}</div>
                            <div className="flex items-center gap-2 text-xs text-white/40"><Phone className="h-3 w-3" />{booking.guest_phone}</div>
                            <div className="flex gap-2 mt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="flex-1 text-xs border-white/10 text-white/60 hover:text-white hover:bg-white/10" onClick={() => setSelectedBooking(booking)}>
                                    <Info className="h-3 w-3 mr-1.5" />Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
                                  {selectedBooking && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div><Label className="text-slate-500 text-xs">Guest Name</Label><p className="font-medium text-sm">{selectedBooking.guest_name}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Status</Label><div className="mt-1"><Badge className="bg-slate-100 text-slate-700">{selectedBooking.status}</Badge></div></div>
                                        <div><Label className="text-slate-500 text-xs">Email</Label><p className="font-medium text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{selectedBooking.guest_email}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Phone</Label><p className="font-medium text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{selectedBooking.guest_phone}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Location</Label><p className="font-medium text-sm">{selectedBooking.location === 'acapulco' ? 'Acapulco' : 'Ixtapa-Zihuatanejo'}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Experience</Label><p className="font-medium text-sm capitalize">{selectedBooking.experience_type?.replace(/_/g, ' ')}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Boat</Label><p className="font-medium text-sm">{selectedBooking.boat_name || 'N/A'}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Pickup</Label><p className="font-medium text-sm">{selectedBooking.pickup_location || 'N/A'}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Date</Label><p className="font-medium text-sm">{format(new Date(selectedBooking.date), 'EEE, MMM d, yyyy')}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Time</Label><p className="font-medium text-sm">{selectedBooking.time_slot}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Guests</Label><p className="font-medium text-sm">{selectedBooking.guests}</p></div>
                                        <div><Label className="text-slate-500 text-xs">Total Price</Label><p className="font-medium text-sm text-emerald-600">${selectedBooking.total_price?.toLocaleString()} MXN</p></div>
                                        <div><Label className="text-slate-500 text-xs">Deposit</Label><p className="font-medium text-sm">${selectedBooking.deposit_paid?.toLocaleString()} MXN</p></div>
                                        <div><Label className="text-slate-500 text-xs">Payment</Label><p className="font-medium text-sm capitalize">{selectedBooking.payment_method}</p></div>
                                      </div>
                                      {selectedBooking.payment_screenshot && (<div><Label className="text-slate-500 text-xs">Payment Screenshot</Label><div className="mt-2"><a href={selectedBooking.payment_screenshot} target="_blank" rel="noopener noreferrer"><img src={selectedBooking.payment_screenshot} alt="Payment proof" className="w-full max-w-md h-48 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer" /></a></div></div>)}
                                      {selectedBooking.add_ons?.length > 0 && (<div><Label className="text-slate-500 text-xs">Add-ons</Label><ul className="mt-1 list-disc list-inside">{selectedBooking.add_ons.map((addon, i) => <li key={i} className="text-sm">{addon.replace(/_/g, ' ')}</li>)}</ul></div>)}
                                      {selectedBooking.special_requests && (<div><Label className="text-slate-500 text-xs">Special Requests</Label><p className="mt-1 text-sm bg-slate-50 p-3 rounded-lg">{selectedBooking.special_requests}</p></div>)}
                                      <div>
                                        <Label className="text-slate-500 text-xs mb-2 block">Change Status</Label>
                                        <div className="flex gap-2 flex-wrap">
                                          {['pending','confirmed','completed','cancelled'].map(s => (
                                            <Button key={s} size="sm" variant={selectedBooking.status === s ? 'default' : 'outline'} onClick={() => handleStatusChange(selectedBooking.id, s)} className="capitalize text-xs">{s}</Button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                onClick={() => { if (window.confirm(`Delete booking ${booking.confirmation_code}?`)) deleteBookingMutation.mutate(booking.id); }}
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
              </div>
            </div>
          </TabsContent>

          {/* ── DASHBOARD TAB ── */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Trips Today', value: bookings.filter(b => b.date === format(new Date(), 'yyyy-MM-dd') && b.status !== 'cancelled').length, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300' },
                { label: 'Available (Next 30d)', value: (() => { const today = new Date(); const next30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); }); return next30.filter(ds => !bookings.some(b => b.date === ds && b.status !== 'cancelled')).length; })(), color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'text-emerald-300' },
                { label: 'Booked (Next 30d)', value: (() => { const today = new Date(); const next30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); }); return next30.filter(ds => bookings.some(b => b.date === ds && b.status !== 'cancelled')).length; })(), color: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: 'text-blue-300' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: s.color, border: `1px solid ${s.border}`, backdropFilter: 'blur(16px)' }}>
                  <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
                  <p className="text-white/40 text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[#1e88e5]" />
                    <span className="text-sm font-medium text-white/70">Calendar Overview</span>
                  </div>
                  <Calendar
                    mode="single"
                    className="rounded-xl border-white/10 bg-transparent text-white w-full"
                    modifiers={{
                      today: (date) => format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
                      available: (date) => { const ds = format(date, 'yyyy-MM-dd'); const ts = format(new Date(), 'yyyy-MM-dd'); return !blockedDates.some(b => b.date === ds) && !bookings.some(b => b.date === ds && b.status !== 'cancelled') && date >= new Date() && ds !== ts; },
                      booked: (date) => { const ds = format(date, 'yyyy-MM-dd'); return bookings.some(b => b.date === ds && b.status !== 'cancelled') && !blockedDates.some(b => b.date === ds) && ds !== format(new Date(), 'yyyy-MM-dd'); },
                      blocked: (date) => { const ds = format(date, 'yyyy-MM-dd'); return blockedDates.some(b => b.date === ds) && ds !== format(new Date(), 'yyyy-MM-dd'); },
                    }}
                    modifiersStyles={{
                      today: { backgroundColor: 'rgba(251,191,36,0.3)', color: '#fde68a', fontWeight: 'bold', border: '1px solid rgba(251,191,36,0.5)', borderRadius: '6px' },
                      available: { backgroundColor: 'rgba(16,185,129,0.25)', color: '#6ee7b7', fontWeight: 'bold', borderRadius: '6px' },
                      booked: { backgroundColor: 'rgba(30,136,229,0.3)', color: '#93c5fd', fontWeight: 'bold', borderRadius: '6px' },
                      blocked: { backgroundColor: 'rgba(239,68,68,0.25)', color: '#fca5a5', fontWeight: 'bold', textDecoration: 'line-through', borderRadius: '6px' },
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { color: 'rgba(251,191,36,0.3)', border: 'rgba(251,191,36,0.5)', label: 'Today' },
                      { color: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.3)', label: 'Available' },
                      { color: 'rgba(30,136,229,0.3)', border: 'rgba(30,136,229,0.3)', label: 'Booked' },
                      { color: 'rgba(239,68,68,0.25)', border: 'rgba(239,68,68,0.3)', label: 'Blocked' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ background: l.color, border: `1px solid ${l.border}` }} />
                        <span className="text-white/40">{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-1"><Info className="h-3 w-3" /> Smart Suggestions</p>
                    {(() => {
                      const suggestions = [];
                      const weekendBookings = bookings.filter(b => { const d = new Date(b.date); return (d.getDay() === 0 || d.getDay() === 6) && b.status !== 'cancelled'; }).length;
                      if (weekendBookings > 5) suggestions.push({ type: 'success', text: 'High weekend demand! Consider premium pricing.' });
                      const today = new Date();
                      const next7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); });
                      const avail7 = next7.filter(ds => !blockedDates.some(b => b.date === ds) && !bookings.some(b => b.date === ds && b.status !== 'cancelled')).length;
                      if (avail7 > 5) suggestions.push({ type: 'warning', text: `${avail7} days available next week. Consider promotions.` });
                      if (blockedDates.length > 10) suggestions.push({ type: 'info', text: 'Many dates blocked. Review if all are still needed.' });
                      return suggestions.length > 0 ? suggestions.map((s, i) => (
                        <div key={i} className={`p-2.5 rounded-lg text-xs ${s.type === 'success' ? 'text-emerald-300' : s.type === 'warning' ? 'text-amber-300' : 'text-blue-300'}`} style={{ background: s.type === 'success' ? 'rgba(16,185,129,0.1)' : s.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${s.type === 'success' ? 'rgba(16,185,129,0.2)' : s.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                          {s.text}
                        </div>
                      )) : <p className="text-xs text-white/25 italic">No suggestions at this time</p>;
                    })()}
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(16px)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300/80">Trips Today</span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {(() => {
                      const todayStr = format(new Date(), 'yyyy-MM-dd');
                      const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'cancelled');
                      return todayBookings.length === 0 ? (
                        <div className="text-center py-8">
                          <CalendarIcon className="h-10 w-10 text-amber-500/20 mx-auto mb-2" />
                          <p className="text-white/30 text-sm">No trips today</p>
                        </div>
                      ) : todayBookings.map((booking) => {
                        const StatusIcon = statusIcons[booking.status];
                        return (
                          <div key={booking.id} className="p-3 rounded-xl space-y-2 border-l-4 border-amber-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-semibold text-white text-sm">{booking.guest_name}</p>
                                  {booking.boat_name && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(30,136,229,0.25)', color: '#60b4ff' }}>{booking.boat_name}</span>}
                                </div>
                                <p className="text-xs text-white/30 font-mono">{booking.confirmation_code}</p>
                              </div>
                              <Badge className={statusColors[booking.status]}><StatusIcon className="h-3 w-3 mr-1" />{booking.status}</Badge>
                            </div>
                            <div className="flex gap-3 text-xs text-white/40">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.time_slot}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{booking.guests}</span>
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{booking.guest_phone}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              <div className="space-y-6"></div>
            </div>
          </TabsContent>

          {/* ── BLOCKED DATES TAB ── */}
          <TabsContent value="blocked-dates" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-300/80">Block New Date</span>
                </div>
                <Calendar
                  mode="single"
                  selected={blockDate}
                  onSelect={setBlockDate}
                  className="rounded-xl border-white/10 bg-transparent text-white w-full"
                  modifiers={{ blocked: (date) => blockedDates.some(b => b.date === format(date, 'yyyy-MM-dd')) }}
                  modifiersStyles={{ blocked: { backgroundColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', fontWeight: 'bold', borderRadius: '6px' } }}
                />
                <div className="p-2.5 rounded-lg text-xs text-red-300/70" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  🔴 Red dates are already blocked
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Select Boat</Label>
                  <Select value={blockBoat} onValueChange={setBlockBoat}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Boats</SelectItem>
                      <SelectItem value="FILU">FILU Only</SelectItem>
                      <SelectItem value="TYCOON">TYCOON Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Reason (Optional)</Label>
                  <Textarea placeholder="e.g., Weather, maintenance, private event..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} rows={3} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <Button onClick={handleBlockDate} disabled={!blockDate || blockDateMutation.isPending} className="w-full bg-red-600/80 hover:bg-red-600 border-red-500/50 text-white" style={{ border: '1px solid rgba(239,68,68,0.4)' }}>
                  <Ban className="h-4 w-4 mr-2" />
                  {blockDateMutation.isPending ? 'Blocking...' : 'Block Date'}
                </Button>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-white/70">Blocked Dates ({blockedDates.length})</span>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {blockedDates.length === 0 ? (
                    <div className="text-center py-12">
                      <Ban className="h-12 w-12 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">No blocked dates</p>
                    </div>
                  ) : (
                    blockedDates.sort((a, b) => new Date(a.date) - new Date(b.date)).map((blocked) => (
                      <div key={blocked.id} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                            <p className="font-semibold text-white text-sm truncate">{format(parseISO(blocked.date), 'EEE, MMM d, yyyy')}</p>
                          </div>
                          <Badge className={blocked.boat_name === 'both' ? 'bg-white/10 text-white/60 border border-white/15' : blocked.boat_name === 'FILU' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}>
                            {blocked.boat_name || 'both'}
                          </Badge>
                          {blocked.reason && <p className="text-xs text-white/30 mt-1.5 line-clamp-2">{blocked.reason}</p>}
                        </div>
                        <Button
                          size="sm"
                          className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 ml-2 flex-shrink-0"
                          style={{ border: '1px solid rgba(16,185,129,0.25)' }}
                          onClick={() => { setSelectedBlockedDate(blocked); setUnlockDialogOpen(true); }}
                        >
                          <Unlock className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── BOATS TAB ── */}
          <TabsContent value="boats">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
              <BoatManagement restrictToBoat={!isSuperAdmin ? assignedBoat : null} readOnlyMode={isCrew} />
            </div>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="destinations">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <DestinationManagement />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="expeditions">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <ExpeditionManagement />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="locations">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <LocationsManagement />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="mechanic">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <MechanicPortal currentUser={currentUser} />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="users">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
                <UserManagement />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <div className="h-px mt-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(30,136,229,0.5), transparent)' }} />

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