import {
  Bell,
  Bike,
  Clock,
  ListTodo,
  LogOut,
  Package,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Utensils
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminShell from './components/AdminShell';
import AiAssistant from './components/AiAssistant';
import AuthScreen from './components/AuthScreen';
import JobFeed from './components/JobFeed';
import LandingPage from './components/LandingPage';
import Modal from './components/Modal';
import OrderForm from './components/OrderForm';
import ProfileEdit from './components/ProfileEdit';
import ProviderRegistration from './components/ProviderRegistration';
import ServiceSelector from './components/ServiceSelector';
import StatusTracker from './components/StatusTracker';
import { useToast } from './components/Toast';
import type { Order, OrderStatus, PaymentMethod, Provider, ServiceType, User } from './types';

// Constants
const SSE_RECONNECT_INTERVAL_MS = 30000;

export default function App() {
  // Global Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Interface navigation state
  const [selectedService, setSelectedService] = useState<ServiceType>('food');
  const [mode, setMode] = useState<'user' | 'provider'>('user');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'active' | 'history' | 'earnings'>('dashboard');

  // Assisted order detail helpers
  const [aiPreset, setAiPreset] = useState<{
    serviceType: ServiceType;
    sourceLocation: string;
    deliveryLocation: string;
    details: string;
    fee: number;
  } | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');

  // Loading & logs
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    'Selamat bergabung di TitipKampus UMP!',
    'Sistem operasional aktif: pelacakan real-time, OTP pembayaran, voucher, dan COD.'
  ]);

  // Toast notifications
  const { addToast } = useToast();

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);

  // Landing page state
  const [showLanding, setShowLanding] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Handle navigation from LandingPage to AuthScreen
  const handleShowLogin = () => {
    setAuthMode('login');
    setShowLanding(false);
  };

  const handleShowRegister = () => {
    setAuthMode('register');
    setShowLanding(false);
  };

  const handleShowRegisterAsCourier = () => {
    setAuthMode('register');
    setShowLanding(false);
    // After registration, user can become courier
  };

  // Fetch all core resources from server
  const fetchState = async () => {
    try {
      // 1. Load active user profile and associated courier account.
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.status === 401) {
        setCurrentUser(null);
        setCurrentProvider(null);
        setOrders([]);
        return;
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCurrentUser(profileData.user);
        setCurrentProvider(profileData.provider);
      }

      // 2. Load active order feeds
      const ordersResponse = await fetch('/api/orders');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }
    } catch (e) {
      console.error('Error fetching state from backend api server', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;
    const events = new EventSource('/api/events');
    events.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type !== 'heartbeat' && payload.type !== 'connected') {
        setNotifications((prev) => [payload.message, ...prev].slice(0, 12));
        fetchState();
      }
    };

    // Fallback refresh keeps the app resilient if SSE is interrupted.
    const interval = setInterval(fetchState, SSE_RECONNECT_INTERVAL_MS);
    return () => {
      events.close();
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  // Handle new order creation
  const handlePlaceOrder = async (orderData: {
    serviceType: ServiceType;
    sourceLocation: string;
    deliveryLocation: string;
    details: string;
    fee: number;
    paymentMethod: PaymentMethod;
    voucherCode?: string;
  }) => {
    setSubmittingOrder(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Pesanan belum dapat dikirim. Periksa kembali detail transaksi.');
      }

      if (result.success) {
        addToast(
          orderData.paymentMethod === 'DIGITAL'
            ? 'Pesanan digital dibuat. Selesaikan verifikasi OTP agar pesanan dapat diproses kurir.'
            : 'Pesanan berhasil diterbitkan. Sistem sedang menunggu kurir aktif mengambil tugas.',
          'success'
        );

        // Push local alert notification
        setNotifications((prev) => [
          `Pesanan baru (${orderData.serviceType.toUpperCase()}) berhasil diterbitkan!`,
          ...prev
        ]);

        // Clear assisted form data and refresh the order feed.
        setAiPreset(null);
        await fetchState();

        // Automatically switch to Active orders tab so they can track progress!
        setActiveTab('active');
      }
    } catch (e: any) {
      addToast(e.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Handle courier claims order
  const handleClaimJob = async (orderId: string) => {
    if (!currentProvider) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: currentProvider.id })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Pesanan belum dapat diklaim. Periksa status tugas terbaru.');
      }

      if (result.success) {
        addToast('Tugas berhasil diklaim. Silakan menuju lokasi penjemputan.', 'success');
        setNotifications((prev) => [`Anda mengklaim tugas baru di: ${result.order.sourceLocation}`, ...prev]);
        await fetchState();
        setActiveTab('active');
      }
    } catch (e: any) {
      addToast(e.message || 'Gagal memproses klaim', 'error');
    }
  };

  // Update ongoing task status transition
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        await response.json();
        addToast(`Status pesanan berhasil ditingkatkan menjadi: ${nextStatus}`, 'success');
        setNotifications((prev) => [
          `Status pesanan #${orderId.slice(0, 4).toUpperCase()} diperbarui ke ${nextStatus}`,
          ...prev
        ]);
        await fetchState();
      }
    } catch (e) {
      console.error('Error transitioning order status from workspace', e);
    }
  };

  // Cancel own PENDING order
  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal membatalkan pesanan.');

      addToast('Pesanan berhasil dibatalkan.', 'info');
      await fetchState();
    } catch (e: any) {
      addToast(e.message || 'Gagal membatalkan pesanan.', 'error');
    }
  };

  // Update profile after editing
  const handleProfileSave = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setEditingProfile(false);
    addToast('Profil berhasil diperbarui.', 'success');
  };

  // Submit Rating & Review
  const handleSubmitReview = async (orderId: string, rating: number, comment: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });

      if (response.ok) {
        addToast('Terima kasih atas kontribusi ulasan Anda!', 'success');
        await fetchState();
      }
    } catch (e) {
      console.error('Error submitting order client review star rating', e);
    }
  };

  const openStudentDashboard = () => {
    setMode('user');
    setActiveTab('dashboard');
    addToast('Anda kembali ke dashboard mahasiswa tanpa keluar akun.', 'info');
  };

  const openProviderDashboard = () => {
    setMode('provider');
    setActiveTab('dashboard');
    addToast(
      currentProvider
        ? 'Anda beralih ke dashboard kurir dalam akun yang sama.'
        : 'Lengkapi pendaftaran kurir dari akun mahasiswa yang sedang aktif.',
      'info'
    );
  };

  // Complete courier registration successfully.
  const handleRegistrationSuccess = (newProvider: Provider) => {
    setCurrentProvider(newProvider);
    setMode('provider');
    setActiveTab('dashboard');
    addToast('Berkas kurir terkirim. Akun akan aktif setelah admin memverifikasi KTM dan data kampus.', 'success');
    setNotifications((prev) => ['Pendaftaran kurir masuk antrean verifikasi admin.', ...prev]);
  };

  const handlePayOrder = async (orderId: string) => {
    try {
      const otpResponse = await fetch('/api/payment/otp', { method: 'POST' });
      const otpData = await otpResponse.json();
      if (!otpResponse.ok) throw new Error(otpData.error || 'Gagal meminta OTP pembayaran.');

      const code = window.prompt(
        `Kode OTP pembayaran: ${otpData.demoCode}\nMasukkan kode OTP untuk menyelesaikan pembayaran digital:`
      );
      if (!code) return;

      const payResponse = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const payData = await payResponse.json();
      if (!payResponse.ok) throw new Error(payData.error || 'Pembayaran gagal.');

      addToast('Pembayaran digital terverifikasi. Pesanan siap diproses kurir.', 'success');
      await fetchState();
    } catch (e: any) {
      addToast(e.message || 'Pembayaran gagal.', 'error');
    }
  };

  const handleLogout = () => {
    setConfirmModal({
      title: 'Konfirmasi Keluar',
      description: 'Anda akan keluar dari akun. Pesanan yang sedang berlangsung tetap dapat diproses kurir.',
      onConfirm: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setCurrentUser(null);
        setCurrentProvider(null);
        setOrders([]);
        setMode('user');
        setActiveTab('dashboard');
        setConfirmModal(null);
        addToast('Anda telah keluar dari akun.', 'info');
      }
    });
  };

  // Apply assisted order detail outputs safely.
  const handleApplyAiPreset = (data: {
    serviceType: ServiceType;
    sourceLocation: string;
    deliveryLocation: string;
    details: string;
    fee: number;
  }) => {
    setSelectedService(data.serviceType);
    setAiPreset(data);
    addToast('Rincian pesanan berhasil disusun ke dalam form.', 'info');
  };

  // Filter lists based on search string
  const getFilteredOrders = () => {
    if (!searchQuery) return orders;
    return orders.filter(
      (order) =>
        order.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.sourceLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deliveryLocation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f8] p-4 safe-area-top">
        <div className="w-full max-w-sm">
          {/* Logo Skeleton */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="w-14 h-14 bg-gradient-to-br from-navy to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <div className="skeleton skeleton-text w-32 h-6 rounded-md" />
              <div className="skeleton skeleton-text-sm w-20 h-3 rounded-md mt-1" />
            </div>
          </div>

          {/* Card Skeleton */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="skeleton skeleton-text w-40 h-5 rounded-md" />
              <div className="skeleton w-10 h-4 rounded-full" />
            </div>

            {/* Navigation skeleton */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>

            {/* Form skeleton */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="skeleton skeleton-text w-full h-10 rounded-lg" />
              <div className="skeleton skeleton-text w-full h-10 rounded-lg" />
              <div className="skeleton skeleton-text w-full h-20 rounded-lg" />
              <div className="skeleton skeleton-text w-full h-12 rounded-lg" />
            </div>

            {/* Button skeleton */}
            <div className="pt-4">
              <div className="skeleton w-full h-12 rounded-xl" />
            </div>
          </div>

          {/* Loading text */}
          <p className="text-center text-xs text-slate-400 mt-6 animate-pulse">Memuat Sistem TitipKampus UMP...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (showLanding) {
      return (
        <LandingPage
          onLogin={handleShowLogin}
          onRegister={handleShowRegister}
          onRegisterAsCourier={handleShowRegisterAsCourier}
        />
      );
    }
    return (
      <AuthScreen
        initialMode={authMode}
        onAuthenticated={async () => {
          setLoading(true);
          await fetchState();
        }}
        onBackToLanding={() => setShowLanding(true)}
      />
    );
  }

  if (currentUser.role === 'ADMIN') {
    return <AdminShell user={currentUser} onLogout={handleLogout} />;
  }

  const filteredOrders = getFilteredOrders();
  const personalActiveOrders = orders.filter(
    (order) => order.customerUserId === currentUser?.id && order.status !== 'COMPLETED'
  );
  const personalHistoryOrders = orders.filter(
    (order) =>
      (order.customerUserId === currentUser?.id || order.providerId === currentProvider?.id) &&
      order.status === 'COMPLETED'
  );
  const claimedActiveOrders = orders.filter(
    (order) => order.providerId === currentProvider?.id && order.status !== 'COMPLETED'
  );
  const courierStatus = currentProvider?.status || 'NOT_REGISTERED';
  const displayName = currentUser.name || 'Akun ini';
  const courierStatusView = {
    NOT_REGISTERED: {
      label: 'Belum Daftar',
      description: `${displayName} belum terdaftar sebagai kurir. Pendaftaran dapat dilakukan dari akun mahasiswa yang sama.`,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      action: 'Daftar Kurir'
    },
    PENDING_VERIFICATION: {
      label: 'Menunggu Verifikasi',
      description: `Data NIM, fakultas, dan KTM ${displayName} sudah masuk. Admin perlu menyetujui sebelum akun kurir aktif.`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      action: 'Lihat Status'
    },
    APPROVED: {
      label: 'Aktif',
      description: currentProvider?.isOnline
        ? `Akun kurir ${displayName} aktif dan sedang online untuk menerima tugas.`
        : `Akun kurir ${displayName} aktif. Aktifkan mode online saat siap menerima tugas.`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: 'Buka Dashboard Kurir'
    },
    REJECTED: {
      label: 'Ditolak',
      description: 'Pendaftaran kurir ditolak admin. Periksa kembali data KTM atau hubungi admin operasional.',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      action: 'Lihat Catatan'
    }
  }[courierStatus];

  return (
    <div className="min-h-screen flex bg-[#fbf9f8] text-slate-800 antialiased font-sans">
      {/* 1. SIDEBAR NAVIGATION - Desktop Only */}
      <aside
        className="w-72 bg-navy text-white px-5 py-6 flex flex-col justify-between shrink-0 border-r border-slate-800 shadow-xl hidden lg:flex"
        id="root-sidebar"
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#006a6a] rounded-xl flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-base tracking-tight leading-none block text-white">TitipKampus</span>
              <span className="text-[10px] text-teal-light font-bold block tracking-widest mt-0.5">UMP SERVICE</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
              Operasional Wilayah
            </span>
            <span className="text-xs font-semibold text-slate-100 block">
              Universitas Muhammadiyah Purwokerto (UMP)
            </span>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 text-left">
            <button
              onClick={() => {
                setActiveTab('dashboard');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#006a6a] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Dasbor Layanan</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('active');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'active'
                  ? 'bg-[#006a6a] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Tugas & Lacak</span>
              {(mode === 'user' ? personalActiveOrders.length : claimedActiveOrders.length) > 0 && (
                <span className="absolute right-3 top-3 w-4 h-4 bg-amber-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                  {mode === 'user' ? personalActiveOrders.length : claimedActiveOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#006a6a] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Arsip Riwayat</span>
            </button>

            {mode === 'provider' && currentProvider && (
              <button
                onClick={() => {
                  setActiveTab('earnings');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'earnings'
                    ? 'bg-[#006a6a] text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Pendapatan</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Context & Footer switcher */}
        <div className="space-y-4 pt-4 border-t border-slate-800 text-left">
          {currentUser && (
            <button
              onClick={() => {
                setEditingProfile(true);
                setActiveTab('dashboard');
              }}
              className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-slate-800 w-full text-left hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt="Avatar"
                className="w-10 h-10 object-cover rounded-full border border-teal"
              />
              <div className="text-xs flex-grow">
                <span className="font-extrabold text-slate-100 block">{currentUser.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                  {currentUser.memberStatus} Member
                </span>
              </div>
              <span className="text-[9px] text-teal-light font-semibold">Edit ▸</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
            <span>TitipKampus v2.0</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#119b50] rounded-full" /> Live
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN HUB INTERFACE */}
      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar header - Mobile optimized */}
        <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b border-slate-200 bg-white shadow-xs sticky top-0 z-40 safe-area-top">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-navy to-slate-800 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-extrabold text-sm text-navy-dark leading-tight">TitipKampus</span>
              <span className="text-[8px] text-teal font-bold leading-tight">UMP</span>
            </div>
          </div>

          {/* Center: Mobile Tab Navigation */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                activeTab === 'dashboard' ? 'bg-teal text-white' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all relative ${
                activeTab === 'active' ? 'bg-teal text-white' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              Lacak
              {(mode === 'user' ? personalActiveOrders.length : claimedActiveOrders.length) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center">
                  {mode === 'user' ? personalActiveOrders.length : claimedActiveOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                activeTab === 'history' ? 'bg-teal text-white' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              Arsip
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search - Desktop only */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari pesanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 lg:w-56 bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-full text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                id="header-search-input"
              />
            </div>

            {/* Notification - Desktop only */}
            <div className="relative group hidden md:block">
              <button
                aria-label="Buka notifikasi operasional"
                className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-colors cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
              {/* Dropdown list for instructions notification */}
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-xs font-medium space-y-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 text-left z-50">
                <span className="font-bold text-slate-800 block">Notifikasi</span>
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto space-y-1">
                  {notifications.map((notif, index) => (
                    <div key={index} className="py-2 text-slate-600 leading-relaxed font-sans">
                      {notif}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 rounded-lg transition-all cursor-pointer"
              aria-label="Keluar akun"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* 3. CONFIRMATION MODAL */}
        {confirmModal && (
          <Modal
            open={true}
            onClose={() => setConfirmModal(null)}
            title={confirmModal.title}
            description={confirmModal.description}
            footer={
              <>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-teal text-white rounded-lg text-xs font-semibold hover:bg-teal-dark cursor-pointer"
                >
                  Konfirmasi
                </button>
              </>
            }
          >
            <p className="text-sm text-slate-600">Apakah Anda yakin ingin melanjutkan?</p>
          </Modal>
        )}

        {/* 4. MASTER PANEL WRAPPERS */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-grow">
          {/* Active View Router Switcher */}
          {editingProfile && currentUser ? (
            <ProfileEdit user={currentUser} onSave={handleProfileSave} onBack={() => setEditingProfile(false)} />
          ) : (
            activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 stagger-enter">
                {/* --- PERSPECTIVE A: USER MODE DASHBOARD --- */}
                {mode === 'user' && (
                  <>
                    {/* Left Column (Forms and assisted order details) */}
                    <div className="col-span-1 xl:col-span-7 space-y-4 sm:space-y-6">
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden animate-slide-up">
                        {/* Gradient card wrapper */}
                        <div className="p-4 sm:p-6 bg-navy text-white text-left relative overflow-hidden">
                          <div className="absolute -right-10 -bottom-10 opacity-10">
                            <Sliders className="w-32 h-32 sm:w-48 sm:h-48" />
                          </div>
                          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                            Titip Apa Hari Ini di UMP?
                          </h2>
                          <p className="text-[11px] sm:text-xs text-slate-300 mt-1 max-w-md">
                            Butuh bantuan titip beli soto kantin teknik, print modul kopma, laundry kiloan, atau ojek ke
                            gerbang? Teman mahasiswa aktif UMP siap membantumu kapan saja!
                          </p>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                          {/* 4 core service selector tabs */}
                          <ServiceSelector
                            selectedService={selectedService}
                            onSelectService={(s) => {
                              setSelectedService(s);
                              setAiPreset(null);
                            }}
                          />

                          {/* Automated order assistance */}
                          <div className="border-t border-slate-100 pt-4 sm:pt-6">
                            <AiAssistant onApplyPreset={handleApplyAiPreset} />
                          </div>

                          {/* Order Placement form */}
                          <div className="border-t border-slate-150 pt-4 sm:pt-6">
                            <div className="mb-4 text-left">
                              <h4 className="font-extrabold text-sm text-navy-dark tracking-tight">
                                Form Rincian Layanan ({selectedService.toUpperCase()})
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                Sesuaikan lokasi dan biaya jika dirasa kurang pas.
                              </p>
                            </div>
                            <OrderForm
                              serviceType={selectedService}
                              initialSource={aiPreset?.sourceLocation}
                              initialDestination={aiPreset?.deliveryLocation}
                              initialDetails={aiPreset?.details}
                              initialFee={aiPreset?.fee}
                              onSubmit={handlePlaceOrder}
                              submitting={submittingOrder}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Jaminan Trust Banner */}
                      <div
                        className="bg-gradient-to-r from-teal-light/20 to-emerald-light/5 border border-teal/10 rounded-xl p-4 sm:p-5 text-left flex items-start gap-4 animate-slide-up"
                        style={{ animationDelay: '100ms' }}
                      >
                        <div className="w-10 h-10 bg-teal text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="space-y-1 text-slate-700">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-navy-dark">
                            Perlindungan Mahasiswa UMP
                          </h4>
                          <p className="text-xs leading-relaxed text-slate-500">
                            Setiap penukaran transaksi COD dan pengantaran diawasi secara internal. Jika barang hilang,
                            tidak sampai, atau terjadi pembatalan sepihak, silakan laporkan ke helpdesk Kampus.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Instructions & Quick Job Tracker list) */}
                    <div className="col-span-1 xl:col-span-5 space-y-4 sm:space-y-6">
                      <div
                        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-left space-y-3 shadow-card animate-slide-up"
                        style={{ animationDelay: '50ms' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                              Status Kurir {currentUser.name}
                            </span>
                            <h4 className="font-extrabold text-[#000c24] text-sm">Akun Kurir Kampus</h4>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${courierStatusView.badgeClass}`}
                          >
                            {courierStatusView.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{courierStatusView.description}</p>
                        <button
                          onClick={openProviderDashboard}
                          className="w-full py-2.5 px-4 bg-teal hover:bg-teal-dark active:scale-[0.98] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex justify-center items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{courierStatusView.action}</span>
                        </button>
                      </div>

                      {/* Active Order Progress Quick list */}
                      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <StatusTracker
                          orders={filteredOrders}
                          currentUserId={currentUser?.id || ''}
                          providerId={currentProvider?.id}
                          mode="user"
                          onUpdateStatus={handleUpdateOrderStatus}
                          onSubmitReview={handleSubmitReview}
                          onPayOrder={handlePayOrder}
                          onCancelOrder={handleCancelOrder}
                        />
                      </div>

                      {/* Operational guidelines card */}
                      <div
                        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-left space-y-3 shadow-card animate-slide-up"
                        style={{ animationDelay: '150ms' }}
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Petunjuk Fitur COD
                        </span>
                        <h4 className="font-extrabold text-[#000c24] text-xs">Aturan Main Layanan P2P TitipKampus</h4>
                        <ol className="list-decimal list-inside text-xs text-slate-600 leading-relaxed space-y-2 font-sans">
                          <li>
                            <strong>Konfirmasi Detail:</strong> Hubungi kurir untuk memastikan lokasi, barang, dan
                            nominal transaksi.
                          </li>
                          <li>
                            <strong>Siapkan Nominal COD:</strong> Pastikan uang tunai sesuai total yang tertera di form.
                          </li>
                          <li>
                            <strong>Konfirmasi Selesai:</strong> Jangan lupa tekan tombol "Selesai" jika barang sudah
                            Anda terima dengan selamat!
                          </li>
                        </ol>
                      </div>
                    </div>
                  </>
                )}

                {/* --- PERSPECTIVE B: COURIER MODE DASHBOARD --- */}
                {mode === 'provider' && currentProvider && currentProvider.status === 'APPROVED' && (
                  <>
                    {/* Left Column (Claimable Job feeds) */}
                    <div className="col-span-1 xl:col-span-7 space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between gap-4 animate-slide-up">
                        <div className="text-left">
                          <h2 className="text-base sm:text-lg font-extrabold text-navy-dark flex items-center gap-1.5">
                            Tugas Pengantaran Terbuka UMP
                            <span className="w-2 h-2 bg-emerald-action rounded-full animate-ping" />
                          </h2>
                          <p className="text-xs text-slate-500 hidden sm:block">
                            Pilihlah salah satu tugas di bawah ini untuk Anda klaim dan antarkan.
                          </p>
                        </div>
                        <button
                          onClick={fetchState}
                          className="p-2 sm:p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-500 cursor-pointer transition-colors shrink-0"
                          title="Perbarui daftar tugas"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                        <JobFeed orders={filteredOrders} currentUserId={currentUser.id} onClaimJob={handleClaimJob} />
                      </div>
                    </div>

                    {/* Right Column (Courier Status indicators & claimed active maps) */}
                    <div className="col-span-1 xl:col-span-5 space-y-4 sm:space-y-6">
                      {/* Courier current active metrics bar */}
                      <div
                        className="grid grid-cols-2 gap-3 sm:gap-4 animate-slide-up"
                        style={{ animationDelay: '100ms' }}
                      >
                        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 text-left shadow-card">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                            Dompet Kurir
                          </span>
                          <p className="text-lg sm:text-xl font-extrabold text-[#119b50]">
                            Rp {Number(currentProvider.balance).toLocaleString('id-ID')}
                          </p>
                          <span className="text-[9px] text-[#119b50]/80 block mt-1 font-bold">Siap dicairkan</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 text-left shadow-card">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                            Rating Anda
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-lg sm:text-xl font-extrabold text-navy-dark">
                              {currentProvider.rating || '5.0'}
                            </p>
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-1">
                            {currentProvider.reviewCount} ulasan
                          </span>
                        </div>
                      </div>

                      {/* Courier claimed tasks tracking list */}
                      <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                        <StatusTracker
                          orders={filteredOrders}
                          currentUserId={currentUser?.id || ''}
                          providerId={currentProvider.id}
                          mode="provider"
                          onUpdateStatus={handleUpdateOrderStatus}
                          onSubmitReview={handleSubmitReview}
                          onPayOrder={handlePayOrder}
                          onCancelOrder={handleCancelOrder}
                        />
                      </div>
                    </div>
                  </>
                )}

                {mode === 'provider' && currentProvider && currentProvider.status !== 'APPROVED' && (
                  <div className="col-span-1 max-w-2xl mx-auto bg-white border border-amber-200 rounded-xl p-5 sm:p-6 text-left shadow-card space-y-3 animate-slide-up">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 inline-block">
                      {currentProvider.status === 'REJECTED' ? 'Ditolak Admin' : 'Menunggu Verifikasi Admin'}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-navy-dark">Akun kurir belum aktif</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Data NIM, fakultas, dan KTM sudah tersimpan. Kurir baru hanya dapat menerima tugas setelah
                      diverifikasi admin untuk menjaga keamanan transaksi COD dan digital.
                    </p>
                    <button
                      onClick={openStudentDashboard}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      Kembali ke Dashboard Mahasiswa
                    </button>
                  </div>
                )}

                {/* Offline mode / Gate of entering registration if client hasn't joined courier pool */}
                {mode === 'provider' && !currentProvider && (
                  <div className="col-span-1 py-6 sm:py-10 animate-slide-up">
                    <ProviderRegistration onSuccess={handleRegistrationSuccess} onCancel={openStudentDashboard} />
                  </div>
                )}
              </div>
            )
          )}

          {/* Active View Router: LIST OF ACTIVE ORDERS OR JOBS */}
          {activeTab === 'active' && (
            <div className="max-w-3xl mx-auto space-y-4 stagger-enter">
              <StatusTracker
                orders={filteredOrders}
                currentUserId={currentUser?.id || ''}
                providerId={currentProvider?.id || null}
                mode={mode}
                onUpdateStatus={handleUpdateOrderStatus}
                onSubmitReview={handleSubmitReview}
                onPayOrder={handlePayOrder}
                onCancelOrder={handleCancelOrder}
              />
            </div>
          )}

          {/* Active View Router: HISTORY TRANSACTIONS */}
          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-left">
                  <h2 className="text-base sm:text-lg font-extrabold text-navy-dark">Arsip Riwayat Saling Bantu</h2>
                  <p className="text-xs text-slate-500">
                    Kumpulan riwayat tugas yang telah Anda selesaikan/terima di lingkungan UMP.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-slate-100 rounded text-slate-600 font-bold border border-slate-200 shrink-0">
                  {personalHistoryOrders.length} Selesai
                </span>
              </div>

              {personalHistoryOrders.length === 0 ? (
                <div className="border border-slate-200/60 bg-white shadow-xs rounded-xl p-8 sm:p-12 text-center text-slate-400 space-y-3 animate-slide-up">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center relative">
                    <Clock className="w-8 h-8 text-slate-300" />
                    <div className="absolute inset-0 bg-teal/5 rounded-2xl animate-pulse" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Arsip Riwayat Kosong</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Anda belum memiliki transaksi selesai. Mulai gunakan layanan atau ambil tugas kurir saat akun sudah
                    terverifikasi.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 stagger-enter">
                  {personalHistoryOrders.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start gap-4 text-left hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {hist.serviceType === 'food' ? (
                            <Utensils className="w-5 h-5 text-amber-600" />
                          ) : hist.serviceType === 'photocopy' ? (
                            <Printer className="w-5 h-5 text-blue-600" />
                          ) : hist.serviceType === 'laundry' ? (
                            <Shield className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Bike className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div className="space-y-0.5 flex-grow min-w-0">
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 px-2 py-0.5 rounded uppercase inline-block">
                            {hist.paymentMethod === 'DIGITAL' ? 'Selesai Digital' : 'Selesai COD'}
                          </span>
                          <p className="font-extrabold text-navy-dark text-xs sm:text-sm mt-1 truncate-2">
                            {hist.serviceType === 'food'
                              ? 'Makan'
                              : hist.serviceType === 'photocopy'
                                ? 'Fotokopi'
                                : hist.serviceType === 'laundry'
                                  ? 'Laundry'
                                  : 'Ojek Kampus'}{' '}
                            - {hist.details}
                          </p>
                          <span className="text-[10px] text-slate-400 block font-medium truncate">
                            Rute: {hist.sourceLocation} Ke {hist.deliveryLocation}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right space-y-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Pembayaran</span>
                        <p className="font-extrabold text-sm text-[#119b50]">
                          Rp {Number(hist.totalFee || hist.fee).toLocaleString('id-ID')}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400">
                          {hist.paymentMethod === 'DIGITAL' ? 'Digital OTP' : 'COD Tunai'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active View Router: EARNINGS REPORTS */}
          {activeTab === 'earnings' && mode === 'provider' && currentProvider && (
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-teal to-teal-dark p-5 sm:p-6 rounded-2xl text-white text-left shadow-lg relative overflow-hidden animate-slide-up">
                <div className="absolute right-0 top-0 opacity-10">
                  <TrendingUp className="w-48 h-48 sm:w-64 sm:h-64" />
                </div>
                <div className="space-y-1 relative">
                  <span className="text-[10px] sm:text-xs font-bold text-teal-light uppercase tracking-wider block">
                    Total Pendapatan Terverifikasi
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black">
                    Rp {Number(currentProvider.balance).toLocaleString('id-ID')}
                  </h2>
                  <p className="text-xs text-teal-light/80 block mt-1">
                    Telah dicairkan langsung ke lobi / loket Kopma UMP menggunakan KTM sah.
                  </p>
                </div>
              </div>

              <div className="text-left space-y-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h4 className="font-bold text-sm text-navy-dark">Detail Transaksi Pendapatan Anda</h4>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-card">
                  {orders
                    .filter((o) => o.providerId === currentProvider.id && o.status === 'COMPLETED')
                    .map((o) => (
                      <div
                        key={o.id}
                        className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-600"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">
                            Titipan {o.serviceType.toUpperCase()} - {o.customerName}
                          </p>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(o.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <span className="font-bold text-[#119b50] shrink-0">
                          +Rp {Number(o.fee).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation - iPhone safe area optimized */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 z-50"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-around gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all min-w-[52px] ${
                activeTab === 'dashboard' ? 'text-teal' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  activeTab === 'dashboard' ? 'bg-teal/10' : ''
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">Layanan</span>
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all relative min-w-[52px] ${
                activeTab === 'active' ? 'text-teal' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  activeTab === 'active' ? 'bg-teal/10' : ''
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              {(mode === 'user' ? personalActiveOrders.length : claimedActiveOrders.length) > 0 && (
                <span className="absolute top-0 right-0 bg-rose-500 text-white w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center">
                  {mode === 'user' ? personalActiveOrders.length : claimedActiveOrders.length}
                </span>
              )}
              <span className="text-[9px] font-bold mt-0.5">Lacak</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all min-w-[52px] ${
                activeTab === 'history' ? 'text-teal' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  activeTab === 'history' ? 'bg-teal/10' : ''
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">Arsip</span>
            </button>

            {mode === 'provider' && currentProvider && (
              <button
                onClick={() => setActiveTab('earnings')}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all min-w-[52px] ${
                  activeTab === 'earnings' ? 'text-teal' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    activeTab === 'earnings' ? 'bg-teal/10' : ''
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold mt-0.5">Pendapatan</span>
              </button>
            )}

            {/* Logout Button - Always visible */}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center p-1.5 rounded-lg transition-all text-slate-400 hover:text-rose-500 min-w-[52px]"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-rose-50">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">Keluar</span>
            </button>
          </div>
        </nav>

        {/* Spacer for bottom nav on mobile */}
        <div className="h-16 lg:hidden" />
      </div>
    </div>
  );
}
