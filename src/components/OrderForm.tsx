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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
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
    photocopy: ['Koperasi Karyawan / Kopma UMP', 'Toko Buku & Stationery Kampus 1', 'Fotokopi Gerbang Belakang'],
    laundry: ['Laundry Kiloan Jl. Dukuhwaluh', 'Lapak Cuci Setrika Mahasiswa', 'Express Laundry'],
    ojek: ['Masjid Ahmad Dahlan Kampus 1 UMP', 'Gedung Rektorat Kampus UMP', 'Perpustakaan Pusat UMP']
  };

  const destSuggestions = [
    'Perpustakaan Pusat UMP Lt. 2',
    'Gedung F (FKIP) Ruang 304',
    'Laboratorium Komputer Sastra',
    'Gedung Kuliah FEB Ruang Kelas 2A',
    'Parkiran Lapangan Basket',
    'Gerbang Belakang Kampus Dukuhwaluh'
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Location */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-navy-dark uppercase tracking-wider block">
            {serviceType === 'ojek' ? 'Titik Jemput Penumpang' : 'Lokasi Penjemputan / Pembelian'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-slate-400">
              <MapPin className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={
                serviceType === 'food' ? 'Kantin Teknik, Geprek Dekat kampus...' : 'Nama koperasi, toko atau lobi...'
              }
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              id="input-source-location"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] text-slate-400 self-center">Rekomendasi:</span>
            {sourceSuggestions[serviceType].slice(0, 3).map((sug) => (
              <button
                type="button"
                key={sug}
                onClick={() => handleApplySource(sug)}
                className="text-[9px] bg-slate-100 hover:bg-slate-200/90 text-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                {sug.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Destination Location */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-navy-dark uppercase tracking-wider block">
            Titik Pengantaran (Tujuan Anda)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3.5 text-teal">
              <Navigation className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Gedung F, Perpustakaan Lantai 2..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
              id="input-destination-location"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] text-slate-400 self-center">Rekomendasi:</span>
            {destSuggestions.slice(0, 3).map((sug) => (
              <button
                type="button"
                key={sug}
                onClick={() => handleApplyDest(sug)}
                className="text-[9px] bg-slate-100 hover:bg-slate-200/90 text-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                {sug.replace('Perpustakaan Pusat ', 'Perpus ').replace('Laboratorium Komputer ', 'Labkom ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Details Area */}
      <div className="space-y-1.5 text-left">
        <label className="text-xs font-bold text-navy-dark uppercase tracking-wider block">
          Rincian Spesifik Pesanan Anda
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            serviceType === 'food'
              ? 'Sebutkan makanan & minuman lengkap beserta opsi (misalnya: Geprek level 3, gak pake sayur, es jeruk manis)'
              : serviceType === 'photocopy'
                ? 'Sebutkan instruksi jilid / warna / modul kuliah apa'
                : serviceType === 'laundry'
                  ? 'Berapa kg perkiraan, cuci kering atau setrika saja'
                  : 'Beritahukan titik jemput spesifik dan apa yang perlu dibayar'
          }
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all resize-none min-h-[80px]"
          id="input-details"
        />
      </div>

      {/* Fee & Payment Rule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 items-center">
        <div className="text-left space-y-1">
          <span className="text-xs font-bold text-navy-dark uppercase tracking-wider block">Jasa Kurir Mahasiswa</span>
          <div className="flex items-center gap-1 text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span className="text-[10px]">Mendukung COD atau pembayaran digital dengan OTP</span>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <span className="text-xs text-slate-400">Atur Tarif Jasa:</span>
          <div className="flex items-center">
            <span className="text-sm font-bold text-slate-500 mr-2">Rp</span>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(Math.max(0, Number(e.target.value)))}
              step="500"
              className="w-28 px-2.5 py-1.5 text-center font-extrabold text-teal bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
              id="input-order-fee"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-navy-dark uppercase tracking-wider block">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            {(['COD', 'DIGITAL'] as PaymentMethod[]).map((method) => (
              <button
                type="button"
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  paymentMethod === method
                    ? 'bg-teal text-white border-teal'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-teal/40'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{method === 'COD' ? 'COD' : 'Digital OTP'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-navy-dark uppercase tracking-wider block">Voucher Otomatis</label>
          <div className="relative">
            <TicketPercent className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Contoh: UMPHEMAT"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
            />
          </div>
          {vouchers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vouchers.slice(0, 2).map((voucher) => (
                <button
                  type="button"
                  key={voucher.code}
                  onClick={() => setVoucherCode(voucher.code)}
                  className="text-[9px] bg-teal-light/20 hover:bg-teal-light/30 text-teal px-2 py-0.5 rounded transition-colors cursor-pointer font-bold"
                  title={voucher.description}
                >
                  {voucher.code} - Rp {voucher.discountAmount.toLocaleString('id-ID')}
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
        className="w-full bg-[#119b50] hover:bg-emerald-action/90 py-3.5 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        id="btn-place-order"
      >
        <span>{submitting ? 'Mengirim pesanan anda...' : 'Pesan Sekarang'}</span>
      </button>
    </form>
  );
}
