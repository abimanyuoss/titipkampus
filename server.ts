import { createServer as createHttpServer, type Server } from 'node:http';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import express, { type Express, type Request, type Response } from 'express';
import { clearSessionCookie, readSessionUserId, setSessionCookie } from './src/server/auth.js';
import { db } from './src/server/db.js';
import type { OrderStatus, PaymentMethod, ServiceType, User } from './src/types.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

type RealtimePayload = {
  type: string;
  message: string;
  data?: unknown;
};

// Rate limiting state
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 100; // requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);

  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimiter.entries()) {
    if (now > record.resetAt) {
      rateLimiter.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

const DEFAULT_PORT = 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PORT_RETRY_LIMIT = 10;

function getPort() {
  if (!process.env.PORT) return DEFAULT_PORT;

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT harus berupa angka valid antara 0 sampai 65535.');
  }

  return port;
}

function getListeningPort(server: Server, fallbackPort: number) {
  const address = server.address();
  if (typeof address === 'object' && address) return address.port;

  return fallbackPort;
}

function listenOnce(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      server.off('error', onError);
      server.off('listening', onListening);
    };
    const onError = (error: NodeJS.ErrnoException) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      const listeningPort = getListeningPort(server, port);
      cleanup();
      resolve(listeningPort);
    };

    server.listen(port, HOST);
    server.once('error', onError);
    server.once('listening', onListening);
  });
}

async function listenWithPortFallback(server: Server, preferredPort: number) {
  const canTryNextPort = !process.env.PORT && process.env.NODE_ENV !== 'production';
  const maxAttempts = canTryNextPort ? PORT_RETRY_LIMIT : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = preferredPort + attempt;

    try {
      const listeningPort = await listenOnce(server, port);
      console.log(`[TitipKampus] Server running at http://localhost:${listeningPort}`);
      return;
    } catch (error) {
      const listenError = error as NodeJS.ErrnoException;
      const isLastAttempt = attempt === maxAttempts - 1;

      if (listenError.code !== 'EADDRINUSE' || isLastAttempt) {
        const portHint =
          listenError.code === 'EADDRINUSE'
            ? `Port ${port} sedang dipakai. Tutup proses yang memakai port itu atau jalankan dengan PORT lain.`
            : `Server gagal bind ke port ${port}.`;
        throw new Error(portHint);
      }

      console.warn(`[TitipKampus] Port ${port} sedang dipakai, mencoba port ${port + 1}...`);
    }
  }
}

type CreateAppOptions = {
  hmrServer?: Server;
  serveFrontend?: boolean;
};

