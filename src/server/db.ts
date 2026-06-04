import {
  PrismaClient,
  type Order as PrismaOrder,
  type Provider as PrismaProvider,
  type Review as PrismaReview,
  type User as PrismaUser,
  type Voucher as PrismaVoucher
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import type {
  AnalyticsSummary,
  Order,
  OrderStatus,
  PaymentMethod,
  Provider,
  Review,
  ServiceType,
  User,
  Voucher
} from '../types.js';
import { InMemoryTitipKampusDB } from './memory-db.js';
import { getSeedAdminUser, getSeedStudentUser, type SeedUserConfig } from './seed-config.js';

const prisma = new PrismaClient();

type CreateOrderInput = {
  customerUserId: string;
  serviceType: ServiceType;
  sourceLocation: string;
  deliveryLocation: string;
  details: string;
  fee: number;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
};

type RegisterProviderInput = {
  userId: string;
  name: string;
  nim: string;
  faculty: string;
  ktmUrl: string;
};

type CreateUserInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

function toUser(user: PrismaUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
    memberStatus: user.memberStatus as User['memberStatus'],
    phone: user.phone,
    role: user.role
  };
}

function toProvider(provider: PrismaProvider): Provider {
  return {
    id: provider.id,
    userId: provider.userId,
    name: provider.name,
    nim: provider.nim,
    faculty: provider.faculty,
    ktmUrl: provider.ktmUrl,
    isOnline: provider.isOnline,
    balance: provider.balance,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    status: provider.status,
    createdAt: provider.createdAt.toISOString()
  };
}

function toOrder(order: PrismaOrder & { provider?: PrismaProvider | null; customer?: PrismaUser | null }): Order {
  const totalFee = order.totalFee || Math.max(0, order.fee - order.discountAmount);
  return {
    id: order.id,
    customerUserId: order.customerUserId,
    customerName: order.customer?.name || 'Mahasiswa UMP',
    providerId: order.providerId,
    providerName: order.provider?.name || null,
    serviceType: order.serviceType as ServiceType,
    sourceLocation: order.sourceLocation,
    deliveryLocation: order.deliveryLocation,
    details: order.details,
    fee: order.fee,
    discountAmount: order.discountAmount,
    totalFee,
    status: order.status as OrderStatus,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference,
    voucherCode: order.voucherCode
  };
}

function toReview(review: PrismaReview): Review {
  return {
    id: review.id,
    orderId: review.orderId,
    providerId: review.providerId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    fromName: review.fromName
  };
}

function toVoucher(voucher: PrismaVoucher): Voucher {
  return {
    code: voucher.code,
    description: voucher.description,
    discountAmount: voucher.discountAmount,
    minimumFee: voucher.minimumFee,
    redemptionCount: voucher.redemptionCount,
    isActive: voucher.isActive,
    expiresAt: voucher.expiresAt?.toISOString() || null
  };
}

function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toSeedUserData(seedUser: SeedUserConfig, passwordHash: string) {
  return {
    name: seedUser.name,
    email: seedUser.email,
    avatar: seedUser.avatar,
    memberStatus: seedUser.memberStatus,
    phone: seedUser.phone,
    role: seedUser.role,
    passwordHash
  };
}

type DatabaseStorageMode = 'neon-postgresql' | 'in-memory';

