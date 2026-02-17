import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Trash2, Plus, ArrowLeft, Anchor } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import AdminAuth from '@/components/AdminAuth';

export default function AdminDatesPage() {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [boatName, setBoatName] = useState('both');
  const queryClient = useQueryClient();

  const { data: blockedDates = [], isLoading } = useQuery({
    queryKey: ['blockedDates'],
    queryFn: () => base44.entities.BlockedDate.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BlockedDate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedDates'] });
      setNewDate('');
      setReason('');
      setBoatName('both');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlockedDate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedDates'] });
    },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newDate) return;
    createMutation.mutate({ 
      date: newDate, 
      reason: reason || 'Blocked by admin',
      boat_name: boatName
    });
  };

  return (
    <AdminAuth>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link 
          to={createPageUrl('Home')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="h-8 w-8 text-[#1e88e5]" />
          <h1 className="text-3xl font-bold text-slate-800">Manage Blocked Dates</h1>
        </div>

        {/* Add New Blocked Date */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Block a New Date</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="boat">Boat *</Label>
                <Select value={boatName} onValueChange={setBoatName}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Boats</SelectItem>
                    <SelectItem value="FILU">FILU (25ft Sea Fox)</SelectItem>
                    <SelectItem value="TYCOON">TYCOON (55ft Yacht)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Maintenance, Weather, etc."
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#1e88e5] hover:bg-[#1976d2] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Blocked Date
            </Button>
          </form>
        </div>

        {/* List of Blocked Dates */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Blocked Dates</h2>
          
          {isLoading ? (
            <p className="text-slate-500 text-center py-8">Loading...</p>
          ) : blockedDates.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No blocked dates yet</p>
          ) : (
            <div className="space-y-3">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">
                        {format(new Date(blocked.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        blocked.boat_name === 'both' ? 'bg-slate-100 text-slate-700' :
                        blocked.boat_name === 'FILU' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        <Anchor className="inline h-3 w-3 mr-1" />
                        {blocked.boat_name || 'both'}
                      </span>
                    </div>
                    {blocked.reason && (
                      <p className="text-sm text-slate-500 mt-1">{blocked.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(blocked.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AdminAuth>
  );
}