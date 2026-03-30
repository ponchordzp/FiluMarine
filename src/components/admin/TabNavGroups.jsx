import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadOperatorFilterAccess } from '@/components/admin/RolePermissionsManager';
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

function buildFamiliesForUser(isSuperAdmin, isOperatorAdmin) {
  return families
    .filter(f => {
      if (!f.adminOnly) return true;
      if (f.superAdminOnly) return isSuperAdmin;
      return isSuperAdmin || isOperatorAdmin;
    })
    .map(family => {
      if (isSuperAdmin) return family;
      return { ...family, tabs: family.tabs.filter(t => !t.superAdminOnly) };
    });
}

const OPERATOR_STORAGE_KEY = 'filu_operators';
function loadOperators() {
  try { const raw = localStorage.getItem(OPERATOR_STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return [{ id: 'filu', name: 'FILU', color: '#1e88e5' }];
}

export default function TabNavGroups({ isSuperAdmin, isOperatorAdmin, currentUserOperator, currentUserRole, operatorFilter, onOperatorFilterChange }) {
  const allOperators = loadOperators();
  // SuperAdmin sees all operators and can switch freely.
  // All other roles are locked to their assigned operator — show only that one.
  const operators = isSuperAdmin
    ? allOperators
    : currentUserOperator
      ? allOperators.filter(op => op.name.toLowerCase() === currentUserOperator.toLowerCase())
          .concat(allOperators.length === 0 ? [{ id: currentUserOperator, name: currentUserOperator, color: '#f97316' }] : [])
      : allOperators;
  const visibleFamilies = buildFamiliesForUser(isSuperAdmin, isOperatorAdmin);

  // If no match found in stored operators, create a placeholder
  const displayOperators = operators.length > 0
    ? operators
    : currentUserOperator
      ? [{ id: currentUserOperator, name: currentUserOperator, color: '#f97316' }]
      : allOperators;

  return (
    <div className="flex flex-col gap-2 items-start">
      {visibleFamilies.map(family => (
        <FamilyGroup key={family.id} family={family} />
      ))}

      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-white/40 flex items-center gap-1">
          <Ship className="h-3 w-3" /> Filter by Operator:
        </span>
        <div className="flex gap-1 flex-wrap">
          {isSuperAdmin && (
            <button
              onClick={() => onOperatorFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${operatorFilter === 'all' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/10'}`}
            >
              All
            </button>
          )}
          {displayOperators.map(op => (
            <button
              key={op.id || op.name}
              onClick={() => isSuperAdmin ? onOperatorFilterChange(op.name) : undefined}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${operatorFilter === op.name || (!isSuperAdmin && currentUserOperator?.toLowerCase() === op.name?.toLowerCase()) ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/10'} ${!isSuperAdmin ? 'cursor-default' : ''}`}
              style={(operatorFilter === op.name || (!isSuperAdmin && currentUserOperator?.toLowerCase() === op.name?.toLowerCase())) ? { background: (op.color || '#f97316') + '55', border: `1px solid ${(op.color || '#f97316')}88` } : {}}
            >
              {op.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}