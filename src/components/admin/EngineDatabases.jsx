import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileText, Sparkles, ChevronDown, ChevronRight, ExternalLink, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function EngineDatabases() {
  const queryClient = useQueryClient();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['engine-documents'],
    queryFn: async () => {
      const docs = await base44.entities.EngineDocument.list();
      return docs;
    },
  });

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
                <CardHeader 
                  className="cursor-pointer hover:bg-slate-800/70 transition-colors"
                  onClick={() => toggleFolder(folderName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-400" /> : <ChevronRight className="w-5 h-5 text-blue-400" />}
                      <FolderOpen className="w-6 h-6 text-yellow-500" />
                      <div>
                        <CardTitle className="text-white">{folderName}</CardTitle>
                        <p className="text-sm text-white/60 mt-1">
                          {folderData.boat_name} • {folderData.engine_config} • {folderData.documents.length} documents
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-white/40">
                      {folderData.manufacturer} {folderData.model}
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
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
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
    </div>
  );
}