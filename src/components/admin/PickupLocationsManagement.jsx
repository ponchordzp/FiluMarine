import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, MapPin, Ship } from 'lucide-react';

const LOCATIONS = [
  { value: 'ixtapa_zihuatanejo', label: 'Ixtapa-Zihuatanejo' },
  { value: 'acapulco', label: 'Acapulco' },
  { value: 'cancun', label: 'Cancún' },
];

const emptyForm = { name: '', address: '', location: 'ixtapa_zihuatanejo', applicable_boats: [], notes: '', visible: true, sort_order: 0 };

export default function PickupLocationsManagement({ locationFilter: externalLocationFilter }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setIsSuperAdmin(user?.role === 'superadmin');
    };
    fetchUser();
  }, []);
  const { data: pickupLocations = [] } = useQuery({
    queryKey: ['pickup-locations'],
    queryFn: () => base44.entities.PickupLocation.list('sort_order'),
  });

  const { data: boats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const { data: pickupLocations = [] } = useQuery({
    queryKey: ['pickup-locations'],
    queryFn: () => base44.entities.PickupLocation.list('sort_order'),
  });

  const { data: boats = [] } = useQuery({
    queryKey: ['all-boats'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const isChartOperator = currentUser?.role === 'charter_operator';
  const isUserRestricted = currentUser && !isSuperAdmin && currentUser.operator;
  const userLocation = isUserRestricted ? (() => {
    const userBoats = boats.filter(b => (b.operator || '').toLowerCase() === (currentUser.operator || '').toLowerCase());
    if (userBoats.length > 0) {
      const uniqueLocs = [...new Set(userBoats.map(b => b.location))];
      return uniqueLocs.length === 1 ? uniqueLocs[0] : null;
    }
    return null;
  })() : null;

  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  // Initialize locationFilter: charter operators ALWAYS use their location, others default to 'all'
  const [locationFilter, setLocationFilter] = useState(isChartOperator && userLocation ? userLocation : 'all');

  // Sync with global filter from admin panel
  const effectiveLocationFilter = isChartOperator && userLocation ? userLocation : (externalLocationFilter && externalLocationFilter !== 'all' ? externalLocationFilter : locationFilter);

  const boatNames = boats.filter(b => b.status !== 'inactive').map(b => b.name);

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.PickupLocation.update(editing.id, data)
      : base44.entities.PickupLocation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-locations'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PickupLocation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pickup-locations'] }),
  });

  const openEdit = (pl) => {
    setEditing(pl);
    setForm({
      name: pl.name,
      address: pl.address || '',
      location: pl.location,
      applicable_boats: pl.applicable_boats || [],
      notes: pl.notes || '',
      visible: pl.visible ?? true,
      sort_order: pl.sort_order ?? 0,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const toggleBoat = (name) => {
    setForm(f => ({
      ...f,
      applicable_boats: f.applicable_boats.includes(name)
        ? f.applicable_boats.filter(b => b !== name)
        : [...f.applicable_boats, name],
    }));
  };

  const filtered = pickupLocations.filter(p => {
    // Restrict by user location if needed
    if (isUserRestricted && userLocation && p.location !== userLocation) {
      return false;
    }
    if (effectiveLocationFilter && effectiveLocationFilter !== 'all') {
      return p.location === effectiveLocationFilter;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Pickup Locations</h2>
          <p className="text-sm text-white/50">Manage pickup points shown to guests during booking. Assign boats to control which boats offer each location.</p>
          {isUserRestricted && userLocation && <p className="text-xs text-cyan-300 mt-1">Restricted to: <strong>{LOCATIONS.find(l => l.value === userLocation)?.label}</strong></p>}
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4 mr-2" />Add Pickup Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit Pickup Location' : 'New Pickup Location'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Las Gatas Beach" />
              </div>
              <div>
                <Label>Destination *</Label>
                <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Address / Description</Label>
                <Input className="mt-1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Pier 4, Marina Ixtapa" />
              </div>
              <div>
                <Label className="mb-2 block">Applicable Boats <span className="text-white/40 font-normal text-xs">(empty = all boats)</span></Label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  {boatNames.length === 0 ? (
                    <p className="text-gray-400 text-sm col-span-2">No active boats found</p>
                  ) : boatNames.map(name => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                      <Checkbox
                        checked={form.applicable_boats.includes(name)}
                        onCheckedChange={() => toggleBoat(name)}
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Notes for crew / guests</Label>
                <Textarea className="mt-1" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional crew instructions..." />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input className="mt-1" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.visible} onCheckedChange={v => setForm(f => ({ ...f, visible: v }))} />
                <Label>Visible in booking flow</Label>
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      {!isUserRestricted && !isChartOperator && (
        <div className="flex items-center gap-3 mb-4">
          <Label className="text-white/50 text-xs">Filter by Destination:</Label>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-52 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Destinations</SelectItem>
              {LOCATIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No pickup locations yet. Add one to get started.</p>
          </div>
        ) : filtered.map(pl => (
          <div key={pl.id} className="flex items-start justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <MapPin className="h-4 w-4 text-teal-400" />
                <span className="font-semibold text-white">{pl.name}</span>
                {!pl.visible && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">Hidden</span>}
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(20,184,166,0.15)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.3)' }}>
                  {LOCATIONS.find(l => l.value === pl.location)?.label}
                </span>
              </div>
              {pl.address && <p className="text-sm text-white/50 ml-6">{pl.address}</p>}
              {pl.notes && <p className="text-xs text-white/30 ml-6 mt-1 italic">{pl.notes}</p>}
              <div className="flex flex-wrap gap-1 mt-2 ml-6">
                {pl.applicable_boats?.length > 0
                  ? pl.applicable_boats.map(b => (
                    <span key={b} className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(30,136,229,0.15)', color: '#60b4ff', border: '1px solid rgba(30,136,229,0.25)' }}>
                      <Ship className="h-2.5 w-2.5" />{b}
                    </span>
                  ))
                  : <span className="text-xs text-white/25">All boats</span>
                }
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="ghost" className="text-white/40 hover:text-white" onClick={() => openEdit(pl)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-400/50 hover:text-red-400"
                onClick={() => { if (window.confirm(`Delete "${pl.name}"?`)) deleteMutation.mutate(pl.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}