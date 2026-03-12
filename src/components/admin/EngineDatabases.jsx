import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { FileText, Plus, Trash2, ExternalLink, Download } from 'lucide-react';

export default function EngineDatabases() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'service_manual',
    file_url: '',
    engine_type: '',
    manufacturer: '',
    model: '',
    year: '',
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['engine-documents'],
    queryFn: async () => {
      const docs = await base44.entities.EngineDocument.list();
      return docs.sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EngineDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['engine-documents']);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EngineDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['engine-documents']);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EngineDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['engine-documents']),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'service_manual',
      file_url: '',
      engine_type: '',
      manufacturer: '',
      model: '',
      year: '',
    });
    setEditingDoc(null);
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.file_url) return;
    
    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title || '',
      description: doc.description || '',
      category: doc.category || 'service_manual',
      file_url: doc.file_url || '',
      engine_type: doc.engine_type || '',
      manufacturer: doc.manufacturer || '',
      model: doc.model || '',
      year: doc.year || '',
    });
    setDialogOpen(true);
  };

  const categoryLabels = {
    service_manual: '📘 Service Manual',
    brochure: '📄 Brochure',
    parts_catalog: '🔧 Parts Catalog',
    troubleshooting: '🛠️ Troubleshooting Guide',
    spec_sheet: '📊 Spec Sheet',
    other: '📁 Other',
  };

  const groupedDocs = documents.reduce((acc, doc) => {
    const cat = doc.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Engine Databases</h2>
          <p className="text-white/60 text-sm mt-1">Service manuals, brochures, and engine documentation</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>{editingDoc ? 'Edit Document' : 'Add New Document'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Yamaha 250 Service Manual"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service_manual">Service Manual</SelectItem>
                    <SelectItem value="brochure">Brochure</SelectItem>
                    <SelectItem value="parts_catalog">Parts Catalog</SelectItem>
                    <SelectItem value="troubleshooting">Troubleshooting Guide</SelectItem>
                    <SelectItem value="spec_sheet">Spec Sheet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>File URL *</Label>
                <Input
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://... or upload file first"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Engine Type</Label>
                  <Select value={formData.engine_type} onValueChange={(val) => setFormData({ ...formData, engine_type: val })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inboard">Inboard</SelectItem>
                      <SelectItem value="outboard">Outboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., Yamaha"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., 250 HP"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Year</Label>
                  <Input
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g., 2017"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description or notes..."
                  className="bg-slate-800 border-slate-700"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.title || !formData.file_url}>
                {editingDoc ? 'Update' : 'Add'} Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400">No documents yet. Add your first engine document.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                {categoryLabels[category] || category}
                <span className="text-xs text-white/40">({docs.length})</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <Card key={doc.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base text-white flex items-start justify-between">
                        <span className="line-clamp-2">{doc.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {doc.manufacturer && (
                        <p className="text-sm text-white/70">
                          <span className="font-semibold">Manufacturer:</span> {doc.manufacturer}
                        </p>
                      )}
                      {doc.model && (
                        <p className="text-sm text-white/70">
                          <span className="font-semibold">Model:</span> {doc.model}
                        </p>
                      )}
                      {doc.year && (
                        <p className="text-sm text-white/70">
                          <span className="font-semibold">Year:</span> {doc.year}
                        </p>
                      )}
                      {doc.engine_type && (
                        <p className="text-sm text-white/70">
                          <span className="font-semibold">Type:</span> {doc.engine_type}
                        </p>
                      )}
                      {doc.description && (
                        <p className="text-sm text-white/50 line-clamp-2">{doc.description}</p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(doc)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => {
                            if (confirm('Delete this document?')) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}