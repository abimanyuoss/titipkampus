import { Award, CheckCircle, Loader, ShieldAlert, UploadCloud } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { Provider } from '../types';

interface ProviderRegistrationProps {
  onSuccess: (provider: Provider) => void;
  onCancel?: () => void;
}

export default function ProviderRegistration({ onSuccess, onCancel }: ProviderRegistrationProps) {
  const [nim, setNim] = useState('');
  const [faculty, setFaculty] = useState('');
  const [ktmImage, setKtmImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Faculties listed at UMP
  const faculties = [
    'Fakultas Teknik dan Sains (FTS)',
    'Fakultas Ekonomi dan Bisnis (FEB)',
    'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    'Fakultas Ilmu Kesehatan (FIKES)',
    'Fakultas Farmasi',
    'Fakultas Sastra',
    'Fakultas Kedokteran',
    'Fakultas Hukum',
    'Fakultas Agama Islam'
  ];

  const handleSimulateUpload = (_e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    setErr(null);

    // Simulate small latency for image upload
    setTimeout(() => {
      // Use standard simulated KTM placeholder
      setKtmImage('https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop');
      setUploading(false);
    }, 1200);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!nim || nim.trim().length < 6) {
      setErr('Masukkan NIM mahasiswa aktif UMP yang sah!');
      return;
    }
    if (!faculty) {
      setErr('Pilih fakultas asal Anda!');
      return;
    }
    if (!ktmImage) {
      setErr('Mohon unggah Kartu Tanda Mahasiswa (KTM) aktif Anda untuk verifikasi keselamatan!');
      return;
    }

    setSubmitting(true);

    try {
      const resp = await fetch('/api/provider/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ktmUrl: ktmImage, nim, faculty })
      });

      if (!resp.ok) {
        throw new Error('Gagal melakukan pendaftaran kurir.');
      }

      const val = await resp.json();
      onSuccess(val.provider);
    } catch (e: any) {
      setErr(e.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 bg-teal-light/20 text-teal rounded-full flex items-center justify-center mx-auto mb-2">
          <Award className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-extrabold text-[#000c24]">Pendaftaran Kurir Kampus</h2>
        <p className="text-xs text-slate-500">
          Ajukan verifikasi kurir untuk menerima tugas pengantaran di lingkungan UMP.
        </p>
      </div>

      <div className="p-3 bg-amber-50 rounded-lg text-[11px] text-amber-800 flex items-start gap-2 border border-amber-100">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Syarat Verifikasi:</strong> Wajib mahasiswa aktif di lingkungan UMP Purwokerto. KTM digunakan untuk
          validasi identitas dan keamanan transaksi.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4 text-left">
        {/* NIM */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block uppercase">NIM (Nomor Induk Mahasiswa)</label>
          <input
            type="text"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            placeholder="Contoh: 2103040012"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
            required
            id="reg-nim"
          />
        </div>

        {/* Faculty */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block uppercase">Fakultas Asal</label>
          <select
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
            required
            id="reg-faculty"
          >
            <option value="">-- Pilih Fakultas --</option>
            {faculties.map((fac) => (
              <option key={fac} value={fac}>
                {fac}
              </option>
            ))}
          </select>
        </div>

        {/* KTM Upload Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block uppercase">Unggah KTM Mahasiswa Aktif</label>

          <div className="border-2 border-dashed border-slate-200 hover:border-teal/40 transition-colors rounded-xl p-6 text-center bg-slate-50 relative">
            {uploading ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-2">
                <Loader className="w-6 h-6 text-teal animate-spin" />
                <span className="text-xs font-semibold text-slate-600">Mengupload KTM...</span>
              </div>
            ) : ktmImage ? (
              <div className="space-y-3">
                <img
                  src={ktmImage}
                  alt="KTM Preview"
                  className="w-full max-h-[160px] object-cover rounded-lg border border-slate-200 mx-auto"
                />
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#119b50] font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>KTM Terunggah Berhasil</span>
                </div>
                <button
                  type="button"
                  onClick={() => setKtmImage(null)}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  Hapus & Ganti
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                <div>
                  <label
                    htmlFor="file-upload"
                    className="font-bold text-teal hover:text-teal-dark cursor-pointer text-xs underline"
                  >
                    Klik untuk memilih file
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Unggah foto KTM format JPG atau PNG maksimal 2MB</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleSimulateUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {err && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg">{err}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal hover:bg-teal-dark py-3 text-white font-bold rounded-lg shadow-sm active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          id="btn-register-provider"
        >
          {submitting ? 'Mengirim berkas...' : 'Kirim Berkas untuk Verifikasi Admin'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-slate-100 hover:bg-slate-200 py-3 text-slate-700 font-bold rounded-lg active:scale-95 transition-all text-sm cursor-pointer"
          >
            Kembali ke Dashboard Mahasiswa
          </button>
        )}
      </form>
    </div>
  );
}
