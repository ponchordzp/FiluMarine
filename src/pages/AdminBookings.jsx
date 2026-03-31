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
import { Calendar as CalendarIcon, Clock, Users, Mail, Phone, DollarSign, Ban, CheckCircle2, XCircle, Info, Trash2, Filter, ArrowLeft, Unlock, ChevronDown, TrendingUp, TrendingDown, CreditCard, BarChart2, Percent, LayoutGrid, Hourglass, Target, Circle } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import AdminAuth, { useAuth } from '@/components/AdminAuth';
import { loadOperatorFilterAccess } from '@/components/admin/RolePermissionsManager';
import ExpenseDataEntry from '@/components/ExpenseDataEntry';
import BoatManagement from '@/components/admin/BoatManagement';
import DestinationManagement from '@/components/admin/DestinationManagement';
import ExpeditionManagement from '@/components/admin/ExpeditionManagement';
import LocationsManagement from '@/components/admin/LocationsManagement';
import UserManagement from '@/components/admin/UserManagement';
import MechanicPortal from '@/components/admin/MechanicPortal';
import ChecklistTemplateEditor from '@/components/admin/ChecklistTemplateEditor';
import OperatorsDashboard from '@/components/admin/OperatorsDashboard';
import TabNavGroups from '@/components/admin/TabNavGroups';
import CustomersPanel from '@/components/admin/CustomersPanel';
import AdminBookingCard from '@/components/admin/AdminBookingCard';
import PickupLocationsManagement from '@/components/admin/PickupLocationsManagement';
import ExtrasManagement from '@/components/admin/ExtrasManagement';
import EngineDatabases from '@/components/admin/EngineDatabases';
import JoinFiluApplications from '@/components/admin/JoinFiluApplications';
import AffiliatesManagement from '@/components/admin/AffiliatesManagement';
import MaintenanceFinancialDashboard from '@/components/admin/MaintenanceFinancialDashboard';
import FinancialTrendChart from '@/components/admin/FinancialTrendChart';
import BookingTrendChart from '@/components/admin/BookingTrendChart';

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
  const isOperatorAdmin = currentUser?.role === 'operator_admin';
  const isAdmin = currentUser?.role === 'admin';
  const isCrew = currentUser?.role === 'crew';
  const assignedBoat = currentUser?.assigned_boat || '';
  const currentUserOperator = currentUser?.operator || '';
  // Operator admin has elevated access (like superadmin) but scoped to their operator
  const hasElevatedAccess = isSuperAdmin || isOperatorAdmin;

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [boatFilter, setBoatFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockDate, setBlockDate] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockBoat, setBlockBoat] = useState(isSuperAdmin ? 'both' : assignedBoat);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseBooking, setExpenseBooking] = useState(null);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState(null);
  const [globalOperatorFilter, setGlobalOperatorFilter] = useState('all');
  const [globalLocationFilter, setGlobalLocationFilter] = useState('all');
  // ALL non-superadmin roles are LOCKED to their assigned operator. Only superadmin can freely switch.
  const effectiveOperatorFilter = isSuperAdmin ? globalOperatorFilter : (currentUserOperator || 'all');
  const [financialTimeFilter, setFinancialTimeFilter] = useState('all');
  const [financialBoatFilter, setFinancialBoatFilter] = useState('all');
  const [bookingTimeFilter, setBookingTimeFilter] = useState('all');
  const [bookingBoatFilter, setBookingBoatFilter] = useState('all');
  const [customDateRangeFinancial, setCustomDateRangeFinancial] = useState({ from: null, to: null });
  const [customDateRangeBooking, setCustomDateRangeBooking] = useState({ from: null, to: null });
  const [showCustomDatePickerFinancial, setShowCustomDatePickerFinancial] = useState(false);
  const [showCustomDatePickerBooking, setShowCustomDatePickerBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');

  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: () => base44.entities.BlockedDate.list(),
  });

  const { data: allBoats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['booking-expenses'],
    queryFn: () => base44.entities.BookingExpense.list(),
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['operators'],
    queryFn: () => base44.entities.Operator.list('name'),
    staleTime: 0,
    refetchInterval: 1000,
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
      setBlockBoat(isSuperAdmin ? 'both' : assignedBoat);
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

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, payment_status }) => base44.entities.Booking.update(id, { payment_status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const updateRemainingPaymentMutation = useMutation({
    mutationFn: ({ id, remaining_payment_status }) => base44.entities.Booking.update(id, { remaining_payment_status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const updateRemainingMethodMutation = useMutation({
    mutationFn: ({ id, remaining_payment_method }) => base44.entities.Booking.update(id, { remaining_payment_method }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  // Compute operator-filtered boat names using effectiveOperatorFilter
  // SuperAdmin with 'all': no boat filter (see everything)
  // Any role with a specific operator selected: filter to that operator's boats
  // Non-elevated roles (admin/crew): always scope to their assigned boat
  const filteredOperatorBoats = effectiveOperatorFilter && effectiveOperatorFilter !== 'all'
    ? allBoats.filter(b => (b.operator || '').toLowerCase() === effectiveOperatorFilter.toLowerCase()).map(b => b.name)
    : isSuperAdmin ? null : null;

  const visibleBookings = (() => {
    let result = (isSuperAdmin || isOperatorAdmin)
      ? (filteredOperatorBoats !== null ? bookings.filter(b => filteredOperatorBoats.includes(b.boat_name)) : bookings)
      : filteredOperatorBoats !== null
      ? bookings.filter(b => filteredOperatorBoats.includes(b.boat_name))
      : bookings.filter(b => b.boat_name === assignedBoat);
    // Apply global location filter across ALL tabs
    if (globalLocationFilter && globalLocationFilter !== 'all') {
      result = result.filter(b => b.location === globalLocationFilter);
    }
    return result;
  })();

  const visibleBlocked = (isSuperAdmin || isOperatorAdmin)
    ? (filteredOperatorBoats !== null ? blockedDates.filter(b => b.boat_name === 'both' || filteredOperatorBoats.includes(b.boat_name)) : blockedDates)
    : filteredOperatorBoats !== null
    ? blockedDates.filter(b => b.boat_name === 'both' || filteredOperatorBoats.includes(b.boat_name))
    : blockedDates.filter(b => b.boat_name === 'both' || b.boat_name === assignedBoat);

  const filteredBookings = visibleBookings.filter(booking => {
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
    const boatToBlock = isSuperAdmin ? blockBoat : assignedBoat;
    blockDateMutation.mutate({
      date: format(blockDate, 'yyyy-MM-dd'),
      reason: blockReason || 'Blocked by admin',
      boat_name: boatToBlock,
    });
  };

  const getOperatorPaypal = (boatName) => {
    // 1. Check DB boat record first (synced from operator save)
    const boat = allBoats.find(b => b.name === boatName);
    if (boat?.paypal_username?.trim()) return boat.paypal_username.trim();

    // 2. Read from localStorage
    try {
      const raw = localStorage.getItem('filu_operators');
      if (!raw) return null;
      const ops = JSON.parse(raw);

      // Try to match by boat's operator field
      const boatOpName = (boat?.operator || '').toLowerCase().trim();

      let op = null;
      if (boatOpName && boatOpName !== 'filu') {
        op = ops.find(o => (o.name || '').toLowerCase().trim() === boatOpName);
      }

      // Default: find the FILU operator (covers most cases where boat.operator is not set)
      if (!op) {
        op = ops.find(o => (o.name || '').toLowerCase().trim() === 'filu') || ops[0];
      }
      // Migrate legacy username
      if (op?.paypal_username === 'ponchordzp') return 'filumarine';

      return op?.paypal_username?.trim() || null;
    } catch {
      return null;
    }
  };

  const [expandedRows, setExpandedRows] = useState({ financial: true, bookings: true });

  const toggleRowExpansion = (category) => {
    setExpandedRows(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Filter bookings/expenses for financial KPIs
  const financialFilteredBoats = financialBoatFilter === 'all'
    ? (filteredOperatorBoats !== null ? filteredOperatorBoats : allBoats.map(b => b.name))
    : [financialBoatFilter];

  const getTimeRange = (timeFilter, customRange) => {
    const now = new Date();
    
    switch (timeFilter) {
      case 'this-week': {
        const start = startOfWeek(now, { weekStartsOn: 0 });
        const end = endOfWeek(now, { weekStartsOn: 0 });
        return { start, end };
      }
      case 'last-week': {
        const lastWeekEnd = new Date(startOfWeek(now, { weekStartsOn: 0 }));
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const start = startOfWeek(lastWeekEnd, { weekStartsOn: 0 });
        const end = endOfWeek(lastWeekEnd, { weekStartsOn: 0 });
        return { start, end };
      }
      case 'last-month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const start = startOfMonth(firstDay);
        const end = endOfMonth(firstDay);
        return { start, end };
      }
      case 'last-3-months': {
        const start = subDays(startOfMonth(now), 90);
        return { start, end: now };
      }
      case 'this-year': {
        const start = startOfYear(now);
        return { start, end: now };
      }
      case 'custom': {
        return customRange.from && customRange.to ? { start: customRange.from, end: customRange.to } : null;
      }
      default:
        return null;
    }
  };

  const financialFilteredBookings = visibleBookings.filter(b => {
    if (financialBoatFilter !== 'all' && b.boat_name !== financialBoatFilter) return false;
    if (financialTimeFilter !== 'all') {
      const range = getTimeRange(financialTimeFilter, customDateRangeFinancial);
      if (!range) return true;
      const bookingDate = new Date(b.date);
      if (bookingDate < range.start || bookingDate > range.end) return false;
    }
    return true;
  });

  // Filter bookings for booking KPIs section
  const bookingFilteredBoats = bookingBoatFilter === 'all'
    ? (filteredOperatorBoats !== null ? filteredOperatorBoats : allBoats.map(b => b.name))
    : [bookingBoatFilter];

  const bookingFilteredBookings = visibleBookings.filter(b => {
    if (bookingBoatFilter !== 'all' && b.boat_name !== bookingBoatFilter) return false;
    if (bookingTimeFilter !== 'all') {
      const range = getTimeRange(bookingTimeFilter, customDateRangeBooking);
      if (!range) return true;
      const bookingDate = new Date(b.date);
      if (bookingDate < range.start || bookingDate > range.end) return false;
    }
    return true;
  });

  // Calculate booking stats using filtered data
  const bookingStats = {
    total: bookingFilteredBookings.length,
    pending: bookingFilteredBookings.filter(b => b.status === 'pending').length,
    confirmed: bookingFilteredBookings.filter(b => b.status === 'confirmed').length,
    completed: bookingFilteredBookings.filter(b => b.status === 'completed').length,
    cancelled: bookingFilteredBookings.filter(b => b.status === 'cancelled').length,
  };

  // Calculate visible expenses
  const visibleExpenses = expenses.filter(exp => {
    const booking = visibleBookings.find(b => b.id === exp.booking_id);
    return booking !== undefined;
  });

  const financialExpenses = expenses.filter(exp => {
    const booking = financialFilteredBookings.find(b => b.id === exp.booking_id);
    return booking !== undefined;
  });

  const getOperatorCommission = (boatName) => {
    try {
      if (!operators || operators.length === 0) return 0;
      const boat = allBoats.find(b => b.name === boatName);
      if (!boat) return 0;
      const boatOpName = (boat.operator || '').toLowerCase().trim();
      let op = null;
      if (boatOpName) {
        op = operators.find(o => (o.name || '').toLowerCase().trim() === boatOpName);
      }
      if (!op) {
        op = operators.find(o => (o.name || '').toLowerCase().trim() === 'filu');
      }
      const commission = op?.commission_pct !== undefined && op?.commission_pct !== null
        ? parseFloat(op.commission_pct)
        : 0;
      return commission;
    } catch (e) {
      console.error('Error calculating commission:', e);
      return 0;
    }
  };

  const stats = {
    // Booking KPIs
    total: visibleBookings.length,
    pending: visibleBookings.filter(b => b.status === 'pending').length,
    confirmed: visibleBookings.filter(b => b.status === 'confirmed').length,
    completed: visibleBookings.filter(b => b.status === 'completed').length,
    cancelled: visibleBookings.filter(b => b.status === 'cancelled').length,
    nextDaysBooked: (() => {
      const today = new Date();
      const next30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); });
      return next30.filter(ds => visibleBookings.some(b => b.date === ds && b.status !== 'cancelled')).length;
    })(),
    avgGuestSize: visibleBookings.length > 0 ? Math.round(visibleBookings.reduce((sum, b) => sum + (b.guests || 0), 0) / visibleBookings.length) : 0,
    confirmationRate: visibleBookings.length > 0 ? Math.round((visibleBookings.filter(b => b.status !== 'pending').length / visibleBookings.length) * 100) : 0,
    // Financial KPIs (filtered)
    revenue: financialFilteredBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.total_price || 0), 0),
    totalExpenses: financialExpenses.reduce((sum, e) => sum + ((e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0)), 0),
    fees: (() => {
      const activeBookings = financialFilteredBookings.filter(b => b.status !== 'cancelled');
      return activeBookings.reduce((sum, b) => sum + (b.total_price || 0) * getOperatorCommission(b.boat_name) / 100, 0);
    })(),
    netProfit: (() => {
      const activeBookings = financialFilteredBookings.filter(b => b.status !== 'cancelled');
      const rev = activeBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const exp = financialExpenses.reduce((sum, e) => sum + ((e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0)), 0);
      const commission = activeBookings.reduce((sum, b) => sum + (b.total_price || 0) * getOperatorCommission(b.boat_name) / 100, 0);
      return rev - exp - commission;
    })(),
    roi: (() => {
      const activeBookings = financialFilteredBookings.filter(b => b.status !== 'cancelled');
      const rev = activeBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      const exp = financialExpenses.reduce((sum, e) => sum + ((e.fuel_cost || 0) + (e.crew_cost || 0) + (e.maintenance_cost || 0) + (e.cleaning_cost || 0) + (e.supplies_cost || 0) + (e.other_cost || 0)), 0);
      const commission = activeBookings.reduce((sum, b) => sum + (b.total_price || 0) * getOperatorCommission(b.boat_name) / 100, 0);
      const profit = rev - exp - commission;
      return rev > 0 ? Math.min(100, Math.round((profit / rev) * 100)) : 0;
    })(),
  };

  // Helper function to get expenses for a booking
  const getBookingExpenses = (bookingId) => {
    const exp = expenses.find(e => e.booking_id === bookingId);
    if (!exp) return 0;
    return (exp.fuel_cost || 0) + (exp.crew_cost || 0) + (exp.maintenance_cost || 0) + (exp.cleaning_cost || 0) + (exp.supplies_cost || 0) + (exp.other_cost || 0);
  };

  // Helper function to calculate booking profit margin
  const getBookingProfitMargin = (booking) => {
    const revenue = booking.total_price || 0;
    const expenses = getBookingExpenses(booking.id);
    return revenue > 0 ? Math.min(100, Math.round(((revenue - expenses) / revenue) * 100)) : 0;
  };

  // Earnings = Revenue - Expenses - Commission
  const getBookingEarnings = (booking) => {
    const revenue = booking.total_price || 0;
    const exp = getBookingExpenses(booking.id);
    const commissionPct = getOperatorCommission(booking.boat_name);
    return revenue - exp - (revenue * commissionPct / 100);
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
    : isOperatorAdmin
    ? { label: 'Operator Admin', cls: 'bg-orange-500' }
    : isAdmin
    ? { label: 'Admin', cls: 'bg-blue-500' }
    : { label: 'Crew', cls: 'bg-emerald-500' };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060d14 0%, #0c1f30 50%, #060d14 100%)' }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Dark navy gradient — no bright blues at the end */}
        <div className="absolute inset-0" style={{ backgroundImage: 'url(https://media.base44.com/images/public/6987f0afff96227dd3af0e68/136c58332_FILUMarine2.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(5,13,26,0.82) 0%, rgba(9,26,48,0.75) 40%, rgba(13,36,68,0.82) 100%)' }} />
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #1565c0 30%, #1e88e5 60%, transparent 100%)' }} />

        <div className="relative max-w-7xl mx-auto px-6 py-8">
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
              <span className="font-medium text-white text-sm px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                {currentUser?.username}
              </span>
              <button onClick={handleLogout} className="text-white/50 hover:text-white text-sm transition-colors">Logout</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Nautical flags F-I-L-U — matching main page colors */}
                <div className="flex items-end gap-1">
                  {/* F - Foxtrot: White diamond on red */}
                  <div className="w-8 h-6 bg-red-600 relative flex items-center justify-center shadow-sm">
                    <div className="w-4 h-4 bg-white transform rotate-45"></div>
                  </div>
                  {/* I - India: Yellow circle on black */}
                  <div className="w-8 h-6 bg-black flex items-center justify-center shadow-sm">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                  </div>
                  {/* L - Lima: Yellow and black quarters */}
                  <div className="w-8 h-6 grid grid-cols-2 grid-rows-2 shadow-sm">
                    <div className="bg-yellow-400"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-yellow-400"></div>
                  </div>
                  {/* U - Uniform: Red and white quarters */}
                  <div className="w-8 h-6 grid grid-cols-2 grid-rows-2 shadow-sm">
                    <div className="bg-red-600"></div>
                    <div className="bg-white"></div>
                    <div className="bg-white"></div>
                    <div className="bg-red-600"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-0.5 tracking-tight drop-shadow-lg">FILU <span className="text-blue-200/70 font-light">Admin</span></h1>
                  <p className="text-blue-200/50 text-sm tracking-wide">Booking Management Portal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* Financial KPIs - Collapsible Row 1 */}
        <div className="mb-2 rounded-xl px-3 py-2" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', backdropFilter: 'blur(16px)' }}>
          <button onClick={() => toggleRowExpansion('financial')} className="w-full flex items-center justify-between hover:opacity-80 transition-opacity" style={{ marginBottom: expandedRows.financial ? '8px' : '0' }}>
            <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Financial</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-emerald-300/60 transition-transform ${expandedRows.financial ? '' : '-rotate-90'}`} />
          </button>
          {expandedRows.financial && (
            <>
              <div className="grid md:grid-cols-3 gap-2 mb-3">
                <div>
                  <Label className="text-emerald-200 text-xs font-semibold">Time Range</Label>
                  <Select value={financialTimeFilter} onValueChange={(val) => { setFinancialTimeFilter(val); if (val !== 'custom') setShowCustomDatePickerFinancial(false); }}>
                    <SelectTrigger className="mt-1 text-white text-xs" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this-week">This Week (Sun-Sun)</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {financialTimeFilter === 'custom' && (
                  <Dialog open={showCustomDatePickerFinancial} onOpenChange={setShowCustomDatePickerFinancial}>
                    <DialogTrigger asChild>
                      <Button className="mt-6 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 flex items-center gap-1.5" style={{ border: '1px solid rgba(59,130,246,0.25)' }}>
                      <CalendarIcon className="h-3.5 w-3.5" />{customDateRangeFinancial.from && customDateRangeFinancial.to ? `${format(customDateRangeFinancial.from, 'MMM d')} - ${format(customDateRangeFinancial.to, 'MMM d')}` : 'Select Dates'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Select Date Range</DialogTitle></DialogHeader>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-xs text-white/50 mb-2 block">From</Label>
                          <Calendar selected={customDateRangeFinancial.from} onSelect={(date) => setCustomDateRangeFinancial(prev => ({ ...prev, from: date }))} className="rounded-lg border-white/10 bg-black/40 text-white [&_.rdp-cell]:text-white [&_.rdp-head_cell]:text-white/70 [&_.rdp-button]:text-white hover:[&_.rdp-button]:bg-white/20 [&_.rdp-button_selected]:bg-blue-600" />
                        </div>
                        <div>
                          <Label className="text-xs text-white/50 mb-2 block">To</Label>
                          <Calendar selected={customDateRangeFinancial.to} onSelect={(date) => setCustomDateRangeFinancial(prev => ({ ...prev, to: date }))} className="rounded-lg border-white/10 bg-black/40 text-white [&_.rdp-cell]:text-white [&_.rdp-head_cell]:text-white/70 [&_.rdp-button]:text-white hover:[&_.rdp-button]:bg-white/20 [&_.rdp-button_selected]:bg-blue-600" />
                        </div>
                      </div>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCustomDatePickerFinancial(false)} disabled={!customDateRangeFinancial.from || !customDateRangeFinancial.to}>
                        Apply Range
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}
                <div>
                  <Label className="text-emerald-200 text-xs font-semibold">Boat</Label>
                  <Select value={financialBoatFilter} onValueChange={setFinancialBoatFilter}>
                    <SelectTrigger className="mt-1 text-white text-xs" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Boats</SelectItem>
                      {financialFilteredBoats.map(boat => (
                        <SelectItem key={boat} value={boat}>{boat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isSuperAdmin && (
                  <div>
                    <Label className="text-emerald-200 text-xs font-semibold">Operator</Label>
                    <Select value={globalOperatorFilter} onValueChange={setGlobalOperatorFilter}>
                      <SelectTrigger className="mt-1 text-white text-xs" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Operators</SelectItem>
                        {[...new Set(allBoats.map(b => b.operator?.trim() || 'FILU'))].map(op => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'Revenue', value: `$${(stats.revenue / 1000).toFixed(1)}k`, color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'text-emerald-300', sub: 'text-emerald-200', Icon: TrendingUp },
                  { label: 'Expenses', value: `$${(stats.totalExpenses / 1000).toFixed(1)}k`, color: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: 'text-red-300', sub: 'text-red-200', Icon: TrendingDown },
                  { label: 'Fees', value: `$${(stats.fees / 1000).toFixed(1)}k`, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300', sub: 'text-amber-200', Icon: CreditCard },
                  { label: 'Net Profit', value: `$${(stats.netProfit / 1000).toFixed(1)}k`, color: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: 'text-blue-300', sub: 'text-blue-200', Icon: BarChart2 },
                  { label: 'Margin', value: `${stats.roi}%`, color: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', text: 'text-purple-300', sub: 'text-purple-200', Icon: Percent },
                ].map(s => (
                  <div key={s.label} className="rounded-lg px-2 py-2 flex items-center justify-between gap-2 min-w-0" style={{ background: s.color, border: `1px solid ${s.border}` }}>
                    <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
                      <s.Icon className={`h-3.5 w-3.5 shrink-0 ${s.text}`} />
                      <p className={`text-[10px] ${s.sub} font-medium whitespace-nowrap`}>{s.label}</p>
                    </div>
                    <p className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-none ${s.text} relative flex-shrink-0`} style={{ 
                      textShadow: s.label === 'Revenue' ? '0 0 10px rgba(16,185,129,0.7)' :
                                 s.label === 'Expenses' ? '0 0 10px rgba(239,68,68,0.7)' :
                                 s.label === 'Fees' ? '0 0 10px rgba(245,158,11,0.7)' :
                                 s.label === 'Net Profit' ? '0 0 10px rgba(59,130,246,0.7)' :
                                 '0 0 10px rgba(168,85,247,0.7)'
                    }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <FinancialTrendChart
                financialFilteredBookings={financialFilteredBookings}
                financialExpenses={financialExpenses}
                getOperatorCommission={getOperatorCommission}
              />
            </>
          )}
        </div>

          {/* Booking KPIs - Collapsible Row 2 */}
          <div className="mb-6 rounded-xl px-3 py-2" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', backdropFilter: 'blur(16px)' }}>
            <button onClick={() => toggleRowExpansion('bookings')} className="w-full flex items-center justify-between hover:opacity-80 transition-opacity" style={{ marginBottom: expandedRows.bookings ? '8px' : '0' }}>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-blue-300" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Bookings</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-blue-300/60 transition-transform ${expandedRows.bookings ? '' : '-rotate-90'}`} />
            </button>
            {expandedRows.bookings && (
              <>
                <div className="grid md:grid-cols-3 gap-2 mb-3">
                  <div>
                    <Label className="text-blue-200 text-xs font-semibold">Time Range</Label>
                    <Select value={bookingTimeFilter} onValueChange={(val) => { setBookingTimeFilter(val); if (val !== 'custom') setShowCustomDatePickerBooking(false); }}>
                      <SelectTrigger className="mt-1 text-white text-xs" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="this-week">This Week (Sun-Sun)</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                        <SelectItem value="this-year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bookingTimeFilter === 'custom' && (
                    <Dialog open={showCustomDatePickerBooking} onOpenChange={setShowCustomDatePickerBooking}>
                      <DialogTrigger asChild>
                        <Button className="mt-6 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 flex items-center gap-1.5" style={{ border: '1px solid rgba(59,130,246,0.25)' }}>
                          <CalendarIcon className="h-3.5 w-3.5" />{customDateRangeBooking.from && customDateRangeBooking.to ? `${format(customDateRangeBooking.from, 'MMM d')} - ${format(customDateRangeBooking.to, 'MMM d')}` : 'Select Dates'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Select Date Range</DialogTitle></DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-xs text-white/50 mb-2 block">From</Label>
                            <Calendar selected={customDateRangeBooking.from} onSelect={(date) => setCustomDateRangeBooking(prev => ({ ...prev, from: date }))} className="rounded-lg border-white/10 bg-black/40 text-white [&_.rdp-cell]:text-white [&_.rdp-head_cell]:text-white/70 [&_.rdp-button]:text-white hover:[&_.rdp-button]:bg-white/20 [&_.rdp-button_selected]:bg-blue-600" />
                          </div>
                          <div>
                            <Label className="text-xs text-white/50 mb-2 block">To</Label>
                            <Calendar selected={customDateRangeBooking.to} onSelect={(date) => setCustomDateRangeBooking(prev => ({ ...prev, to: date }))} className="rounded-lg border-white/10 bg-black/40 text-white [&_.rdp-cell]:text-white [&_.rdp-head_cell]:text-white/70 [&_.rdp-button]:text-white hover:[&_.rdp-button]:bg-white/20 [&_.rdp-button_selected]:bg-blue-600" />
                          </div>
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCustomDatePickerBooking(false)} disabled={!customDateRangeBooking.from || !customDateRangeBooking.to}>
                          Apply Range
                        </Button>
                      </DialogContent>
                    </Dialog>
                  )}
                  <div>
                    <Label className="text-blue-200 text-xs font-semibold">Boat</Label>
                    <Select value={bookingBoatFilter} onValueChange={setBookingBoatFilter}>
                      <SelectTrigger className="mt-1 text-white text-xs" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Boats</SelectItem>
                        {bookingFilteredBoats.map(boat => (
                          <SelectItem key={boat} value={boat}>{boat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isSuperAdmin && (
                    <div>
                      <Label className="text-blue-200 text-xs font-semibold">Operator</Label>
                      <Select value={globalOperatorFilter} onValueChange={setGlobalOperatorFilter}>
                        <SelectTrigger className="mt-1 text-white text-xs" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Operators</SelectItem>
                          {[...new Set(allBoats.map(b => b.operator?.trim() || 'FILU'))].map(op => (
                            <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Total', value: bookingStats.total, color: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)', text: 'text-white', sub: 'text-white/80', Icon: LayoutGrid },
                    { label: 'Pending', value: bookingStats.pending, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300', sub: 'text-amber-200', Icon: Hourglass },
                    { label: 'Confirmed', value: bookingStats.confirmed, color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'text-emerald-300', sub: 'text-emerald-200', Icon: CheckCircle2 },
                    { label: 'Completed', value: bookingStats.completed, color: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: 'text-blue-300', sub: 'text-blue-200', Icon: Target },
                    { label: 'Cancelled', value: bookingStats.cancelled, color: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: 'text-red-300', sub: 'text-red-200', Icon: XCircle },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg px-2 py-2 flex items-center justify-between gap-2 min-w-0" style={{ background: s.color, border: `1px solid ${s.border}` }}>
                      <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
                        <s.Icon className={`h-3.5 w-3.5 shrink-0 ${s.text}`} />
                        <p className={`text-[10px] ${s.sub} font-medium whitespace-nowrap`}>{s.label}</p>
                      </div>
                      <p className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-none ${s.text} relative flex-shrink-0`} style={{ 
                        textShadow: s.label === 'Total' ? '0 0 10px rgba(255,255,255,0.5)' :
                                   s.label === 'Pending' ? '0 0 10px rgba(245,158,11,0.7)' :
                                   s.label === 'Confirmed' ? '0 0 10px rgba(16,185,129,0.7)' :
                                   s.label === 'Completed' ? '0 0 10px rgba(59,130,246,0.7)' :
                                   '0 0 10px rgba(239,68,68,0.7)'
                      }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <BookingTrendChart bookingFilteredBookings={bookingFilteredBookings} />
              </>
            )}
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabNavGroups isSuperAdmin={isSuperAdmin} isOperatorAdmin={isOperatorAdmin} currentUserOperator={currentUserOperator} currentUserRole={currentUser?.role} operatorFilter={effectiveOperatorFilter} onOperatorFilterChange={setGlobalOperatorFilter} locationFilter={globalLocationFilter} onLocationFilterChange={setGlobalLocationFilter} />

          {/* ── BOOKINGS TAB ── */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-blue-300" />
                <span className="text-sm font-medium text-blue-200 uppercase tracking-wider">Filters</span>
              </div>
              <div className="grid md:grid-cols-6 gap-3">
                <div>
                  <Label className="text-blue-200 text-xs font-semibold">Search</Label>
                  <Input
                    placeholder="Name, email, code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1 text-white placeholder:text-white/40 focus:border-blue-400/50"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
                  />
                </div>
                <div>
                  <Label className="text-blue-200 text-xs font-semibold">Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="mt-1 text-white" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="ixtapa_zihuatanejo">Ixtapa-Zihuatanejo</SelectItem>
                      <SelectItem value="acapulco">Acapulco</SelectItem>
                      <SelectItem value="cancun">Cancún</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-blue-200 text-xs font-semibold">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1 text-white" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><SelectValue /></SelectTrigger>
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
                  <Label className="text-blue-200 text-xs font-semibold">Boat</Label>
                  <Select value={boatFilter} onValueChange={setBoatFilter}>
                    <SelectTrigger className="mt-1 text-white" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Boats</SelectItem>
                      {(hasElevatedAccess ? (filteredOperatorBoats ? allBoats.filter(b => filteredOperatorBoats.includes(b.name)) : allBoats) : allBoats.filter(b => b.name === assignedBoat)).map(b => (
                        <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-blue-200 text-xs font-semibold">Time Range</Label>
                  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger className="mt-1 text-white" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}><SelectValue /></SelectTrigger>
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
                filteredBookings.map((booking) => (
                  <AdminBookingCard
                    key={booking.id}
                    booking={booking}
                    allBoats={allBoats}
                    expenses={expenses}
                    hasElevatedAccess={hasElevatedAccess}
                    getBookingExpenses={getBookingExpenses}
                    getBookingEarnings={getBookingEarnings}
                    getOperatorCommission={getOperatorCommission}
                    getOperatorPaypal={getOperatorPaypal}
                    updatePaymentStatusMutation={updatePaymentStatusMutation}
                    updateRemainingPaymentMutation={updateRemainingPaymentMutation}
                    updateRemainingMethodMutation={updateRemainingMethodMutation}
                    handleStatusChange={handleStatusChange}
                    deleteBookingMutation={deleteBookingMutation}
                    setExpenseBooking={setExpenseBooking}
                    setExpenseDialogOpen={setExpenseDialogOpen}
                  />
                ))
              )}
                            </div>
                            </TabsContent>

                            {/* ── BOOKED DATES TAB ── */}
                            <TabsContent value="booked-dates" className="space-y-6">
                            {/* visibleBookings computed inline via variable */}
                            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(30,136,229,0.08)', border: '1px solid rgba(30,136,229,0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-blue-300" />
                  <span className="text-sm font-medium text-blue-200">Booked Dates Calendar{!isSuperAdmin && assignedBoat ? ` — ${assignedBoat}` : ''}</span>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedCalendarDate}
                  onSelect={setSelectedCalendarDate}
                  className="rounded-xl border-white/10 bg-transparent text-white"
                  modifiers={{ booked: (date) => visibleBookings.some(b => b.date === format(date, 'yyyy-MM-dd') && b.status !== 'cancelled') }}
                  modifiersStyles={{ booked: { backgroundColor: 'rgba(30,136,229,0.35)', color: '#93c5fd', fontWeight: 'bold', borderRadius: '6px' } }}
                />
                <div className="mt-3 p-3 rounded-xl text-xs text-blue-300/70" style={{ background: 'rgba(30,136,229,0.1)', border: '1px solid rgba(30,136,229,0.2)' }}>
                  <span className="flex items-center gap-1.5"><Circle className="h-3 w-3 fill-blue-400 text-blue-400" />Highlighted dates have active bookings</span>
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-purple-300" />
                  <span className="text-sm font-medium text-purple-200">{selectedCalendarDate ? `Bookings for ${format(selectedCalendarDate, 'MMM d, yyyy')}` : 'Select a Date'}</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {!selectedCalendarDate ? (
                      <p className="text-white/30 text-center py-8 text-sm">Select a date to view bookings</p>
                    ) : (() => {
                      const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
                      const dateBookings = visibleBookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
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
                { label: 'Trips Today', value: visibleBookings.filter(b => b.date === format(new Date(), 'yyyy-MM-dd') && b.status !== 'cancelled').length, color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-300' },
                { label: 'Available (Next 30d)', value: (() => { const today = new Date(); const next30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); }); return next30.filter(ds => !visibleBlocked.some(b => b.date === ds) && !visibleBookings.some(b => b.date === ds && b.status !== 'cancelled')).length; })(), color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: 'text-emerald-300' },
                { label: 'Booked (Next 30d)', value: (() => { const today = new Date(); const next30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); }); return next30.filter(ds => visibleBookings.some(b => b.date === ds && b.status !== 'cancelled')).length; })(), color: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: 'text-blue-300' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: s.color, border: `1px solid ${s.border}`, backdropFilter: 'blur(16px)' }}>
                  <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
                  <p className="text-white/40 text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-medium text-emerald-200">Calendar Overview</span>
                </div>
                <Calendar
                  mode="single"
                  className="rounded-xl border-white/10 bg-transparent text-white w-full"
                  modifiers={{
                    today: (date) => format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
                    available: (date) => { const ds = format(date, 'yyyy-MM-dd'); const ts = format(new Date(), 'yyyy-MM-dd'); return !visibleBlocked.some(b => b.date === ds) && !visibleBookings.some(b => b.date === ds && b.status !== 'cancelled') && date >= new Date() && ds !== ts; },
                    booked: (date) => { const ds = format(date, 'yyyy-MM-dd'); return visibleBookings.some(b => b.date === ds && b.status !== 'cancelled') && !visibleBlocked.some(b => b.date === ds) && ds !== format(new Date(), 'yyyy-MM-dd'); },
                    blocked: (date) => { const ds = format(date, 'yyyy-MM-dd'); return visibleBlocked.some(b => b.date === ds) && ds !== format(new Date(), 'yyyy-MM-dd'); },
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
                  <p className="text-xs text-emerald-200 uppercase tracking-wider flex items-center gap-1 font-semibold"><Info className="h-3 w-3" /> Smart Suggestions</p>
                  {(() => {
                    const suggestions = [];
                    const weekendBookings = visibleBookings.filter(b => { const d = new Date(b.date); return (d.getDay() === 0 || d.getDay() === 6) && b.status !== 'cancelled'; }).length;
                    if (weekendBookings > 5) suggestions.push({ type: 'success', text: 'High weekend demand! Consider premium pricing.' });
                    const today = new Date();
                    const next7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return format(d, 'yyyy-MM-dd'); });
                    const avail7 = next7.filter(ds => !visibleBlocked.some(b => b.date === ds) && !visibleBookings.some(b => b.date === ds && b.status !== 'cancelled')).length;
                    if (avail7 > 5) suggestions.push({ type: 'warning', text: `${avail7} days available next week. Consider promotions.` });
                    if (blockedDates.length > 10) suggestions.push({ type: 'info', text: 'Many dates blocked. Review if all are still needed.' });
                    return suggestions.length > 0 ? suggestions.map((s, i) => (
                      <div key={i} className={`p-2.5 rounded-lg text-xs font-medium ${s.type === 'success' ? 'text-emerald-200' : s.type === 'warning' ? 'text-amber-200' : 'text-blue-200'}`} style={{ background: s.type === 'success' ? 'rgba(16,185,129,0.15)' : s.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${s.type === 'success' ? 'rgba(16,185,129,0.3)' : s.type === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                        {s.text}
                      </div>
                    )) : <p className="text-xs text-emerald-200/40 italic">No suggestions at this time</p>;
                  })()}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-300/80">Trips Today</span>
                </div>
                <div className="space-y-3 max-h-[480px] overflow-y-auto">
                  {(() => {
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    const todayBookings = visibleBookings.filter(b => b.date === todayStr && b.status !== 'cancelled');
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
          </TabsContent>

          {/* ── BLOCKED DATES TAB ── */}
          <TabsContent value="blocked-dates" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-300" />
                  <span className="text-sm font-medium text-red-200">Block New Date</span>
                </div>
                <Calendar
                  mode="single"
                  selected={blockDate}
                  onSelect={setBlockDate}
                  className="rounded-xl border-white/10 bg-transparent text-white w-full"
                  modifiers={{ blocked: (date) => visibleBlocked.some(b => b.date === format(date, 'yyyy-MM-dd')) }}
                  modifiersStyles={{ blocked: { backgroundColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', fontWeight: 'bold', borderRadius: '6px' } }}
                />
                <div className="p-2.5 rounded-lg text-xs text-red-300/70" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="flex items-center gap-1.5"><Circle className="h-3 w-3 fill-red-400 text-red-400" />Red dates are already blocked</span>
                </div>
                <div>
                  <Label className="text-red-200 text-xs font-semibold">Select Boat</Label>
                  {hasElevatedAccess ? (
                    <Select value={blockBoat} onValueChange={setBlockBoat}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {isSuperAdmin && <SelectItem value="both">All Boats</SelectItem>}
                        {(isSuperAdmin ? allBoats : allBoats.filter(b => (filteredOperatorBoats || []).includes(b.name))).map(boat => (
                          <SelectItem key={boat.id} value={boat.name}>{boat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 px-3 py-2 rounded-md text-sm text-white/70" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {assignedBoat || 'No boat assigned'}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-red-200 text-xs font-semibold">Reason (Optional)</Label>
                  <Textarea placeholder="e.g., Weather, maintenance, private event..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} rows={3} className="mt-1 text-white placeholder:text-white/40" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }} />
                </div>
                <Button onClick={handleBlockDate} disabled={!blockDate || blockDateMutation.isPending || (!hasElevatedAccess && !assignedBoat)} className="w-full bg-red-600/80 hover:bg-red-600 border-red-500/50 text-white" style={{ border: '1px solid rgba(239,68,68,0.4)' }}>
                  <Ban className="h-4 w-4 mr-2" />
                  {blockDateMutation.isPending ? 'Blocking...' : 'Block Date'}
                </Button>
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-purple-300" />
                  <span className="text-sm font-medium text-purple-200">Blocked Dates ({visibleBlocked.length}){!isSuperAdmin && assignedBoat ? ` — ${assignedBoat}` : ''}</span>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {visibleBlocked.length === 0 ? (
                    <div className="text-center py-12">
                      <Ban className="h-12 w-12 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">No blocked dates</p>
                    </div>
                  ) : (
                    visibleBlocked.sort((a, b) => new Date(a.date) - new Date(b.date)).map((blocked) => (
                      <div key={blocked.id} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                            <p className="font-semibold text-white text-sm truncate">{format(parseISO(blocked.date), 'EEE, MMM d, yyyy')}</p>
                          </div>
                          <Badge className={blocked.boat_name === 'both' ? 'bg-white/10 text-white/60 border border-white/15' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}>
                            {blocked.boat_name === 'both' ? 'All Boats' : blocked.boat_name}
                          </Badge>
                          {blocked.reason && <p className="text-xs text-white/30 mt-1.5 line-clamp-2">{blocked.reason}</p>}
                        </div>
                        {hasElevatedAccess && (
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 ml-2 flex-shrink-0"
                            style={{ border: '1px solid rgba(16,185,129,0.25)' }}
                            onClick={() => { setSelectedBlockedDate(blocked); setUnlockDialogOpen(true); }}
                          >
                            <Unlock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── MAINTENANCE FINANCE TAB ── */}
          <TabsContent value="maintenance-finance">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', backdropFilter: 'blur(16px)' }}>
              <MaintenanceFinancialDashboard operatorFilter={effectiveOperatorFilter} locationFilter={globalLocationFilter} />
            </div>
          </TabsContent>

          {/* ── BOATS TAB ── */}
          <TabsContent value="boats">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(16px)' }}>
              <BoatManagement restrictToBoat={!hasElevatedAccess ? assignedBoat : null} readOnlyMode={isCrew} isSuperAdmin={isSuperAdmin} operatorFilter={effectiveOperatorFilter} locationFilter={globalLocationFilter} />
            </div>
          </TabsContent>

          {(isSuperAdmin || isOperatorAdmin) && (
            <TabsContent value="destinations">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', backdropFilter: 'blur(16px)' }}>
                <DestinationManagement operatorFilter={isOperatorAdmin ? currentUserOperator : globalOperatorFilter} locationFilter={globalLocationFilter} />
              </div>
            </TabsContent>
          )}

          {(isSuperAdmin || isOperatorAdmin) && (
            <TabsContent value="expeditions">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', backdropFilter: 'blur(16px)' }}>
                <ExpeditionManagement operatorFilter={isOperatorAdmin ? currentUserOperator : globalOperatorFilter} locationFilter={globalLocationFilter} />
              </div>
            </TabsContent>
          )}

          {(isSuperAdmin || isOperatorAdmin) && (
            <TabsContent value="pickup-locations">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', backdropFilter: 'blur(16px)' }}>
                <PickupLocationsManagement locationFilter={globalLocationFilter} />
              </div>
            </TabsContent>
          )}

          {(isSuperAdmin || isOperatorAdmin) && (
            <TabsContent value="extras">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', backdropFilter: 'blur(16px)' }}>
                <ExtrasManagement allBoats={allBoats} />
              </div>
            </TabsContent>
          )}

          {(isSuperAdmin || isOperatorAdmin) && (
            <TabsContent value="locations">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', backdropFilter: 'blur(16px)' }}>
                <LocationsManagement operatorFilter={isOperatorAdmin ? currentUserOperator : globalOperatorFilter} />
              </div>
            </TabsContent>
          )}

          {(isSuperAdmin || isOperatorAdmin) && (
            <TabsContent value="mechanic">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', backdropFilter: 'blur(16px)' }}>
                <MechanicPortal currentUser={currentUser} operatorFilter={effectiveOperatorFilter} locationFilter={globalLocationFilter} />
              </div>
            </TabsContent>
          )}

          {(isSuperAdmin || isOperatorAdmin) && (
            <TabsContent value="users">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', backdropFilter: 'blur(16px)' }}>
                <UserManagement currentUser={currentUser} operatorFilter={effectiveOperatorFilter} />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="operators">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(16px)' }}>
                <OperatorsDashboard />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="affiliates">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', backdropFilter: 'blur(16px)' }}>
                <AffiliatesManagement locationFilter={globalLocationFilter} />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="customers">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', backdropFilter: 'blur(16px)' }}>
                <CustomersPanel />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="join-applications">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(16px)' }}>
                <JoinFiluApplications onNavigate={(tab) => setActiveTab(tab)} />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="checklist-template">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', backdropFilter: 'blur(16px)' }}>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-emerald-200 mb-1">Maintenance Checklist Template</h2>
                  <p className="text-sm text-emerald-200/70">Edit items, intervals, and add/remove fields globally for all boats by engine type.</p>
                </div>
                <ChecklistTemplateEditor operatorFilter={globalOperatorFilter} />
              </div>
            </TabsContent>
          )}

          <TabsContent value="engine-databases">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', backdropFilter: 'blur(16px)' }}>
              <EngineDatabases />
            </div>
          </TabsContent>
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