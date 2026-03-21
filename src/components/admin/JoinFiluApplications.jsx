import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Ship, MapPin, Eye, Trash2, ArrowRight, Plus, Wrench, Users, Anchor } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  in_review: { label: 'In Review', cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  approved:  { label: 'Approved',  cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/20 text-red-300 border border-red-500/30' },
};

// Returns suggested next-action steps based on application data and current status
function getNextActions(app, status) {
  if (status === 'in_review') {
    return [
      {
        icon: <Phone className="h-3.5 w-3.5" />,
        label: `Contact ${app.name}`,
        detail: app.phone,
        tab: null,
        color: 'rgba(59,130,246,0.15)',
        border: 'rgba(59,130,246,0.3)',
        textColor: '#93c5fd',
      },
      {
        icon: <Mail className="h-3.5 w-3.5" />,
        label: 'Send email',
        detail: app.email,
        tab: null,
        href: `mailto:${app.email}`,
        color: 'rgba(59,130,246,0.15)',
        border: 'rgba(59,130,246,0.3)',
        textColor: '#93c5fd',
      },
    ];
  }

  if (status === 'approved') {
    const actions = [];

    // Always: add boat to fleet
    actions.push({
      icon: <Plus className="h-3.5 w-3.5" />,
      label: `Add "${app.boat_name || 'boat'}" to fleet`,
      detail: `${app.boat_type}${app.boat_model ? ` · ${app.boat_model}` : ''}${app.boat_size ? ` · ${app.boat_size} ft` : ''}`,
      tab: 'boats',
      color: 'rgba(245,158,11,0.15)',
      border: 'rgba(245,158,11,0.3)',
      textColor: '#fcd34d',
    });

    // Create user account for owner
    actions.push({
      icon: <Users className="h-3.5 w-3.5" />,
      label: `Create user account for ${app.name}`,
      detail: app.email,
      tab: 'users',
      color: 'rgba(168,85,247,0.15)',
      border: 'rgba(168,85,247,0.3)',
      textColor: '#d8b4fe',
    });

    // Operators panel
    actions.push({
      icon: <Anchor className="h-3.5 w-3.5" />,
      label: 'Set up operator profile',
      detail: `Location: ${app.location || '—'}`,
      tab: 'operators',
      color: 'rgba(99,102,241,0.15)',
      border: 'rgba(99,102,241,0.3)',
      textColor: '#a5b4fc',
    });

    // If boat has year, suggest setting up maintenance
    if (app.boat_year) {
      actions.push({
        icon: <Wrench className="h-3.5 w-3.5" />,
        label: 'Set up maintenance checklist',
        detail: `${app.boat_year} · ${app.boat_status || 'unknown condition'}`,
        tab: 'boats',
        color: 'rgba(16,185,129,0.15)',
        border: 'rgba(16,185,129,0.3)',
        textColor: '#6ee7b7',
      });
    }

    return actions;
  }

  return [];
}

export default function JoinFiluApplications({ onNavigate }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openAppId, setOpenAppId] = useState(null);

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
      setOpenAppId(null);
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
    setOpenAppId(app.id);
    setReviewNotes(app.review_notes || '');
  };

  const saveReview = (id, status) => {
    updateMutation.mutate({ id, data: { review_status: status, review_notes: reviewNotes } });
    setSelected(prev => prev ? { ...prev, review_status: status, review_notes: reviewNotes } : prev);
  };

  // Button styles for each status — active = colored bg, inactive = subtle outline
  const statusButtonStyle = (btnStatus, currentStatus) => {
    const isActive = currentStatus === btnStatus;
    if (btnStatus === 'in_review') {
      return isActive
        ? { background: 'rgba(59,130,246,0.35)', border: '1px solid rgba(59,130,246,0.7)', color: '#bfdbfe' }
        : { background: 'transparent', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd' };
    }
    if (btnStatus === 'approved') {
      return isActive
        ? { background: 'rgba(16,185,129,0.35)', border: '1px solid rgba(16,185,129,0.7)', color: '#a7f3d0' }
        : { background: 'transparent', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7' };
    }
    if (btnStatus === 'rejected') {
      return isActive
        ? { background: 'rgba(239,68,68,0.35)', border: '1px solid rgba(239,68,68,0.7)', color: '#fca5a5' }
        : { background: 'transparent', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' };
    }
    return {};
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

              <Dialog open={openAppId === app.id} onOpenChange={(open) => { if (!open) setOpenAppId(null); }}>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c1f30] border border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                      <Ship className="h-5 w-5 text-blue-400" />
                      Application — {app.name}
                    </DialogTitle>
                  </DialogHeader>
                  {selected?.id === app.id && (
                    <div className="space-y-5">
                      {/* Applicant Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-white/40 text-xs">Full Name</Label><p className="font-medium text-sm mt-0.5 text-white">{app.name}</p></div>
                        <div><Label className="text-white/40 text-xs">Email</Label><p className="font-medium text-sm mt-0.5 text-white">{app.email}</p></div>
                        <div><Label className="text-white/40 text-xs">Phone / WhatsApp</Label><p className="font-medium text-sm mt-0.5 text-white">{app.phone}</p></div>
                        <div><Label className="text-white/40 text-xs">Submitted</Label><p className="font-medium text-sm mt-0.5 text-white">{app.created_date ? format(parseISO(app.created_date), 'MMM d, yyyy HH:mm') : '—'}</p></div>
                      </div>

                      {/* Boat Info */}
                      <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(30,136,229,0.08)', border: '1px solid rgba(30,136,229,0.2)' }}>
                        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Boat Details</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-white/40 text-xs">Boat Name</Label><p className="font-medium text-sm mt-0.5 text-white">{app.boat_name}</p></div>
                          <div><Label className="text-white/40 text-xs">Boat Type</Label><p className="font-medium text-sm mt-0.5 text-white">{app.boat_type}</p></div>
                          <div><Label className="text-white/40 text-xs">Model</Label><p className="font-medium text-sm mt-0.5 text-white">{app.boat_model}</p></div>
                          <div><Label className="text-white/40 text-xs">Size</Label><p className="font-medium text-sm mt-0.5 text-white">{app.boat_size} ft</p></div>
                          <div><Label className="text-white/40 text-xs">Year</Label><p className="font-medium text-sm mt-0.5 text-white">{app.boat_year}</p></div>
                          <div><Label className="text-white/40 text-xs">Condition</Label><p className="font-medium text-sm mt-0.5 capitalize text-white">{app.boat_status?.replace(/-/g, ' ')}</p></div>
                          <div className="col-span-2"><Label className="text-white/40 text-xs">Current Location</Label><p className="font-medium text-sm mt-0.5 text-white">{app.location}</p></div>
                        </div>
                      </div>

                      {/* Message */}
                      {app.message && (
                        <div>
                          <Label className="text-white/40 text-xs">Message from Applicant</Label>
                          <p className="mt-1 text-sm p-3 rounded-lg whitespace-pre-wrap text-white/80" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>{app.message}</p>
                        </div>
                      )}

                      {/* Review Controls */}
                      <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <Label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Review</Label>
                        <div>
                          <Label className="text-xs text-white/40">Internal Notes</Label>
                          <Textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add notes about this application..."
                            className="mt-1 min-h-[80px] text-sm text-white placeholder:text-white/30"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
                          />
                        </div>

                        {/* Status buttons with colored active states */}
                        <div className="flex gap-2 flex-wrap items-center">
                          {['in_review', 'approved', 'rejected'].map(s => (
                            <button
                              key={s}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize disabled:opacity-50"
                              style={statusButtonStyle(s, selected.review_status)}
                              onClick={() => saveReview(app.id, s)}
                              disabled={updateMutation.isPending}
                            >
                              {statusConfig[s].label}
                            </button>
                          ))}
                          <button
                            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                            onClick={() => { if (window.confirm('Delete this application?')) deleteMutation.mutate(app.id); }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 inline mr-1" /> Delete
                          </button>
                        </div>

                        {/* Next Actions panel */}
                        {(selected.review_status === 'in_review' || selected.review_status === 'approved') && (() => {
                          const actions = getNextActions(selected, selected.review_status);
                          if (actions.length === 0) return null;
                          return (
                            <div className="rounded-xl p-4 space-y-3 mt-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                                {selected.review_status === 'approved' ? '✅ Suggested Next Steps' : '🔍 In Review — Actions'}
                              </p>
                              <div className="space-y-2">
                                {actions.map((action, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                                    style={{ background: action.color, border: `1px solid ${action.border}` }}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span style={{ color: action.textColor }}>{action.icon}</span>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: action.textColor }}>{action.label}</p>
                                        {action.detail && <p className="text-[11px] text-white/40 truncate mt-0.5">{action.detail}</p>}
                                      </div>
                                    </div>
                                    {action.href ? (
                                      <a
                                        href={action.href}
                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 transition-opacity hover:opacity-80"
                                        style={{ background: action.border, color: action.textColor }}
                                        target="_blank" rel="noopener noreferrer"
                                      >
                                        Go <ArrowRight className="h-3 w-3" />
                                      </a>
                                    ) : action.tab && onNavigate ? (
                                      <button
                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 transition-opacity hover:opacity-80"
                                        style={{ background: action.border, color: action.textColor }}
                                        onClick={() => { setOpenAppId(null); onNavigate(action.tab); }}
                                      >
                                        Go <ArrowRight className="h-3 w-3" />
                                      </button>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
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