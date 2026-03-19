// ============ API Response ============
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============ User ============
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  telegramUsername?: string;
  telegramChatId?: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES_REP';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============ Tile Format ============
export interface TileFormat {
  id: string;
  name: string;
  code: string;
  lengthCm: number;
  widthCm: number;
  thicknessMm: number;
  tilesPerBox: number;
  sqMetersPerBox: number;
  boxWeightKg: number;
  boxesPerPallet: number;
  pricePerSqMeterUZS: number;
  pricePerSqMeterUSD: number;
  category: string;
  surface: string;
  usage: string;
  currentStockSqMeters: number;
  minimumStockAlert: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ Customer ============
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR' | 'CONTRACTOR';
export type PriceCategory = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  position?: string;
  phoneNumbers: string[];
  telegramUsername?: string;
  telegramChatId?: string;
  email?: string;
  tinNumber?: string;
  legalAddress?: string;
  creditLimit: number;
  currentBalance: number;
  paymentTermsDays: number;
  customerType: CustomerType;
  priceCategory: PriceCategory;
  discountPercent: number;
  assignedSalesRepId?: string;
  assignedSalesRep?: { id: string; firstName: string; lastName: string };
  leadSource?: string;
  notes?: string;
  status: CustomerStatus;
  totalPurchasesSqMeters: number;
  totalPurchasesUZS: number;
  lifetimeOrders: number;
  lastOrderDate?: string;
  averagePaymentDays: number;
  deliveryAddresses?: DeliveryAddress[];
  createdAt: string;
  updatedAt: string;
  _count?: { deals: number };
}

export interface DeliveryAddress {
  id: string;
  customerId: string;
  label: string;
  address: string;
  city: string;
  region: string;
  contactPerson?: string;
  contactPhone?: string;
  isDefault: boolean;
}

// ============ Deal ============
export type DealStatus = 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';
export type DeliveryStatus = 'PENDING' | 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface Deal {
  id: string;
  dealNumber: string;
  customerId: string;
  customer: { id: string; companyName: string; contactPerson: string };
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  dealDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotalUZS: number;
  discountPercent: number;
  discountAmountUZS: number;
  taxPercent: number;
  taxAmountUZS: number;
  totalUZS: number;
  totalUSD: number;
  exchangeRateUsed: number;
  paymentStatus: PaymentStatus;
  paidAmountUZS: number;
  remainingAmountUZS: number;
  paymentDueDate?: string;
  deliveryStatus: DeliveryStatus;
  deliveryAddressText?: string;
  vehicleInfo?: string;
  deliveryNotes?: string;
  invoiceNumber?: string;
  wayBillNumber?: string;
  status: DealStatus;
  cancellationReason?: string;
  notes?: string;
  items: DealItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface DealItem {
  id: string;
  dealId: string;
  tileFormatId: string;
  tileFormat: TileFormat | { name: string; code: string };
  quantitySqMeters: number;
  quantityBoxes: number;
  quantityPallets?: number;
  unitPriceUZS: number;
  unitPriceUSD: number;
  discountPercent: number;
  lineTotalUZS: number;
  lineTotalUSD: number;
  notes?: string;
}

// ============ Payment ============
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_PAYMENT';

export interface Payment {
  id: string;
  dealId?: string;
  deal?: { dealNumber: string; customer?: { companyName: string } };
  customerId?: string;
  paymentDate: string;
  amountUZS: number;
  amountUSD?: number;
  exchangeRate?: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receivedById: string;
  receivedBy: { firstName: string; lastName: string };
  notes?: string;
  createdAt: string;
}

// ============ Dashboard ============
export interface DashboardSummary {
  todaySales: { amount: number; count: number };
  monthSales: { amount: number; count: number };
  todayPayments: { amount: number; count: number };
  monthPayments: { amount: number; count: number };
  overdueDeals: number;
  pendingDeliveries: number;
  activeCustomers: number;
  totalCustomers: number;
  exchangeRate: number;
  recentDeals: Deal[];
  topCustomers: {
    id: string;
    companyName: string;
    totalPurchasesUZS: number;
    lifetimeOrders: number;
    currentBalance: number;
  }[];
}

export interface ChartDataPoint {
  date: string;
  sales: number;
  payments: number;
}
