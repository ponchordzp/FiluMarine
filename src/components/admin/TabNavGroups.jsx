import React, { useState } from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Tab families:
 *  - Bookings      (blue)     — always visible
 *  - Operators     (indigo)   — parent of everything below (superadmin only)
 *    - Boat Inventory (amber) — parent: Mechanic Portal, Checklist Template
 *    - Locations     (teal)   — parent: Expeditions, Destinations
 *    - Users         (purple) — standalone
 */

const families = [
  {
    id: 'bookings',
    label: '📋 Reservations',
    color: 'rgba(30,136,229,0.18)',
    border: 'rgba(30,136,229,0.4)',
    textColor: '#93c5fd',
    adminOnly: false,
    tabs: [
      { value: 'bookings', label: '📋 Bookings' },
      { value: 'booked-dates', label: '📅 Booked Dates' },
      { value: 'blocked-dates', label: '🚫 Blocked Dates' },
      { value: 'dashboard', label: '📊 Dashboard' },
    ],
    children: [],
  },
  {
    id: 'operators',
    label: '🚢 Operators',
    color: 'rgba(99,102,241,0.18)',
    border: 'rgba(99,102,241,0.4)',
    textColor: '#a5b4fc',
    adminOnly: true,
    tabs: [
      { value: 'operators', label: '🚢 Operators' },
    ],
    children: [
      {
        id: 'boats-family',
        label: '⚓ Boat Inventory',
        color: 'rgba(245,158,11,0.15)',
        border: 'rgba(245,158,11,0.35)',
        textColor: '#fcd34d',
        tabs: [
          { value: 'boats', label: '⚓ Boat Inventory' },
          { value: 'mechanic', label: '🔧 Mechanic Portal' },
          { value: 'checklist-template', label: '✅ Checklist Template' },
        ],
      },
      {
        id: 'locations-family',
        label: '📍 Locations',
        color: 'rgba(20,184,166,0.15)',
        border: 'rgba(20,184,166,0.35)',
        textColor: '#5eead4',
        tabs: [
          { value: 'locations', label: '📍 Locations' },
          { value: 'expeditions', label: '🎣 Expeditions' },
          { value: 'destinations', label: '🗺️ Destinations' },
        ],
      },
      {
        id: 'users-family',
        label: '👥 Users',
        color: 'rgba(168,85,247,0.15)',
        border: 'rgba(168,85,247,0.35)',
        textColor: '#d8b4fe',
        tabs: [
          { value: 'users', label: '👥 Users' },
        ],
      },
    ],
  },
];

function FamilyGroup({ family, open, onToggle, indent = false }) {
  const hasChildren = family.children && family.children.length > 0;
  const [childOpen, setChildOpen] = useState({});

  const toggleChild = (id) => setChildOpen(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className={`flex flex-col gap-1.5 ${indent ? 'ml-4 pl-3 border-l-2' : ''}`}
      style={indent ? { borderColor: family.border } : {}}>

      {/* Family header button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:brightness-110 select-none"
        style={{ background: family.color, border: `1px solid ${family.border}`, color: family.textColor }}
      >
        {open
          ? <ChevronDown className="h-3 w-3 flex-shrink-0" />
          : <ChevronRight className="h-3 w-3 flex-shrink-0" />}
        {family.label}
      </button>

      {/* Tabs row + children when expanded */}
      {open && (
        <div className="flex flex-col gap-1.5">
          {/* Parent-level tabs */}
          <TabsList
            className="admin-tabs-list p-1 h-auto flex-wrap w-fit"
            style={{ background: family.color, border: `1px solid ${family.border}`, backdropFilter: 'blur(16px)' }}
          >
            {family.tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="font-medium text-xs">{t.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* Child families */}
          {hasChildren && family.children.map(child => (
            <FamilyGroup
              key={child.id}
              family={child}
              open={!!childOpen[child.id]}
              onToggle={() => toggleChild(child.id)}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TabNavGroups({ isSuperAdmin }) {
  const [open, setOpen] = useState({ bookings: true, operators: false });

  const toggle = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col gap-2">
      {families.filter(f => !f.adminOnly || isSuperAdmin).map(family => (
        <FamilyGroup
          key={family.id}
          family={family}
          open={!!open[family.id]}
          onToggle={() => toggle(family.id)}
        />
      ))}
    </div>
  );
}