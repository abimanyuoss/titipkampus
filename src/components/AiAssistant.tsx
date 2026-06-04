import { AlertTriangle, ArrowRight, Loader2, MapPin, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { ServiceType } from '../types';

interface AiAssistantProps {
  onApplyPreset: (data: {
    serviceType: ServiceType;
    sourceLocation: string;
    deliveryLocation: string;
    details: string;
    fee: number;
  }) => void;
}

export default function AiAssistant({ onApplyPreset }: AiAssistantProps) {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text || text.trim().length === 0) {
      setError('Tuliskan pesanan Anda terlebih dahulu');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textInput: text })
      });

      if (!response.ok) {
        throw new Error('Gagal menyusun estimasi pesanan.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyusun rincian pesanan.');
    } finally {
      setAnalyzing(false);
    }
  };

  const currentPresets = [
    'Beli soto kantin teknik ke perpustakaan lt 2',
    'Print makalah 10 lembar di Kopma, antar ke FKIP'
  ];

  return (
    <div className="bg-gradient-to-br from-navy/15 to-teal/5 border border-teal/20 rounded-xl p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 bg-teal rounded-lg text-white shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-navy-dark flex items-center gap-1.5 flex-wrap">
            <span>Asisten Pengisian Otomatis</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-teal bg-teal-light/30 px-1.5 sm:px-2 py-0.5 rounded-full">
              AI
            </span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Tulis kebutuhan, sistem bantu susun lokasi, detail, dan tarif.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Contoh: Belikan mie goreng di kantin teknik, antar ke labkom FEB"
          className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all resize-none min-h-[70px] sm:min-h-[90px]"
          id="ai-text-input"
        />

        <div className="flex flex-wrap gap-1.5 justify-end">
          {currentPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setText(preset)}
              className="text-[9px] sm:text-[10px] text-teal hover:bg-teal-light/20 px-1.5 sm:px-2 py-1 bg-white border border-slate-200/60 rounded-full transition-all text-left truncate max-w-[180px] sm:max-w-[280px]"
              title={preset}
            >
              {idx === 0 ? '✓ Contoh 1' : '✓ Contoh 2'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 text-rose-700 text-[11px] sm:text-xs rounded-lg flex items-center gap-2 border border-rose-100">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-white border border-teal/10 rounded-lg p-3 sm:p-4 text-[11px] sm:text-xs space-y-3 shadow-inner animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-700 uppercase tracking-wide">Ringkasan Pesanan</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] sm:text-[10px] ${
                result.predictedType === 'food'
                  ? 'bg-amber-100 text-amber-800'
                  : result.predictedType === 'photocopy'
                    ? 'bg-blue-100 text-blue-800'
                    : result.predictedType === 'laundry'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {result.predictedType === 'food'
                ? 'Makanan'
                : result.predictedType === 'photocopy'
                  ? 'Fotokopi'
                  : result.predictedType === 'laundry'
                    ? 'Laundry'
                    : 'Ojek'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex gap-1.5 items-start">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[9px] sm:text-[10px] uppercase text-slate-400">Dari:</span>
                <span className="text-slate-700 font-medium">{result.source || 'Tidak terdeteksi'}</span>
              </div>
            </div>
            <div className="flex gap-1.5 items-start">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[9px] sm:text-[10px] uppercase text-slate-400">Ke:</span>
                <span className="text-slate-700 font-medium">{result.destination || 'Tidak terdeteksi'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 bg-slate-50/50 p-2 rounded border border-slate-100 text-slate-600">
            <span className="block font-bold text-[9px] sm:text-[10px] uppercase text-slate-400 mb-0.5">Detail:</span>
            <p className="italic text-slate-700 text-[11px] sm:text-xs">"{result.details}"</p>
          </div>

          {!result.insideUmp && (
            <div className="p-2 bg-amber-50 rounded text-amber-800 flex items-start gap-1.5 border border-amber-100 text-[10px] sm:text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p>
                <strong>Catatan:</strong> Lokasi di luar area UMP.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2">
            <div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-bold">Estimasi:</span>
              <span className="text-sm sm:text-base font-extrabold text-[#119b50]">
                Rp {Number(result.fee).toLocaleString('id-ID')}
              </span>
            </div>
            <button
              onClick={() =>
                onApplyPreset({
                  serviceType: result.predictedType,
                  sourceLocation: result.source,
                  deliveryLocation: result.destination,
                  details: result.details,
                  fee: result.fee
                })
              }
              className="w-full sm:w-auto bg-teal text-white font-semibold flex items-center justify-center gap-1 hover:bg-teal-dark active:scale-[0.98] transition-all text-[11px] sm:text-xs px-3 sm:px-4 py-2 rounded-lg cursor-pointer shadow-sm"
            >
              <span>Terapkan ke Form</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal font-semibold text-white py-2.5 sm:py-3 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-xs sm:text-sm"
        id="btn-ai-analyze"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menyusun...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Susun Otomatis</span>
          </>
        )}
      </button>
    </div>
  );
}
