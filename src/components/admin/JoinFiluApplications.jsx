import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Ship, MapPin, Calendar, Eye, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const statusConfig = {
  pending:   { label: 'Pending',    cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  in_review: { label: 'In Review',  cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  approved:  { label: 'Approved',   cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  rejected:  { label: 'Rejected',   cls: 'bg-red-500/20 text-red-300 border border-red-500/30' },
};

export default function JoinFiluApplications() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['join-filu-applications'],
    queryFn: () => base44.entities.JoinFiluApplication.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JoinFiluApplication.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['join-filu-applications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JoinFiluApplication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-filu-applications'] });
      setSelected(null);
    },
  });

  const filtered = statusFilter === 'all' ? applications : applications.filter(a => a.review_status === statusFilter);

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.review_status === 'pending').length,
    in_review: applications.filter(a => a.review_status === 'in_review').length,
    approved: applications.filter(a => a.review_status === 'approved').length,
    rejected: applications.filter(a => a.review_status === 'rejected').length,
  };

  const openDetail = (app) => {
    setSelected(app);
    setReviewNotes(app.review_notes || '');
  };

  const saveReview = (id, status) => {
    updateMutation.mutate({ id, data: { review_status: status, review_notes: reviewNotes } });
    setSelected(prev => prev ? { ...prev, review_status: status, review_notes: reviewNotes } : prev);
  };

  if (isLoading) return <div className="text-white/40 text-center py-12">Loading applications...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Join FILU — Applications</h2>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'in_review', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/10'}`}
            >
              {s === 'all' ? 'All' : statusConfig[s]?.label} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Ship className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div
              key={app.id}
              className="rounded-xl p-4 flex items-start justify-between gap-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-white">{app.name}</p>
                  <Badge className={statusConfig[app.review_status]?.cls || statusConfig.pending.cls}>
                    {statusConfig[app.review_status]?.label || 'Pending'}
                  </Badge>
                  <span className="text-xs text-white/30">
                    {app.created_date ? format(parseISO(app.created_date), 'MMM d, yyyy') : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>
                  <span className="flex items-center gap-1"><Ship className="h-3 w-3" />{app.boat_name} — {app.boat_type}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.location}</span>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="text-xs shrink-0"
                    style={{ background: 'rgba(30,136,229,0.2)', border: '1px solid rgba(30,136,229,0.35)', color: '#93c5fd' }}
                    onClick={() => openDetail(app)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Ship className="h-5 w-5 text-blue-400" />
                      Application — {app.name}
                    </DialogTitle>
                  </DialogHeader>
                  {selected?.id === app.id && (
                    <div className="space-y-5">
                      {/* Applicant Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-slate-500 text-xs">Full Name</Label><p className="font-medium text-sm mt-0.5">{app.name}</p></div>
                        <div><Label className="text-slate-500 text-xs">Email</Label><p className="font-medium text-sm mt-0.5">{app.email}</p></div>
                        <div><Label className="text-slate-500 text-xs">Phone / WhatsApp</Label><p className="font-medium text-sm mt-0.5">{app.phone}</p></div>
                        <div><Label className="text-slate-500 text-xs">Submitted</Label><p className="font-medium text-sm mt-0.5">{app.created_date ? format(parseISO(app.created_date), 'MMM d, yyyy HH:mm') : '—'}</p></div>
                      </div>

                      {/* Boat Info */}
                      <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(30,136,229,0.06)', border: '1px solid rgba(30,136,229,0.15)' }}>
                        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Boat Details</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-slate-500 text-xs">Boat Name</Label><p className="font-medium text-sm mt-0.5">{app.boat_name}</p></div>
                          <div><Label className="text-slate-500 text-xs">Boat Type</Label><p className="font-medium text-sm mt-0.5">{app.boat_type}</p></div>
                          <div><Label className="text-slate-500 text-xs">Model</Label><p className="font-medium text-sm mt-0.5">{app.boat_model}</p></div>
                          <div><Label className="text-slate-500 text-xs">Size</Label><p className="font-medium text-sm mt-0.5">{app.boat_size} ft</p></div>
                          <div><Label className="text-slate-500 text-xs">Year</Label><p className="font-medium text-sm mt-0.5">{app.boat_year}</p></div>
                          <div><Label className="text-slate-500 text-xs">Condition</Label><p className="font-medium text-sm mt-0.5 capitalize">{app.boat_status?.replace(/-/g, ' ')}</p></div>
                          <div className="col-span-2"><Label className="text-slate-500 text-xs">Current Location</Label><p className="font-medium text-sm mt-0.5">{app.location}</p></div>
                        </div>
                      </div>

                      {/* Message */}
                      {app.message && (
                        <div>
                          <Label className="text-slate-500 text-xs">Message from Applicant</Label>
                          <p className="mt-1 text-sm bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{app.message}</p>
                        </div>
                      )}

                      {/* Review Controls */}
                      <div className="space-y-3 pt-2 border-t">
                        <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Review</Label>
                        <div>
                          <Label className="text-xs text-slate-500">Internal Notes</Label>
                          <Textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add notes about this application..."
                            className="mt-1 min-h-[80px] text-sm"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {['in_review', 'approved', 'rejected'].map(s => (
                            <Button
                              key={s}
                              size="sm"
                              variant={selected.review_status === s ? 'default' : 'outline'}
                              className={`text-xs capitalize ${s === 'approved' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : s === 'rejected' ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}`}
                              onClick={() => saveReview(app.id, s)}
                              disabled={updateMutation.isPending}
                            >
                              {statusConfig[s].label}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-red-200 text-red-600 hover:bg-red-50 ml-auto"
                            onClick={() => { if (window.confirm('Delete this application?')) deleteMutation.mutate(app.id); }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}