type DatabaseDelegate = {
  ensureSeedData(): Promise<void>;
  createUser(input: CreateUserInput): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  requestOtp(email: string, purpose: 'LOGIN' | 'PAYMENT'): Promise<{ code: string; expiresInSeconds: number }>;
  authenticateWithOtp(email: string, code: string): Promise<User | null>;
  consumeOtp(email: string, code: string, purpose: 'LOGIN' | 'PAYMENT'): Promise<boolean>;
  getUser(id: string): Promise<User | undefined>;
  getProvider(providerId: string): Promise<Provider | undefined>;
  getProviderByUserId(userId: string): Promise<Provider | undefined>;
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(orderData: CreateOrderInput): Promise<Order>;
  markOrderPaid(orderId: string, userId: string, otpCode: string): Promise<Order | undefined>;
  registerProvider(input: RegisterProviderInput): Promise<Provider>;
  toggleProviderAvailability(providerId: string, isOnline: boolean): Promise<Provider | undefined>;
  claimOrder(orderId: string, providerId: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | undefined>;
  addReview(orderId: string, rating: number, comment: string, fromName: string): Promise<Review | undefined>;
  getVouchers(): Promise<Voucher[]>;
  getPendingProviders(): Promise<Provider[]>;
  moderateProvider(providerId: string, decision: 'APPROVED' | 'REJECTED'): Promise<Provider>;
  getAnalytics(): Promise<AnalyticsSummary>;
};

function shouldUseMemoryDatabase() {
  return process.env.TITIPKAMPUS_DB_MODE === 'memory';
}

function canFallbackToMemory(error: unknown) {
  if (process.env.NODE_ENV === 'production' || process.env.TITIPKAMPUS_DB_MODE === 'postgres') return false;

  const message = error instanceof Error ? error.message : String(error);
  return /Can't reach database server|P1001|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Environment variable not found/i.test(
    message
  );
}

function getStartupErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.split('\n').find(Boolean) || error.message;
  return String(error);
}

export class TitipKampusDB {
  async ensureSeedData() {
    const seedUsers = [getSeedAdminUser(), getSeedStudentUser()].filter((user): user is SeedUserConfig =>
      Boolean(user)
    );

    for (const seedUser of seedUsers) {
      const passwordHash = await bcrypt.hash(seedUser.password, 12);
      const userData = toSeedUserData(seedUser, passwordHash);

      await prisma.user.upsert({
        where: { id: seedUser.id },
        update: userData,
        create: {
          id: seedUser.id,
          ...userData
        }
      });
    }

    await prisma.voucher.upsert({
      where: { code: 'UMPHEMAT' },
      update: {
        description: 'Potongan Rp 2.000 untuk transaksi minimal Rp 7.000.',
        discountAmount: 2000,
        minimumFee: 7000,
        maxRedemptions: null,
        isActive: true,
        expiresAt: null
      },
      create: {
        code: 'UMPHEMAT',
        description: 'Potongan Rp 2.000 untuk transaksi minimal Rp 7.000.',
        discountAmount: 2000,
        minimumFee: 7000,
        maxRedemptions: null,
        isActive: true,
        expiresAt: null
      }
    });

    await prisma.voucher.upsert({
      where: { code: 'KOPMA5000' },
      update: {
        description: 'Potongan Rp 5.000 untuk transaksi minimal Rp 15.000.',
        discountAmount: 5000,
        minimumFee: 15000,
        maxRedemptions: null,
        isActive: true,
        expiresAt: null
      },
      create: {
        code: 'KOPMA5000',
        description: 'Potongan Rp 5.000 untuk transaksi minimal Rp 15.000.',
        discountAmount: 5000,
        minimumFee: 15000,
        maxRedemptions: null,
        isActive: true,
        expiresAt: null
      }
    });
  }

