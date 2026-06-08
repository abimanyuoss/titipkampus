import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  RefreshCw,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AnalyticsSummary, Order, Provider, ServiceType } from '../types';

const serviceLabels: Record<ServiceType, string> = {
  food: 'Makanan',
  photocopy: 'Fotokopi',
  laundry: 'Laundry',
  ojek: 'Ojek'
};

const statusLabels: Record<Order['status'], string> = {
  PENDING: 'Menunggu Kurir',
  ACCEPTED: 'Diklaim',
  DELIVERING: 'Diantar',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatDateTime(value?: string) {
  if (!value) return 'Tanggal belum tersedia';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatElapsed(value?: string) {
  if (!value) return 'Baru masuk';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam`;
  return `${Math.round(hours / 24)} hari`;
}

function getProviderRisk(provider: Provider) {
  const ageHours = provider.createdAt ? (Date.now() - new Date(provider.createdAt).getTime()) / 3600000 : 0;
  if (!provider.nim || !provider.faculty || !provider.ktmUrl) {
    return {
      label: 'Data Perlu Dilengkapi',
      className: 'bg-rose-50 text-rose-700 border-rose-100'
    };
  }
  if (ageHours >= 24) {
    return {
      label: 'Prioritas SLA',
      className: 'bg-amber-50 text-amber-700 border-amber-100'
    };
  }
  return {
    label: 'Siap Ditinjau',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  };
}

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="grid grid-cols-[92px_1fr_36px] items-center gap-2 text-xs">
          <span className="text-slate-500 truncate">{item.label}</span>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-teal" style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
          <span className="text-right font-bold text-navy-dark">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    const [analyticsResponse, providersResponse, ordersResponse] = await Promise.all([
      fetch('/api/admin/analytics'),
      fetch('/api/admin/providers'),
      fetch('/api/orders')
    ]);

    if (analyticsResponse.ok) setAnalytics(await analyticsResponse.json());
    if (providersResponse.ok) setProviders(await providersResponse.json());
    if (ordersResponse.ok) setOrders(await ordersResponse.json());
    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const moderateProvider = async (providerId: string, decision: 'APPROVED' | 'REJECTED') => {
    const response = await fetch(`/api/admin/providers/${providerId}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    const result = await response.json();
    if (response.ok) {
      setMessage(`Kurir ${result.provider.name} ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'}.`);
      setSelectedProvider(null);
      await loadAdminData();
    } else {
      setMessage(result.error || 'Moderasi kurir belum berhasil diproses.');
    }
  };

  const dailyOrders = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 5 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (4 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        value: 0
      };
    });

    for (const order of orders) {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      const item = days.find((day) => day.key === key);
      if (item) item.value += 1;
    }

    return days.map(({ key: _key, ...item }) => item);
  }, [orders]);

  const serviceDistribution = useMemo(() => {
    const counts: Record<ServiceType, number> = { food: 0, photocopy: 0, laundry: 0, ojek: 0 };
    for (const order of orders) {
      counts[order.serviceType] += 1;
    }
    return Object.entries(counts).map(([key, value]) => ({
      label: serviceLabels[key as ServiceType],
      value
    }));
  }, [orders]);

  const recentActivities = useMemo(() => {
    const orderActivities = orders.slice(0, 5).map((order) => ({
      id: order.id,
      title: `Pesanan #${order.id.slice(0, 6).toUpperCase()} ${statusLabels[order.status].toLowerCase()}`,
      meta: `${serviceLabels[order.serviceType]} oleh ${order.customerName}`,
      time: formatDateTime(order.updatedAt || order.createdAt),
      tone: order.status === 'COMPLETED' ? 'bg-emerald-500' : order.status === 'PENDING' ? 'bg-amber-500' : 'bg-teal'
    }));

    const providerActivities = providers.slice(0, 3).map((provider) => ({
      id: provider.id,
      title: `Verifikasi kurir ${provider.name}`,
      meta: `${provider.faculty || 'Fakultas belum diisi'} - NIM ${provider.nim || '-'}`,
      time: formatDateTime(provider.createdAt),
      tone: 'bg-blue-500'
    }));

    return [...providerActivities, ...orderActivities].slice(0, 6);
  }, [orders, providers]);

  const averageClaimMinutes = useMemo(() => {
    const claimableRows = orders.filter((order) => order.providerId && order.status === 'ACCEPTED' && order.updatedAt);
    if (claimableRows.length === 0) return null;
    const totalMinutes = claimableRows.reduce((sum, order) => {
      return (
        sum +
        Math.max(1, Math.round((new Date(order.updatedAt!).getTime() - new Date(order.createdAt).getTime()) / 60000))
      );
    }, 0);
    return Math.round(totalMinutes / claimableRows.length);
  }, [orders]);

  const actionItems = analytics
    ? [
        {
          label: 'Kurir Menunggu Verifikasi',
          value: providers.length,
          description: 'Tinjau KTM, NIM, dan fakultas sebelum akun kurir aktif.',
          className:
            providers.length > 0
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-white text-slate-600',
          icon: UserCheck
        },
        {
          label: 'Pesanan Belum Diklaim > 30 Menit',
          value: analytics.staleUnclaimedOrders,
          description: 'Prioritaskan komunikasi ke kurir online atau helpdesk.',
          className:
            analytics.staleUnclaimedOrders > 0
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-slate-200 bg-white text-slate-600',
          icon: Clock
        },
        {
          label: 'Pembayaran Digital Menunggu',
          value: analytics.pendingDigitalPayments,
          description: 'Pantau pembayaran yang belum menyelesaikan OTP.',
          className:
            analytics.pendingDigitalPayments > 0
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : 'border-slate-200 bg-white text-slate-600',
          icon: CreditCard
        },
        {
          label: 'Rating Rendah',
          value: analytics.lowRatedProviders,
          description: 'Lakukan evaluasi layanan untuk kurir dengan rating di bawah standar.',
          className:
            analytics.lowRatedProviders > 0
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-slate-200 bg-white text-slate-600',
          icon: Star
        }
      ]
    : [];

  const kpiCards = analytics
    ? [
        {
          label: 'Total Pesanan',
          value: analytics.totalOrders.toLocaleString('id-ID'),
          detail: `${analytics.activeOrders} masih aktif`,
          icon: BarChart3,
          tone: 'text-blue-700 bg-blue-50 border-blue-100'
        },
        {
          label: 'Kurir Online',
          value: analytics.onlineProviders.toLocaleString('id-ID'),
          detail: `${analytics.approvedProviders} disetujui`,
          icon: Users,
          tone: 'text-emerald-700 bg-emerald-50 border-emerald-100'
        },
        {
          label: 'Antrean Verifikasi',
          value: analytics.pendingProviders.toLocaleString('id-ID'),
          detail: 'menunggu keputusan',
          icon: ShieldCheck,
          tone: 'text-amber-700 bg-amber-50 border-amber-100'
        },
        {
          label: 'GTV Selesai',
          value: formatCurrency(analytics.grossTransactionValue),
          detail: `${analytics.completedOrders} transaksi selesai`,
          icon: TrendingUp,
          tone: 'text-teal bg-teal-light/20 border-teal/10'
        },
        {
          label: 'Digital Menunggu',
          value: analytics.pendingDigitalPayments.toLocaleString('id-ID'),
          detail: `${analytics.digitalPaymentCount} total digital`,
          icon: CreditCard,
          tone: 'text-violet-700 bg-violet-50 border-violet-100'
        },
        {
          label: 'Rating Rata-rata',
          value: analytics.averageRating.toFixed(1),
          detail: analytics.lowRatedProviders > 0 ? `${analytics.lowRatedProviders} perlu ditinjau` : 'stabil',
          icon: Star,
          tone: 'text-amber-700 bg-amber-50 border-amber-100'
        }
      ]
    : [];

  const healthItems = analytics
    ? [
        ['Rata-rata klaim', averageClaimMinutes ? `${averageClaimMinutes} menit` : 'Belum tersedia'],
        ['Pesanan aktif tanpa kurir', analytics.unclaimedOrders.toLocaleString('id-ID')],
        ['Kurir online', analytics.onlineProviders.toLocaleString('id-ID')],
        ['Rating minggu ini', analytics.averageRating.toFixed(1)]
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-teal">Admin Operasional</span>
          <h2 className="text-xl font-extrabold text-navy-dark flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" />
            Dashboard Kendali TitipKampus
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Pantau verifikasi kurir, status pesanan, pembayaran, dan indikator layanan harian dalam satu layar kerja.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAdminData}
          className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {message && (
        <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200 rounded-lg p-4 text-left shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{card.label}</span>
                  <strong className="text-base text-navy-dark mt-1 block">{card.value}</strong>
                </div>
                <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${card.tone}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-2">{card.detail}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-left">
                <h3 className="font-bold text-sm text-navy-dark flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal" />
                  Antrean Verifikasi Kurir
                </h3>
                <p className="text-[11px] text-slate-500">
                  Periksa identitas sebelum kurir dapat mengambil tugas operasional.
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-1 font-bold">
                {providers.length} Menunggu
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data admin...</div>
            ) : providers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Tidak ada kurir yang menunggu verifikasi.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {providers.map((provider) => {
                  const risk = getProviderRisk(provider);
                  return (
                    <div key={provider.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 text-left">
                      <img
                        src={provider.ktmUrl}
                        alt={`KTM ${provider.name}`}
                        className="w-full lg:w-32 h-24 object-cover rounded-lg border border-slate-200 bg-slate-100"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm text-navy-dark block">{provider.name}</strong>
                          <span className={`text-[10px] font-bold rounded-full border px-2 py-0.5 ${risk.className}`}>
                            {risk.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                          <span>NIM: {provider.nim || '-'}</span>
                          <span className="truncate">{provider.faculty || 'Fakultas belum diisi'}</span>
                          <span>Masuk: {formatElapsed(provider.createdAt)} lalu</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedProvider(provider)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => moderateProvider(provider.id, 'APPROVED')}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => moderateProvider(provider.id, 'REJECTED')}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Tolak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-left space-y-4">
              <div>
                <h3 className="font-bold text-sm text-navy-dark">Pesanan 5 Hari Terakhir</h3>
                <p className="text-[11px] text-slate-500">Volume transaksi harian untuk monitoring operasional.</p>
              </div>
              <MiniBarChart data={dailyOrders} />
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-left space-y-4">
              <div>
                <h3 className="font-bold text-sm text-navy-dark">Komposisi Layanan</h3>
                <p className="text-[11px] text-slate-500">Distribusi jenis layanan yang paling sering digunakan.</p>
              </div>
              <MiniBarChart data={serviceDistribution} />
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-left space-y-4">
              <div>
                <h3 className="font-bold text-sm text-navy-dark">COD vs Digital</h3>
                <p className="text-[11px] text-slate-500">Perbandingan metode pembayaran aktif.</p>
              </div>
              <MiniBarChart
                data={[
                  { label: 'COD', value: analytics?.codPaymentCount || 0 },
                  { label: 'Digital', value: analytics?.digitalPaymentCount || 0 }
                ]}
              />
            </section>

            <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-left space-y-4">
              <div>
                <h3 className="font-bold text-sm text-navy-dark">Status Kurir</h3>
                <p className="text-[11px] text-slate-500">Komposisi kurir approved dan pending.</p>
              </div>
              <MiniBarChart
                data={[
                  { label: 'Disetujui', value: analytics?.approvedProviders || 0 },
                  { label: 'Menunggu', value: analytics?.pendingProviders || 0 }
                ]}
              />
            </section>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-left space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-navy-dark">Action Center</h3>
                <p className="text-[11px] text-slate-500">Prioritas kerja admin saat ini.</p>
              </div>
              <Activity className="w-4 h-4 text-teal" />
            </div>
            <div className="space-y-2">
              {actionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`border rounded-lg p-3 ${item.className}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold block">{item.label}</span>
                        <strong className="text-lg block mt-0.5">{item.value}</strong>
                      </div>
                      <Icon className="w-4 h-4 mt-0.5" />
                    </div>
                    <p className="text-[11px] leading-relaxed mt-2 opacity-80">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-left space-y-3">
            <div>
              <h3 className="font-bold text-sm text-navy-dark">Kesehatan Operasional</h3>
              <p className="text-[11px] text-slate-500">Indikator cepat untuk keputusan harian.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {healthItems.map(([label, value]) => (
                <div key={label} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">{label}</span>
                  <strong className="text-navy-dark">{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-left space-y-3">
            <div>
              <h3 className="font-bold text-sm text-navy-dark">Aktivitas Terbaru</h3>
              <p className="text-[11px] text-slate-500">Ringkasan perubahan penting di sistem.</p>
            </div>
            {recentActivities.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                Belum ada aktivitas terbaru.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-xs">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activity.tone}`} />
                    <div className="min-w-0">
                      <strong className="text-slate-700 block truncate">{activity.title}</strong>
                      <span className="text-slate-500 block truncate">{activity.meta}</span>
                      <span className="text-[10px] text-slate-400">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {selectedProvider && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal">Detail Verifikasi</span>
                <h3 className="text-base font-extrabold text-navy-dark mt-1">{selectedProvider.name}</h3>
                <p className="text-xs text-slate-500">
                  Masuk antrean pada {formatDateTime(selectedProvider.createdAt)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup detail verifikasi"
                onClick={() => setSelectedProvider(null)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-left">
              <img
                src={selectedProvider.ktmUrl}
                alt={`KTM ${selectedProvider.name}`}
                className="w-full h-56 object-cover rounded-lg border border-slate-200 bg-slate-100"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase block">NIM</span>
                  <strong className="text-slate-700">{selectedProvider.nim || '-'}</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase block">Fakultas</span>
                  <strong className="text-slate-700">{selectedProvider.faculty || '-'}</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase block">Status Risiko</span>
                  <strong className="text-slate-700">{getProviderRisk(selectedProvider).label}</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase block">Saldo Saat Ini</span>
                  <strong className="text-slate-700">{formatCurrency(selectedProvider.balance)}</strong>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Pastikan nama, NIM, fakultas, dan foto KTM konsisten sebelum menyetujui akun kurir.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => moderateProvider(selectedProvider.id, 'REJECTED')}
                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={() => moderateProvider(selectedProvider.id, 'APPROVED')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Setujui Kurir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
