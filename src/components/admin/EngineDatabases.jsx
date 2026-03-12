import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, FileText, Sparkles, ChevronDown, ChevronRight, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EngineDatabases() {
  const queryClient = useQueryClient();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [addDocDialogOpen, setAddDocDialogOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'service_manual',
    file_url: '',
    reference_url: '',
    selection_logic: ''
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    boat_name: '',
    folder_name: '',
    engine_config: 'outboard',
    manufacturer: '',
    model: '',
    year: '',
    title: '',
    description: '',
    category: 'service_manual',
    file_url: '',
    reference_url: '',
    selection_logic: ''
  });
  const [methodology, setMethodology] = useState(
    `AI Research Methodology:

1. Identify exact engine specifications (manufacturer, model, year, HP rating)
2. Search for official manufacturer documentation first (service manuals, parts catalogs, specifications)
3. Verify document authenticity and relevance to the specific engine model
4. Cross-reference multiple sources to ensure accuracy
5. Prioritize recent and updated documentation over older versions
6. Document the selection logic explaining why each resource was chosen
7. Include source URLs for traceability and verification
8. Organize by category: service manuals, brochures, parts catalogs, troubleshooting guides, spec sheets, boat manuals

This methodology ensures accurate, verifiable, and comprehensive engine documentation for maintenance and operational reference.`
  );
  const [editingMethodology, setEditingMethodology] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['engine-documents'],
    queryFn: async () => {
      const docs = await base44.entities.EngineDocument.list();
      return docs;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EngineDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['engine-documents']);
      setAddDocDialogOpen(false);
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
      reference_url: '',
      selection_logic: ''
    });
    setCurrentFolder(null);
  };

  const resetUploadForm = () => {
    setUploadFormData({
      boat_name: '',
      folder_name: '',
      engine_config: 'outboard',
      manufacturer: '',
      model: '',
      year: '',
      title: '',
      description: '',
      category: 'service_manual',
      file_url: '',
      reference_url: '',
      selection_logic: ''
    });
  };

  const handleSubmitUpload = () => {
    if (!uploadFormData.boat_name || !uploadFormData.folder_name || !uploadFormData.title || !uploadFormData.file_url) return;
    
    createMutation.mutate(uploadFormData);
    setUploadDialogOpen(false);
    resetUploadForm();
  };

  const handleAddDocument = (folderName, folderData) => {
    setCurrentFolder({ name: folderName, data: folderData });
    setAddDocDialogOpen(true);
  };

  const handleSubmitDocument = () => {
    if (!formData.title || !formData.file_url || !currentFolder) return;
    
    createMutation.mutate({
      folder_name: currentFolder.name,
      boat_name: currentFolder.data.boat_name,
      engine_config: currentFolder.data.engine_config,
      manufacturer: currentFolder.data.manufacturer,
      model: currentFolder.data.model,
      year: currentFolder.data.year || '',
      ...formData
    });
  };

  const handleAiResearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Research the following marine engine and provide detailed information including specifications, maintenance requirements, common issues, and any available resources. Query: ${aiQuery}`,
        add_context_from_internet: true,
      });
      setAiResult(result);
    } catch (error) {
      setAiResult({ error: error.message || 'Failed to research engine information' });
    } finally {
      setAiLoading(false);
    }
  };

  const categoryLabels = {
    service_manual: '📘 Service Manual',
    brochure: '📄 Brochure',
    parts_catalog: '🔧 Parts Catalog',
    troubleshooting: '🛠️ Troubleshooting',
    spec_sheet: '📊 Spec Sheet',
    boat_manual: '⛵ Boat Manual',
  };

  // Group documents by folder
  const folderGroups = documents.reduce((acc, doc) => {
    const folderName = doc.folder_name || 'Uncategorized';
    if (!acc[folderName]) {
      acc[folderName] = {
        boat_name: doc.boat_name,
        engine_config: doc.engine_config,
        manufacturer: doc.manufacturer,
        model: doc.model,
        year: doc.year,
        documents: []
      };
    }
    acc[folderName].documents.push(doc);
    return acc;
  }, {});

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Engine Databases</h2>
          <p className="text-white/60 text-sm mt-1">AI-researched documentation organized by engine</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={(open) => { if (!open) resetUploadForm(); setUploadDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-900 text-white border-slate-700 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New Engine Document</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Boat Name *</Label>
                  <Input
                    value={uploadFormData.boat_name}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, boat_name: e.target.value })}
                    placeholder="e.g., Pirula, La Güera"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Folder Name *</Label>
                  <Input
                    value={uploadFormData.folder_name}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, folder_name: e.target.value })}
                    placeholder="e.g., Twin Yamaha 150 (2017)"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Engine Config *</Label>
                    <Select value={uploadFormData.engine_config} onValueChange={(val) => setUploadFormData({ ...uploadFormData, engine_config: val })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inboard">Inboard</SelectItem>
                        <SelectItem value="outboard">Outboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Year</Label>
                    <Input
                      value={uploadFormData.year}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, year: e.target.value })}
                      placeholder="e.g., 2019"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Manufacturer</Label>
                    <Input
                      value={uploadFormData.manufacturer}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, manufacturer: e.target.value })}
                      placeholder="e.g., Yamaha"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Model</Label>
                    <Input
                      value={uploadFormData.model}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, model: e.target.value })}
                      placeholder="e.g., F250"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Document Title *</Label>
                  <Input
                    value={uploadFormData.title}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                    placeholder="e.g., Yamaha F250 Service Manual"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category *</Label>
                  <Select value={uploadFormData.category} onValueChange={(val) => setUploadFormData({ ...uploadFormData, category: val })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_manual">Service Manual</SelectItem>
                      <SelectItem value="brochure">Brochure</SelectItem>
                      <SelectItem value="parts_catalog">Parts Catalog</SelectItem>
                      <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                      <SelectItem value="spec_sheet">Spec Sheet</SelectItem>
                      <SelectItem value="boat_manual">Boat Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>File URL *</Label>
                  <Input
                    value={uploadFormData.file_url}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, file_url: e.target.value })}
                    placeholder="https://..."
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Reference URL</Label>
                  <Input
                    value={uploadFormData.reference_url}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, reference_url: e.target.value })}
                    placeholder="Source URL where document was found"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Selection Logic</Label>
                  <Textarea
                    value={uploadFormData.selection_logic}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, selection_logic: e.target.value })}
                    placeholder="Why this document was selected..."
                    className="bg-slate-800 border-slate-700"
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                    placeholder="Document description..."
                    className="bg-slate-800 border-slate-700"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleSubmitUpload} 
                  disabled={!uploadFormData.boat_name || !uploadFormData.folder_name || !uploadFormData.title || !uploadFormData.file_url}
                >
                  Upload Document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Research
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl bg-slate-900 text-white border-slate-700 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Engine Research
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>What would you like to know?</Label>
                <Textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="e.g., Yamaha F250 maintenance schedule, Mercury Verado 300 specifications, troubleshooting outboard starting issues..."
                  className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleAiResearch} 
                disabled={!aiQuery.trim() || aiLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Research with AI
                  </>
                )}
              </Button>
              
              {aiResult && (
                <div className="mt-4">
                  {aiResult.error ? (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
                      <p className="font-semibold mb-1">Error</p>
                      <p className="text-sm">{aiResult.error}</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <p className="font-semibold text-white">Research Results</p>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-white/80 whitespace-pre-wrap">{aiResult}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={addDocDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setAddDocDialogOpen(open); }}>
        <DialogContent className="max-w-2xl bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Add Document to {currentFolder?.name}</DialogTitle>
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
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="spec_sheet">Spec Sheet</SelectItem>
                  <SelectItem value="boat_manual">Boat Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>File URL *</Label>
              <Input
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://..."
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="grid gap-2">
              <Label>Reference URL</Label>
              <Input
                value={formData.reference_url}
                onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
                placeholder="Source URL where document was found"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="grid gap-2">
              <Label>Selection Logic</Label>
              <Textarea
                value={formData.selection_logic}
                onChange={(e) => setFormData({ ...formData, selection_logic: e.target.value })}
                placeholder="Why this document was selected..."
                className="bg-slate-800 border-slate-700"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Document description..."
                className="bg-slate-800 border-slate-700"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDocDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitDocument} disabled={!formData.title || !formData.file_url}>
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {Object.keys(folderGroups).length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400">No engine documentation yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(folderGroups).map(([folderName, folderData]) => {
            const isExpanded = expandedFolders[folderName];
            return (
              <Card key={folderName} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="cursor-pointer hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3" onClick={() => toggleFolder(folderName)}>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-400" /> : <ChevronRight className="w-5 h-5 text-blue-400" />}
                      <FolderOpen className="w-6 h-6 text-yellow-500" />
                      <div>
                        <CardTitle className="text-white">{folderName}</CardTitle>
                        <p className="text-sm text-white/60 mt-1">
                          {folderData.boat_name} • {folderData.engine_config} • {folderData.documents.length} documents
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-white/40">
                        {folderData.manufacturer} {folderData.model}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddDocument(folderName, folderData);
                        }}
                        className="bg-green-600/20 hover:bg-green-600/30 border-green-600/50"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="space-y-2 pt-0">
                    {Object.entries(
                      folderData.documents.reduce((acc, doc) => {
                        if (!acc[doc.category]) acc[doc.category] = [];
                        acc[doc.category].push(doc);
                        return acc;
                      }, {})
                    ).map(([category, docs]) => (
                      <div key={category} className="border-l-2 border-blue-500/30 pl-4 py-2">
                        <p className="text-sm font-semibold text-white/80 mb-2">
                          {categoryLabels[category] || category}
                        </p>
                        {docs.map((doc) => (
                          <div 
                            key={doc.id}
                            className="bg-slate-900/50 rounded-lg p-3 mb-2 hover:bg-slate-900/70 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4 text-blue-400" />
                                  <p className="font-medium text-white text-sm">{doc.title}</p>
                                </div>
                                {doc.description && (
                                  <p className="text-xs text-white/50 ml-6 mb-2">{doc.description}</p>
                                )}
                                {doc.selection_logic && (
                                  <div className="ml-6 mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                                    <p className="text-xs text-purple-300">
                                      <span className="font-semibold">AI Selection:</span> {doc.selection_logic}
                                    </p>
                                  </div>
                                )}
                                {doc.reference_url && (
                                  <p className="text-xs text-white/40 ml-6 mt-1">
                                    <span className="font-semibold">Source:</span> {doc.reference_url}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="shrink-0 text-red-400 hover:text-red-300"
                                  onClick={() => {
                                    if (confirm('Delete this document?')) {
                                      deleteMutation.mutate(doc.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-slate-800/50 border-slate-700 mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">AI Research Methodology</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingMethodology(!editingMethodology)}
              className="text-white"
            >
              {editingMethodology ? 'Save' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingMethodology ? (
            <Textarea
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white font-mono text-sm min-h-[300px]"
            />
          ) : (
            <div className="text-white/80 whitespace-pre-wrap font-mono text-sm bg-slate-900/50 p-4 rounded">
              {methodology}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}