  async createUser(input: CreateUserInput) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        passwordHash
      }
    });
    return toUser(user);
  }

  async authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? toUser(user) : null;
  }

  async requestOtp(email: string, purpose: 'LOGIN' | 'PAYMENT') {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const code = createOtpCode();
    await prisma.otpCode.create({
      data: {
        userId: user?.id,
        email: normalizedEmail,
        codeHash: await bcrypt.hash(code, 10),
        purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    return { code, expiresInSeconds: 300 };
  }

  async authenticateWithOtp(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const valid = await this.consumeOtp(normalizedEmail, code, 'LOGIN');
    if (!valid) return null;

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    return user ? toUser(user) : null;
  }

  async consumeOtp(email: string, code: string, purpose: 'LOGIN' | 'PAYMENT') {
    const otp = await prisma.otpCode.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
    if (!otp) return false;

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) return false;

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() }
    });
    return true;
  }

  async getUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toUser(user) : undefined;
  }

  async getProvider(providerId: string) {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    return provider ? toProvider(provider) : undefined;
  }

  async getProviderByUserId(userId: string) {
    const provider = await prisma.provider.findUnique({ where: { userId } });
    return provider ? toProvider(provider) : undefined;
  }

  async getOrders() {
    const orders = await prisma.order.findMany({
      include: { provider: true, customer: true },
      orderBy: { createdAt: 'desc' }
    });
    return orders.map(toOrder);
  }

  async getOrder(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { provider: true, customer: true }
    });
    return order ? toOrder(order) : undefined;
  }

  async createOrder(orderData: CreateOrderInput) {
    const fee = Math.max(2000, Math.round(orderData.fee));
    let discountAmount = 0;
    let voucherCode: string | undefined;

    if (orderData.voucherCode?.trim()) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: orderData.voucherCode.trim().toUpperCase() }
      });
      const expired = voucher?.expiresAt ? voucher.expiresAt < new Date() : false;
      const maxedOut = voucher?.maxRedemptions ? voucher.redemptionCount >= voucher.maxRedemptions : false;
      if (!voucher?.isActive || expired || maxedOut || fee < voucher.minimumFee) {
        throw new Error('Voucher tidak valid atau belum memenuhi minimum transaksi.');
      }
      discountAmount = Math.min(fee, voucher.discountAmount);
      voucherCode = voucher.code;
    }

    const totalFee = Math.max(0, fee - discountAmount);
    const order = await prisma.$transaction(async (tx) => {
      if (voucherCode) {
        await tx.voucher.update({
          where: { code: voucherCode },
          data: { redemptionCount: { increment: 1 } }
        });
      }

      return tx.order.create({
        data: {
          customerUserId: orderData.customerUserId,
          serviceType: orderData.serviceType,
          sourceLocation: orderData.sourceLocation.trim(),
          deliveryLocation: orderData.deliveryLocation.trim(),
          details: orderData.details.trim(),
          fee,
          discountAmount,
          totalFee,
          voucherCode,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: orderData.paymentMethod === 'DIGITAL' ? 'WAITING_PAYMENT' : 'WAITING_PAYMENT',
          paymentReference: orderData.paymentMethod === 'DIGITAL' ? `TKPAY-${Date.now()}` : null
        },
        include: { provider: true, customer: true }
      });
    });

    return toOrder(order);
  }

  async markOrderPaid(orderId: string, userId: string, otpCode: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { provider: true, customer: true }
    });

    if (!user || !order || order.customerUserId !== userId) return undefined;
    if (order.paymentMethod !== 'DIGITAL' || order.paymentStatus !== 'WAITING_PAYMENT') return undefined;

    const otpValid = await this.consumeOtp(user.email, otpCode, 'PAYMENT');
    if (!otpValid) return undefined;

    const paid = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'PAID' },
      include: { provider: true, customer: true }
    });
    return toOrder(paid);
  }

  async registerProvider(input: RegisterProviderInput) {
    const existing = await prisma.provider.findUnique({ where: { userId: input.userId } });
    if (existing) return toProvider(existing);

    const provider = await prisma.provider.create({
      data: {
        userId: input.userId,
        name: input.name.trim(),
        nim: input.nim.trim(),
        faculty: input.faculty.trim(),
        ktmUrl: input.ktmUrl.trim(),
        isOnline: false,
        status: 'PENDING_VERIFICATION'
      }
    });
    return toProvider(provider);
  }

  async toggleProviderAvailability(providerId: string, isOnline: boolean) {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider || provider.status !== 'APPROVED') return undefined;

    const updated = await prisma.provider.update({
      where: { id: providerId },
      data: { isOnline }
    });
    return toProvider(updated);
  }

  async claimOrder(orderId: string, providerId: string) {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider || provider.status !== 'APPROVED' || !provider.isOnline) return undefined;

    const claimed = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== 'PENDING' || order.providerId) return null;
      if (order.customerUserId === provider.userId) return null;
      if (order.paymentMethod === 'DIGITAL' && order.paymentStatus !== 'PAID') return null;

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'ACCEPTED',
          providerId: provider.id
        },
        include: { provider: true, customer: true }
      });
    });

    return claimed ? toOrder(claimed) : undefined;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          paymentStatus: status === 'COMPLETED' && order.paymentMethod === 'COD' ? 'PAID' : order.paymentStatus
        },
        include: { provider: true, customer: true }
      });

      if (status === 'COMPLETED' && order.status !== 'COMPLETED' && order.providerId) {
        await tx.provider.update({
          where: { id: order.providerId },
          data: { balance: { increment: order.totalFee || order.fee } }
        });
      }

      return saved;
    });

    return toOrder(updated);
  }

  async addReview(orderId: string, rating: number, comment: string, fromName: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.providerId || order.status !== 'COMPLETED') return undefined;

    const review = await prisma.$transaction(async (tx) => {
      const savedReview = await tx.review.upsert({
        where: { orderId },
        create: {
          orderId,
          providerId: order.providerId!,
          rating: Math.min(5, Math.max(1, Math.round(rating))),
          comment: comment.trim(),
          fromName
        },
        update: {
          rating: Math.min(5, Math.max(1, Math.round(rating))),
          comment: comment.trim(),
          fromName
        }
      });

      const aggregate = await tx.review.aggregate({
        where: { providerId: order.providerId! },
        _avg: { rating: true },
        _count: { rating: true }
      });

      await tx.provider.update({
        where: { id: order.providerId! },
        data: {
          rating: Number((aggregate._avg.rating || 5).toFixed(1)),
          reviewCount: aggregate._count.rating
        }
      });

      return savedReview;
    });

    return toReview(review);
  }

  async getVouchers() {
    const vouchers = await prisma.voucher.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    return vouchers.map(toVoucher);
  }

  async getPendingProviders() {
    const providers = await prisma.provider.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      orderBy: { createdAt: 'asc' }
    });
    return providers.map(toProvider);
  }

  async moderateProvider(providerId: string, decision: 'APPROVED' | 'REJECTED') {
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        status: decision,
        isOnline: decision === 'APPROVED',
        verifiedAt: decision === 'APPROVED' ? new Date() : null
      }
    });
    return toProvider(provider);
  }

  async getAnalytics(): Promise<AnalyticsSummary> {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      totalProviders,
      pendingProviders,
      approvedProviders,
      onlineProviders,
      unclaimedOrders,
      staleUnclaimedOrders,
      pendingDigitalPayments,
      lowRatedProviders,
      digitalPaymentCount,
      codPaymentCount,
      completedRows,
      ratingAggregate
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { not: 'COMPLETED' } } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.provider.count(),
      prisma.provider.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.provider.count({ where: { status: 'APPROVED' } }),
      prisma.provider.count({ where: { status: 'APPROVED', isOnline: true } }),
      prisma.order.count({ where: { status: 'PENDING', providerId: null } }),
      prisma.order.count({
        where: { status: 'PENDING', providerId: null, createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } }
      }),
      prisma.order.count({ where: { paymentMethod: 'DIGITAL', paymentStatus: 'WAITING_PAYMENT' } }),
      prisma.provider.count({ where: { reviewCount: { gt: 0 }, rating: { lt: 4 } } }),
      prisma.order.count({ where: { paymentMethod: 'DIGITAL' } }),
      prisma.order.count({ where: { paymentMethod: 'COD' } }),
      prisma.order.findMany({ where: { status: 'COMPLETED' }, select: { totalFee: true, fee: true } }),
      prisma.review.aggregate({ _avg: { rating: true } })
    ]);

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalProviders,
      pendingProviders,
      approvedProviders,
      onlineProviders,
      unclaimedOrders,
      staleUnclaimedOrders,
      pendingDigitalPayments,
      lowRatedProviders,
      grossTransactionValue: completedRows.reduce((sum, row) => sum + (row.totalFee || row.fee), 0),
      digitalPaymentCount,
      codPaymentCount,
      averageRating: Number((ratingAggregate._avg.rating || 0).toFixed(1))
    };
  }
}

