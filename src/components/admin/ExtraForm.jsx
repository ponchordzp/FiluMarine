import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from 'lucide-react';

export default function ExtraForm({ allOperators = [], onSuccess }) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [tag, setTag] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.tag || !data.tag.trim()) {
        throw new Error('Tag is required.');
      }
      if (isSuperAdmin && !data.operator) {
        throw new Error('Superadmins must select an operator.');
      }
      let saveData = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: parseFloat(data.price) || 0,
        operator_tag: data.tag.trim(),
        visible: true,
        sort_order: 0,
      };
      if (isSuperAdmin && data.operator) {
        saveData.allowed_operators = [data.operator];
      }
      return base44.entities.Extra.create(saveData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setOpen(false);
      setName('');
      setDescription('');
      setPrice(0);
      setTag('');
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
    saveMutation.mutate({ name, description, price, tag, operator: selectedOperator });
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setName('');
      setDescription('');
      setPrice(0);
      setTag('');
      setSelectedOperator('');
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
          {isSuperAdmin && (
            <div>
              <Label>Operator *</Label>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                disabled={saveMutation.isPending}
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-foreground"
              >
                <option value="">-- Select an operator --</option>
                {allOperators.map(op => (
                  <option key={op.id || op.name} value={op.name}>{op.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">This extra will only be visible to the selected operator.</p>
            </div>
          )}

          <div>
            <Label>Tag *</Label>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. FILU_extra_001, TYCOON_bar_02"
              className="mt-1"
              disabled={saveMutation.isPending}
            />
            <p className="text-xs text-slate-500 mt-1">Create a unique tag to identify this extra.</p>
          </div>

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
           disabled={saveMutation.isPending}
           className="w-full"
          >
            {saveMutation.isPending ? 'Creating...' : 'Create Extra'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}