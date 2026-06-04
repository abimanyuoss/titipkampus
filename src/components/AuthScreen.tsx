import { ArrowLeft, Loader2, LockKeyhole, LogIn, Mail, Phone, UserPlus, UserRound } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { User } from '../types';

interface AuthScreenProps {
  onAuthenticated: (user?: User) => Promise<void>;
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export default function AuthScreen({ onAuthenticated, initialMode = 'login', onBackToLanding }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        mode === 'login' && loginMethod === 'otp'
          ? '/api/auth/otp/login'
          : mode === 'login'
            ? '/api/auth/login'
            : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          code: otpCode
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Autentikasi gagal.');
      }

      onAuthenticated(result.user);
    } catch (e: any) {
      setError(e.message || 'Autentikasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setLoading(true);
    setError(null);
    setTestOtp(null);

    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal membuat OTP.');
      setTestOtp(result.demoCode);
      setOtpCode(result.demoCode);
    } catch (e: any) {
      setError(e.message || 'Gagal membuat OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f0fdfa] flex items-center justify-center px-4 py-10">
      {/* Back to Landing Button - Fixed Position */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-navy-dark font-semibold text-sm rounded-xl shadow-lg border border-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_420px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
        {/* Left Panel - Branding */}
        <div className="bg-gradient-to-br from-navy to-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-40 h-40 bg-teal rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-60 h-60 bg-teal/50 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative space-y-6">
            <div className="w-14 h-14 bg-teal/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <LockKeyhole className="w-8 h-8 text-teal" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-teal uppercase">TitipKampus UMP</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-3 leading-tight">
                Masuk ke
                <br />
                Ekosistem
                <br />
                <span className="text-teal">Saling Bantu</span>
              </h1>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Akses pemesanan, tracking, riwayat, dan akun kurir dengan sesi mahasiswa yang tersimpan aman.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="relative grid grid-cols-3 gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-teal font-bold text-sm">COD</span>
              <span className="text-slate-300">Pembayaran Tunai</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-teal font-bold text-sm">UMP</span>
              <span className="text-slate-300">Area Fokus</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-teal font-bold text-sm">KTM</span>
              <span className="text-slate-300">Verifikasi</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-8">
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Daftar
              </button>
            </div>

            <h2 className="text-2xl font-bold text-navy-dark">
              {mode === 'login' ? 'Login Mahasiswa' : 'Buat Akun Baru'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Masuk dengan akun mahasiswa UMP Anda.'
                : 'Daftar gratis dan mulai titip barang hari ini.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Login Method Toggle (Login only) */}
            {mode === 'login' && (
              <div className="grid grid-cols-2 gap-3">
                {(['password', 'otp'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setLoginMethod(method)}
                    className={`rounded-xl py-3 text-sm font-bold border-2 transition-all cursor-pointer ${
                      loginMethod === method
                        ? 'bg-teal text-white border-teal shadow-lg shadow-teal/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {method === 'password' ? 'Password' : 'OTP Digital'}
                  </button>
                ))}
              </div>
            )}

            {/* Name (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wide">Nama Lengkap</label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    placeholder="Nama sesuai KTM"
                  />
                </div>
              </div>
            )}

            {/* Phone (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wide">Nomor HP</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                  placeholder="nama@gmail.com"
                />
              </div>
            </div>

            {/* Password */}
            {(mode === 'register' || loginMethod === 'password') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wide">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
            )}

            {/* OTP (Login with OTP only) */}
            {mode === 'login' && loginMethod === 'otp' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 tracking-wide">Kode OTP</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                      placeholder="Masukkan 6 digit OTP"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || !email}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Memuat...' : 'Minta Kode OTP'}
                </button>
                {testOtp && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 text-sm font-bold">Kode OTP Pengujian:</p>
                    <p className="text-blue-900 text-2xl font-black mt-1 tracking-widest">{testOtp}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-teal/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memuat...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Masuk ke Dashboard</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Buat Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Back to Landing Link */}
          {onBackToLanding && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBackToLanding}
                className="text-sm text-slate-500 hover:text-teal transition-colors cursor-pointer"
              >
                ← Kembali ke halaman utama
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
