export type ServiceType = 'food' | 'photocopy' | 'laundry' | 'ojek';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export type ProviderStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
export type UserRole = 'STUDENT' | 'ADMIN';
export type PaymentMethod = 'COD' | 'DIGITAL';
export type PaymentStatus = 'WAITING_PAYMENT' | 'PAID' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  memberStatus: 'Regular' | 'Silver' | 'Gold';
  phone: string;
  role: UserRole;
}

export interface Provider {
  id: string;
  userId: string;
  name: string;
  nim?: string;
  faculty?: string;
  ktmUrl: string; // KTM student card uploaded url or status
  isOnline: boolean; // Availability toggle (Online/Offline)
  balance: number; // Total earnings
  rating: number; // Average rating scale 1 - 5
  reviewCount: number; // Total reviews
  status: ProviderStatus;
  createdAt?: string;
}

export interface Order {
  id: string;
  customerUserId: string;
  customerName: string;
  providerId: string | null; // claimed courier ID
  providerName: string | null;
  serviceType: ServiceType;
  sourceLocation: string; // Lokasi Penjemputan
  deliveryLocation: string; // Lokasi Antar
  details: string; // Detail pesanan
  fee: number; // Delivery fee
  discountAmount: number;
  totalFee: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
}

export interface Review {
  id: string;
  orderId: string;
  providerId: string;
  rating: number; // 1 - 5 scale
  comment: string;
  createdAt: string;
  fromName: string;
}

export interface DashboardMetrics {
  totalEarnings: number;
  activeTasksCount: number;
  averageRating: number;
  reviewCount: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalProviders: number;
  pendingProviders: number;
  approvedProviders: number;
  onlineProviders: number;
  unclaimedOrders: number;
  staleUnclaimedOrders: number;
  pendingDigitalPayments: number;
  lowRatedProviders: number;
  grossTransactionValue: number;
  digitalPaymentCount: number;
  codPaymentCount: number;
  averageRating: number;
}
