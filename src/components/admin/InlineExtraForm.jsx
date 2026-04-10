import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ImagePlus, Loader2 } from 'lucide-react';

export default function InlineExtraForm({ onSuccess }) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [selectedOperator, setSelectedOperator] = useState(isSuperAdmin ? '' : (currentUser?.operator || ''));
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: allOperators = [] } = useQuery({
    queryKey: ['operators'],
    queryFn: () => base44.entities.CharterOperator.list(),
    enabled: isSuperAdmin
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImage(file_url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

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
        image: data.image,
        operator_tag: data.tag.trim(),
        visible: true,
        sort_order: 0,
        allowed_operators: data.operator ? [data.operator] : []
      };

      return base44.entities.Extra.create(saveData);
    },
    onSuccess: (newExtra) => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      setOpen(false);
      setName('');
      setDescription('');
      setImage('');
      setTag('');
      if (onSuccess) onSuccess(newExtra);
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
    const finalOp = isSuperAdmin ? selectedOperator : (currentUser?.operator || 'FILU');
    saveMutation.mutate({ name, description, image, tag, operator: finalOp });
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setName('');
      setDescription('');
      setImage('');
      setTag('');
      setSelectedOperator(isSuperAdmin ? '' : (currentUser?.operator || ''));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          className="h-7 w-7 p-0 flex-shrink-0 border-dashed border-slate-300 text-slate-500 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50"
          title="Create New Extra"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Extra</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-1 pb-1">
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
            <Label>Image</Label>
            <div className="mt-1 border-2 border-dashed border-input rounded-xl p-4 flex flex-col items-center justify-center relative hover:bg-muted/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading || saveMutation.isPending}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {isUploading ? (
                <div className="flex flex-col items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : image ? (
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group">
                  <img src={image} alt="Extra" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImagePlus className="h-6 w-6 text-white mb-2" />
                    <p className="text-sm font-medium text-white">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center px-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <ImagePlus className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">Click or drag image to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 5MB</p>
                </div>
              )}
            </div>
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