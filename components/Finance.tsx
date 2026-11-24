import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  CreditCard,
  X,
  Trash2,
  Wallet,
  Briefcase,
  AlertCircle,
  Settings2,
  Search,
  Package,
  ShoppingBag,
  Users,
  FileSpreadsheet,
  BarChart3,
  History,
  CheckCircle2,
  Landmark,
  ExternalLink
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import {
  toPersianDigits,
  toEnglishDigits,
  formatPrice,
  formatCardNumber,
  getTodayPersianDate,
  getNormalizedSaleEvents,
  STATUS_COLOR_STYLES
} from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';
import PaymentFormModal from './PaymentFormModal';
import ProductSaleModal from './ProductSaleModal';
import ProductSaleLedgerModal from './ProductSaleLedgerModal';
import OptionManagerModal from './OptionManagerModal';
import ConfirmModal from './ConfirmModal';

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

const extractMonthIdx = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const eng = toEnglishDigits(dateStr);
  const parts = eng.split(/[\/\-]/);
  if (parts.length < 2) return null;
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(m) || m < 1 || m > 12) return null;
  return m - 1;
};

const formatMillionTick = (value: number): string => {
  if (value === 0) return '۰';
  if (Math.abs(value) >= 1_000_000) return `${toPersianDigits(Math.round(value / 1_000_000))} م`;
  return toPersianDigits(value);
};

interface DebtorRow {
  id: string;
  source: 'project' | 'product';
  name: string;
  company?: string;
  clientId?: string;
  itemId: string;
  itemTitle: string;
  tierName?: string;
  saleId?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidPercent: number;
  date: string;
}

interface BuyerAccountSummary {
  key: string;
  clientId?: string;
  name: string;
  company?: string;
  totalValue: number;
  totalPaid: number;
  remainingDebt: number;
  projects: Array<{
    id: string;
    title: string;
    contractValue: number;
    paid: number;
    remaining: number;
  }>;
  productSales: Array<{
    id: string;
    productId: string;
    productName: string;
    tierName?: string;
    saleType: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    eventsCount: number;
  }>;
}

