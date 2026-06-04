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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f0fdfa] flex items-center justify-center px-3 py-6 safe-area-top safe-area-bottom">
      {/* Back to Landing Button - Fixed Position */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-slate-50 text-navy-dark font-semibold text-xs sm:text-sm rounded-xl shadow-lg border border-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Beranda</span>
        </button>
      )}

      <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
        {/* Top Brand Banner */}
        <div className="bg-gradient-to-br from-navy to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal/50 rounded-full blur-3xl" />
          </div>

          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <LockKeyhole className="w-6 h-6 sm:w-8 sm:h-8 text-teal" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] text-teal uppercase block">
                TitipKampus UMP
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mt-1 leading-tight">
                {mode === 'login' ? 'Masuk' : 'Daftar'}
                <span className="text-teal"> Gratis</span>
              </h1>
            </div>
          </div>

          {/* Feature Pills - Compact on mobile */}
          <div className="relative flex gap-2 mt-4 sm:mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10 flex items-center gap-1.5">
              <span className="text-teal font-bold text-[10px] sm:text-xs">COD</span>
              <span className="text-slate-300 text-[9px] sm:text-[10px] hidden sm:inline">Tunai</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10 flex items-center gap-1.5">
              <span className="text-teal font-bold text-[10px] sm:text-xs">KTM</span>
              <span className="text-slate-300 text-[9px] sm:text-[10px] hidden sm:inline">Verif</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10 flex items-center gap-1.5">
              <span className="text-teal font-bold text-[10px] sm:text-xs">Gratis</span>
              <span className="text-slate-300 text-[9px] sm:text-[10px] hidden sm:inline">Layanan</span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-5 sm:p-8">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 sm:mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Login Method Toggle (Login only) */}
            {mode === 'login' && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(['password', 'otp'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setLoginMethod(method)}
                    className={`rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer ${
                      loginMethod === method
                        ? 'bg-teal text-white border-teal shadow-lg shadow-teal/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {method === 'password' ? 'Password' : 'OTP'}
                  </button>
                ))}
              </div>
            )}

            {/* Name (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold uppercase text-slate-600 tracking-wide block">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    placeholder="Nama sesuai KTM"
                  />
                </div>
              </div>
            )}

            {/* Phone (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold uppercase text-slate-600 tracking-wide block">
                  Nomor HP
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-bold uppercase text-slate-600 tracking-wide block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                  placeholder="nama@gmail.com"
                />
              </div>
            </div>

            {/* Password */}
            {(mode === 'register' || loginMethod === 'password') && (
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold uppercase text-slate-600 tracking-wide block">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
            )}

            {/* OTP (Login with OTP only) */}
            {mode === 'login' && loginMethod === 'otp' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-bold uppercase text-slate-600 tracking-wide block">
                    Kode OTP
                  </label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
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
                  <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 text-xs sm:text-sm font-bold">Kode OTP:</p>
                    <p className="text-blue-900 text-xl sm:text-2xl font-black mt-1 tracking-widest">{testOtp}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white font-bold py-3 sm:py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-teal/25 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Memuat...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Masuk</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Buat Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Back to Landing Link */}
          {onBackToLanding && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={onBackToLanding}
                className="text-xs sm:text-sm text-slate-500 hover:text-teal transition-colors cursor-pointer"
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
