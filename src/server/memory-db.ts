import { randomUUID } from 'node:crypto';
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
import { getSeedAdminUser, getSeedStudentUser, type SeedUserConfig } from './seed-config.js';

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

type StoredUser = User & {
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

type StoredProvider = Omit<Provider, 'createdAt'> & {
  nim: string;
  faculty: string;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredOrder = Omit<Order, 'createdAt' | 'updatedAt' | 'customerName' | 'providerName'> & {
  createdAt: Date;
  updatedAt: Date;
};

type StoredReview = Omit<Review, 'createdAt'> & {
  createdAt: Date;
};

type StoredVoucher = Omit<Voucher, 'expiresAt'> & {
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
  createdAt: Date;
};

type StoredOtp = {
  id: string;
  userId?: string;
  email: string;
  codeHash: string;
  purpose: 'LOGIN' | 'PAYMENT';
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createAvatarUrl(name: string) {
  return `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

function createUniqueEmailError() {
  const error = new Error('Email sudah terdaftar.');
  (error as Error & { code?: string }).code = 'P2002';
  return error;
}

function toStoredSeedUser(seedUser: SeedUserConfig, passwordHash: string): Omit<StoredUser, 'createdAt' | 'updatedAt'> {
  return {
    id: seedUser.id,
    name: seedUser.name,
    email: seedUser.email,
    avatar: seedUser.avatar || createAvatarUrl(seedUser.name),
    memberStatus: seedUser.memberStatus,
    phone: seedUser.phone,
    role: seedUser.role,
    passwordHash
  };
}

function sortNewestFirst<T extends { createdAt: Date }>(a: T, b: T) {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

export class InMemoryTitipKampusDB {
  private readonly users = new Map<string, StoredUser>();
  private readonly providers = new Map<string, StoredProvider>();
  private readonly orders = new Map<string, StoredOrder>();
  private readonly reviews = new Map<string, StoredReview>();
  private readonly vouchers = new Map<string, StoredVoucher>();
  private readonly otpCodes = new Map<string, StoredOtp>();
  private seeded = false;

  async ensureSeedData() {
    if (this.seeded) return;

    const seedUsers = [getSeedAdminUser(), getSeedStudentUser()].filter((user): user is SeedUserConfig =>
      Boolean(user)
    );

    for (const seedUser of seedUsers) {
      this.upsertUser(toStoredSeedUser(seedUser, await bcrypt.hash(seedUser.password, 12)));
    }

    this.upsertVoucher({
      code: 'UMPHEMAT',
      description: 'Potongan Rp 2.000 untuk transaksi minimal Rp 7.000.',
      discountAmount: 2000,
      minimumFee: 7000,
      maxRedemptions: null,
      redemptionCount: 0,
      isActive: true,
      expiresAt: null
    });

    this.upsertVoucher({
      code: 'KOPMA5000',
      description: 'Potongan Rp 5.000 untuk transaksi minimal Rp 15.000.',
      discountAmount: 5000,
      minimumFee: 15000,
      maxRedemptions: null,
      redemptionCount: 0,
      isActive: true,
      expiresAt: null
    });

    this.seeded = true;
  }

  async createUser(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();
    if (this.findUserByEmail(email)) throw createUniqueEmailError();

    const user: StoredUser = {
      id: randomUUID(),
      name: input.name.trim(),
      email,
      avatar: createAvatarUrl(input.name.trim()),
      memberStatus: 'Regular',
      phone: input.phone.trim(),
      role: 'STUDENT',
      passwordHash: await bcrypt.hash(input.password, 12),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return this.toUser(user);
  }

  async authenticateUser(email: string, password: string) {
    const user = this.findUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? this.toUser(user) : null;
  }

  async requestOtp(email: string, purpose: 'LOGIN' | 'PAYMENT') {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.findUserByEmail(normalizedEmail);
    const code = createOtpCode();
    const createdAt = new Date();
    const id = randomUUID();

    this.otpCodes.set(id, {
      id,
      userId: user?.id,
      email: normalizedEmail,
      codeHash: await bcrypt.hash(code, 10),
      purpose,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      usedAt: null,
      createdAt
    });

    return { code, expiresInSeconds: 300 };
  }

  async authenticateWithOtp(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const valid = await this.consumeOtp(normalizedEmail, code, 'LOGIN');
    if (!valid) return null;

    const user = this.findUserByEmail(normalizedEmail);
    return user ? this.toUser(user) : null;
  }

  async consumeOtp(email: string, code: string, purpose: 'LOGIN' | 'PAYMENT') {
    const otp = Array.from(this.otpCodes.values())
      .filter(
        (item) =>
          item.email === email.trim().toLowerCase() &&
          item.purpose === purpose &&
          !item.usedAt &&
          item.expiresAt > new Date()
      )
      .sort(sortNewestFirst)[0];

    if (!otp) return false;

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) return false;

    otp.usedAt = new Date();
    return true;
  }

  async getUser(id: string) {
    const user = this.users.get(id);
    return user ? this.toUser(user) : undefined;
  }

  async getProvider(providerId: string) {
    const provider = this.providers.get(providerId);
    return provider ? this.toProvider(provider) : undefined;
  }

  async getProviderByUserId(userId: string) {
    const provider = Array.from(this.providers.values()).find((item) => item.userId === userId);
    return provider ? this.toProvider(provider) : undefined;
  }

  async getOrders() {
    return Array.from(this.orders.values())
      .sort(sortNewestFirst)
      .map((order) => this.toOrder(order));
  }

  async getOrder(id: string) {
    const order = this.orders.get(id);
    return order ? this.toOrder(order) : undefined;
  }

  async createOrder(orderData: CreateOrderInput) {
    const fee = Math.max(2000, Math.round(orderData.fee));
    let discountAmount = 0;
    let voucherCode: string | null = null;

    if (orderData.voucherCode?.trim()) {
      const voucher = this.vouchers.get(orderData.voucherCode.trim().toUpperCase());
      if (!voucher) {
        throw new Error('Kode voucher tidak ditemukan.');
      }
      const expired = voucher.expiresAt ? voucher.expiresAt < new Date() : false;
      const maxedOut = voucher.maxRedemptions ? voucher.redemptionCount >= voucher.maxRedemptions : false;
      if (!voucher.isActive || expired || maxedOut) {
        throw new Error('Voucher sudah tidak aktif atau kedaluwarsa.');
      }
      if (fee < voucher.minimumFee) {
        throw new Error(
          `Voucher ini hanya berlaku untuk minimum transaksi Rp ${voucher.minimumFee.toLocaleString('id-ID')}.`
        );
      }
      discountAmount = Math.min(fee, voucher.discountAmount);
      voucherCode = voucher.code;
      voucher.redemptionCount += 1;
    }

    const totalFee = Math.max(0, fee - discountAmount);
    const now = new Date();
    const order: StoredOrder = {
      id: randomUUID(),
      customerUserId: orderData.customerUserId,
      providerId: null,
      serviceType: orderData.serviceType,
      sourceLocation: orderData.sourceLocation.trim(),
      deliveryLocation: orderData.deliveryLocation.trim(),
      details: orderData.details.trim(),
      fee,
      discountAmount,
      totalFee,
      status: 'PENDING',
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'WAITING_PAYMENT',
      paymentReference: orderData.paymentMethod === 'DIGITAL' ? `TKPAY-${Date.now()}` : null,
      voucherCode,
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(order.id, order);
    return this.toOrder(order);
  }

  async markOrderPaid(orderId: string, userId: string, otpCode: string) {
    const user = this.users.get(userId);
    const order = this.orders.get(orderId);

    if (!user || !order || order.customerUserId !== userId) return undefined;
    if (order.paymentMethod !== 'DIGITAL' || order.paymentStatus !== 'WAITING_PAYMENT') return undefined;

    const otpValid = await this.consumeOtp(user.email, otpCode, 'PAYMENT');
    if (!otpValid) return undefined;

    order.paymentStatus = 'PAID';
    order.updatedAt = new Date();
    return this.toOrder(order);
  }

  async registerProvider(input: RegisterProviderInput) {
    const existing = Array.from(this.providers.values()).find((provider) => provider.userId === input.userId);
    if (existing) return this.toProvider(existing);

    const now = new Date();
    const provider: StoredProvider = {
      id: randomUUID(),
      userId: input.userId,
      name: input.name.trim(),
      nim: input.nim.trim(),
      faculty: input.faculty.trim(),
      ktmUrl: input.ktmUrl.trim(),
      isOnline: false,
      balance: 0,
      rating: 5,
      reviewCount: 0,
      status: 'PENDING_VERIFICATION',
      verifiedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.providers.set(provider.id, provider);
    return this.toProvider(provider);
  }

  async toggleProviderAvailability(providerId: string, isOnline: boolean) {
    const provider = this.providers.get(providerId);
    if (!provider || provider.status !== 'APPROVED') return undefined;

    provider.isOnline = isOnline;
    provider.updatedAt = new Date();
    return this.toProvider(provider);
  }

  async claimOrder(orderId: string, providerId: string) {
    const provider = this.providers.get(providerId);
    if (!provider || provider.status !== 'APPROVED' || !provider.isOnline) return undefined;

    const order = this.orders.get(orderId);
    if (!order || order.status !== 'PENDING' || order.providerId) return undefined;
    if (order.customerUserId === provider.userId) return undefined;
    if (order.paymentMethod === 'DIGITAL' && order.paymentStatus !== 'PAID') return undefined;

    order.status = 'ACCEPTED';
    order.providerId = provider.id;
    order.updatedAt = new Date();
    return this.toOrder(order);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    const previousStatus = order.status;
    order.status = status;
    if (status === 'COMPLETED' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'PAID';
    }
    order.updatedAt = new Date();

    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED' && order.providerId) {
      const provider = this.providers.get(order.providerId);
      if (provider) {
        provider.balance += order.totalFee || order.fee;
        provider.updatedAt = new Date();
      }
    }

    return this.toOrder(order);
  }

  async addReview(orderId: string, rating: number, comment: string, fromName: string) {
    const order = this.orders.get(orderId);
    if (!order?.providerId || order.status !== 'COMPLETED') return undefined;

    const normalizedRating = Math.min(5, Math.max(1, Math.round(rating)));
    let review = Array.from(this.reviews.values()).find((item) => item.orderId === orderId);
    if (review) {
      review.rating = normalizedRating;
      review.comment = comment.trim();
      review.fromName = fromName;
    } else {
      review = {
        id: randomUUID(),
        orderId,
        providerId: order.providerId,
        rating: normalizedRating,
        comment: comment.trim(),
        fromName,
        createdAt: new Date()
      };
      this.reviews.set(review.id, review);
    }

    this.recalculateProviderRating(order.providerId);
    return this.toReview(review);
  }

  async getVouchers() {
    return Array.from(this.vouchers.values())
      .filter((voucher) => voucher.isActive)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((voucher) => this.toVoucher(voucher));
  }

  async getPendingProviders() {
    return Array.from(this.providers.values())
      .filter((provider) => provider.status === 'PENDING_VERIFICATION')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((provider) => this.toProvider(provider));
  }

  async moderateProvider(providerId: string, decision: 'APPROVED' | 'REJECTED') {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error('Provider tidak ditemukan.');

    provider.status = decision;
    provider.isOnline = decision === 'APPROVED';
    provider.verifiedAt = decision === 'APPROVED' ? new Date() : null;
    provider.updatedAt = new Date();
    return this.toProvider(provider);
  }

  async getAnalytics(): Promise<AnalyticsSummary> {
    const orders = Array.from(this.orders.values());
    const providers = Array.from(this.providers.values());
    const completedRows = orders.filter((order) => order.status === 'COMPLETED');
    const reviews = Array.from(this.reviews.values());
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

    return {
      totalOrders: orders.length,
      activeOrders: orders.filter((order) => order.status !== 'COMPLETED').length,
      completedOrders: completedRows.length,
      totalProviders: providers.length,
      pendingProviders: providers.filter((provider) => provider.status === 'PENDING_VERIFICATION').length,
      approvedProviders: providers.filter((provider) => provider.status === 'APPROVED').length,
      onlineProviders: providers.filter((provider) => provider.status === 'APPROVED' && provider.isOnline).length,
      unclaimedOrders: orders.filter((order) => order.status === 'PENDING' && !order.providerId).length,
      staleUnclaimedOrders: orders.filter(
        (order) =>
          order.status === 'PENDING' && !order.providerId && Date.now() - order.createdAt.getTime() > 30 * 60 * 1000
      ).length,
      pendingDigitalPayments: orders.filter(
        (order) => order.paymentMethod === 'DIGITAL' && order.paymentStatus === 'WAITING_PAYMENT'
      ).length,
      lowRatedProviders: providers.filter((provider) => provider.reviewCount > 0 && provider.rating < 4).length,
      grossTransactionValue: completedRows.reduce((sum, order) => sum + (order.totalFee || order.fee), 0),
      digitalPaymentCount: orders.filter((order) => order.paymentMethod === 'DIGITAL').length,
      codPaymentCount: orders.filter((order) => order.paymentMethod === 'COD').length,
      averageRating: Number(averageRating.toFixed(1))
    };
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = this.orders.get(orderId);
    if (!order || order.customerUserId !== userId || order.status !== 'PENDING') return undefined;

    order.status = 'CANCELLED';
    order.updatedAt = new Date();
    return this.toOrder(order);
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
    const user = this.users.get(userId);
    if (!user) return undefined;

    if (data.name) {
      user.name = data.name.trim();
    }
    if (data.phone) {
      user.phone = data.phone.trim();
    }
    if (data.avatar) {
      user.avatar = data.avatar.trim();
    }
    user.updatedAt = new Date();
    return this.toUser(user);
  }

  private upsertUser(input: Omit<StoredUser, 'createdAt' | 'updatedAt'>) {
    const existing = this.users.get(input.id);
    if (existing) {
      Object.assign(existing, input, { updatedAt: new Date() });
      return existing;
    }

    const user: StoredUser = {
      ...input,
      avatar: input.avatar || createAvatarUrl(input.name),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  private upsertVoucher(input: Omit<StoredVoucher, 'createdAt'>) {
    const existing = this.vouchers.get(input.code);
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }

    const voucher: StoredVoucher = {
      ...input,
      createdAt: new Date()
    };
    this.vouchers.set(voucher.code, voucher);
    return voucher;
  }

  private recalculateProviderRating(providerId: string) {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    const reviews = Array.from(this.reviews.values()).filter((review) => review.providerId === providerId);
    if (reviews.length === 0) {
      provider.rating = 5;
      provider.reviewCount = 0;
      return;
    }

    provider.rating = Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));
    provider.reviewCount = reviews.length;
  }

  private findUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return Array.from(this.users.values()).find((user) => user.email === normalizedEmail);
  }

  private toUser(user: StoredUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || createAvatarUrl(user.name),
      memberStatus: user.memberStatus,
      phone: user.phone,
      role: user.role
    };
  }

  private toProvider(provider: StoredProvider): Provider {
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

  private toOrder(order: StoredOrder): Order {
    const customer = this.users.get(order.customerUserId);
    const provider = order.providerId ? this.providers.get(order.providerId) : undefined;
    const totalFee = order.totalFee || Math.max(0, order.fee - order.discountAmount);

    return {
      id: order.id,
      customerUserId: order.customerUserId,
      customerName: customer?.name || 'Mahasiswa UMP',
      providerId: order.providerId,
      providerName: provider?.name || null,
      serviceType: order.serviceType,
      sourceLocation: order.sourceLocation,
      deliveryLocation: order.deliveryLocation,
      details: order.details,
      fee: order.fee,
      discountAmount: order.discountAmount,
      totalFee,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      voucherCode: order.voucherCode
    };
  }

  private toReview(review: StoredReview): Review {
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

  private toVoucher(voucher: StoredVoucher): Voucher {
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
}
