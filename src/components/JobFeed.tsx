import { BadgePercent, Bike, Check, Printer, Shield, Utensils } from 'lucide-react';
import type { Order } from '../types';

interface JobFeedProps {
  orders: Order[];
  currentUserId?: string;
  onClaimJob: (id: string) => void;
}

export default function JobFeed({ orders, currentUserId, onClaimJob }: JobFeedProps) {
  // Filter jobs that are currently available for courier pickup.
  const availableJobs = orders.filter(
    (job) =>
      job.status === 'PENDING' &&
      !job.providerId &&
      job.customerUserId !== currentUserId &&
      (job.paymentMethod === 'COD' || job.paymentStatus === 'PAID')
  );

  const getServiceData = (type: string) => {
    switch (type) {
      case 'food':
        return { icon: Utensils, cls: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'photocopy':
        return { icon: Printer, cls: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'laundry':
        return { icon: Shield, cls: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { icon: Bike, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-navy-dark flex items-center gap-1.5">
            Daftar Tugas Tersedia
            <span className="w-2.5 h-2.5 bg-[#119b50] rounded-full animate-ping" />
          </h3>
          <p className="text-[11px] text-slate-500">Pilih penugasan terdekat di lingkungan UMP Purwokerto.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-teal-light/20 text-teal rounded-full">
          {availableJobs.length} Tugas
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
        {availableJobs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <BadgePercent className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">Belum Ada Tugas Aktif</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Mahasiswa lainnya belum membuat pesanan baru atau semua tugas telah diklaim. Tekan refresh jika
              diperlukan.
            </p>
          </div>
        ) : (
          availableJobs.map((job) => {
            const sd = getServiceData(job.serviceType);
            const Icon = sd.icon;

            // Distance is an operational estimate for quick scanning.
            const randomDistanceMap: Record<string, string> = {
              'feed-item-1': '250m',
              'feed-item-2': '600m',
              'feed-item-3': '1.2km'
            };
            const distance = randomDistanceMap[job.id] || `${Math.floor(Math.random() * 800) + 150}m`;

            return (
              <div
                key={job.id}
                className="p-5 hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 text-left">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${sd.cls}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-navy-dark group-hover:text-teal transition-colors">
                        {job.serviceType === 'food'
                          ? 'Beli Makanan'
                          : job.serviceType === 'photocopy'
                            ? 'Fotokopi / Print'
                            : job.serviceType === 'laundry'
                              ? 'Antar Laundry'
                              : 'Ojek Kampus'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Jarak: ~{distance}</span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Dari:</span> {job.sourceLocation}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-teal">Ke:</span> {job.deliveryLocation}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 italic pt-1 max-w-md">"{job.details}"</p>
                  </div>
                </div>

                <div className="flex sm:flex-col justify-between items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tarif Tunai
                    </span>
                    <span className="text-sm font-extrabold text-[#119b50]">
                      Rp {Number(job.totalFee || job.fee).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded ml-1 sm:ml-0 inline-block">
                      {job.paymentMethod === 'DIGITAL' ? 'DIGITAL LUNAS' : 'COD'}
                    </span>
                  </div>

                  <button
                    onClick={() => onClaimJob(job.id)}
                    className="bg-teal hover:bg-teal-dark text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1 select-none cursor-pointer transition-all active:scale-95 shadow-xs"
                    id={`btn-claim-${job.id}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Ambil Tugas</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
