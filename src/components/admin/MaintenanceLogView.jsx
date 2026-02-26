import React, { useState } from 'react';
import { Wrench, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const serviceTypeBadge = {
  minor:      'bg-blue-100 text-blue-800',
  major:      'bg-purple-100 text-purple-800',
  repair:     'bg-red-100 text-red-800',
  inspection: 'bg-slate-100 text-slate-700',
};

const emptyRecord = {
  date: '',
  engine_hours: '',
  service_type: 'minor',
  cost: '',
  mechanic_name: '',
  mechanic_phone: '',
  work_performed: '',
  notes: '',
};

export default function MaintenanceLogView({ boat }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newRecord, setNewRecord] = useState(emptyRecord);

  const records = [...(boat.maintenance_records || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);

  const updateMutation = useMutation({
    mutationFn: (updatedRecords) =>
      base44.entities.BoatInventory.update(boat.id, { ...boat, maintenance_records: updatedRecords }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boats'] }),
  });

  const handleAdd = () => {
    if (!newRecord.date || !newRecord.service_type) return;
    const updated = [
      ...records,
      {
        ...newRecord,
        engine_hours: parseFloat(newRecord.engine_hours) || 0,
        cost: parseFloat(newRecord.cost) || 0,
      },
    ];
    updateMutation.mutate(updated);
    setNewRecord(emptyRecord);
    setAddingNew(false);
  };

  const handleDelete = (idx) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    const updated = records.filter((_, i) => i !== idx);
    updateMutation.mutate(updated);
  };

  return (
    <div className="mt-3 pt-3 border-t">
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between gap-2 mb-2"
      >
        <h4 className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
          <Wrench className="h-3 w-3" />
          Maintenance Log
          {records.length > 0 && (
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {records.length}
            </span>
          )}
        </h4>
        {expanded ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>

      {expanded && (
        <>
          {/* Summary row */}
          {records.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div className="bg-slate-50 p-2 rounded text-center">
                <p className="text-slate-500" style={{ fontSize: '10px' }}>Records</p>
                <p className="font-bold text-sm">{records.length}</p>
              </div>
              <div className="bg-orange-50 p-2 rounded text-center">
                <p className="text-orange-600" style={{ fontSize: '10px' }}>Total Cost</p>
                <p className="font-bold text-sm text-orange-700">${totalCost.toLocaleString()}</p>
              </div>
            </div>
          )}

          {records.length === 0 && !addingNew && (
            <p className="text-center text-xs text-slate-400 py-3">No maintenance records yet.</p>
          )}

          {/* Records list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto mb-2">
            {records.map((record, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border text-xs">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-slate-800">
                      {record.date ? format(parseISO(record.date), 'MMM d, yyyy') : '—'}
                    </p>
                    <Badge className={`${serviceTypeBadge[record.service_type] || 'bg-slate-100 text-slate-700'} text-xs`}>
                      {record.service_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-green-700">${(record.cost || 0).toLocaleString()}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(idx)}
                      className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-slate-500"><strong>Engine hrs:</strong> {record.engine_hours}</p>
                {record.work_performed && <p className="text-slate-600 mt-0.5"><strong>Work:</strong> {record.work_performed}</p>}
                {record.mechanic_name && (
                  <p className="text-slate-500 mt-0.5">
                    <strong>Mechanic:</strong> {record.mechanic_name}
                    {record.mechanic_phone && ` (${record.mechanic_phone})`}
                  </p>
                )}
                {record.notes && <p className="text-slate-400 italic mt-0.5">{record.notes}</p>}
              </div>
            ))}
          </div>

          {/* Add new record form */}
          {addingNew ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-orange-800">New Maintenance Record</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date *</Label>
                  <Input type="date" value={newRecord.date} onChange={e => setNewRecord(p => ({ ...p, date: e.target.value }))} className="h-7 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Service Type *</Label>
                  <Select value={newRecord.service_type} onValueChange={v => setNewRecord(p => ({ ...p, service_type: v }))}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Engine Hours</Label>
                  <Input type="number" min="0" value={newRecord.engine_hours} onChange={e => setNewRecord(p => ({ ...p, engine_hours: e.target.value }))} className="h-7 text-xs" placeholder="e.g., 520" />
                </div>
                <div>
                  <Label className="text-xs">Cost (MXN)</Label>
                  <Input type="number" min="0" value={newRecord.cost} onChange={e => setNewRecord(p => ({ ...p, cost: e.target.value }))} className="h-7 text-xs" placeholder="e.g., 8000" />
                </div>
                <div>
                  <Label className="text-xs">Mechanic Name</Label>
                  <Input value={newRecord.mechanic_name} onChange={e => setNewRecord(p => ({ ...p, mechanic_name: e.target.value }))} className="h-7 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Mechanic Phone</Label>
                  <Input value={newRecord.mechanic_phone} onChange={e => setNewRecord(p => ({ ...p, mechanic_phone: e.target.value }))} className="h-7 text-xs" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Work Performed</Label>
                  <Input value={newRecord.work_performed} onChange={e => setNewRecord(p => ({ ...p, work_performed: e.target.value }))} className="h-7 text-xs" placeholder="e.g., Oil change, impeller replacement" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={newRecord.notes} onChange={e => setNewRecord(p => ({ ...p, notes: e.target.value }))} className="text-xs h-14 resize-none" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleAdd} disabled={!newRecord.date || updateMutation.isPending} className="h-7 text-xs bg-orange-600 hover:bg-orange-700">
                  {updateMutation.isPending ? 'Saving...' : 'Save Record'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setAddingNew(false); setNewRecord(emptyRecord); }} className="h-7 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingNew(true)}
              className="w-full h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Plus className="h-3 w-3 mr-1" /> Log Service Record
            </Button>
          )}
        </>
      )}
    </div>
  );
}