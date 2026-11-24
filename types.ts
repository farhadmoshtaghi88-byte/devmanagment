export enum ProjectStatus {
  Proposal = 'پیشنهاد',
  Active = 'در حال اجرا',
  Testing = 'تست و بازبینی',
  Delivered = 'تحویل شده',
  Support = 'پشتیبانی و نگهداری',
  Paused = 'متوقف شده'
}

export type StatusColorKey = 'amber' | 'emerald' | 'blue' | 'slate' | 'rose' | 'indigo' | 'purple' | 'cyan';

export interface StatusConfig {
  id: string;
  label: string;
  color: StatusColorKey;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  cardNumber?: string;
  iban?: string;
  accountNumber?: string;
  type: 'کارت بانکی' | 'حساب شبا' | 'درگاه پرداخت' | 'صندوق نقدی' | 'حساب چک';
  isDefault?: boolean;
}

export interface SystemUser {
  id: string;
  fullName: string;
  username: string;
  password: string;
  role: 'مدیر کل' | 'مدیر پروژه' | 'حسابدار' | 'توسعه‌دهنده';
  title?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  isCompleted: boolean;
  description?: string;
  createdTimestamp?: number;
}

export interface ClientInteraction {
  id: string;
  type: 'call' | 'meeting' | 'message' | 'email' | 'contract';
  date: string;
  description: string;
  outcome?: string;
  createdTimestamp?: number;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  telegramOrWhatsapp?: string;
  status: string; // matches StatusConfig.id or custom string
  tags: string[];
  address?: string;
  notes?: string;
  avatar?: string;
  rating?: number; // 1 to 5 stars
  createdAt: string;
  createdTimestamp?: number;
  interactions?: ClientInteraction[];
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  title: string;
  amount: number;
  date: string; // Persian date e.g. '1403/02/15'
  time?: string;
  method: 'کارت به کارت' | 'شبا / پایا' | 'درگاه آنلاین' | 'نقد' | 'چک';
  bankAccountId?: string;
  bankAccountLabel?: string;
  trackingCode?: string;
  status: 'completed' | 'pending';
  notes?: string;
  createdTimestamp?: number;
}

export interface InfrastructureItem {
  id: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  type: string; // matches configurable expenseTypes (e.g. 'server' | 'domain' | 'ssl' | 'sms' | 'cloud' | 'license' | 'commission' | 'other' or custom)
  title: string;
  provider: string;
  purchaseCost: number; // Toman
  purchaseDate: string; // Persian date
  purchaseTime?: string;
  expirationDate?: string;
  billingCycle?: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  ip?: string;
  specs?: string;
  autoRenew?: boolean;
  status: 'active' | 'warning' | 'expired';
  credentialsNotes?: string;
  recipientName?: string;
  commissionRate?: number;
  paymentStatus?: 'paid' | 'pending';
  categoryTitle?: string;
  createdTimestamp?: number;
}

export interface Project {
  id: string;
  clientId: string;
  clientName?: string;
  title: string;
  category?: string;
  description?: string;
  stack: string[];
  status: string;
  progress: number; // 0-100
  baseContractValue?: number; // Toman before discount & tax
  discountType?: 'amount' | 'percent';
  discountValue?: number; // Raw input value (percent or Toman)
  discountAmount?: number; // Computed discount subtracted (Toman)
  taxRate?: number; // VAT percentage (e.g. 0, 9, 10)
  taxAmount?: number; // Computed tax added (Toman)
  contractValue: number; // Final net payable contract value = (base - discount) + tax (Toman)
  paidAmount: number; // Synchronized with payments
  startDate: string;
  deadline: string;
  liveUrl?: string;
  repoUrl?: string;
  figmaUrl?: string;
  milestones?: Milestone[];
  notes?: string;
  referrerName?: string;
  commissionRate?: number;
  commissionAmount?: number;
  convertedProductId?: string;
  createdTimestamp?: number;
}

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  deadline?: string;
  description?: string;
  createdTimestamp?: number;
}

export interface Server {
  id: string;
  name: string;
  provider: string;
  ip: string;
  os: string;
  purchaseCost: number;
  purchaseDate: string;
  expiration: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  status: 'online' | 'warning' | 'expired' | 'offline';
  sshPort?: string;
  sshUser?: string;
  notes?: string;
  createdTimestamp?: number;
}

export interface Domain {
  id: string;
  url: string;
  registrar: string;
  purchaseCost: number;
  purchaseDate: string;
  expiration: string;
  autoRenew: boolean;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  sslStatus: 'active' | 'pending' | 'expired' | 'none';
  notes?: string;
  dnsRecords?: { type: string; host: string; value: string; ttl: string }[];
  createdTimestamp?: number;
}

export type ProductSalesModel = 'one-time' | 'subscription' | 'hybrid';

export type ProductStatus = 'در حال تولید' | 'آماده فروش' | 'پرفروش' | 'متوقف شده';

export type ProductSupportPolicy = 'free' | 'paid' | 'none';

export interface ProductTier {
  id: string;
  name: string; // e.g., 'نسخه پایه', 'نسخه حرفه‌ای', 'نسخه جامع'
  price: number; // Toman
  supportMonths?: number; // Initial support duration in months (fallback to product.defaultSupportMonths)
  supportRenewalPrice?: number; // Optional renewal fee for subsequent periods (Toman)
  description?: string; // Short summary of tier differences
}

