import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wand2, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function PracticeBookingGenerator() {
  const [count, setCount] = useState(3);
  const [daysBackStart, setDaysBackStart] = useState(0);
  const [daysBackEnd, setDaysBackEnd] = useState(30);
  const [selectedBoat, setSelectedBoat] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: boats = [] } = useQuery({
    queryKey: ['boats-for-practice'],
    queryFn: () => base44.entities.BoatInventory.list(),
  });

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke('generatePracticeBooking', {
        count: parseInt(count),
        boatName: selectedBoat || undefined,
        daysBackStart: parseInt(daysBackStart),
        daysBackEnd: parseInt(daysBackEnd),
      });

      setResult({ success: true, data: response.data });
      setCount(3);
      setDaysBackStart(0);
      setDaysBackEnd(30);
      setSelectedBoat('');
    } catch (error) {
      setResult({
        success: false,
        error: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-purple-400" />
        <h3 className="font-semibold text-white text-sm">Practice Booking Generator</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ADMIN ONLY</span>
      </div>

      <p className="text-xs text-white/40">
        Generate realistic test bookings with auto-calculated expenses to visualize financial dashboard behavior. All data is clearly marked as practice data.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Count</label>
          <Input
            type="number"
            min="1"
            max="50"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="h-8 text-xs"
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Boat (Random if empty)</label>
          <select
            value={selectedBoat}
            onChange={(e) => setSelectedBoat(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 py-1"
            disabled={loading}
          >
            <option value="">— Random —</option>
            {boats.map((boat) => (
              <option key={boat.id} value={boat.name}>
                {boat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Days Back (Start)</label>
          <Input
            type="number"
            min="0"
            value={daysBackStart}
            onChange={(e) => setDaysBackStart(e.target.value)}
            className="h-8 text-xs"
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Days Back (End)</label>
          <Input
            type="number"
            min="1"
            value={daysBackEnd}
            onChange={(e) => setDaysBackEnd(e.target.value)}
            className="h-8 text-xs"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleGenerate}
          disabled={loading || parseInt(count) < 1}
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-3.5 w-3.5" />
              Generate Practice Bookings
            </>
          )}
        </Button>
        <p className="text-xs text-white/40">
          {parseInt(count)} bookings will be created with realistic expenses
        </p>
      </div>

      {result && (
        <div
          className="rounded-lg px-3 py-2 flex items-start gap-2"
          style={{
            background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs text-white/70">
            {result.success ? (
              <>
                <p className="font-semibold text-emerald-300">{result.data.message}</p>
                <p className="text-white/50 mt-0.5">Boat: {result.data.boatName}</p>
              </>
            ) : (
              <p className="text-red-300 font-semibold">{result.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}