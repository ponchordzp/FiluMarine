import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadOperatorFilterAccess, DEFAULT_PERMISSIONS_EXPORT } from '@/components/admin/RolePermissionsManager';
import { loadUserFilterPerms } from '@/components/admin/UserFilterSelector';

const PERMISSIONS_KEY = 'filu_role_permissions';

function loadPermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Use DEFAULT_PERMISSIONS from RolePermissionsManager
  return { ...DEFAULT_PERMISSIONS_EXPORT };
}
import {
  CalendarDays, CalendarRange, Ban, BarChart2,
  Anchor, DollarSign, Wrench, CheckSquare, BookOpen,
  MapPin, Fish, Ship, Sparkles, Map,
  Users, UserSquare,
  Building2,
  ClipboardList, MailOpen, Handshake
} from 'lucide-react';

const families = [
  {
    id: 'bookings',
    label: 'Reservations',
    color: 'rgba(30,136,229,0.18)',
    border: 'rgba(30,136,229,0.4)',
    textColor: '#93c5fd',
    adminOnly: false,
    tabs: [
      { value: 'bookings',      label: 'Bookings',      Icon: ClipboardList },
      { value: 'booked-dates',  label: 'Booked Dates',  Icon: CalendarDays },
      { value: 'blocked-dates', label: 'Blocked Dates', Icon: Ban },
      { value: 'dashboard',     label: 'Dashboard',     Icon: BarChart2 },
    ],
  },
  {
    id: 'boats-family',
    label: 'Inventory',
    color: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.35)',
    textColor: '#fcd34d',
    adminOnly: true,
    tabs: [
      { value: 'boats',               label: 'Boat Inventory',     Icon: Anchor },
      { value: 'maintenance-finance', label: 'Maint. Finance',     Icon: DollarSign },
      { value: 'mechanic',            label: 'Mechanic Portal',    Icon: Wrench },
      { value: 'checklist-template',  label: 'Checklist Template', Icon: CheckSquare, superAdminOnly: true },
      { value: 'engine-databases',    label: 'Engine Databases',   Icon: BookOpen },
    ],
  },
  {
    id: 'locations-family',
    label: 'Locations',
    color: 'rgba(20,184,166,0.15)',
    border: 'rgba(20,184,166,0.35)',
    textColor: '#5eead4',
    adminOnly: true,
    tabs: [
      { value: 'locations',        label: 'Locations',         Icon: MapPin },
      { value: 'expeditions',      label: 'Expeditions',       Icon: Fish },
      { value: 'pickup-locations', label: 'Pickup Locations',  Icon: Ship },
      { value: 'extras',           label: 'Extras',            Icon: Sparkles },
      { value: 'destinations',     label: 'Destinations',      Icon: Map },
    ],
  },
  {
    id: 'users-family',
    label: 'Users',
    color: 'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.35)',
    textColor: '#d8b4fe',
    adminOnly: true,
    tabs: [
      { value: 'users',       label: 'Users',       Icon: Users },
      { value: 'affiliates',   label: 'Affiliates',  Icon: Handshake, superAdminOnly: true },
      { value: 'customers',    label: 'Customers',   Icon: UserSquare, superAdminOnly: true },
    ],
  },
  {
    id: 'operators',
    label: 'Operators',
    color: 'rgba(99,102,241,0.18)',
    border: 'rgba(99,102,241,0.4)',
    textColor: '#a5b4fc',
    adminOnly: true,
    superAdminOnly: true,
    tabs: [
      { value: 'operators',         label: 'Operators',         Icon: Building2 },
      { value: 'join-applications', label: 'Join Applications', Icon: MailOpen, superAdminOnly: true },
    ],
  },
];

