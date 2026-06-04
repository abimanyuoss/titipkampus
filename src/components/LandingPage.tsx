import {
  ArrowRight,
  Award,
  Bike,
  CheckCircle2,
  ChevronDown,
  Clock,
  Facebook,
  Globe,
  Heart,
  Instagram,
  MessageCircle,
  MessageSquare,
  Monitor,
  Phone,
  Printer,
  Shield,
  ShieldCheck,
  Shirt,
  Star,
  Twitter,
  UtensilsCrossed,
  Video,
  Wallet,
  Youtube
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onRegisterAsCourier?: () => void;
}

export default function LandingPage({ onLogin, onRegister, onRegisterAsCourier }: LandingPageProps) {
  const services = [
    {
      icon: UtensilsCrossed,
      title: 'Titip Makan',
      description: 'Kantin, warung, kafe di sekitar kampus',
      color: 'from-amber-500 to-orange-500',
      popular: true
    },
    {
      icon: Printer,
      title: 'Titip Fotokopi',
      description: 'Print modul, laporan, skripsi',
      color: 'from-blue-500 to-cyan-500',
      popular: false
    },
    {
      icon: Shirt,
      title: 'Titip Laundry',
      description: 'Kiloan, express, satuan',
      color: 'from-purple-500 to-pink-500',
      popular: false
    },
    {
      icon: Bike,
      title: 'Titip Ojek',
      description: 'Jemput & antar barang',
      color: 'from-emerald-500 to-teal-500',
      popular: false
    }
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: 'Aman & Terpercaya',
      description: 'Setiap kurir diverifikasi KTM resmi UMP'
    },
    {
      icon: Clock,
      title: 'Cepat & Tepat Waktu',
      description: 'Estimasi waktu yang transparan'
    },
    {
      icon: Heart,
      title: 'Saling Bantu',
      description: 'Platform peer-to-peer mahasiswa'
    },
    {
      icon: Star,
      title: 'Rating 5 Bintang',
      description: 'Sistem review untuk kurir terbaik'
    }
  ];

  const stats = [
    { value: '4', label: 'Layanan', icon: CheckCircle2 },
    { value: '100%', label: 'Verifikasi KTM', icon: Shield },
    { value: '24/7', label: 'Akses Platform', icon: Monitor },
    { value: 'Free', label: 'Biaya Layanan', icon: Heart }
  ];

  const impact = [
    { value: '100%', label: 'Tenaga kerja lokal mahasiswa UMP' },
    { value: '3.000+', label: 'Mahasiswa terbantu' },
    { value: '10.000+', label: 'Pesanan berhasil' }
  ];

  const safety = [
    {
      icon: Shield,
      title: 'Verifikasi Identitas',
      description: 'KTM & NIM diverifikasi admin sebelum kurir bisa aktif'
    },
    {
      icon: Video,
      title: 'Tracking Real-time',
      description: 'Pantau pesanan Anda secara langsung via SSE'
    },
    {
      icon: Phone,
      title: 'Dukungan 24/7',
      description: 'Tim helpdesk siap membantu kapan saja'
    },
    {
      icon: MessageSquare,
      title: 'Mediasi Cepat',
      description: 'Kami bantu selesaikan masalah antar pihak'
    }
  ];

  const courierBenefits = [
    { icon: Wallet, title: 'Pendapatan Tambahan', desc: 'Dapatkan uang dari setiap tugas yang Anda selesaikan' },
    { icon: Clock, title: 'Waktu Fleksibel', desc: 'Kerja sesuai jadwal kuliah Anda, tidak ada target minimum' },
    { icon: Award, title: 'Skill & Pengalaman', desc: 'Tingkatkansoft skill dan pengalaman kerja pertama Anda' },
    { icon: Shield, title: 'Aman & Terjamin', desc: 'Setiap transaksi dilindungi dan diverifikasi oleh admin' }
  ];

  const courierRequirements = [
    'Mahasiswa aktif Universitas Muhammadiyah Purwokerto (UMP)',
    'Memiliki Kartu Tanda Mahasiswa (KTM) yang masih berlaku',
    'Memiliki smartphone dengan koneksi internet',
    'Bertanggung jawab dan dapat diandalkan',
    'Memahami area kampus dan sekitarnya dengan baik'
  ];

  const faqs = [
    {
      question: 'Bagaimana cara memastikan kurir benar-benar mahasiswa UMP?',
      answer:
        'Setiap kurir harus upload foto KTM dan data NIM saat mendaftar. Admin memverifikasi ke database kampus sebelum akun kurir diaktifkan.'
    },
    {
      question: 'Bagaimana jika barang saya tidak sampai atau rusak?',
      answer:
        'Laporkan ke helpdesk dengan nomor pesanan. Kami akan mediasi antara Anda dan kurir. Untuk kasus yang jelas, kami bisa suspend akun kurir.'
    },
    {
      question: 'Apakah ada biaya tersembunyi?',
      answer:
        'Tidak. Biaya layanan platform adalah Rp0. Anda hanya paysongkir yang Anda tentukan sendiri di form pesanan.'
    },
    {
      question: 'Bagaimana jika kurir tidak menerima pesanan saya?',
      answer:
        'Pesanan Anda akan masuk ke feed dan bisa diklaim kurir lain. Jika tidak ada yang klaim dalam 30 menit, Anda bisa cancel tanpa biaya.'
    },
    {
      question: 'Apakah bisa titip barang di luar area kampus?',
      answer:
        'Saat ini layanan fokus di area kampus UMP dan sekitar 2km radius. Untuk kebutuhan lebih jauh, silakan hubungi kurir untuk konfirmasi.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-navy to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <span className="font-black text-lg lg:text-xl text-navy-dark tracking-tight">TitipKampus</span>
                <span className="text-[8px] lg:text-[9px] block text-teal font-bold tracking-widest -mt-1">
                  UMP SERVICE
                </span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              <a href="#layanan" className="text-sm font-medium text-slate-600 hover:text-teal transition-colors">
                Layanan
              </a>
              <a href="#cara-kerja" className="text-sm font-medium text-slate-600 hover:text-teal transition-colors">
                Cara Kerja
              </a>
              <a href="#keamanan" className="text-sm font-medium text-slate-600 hover:text-teal transition-colors">
                Keamanan
              </a>
              <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-teal transition-colors">
                FAQ
              </a>
              <a href="#kontak" className="text-sm font-medium text-slate-600 hover:text-teal transition-colors">
                Kontak
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm font-semibold text-navy hover:text-teal transition-colors cursor-pointer hidden sm:block"
              >
                Masuk
              </button>
              <button
                onClick={onRegister}
                className="px-5 py-2.5 bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white text-sm font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-teal/25"
              >
                Daftar Gratis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Grab Style */}
      <section className="pt-20 lg:pt-24 bg-gradient-to-br from-navy via-slate-900 to-navy relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white/90">Platform Resmi Mahasiswa UMP</span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight">
                  Titip Barang,
                  <br />
                  <span className="bg-gradient-to-r from-teal to-emerald-400 bg-clip-text text-transparent">
                    Hemat Waktu,
                  </span>
                  <br />
                  Saling Bantu.
                </h1>
                <p className="text-lg lg:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0">
                  Platform peer-to-peer untuk mahasiswa Universitas Muhammadiyah Purwokerto. Titip makan, fotokopi,
                  laundry, atau ojek — semua dalam satu aplikasi yang aman dan terpercaya.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal" />
                  <span className="text-sm font-medium text-white/80">Gratis Biaya Layanan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal" />
                  <span className="text-sm font-medium text-white/80">Verifikasi KTM</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal" />
                  <span className="text-sm font-medium text-white/80">COD Tunai</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={onRegister}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white font-bold rounded-xl transition-all cursor-pointer shadow-xl shadow-teal/30"
                >
                  <span className="text-lg">Daftar Gratis Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={onLogin}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
                >
                  <span className="text-lg">Masuk</span>
                </button>
              </div>
            </div>

            {/* Right - App Preview Mockup */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Phone Frame */}
                <div className="absolute -inset-4 bg-gradient-to-br from-teal/20 to-transparent rounded-3xl blur-xl" />
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700">
                  {/* App Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-slate-400">Selamat datang</p>
                      <p className="text-white font-bold">Mahasiswa UMP</p>
                    </div>
                    <div className="w-10 h-10 bg-teal/20 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5 text-teal" />
                    </div>
                  </div>

                  {/* Service Cards in App */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-sm font-semibold">Titip Soto Kantin FT</p>
                        <p className="text-slate-400 text-xs">Ke Gedung Rektorat • COD</p>
                      </div>
                      <span className="text-emerald-400 text-sm font-bold">Rp 8.000</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Printer className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-sm font-semibold">Print Modul 50 Lembar</p>
                        <p className="text-slate-400 text-xs">Ke Asrama Putri • COD</p>
                      </div>
                      <span className="text-emerald-400 text-sm font-bold">Rp 15.000</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Shirt className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-sm font-semibold">Laundry 3Kg Express</p>
                        <p className="text-slate-400 text-xs">Ke Kost Ananda • COD</p>
                      </div>
                      <span className="text-emerald-400 text-sm font-bold">Rp 20.000</span>
                    </div>
                  </div>

                  {/* Voucher Banner */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-300 text-xs font-bold">Voucher aktif:</span>
                      </div>
                      <span className="text-amber-400 font-black text-sm">UMPHEMAT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" role="img" aria-label="Wave divider">
            <title>Wave Divider</title>
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Stats Bar - Grab Style */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal/10 rounded-xl mb-3">
                  <stat.icon className="w-6 h-6 text-teal" />
                </div>
                <p className="text-3xl lg:text-4xl font-black text-navy-dark">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-teal-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-teal uppercase tracking-widest">Dampak Kami</span>
            <h2 className="text-3xl lg:text-4xl font-black text-navy-dark mt-2">Membuat Perbedaan untuk Kampus</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {impact.map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
                <p className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-teal to-emerald-500 bg-clip-text text-transparent">
                  {item.value}
                </p>
                <p className="text-slate-600 mt-3 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal uppercase tracking-widest">Layanan Kami</span>
            <h2 className="text-3xl lg:text-5xl font-black text-navy-dark mt-2 mb-4">
              Empat Layanan dalam Satu Aplikasi
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Semua kebutuhan kampus Anda dalam satu platform. Titip apa pun, kapan pun, di mana pun di area UMP.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative p-8 bg-white border border-slate-100 rounded-2xl hover:shadow-2xl hover:border-slate-200 transition-all duration-300 cursor-pointer"
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-teal to-teal-dark text-white text-xs font-bold rounded-full shadow-lg">
                    Paling Populer
                  </div>
                )}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-navy-dark mb-2">{service.title}</h3>
                <p className="text-slate-500">{service.description}</p>
                <div className="mt-6 flex items-center gap-2 text-teal font-semibold text-sm group-hover:gap-3 transition-all">
                  <span>Selengkapnya</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="cara-kerja"
        className="py-20 lg:py-28 bg-gradient-to-br from-navy via-slate-900 to-navy relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal uppercase tracking-widest">Cara Kerja</span>
            <h2 className="text-3xl lg:text-5xl font-black text-white mt-2 mb-4">Tiga Langkah Mudah</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Mulai dari pesan hingga selesai — proses yang simpel dan transparan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-teal to-teal-dark rounded-3xl flex items-center justify-center shadow-2xl shadow-teal/30">
                  <span className="text-4xl font-black text-white">01</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Pesan Layanan</h3>
              <p className="text-slate-300 leading-relaxed">
                Pilih jenis layanan, tentukan lokasi penjemputan dan pengantaran, beserta detail pesanan Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-teal to-teal-dark rounded-3xl flex items-center justify-center shadow-2xl shadow-teal/30">
                  <span className="text-4xl font-black text-white">02</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Konfirmasi & Bayar</h3>
              <p className="text-slate-300 leading-relaxed">
                Selesaikan pembayaran via COD tunai langsung ke kurir. Gunakan kode voucher untuk diskon.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-teal to-teal-dark rounded-3xl flex items-center justify-center shadow-2xl shadow-teal/30">
                  <span className="text-4xl font-black text-white">03</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Selesai & Ulas</h3>
              <p className="text-slate-300 leading-relaxed">
                Terima barang, berikan rating. Kurir kampus diverifikasi KTM untuk keamanan Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Security - Grab Style */}
      <section id="keamanan" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div>
              <span className="text-xs font-bold text-teal uppercase tracking-widest">Keamanan</span>
              <h2 className="text-3xl lg:text-5xl font-black text-navy-dark mt-2 mb-6">
                Keamanan & Kepercayaan
                <br />
                adalah Prioritas Kami
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Setiap transaksi di TitipKampus dilindungi dengan sistem verifikasi ketat dan dukungan 24/7. Kami
                memastikan pengalaman yang aman untuk seluruh civitas akademika UMP.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {safety.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-teal" />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-dark text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-teal/10 to-emerald-500/10 rounded-3xl blur-xl" />
              <div className="relative bg-gradient-to-br from-navy to-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">Verifikasi KTM 100%</p>
                      <p className="text-slate-300 text-sm">Setiap kurir identitasnya terverifikasi</p>
                    </div>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                    <div className="w-14 h-14 bg-teal/20 rounded-xl flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-teal" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">COD Tunai Langsung</p>
                      <p className="text-slate-300 text-sm">Bayar ke kurir saat barang diterima</p>
                    </div>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                    <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <Award className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">Voucher Eksklusif</p>
                      <p className="text-slate-300 text-sm">UMPHEMAT & KOPMA5000 siap digunakan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-50 to-teal-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal uppercase tracking-widest">Keunggulan</span>
            <h2 className="text-3xl lg:text-4xl font-black text-navy-dark mt-2">Mengapa Memilih TitipKampus?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-lg hover:border-teal/20 transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal/10 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-teal" />
                </div>
                <h3 className="font-bold text-navy-dark text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal uppercase tracking-widest">Testimoni</span>
            <h2 className="text-3xl lg:text-4xl font-black text-navy-dark mt-2">Apa Kata Mereka?</h2>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto">
              Dengarkan pengalaman mahasiswa UMP yang sudah menggunakan TitipKampus
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                "Super membantu! Biasanya saya antri 30 menit di kantin FT, sekarang tinggal titip via app dan makanan
                sampai di kelas. Kurir-nya ramah dan cepat."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-navy to-slate-800 rounded-full flex items-center justify-center text-teal font-bold">
                  MK
                </div>
                <div>
                  <p className="font-bold text-navy-dark text-sm">Mahasiswi FKIP</p>
                  <p className="text-slate-500 text-xs">Semester 6 • Titip Makan</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                "Print skripsi 200 halaman ga harus ke toko fotokopi lagi. Titip aja dari kos, selesai sama kurir
                diantar ke Laboratorium. Hemat waktu banget!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-navy to-slate-800 rounded-full flex items-center justify-center text-teal font-bold">
                  AR
                </div>
                <div>
                  <p className="font-bold text-navy-dark text-sm">Mahasiswa Teknik</p>
                  <p className="text-slate-500 text-xs">Semester 4 • Titip Fotokopi</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">
                "Laundry kiloan jadi lebih gampang. Tinggal pesan, besok pagi sudah bersih diantar. KTM kurir-nya dicek,
                jadi merasa aman transaksi."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-navy to-slate-800 rounded-full flex items-center justify-center text-teal font-bold">
                  SN
                </div>
                <div>
                  <p className="font-bold text-navy-dark text-sm">Mahasiswi Asrama Psikologi</p>
                  <p className="text-slate-500 text-xs">Titip Laundry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join as Courier Section - Grab Style */}
      <section
        id="courier"
        className="py-20 lg:py-28 bg-gradient-to-br from-navy to-slate-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-teal rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Benefits */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/20 border border-teal/30 rounded-full mb-6">
                <Bike className="w-4 h-4 text-teal" />
                <span className="text-xs font-bold text-teal">Jadi Bagian dari Kami</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black text-white mb-6">
                Tingkatkan Penghasilan
                <br />
                <span className="text-teal">Jadi Kurir TitipKampus</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Bergabunglah sebagai kurir dan bantu sesama mahasiswa mendapatkan kemudahan titip barang. Dapatkan
                penghasilan tambahan sambil kuliah.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courierBenefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-10 h-10 bg-teal/20 rounded-lg flex items-center justify-center shrink-0">
                      <benefit.icon className="w-5 h-5 text-teal" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{benefit.title}</h4>
                      <p className="text-slate-400 text-xs mt-1">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Requirements & CTA */}
            <div>
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Syarat Menjadi Kurir</h3>
                <ul className="space-y-4 mb-8">
                  {courierRequirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{req}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <button
                    onClick={onRegisterAsCourier}
                    className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-teal/30"
                  >
                    <span className="text-lg">Daftar Jadi Kurir</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <a
                    href="#faq"
                    className="block w-full text-center py-3 text-teal hover:text-teal-light font-semibold transition-colors"
                  >
                    Lihat FAQ Kurir →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl lg:text-4xl font-black text-navy-dark mt-2">Pertanyaan yang Sering Diajukan</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-navy-dark text-sm lg:text-base pr-4">{faq.question}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="kontak" className="py-20 lg:py-28 bg-gradient-to-br from-teal to-teal-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">Butuh Bantuan?</h2>
          <p className="text-xl text-teal-light max-w-2xl mx-auto mb-10">
            Hubungi tim kami jika ada pertanyaan, keluhan, atau saran untuk meningkatkan layanan TitipKampus.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-100 text-navy-dark font-bold rounded-xl transition-all shadow-xl"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-lg">Hubungi via WhatsApp</span>
            </a>
            <a
              href="mailto:helpdesk@titipkampus.ump.ac.id"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all"
            >
              <span className="text-lg">Email Helpdesk</span>
            </a>
          </div>

          <p className="text-teal-light/80 text-sm mt-8">Helpdesk aktif: Senin - Jumat, 08.00 - 17.00 WIB</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-28 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">Siap Memulai?</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Bergabung dengan ribuan mahasiswa UMP yang sudah merasakan kemudahan TitipKampus. Daftar gratis dan mulai
            titip barang hari ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRegister}
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white font-bold rounded-xl transition-all shadow-xl shadow-teal/30"
            >
              <span className="text-xl">Daftar Gratis Sekarang</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Grab Style */}
      <footer className="bg-slate-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-navy to-slate-800 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-teal" />
                </div>
                <div>
                  <span className="font-black text-xl text-white">TitipKampus</span>
                  <span className="text-[9px] block text-teal font-bold tracking-widest">UMP SERVICE</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Platform peer-to-peer untuk mahasiswa Universitas Muhammadiyah Purwokerto.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-teal rounded-lg flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-5 h-5 text-slate-400 hover:text-white" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-teal rounded-lg flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5 text-slate-400 hover:text-white" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-teal rounded-lg flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-5 h-5 text-slate-400 hover:text-white" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-teal rounded-lg flex items-center justify-center transition-colors"
                >
                  <Youtube className="w-5 h-5 text-slate-400 hover:text-white" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-white mb-4">Layanan</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#layanan" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Titip Makan
                  </a>
                </li>
                <li>
                  <a href="#layanan" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Titip Fotokopi
                  </a>
                </li>
                <li>
                  <a href="#layanan" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Titip Laundry
                  </a>
                </li>
                <li>
                  <a href="#layanan" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Titip Ojek
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4">Perusahaan</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#cara-kerja" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a href="#keamanan" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Keamanan
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#kontak" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Hubungi Kami
                  </a>
                </li>
              </ul>
            </div>

            {/* Courier */}
            <div>
              <h4 className="font-bold text-white mb-4">Jadi Kurir</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#courier" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Benefit Kurir
                  </a>
                </li>
                <li>
                  <a href="/courier-terms" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Syarat & Ketentuan
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    FAQ Kurir
                  </a>
                </li>
                <li>
                  <button
                    onClick={onRegisterAsCourier}
                    className="text-teal hover:text-teal-light transition-colors text-sm font-semibold cursor-pointer"
                  >
                    Daftar Jadi Kurir →
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-white mb-4">Bantuan</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#faq" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#kontak" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Hubungi Kami
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Kebijakan Privasi
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-slate-400 hover:text-teal transition-colors text-sm">
                    Syarat & Ketentuan
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2024 TitipKampus UMP. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="/privacy" className="hover:text-teal transition-colors">
                Kebijakan Privasi
              </a>
              <a href="/terms" className="hover:text-teal transition-colors">
                Syarat & Ketentuan
              </a>
              <a href="#kontak" className="hover:text-teal transition-colors">
                Bantuan
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