class ResilientTitipKampusDB {
  private delegate: DatabaseDelegate = shouldUseMemoryDatabase() ? new InMemoryTitipKampusDB() : new TitipKampusDB();
  private storageMode: DatabaseStorageMode = shouldUseMemoryDatabase() ? 'in-memory' : 'neon-postgresql';

  getStorageMode() {
    return this.storageMode;
  }

  async ensureSeedData() {
    try {
      await this.delegate.ensureSeedData();
    } catch (error) {
      if (!canFallbackToMemory(error)) throw error;

      console.warn(
        `[TitipKampus] Database PostgreSQL tidak bisa dijangkau (${getStartupErrorMessage(
          error
        )}). Memakai database memori untuk development.`
      );
      this.delegate = new InMemoryTitipKampusDB();
      this.storageMode = 'in-memory';
      await this.delegate.ensureSeedData();
    }
  }

  async createUser(input: CreateUserInput) {
    return this.delegate.createUser(input);
  }

  async authenticateUser(email: string, password: string) {
    return this.delegate.authenticateUser(email, password);
  }

  async requestOtp(email: string, purpose: 'LOGIN' | 'PAYMENT') {
    return this.delegate.requestOtp(email, purpose);
  }

  async authenticateWithOtp(email: string, code: string) {
    return this.delegate.authenticateWithOtp(email, code);
  }