function FamilyGroup({ family }) {
  return (
    <div className="flex items-center justify-between w-full rounded-lg overflow-hidden"
      style={{ background: family.color, border: `1px solid ${family.border}` }}
    >
      <span
        className="px-2.5 py-1.5 text-xs font-semibold select-none shrink-0"
        style={{ color: family.textColor }}
      >
        {family.label}
      </span>

      <TabsList
        className="admin-tabs-list p-1 h-auto flex-wrap w-fit rounded-none border-0 shadow-none"
        style={{ background: 'transparent', backdropFilter: 'blur(16px)' }}
      >
        {family.tabs.map(t => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="font-medium text-xs flex items-center gap-1.5"
            style={{
              textShadow: (t.value === 'bookings' || t.value === 'boats' || t.value === 'mechanic' || t.value === 'users' || t.value === 'operators')
                ? '0 0 10px rgba(147, 197, 253, 0.5)'
                : 'none'
            }}
          >
            <t.Icon className="h-3 w-3 shrink-0" />
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

function buildFamiliesForUser(currentUserRole) {
  const permissions = loadPermissions();
  const allowedTabs = permissions[currentUserRole] || [];
  const isSuperAdmin = currentUserRole === 'superadmin';
  
  return families
    .filter(f => {
      if (!f.adminOnly) return true;
      if (f.superAdminOnly) return isSuperAdmin;
      return true;
    })
    .map(family => {
      const filteredTabs = family.tabs.filter(t => {
        // Block any tab marked superAdminOnly unless user is superadmin
        if (t.superAdminOnly && !isSuperAdmin) return false;
        // For superadmin: always include (they have all tabs by default)
        if (isSuperAdmin) return true;
        // For other roles: only include if tab is in their allowed list
        return allowedTabs.includes(t.value);
      });
      return { ...family, tabs: filteredTabs };
    })
    .filter(family => family.tabs.length > 0);
}

import { useOperators } from '@/hooks/useOperators';

export default function TabNavGroups({ isSuperAdmin, isOperatorAdmin, currentUserOperator, currentUserRole, currentUserId, operatorFilter, onOperatorFilterChange, locationFilter, onLocationFilterChange }) {
  const filterPerms = currentUserId ? loadUserFilterPerms(currentUserId) : { allowed_operators: ['all'], allowed_locations: ['all'] };
  const allowedOperators = filterPerms.allowed_operators ?? ['all'];
  const allowedLocations = filterPerms.allowed_locations ?? ['all'];
  const { operators: allOperators } = useOperators();

  const { data: dbLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list('sort_order'),
  });

  const allLocationOptions = dbLocations.length > 0
    ? dbLocations.map(l => ({ id: l.location_id, label: l.name }))
    : [{ id: 'ixtapa_zihuatanejo', label: 'Ixtapa-Zihuatanejo' }, { id: 'acapulco', label: 'Acapulco' }, { id: 'cancun', label: 'Cancún' }];

  // Operators scoped by role
  const baseOperators = isSuperAdmin
    ? allOperators
    : currentUserOperator
      ? allOperators.filter(op => op.name.toLowerCase() === currentUserOperator.toLowerCase())
      : allOperators;

  // Apply per-user allowed_operators filter (SuperAdmin only perk)
  const displayOperators = isSuperAdmin && !allowedOperators.includes('all')
    ? baseOperators.filter(op => allowedOperators.includes(op.name))
    : baseOperators;

  // Apply per-operator locations
  let effectiveAllowedLocations = allowedLocations;
  const currentOpName = !isSuperAdmin ? currentUserOperator : (operatorFilter !== 'all' ? operatorFilter : null);

  if (currentOpName) {
    const opData = allOperators.find(op => (op.name || '').toLowerCase() === currentOpName.toLowerCase());
    if (opData && opData.locations && opData.locations.length > 0) {
      effectiveAllowedLocations = opData.locations;
    }
  }

  // Apply per-user allowed_locations filter
  const displayLocations = effectiveAllowedLocations.includes('all')
    ? allLocationOptions
    : allLocationOptions.filter(l => effectiveAllowedLocations.includes(l.id));

  // Auto-lock: if only 1 operator visible, always force it selected
  const singleOperatorLock = displayOperators.length === 1 ? displayOperators[0].name : null;
  // Auto-lock: if only 1 location visible, always force it selected
  const singleLocationLock = displayLocations.length === 1 ? displayLocations[0].id : null;

  // Effective filter values (considering single-item lock)
  const effectiveOperatorFilter = singleOperatorLock ?? operatorFilter;
  const effectiveLocationFilter = singleLocationLock ?? locationFilter;

  // If locked, propagate up so parent state stays consistent
  React.useEffect(() => {
    if (singleOperatorLock && operatorFilter !== singleOperatorLock && onOperatorFilterChange) {
      onOperatorFilterChange(singleOperatorLock);
    }
  }, [singleOperatorLock]);

  React.useEffect(() => {
    if (singleLocationLock && locationFilter !== singleLocationLock && onLocationFilterChange) {
      onLocationFilterChange(singleLocationLock);
    }
  }, [singleLocationLock]);

  const visibleFamilies = buildFamiliesForUser(currentUserRole);

  // Show operator filter only if more than 1 option
  const showOperatorFilter = displayOperators.length > 1;
  // Show location filter only if more than 1 option
  const showLocationFilter = displayLocations.length > 1;

  return (
    <div className="flex flex-col gap-2 items-start">
      {visibleFamilies.map(family => (
        <FamilyGroup key={family.id} family={family} />
      ))}

      {showOperatorFilter && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/40 flex items-center gap-1">
            <Ship className="h-3 w-3" /> Filter by Operator:
          </span>
          <div className="flex gap-1 flex-wrap">
            {isSuperAdmin && (
              <button
                onClick={() => onOperatorFilterChange('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${effectiveOperatorFilter === 'all' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/10'}`}
              >
                All
              </button>
            )}
            {displayOperators.map(op => (
              <button
                key={op.id || op.name}
                onClick={() => isSuperAdmin ? onOperatorFilterChange(op.name) : undefined}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${effectiveOperatorFilter === op.name || (!isSuperAdmin && currentUserOperator?.toLowerCase() === op.name?.toLowerCase()) ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/10'} ${!isSuperAdmin ? 'cursor-default' : ''}`}
                style={(effectiveOperatorFilter === op.name || (!isSuperAdmin && currentUserOperator?.toLowerCase() === op.name?.toLowerCase())) ? { background: (op.color || '#f97316') + '55', border: `1px solid ${(op.color || '#f97316')}88` } : {}}
              >
                {op.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {onLocationFilterChange && showLocationFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Filter by Location:
          </span>
          <div className="flex gap-1 flex-wrap">
            {[{ id: 'all', label: 'All' }, ...displayLocations].map(loc => (
              <button
                key={loc.id}
                onClick={() => onLocationFilterChange(loc.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  effectiveLocationFilter === loc.id ? 'bg-teal-500/30 text-teal-200 border border-teal-500/40' : 'text-white/40 hover:text-white/70 hover:bg-white/10'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}