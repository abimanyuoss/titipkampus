import { CheckCircle, Clock, Star, User } from 'lucide-react';
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
      // Reset
      setComment('');
      setRating(5);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const steps: { state: OrderStatus; label: string; desc: string }[] = [
    { state: 'PENDING', label: 'Menunggu Kurir', desc: 'Menunggu kurir mengambil tugas' },
    { state: 'ACCEPTED', label: 'Tugas Diterima', desc: 'Kurir menuju lokasi awal' },
    { state: 'DELIVERING', label: 'Sedang Diantar', desc: 'Barang sedang dibawa menuju Anda' },
    { state: 'COMPLETED', label: 'Transaksi Selesai', desc: 'Transaksi selesai dan pembayaran tercatat' }
  ];

  const getStepIndex = (status: OrderStatus) => {
    return steps.findIndex((s) => s.state === status);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-left">
        <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider">
          {mode === 'user' ? 'Pesanan Aktif Anda' : 'Tugas Aktif Kurir'}
        </h3>
        <p className="text-xs text-slate-500">
          {mode === 'user'
            ? 'Pantau pesanan titipan Anda secara real-time.'
            : 'Kelola tugas yang sedang Anda proses dan perbarui status pengantaran tepat waktu.'}
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <div className="border border-slate-200/60 bg-white shadow-xs rounded-xl p-8 text-center text-slate-400 space-y-2">
          <Clock className="w-10 h-10 stroke-1 mx-auto text-slate-300" />
          <p className="text-xs font-semibold">Belum Ada Aktivitas Berjalan</p>
          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
            {mode === 'user'
              ? 'Anda belum memiliki pesanan aktif. Buat pesanan baru melalui form layanan.'
              : 'Anda belum mengambil tugas. Periksa daftar tugas tersedia saat status kurir aktif.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const currentIndex = getStepIndex(order.status);

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 text-left"
              >
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500">
                      ID: {order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h4 className="font-extrabold text-navy-dark text-sm mt-1">
                      {order.serviceType === 'food'
                        ? 'Titip Makanan'
                        : order.serviceType === 'photocopy'
                          ? 'Fotokopi / Print'
                          : order.serviceType === 'laundry'
                            ? 'Antar Laundry'
                            : 'Ojek Kampus'}
                    </h4>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {order.paymentMethod === 'DIGITAL' ? 'Total Digital' : 'Ongkos COD'}
                    </span>
                    <span className="text-sm font-extrabold text-[#119b50]">
                      Rp {Number(order.totalFee || order.fee).toLocaleString('id-ID')}
                    </span>
                    {order.discountAmount > 0 && (
                      <span className="block text-[9px] text-amber-600 font-bold">
                        Hemat Rp {order.discountAmount.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Locations / Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Informasi Rute</span>
                    <p className="text-slate-600 font-medium">
                      <strong className="text-slate-400">Dari:</strong> {order.sourceLocation}
                    </p>
                    <p className="text-slate-700 font-medium">
                      <strong className="text-teal">Ke:</strong> {order.deliveryLocation}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Keterangan / Detail</span>
                    <p className="font-medium text-slate-700 italic">"{order.details}"</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status Berjalan
                  </span>

                  {/* Step bar */}
                  <div className="grid grid-cols-4 gap-1 relative">
                    {steps.map((st, sIdx) => {
                      const isCompletedStep = sIdx <= currentIndex;
                      const isActiveStep = sIdx === currentIndex;

                      return (
                        <div key={st.state} className="text-center space-y-1.5 relative z-10">
                          {/* Dot */}
                          <div
                            className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-colors ${
                              isCompletedStep ? 'bg-teal text-white' : 'bg-slate-200 text-slate-400'
                            } ${isActiveStep ? 'ring-4 ring-teal/20 animate-pulse' : ''}`}
                          >
                            {sIdx + 1}
                          </div>

                          {/* Label */}
                          <span
                            className={`block text-[9px] font-bold ${
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-slate-100 gap-4">
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
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {mode === 'user' &&
                      order.paymentMethod === 'DIGITAL' &&
                      order.paymentStatus === 'WAITING_PAYMENT' && (
                        <button
                          onClick={() => onPayOrder?.(order.id)}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                        >
                          Bayar Digital OTP
                        </button>
                      )}

                    {mode === 'provider' && order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'DELIVERING')}
                        className="w-full sm:w-auto bg-teal hover:bg-teal-dark text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                      >
                        Mulai Antarkan Barang
                      </button>
                    )}

                    {mode === 'provider' && order.status === 'DELIVERING' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                        className="w-full sm:w-auto bg-[#119b50] hover:bg-emerald-action/90 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                      >
                        Tandai Pesanan Selesai
                      </button>
                    )}

                    {mode === 'user' && order.status === 'PENDING' && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] italic">
                        <span className="w-2 h-2 bg-teal rounded-full animate-ping" />
                        <span>Menunggu kurir aktif...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Section (Under F-04: Rating & Ulasan) */}
      {completedReviewPending.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="text-left">
            <h4 className="text-xs font-bold text-[#000c24] uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Beri Ulasan Layanan</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Berikan rating dan catatan layanan untuk transaksi yang telah selesai.
            </p>
          </div>

          <div className="space-y-3">
            {completedReviewPending.map((order) => {
              const isReviewed = reviewedId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-gradient-to-br from-amber-500/5 to-white border border-amber-200/50 rounded-xl p-5 text-left space-y-3"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">
                      Tugas #{order.id.slice(0, 6).toUpperCase()} ({order.providerName})
                    </span>
                    <span className="text-slate-400 font-mono">Status: Selesai</span>
                  </div>

                  {isReviewed ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        Terima kasih! Ulasan Anda telah diterbitkan untuk meningkatkan reputasi {order.providerName}.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 justify-start">
                        <span className="text-xs text-slate-500 mr-2">Bintang:</span>
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <button
                            key={starValue}
                            type="button"
                            aria-label={`Beri rating ${starValue} dari 5`}
                            onClick={() => setRating(starValue)}
                            className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${starValue <= rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <textarea
                          placeholder={`Tuliskan pengalaman layanan dari ${order.providerName || 'kurir'}... (opsional)`}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-400 transition-all min-h-[50px] resize-none"
                        />
                      </div>

                      <button
                        onClick={() => handleReviewSubmit(order.id)}
                        disabled={submittingReview}
                        className="bg-amber-500 hover:bg-amber-600 font-bold text-white text-[11px] px-4 py-1.5 rounded-lg select-none cursor-pointer transition-all"
                      >
                        {submittingReview ? 'Kirim...' : 'Kirim Ulasan Bintang'}
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