  async consumeOtp(email: string, code: string, purpose: 'LOGIN' | 'PAYMENT') {
    return this.delegate.consumeOtp(email, code, purpose);
  }

  async getUser(id: string) {
    return this.delegate.getUser(id);
  }

  async getProvider(providerId: string) {
    return this.delegate.getProvider(providerId);
  }

  async getProviderByUserId(userId: string) {
    return this.delegate.getProviderByUserId(userId);
  }

  async getOrders() {
    return this.delegate.getOrders();
  }

  async getOrder(id: string) {
    return this.delegate.getOrder(id);
  }

  async createOrder(orderData: CreateOrderInput) {
    return this.delegate.createOrder(orderData);
  }

  async markOrderPaid(orderId: string, userId: string, otpCode: string) {
    return this.delegate.markOrderPaid(orderId, userId, otpCode);
  }

  async registerProvider(input: RegisterProviderInput) {
    return this.delegate.registerProvider(input);
  }

  async toggleProviderAvailability(providerId: string, isOnline: boolean) {
    return this.delegate.toggleProviderAvailability(providerId, isOnline);
  }

  async claimOrder(orderId: string, providerId: string) {
    return this.delegate.claimOrder(orderId, providerId);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return this.delegate.updateOrderStatus(orderId, status);
  }

  async addReview(orderId: string, rating: number, comment: string, fromName: string) {
    return this.delegate.addReview(orderId, rating, comment, fromName);
  }

  async getVouchers() {
    return this.delegate.getVouchers();
  }

  async getPendingProviders() {
    return this.delegate.getPendingProviders();
  }

  async moderateProvider(providerId: string, decision: 'APPROVED' | 'REJECTED') {
    return this.delegate.moderateProvider(providerId, decision);
  }

  async getAnalytics() {
    return this.delegate.getAnalytics();
  }
}

export const db = new ResilientTitipKampusDB();
export default db;