export interface Product {
  id: string;
  name: string;
  domain: string; // Editable product field/domain (e.g., نرم‌افزار ابری SaaS)
  description?: string;
  stack: string[];
  status: ProductStatus;
  salesModel: ProductSalesModel;
  oneTimePrice?: number; // Toman
  monthlyPrice?: number; // Toman
  annualPrice?: number; // Toman
  tiers?: ProductTier[]; // Optional multi-tier editions (e.g., 35M / 39M / 45M)
  variableCostPerUnit?: number; // Toman per sale (server, commission, etc.)
  targetMarginPercent: number; // Target ROI % on investment (e.g., 100%)
  targetSalesCount?: number; // Target sales volume for forecast table (default 10)
  pricingMode?: 'markup' | 'margin';
  supportPolicy: ProductSupportPolicy;
  defaultSupportMonths: number; // e.g., 6 or 12
  supportRenewalPrice?: number; // Toman per renewal period
  demoUrl?: string;
  version?: string;
  sourceProjectId?: string;
  sourceProjectTitle?: string;
  createdAt: string;
  createdTimestamp?: number;
}

export interface ProductCostItem {
  id: string;
  productId: string;
  productName?: string;
  costType: string; // Editable product cost types (e.g. 'توسعه اولیه' | 'نگهداری و زیرساخت' | 'بازاریابی و فروش' | 'سایر' or custom)
  categoryTitle?: string;
  title: string;
  amount: number; // Toman
  date: string;
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  createdTimestamp?: number;
}

export interface ProductSaleEvent {
  id: string;
  type: 'purchase' | 'upgrade' | 'renewal' | 'payment';
  date: string;
  title: string;
  amountDelta: number; // Invoice value added by this event (0 for pure installment payment)
  paidAmount: number; // Cash received during this event
  method?: 'کارت به کارت' | 'شبا / پایا' | 'درگاه آنلاین' | 'نقد' | 'چک';
  bankAccountId?: string;
  bankAccountLabel?: string;
  trackingCode?: string;
  fromTierName?: string;
  toTierName?: string;
  supportMonthsAdded?: number;
  notes?: string;
  createdTimestamp: number;
}

export interface ProductSale {
  id: string;
  productId: string;
  productName?: string;
  clientId?: string;
  buyerName: string;
  buyerCompany?: string;
  saleType: 'یک‌باره' | 'اشتراک ماهانه' | 'اشتراک فصلی' | 'اشتراک سالانه' | 'تمدید پشتیبانی' | 'ارتقای نسخه';
  tierId?: string;
  tierName?: string;
  upgradedFromTierName?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  subscriptionEndDate?: string;
  method: 'کارت به کارت' | 'شبا / پایا' | 'درگاه آنلاین' | 'نقد' | 'چک';
  bankAccountId?: string;
  bankAccountLabel?: string;
  trackingCode?: string;
  hasSupport: boolean;
  supportMonths?: number;
  supportStartDate?: string;
  supportEndDate?: string;
  supportRenewalPrice?: number;
  isFounderLicense?: boolean;
  notes?: string;
  events?: ProductSaleEvent[];
  createdTimestamp?: number;
}

export interface FinanceSummary {
  // Combined business totals (Projects + Products)
  totalRevenue: number;
  totalPaid: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  totalCommissions: number;
  totalInfra: number;
  totalOtherExpenses: number;
  netProfit: number; // Combined contract/sales value - combined expenses
  cashNetProfit: number; // Combined cash received - combined paid expenses
  pendingReceivables: number;

  // Projects-only split
  projectsRevenue: number;
  projectsPaid: number;
  projectsExpenses: number;
  projectsNetProfit: number;
  projectsPendingReceivables: number;

  // Products-only split
  productsRevenue: number;
  productsPaid: number;
  productsCosts: number;
  productsNetProfit: number;
  productsPendingReceivables: number;
  productsSalesCount: number;
  activeProductSupports: number;
}

export type InvoiceDocumentType = 'فاکتور فروش' | 'پیش‌فاکتور' | 'صورت‌حساب رسمی';
export type InvoiceTheme = 'shayegan' | 'classic' | 'minimal';
export type InvoiceStatus = 'پرداخت‌شده' | 'پرداخت جزئی' | 'در انتظار پرداخت' | 'پیش‌فاکتور';

export interface InvoiceItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number; // Toman per line
}

export interface InvoiceSellerProfile {
  companyName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  nationalId?: string;
  economicCode?: string;
  defaultBankAccountId?: string;
  signerName: string;
  signerRole: string;
  defaultTerms: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  documentType: InvoiceDocumentType;
  theme: InvoiceTheme;
  status: InvoiceStatus;
  sourceType: 'custom' | 'project' | 'product_sale';
  sourceId?: string;
  sourceTitle?: string;
  issueDate: string; // Persian YYYY/MM/DD
  dueDate?: string;
  clientId?: string;
  buyerName: string;
  buyerCompany?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  buyerNationalId?: string;
  items: InvoiceItem[];
  discountType: 'amount' | 'percent';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  bankAccountId?: string;
  notes?: string;
  terms?: string;
  createdTimestamp?: number;
}

