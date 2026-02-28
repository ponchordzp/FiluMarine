import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

/**
 * Manages custom fields for a form section.
 * custom_fields is an array of { id, label, type, value }
 */
export default function CustomFieldsManager({ sectionKey, customFields = [], onChange, colorClass = 'border-slate-200 text-slate-700' }) {
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState({ label: '', type: 'text' });

  const addField = () => {
    if (!newField.label.trim()) return;
    const field = {
      id: `custom_${sectionKey}_${Date.now()}`,
      label: newField.label.trim(),
      type: newField.type,
      value: '',
    };
    onChange([...customFields, field]);
    setNewField({ label: '', type: 'text' });
    setAdding(false);
  };

  const removeField = (id) => {
    onChange(customFields.filter(f => f.id !== id));
  };

  const updateValue = (id, value) => {
    onChange(customFields.map(f => f.id === id ? { ...f, value } : f));
  };

  return (
    <div className="mt-3 space-y-2">
      {customFields.map(field => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="flex-1">
            <Label className="text-xs text-slate-600">{field.label}</Label>
            {field.type === 'textarea' ? (
              <Textarea rows={2} value={field.value || ''} onChange={e => updateValue(field.id, e.target.value)} className="text-sm mt-0.5" placeholder={`Enter ${field.label.toLowerCase()}...`} />
            ) : (
              <Input type={field.type} value={field.value || ''} onChange={e => updateValue(field.id, e.target.value)} className="text-sm mt-0.5 h-8" placeholder={`Enter ${field.label.toLowerCase()}...`} />
            )}
          </div>
          <button type="button" onClick={() => removeField(field.id)} className="mt-5 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 space-y-2">
          <p className="text-xs font-semibold text-slate-600">New Custom Field</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Field Label *</Label>
              <Input
                value={newField.label}
                onChange={e => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g., Insurance Policy #"
                className="text-sm h-8 mt-0.5"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addField())}
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Field Type</Label>
              <Select value={newField.type} onValueChange={val => setNewField({ ...newField, type: val })}>
                <SelectTrigger className="text-sm h-8 mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="url">URL / Link</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={addField} disabled={!newField.label.trim()} className="h-7 text-xs px-3">Add Field</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setNewField({ label: '', type: 'text' }); }} className="h-7 text-xs px-3">Cancel</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700`}
        >
          <Plus className="h-3 w-3" />
          Add custom field
        </button>
      )}
    </div>
  );
}