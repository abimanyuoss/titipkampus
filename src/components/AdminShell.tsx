import { LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import type { User } from '../types';
import AdminDashboard from './AdminDashboard';

type AdminShellProps = {
  user: User;
  onLogout: () => void;
};

export default function AdminShell({ user, onLogout }: AdminShellProps) {
  return (
    <div className="min-h-screen flex bg-[#f7f9fb] text-slate-800 antialiased font-sans">
      <aside className="w-72 bg-[#07172f] text-white px-5 py-6 flex-col justify-between shrink-0 border-r border-slate-800 shadow-xl hidden lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal rounded-xl flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-base tracking-tight leading-none block text-white">TitipKampus</span>
              <span className="text-[10px] text-teal-light font-bold block tracking-widest mt-0.5">ADMIN OPS</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
              Panel Operasional
            </span>
            <span className="text-xs font-semibold text-slate-100 block">
              Verifikasi kurir dan monitor transaksi UMP
            </span>
          </div>

          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold bg-teal text-white shadow-md">
            <Sparkles className="w-4 h-4" />
            <span>Dashboard Admin</span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800 text-left">
          <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <img
              src={user.avatar}
              alt="Avatar admin"
              className="w-10 h-10 object-cover rounded-full border border-teal"
            />
            <div className="text-xs">
              <span className="font-extrabold text-slate-100 block">{user.name}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-teal/20 text-teal-light px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                Administrator
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200 bg-white shadow-xs sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" />
            <div className="text-left">
              <span className="font-extrabold text-sm text-navy-dark block">Dashboard Admin</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TitipKampus UMP</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="lg:hidden flex items-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </header>

        <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-grow">
          <AdminDashboard />
        </main>
      </div>
    </div>
  );
}