const Finance: React.FC = () => {
  const {
    financeSummary,
    clients,
    payments,
    expenses,
    projects,
    products,
    productSales,
    productCosts,
    bankAccounts,
    expenseCategories,
    expenseTypes,
    getProjectStats,
    addExpense,
    deletePayment,
    deleteExpense,
    deleteProductSale,
    deleteProductSaleEvent,
    deleteProductCost,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
    setActiveTab,
    setSelectedProjectIdForView,
    setSelectedClientIdForView,
    setSelectedProductIdForView
  } = useData();

  // Mini-Accounting Tab Navigation
  const [financeTab, setFinanceTab] = useState<'ledger' | 'debtors' | 'buyers' | 'analytics'>('ledger');

  // Ledger filters
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'projects' | 'products'>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Debtors filters
  const [debtorSearch, setDebtorSearch] = useState('');
  const [debtorSourceFilter, setDebtorSourceFilter] = useState<'all' | 'project' | 'product'>('all');
  const [debtorSort, setDebtorSort] = useState<'highest' | 'lowest_paid_pct'>('highest');

  // Buyers directory filters
  const [buyerSearch, setBuyerSearch] = useState('');
  const [buyerStatusFilter, setBuyerStatusFilter] = useState<'all' | 'debtors' | 'settled'>('all');

  // Modals
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [lockedProjectIdForPayment, setLockedProjectIdForPayment] = useState<string | undefined>(undefined);
  const [isAddProductSaleModalOpen, setIsAddProductSaleModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isExpCatManagerOpen, setIsExpCatManagerOpen] = useState(false);
  const [isExpTypeManagerOpen, setIsExpTypeManagerOpen] = useState(false);
  const [saleLedgerModal, setSaleLedgerModal] = useState<{
    isOpen: boolean;
    saleId: string | null;
    initialTab: 'history' | 'payment';
  }>({
    isOpen: false,
    saleId: null,
    initialTab: 'history'
  });

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    saleId?: string;
    txKind: 'project_payment' | 'project_expense' | 'product_sale' | 'product_sale_event' | 'product_cost';
    title: string;
  } | null>(null);

  const [newExp, setNewExp] = useState({
    projectId: projects[0]?.id || '',
    type: 'other' as string,
    categoryTitle: expenseCategories[0] || 'طراحی گرافیک و UI',
    title: '',
    provider: '',
    purchaseCost: '',
    purchaseDate: getTodayPersianDate(),
    expirationDate: '',
    billingCycle: 'one-time' as 'monthly' | 'quarterly' | 'annual' | 'one-time',
    paymentStatus: 'paid' as 'paid' | 'pending',
    notes: ''
  });

  const jumpToProject = (projectId: string) => {
    setSelectedProjectIdForView(projectId);
    setActiveTab('projects');
  };

  const jumpToClient = (clientId: string) => {
    setSelectedClientIdForView(clientId);
    setActiveTab('clients');
  };

  const jumpToProduct = (productId: string) => {
    setSelectedProductIdForView(productId);
    setActiveTab('products');
  };

  const openProjectPaymentModal = (projectId?: string) => {
    setLockedProjectIdForPayment(projectId);
    setIsAddIncomeModalOpen(true);
  };

  const openProductSaleLedger = (saleId: string, initialTab: 'history' | 'payment' = 'history') => {
    setSaleLedgerModal({ isOpen: true, saleId, initialTab });
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === newExp.projectId);
    addExpense({
      projectId: newExp.projectId || undefined,
      projectName: proj?.title,
      clientId: proj?.clientId,
      clientName: proj?.clientName,
      type: newExp.type,
      categoryTitle: newExp.type === 'other' ? newExp.categoryTitle : undefined,
      title: newExp.title,
      provider: newExp.provider || (newExp.type === 'other' ? newExp.categoryTitle : 'تامین‌کننده'),
      purchaseCost: Number(newExp.purchaseCost) || 0,
      purchaseDate: newExp.purchaseDate || getTodayPersianDate(),
      expirationDate: newExp.expirationDate || '',
      billingCycle: newExp.billingCycle,
      paymentStatus: newExp.paymentStatus,
      status: 'active',
      credentialsNotes: newExp.notes
    });

    setIsAddExpenseModalOpen(false);
    setNewExp({
      projectId: projects[0]?.id || '',
      type: 'other',
      categoryTitle: expenseCategories[0] || 'طراحی گرافیک و UI',
      title: '',
      provider: '',
      purchaseCost: '',
      purchaseDate: getTodayPersianDate(),
      expirationDate: '',
      billingCycle: 'one-time',
      paymentStatus: 'paid',
      notes: ''
    });
  };

  // ==========================================
  // 1. MASTER TRANSACTION LEDGER (Expands Product Sale Payment Events!)
  // ==========================================
  const combinedTransactions = useMemo(() => {
    const productCashRows = productSales.flatMap((s) => {
      const events = getNormalizedSaleEvents(s);
      return events
        .filter((ev) => (ev.paidAmount || 0) > 0)
        .map((ev) => ({
          id: ev.id,
          saleId: s.id,
          isIncome: true,
          source: 'products' as const,
          txKind: (ev.type === 'payment' ? 'product_sale_event' : 'product_sale') as
            | 'product_sale'
            | 'product_sale_event',
          title: `${ev.title}`,
          tierName: ev.toTierName || s.tierName,
          projectName: undefined as string | undefined,
          projectId: undefined as string | undefined,
          productId: s.productId,
          productName: s.productName,
          clientName: s.buyerCompany ? `${s.buyerName} (${s.buyerCompany})` : s.buyerName,
          clientId: s.clientId,
          amount: ev.paidAmount,
          date: ev.date || s.date,
          createdTimestamp: ev.createdTimestamp || s.createdTimestamp || 0,
          methodOrType: ev.method || s.method,
          bankAccountId: ev.bankAccountId || s.bankAccountId,
          accountOrCategory: ev.bankAccountLabel || s.bankAccountLabel || 'حساب ثبت‌نشده',
          code:
            ev.trackingCode ||
            (s.remainingAmount > 0
              ? `مانده پرونده: ${formatPrice(s.remainingAmount)} تومان`
              : 'پرونده تسویه کامل')
        }));
    });

    const list = [
      ...payments.map((p) => ({
        id: p.id,
        saleId: undefined as string | undefined,
        isIncome: true,
        source: 'projects' as const,
        txKind: 'project_payment' as const,
        title: p.title,
        tierName: undefined as string | undefined,
        projectName: p.projectName,
        projectId: p.projectId,
        productId: undefined as string | undefined,
        productName: undefined as string | undefined,
        clientName: p.clientName,
        clientId: p.clientId,
        amount: p.amount,
        date: p.date,
        createdTimestamp: p.createdTimestamp || 0,
        methodOrType: p.method,
        bankAccountId: p.bankAccountId,
        accountOrCategory: p.bankAccountLabel || 'حساب ثبت‌نشده',
        code: p.trackingCode
      })),
      ...expenses.map((e) => ({
        id: e.id,
        saleId: undefined as string | undefined,
        isIncome: false,
        source: 'projects' as const,
        txKind: 'project_expense' as const,
        title: e.title,
        tierName: undefined as string | undefined,
        projectName: e.projectName,
        projectId: e.projectId,
        productId: undefined as string | undefined,
        productName: undefined as string | undefined,
        clientName: e.clientName,
        clientId: e.clientId,
        amount: e.purchaseCost,
        date: e.purchaseDate,
        createdTimestamp: e.createdTimestamp || 0,
        methodOrType:
          e.type === 'commission'
            ? 'پورسانت معرفی'
            : e.type === 'server'
            ? 'سرور'
            : e.type === 'domain'
            ? 'دامنه'
            : e.type === 'other'
            ? e.categoryTitle || 'سایر هزینه‌ها'
            : 'زیرساخت',
        bankAccountId: undefined as string | undefined,
        accountOrCategory: e.provider || '—',
        code: e.paymentStatus === 'pending' ? 'در انتظار تسویه' : 'پرداخت‌شده'
      })),
      ...productCashRows,
      ...productCosts.map((c) => ({
        id: c.id,
        saleId: undefined as string | undefined,
        isIncome: false,
        source: 'products' as const,
        txKind: 'product_cost' as const,
        title: c.title,
        tierName: undefined as string | undefined,
        projectName: undefined as string | undefined,
        projectId: undefined as string | undefined,
        productId: c.productId,
        productName: c.productName,
        clientName: undefined as string | undefined,
        clientId: undefined as string | undefined,
        amount: c.amount,
        date: c.date,
        createdTimestamp: c.createdTimestamp || 0,
        methodOrType: c.costType,
        bankAccountId: undefined as string | undefined,
        accountOrCategory: c.categoryTitle || 'هزینه تولید محصول',
        code: c.paymentStatus === 'pending' ? 'در انتظار تسویه' : 'پرداخت‌شده'
      }))
    ];

    return list.sort((a, b) => {
      if (b.createdTimestamp !== a.createdTimestamp) {
        return b.createdTimestamp - a.createdTimestamp;
      }
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [payments, expenses, productSales, productCosts]);

  const filteredTransactions = useMemo(() => {
    return combinedTransactions.filter((t) => {
      if (ledgerFilter === 'income' && !t.isIncome) return false;
      if (ledgerFilter === 'expense' && t.isIncome) return false;
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
      if (bankFilter !== 'all' && t.bankAccountId !== bankFilter) return false;
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.trim().toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.projectName || '').toLowerCase().includes(q) ||
          (t.productName || '').toLowerCase().includes(q) ||
          (t.tierName || '').toLowerCase().includes(q) ||
          (t.clientName || '').toLowerCase().includes(q) ||
          (t.accountOrCategory || '').toLowerCase().includes(q) ||
          (t.code || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [combinedTransactions, ledgerFilter, sourceFilter, bankFilter, ledgerSearch]);

  const filteredLedgerSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.isIncome) income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // ==========================================
  // 2. UNIFIED DEBTORS / RECEIVABLES LEDGER (Projects + Products)
  // ==========================================
  const allDebtors = useMemo<DebtorRow[]>(() => {
    const projectDebtors: DebtorRow[] = projects
      .map((p) => {
        const st = getProjectStats(p.id);
        if (st.remainingBalance <= 0) return null;
        const client = clients.find((c) => c.id === p.clientId);
        return {
          id: `debt-proj-${p.id}`,
          source: 'project' as const,
          name: client?.name || p.clientName || 'کارفرما',
          company: client?.company,
          clientId: p.clientId,
          itemId: p.id,
          itemTitle: p.title,
          totalAmount: st.contractValue,
          paidAmount: st.totalPaid,
          remainingAmount: st.remainingBalance,
          paidPercent: st.paidPercentage,
          date: p.startDate
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const productDebtors: DebtorRow[] = productSales
      .filter((s) => s.remainingAmount > 0)
      .map((s) => {
        const paidPct =
          s.totalAmount > 0 ? Math.min(100, Math.round((s.paidAmount / s.totalAmount) * 100)) : 0;
        return {
          id: `debt-sale-${s.id}`,
          source: 'product' as const,
          name: s.buyerName,
          company: s.buyerCompany,
          clientId: s.clientId,
          itemId: s.productId,
          itemTitle: s.productName || 'محصول تولیدی',
          tierName: s.tierName,
          saleId: s.id,
          totalAmount: s.totalAmount,
          paidAmount: s.paidAmount,
          remainingAmount: s.remainingAmount,
          paidPercent: paidPct,
          date: s.date
        };
      });

    return [...projectDebtors, ...productDebtors];
  }, [projects, clients, payments, productSales]);

  const filteredDebtors = useMemo(() => {
    return allDebtors
      .filter((d) => {
        if (debtorSourceFilter !== 'all' && d.source !== debtorSourceFilter) return false;
        if (debtorSearch.trim()) {
          const q = debtorSearch.trim().toLowerCase();
          return (
            d.name.toLowerCase().includes(q) ||
            (d.company || '').toLowerCase().includes(q) ||
            d.itemTitle.toLowerCase().includes(q) ||
            (d.tierName || '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) =>
        debtorSort === 'highest'
          ? b.remainingAmount - a.remainingAmount
          : a.paidPercent - b.paidPercent
      );
  }, [allDebtors, debtorSourceFilter, debtorSearch, debtorSort]);

  // ==========================================
  // 3. UNIFIED CUSTOMERS & BUYERS DIRECTORY ("کی چی خریده؟")
  // ==========================================
  const buyerDirectory = useMemo<BuyerAccountSummary[]>(() => {
    const map = new Map<string, BuyerAccountSummary>();

    const getOrCreate = (key: string, name: string, company?: string, clientId?: string) => {
      const existing = map.get(key);
      if (existing) return existing;
      const created: BuyerAccountSummary = {
        key,
        clientId,
        name,
        company,
        totalValue: 0,
        totalPaid: 0,
        remainingDebt: 0,
        projects: [],
        productSales: []
      };
      map.set(key, created);
      return created;
    };

    // Add all projects grouped by client
    projects.forEach((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      const key = p.clientId ? `client:${p.clientId}` : `proj-client:${p.clientName || p.id}`;
      const acc = getOrCreate(key, client?.name || p.clientName || 'کارفرما', client?.company, p.clientId);
      const st = getProjectStats(p.id);
      acc.projects.push({
        id: p.id,
        title: p.title,
        contractValue: st.contractValue,
        paid: st.totalPaid,
        remaining: st.remainingBalance
      });
      acc.totalValue += st.contractValue;
      acc.totalPaid += st.totalPaid;
      acc.remainingDebt += st.remainingBalance;
    });

    // Add all product sales grouped by clientId OR normalized buyerName
    productSales.forEach((s) => {
      const client = s.clientId ? clients.find((c) => c.id === s.clientId) : undefined;
      const key = s.clientId
        ? `client:${s.clientId}`
        : `buyer:${s.buyerName.trim().toLowerCase()}`;
      const acc = getOrCreate(
        key,
        client?.name || s.buyerName,
        client?.company || s.buyerCompany,
        s.clientId
      );
      const events = getNormalizedSaleEvents(s);
      acc.productSales.push({
        id: s.id,
        productId: s.productId,
        productName: s.productName || 'محصول',
        tierName: s.tierName,
        saleType: s.saleType,
        totalAmount: s.totalAmount,
        paidAmount: s.paidAmount,
        remainingAmount: s.remainingAmount,
        eventsCount: events.length
      });
      acc.totalValue += s.totalAmount;
      acc.totalPaid += s.paidAmount;
      acc.remainingDebt += s.remainingAmount;
    });

    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [projects, clients, payments, productSales]);

  const filteredBuyers = useMemo(() => {
    return buyerDirectory.filter((b) => {
      if (buyerStatusFilter === 'debtors' && b.remainingDebt <= 0) return false;
      if (buyerStatusFilter === 'settled' && b.remainingDebt > 0) return false;
      if (buyerSearch.trim()) {
        const q = buyerSearch.trim().toLowerCase();
        const matchHeader =
          b.name.toLowerCase().includes(q) || (b.company || '').toLowerCase().includes(q);
        const matchProjects = b.projects.some((p) => p.title.toLowerCase().includes(q));
        const matchProducts = b.productSales.some(
          (s) =>
            s.productName.toLowerCase().includes(q) ||
            (s.tierName || '').toLowerCase().includes(q) ||
            s.saleType.toLowerCase().includes(q)
        );
        return matchHeader || matchProjects || matchProducts;
      }
      return true;
    });
  }, [buyerDirectory, buyerStatusFilter, buyerSearch]);

  // ==========================================
  // 4. BANK ACCOUNTS BREAKDOWN & CHARTS
  // ==========================================
  const bankInflowStats = useMemo(() => {
    const totals = new Map<string, { amount: number; count: number }>();
    combinedTransactions
      .filter((t) => t.isIncome && t.bankAccountId)
      .forEach((t) => {
        const curr = totals.get(t.bankAccountId!) || { amount: 0, count: 0 };
        curr.amount += t.amount;
        curr.count += 1;
        totals.set(t.bankAccountId!, curr);
      });

    return bankAccounts.map((acc) => {
      const stat = totals.get(acc.id) || { amount: 0, count: 0 };
      return {
        account: acc,
        totalReceived: stat.amount,
        txCount: stat.count
      };
    });
  }, [bankAccounts, combinedTransactions]);

  const monthlyData = useMemo(() => {
    const buckets = PERSIAN_MONTHS.map((name) => ({
      name,
      income: 0,
      expense: 0,
      profit: 0
    }));
    payments
      .filter((p) => p.status === 'completed')
      .forEach((p) => {
        const idx = extractMonthIdx(p.date) ?? 0;
        buckets[idx].income += p.amount || 0;
      });
    productSales.forEach((s) => {
      const events = getNormalizedSaleEvents(s);
      events.forEach((ev) => {
        if ((ev.paidAmount || 0) > 0) {
          const idx = extractMonthIdx(ev.date || s.date) ?? 0;
          buckets[idx].income += ev.paidAmount || 0;
        }
      });
    });
    expenses.forEach((e) => {
      const idx = extractMonthIdx(e.purchaseDate) ?? 0;
      buckets[idx].expense += e.purchaseCost || 0;
    });
    productCosts.forEach((c) => {
      const idx = extractMonthIdx(c.date) ?? 0;
      buckets[idx].expense += c.amount || 0;
    });
    buckets.forEach((b) => {
      b.profit = b.income - b.expense;
    });
    return buckets.slice(0, 6);
  }, [payments, expenses, productSales, productCosts]);

  const projectProfitData = useMemo(() => {
    return projects.slice(0, 6).map((p) => {
      const st = getProjectStats(p.id);
      return {
        name: p.title.length > 16 ? `${p.title.slice(0, 16)}…` : p.title,
        fullTitle: p.title,
        قرارداد: st.contractValue,
        دریافتی: st.totalPaid,
        هزینه: st.totalExpenses,
        سود: st.netProfit
      };
    });
  }, [projects, payments, expenses]);

  // Select options
  const bankFilterOptions = [
    { value: 'all', label: 'همه حساب‌های بانکی' },
    ...bankAccounts.map((b) => ({
      value: b.id,
      label: `${b.bankName} — ${b.accountHolder}`
    }))
  ];

  const projectOptions = [
    { value: '', label: 'هزینه عمومی شرکت (بدون پروژه خاص)' },
    ...projects.map((p) => ({ value: p.id, label: p.title, sublabel: p.clientName }))
  ];

  const expenseTypeOptions = expenseTypes.map((et) => ({
    value: et.id,
    label: et.label,
    dotColorClass: (STATUS_COLOR_STYLES[et.color] || STATUS_COLOR_STYLES.slate).dot
  }));

  const expenseCatOptions = expenseCategories.map((c) => ({ value: c, label: c }));

  const billingOptions = [
    { value: 'one-time', label: 'یک‌باره' },
    { value: 'monthly', label: 'ماهانه' },
    { value: 'quarterly', label: 'فصلی (۳ ماهه)' },
    { value: 'annual', label: 'سالانه' }
  ];

  const paymentStatusOptions = [
    { value: 'paid', label: 'پرداخت و تسویه شده', dotColorClass: 'bg-emerald-500' },
    { value: 'pending', label: 'تعهدی / در انتظار پرداخت', dotColorClass: 'bg-amber-500' }
  ];

  const incomeTxCount = combinedTransactions.filter((t) => t.isIncome).length;
  const expenseTxCount = combinedTransactions.filter((t) => !t.isIncome).length;

  return (
    <div className="space-y-6 pb-8 font-['Vazirmatn']">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Wallet className="text-indigo-600" size={26} />
            تراز مالی و مینی‌حسابداری
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            جستجوی کامل تراکنش‌ها، مدیریت بدهکاران و مطالبات، پرونده مالی خریداران و تراز حساب‌های بانکی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openProjectPaymentModal(undefined)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowDownLeft size={15} />
            دریافتی پروژه
          </button>
          <button
            type="button"
            onClick={() => setIsAddProductSaleModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag size={15} />
            فروش محصول
          </button>
          <button
            type="button"
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowUpRight size={15} />
            ثبت هزینه جدید
          </button>
        </div>
      </div>

      {/* 5-Card Financial Summary (Interactive shortcuts to tabs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
        <div
          onClick={() => setFinanceTab('buyers')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 shadow-sm transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>کل درآمد (پروژه + محصول)</span>
            <Briefcase size={16} className="text-indigo-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2 tabular-nums">
            {formatPrice(financeSummary.totalRevenue)}
            <span className="text-[10px] font-bold text-slate-400 mr-1">تومان</span>
          </p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 tabular-nums">
            {toPersianDigits(projects.length)} پروژه · {toPersianDigits(financeSummary.productsSalesCount)} پرونده محصول
          </p>
        </div>

        <div
          onClick={() => {
            setFinanceTab('ledger');
            setLedgerFilter('income');
          }}
          className="bg-white rounded-2xl p-4 border border-emerald-200/80 hover:border-emerald-400 shadow-sm transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>دریافتی نقدی کل</span>
            <CreditCard size={16} className="text-emerald-600" />
          </div>
          <p className="text-lg font-black text-emerald-700 mt-2 tabular-nums">
            {formatPrice(financeSummary.totalPaid)}
            <span className="text-[10px] font-bold text-emerald-500 mr-1">تومان</span>
          </p>
          <p className="text-[10px] text-emerald-600/80 font-bold mt-1 tabular-nums">
            {toPersianDigits(incomeTxCount)} واریزی ثبت‌شده
          </p>
        </div>

        <div
          onClick={() => {
            setFinanceTab('ledger');
            setLedgerFilter('expense');
          }}
          className="bg-white rounded-2xl p-4 border border-rose-200/70 hover:border-rose-400 shadow-sm transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-600">
            <span>کل هزینه‌ها و تولید</span>
            <ArrowUpRight size={16} className="text-rose-500" />
          </div>
          <p className="text-lg font-black text-rose-700 mt-2 tabular-nums">
            {formatPrice(financeSummary.totalExpenses)}
            <span className="text-[10px] font-bold text-rose-400 mr-1">تومان</span>
          </p>
          <p className="text-[10px] text-slate-500 font-bold mt-1 tabular-nums">
            پرداخت‌شده: {formatPrice(financeSummary.paidExpenses)}
          </p>
        </div>

        <div
          onClick={() => setFinanceTab('analytics')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-4 shadow-sm transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-indigo-100">
            <span>سود خالص کل</span>
            <TrendingUp size={16} className="text-indigo-200" />
          </div>
          <p className="text-lg font-black mt-2 tabular-nums">
            {formatPrice(financeSummary.netProfit)}
            <span className="text-[10px] font-bold text-indigo-200 mr-1">تومان</span>
          </p>
          <p className="text-[10px] text-indigo-100 font-bold mt-1 tabular-nums">
            تراز نقدی فعلی: {formatPrice(financeSummary.cashNetProfit)}
          </p>
        </div>

        <div
          onClick={() => setFinanceTab('debtors')}
          className="bg-white rounded-2xl p-4 border border-amber-200/80 hover:border-amber-400 shadow-sm transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700">
            <span>کل مطالبات و بدهکاران</span>
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <p className="text-lg font-black text-amber-700 mt-2 tabular-nums">
            {formatPrice(financeSummary.pendingReceivables)}
            <span className="text-[10px] font-bold text-amber-500 mr-1">تومان</span>
          </p>
          <p className="text-[10px] text-slate-500 font-bold mt-1 tabular-nums">
            {toPersianDigits(allDebtors.length)} بدهکار فعال · مشاهده لیست ←
          </p>
        </div>
      </div>

      {/* Projects vs Products Financial Split Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Briefcase size={18} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">بخش پروژه‌ها و قراردادها</span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                قرارداد: {formatPrice(financeSummary.projectsRevenue)} · دریافتی:{' '}
                {formatPrice(financeSummary.projectsPaid)} · طلب:{' '}
                <strong className="text-rose-600">{formatPrice(financeSummary.projectsPendingReceivables)}</strong>
              </span>
            </div>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 block">سود خالص پروژه‌ها</span>
            <span className="text-sm font-black text-emerald-700 tabular-nums">
              {formatPrice(financeSummary.projectsNetProfit)} تومان
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">
                بخش محصولات تولیدی ({toPersianDigits(products.length)} محصول)
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                فروش: {formatPrice(financeSummary.productsRevenue)} · دریافتی:{' '}
                {formatPrice(financeSummary.productsPaid)} · طلب:{' '}
                <strong className="text-rose-600">{formatPrice(financeSummary.productsPendingReceivables)}</strong>
              </span>
            </div>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 block">سود خالص محصولات</span>
            <span
              className={`text-sm font-black tabular-nums ${
                financeSummary.productsNetProfit >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {formatPrice(financeSummary.productsNetProfit)} تومان
            </span>
          </div>
        </div>
      </div>

      {/* 4-Tab Mini-Accounting Workspace Switcher */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto shadow-sm">
        {(
          [
            {
              id: 'ledger',
              label: 'دفتر کل تراکنش‌ها',
              count: combinedTransactions.length,
              badgeStyle: 'bg-slate-100 text-slate-700',
              icon: FileSpreadsheet
            },
            {
              id: 'debtors',
              label: 'لیست بدهکاران و مطالبات',
              count: allDebtors.length,
              badgeStyle:
                allDebtors.length > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700',
              icon: AlertCircle
            },
            {
              id: 'buyers',
              label: 'حساب مشتریان و خریداران (کی چی خریده؟)',
              count: buyerDirectory.length,
              badgeStyle: 'bg-indigo-50 text-indigo-700',
              icon: Users
            },
            {
              id: 'analytics',
              label: 'حساب‌های بانکی و نمودارها',
              count: bankAccounts.length,
              badgeStyle: 'bg-slate-100 text-slate-700',
              icon: BarChart3
            }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = financeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFinanceTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black tabular-nums ${
                  isActive ? 'bg-white/20 text-white' : tab.badgeStyle
                }`}
              >
                {toPersianDigits(tab.count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB 1: MASTER TRANSACTION LEDGER           */}
      {/* ========================================== */}
      {financeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  دفتر کل تراکنش‌های مالی (ریز واریزی‌های نقد و هزینه‌ها)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  هر واریزی خرید، ارتقا، تمدید یا قسط به تفکیک تاریخ و حساب بانکی مقصد نمایش داده می‌شود
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'all', label: 'همه منابع' },
                    { id: 'projects', label: 'پروژه‌ها' },
                    { id: 'products', label: 'محصولات' }
                  ].map((src) => (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setSourceFilter(src.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        sourceFilter === src.id
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'all', label: `همه (${toPersianDigits(combinedTransactions.length)})` },
                    { id: 'income', label: `دریافتی‌ها (${toPersianDigits(incomeTxCount)})` },
                    { id: 'expense', label: `هزینه‌ها (${toPersianDigits(expenseTxCount)})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLedgerFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        ledgerFilter === tab.id
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search + Bank Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-7 relative">
                <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="جستجو بر اساس نام خریدار، شرکت، محصول، نسخه، پروژه، کد رهگیری یا حساب بانکی..."
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-5">
                <CustomSelect
                  value={bankFilter}
                  onChange={setBankFilter}
                  options={bankFilterOptions}
                  placeholder="فیلتر بر اساس حساب بانکی..."
                />
              </div>
            </div>

            {/* Live Filtered Totals Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs tabular-nums">
              <span className="font-bold text-slate-500">
                نمایش <strong className="text-slate-900">{toPersianDigits(filteredTransactions.length)}</strong> تراکنش
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-emerald-700">
                  جمع دریافتی: +{formatPrice(filteredLedgerSummary.income)} تومان
                </span>
                <span className="font-bold text-rose-600">
                  جمع هزینه: -{formatPrice(filteredLedgerSummary.expense)} تومان
                </span>
                <span className="font-black text-indigo-700">
                  خالص فیلترشده: {formatPrice(filteredLedgerSummary.net)} تومان
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500">
                  <th className="py-3.5 px-4 font-bold">شرح تراکنش</th>
                  <th className="py-3.5 px-4 font-bold">پروژه / محصول و خریدار</th>
                  <th className="py-3.5 px-4 font-bold">تاریخ</th>
                  <th className="py-3.5 px-4 font-bold">روش / سرفصل</th>
                  <th className="py-3.5 px-4 font-bold">حساب مقصد / تامین‌کننده</th>
                  <th className="py-3.5 px-4 font-bold">مبلغ (تومان)</th>
                  <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      تراکنشی با این فیلتر یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={`${tx.txKind}-${tx.id}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {tx.isIncome ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                              <span>{tx.title}</span>
                              {tx.source === 'products' && (
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black">
                                  محصول
                                </span>
                              )}
                              {tx.tierName && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                                  {tx.tierName}
                                </span>
                              )}
                            </div>
                            {tx.code && (
                              <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                                {toPersianDigits(tx.code)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.projectId ? (
                          <button
                            type="button"
                            onClick={() => jumpToProject(tx.projectId!)}
                            className="font-bold text-indigo-700 hover:underline text-right block cursor-pointer"
                          >
                            {tx.projectName || 'پروژه'}
                          </button>
                        ) : tx.productId ? (
                          <button
                            type="button"
                            onClick={() => jumpToProduct(tx.productId!)}
                            className="font-bold text-emerald-700 hover:underline text-right block cursor-pointer"
                          >
                            {tx.productName || 'محصول'}
                          </button>
                        ) : (
                          <span className="text-slate-400">عمومی</span>
                        )}
                        {tx.clientId && tx.clientName ? (
                          <button
                            type="button"
                            onClick={() => jumpToClient(tx.clientId!)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 block mt-0.5 cursor-pointer"
                          >
                            {tx.clientName}
                          </button>
                        ) : tx.clientName ? (
                          <span className="text-[10px] text-slate-500 block mt-0.5">{tx.clientName}</span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-bold tabular-nums whitespace-nowrap">
                        {toPersianDigits(tx.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                            tx.isIncome
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tx.methodOrType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700 text-[11px]">
                        {toPersianDigits(tx.accountOrCategory)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-black tabular-nums whitespace-nowrap ${
                          tx.isIncome ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {tx.isIncome ? '+' : '-'} {formatPrice(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {tx.saleId && (
                            <button
                              type="button"
                              onClick={() => openProductSaleLedger(tx.saleId!, 'history')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="مشاهده پرونده و مدیریت پرداخت خریدار"
                            >
                              <History size={12} />
                              پرونده
                            </button>
                          )}
                          {tx.txKind !== 'product_sale' && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: tx.id,
                                  saleId: tx.saleId,
                                  txKind: tx.txKind,
                                  title: tx.title
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف تراکنش"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: DEDICATED DEBTORS & RECEIVABLES     */}
      {/* ========================================== */}
      {financeTab === 'debtors' && (
        <div className="space-y-4">
          {/* Debtors KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-rose-600 block">جمع کل مطالبات (طلب از مشتریان)</span>
              <div className="text-lg font-black text-rose-700 mt-1 tabular-nums">
                {formatPrice(financeSummary.pendingReceivables)}{' '}
                <span className="text-[11px] font-bold text-rose-400">تومان</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block tabular-nums">
                در {toPersianDigits(allDebtors.length)} پرونده بدهکار فعال
              </span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-600 block">مطالبات پروژه‌ها</span>
              <div className="text-lg font-black text-slate-900 mt-1 tabular-nums">
                {formatPrice(financeSummary.projectsPendingReceivables)}{' '}
                <span className="text-[11px] font-bold text-slate-400">تومان</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block tabular-nums">
                {toPersianDigits(allDebtors.filter((d) => d.source === 'project').length)} پروژه تسویه‌نشده
              </span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-700 block">مطالبات محصولات و ارتقاها</span>
              <div className="text-lg font-black text-slate-900 mt-1 tabular-nums">
                {formatPrice(financeSummary.productsPendingReceivables)}{' '}
                <span className="text-[11px] font-bold text-slate-400">تومان</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block tabular-nums">
                {toPersianDigits(allDebtors.filter((d) => d.source === 'product').length)} پرونده محصول بدهکار
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">لیست جامع بدهکاران و مانده حساب‌ها</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  مشاهده سریع تمام پروژه‌ها و فروش‌های محصولی که هنوز تسویه کامل نشده‌اند با امکان ثبت پرداخت فوری
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={debtorSearch}
                    onChange={(e) => setDebtorSearch(e.target.value)}
                    placeholder="جستجوی بدهکار، محصول، پروژه..."
                    className="pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-56"
                  />
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'project', label: 'پروژه‌ها' },
                    { id: 'product', label: 'محصولات' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDebtorSourceFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        debtorSourceFilter === f.id
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'highest', label: 'بیشترین بدهی' },
                    { id: 'lowest_paid_pct', label: 'کمترین درصد وصول' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setDebtorSort(s.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                        debtorSort === s.id
                          ? 'bg-white text-rose-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredDebtors.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 size={38} className="mx-auto text-emerald-500" />
                <p className="text-sm font-black text-slate-800">هیچ بدهکار فعالی در این لیست وجود ندارد</p>
                <p className="text-xs text-slate-500">
                  تمامی حساب‌های فیلترشده به صورت کامل تسویه شده‌اند.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500">
                      <th className="py-3.5 px-4 font-bold">نام بدهکار / شرکت</th>
                      <th className="py-3.5 px-4 font-bold">بابت پروژه یا محصول</th>
                      <th className="py-3.5 px-4 font-bold">مبلغ کل پرونده</th>
                      <th className="py-3.5 px-4 font-bold">پرداخت‌شده</th>
                      <th className="py-3.5 px-4 font-bold">مانده بدهی</th>
                      <th className="py-3.5 px-4 font-bold">درصد وصول</th>
                      <th className="py-3.5 px-4 font-bold text-left">عملیات وصول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDebtors.map((row) => (
                      <tr key={row.id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-3.5 px-4">
                          {row.clientId ? (
                            <button
                              type="button"
                              onClick={() => jumpToClient(row.clientId!)}
                              className="text-right group cursor-pointer"
                            >
                              <div className="font-black text-slate-900 group-hover:text-indigo-600">
                                {row.name}
                              </div>
                              {row.company && (
                                <div className="text-[10px] text-slate-400">{row.company}</div>
                              )}
                            </button>
                          ) : (
                            <div>
                              <div className="font-black text-slate-900">{row.name}</div>
                              {row.company && (
                                <div className="text-[10px] text-slate-400">{row.company}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                row.source === 'project'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {row.source === 'project' ? 'پروژه' : 'محصول'}
                            </span>
                            {row.tierName && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                                {row.tierName}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              row.source === 'project'
                                ? jumpToProject(row.itemId)
                                : jumpToProduct(row.itemId)
                            }
                            className="font-bold text-slate-800 hover:text-indigo-600 mt-1 block text-right cursor-pointer"
                          >
                            {row.itemTitle}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700 tabular-nums whitespace-nowrap">
                          {formatPrice(row.totalAmount)} تومان
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                          {formatPrice(row.paidAmount)} تومان
                        </td>
                        <td className="py-3.5 px-4 font-black text-rose-700 tabular-nums whitespace-nowrap">
                          {formatPrice(row.remainingAmount)} تومان
                        </td>
                        <td className="py-3.5 px-4 min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1 tabular-nums">
                            <span>٪{toPersianDigits(row.paidPercent)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${row.paidPercent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-left whitespace-nowrap">
                          {row.source === 'product' && row.saleId ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openProductSaleLedger(row.saleId!, 'payment')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Wallet size={13} />
                                ثبت پرداخت
                              </button>
                              <button
                                type="button"
                                onClick={() => openProductSaleLedger(row.saleId!, 'history')}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                                title="تاریخچه پرونده"
                              >
                                <History size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openProjectPaymentModal(row.itemId)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <ArrowDownLeft size={13} />
                              ثبت دریافتی
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: CUSTOMERS & BUYERS DIRECTORY        */}
      {/* ========================================== */}
      {financeTab === 'buyers' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-black text-slate-900">
                دفتر حساب مشتریان و خریداران (کی چی خریده و چقدر بدهکاره؟)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                نمای یکپارچه تمام پروژه‌ها و محصولات خریداری‌شده توسط هر شخص یا شرکت به همراه وضعیت تسویه
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={buyerSearch}
                  onChange={(e) => setBuyerSearch(e.target.value)}
                  placeholder="جستجوی نام، شرکت، محصول، نسخه یا پروژه..."
                  className="pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-64"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'all', label: `همه (${toPersianDigits(buyerDirectory.length)})` },
                  {
                    id: 'debtors',
                    label: `بدهکاران (${toPersianDigits(
                      buyerDirectory.filter((b) => b.remainingDebt > 0).length
                    )})`
                  },
                  {
                    id: 'settled',
                    label: `تسویه‌شده (${toPersianDigits(
                      buyerDirectory.filter((b) => b.remainingDebt === 0).length
                    )})`
                  }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBuyerStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                      buyerStatusFilter === f.id
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredBuyers.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400">
              مشتری یا خریداری با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBuyers.map((buyer) => (
                <div
                  key={buyer.key}
                  className="p-5 hover:bg-slate-50/50 transition-colors space-y-3.5"
                >
                  {/* Top Row: Buyer Info + Overall Financial Totals */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          buyer.remainingDebt > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {buyer.name.trim().charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {buyer.clientId ? (
                            <button
                              type="button"
                              onClick={() => jumpToClient(buyer.clientId!)}
                              className="text-sm font-black text-slate-900 hover:text-indigo-600 inline-flex items-center gap-1 cursor-pointer"
                            >
                              {buyer.name}
                              <ExternalLink size={12} className="text-slate-400" />
                            </button>
                          ) : (
                            <span className="text-sm font-black text-slate-900">{buyer.name}</span>
                          )}
                          {buyer.remainingDebt > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black tabular-nums">
                              بدهکار: {formatPrice(buyer.remainingDebt)} تومان
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold">
                              حساب تسویه کامل
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {buyer.company || 'خریدار مستقیم'} ·{' '}
                          {toPersianDigits(buyer.projects.length)} پروژه ·{' '}
                          {toPersianDigits(buyer.productSales.length)} محصول
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">جمع کل خرید و قرارداد</span>
                        <span className="font-black text-slate-900">{formatPrice(buyer.totalValue)} تومان</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 block">پرداختی کل</span>
                        <span className="font-black text-emerald-700">{formatPrice(buyer.totalPaid)} تومان</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-500 block">مانده بدهی</span>
                        <span
                          className={`font-black ${
                            buyer.remainingDebt > 0 ? 'text-rose-700' : 'text-slate-400'
                          }`}
                        >
                          {formatPrice(buyer.remainingDebt)} تومان
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchased Items List (Projects + Products with Quick Actions) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {buyer.projects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold shrink-0">
                              پروژه
                            </span>
                            <button
                              type="button"
                              onClick={() => jumpToProject(p.id)}
                              className="font-bold text-slate-800 hover:text-indigo-600 truncate cursor-pointer"
                            >
                              {p.title}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 tabular-nums">
                            مبلغ: {formatPrice(p.contractValue)} · پرداختی: {formatPrice(p.paid)}
                            {p.remaining > 0 && (
                              <span className="text-rose-600 font-bold">
                                {' '}
                                · بدهکار: {formatPrice(p.remaining)}
                              </span>
                            )}
                          </div>
                        </div>
                        {p.remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => openProjectPaymentModal(p.id)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                          >
                            ثبت واریزی
                          </button>
                        )}
                      </div>
                    ))}

                    {buyer.productSales.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold shrink-0">
                              محصول
                            </span>
                            <button
                              type="button"
                              onClick={() => jumpToProduct(s.productId)}
                              className="font-bold text-slate-800 hover:text-emerald-700 truncate cursor-pointer"
                            >
                              {s.productName}
                            </button>
                            {s.tierName && (
                              <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-bold">
                                {s.tierName}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 tabular-nums">
                            کل پرونده: {formatPrice(s.totalAmount)} · پرداختی: {formatPrice(s.paidAmount)}
                            {s.remainingAmount > 0 ? (
                              <span className="text-rose-600 font-bold">
                                {' '}
                                · بدهکار: {formatPrice(s.remainingAmount)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold"> · تسویه</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openProductSaleLedger(s.id, s.remainingAmount > 0 ? 'payment' : 'history')
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer ${
                            s.remainingAmount > 0
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <History size={12} />
                          {s.remainingAmount > 0 ? 'پرداخت / پرونده' : 'تاریخچه'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: BANK ACCOUNTS & CHARTS              */}
      {/* ========================================== */}
      {financeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Bank Accounts Cash Inflow Breakdown */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Landmark size={17} className="text-indigo-600" />
                گردش ورودی به تفکیک کارت و حساب‌های بانکی
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مجموع مبالغ واریزشده به هر حساب از محل پروژه‌ها و فروش محصولات
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {bankInflowStats.map(({ account, totalReceived, txCount }) => (
                <div
                  key={account.id}
                  className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-indigo-300 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900">{account.bankName}</span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-500">
                        {account.type}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 truncate">
                      {account.accountHolder}
                    </p>
                    {account.cardNumber && (
                      <p dir="ltr" className="text-[10px] font-bold text-slate-400 text-right tabular-nums">
                        {formatCardNumber(account.cardNumber)}
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/70 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">جمع واریزی به این حساب</span>
                      <span className="text-sm font-black text-emerald-700 tabular-nums">
                        {formatPrice(totalReceived)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                        {toPersianDigits(txCount)} تراکنش
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBankFilter(account.id);
                          setLedgerFilter('income');
                          setFinanceTab('ledger');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        مشاهده تراکنش‌ها ←
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 mb-1">نمودار جریان نقدینگی ماهانه</h4>
              <p className="text-[11px] text-slate-500 mb-4">دریافتی‌های واقعی در برابر هزینه‌های ثبت‌شده</p>
              <div className="h-[250px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="finInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="finExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatMillionTick}
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn' }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div
                            dir="rtl"
                            className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 font-['Vazirmatn']"
                          >
                            <div className="font-black border-b border-slate-700 pb-1">{label}</div>
                            {payload.map((entry: any) => (
                              <div key={entry.dataKey} className="flex justify-between gap-4">
                                <span className="text-slate-300">{entry.name}:</span>
                                <span className="font-bold tabular-nums">
                                  {formatPrice(Number(entry.value) || 0)} تومان
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="دریافتی"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#finInc)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="هزینه"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fill="url(#finExp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 mb-1">سودآوری و دریافتی به تفکیک پروژه</h4>
              <p className="text-[11px] text-slate-500 mb-4">مقایسه مبلغ قرارداد، دریافتی نقدی و سود خالص</p>
              <div className="h-[250px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectProfitData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Vazirmatn' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatMillionTick}
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn' }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0].payload;
                        return (
                          <div
                            dir="rtl"
                            className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 font-['Vazirmatn']"
                          >
                            <div className="font-black border-b border-slate-700 pb-1">{row.fullTitle}</div>
                            <div className="flex justify-between gap-4">
                              <span className="text-indigo-300">قرارداد:</span>
                              <span className="font-bold tabular-nums">{formatPrice(row.قرارداد)} تومان</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-emerald-300">دریافتی:</span>
                              <span className="font-bold tabular-nums">{formatPrice(row.دریافتی)} تومان</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-rose-300">هزینه:</span>
                              <span className="font-bold tabular-nums">{formatPrice(row.هزینه)} تومان</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-slate-700">
                              <span className="text-amber-300 font-bold">سود خالص:</span>
                              <span className="font-black tabular-nums">{formatPrice(row.سود)} تومان</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="دریافتی" fill="#10b981" radius={[6, 6, 0, 0]} barSize={14} />
                    <Bar dataKey="هزینه" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={14} />
                    <Bar dataKey="سود" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Project Payment Modal */}
      <PaymentFormModal
        isOpen={isAddIncomeModalOpen}
        onClose={() => {
          setIsAddIncomeModalOpen(false);
          setLockedProjectIdForPayment(undefined);
        }}
        lockedProjectId={lockedProjectIdForPayment}
      />

      {/* Product Sale Modal */}
      <ProductSaleModal
        isOpen={isAddProductSaleModalOpen}
        onClose={() => setIsAddProductSaleModalOpen(false)}
      />

      {/* Product Sale Payment Manager & History Modal */}
      <ProductSaleLedgerModal
        isOpen={saleLedgerModal.isOpen}
        onClose={() => setSaleLedgerModal((s) => ({ ...s, isOpen: false }))}
        saleId={saleLedgerModal.saleId}
        initialTab={saleLedgerModal.initialTab}
      />

      {/* Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-lg font-black text-slate-800">ثبت هزینه یا پرداخت جدید</h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <form className="space-y-4" onSubmit={handleAddExpenseSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">پروژه مرتبط</label>
                    <CustomSelect
                      value={newExp.projectId}
                      onChange={(val) => setNewExp({ ...newExp, projectId: val })}
                      options={projectOptions}
                      searchable
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">نوع هزینه *</label>
                      <button
                        type="button"
                        onClick={() => setIsExpTypeManagerOpen(true)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Settings2 size={11} /> تعریف / ویرایش
                      </button>
                    </div>
                    <CustomSelect
                      value={newExp.type}
                      onChange={(val) => setNewExp({ ...newExp, type: val })}
                      options={expenseTypeOptions}
                    />
                  </div>
                </div>

                {newExp.type === 'other' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">سرفصل موضوعی هزینه</label>
                      <button
                        type="button"
                        onClick={() => setIsExpCatManagerOpen(true)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Settings2 size={11} /> تعریف / ویرایش سرفصل‌ها
                      </button>
                    </div>
                    <CustomSelect
                      value={newExp.categoryTitle}
                      onChange={(val) => setNewExp({ ...newExp, categoryTitle: val })}
                      options={expenseCatOptions}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">عنوان هزینه *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً: تمدید سرور ابری یا طراحی بنر"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                      value={newExp.title}
                      onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">تامین‌کننده / ذی‌نفع</label>
                    <input
                      type="text"
                      placeholder="مثلاً: آروان‌کلود یا نام طراح"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                      value={newExp.provider}
                      onChange={(e) => setNewExp({ ...newExp, provider: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">مبلغ هزینه *</label>
                    <FormattedNumberInput
                      required
                      value={newExp.purchaseCost}
                      onChange={(val) => setNewExp({ ...newExp, purchaseCost: val })}
                      placeholder="مثلاً: ۳,۵۰۰,۰۰۰"
                      suffix="تومان"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">تاریخ هزینه</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={newExp.purchaseDate}
                      onChange={(d) =>
                        setNewExp({ ...newExp, purchaseDate: d?.format?.('YYYY/MM/DD') || '' })
                      }
                      inputClass="rmdp-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">وضعیت تسویه</label>
                    <CustomSelect
                      value={newExp.paymentStatus}
                      onChange={(val) => setNewExp({ ...newExp, paymentStatus: val as any })}
                      options={paymentStatusOptions}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">دوره پرداخت</label>
                    <CustomSelect
                      value={newExp.billingCycle}
                      onChange={(val) => setNewExp({ ...newExp, billingCycle: val as any })}
                      options={billingOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">تاریخ انقضا (اختیاری)</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={newExp.expirationDate}
                      onChange={(d) =>
                        setNewExp({ ...newExp, expirationDate: d?.format?.('YYYY/MM/DD') || '' })
                      }
                      inputClass="rmdp-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">توضیحات</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    value={newExp.notes}
                    onChange={(e) => setNewExp({ ...newExp, notes: e.target.value })}
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ثبت هزینه در دفتر مالی
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Expense Types Manager Modal */}
      <OptionManagerModal
        mode="status"
        isOpen={isExpTypeManagerOpen}
        onClose={() => setIsExpTypeManagerOpen(false)}
        title="مدیریت انواع هزینه"
        subtitle="افزودن، تغییر نام، رنگ‌بندی یا حذف انواع هزینه در کل سیستم"
        items={expenseTypes}
        onAdd={addExpenseType}
        onUpdate={updateExpenseType}
        onDelete={deleteExpenseType}
      />

      {/* Expense Categories Manager Modal */}
      <OptionManagerModal
        mode="string"
        isOpen={isExpCatManagerOpen}
        onClose={() => setIsExpCatManagerOpen(false)}
        title="مدیریت سرفصل‌های موضوعی هزینه"
        subtitle="افزودن، ویرایش یا حذف سرفصل‌های هزینه برای کل سیستم"
        items={expenseCategories}
        onAdd={addExpenseCategory}
        onUpdate={updateExpenseCategory}
        onDelete={deleteExpenseCategory}
      />

      {/* Confirm Delete Transaction */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.txKind === 'project_payment') {
            deletePayment(deleteTarget.id);
          } else if (deleteTarget.txKind === 'project_expense') {
            deleteExpense(deleteTarget.id);
          } else if (deleteTarget.txKind === 'product_sale_event' && deleteTarget.saleId) {
            deleteProductSaleEvent(deleteTarget.saleId, deleteTarget.id);
          } else if (deleteTarget.txKind === 'product_sale' && deleteTarget.saleId) {
            deleteProductSale(deleteTarget.saleId);
          } else if (deleteTarget.txKind === 'product_cost') {
            deleteProductCost(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        title="حذف تراکنش مالی"
        message={
          deleteTarget?.txKind === 'product_sale_event'
            ? `آیا از حذف واریزی «${deleteTarget.title}» مطمئن هستید؟ این مبلغ دوباره به مانده بدهی خریدار اضافه خواهد شد.`
            : deleteTarget?.txKind === 'product_sale'
            ? `آیا از حذف کامل پرونده فروش «${deleteTarget.title}» مطمئن هستید؟ تمامی واریزی‌ها و سوابق این فروش حذف می‌شوند.`
            : `آیا از حذف تراکنش «${deleteTarget?.title}» مطمئن هستید؟ تمامی محاسبات مالی به صورت خودکار به‌روزرسانی خواهند شد.`
        }
        confirmText="بله، حذف شود"
        variant="danger"
      />
    </div>
  );
};

export default Finance;
