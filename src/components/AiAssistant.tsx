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
    'Tolong belikan soto ayam di kantin teknik, cabai 2, lalu antar ke perpustakaan lantai 2.',
    'Saya ingin print makalah PDF 10 lembar di Kopma dan diantar ke ruang sidang FKIP Gedung F.',
    'Saya perlu ojek kampus dari Masjid Ahmad Dahlan ke gerbang belakang secepatnya.'
  ];

  return (
    <div className="bg-gradient-to-br from-navy/15 to-teal/5 border border-teal/20 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-teal rounded-lg text-white">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-navy-dark flex items-center gap-1.5">
            Asisten Pengisian Pesanan
            <span className="text-[10px] font-bold text-teal bg-teal-light/30 px-2 py-0.5 rounded-full">Otomatis</span>
          </h3>
          <p className="text-xs text-slate-500">
            Tulis kebutuhan Anda, lalu sistem membantu menyusun lokasi, rincian, dan estimasi tarif.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Contoh: Tolong belikan mie goreng dan es teh di kantin teknik, lalu antar ke laboratorium komputer FEB."
          className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all resize-none min-h-[90px]"
          id="ai-text-input"
        />

        <div className="flex flex-wrap gap-1.5 justify-end">
          {currentPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setText(preset)}
              className="text-[10px] text-teal hover:bg-teal-light/20 px-2 py-1 bg-white border border-slate-200/60 rounded-full transition-all text-left truncate max-w-[280px]"
              title={preset}
            >
              Contoh {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2 border border-rose-100">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-white border border-teal/10 rounded-lg p-4 text-xs space-y-3 shadow-inner">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-700 uppercase tracking-wide">Rangkuman Pesanan</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
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
                ? 'Food / Makanan'
                : result.predictedType === 'photocopy'
                  ? 'Fotokopi / Print'
                  : result.predictedType === 'laundry'
                    ? 'Laundry'
                    : 'Ojek Kampus'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
            <div className="flex gap-1.5 items-start">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[10px] uppercase text-slate-400">Dari (Penjemputan):</span>
                <span className="text-slate-700 font-medium">{result.source || 'Tidak terdeteksi'}</span>
              </div>
            </div>
            <div className="flex gap-1.5 items-start">
              <MapPin className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[10px] uppercase text-slate-400">Ke (Lokasi Antar):</span>
                <span className="text-slate-700 font-medium">{result.destination || 'Tidak terdeteksi'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 bg-slate-50/50 p-2 rounded border border-slate-100 text-slate-600">
            <span className="block font-bold text-[10px] uppercase text-slate-400 mb-0.5">Rincian Detail:</span>
            <p className="italic text-slate-700">"{result.details}"</p>
          </div>

          {!result.insideUmp && (
            <div className="p-2 bg-amber-50 rounded text-amber-800 flex items-start gap-1.5 border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p className="text-[10px]">
                <strong>Peringatan Wilayah:</strong> Lokasi terdeteksi di luar area jangkauan Universitas Muhammadiyah
                Purwokerto.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimasi Tarif COD:</span>
              <span className="text-sm font-extrabold text-[#119b50]">
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
              className="bg-teal text-white font-semibold flex items-center gap-1 hover:bg-teal-dark active:scale-95 transition-all text-[11px] px-3 py-1.5 rounded-lg shrink-0 cursor-pointer shadow-sm"
            >
              <span>Masukkan ke Form</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="w-full bg-teal hover:bg-teal-dark font-semibold text-white py-2.5 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        id="btn-ai-analyze"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menyusun rincian pesanan...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Susun dan Isi Form</span>
          </>
        )}
      </button>
    </div>
  );
}
