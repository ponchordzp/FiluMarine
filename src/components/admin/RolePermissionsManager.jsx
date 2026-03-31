import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Check, Shield, Building2, Anchor, Users, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PERMISSIONS_KEY = 'filu_role_permissions';
export const OPERATOR_FILTER_KEY = 'filu_operator_filter_access';

// All available tabs in the system
const ALL_TABS = [
  { value: 'bookings',            label: 'Bookings',            group: 'Reservations' },
  { value: 'booked-dates',        label: 'Booked Dates',        group: 'Reservations' },
  { value: 'blocked-dates',       label: 'Blocked Dates',       group: 'Reservations' },
  { value: 'dashboard',           label: 'Dashboard',           group: 'Reservations' },
  { value: 'boats',               label: 'Boat Inventory',      group: 'Fleet' },
  { value: 'maintenance-finance', label: 'Maint. Finance',      group: 'Fleet' },
  { value: 'mechanic',            label: 'Mechanic Portal',     group: 'Fleet' },
  { value: 'checklist-template',  label: 'Checklist Template',  group: 'Fleet' },
  { value: 'engine-databases',    label: 'Engine Databases',    group: 'Fleet' },
  { value: 'locations',           label: 'Locations',           group: 'Locations' },
  { value: 'expeditions',         label: 'Expeditions',         group: 'Locations' },
  { value: 'pickup-locations',    label: 'Pickup Locations',    group: 'Locations' },
  { value: 'extras',              label: 'Extras',              group: 'Locations' },
  { value: 'destinations',        label: 'Destinations',        group: 'Locations' },
  { value: 'operators',           label: 'Operators',           group: 'Management' },
  { value: 'join-applications',   label: 'Join Applications',   group: 'Management' },
  { value: 'users',               label: 'Users',               group: 'Management' },
  { value: 'customers',           label: 'Customers',           group: 'Management' },
];

const TAB_GROUPS = ['Reservations', 'Fleet', 'Locations', 'Management'];

const DEFAULT_PERMISSIONS = {
  superadmin: ALL_TABS.map((t) => t.value),
  operator_admin: ['bookings', 'booked-dates', 'blocked-dates', 'dashboard', 'boats', 'maintenance-finance', 'mechanic', 'engine-databases', 'locations', 'expeditions', 'pickup-locations', 'extras', 'destinations', 'users'],
  admin: ['bookings', 'booked-dates', 'blocked-dates', 'dashboard', 'boats', 'engine-databases'],
  crew: ['bookings', 'booked-dates', 'dashboard', 'boats', 'engine-databases']
};

const DEFAULT_OPERATOR_FILTER_ACCESS = {
  superadmin: true,
  operator_admin: true,
  admin: false,
  crew: false,
};

export function loadOperatorFilterAccess() {
  try {
    const raw = localStorage.getItem(OPERATOR_FILTER_KEY);
    if (raw) return { ...DEFAULT_OPERATOR_FILTER_ACCESS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_OPERATOR_FILTER_ACCESS };
}

function saveOperatorFilterAccess(access) {
  localStorage.setItem(OPERATOR_FILTER_KEY, JSON.stringify(access));
}

const BUILT_IN_ROLES = [
  { key: 'superadmin',    label: 'Super Admin',        icon: Shield,    color: 'bg-purple-100 text-purple-800', iconColor: 'text-purple-600', locked: true },
  { key: 'operator_admin', label: 'Operator Admin',   icon: Building2, color: 'bg-orange-100 text-orange-800', iconColor: 'text-orange-600', locked: false },
  { key: 'admin',         label: 'Admin (Boat Owner)', icon: Anchor,    color: 'bg-blue-100 text-blue-800',     iconColor: 'text-blue-600',   locked: false },
  { key: 'crew',          label: 'Crew',               icon: Users,     color: 'bg-emerald-100 text-emerald-800', iconColor: 'text-emerald-600', locked: false },
];

function loadPermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.superadmin = ALL_TABS.map((t) => t.value);
      return parsed;
    }
  } catch {}
  return { ...DEFAULT_PERMISSIONS };
}

function savePermissions(perms) {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
}

