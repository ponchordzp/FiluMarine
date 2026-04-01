import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from 'lucide-react';

export default function ExtraForm({ allOperators, onSuccess }) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [operator, setOperator] = useState('');

  // Auto-set operator when dialog opens
  useEffect(() => {
    if (open) {
      if (!isSuperAdmin && currentUser?.operator) {
        setOperator(currentUser.operator);
      } else if (isSuperAdmin) {
        setOperator('');
      }
    }
  }, [open, currentUser, isSuperAdmin]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let saveData = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: parseFloat(data.price) || 0,
        visible: true,
        sort_order: 0,
      };

      if (!isSuperAdmin) {
        // Non-superadmins: locked to their operator
        const userOperator = currentUser?.operator || data.operator;
        if (!userOperator) {
          throw new Error('No operator assigned to your account.');
        }
        saveData.allowed_operators = [userOperator];
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        saveData.operator_tag = `${userOperator}_${timestamp}_${random}`;
      } else {
        // Superadmins: use selected operator or empty for global
        if (data.operator) {
          saveData.allowed_operators = [data.operator];
        } else {
          saveData.allowed_operators = [];
        }
      }

      return base44.entities.Extra.create(saveData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setOpen(false);
      setName('');
      setDescription('');
      setPrice(0);
      setOperator('');
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error('Save error:', error);
      alert('Error saving extra: ' + (error?.message || 'Unknown error'));
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a name');
      return;
    }
    saveMutation.mutate({ name, description, price, operator });
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setName('');
      setDescription('');
      setPrice(0);
      setOperator('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Extra
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Extra</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isSuperAdmin ? (
            <div>
              <Label>Operator (Optional)</Label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                disabled={saveMutation.isPending}
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="">Global (All Operators)</option>
                {allOperators.map(op => (
                  <option key={op.id || op.name} value={op.name}>{op.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Leave blank for global availability, or select an operator for restriction.</p>
            </div>
          ) : (
            <div>
              <Label>Operator</Label>
              <div className="mt-1 px-3 py-2 rounded-md border border-input bg-slate-100 text-slate-900 font-medium">
                {currentUser?.operator || 'No operator assigned'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Your extras are automatically restricted to your operator.</p>
            </div>
          )}

          <div>
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Open Bar, Bait Pack"
              className="mt-1"
              disabled={saveMutation.isPending}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for guests..."
              className="mt-1"
              rows={2}
              disabled={saveMutation.isPending}
            />
          </div>

          <div>
            <Label>Price (MXN)</Label>
            <Input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1"
              disabled={saveMutation.isPending}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={saveMutation.isPending || !currentUser}
            className="w-full"
          >
            {saveMutation.isPending ? 'Creating...' : 'Create Extra'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}