import { AlertOctagon, CreditCard, Info, MapPin, Navigation, TicketPercent } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { PaymentMethod, ServiceType, Voucher } from '../types';

interface OrderFormProps {
  serviceType: ServiceType;
  initialSource?: string;
  initialDestination?: string;
  initialDetails?: string;
  initialFee?: number;
  onSubmit: (data: {
    serviceType: ServiceType;
    sourceLocation: string;
    deliveryLocation: string;
    details: string;
    fee: number;
    paymentMethod: PaymentMethod;
    voucherCode?: string;
  }) => void;
  submitting?: boolean;
}

export default function OrderForm({
  serviceType,
  initialSource = '',
  initialDestination = '',
  initialDetails = '',
  initialFee = 5000,
  onSubmit,
  submitting = false
}: OrderFormProps) {
  const [source, setSource] = useState(initialSource);
  const [destination, setDestination] = useState(initialDestination);
  const [details, setDetails] = useState(initialDetails);
  const [fee, setFee] = useState(initialFee);
  const paymentMethod: PaymentMethod = 'COD';
  const [voucherCode, setVoucherCode] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state when assisted order details update the form.
  useEffect(() => {
    setSource(initialSource);
    setDestination(initialDestination);
    setDetails(initialDetails);
    setFee(initialFee);
  }, [initialSource, initialDestination, initialDetails, initialFee]);

  useEffect(() => {
    fetch('/api/vouchers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setVouchers(data))
      .catch(() => setVouchers([]));
  }, []);

  const sourceSuggestions: Record<ServiceType, string[]> = {
    food: ['Kantin Teknik (Saintek) UMP', 'Kantin FEB Kampus 1 UMP', 'Geprek Dekat Kampus', 'Kantin FK UMP'],
    photocopy: ['Koperasi Karyawan / Kopma UMP', 'Toko Buku & Stationery', 'Fotokopi Gerbang Belakang'],
    laundry: ['Laundry Kiloan Jl. Dukuhwaluh', 'Lapak Cuci Setrika', 'Express Laundry'],
    ojek: ['Masjid Ahmad Dahlan UMP', 'Gedung Rektorat UMP', 'Perpustakaan Pusat UMP']
  };

  const destSuggestions = [
    'Perpustakaan Pusat UMP Lt. 2',
    'Gedung F (FKIP) Ruang 304',
    'Laboratorium Komputer',
    'Gedung Kuliah FEB 2A',
    'Parkiran Lapangan Basket',
    'Gerbang Belakang'
  ];

  const handleApplySource = (val: string) => setSource(val);
  const handleApplyDest = (val: string) => setDestination(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!source.trim()) {
      setValidationError('Lokasi penjemputan awal harus diisi!');
      return;
    }
    if (!destination.trim()) {
      setValidationError('Lokasi pengantaran harus diisi!');
      return;
    }
    if (!details.trim()) {
      setValidationError('Tuliskan detail pesanan secara jelas!');
      return;
    }
    if (fee < 2000) {
      setValidationError('Biaya jasa minimum adalah Rp 2.000');
      return;
    }

    onSubmit({
      serviceType,
      sourceLocation: source,
      deliveryLocation: destination,
      details,
      fee: Number(fee),
      paymentMethod,
      voucherCode: voucherCode.trim() || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Source and Destination - Stack on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source Location */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] sm:text-xs font-bold text-navy-dark uppercase tracking-wider block">
            {serviceType === 'ojek' ? 'Titik Jemput' : 'Lokasi Penjemputan'}
          </label>
          <div className="relative">
            <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MapPin className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={serviceType === 'food' ? 'Kantin Teknik...' : 'Nama tempat...'}
              className="w-full pl-9 sm:pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              id="input-source-location"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] text-slate-400 self-center">Rek:</span>
            {sourceSuggestions[serviceType].slice(0, 2).map((sug) => (
              <button
                type="button"
                key={sug}
                onClick={() => handleApplySource(sug)}
                className="text-[9px] sm:text-[10px] bg-slate-100 hover:bg-slate-200/90 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                {sug.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Destination Location */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] sm:text-xs font-bold text-navy-dark uppercase tracking-wider block">
            Titik Pengantaran
          </label>
          <div className="relative">
            <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-teal">
              <Navigation className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Gedung F, Perpustakaan..."
              className="w-full pl-9 sm:pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              id="input-destination-location"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] text-slate-400 self-center">Rek:</span>
            {destSuggestions.slice(0, 2).map((sug) => (
              <button
                type="button"
                key={sug}
                onClick={() => handleApplyDest(sug)}
                className="text-[9px] sm:text-[10px] bg-slate-100 hover:bg-slate-200/90 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                {sug.replace('Perpustakaan Pusat ', 'Perpus ').replace('Laboratorium Komputer ', 'Labkom ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Details Area */}
      <div className="space-y-1.5 text-left">
        <label className="text-[11px] sm:text-xs font-bold text-navy-dark uppercase tracking-wider block">
          Rincian Pesanan
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            serviceType === 'food'
              ? 'Makanan & minuman lengkap beserta opsi (misal: Geprek level 3, es jeruk manis)'
              : serviceType === 'photocopy'
                ? 'Modul/jilid/warna yang dibutuhkan'
                : serviceType === 'laundry'
                  ? 'Berapa kg, cuci kering atau setrika'
                  : 'Titik jemput & yang perlu dibayar'
          }
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all resize-none min-h-[70px] sm:min-h-[80px]"
          id="input-details"
        />
      </div>

      {/* Fee & Payment Rule */}
      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-left space-y-0.5">
            <span className="text-[11px] sm:text-xs font-bold text-navy-dark uppercase tracking-wider block">
              Jasa Kurir
            </span>
            <div className="flex items-center gap-1 text-slate-500">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-[11px]">COD atau Digital OTP</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px] sm:text-xs text-slate-400">Tarif:</span>
            <div className="flex items-center">
              <span className="text-xs sm:text-sm font-bold text-slate-500 mr-1.5 sm:mr-2">Rp</span>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(Math.max(0, Number(e.target.value)))}
                step="500"
                className="w-24 sm:w-28 px-2 sm:px-2.5 py-1.5 sm:py-2 text-center font-extrabold text-teal bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none text-sm"
                id="input-order-fee"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method & Voucher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] sm:text-xs font-bold text-navy-dark uppercase tracking-wider block">
            Metode Pembayaran
          </label>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-bold text-slate-700">
            <CreditCard className="w-4 h-4 text-teal" />
            <span>COD (Bayar Tunai ke Kurir)</span>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-[11px] sm:text-xs font-bold text-navy-dark uppercase tracking-wider block">
            Voucher
          </label>
          <div className="relative">
            <TicketPercent className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Contoh: UMPHEMAT"
              className="w-full pl-9 sm:pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
            />
          </div>
          {vouchers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vouchers.slice(0, 2).map((voucher) => (
                <button
                  type="button"
                  key={voucher.code}
                  onClick={() => setVoucherCode(voucher.code)}
                  className="text-[9px] sm:text-[10px] bg-teal-light/20 hover:bg-teal-light/30 text-teal px-1.5 sm:px-2 py-0.5 rounded transition-colors cursor-pointer font-bold"
                  title={voucher.description}
                >
                  {voucher.code}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {validationError && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#119b50] hover:bg-emerald-action/90 active:scale-[0.98] py-3 sm:py-3.5 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm sm:text-base"
        id="btn-place-order"
      >
        <span>{submitting ? 'Mengirim...' : 'Pesan Sekarang'}</span>
      </button>
    </form>
  );
}
