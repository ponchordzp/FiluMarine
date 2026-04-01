import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from 'lucide-react';

export default function ExtraForm({ currentUser, isSuperAdmin, allOperators, onSuccess }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [selectedOps, setSelectedOps] = useState([]);

  const toggleOp = (opName) => {
    setSelectedOps(prev =>
      prev.includes(opName) ? prev.filter(o => o !== opName) : [...prev, opName]
    );
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser) throw new Error('User not loaded');
      if (!isSuperAdmin && !currentUser.operator) {
        throw new Error('User must have an operator assigned');
      }

      let saveData = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: parseFloat(data.price) || 0,
        visible: true,
        sort_order: 0,
      };

      if (!isSuperAdmin) {
        saveData.allowed_operators = [currentUser.operator];
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        saveData.operator_tag = `${currentUser.operator}_${timestamp}_${random}`;
      } else if (selectedOps.length > 0) {
        saveData.allowed_operators = selectedOps;
      } else {
        saveData.allowed_operators = [];
      }

      return base44.entities.Extra.create(saveData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setOpen(false);
      setName('');
      setDescription('');
      setPrice(0);
      setSelectedOps([]);
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
    saveMutation.mutate({ name, description, price });
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setName('');
      setDescription('');
      setPrice(0);
      setSelectedOps([]);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white" disabled={!currentUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add Extra
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Extra</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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

          {isSuperAdmin && (
            <div>
              <Label className="mb-1 block">Operator Visibility</Label>
              <p className="text-xs text-slate-400 mb-2">Leave empty for all operators, or select specific ones</p>
              <div className="grid grid-cols-2 gap-2">
                {allOperators.map(op => (
                  <label key={op.id || op.name} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedOps.includes(op.name)}
                      onCheckedChange={() => toggleOp(op.name)}
                      disabled={saveMutation.isPending}
                    />
                    <span>{op.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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