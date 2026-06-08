import { ArrowLeft, Camera, Loader2, Save, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { User } from '../types';

interface ProfileEditProps {
  user: User;
  onSave: (updated: User) => void;
  onBack: () => void;
}

export default function ProfileEdit({ user, onSave, onBack }: ProfileEditProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [avatar, setAvatar] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama tidak boleh kosong.');
      return;
    }
    if (!phone.trim()) {
      setError('Nomor HP tidak boleh kosong.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), avatar }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan profil.');

      onSave(result.user);
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-dark mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Dashboard</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 sm:p-6 bg-navy text-white text-left">
          <h2 className="font-extrabold text-lg">Edit Profil</h2>
          <p className="text-xs text-slate-300 mt-1">Perbarui data diri Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-slate-100" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-100">
                  <UserRound className="w-10 h-10 text-slate-400" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-teal-dark transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <span className="text-[10px] text-slate-400">Klik ikon kamera untuk ganti foto</span>
          </div>

          {/* Name */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-navy-dark uppercase tracking-wider block" htmlFor="profile-name">
              Nama Lengkap
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-navy-dark uppercase tracking-wider block">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400">Email tidak dapat diubah.</span>
          </div>

          {/* Phone */}
          <div className="space-y-1.5 text-left">
            <label
              className="text-[11px] font-bold text-navy-dark uppercase tracking-wider block"
              htmlFor="profile-phone"
            >
              Nomor HP
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812-3456-7890"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-teal text-white rounded-lg text-sm font-semibold hover:bg-teal-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