function loadCustomRoles() {
  try {
    const raw = localStorage.getItem('filu_custom_roles');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveCustomRoles(roles) {
  localStorage.setItem('filu_custom_roles', JSON.stringify(roles));
}

function RoleRow({ roleKey, roleLabel, icon: IconComponent, iconColor, colorClass, locked, permissions, onChange, onDelete, operatorFilterAccess, onToggleOperatorFilter }) {
  const [open, setOpen] = useState(false);
  const allowedTabs = permissions[roleKey] || [];
  const canFilter = operatorFilterAccess[roleKey] ?? false;

  const toggle = (tabValue) => {
    const current = permissions[roleKey] || [];
    const updated = current.includes(tabValue) ? current.filter((v) => v !== tabValue) : [...current, tabValue];
    onChange(roleKey, updated);
  };

  const toggleAll = (group) => {
    const groupTabs = ALL_TABS.filter((t) => t.group === group).map((t) => t.value);
    const current = permissions[roleKey] || [];
    const allOn = groupTabs.every((v) => current.includes(v));
    const updated = allOn
      ? current.filter((v) => !groupTabs.includes(v))
      : [...new Set([...current, ...groupTabs])];
    onChange(roleKey, updated);
  };

  const enabledCount = allowedTabs.length;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass ? colorClass.split(' ')[0] : 'bg-slate-100'}`}>
          {IconComponent && <IconComponent className={`h-3.5 w-3.5 ${iconColor}`} />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">{roleLabel}</p>
          <p className="text-xs text-slate-400">{enabledCount} / {ALL_TABS.length} tabs accessible</p>
        </div>

        {/* Operator Filter toggle */}
        <button
          type="button"
          disabled={locked}
          onClick={(e) => { e.stopPropagation(); if (!locked) onToggleOperatorFilter(roleKey); }}
          title="Toggle Operator Filter access"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            canFilter
              ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          } ${locked ? 'opacity-70 cursor-default' : 'cursor-pointer hover:opacity-80'}`}
        >
          <Filter className="h-3 w-3" />
          <span className="hidden sm:inline">Operator Filter</span>
        </button>

        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${enabledCount / ALL_TABS.length * 100}%` }} />
        </div>
        {!locked && onDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(roleKey); }} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {open ? <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-3">
          {locked && (
            <p className="text-xs text-slate-400 italic">Super Admin always has full access and cannot be restricted.</p>
          )}
          {/* Operator Filter info row */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
            <Filter className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-slate-600 flex-1">
              <span className="font-semibold">Filter by Operator:</span>{' '}
              {canFilter ? <span className="text-indigo-600 font-medium">Enabled — this role can see the operator filter bar</span> : <span className="text-slate-400">Disabled — operator filter hidden for this role</span>}
            </p>
          </div>
          {TAB_GROUPS.map((group) => {
            const groupTabs = ALL_TABS.filter((t) => t.group === group);
            const allGroupOn = groupTabs.every((t) => allowedTabs.includes(t.value));
            return (
              <div key={group}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{group}</p>
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => toggleAll(group)}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${allGroupOn ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {allGroupOn ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupTabs.map((tab) => {
                    const enabled = allowedTabs.includes(tab.value);
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        disabled={locked}
                        onClick={() => toggle(tab.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          enabled
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'} ${
                          locked ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
                      >
                        {enabled && <Check className="h-3 w-3 flex-shrink-0" />}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RolePermissionsManager() {
  const [permissions, setPermissions] = useState(loadPermissions);
  const [customRoles, setCustomRoles] = useState(loadCustomRoles);
  const [operatorFilterAccess, setOperatorFilterAccess] = useState(loadOperatorFilterAccess);
  const [newRoleName, setNewRoleName] = useState('');
  const [addingRole, setAddingRole] = useState(false);

  useEffect(() => {
    setPermissions(loadPermissions());
    setCustomRoles(loadCustomRoles());
    setOperatorFilterAccess(loadOperatorFilterAccess());
  }, []);

  const handleChange = (roleKey, tabs) => {
    const updated = { ...permissions, [roleKey]: tabs };
    savePermissions(updated);
    setPermissions(updated);
  };

  const handleToggleOperatorFilter = (roleKey) => {
    const updated = { ...operatorFilterAccess, [roleKey]: !operatorFilterAccess[roleKey] };
    saveOperatorFilterAccess(updated);
    setOperatorFilterAccess(updated);
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    const key = newRoleName.trim().toLowerCase().replace(/\s+/g, '_');
    const newRole = { key, label: newRoleName.trim(), icon: Users, iconColor: 'text-slate-600', color: 'bg-slate-100 text-slate-800', locked: false };
    const updatedRoles = [...customRoles, newRole];
    saveCustomRoles(updatedRoles);
    setCustomRoles(updatedRoles);
    handleChange(key, [...(permissions.crew || [])]);
    setNewRoleName('');
    setAddingRole(false);
  };

  const handleDeleteCustomRole = (key) => {
    if (!window.confirm('Remove this custom role?')) return;
    const updatedRoles = customRoles.filter((r) => r.key !== key);
    saveCustomRoles(updatedRoles);
    setCustomRoles(updatedRoles);
    const { [key]: _, ...rest } = permissions;
    savePermissions(rest);
    setPermissions(rest);
  };

  const allRoles = [...BUILT_IN_ROLES, ...customRoles];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-950 text-sm font-bold">Role Tab Permissions</p>
          <p className="text-blue-950 mt-0.5 text-xs">Configure tab access and operator filter visibility per role</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddingRole(true)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />New Role
        </Button>
      </div>

      <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-200">
        <Filter className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700">The <strong>Operator Filter</strong> badge on each role toggles whether that role can see the "Filter by Operator" bar. When enabled, users only see operators assigned to them.</p>
      </div>

      {addingRole && (
        <div className="flex gap-2 items-center p-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50">
          <Input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Role name (e.g., Finance)"
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRole(); if (e.key === 'Escape') setAddingRole(false); }}
          />
          <Button size="sm" onClick={handleAddRole} disabled={!newRoleName.trim()} className="h-8 bg-indigo-600 hover:bg-indigo-700">Add</Button>
          <Button size="sm" variant="outline" onClick={() => setAddingRole(false)} className="h-8">Cancel</Button>
        </div>
      )}

      <div className="space-y-2">
        {allRoles.map((role) => {
          const iconComponent = typeof role.icon === 'function' ? role.icon : Users;
          return (
            <RoleRow
              key={role.key}
              roleKey={role.key}
              roleLabel={role.label}
              icon={iconComponent}
              iconColor={role.iconColor}
              colorClass={role.color}
              locked={role.locked}
              permissions={permissions}
              onChange={handleChange}
              onDelete={role.locked ? null : handleDeleteCustomRole}
              operatorFilterAccess={operatorFilterAccess}
              onToggleOperatorFilter={handleToggleOperatorFilter}
            />
          );
          })}
          </div>
    </div>
  );
}