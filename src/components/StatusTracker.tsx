import { CheckCircle, Package, Star, User } from 'lucide-react';
import { useState } from 'react';
import type { Order, OrderStatus } from '../types';

interface StatusTrackerProps {
  orders: Order[];
  currentUserId: string;
  providerId?: string | null;
  mode: 'user' | 'provider';
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onSubmitReview: (orderId: string, rating: number, comment: string) => void;
  onPayOrder?: (orderId: string) => void;
}

export default function StatusTracker({
  orders,
  currentUserId,
  providerId,
  mode,
  onUpdateStatus,
  onSubmitReview,
  onPayOrder
}: StatusTrackerProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [reviewedId, setReviewedId] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Filter orders matching current context
  const activeOrders = orders.filter((order) => {
    if (mode === 'user') {
      return order.customerUserId === currentUserId && order.status !== 'COMPLETED';
    } else {
      return order.providerId === providerId && order.status !== 'COMPLETED';
    }
  });

  const completedReviewPending = orders.filter((order) => {
    return mode === 'user' && order.customerUserId === currentUserId && order.status === 'COMPLETED';
  });

  const handleReviewSubmit = async (orderId: string) => {
    setSubmittingReview(true);
    try {
      await onSubmitReview(orderId, rating, comment);
      setReviewedId(orderId);
      setComment('');
      setRating(5);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const steps: { state: OrderStatus; label: string; desc: string }[] = [
    { state: 'PENDING', label: 'Menunggu', desc: 'Menunggu kurir' },
    { state: 'ACCEPTED', label: 'Diterima', desc: 'Kurir menuju' },
    { state: 'DELIVERING', label: 'Mengantar', desc: 'Barang di jalan' },
    { state: 'COMPLETED', label: 'Selesai', desc: 'Transaksi ok' }
  ];

  const getStepIndex = (status: OrderStatus) => {
    return steps.findIndex((s) => s.state === status);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title */}
      <div className="text-left">
        <h3 className="text-xs sm:text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2">
          {mode === 'user' ? (
            <>
              <Package className="w-4 h-4 text-teal" />
              <span>Pesanan Aktif Saya</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-teal" />
              <span>Tugas Aktif Kurir</span>
            </>
          )}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
          {mode === 'user' ? 'Pantau pesanan titipan Anda secara real-time.' : 'Kelola tugas yang sedang Anda proses.'}
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <div className="border border-slate-200/60 bg-white rounded-xl p-6 sm:p-8 text-center shadow-card">
          {/* Animated illustration */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-teal/5 rounded-full animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
              {mode === 'user' ? (
                <Package className="w-10 h-10 text-slate-300" />
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-600 mb-1">
            {mode === 'user' ? 'Belum Ada Pesanan Aktif' : 'Belum Ada Tugas Aktif'}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {mode === 'user'
              ? 'Buat pesanan baru melalui form layanan untuk memulai.'
              : 'Aktifkan mode online untuk mulai menerima tugas.'}
          </p>

          {/* Action hint */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-teal rounded-full animate-ping" />
            <span className="text-xs text-teal font-medium">
              {mode === 'user' ? 'Tab "Layanan" untuk buat pesanan' : 'Tunggu pesanan dari mahasiswa'}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 stagger-enter">
          {activeOrders.map((order) => {
            const currentIndex = getStepIndex(order.status);

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all animate-slide-up"
              >
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500">
                      #{order.id.slice(0, 6).toUpperCase()}
                    </span>
                    <h4 className="font-extrabold text-navy-dark text-sm">
                      {order.serviceType === 'food'
                        ? 'Titip Makanan'
                        : order.serviceType === 'photocopy'
                          ? 'Fotokopi / Print'
                          : order.serviceType === 'laundry'
                            ? 'Antar Laundry'
                            : 'Ojek Kampus'}
                    </h4>
                  </div>

                  <div className="text-left sm:text-right flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#119b50]">
                      Rp {Number(order.totalFee || order.fee).toLocaleString('id-ID')}
                    </span>
                    {order.discountAmount > 0 && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                        Hemat Rp {order.discountAmount.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Locations / Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-xs my-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Rute</span>
                    <p className="text-slate-600 font-medium">
                      <span className="text-slate-400">Dari:</span>{' '}
                      <span className="truncate">{order.sourceLocation}</span>
                    </p>
                    <p className="text-slate-700 font-medium">
                      <span className="text-teal">Ke:</span> <span className="truncate">{order.deliveryLocation}</span>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Detail</span>
                    <p className="font-medium text-slate-700 italic truncate-2">"{order.details}"</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-2 sm:space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status Progress
                  </span>

                  {/* Step bar - responsive */}
                  <div className="grid grid-cols-4 gap-1 relative">
                    {steps.map((st, sIdx) => {
                      const isCompletedStep = sIdx <= currentIndex;
                      const isActiveStep = sIdx === currentIndex;

                      return (
                        <div key={st.state} className="text-center space-y-1.5 relative z-10">
                          {/* Dot */}
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${
                              isCompletedStep ? 'bg-teal text-white' : 'bg-slate-200 text-slate-400'
                            } ${isActiveStep ? 'ring-4 ring-teal/20 animate-pulse' : ''}`}
                          >
                            {sIdx + 1}
                          </div>

                          {/* Label - hide on very small screens */}
                          <span
                            className={`block text-[9px] sm:text-[10px] font-bold ${
                              isCompletedStep ? 'text-teal-dark' : 'text-slate-400'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Person Box / Phone info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 mt-3 border-t border-slate-100 gap-3">
                  {/* Customer-side perspective: who is helping you? */}
                  {mode === 'user' && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Kurir</span>
                        <span className="font-bold text-slate-700">{order.providerName || 'Menunggu kurir...'}</span>
                      </div>
                    </div>
                  )}

                  {/* Courier-side perspective: who are you helping? */}
                  {mode === 'provider' && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Pemesan</span>
                        <span className="font-bold text-slate-700">{order.customerName}</span>
                      </div>
                    </div>
                  )}

                  {/* Operational actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {mode === 'user' &&
                      order.paymentMethod === 'DIGITAL' &&
                      order.paymentStatus === 'WAITING_PAYMENT' && (
                        <button
                          onClick={() => onPayOrder?.(order.id)}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                        >
                          Bayar OTP
                        </button>
                      )}

                    {mode === 'provider' && order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'DELIVERING')}
                        className="w-full sm:w-auto bg-teal hover:bg-teal-dark active:scale-[0.98] text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                      >
                        Mulai Antarkan
                      </button>
                    )}

                    {mode === 'provider' && order.status === 'DELIVERING' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                        className="w-full sm:w-auto bg-[#119b50] hover:bg-emerald-action/90 active:scale-[0.98] text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                      >
                        Tandai Selesai
                      </button>
                    )}

                    {mode === 'user' && order.status === 'PENDING' && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <span className="w-2 h-2 bg-teal rounded-full animate-ping" />
                        <span>Menunggu kurir...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Section */}
      {completedReviewPending.length > 0 && (
        <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-200 animate-slide-up">
          <div className="text-left">
            <h4 className="text-xs font-bold text-[#000c24] uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Beri Ulasan</span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {completedReviewPending.length}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Berikan rating dan catatan untuk transaksi yang telah selesai.
            </p>
          </div>

          <div className="space-y-3">
            {completedReviewPending.map((order) => {
              const isReviewed = reviewedId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-gradient-to-br from-amber-500/5 to-white border border-amber-200/50 rounded-xl p-4 sm:p-5 text-left space-y-3 shadow-card"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />#{order.id.slice(0, 6).toUpperCase()} (
                      {order.providerName})
                    </span>
                    <span className="text-slate-400 font-medium">Selesai</span>
                  </div>

                  {isReviewed ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Terima kasih! Ulasan Anda telah diterbitkan.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-start">
                        <span className="text-xs text-slate-500">Bintang:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((starValue) => (
                            <button
                              key={starValue}
                              type="button"
                              aria-label={`Beri rating ${starValue} dari 5`}
                              onClick={() => setRating(starValue)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${starValue <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <textarea
                          placeholder={`Tulis pengalaman layanan dari ${order.providerName || 'kurir'}... (opsional)`}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-400 transition-all min-h-[50px] resize-none"
                        />
                      </div>

                      <button
                        onClick={() => handleReviewSubmit(order.id)}
                        disabled={submittingReview}
                        className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] font-bold text-white text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                      >
                        {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
