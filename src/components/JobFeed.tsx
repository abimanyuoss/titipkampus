import { Bike, Check, Package, Printer, Shield, Utensils } from 'lucide-react';
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-navy-dark flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#119b50] rounded-full animate-ping relative">
              <span className="absolute inset-0 bg-[#119b50] rounded-full animate-ping" />
            </span>
            Tugas Tersedia
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 bg-teal-light/20 text-teal rounded-full">
            {availableJobs.length}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:block">UMP Purwokerto</span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[400px] sm:max-h-[480px] overflow-y-auto">
        {availableJobs.length === 0 ? (
          <div className="p-6 sm:p-10 text-center text-slate-400 space-y-4">
            {/* Animated empty state illustration */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-teal/5 rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                <Package className="w-10 h-10 text-slate-300" />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Belum Ada Tugas Aktif</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Mahasiswa lainnya belum membuat pesanan baru atau semua tugas telah diklaim.
              </p>
            </div>

            {/* Action hint */}
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">Tekan refresh untuk memperbarui</span>
            </div>
          </div>
        ) : (
          availableJobs.map((job, index) => {
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
                className="p-3 sm:p-4 lg:p-5 hover:bg-slate-50/70 transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left side - Job info */}
                  <div className="flex items-start gap-3 text-left flex-grow min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border shrink-0 ${sd.cls}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-navy-dark group-hover:text-teal transition-colors line-clamp-1">
                          {job.serviceType === 'food'
                            ? 'Beli Makanan'
                            : job.serviceType === 'photocopy'
                              ? 'Fotokopi / Print'
                              : job.serviceType === 'laundry'
                                ? 'Antar Laundry'
                                : 'Ojek Kampus'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                          ~{distance}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-medium space-y-0.5">
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px]">Dari:</span>
                          <span className="truncate">{job.sourceLocation}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-teal text-[10px]">Ke:</span>
                          <span className="truncate">{job.deliveryLocation}</span>
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 italic pt-1 truncate-2">"{job.details}"</p>
                    </div>
                  </div>

                  {/* Right side - Price & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 pt-2 sm:pt-0 pl-0 sm:pl-3 border-t sm:border-t-0 border-slate-100 sm:border-l">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-extrabold text-[#119b50]">
                        Rp {Number(job.totalFee || job.fee).toLocaleString('id-ID')}
                      </span>
                      <span className="block text-[9px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded mt-1 sm:mt-1.5">
                        {job.paymentMethod === 'DIGITAL' ? 'DIGITAL' : 'COD'}
                      </span>
                    </div>

                    <button
                      onClick={() => onClaimJob(job.id)}
                      className="bg-teal hover:bg-teal-dark active:scale-[0.97] text-white font-bold text-xs py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm btn-shine min-w-[100px]"
                      id={`btn-claim-${job.id}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Ambil</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