async function configureTitipKampusApp(app: Express, options: CreateAppOptions = {}) {
  const requiresConfiguredDatabase =
    process.env.NODE_ENV === 'production' || process.env.TITIPKAMPUS_DB_MODE === 'postgres';
  if (!process.env.DATABASE_URL && requiresConfiguredDatabase) {
    throw new Error('DATABASE_URL belum dikonfigurasi. Isi .env.local atau environment runtime.');
  }

  await db.ensureSeedData();

  const realtimeClients = new Map<string, Set<Response>>();

  app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.headers['x-forwarded-proto'] === 'https' || req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Rate limiting middleware
  app.use((req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Terlalu banyak request. Silakan coba lagi nanti.' });
      return;
    }
    next();
  });

  let ai: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'titipkampus-final'
            }
          }
        });
      }
    }
    return ai;
  }

  function pushToUser(userId: string, payload: RealtimePayload) {
    const clients = realtimeClients.get(userId);
    if (!clients) return;
    for (const client of clients) {
      client.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  function broadcast(payload: RealtimePayload) {
    for (const userId of realtimeClients.keys()) {
      pushToUser(userId, payload);
    }
  }

  async function getAuthenticatedUser(req: Request, res: Response): Promise<User | null> {
    const userId = readSessionUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Sesi tidak aktif. Silakan login kembali.' });
      return null;
    }

    const user = await db.getUser(userId);
    if (!user) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.' });
      return null;
    }

    return user;
  }

  async function getAdminUser(req: Request, res: Response): Promise<User | null> {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return null;
    if (user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Akses admin diperlukan.' });
      return null;
    }
    return user;
  }

  async function getStudentUser(req: Request, res: Response, actionLabel: string): Promise<User | null> {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return null;
    if (user.role === 'ADMIN') {
      res.status(403).json({ error: `Akun admin tidak dapat ${actionLabel}. Gunakan akun mahasiswa.` });
      return null;
    }
    return user;
  }

  function validateServiceType(value: string): value is ServiceType {
    return ['food', 'photocopy', 'laundry', 'ojek'].includes(value);
  }

  function validateOrderStatus(value: string): value is OrderStatus {
    return ['PENDING', 'ACCEPTED', 'DELIVERING', 'COMPLETED'].includes(value);
  }

  function validatePaymentMethod(value: string): value is PaymentMethod {
    return ['COD', 'DIGITAL'].includes(value);
  }

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      platform: 'TitipKampus',
      storage: db.getStorageMode(),
      realtime: 'server-sent-events',
      date: new Date().toISOString()
    });
  });

  app.get('/api/events', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Realtime TitipKampus aktif.' })}\n\n`);

    const clients = realtimeClients.get(user.id) || new Set<Response>();
    clients.add(res);
    realtimeClients.set(user.id, clients);

    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', message: 'connected' })}\n\n`);
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(res);
      if (clients.size === 0) realtimeClients.delete(user.id);
    });
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, email, phone, password } = req.body as Record<string, string>;

      if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
        return res.status(400).json({ error: 'Nama, email, nomor HP, dan password wajib diisi.' });
      }
      if (!email.endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'Gunakan email Gmail yang valid.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter.' });
      }

      const user = await db.createUser({ name, email, phone, password });
      setSessionCookie(res, user.id);
      res.status(201).json({ success: true, user });
    } catch (e: any) {
      const message = e?.code === 'P2002' ? 'Email sudah terdaftar.' : e.message || 'Gagal membuat akun.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as Record<string, string>;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi.' });
      }

      const user = await db.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Email atau password tidak cocok.' });
      }

      setSessionCookie(res, user.id);
      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Gagal login.' });
    }
  });

  app.post('/api/auth/otp/request', async (req: Request, res: Response) => {
    try {
      const { email } = req.body as Record<string, string>;
      if (!email) return res.status(400).json({ error: 'Email wajib diisi.' });
      const otp = await db.requestOtp(email, 'LOGIN');
      res.json({ success: true, expiresInSeconds: otp.expiresInSeconds, demoCode: otp.code });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Gagal membuat OTP.' });
    }
  });

  app.post('/api/auth/otp/login', async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body as Record<string, string>;
      if (!email || !code) return res.status(400).json({ error: 'Email dan kode OTP wajib diisi.' });
      const user = await db.authenticateWithOtp(email, code);
      if (!user) return res.status(401).json({ error: 'Kode OTP tidak valid atau kedaluwarsa.' });
      setSessionCookie(res, user.id);
      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Gagal login OTP.' });
    }
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    clearSessionCookie(res);
    res.json({ success: true });
  });

  app.get('/api/profile', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const provider = await db.getProviderByUserId(user.id);
    res.json({ user, provider: provider || null });
  });

  app.get('/api/orders', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    try {
      const orders = await db.getOrders();
      res.json(orders);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    const user = await getStudentUser(req, res, 'membuat pesanan');
    if (!user) return;

    try {
      const {
        serviceType,
        sourceLocation,
        deliveryLocation,
        details,
        fee,
        paymentMethod = 'COD',
        voucherCode
      } = req.body;

      if (
        !validateServiceType(serviceType) ||
        !sourceLocation ||
        !deliveryLocation ||
        !details ||
        !fee ||
        !validatePaymentMethod(paymentMethod)
      ) {
        return res.status(400).json({ error: 'Data pesanan tidak lengkap atau tidak valid.' });
      }

      const order = await db.createOrder({
        customerUserId: user.id,
        serviceType,
        sourceLocation,
        deliveryLocation,
        details,
        fee: Number(fee),
        paymentMethod,
        voucherCode
      });

      broadcast({
        type: 'order.created',
        message:
          paymentMethod === 'DIGITAL'
            ? 'Pesanan digital dibuat. Selesaikan pembayaran agar dapat diproses kurir.'
            : 'Pesanan COD baru tersedia untuk kurir aktif.',
        data: order
      });
      res.status(201).json({ success: true, order });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Gagal membuat order.' });
    }
  });

  app.post('/api/payment/otp', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const otp = await db.requestOtp(user.email, 'PAYMENT');
    res.json({ success: true, expiresInSeconds: otp.expiresInSeconds, demoCode: otp.code });
  });

  app.post('/api/orders/:id/pay', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    try {
      const { code } = req.body as Record<string, string>;
      const order = await db.markOrderPaid(req.params.id, user.id, code);
      if (!order) return res.status(400).json({ error: 'Pembayaran gagal. Cek OTP atau status order.' });

      broadcast({ type: 'payment.paid', message: 'Pembayaran digital terverifikasi.', data: order });
      res.json({ success: true, order });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Gagal memproses pembayaran.' });
    }
  });

  app.get('/api/vouchers', async (_req: Request, res: Response) => {
    const vouchers = await db.getVouchers();
    res.json(vouchers);
  });

  app.post('/api/provider/register', async (req: Request, res: Response) => {
    const user = await getStudentUser(req, res, 'mendaftar sebagai kurir');
    if (!user) return;

    try {
      const { ktmUrl, nim, faculty } = req.body as Record<string, string>;

      if (!nim || nim.trim().length < 6) {
        return res.status(400).json({ error: 'NIM mahasiswa aktif UMP wajib diisi.' });
      }
      if (!faculty?.trim()) {
        return res.status(400).json({ error: 'Fakultas asal wajib dipilih.' });
      }
      if (!ktmUrl?.trim()) {
        return res.status(400).json({ error: 'KTM wajib diunggah untuk verifikasi.' });
      }

      const provider = await db.registerProvider({
        userId: user.id,
        name: user.name,
        nim,
        faculty,
        ktmUrl
      });

      broadcast({
        type: 'provider.submitted',
        message: 'Pendaftaran kurir masuk ke antrean verifikasi admin.',
        data: provider
      });
      res.status(200).json({ success: true, provider });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/provider/toggle', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    try {
      const { providerId, isOnline } = req.body;
      const provider = await db.getProviderByUserId(user.id);

      if (!provider || provider.id !== providerId) {
        return res.status(403).json({ error: 'Akun kurir tidak sesuai dengan sesi aktif.' });
      }

      const updated = await db.toggleProviderAvailability(providerId, !!isOnline);
      if (!updated) return res.status(403).json({ error: 'Akun kurir belum disetujui admin.' });

      broadcast({ type: 'provider.availability', message: 'Status ketersediaan kurir diperbarui.', data: updated });
      res.json({ success: true, provider: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders/:id/claim', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    try {
      const { id } = req.params;
      const { providerId } = req.body;
      const provider = await db.getProviderByUserId(user.id);

      if (!provider || provider.id !== providerId) {
        return res.status(403).json({ error: 'Akun kurir tidak sesuai dengan sesi aktif.' });
      }

      const updatedOrder = await db.claimOrder(id, providerId);
      if (!updatedOrder) {
        return res.status(400).json({
          error:
            'Pesanan tidak tersedia, kurir offline/belum disetujui, pembayaran digital belum lunas, atau kurir tidak boleh mengambil pesanan sendiri.'
        });
      }

      broadcast({ type: 'order.claimed', message: 'Pesanan berhasil diklaim kurir.', data: updatedOrder });
      res.json({ success: true, order: updatedOrder });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders/:id/status', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    try {
      const { id } = req.params;
      const { status } = req.body;
      const provider = await db.getProviderByUserId(user.id);
      const order = await db.getOrder(id);

      if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      if (!provider || order.providerId !== provider.id) {
        return res.status(403).json({ error: 'Hanya kurir yang mengambil tugas ini yang dapat mengubah status.' });
      }
      if (!validateOrderStatus(status) || status === 'PENDING' || status === 'ACCEPTED') {
        return res.status(400).json({ error: 'Transisi status tidak valid.' });
      }

      const updatedOrder = await db.updateOrderStatus(id, status);
      broadcast({ type: 'order.status', message: `Status pesanan berubah menjadi ${status}.`, data: updatedOrder });
      res.json({ success: true, order: updatedOrder });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders/:id/review', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const order = await db.getOrder(id);

      if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      if (order.customerUserId !== user.id)
        return res.status(403).json({ error: 'Ulasan hanya bisa dikirim oleh pemesan.' });
      if (!rating) return res.status(400).json({ error: 'Rating diperlukan.' });

      const review = await db.addReview(id, Number(rating), comment || '', user.name);
      if (!review) return res.status(400).json({ error: 'Review hanya tersedia untuk pesanan selesai.' });

      broadcast({ type: 'review.created', message: 'Review baru diterbitkan.', data: review });
      res.json({ success: true, review });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/providers', async (req: Request, res: Response) => {
    const admin = await getAdminUser(req, res);
    if (!admin) return;
    res.json(await db.getPendingProviders());
  });

  app.post('/api/admin/providers/:id/moderate', async (req: Request, res: Response) => {
    const admin = await getAdminUser(req, res);
    if (!admin) return;

    const { decision } = req.body as { decision?: 'APPROVED' | 'REJECTED' };
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      return res.status(400).json({ error: 'Keputusan admin tidak valid.' });
    }

    const provider = await db.moderateProvider(req.params.id, decision);
    broadcast({
      type: 'provider.moderated',
      message: `Kurir ${provider.name} ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'} admin.`,
      data: provider
    });
    res.json({ success: true, provider });
  });

  app.get('/api/admin/analytics', async (req: Request, res: Response) => {
    const admin = await getAdminUser(req, res);
    if (!admin) return;
    res.json(await db.getAnalytics());
  });

  app.post('/api/ai/estimate', async (req: Request, res: Response) => {
    try {
      const { textInput } = req.body;
      if (!textInput || textInput.trim().length === 0) {
        return res.json({
          predictedType: 'food',
          source: '',
          destination: '',
          details: '',
          fee: 5000,
          insideUmp: true,
          explanation: 'Teks kosong, biaya diatur ke tarif dasar minimum.'
        });
      }

      const gemini = getGeminiClient();
      if (!gemini) {
        const normalized = textInput.toLowerCase();
        let service: ServiceType = 'food';
        if (normalized.includes('print') || normalized.includes('fotokopi') || normalized.includes('pdf'))
          service = 'photocopy';
        else if (normalized.includes('cuci') || normalized.includes('setrika') || normalized.includes('laundry'))
          service = 'laundry';
        else if (normalized.includes('anter') || normalized.includes('ojek') || normalized.includes('jemput'))
          service = 'ojek';

        let fee = 5000;
        if (service === 'laundry') fee = 8000;
        else if (service === 'ojek') fee = 6000;

        return res.json({
          predictedType: service,
          source: 'Landmark UMP (Estimasi)',
          destination: 'Gedung Kampus UMP (Estimasi)',
          details: textInput,
          fee,
          insideUmp: true,
          explanation: 'Estimasi lokal aktif karena GEMINI_API_KEY belum dikonfigurasi.'
        });
      }

      const systemInstruction = `
        Anda adalah parser AI untuk TitipKampus Universitas Muhammadiyah Purwokerto.
        Pilih salah satu layanan: food, photocopy, laundry, ojek.
        Ubah pesan mahasiswa menjadi JSON standar: lokasi penjemputan, lokasi pengantaran,
        detail pesanan, estimasi fee COD Rp 4.000 sampai Rp 15.000, dan validasi area UMP.
        Jika lokasi di luar Purwokerto/Dukuhwaluh/area UMP, insideUmp harus false.
      `;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Proses teks berikut: "${textInput}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedType: { type: Type.STRING },
              source: { type: Type.STRING },
              destination: { type: Type.STRING },
              details: { type: Type.STRING },
              fee: { type: Type.INTEGER },
              insideUmp: { type: Type.BOOLEAN },
              explanation: { type: Type.STRING }
            },
            required: ['predictedType', 'source', 'destination', 'details', 'fee', 'insideUmp', 'explanation']
          }
        }
      });

      const parsedAiData = JSON.parse((response.text || '{}').trim());
      res.json(parsedAiData);
    } catch (e: any) {
      console.error('Gemini processing error:', e);
      res.json({
        predictedType: 'food',
        source: 'Kantin UMP',
        destination: 'Perpustakaan UMP',
        details: req.body.textInput || 'Detail pesanan',
        fee: 6000,
        insideUmp: true,
        explanation: 'Diproses dengan parser lokal karena kendala model.'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' || !options.hmrServer ? false : { server: options.hmrServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (options.serveFrontend ?? true) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

export async function createTitipKampusApp(options: Omit<CreateAppOptions, 'hmrServer'> = {}) {
  const app = express();
  return configureTitipKampusApp(app, options);
}

async function startServer() {
  const app = express();
  const server = createHttpServer(app);
  await configureTitipKampusApp(app, { hmrServer: server, serveFrontend: true });
  await listenWithPortFallback(server, getPort());
}

if (process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    console.error('[TitipKampus] Failed to start server:', error);
    process.exit(1);
  });
}
