import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Briefcase,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  Plus,
  Server as ServerIcon,
  Globe,
  CheckCircle2,
  Clock,
  Wallet,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  X,
  ArrowLeft,
  Layers,
  Users,
  Check,
  Package,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useData } from '../context/DataContext';
import {
  formatPrice,
  toPersianDigits,
  toEnglishDigits,
  STATUS_COLOR_STYLES,
  getTodayPersianDate
} from '../constants';
import ProjectFormModal from './ProjectFormModal';
import PaymentFormModal from './PaymentFormModal';
import ProductSaleModal from './ProductSaleModal';

const CHART_PALETTE = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#64748b'];

const PERSIAN_MONTH_LABELS = [
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

// Helper to parse YYYY/MM/DD Persian month index (0-11)
const extractPersianMonthIndex = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const eng = toEnglishDigits(dateStr);
  const parts = eng.split(/[\/\-]/);
  if (parts.length < 2) return null;
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(m) || m < 1 || m > 12) return null;
  return m - 1;
};

const formatMillionAxis = (value: number): string => {
  if (value === 0) return '۰';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${toPersianDigits((value / 1_000_000_000).toFixed(1))} م‌ت`;
  }
  if (abs >= 1_000_000) {
    const m = Math.round(value / 1_000_000);
    return `${toPersianDigits(m)} م`;
  }
  if (abs >= 1_000) {
    return `${toPersianDigits(Math.round(value / 1_000))} ه`;
  }
  return toPersianDigits(value);
};

const getMonogram = (name: string) => {
  const parts = (name || 'ش').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return parts[0].slice(0, 2);
};

const AVATAR_TONES = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700'
];

const BIReport: React.FC = () => {
  const {
    clients,
    projects,
    payments,
    expenses,
    products,
    productSales,
    productCosts,
    servers,
    domains,
    tasks,
    projectStatuses,
    financeSummary,
    topClients,
    getProjectStats,
    toggleTaskStatus,
    setActiveTab,
    setSelectedProjectIdForView,
    setSelectedClientIdForView,
    setSelectedProductIdForView
  } = useData();

  const [chartRange, setChartRange] = useState<'6m' | '12m'>('6m');
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isProductSaleOpen, setIsProductSaleOpen] = useState(false);
  const [paymentModalProjectId, setPaymentModalProjectId] = useState<string | undefined>(undefined);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Derived BI KPIs
  const collectionRate =
    financeSummary.totalRevenue > 0
      ? Math.min(100, Math.round((financeSummary.totalPaid / financeSummary.totalRevenue) * 100))
      : 0;

  const profitMargin =
    financeSummary.totalRevenue > 0
      ? Math.round((financeSummary.netProfit / financeSummary.totalRevenue) * 100)
      : 0;

  const projectsWithStats = useMemo(
    () =>
      projects.map((p) => ({
        project: p,
        stats: getProjectStats(p.id)
      })),
    [projects, payments, expenses]
  );

  const pendingProjects = useMemo(
    () =>
      projectsWithStats
        .filter((item) => item.stats.remainingBalance > 0)
        .sort((a, b) => b.stats.remainingBalance - a.stats.remainingBalance),
    [projectsWithStats]
  );

  const pendingProductSales = useMemo(
    () =>
      productSales
        .filter((s) => s.remainingAmount > 0)
        .sort((a, b) => b.remainingAmount - a.remainingAmount),
    [productSales]
  );

  // 1. Monthly Cashflow & Profit BI Data (live aggregated from real project + product payments & expenses)
  const monthlyCashflowData = useMemo(() => {
    const buckets = PERSIAN_MONTH_LABELS.map((month, idx) => ({
      month,
      monthIndex: idx,
      income: 0,
      expense: 0,
      profit: 0
    }));

    payments
      .filter((p) => p.status === 'completed')
      .forEach((pay) => {
        const mIdx = extractPersianMonthIndex(pay.date);
        const targetIdx = mIdx !== null ? mIdx : 0;
        buckets[targetIdx].income += pay.amount || 0;
      });

    productSales.forEach((sale) => {
      const mIdx = extractPersianMonthIndex(sale.date);
      const targetIdx = mIdx !== null ? mIdx : 0;
      buckets[targetIdx].income += sale.paidAmount || 0;
    });

    expenses.forEach((exp) => {
      const mIdx = extractPersianMonthIndex(exp.purchaseDate);
      const targetIdx = mIdx !== null ? mIdx : 0;
      buckets[targetIdx].expense += exp.purchaseCost || 0;
    });

    productCosts.forEach((cost) => {
      const mIdx = extractPersianMonthIndex(cost.date);
      const targetIdx = mIdx !== null ? mIdx : 0;
      buckets[targetIdx].expense += cost.amount || 0;
    });

    buckets.forEach((b) => {
      b.profit = b.income - b.expense;
    });

    if (chartRange === '6m') {
      const activeIndices = buckets
        .map((b, i) => (b.income > 0 || b.expense > 0 ? i : -1))
        .filter((i) => i >= 0);
      const maxActive = activeIndices.length > 0 ? Math.max(...activeIndices) : 5;
      const end = Math.max(5, maxActive);
      const start = Math.max(0, end - 5);
      return buckets.slice(start, end + 1);
    }

    return buckets;
  }, [payments, expenses, productSales, productCosts, chartRange]);

  // 2. Revenue Distribution by Project Category + Products
  const categoryRevenueData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; count: number }>();
    projects.forEach((p) => {
      const cat = p.category || 'سایر';
      const existing = map.get(cat);
      if (existing) {
        existing.value += p.contractValue || 0;
        existing.count += 1;
      } else {
        map.set(cat, { name: cat, value: p.contractValue || 0, count: 1 });
      }
    });
    if (financeSummary.productsRevenue > 0) {
      map.set('فروش محصولات تولیدی', {
        name: 'فروش محصولات تولیدی',
        value: financeSummary.productsRevenue,
        count: products.length
      });
    }
    return Array.from(map.values())
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [projects, products.length, financeSummary.productsRevenue]);

  // 3. Project Financial Comparison Chart Data
  const projectComparisonData = useMemo(() => {
    return projectsWithStats.slice(0, 6).map(({ project, stats }) => ({
      name: project.title.length > 18 ? `${project.title.slice(0, 18)}…` : project.title,
      fullTitle: project.title,
      قرارداد: stats.contractValue,
      دریافتی: stats.totalPaid,
      هزینه: stats.totalExpenses,
      سود: stats.netProfit
    }));
  }, [projectsWithStats]);

  // 4. Expense Structure Breakdown (includes Products production costs)
  const expenseBreakdownData = useMemo(() => {
    const items = [
      { name: 'تولید محصولات', value: financeSummary.productsCosts, color: '#4f46e5' },
      { name: 'پورسانت و معرفی', value: financeSummary.totalCommissions, color: '#8b5cf6' },
      { name: 'سرور، دامنه و زیرساخت', value: financeSummary.totalInfra, color: '#06b6d4' },
      { name: 'سایر هزینه‌های مستقیم', value: financeSummary.totalOtherExpenses, color: '#f59e0b' }
    ].filter((i) => i.value > 0);
    return items.length > 0 ? items : [{ name: 'بدون هزینه ثبت‌شده', value: 1, color: '#e2e8f0' }];
  }, [financeSummary]);

  // 5. Project Status Distribution & Avg Progress
  const statusDistribution = useMemo(() => {
    return projectStatuses.map((st) => {
      const matched = projects.filter((p) => p.status === st.id || p.status === st.label);
      const avgProgress =
        matched.length > 0
          ? Math.round(matched.reduce((s, p) => s + (p.progress || 0), 0) / matched.length)
          : 0;
      const totalVal = matched.reduce((s, p) => s + (p.contractValue || 0), 0);
      return {
        status: st,
        count: matched.length,
        avgProgress,
        totalVal
      };
    });
  }, [projectStatuses, projects]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'done').slice(0, 5),
    [tasks]
  );

  const openProject = (projectId: string) => {
    setSelectedProjectIdForView(projectId);
    setActiveTab('projects');
  };

  const openClient = (clientId: string) => {
    setSelectedClientIdForView(clientId);
    setActiveTab('clients');
  };

  const openProduct = (productId: string) => {
    setSelectedProductIdForView(productId);
    setActiveTab('products');
  };

  const openQuickPayment = (projectId?: string) => {
    setPaymentModalProjectId(projectId);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-8 font-['Vazirmatn']">
      {/* Top Executive BI Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
            <BarChart3 size={15} />
            <span>هوش تجاری و پایش عملکرد مالی • {toPersianDigits(getTodayPersianDate())}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            گزارش تحلیلی BI پروژه‌ها و محصولات
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تحلیل جامع جریان نقدینگی، سهم درآمد، ساختار هزینه‌ها و سودآوری {toPersianDigits(projects.length)} پروژه و {toPersianDigits(products.length)} محصول تولیدی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openQuickPayment(undefined)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Wallet size={14} /> دریافتی پروژه
          </button>
          <button
            type="button"
            onClick={() => setIsProductSaleOpen(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag size={14} /> فروش محصول
          </button>
          <button
            type="button"
            onClick={() => setIsNewProjectOpen(true)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} /> پروژه جدید
          </button>
        </div>
      </div>

      {/* Primary BI KPI Strip (4 Equal Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Combined Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-500">کل درآمد (پروژه‌ها + محصولات)</p>
              <p className="text-xl font-black text-slate-900 mt-2 tabular-nums">
                {formatPrice(financeSummary.totalRevenue)}
                <span className="text-[11px] font-bold text-slate-400 mr-1">تومان</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
              <span className="text-slate-500">نرخ وصولی کل</span>
              <span className="text-indigo-700 tabular-nums">{toPersianDigits(collectionRate)}٪</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Cash Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-500">دریافتی نقدی کل</p>
              <p className="text-xl font-black text-emerald-700 mt-2 tabular-nums">
                {formatPrice(financeSummary.totalPaid)}
                <span className="text-[11px] font-bold text-emerald-500 mr-1">تومان</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {toPersianDigits(payments.filter((p) => p.status === 'completed').length + productSales.length)} تراکنش ورودی
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              دفتر مالی <ArrowLeft size={12} />
            </button>
          </div>
        </div>

        {/* KPI 3: Combined Net Profit + Cash Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-500">سود خالص کل کسب‌وکار</p>
              <p className="text-xl font-black text-slate-900 mt-2 tabular-nums">
                {formatPrice(financeSummary.netProfit)}
                <span className="text-[11px] font-bold text-slate-400 mr-1">تومان</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              تراز نقدی:{' '}
              <strong className="text-slate-800 tabular-nums">
                {formatPrice(financeSummary.cashNetProfit)}
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold tabular-nums">
              حاشیه {toPersianDigits(profitMargin)}٪
            </span>
          </div>
        </div>

        {/* KPI 4: Pending Receivables (Clickable) */}
        <button
          type="button"
          onClick={() => setShowDebtModal(true)}
          className="bg-white rounded-2xl p-5 border border-rose-200/80 hover:border-rose-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-right cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-2 w-full">
            <div>
              <p className="text-xs font-bold text-rose-600">مطالبات و مانده حساب</p>
              <p className="text-xl font-black text-rose-700 mt-2 tabular-nums">
                {formatPrice(financeSummary.pendingReceivables)}
                <span className="text-[11px] font-bold text-rose-400 mr-1">تومان</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] w-full">
            <span className="text-slate-600 font-medium">
              {toPersianDigits(pendingProjects.length)} پروژه · {toPersianDigits(pendingProductSales.length)} فروش محصول
            </span>
            <span className="text-rose-600 font-bold flex items-center gap-0.5">
              مشاهده و پیگیری <ArrowUpRight size={13} />
            </span>
          </div>
        </button>
      </div>

      {/* Projects vs Products Revenue & Profit BI Comparison Strip */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package size={16} className="text-indigo-600" />
              مقایسه عملکرد مالی: پروژه‌های سفارشی در برابر محصولات تولیدی
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              سهم درآمد، هزینه‌های تولید و سود خالص هر دو موتور درآمدی کسب‌وکار
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            مدیریت محصولات ({toPersianDigits(products.length)}) <ArrowLeft size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Projects Side */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Briefcase size={14} className="text-indigo-600" />
                پروژه‌ها و قراردادها ({toPersianDigits(projects.length)})
              </span>
              <span className="text-[11px] font-black text-indigo-700 tabular-nums">
                سهم درآمد:{' '}
                {toPersianDigits(
                  financeSummary.totalRevenue > 0
                    ? Math.round((financeSummary.projectsRevenue / financeSummary.totalRevenue) * 100)
                    : 0
                )}
                ٪
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-slate-100 tabular-nums">
              <div>
                <span className="text-[10px] text-slate-400 block">قراردادها</span>
                <span className="text-xs font-black text-slate-900">
                  {formatPrice(financeSummary.projectsRevenue)}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[10px] text-rose-500 block">هزینه‌ها</span>
                <span className="text-xs font-black text-rose-600">
                  {formatPrice(financeSummary.projectsExpenses)}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[10px] text-emerald-600 block">سود خالص</span>
                <span className="text-xs font-black text-emerald-700">
                  {formatPrice(financeSummary.projectsNetProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Products Side */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Package size={14} className="text-emerald-600" />
                محصولات تولیدی ({toPersianDigits(financeSummary.productsSalesCount)} فروش)
              </span>
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 tabular-nums">
                <ShieldCheck size={12} /> {toPersianDigits(financeSummary.activeProductSupports)} پشتیبانی فعال
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-indigo-100/80 tabular-nums">
              <div>
                <span className="text-[10px] text-slate-400 block">درآمد فروش</span>
                <span className="text-xs font-black text-indigo-700">
                  {formatPrice(financeSummary.productsRevenue)}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[10px] text-rose-500 block">هزینه تولید</span>
                <span className="text-xs font-black text-rose-600">
                  {formatPrice(financeSummary.productsCosts)}
                </span>
              </div>
              <div className="border-r border-slate-100">
                <span className="text-[10px] text-emerald-600 block">سود خالص</span>
                <span
                  className={`text-xs font-black ${
                    financeSummary.productsNetProfit >= 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {formatPrice(financeSummary.productsNetProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BI Charts Row 1: Monthly Cashflow Trend + Category Revenue Share */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Monthly Cashflow & Profitability ComposedChart */}
        <div className="xl:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                روند جریان نقدینگی، هزینه‌ها و سود ماهانه
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مقایسه دریافتی نقدی و هزینه‌های ثبت‌شده به تفکیک ماه‌های سال شمسی (به تومان)
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setChartRange('6m')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  chartRange === '6m'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ۶ ماه اخیر
              </button>
              <button
                type="button"
                onClick={() => setChartRange('12m')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  chartRange === '12m'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                کل سال
              </button>
            </div>
          </div>

          <div className="h-[290px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyCashflowData} margin={{ top: 10, right: 12, left: 4, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatMillionAxis}
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div
                        dir="rtl"
                        className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 font-['Vazirmatn']"
                      >
                        <div className="font-black text-slate-200 border-b border-slate-700 pb-1">
                          ماه {label}
                        </div>
                        {payload.map((entry: any) => (
                          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-bold tabular-nums">
                              {formatPrice(Number(entry.value) || 0)} تومان
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="income"
                  name="دریافتی نقدی"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  barSize={22}
                />
                <Bar
                  dataKey="expense"
                  name="هزینه‌ها"
                  fill="#f43f5e"
                  radius={[8, 8, 0, 0]}
                  barSize={22}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="تراز خالص ماه"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> دریافتی نقدی
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> کل هزینه‌ها
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> تراز خالص
              </span>
            </div>
            <span className="text-slate-400 font-medium">
              بروزرسانی لحظه‌ای از تراکنش‌های مالی
            </span>
          </div>
        </div>

        {/* Revenue by Project Category Donut */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <PieChartIcon size={18} className="text-indigo-600" />
              سهم درآمد بر اساس دسته‌بندی
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              توزیع ارزش قراردادها در حوزه‌های کاری مختلف
            </p>
          </div>

          <div className="h-[200px] w-full my-2 relative" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryRevenueData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {categoryRevenueData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    const pct =
                      financeSummary.totalRevenue > 0
                        ? Math.round((item.value / financeSummary.totalRevenue) * 100)
                        : 0;
                    return (
                      <div
                        dir="rtl"
                        className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-lg text-xs font-['Vazirmatn']"
                      >
                        <div className="font-bold">{item.name}</div>
                        <div className="text-emerald-300 font-bold mt-0.5 tabular-nums">
                          {formatPrice(item.value)} تومان ({toPersianDigits(pct)}٪)
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400">تعداد دسته‌ها</span>
              <span className="text-lg font-black text-slate-800 tabular-nums">
                {toPersianDigits(categoryRevenueData.length)}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 max-h-[135px] overflow-y-auto">
            {categoryRevenueData.map((cat, idx) => {
              const pct =
                financeSummary.totalRevenue > 0
                  ? Math.round((cat.value / financeSummary.totalRevenue) * 100)
                  : 0;
              return (
                <div key={cat.name} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
                    />
                    <span className="font-bold text-slate-700 truncate">{cat.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({toPersianDigits(cat.count)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className="text-[11px] font-bold text-slate-800">
                      {formatPrice(cat.value)}
                    </span>
                    <span className="text-[10px] font-black text-indigo-600 w-8 text-left">
                      {toPersianDigits(pct)}٪
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BI Charts Row 2: Project Financial Comparison + Expense Structure & Status Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Project Financial Comparison BarChart */}
        <div className="xl:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                مقایسه مالی پروژه‌ها (قرارداد، دریافتی و سود خالص)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تحلیل عملکرد مالی {toPersianDigits(projectComparisonData.length)} پروژه اخیر
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              همه پروژه‌ها <ArrowLeft size={14} />
            </button>
          </div>

          <div className="h-[280px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectComparisonData} margin={{ top: 10, right: 10, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Vazirmatn' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatMillionAxis}
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload;
                    return (
                      <div
                        dir="rtl"
                        className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 font-['Vazirmatn']"
                      >
                        <div className="font-black text-slate-100 border-b border-slate-700 pb-1">
                          {row.fullTitle}
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-indigo-300">مبلغ قرارداد:</span>
                          <span className="font-bold tabular-nums">{formatPrice(row.قرارداد)} تومان</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-emerald-300">دریافتی نقدی:</span>
                          <span className="font-bold tabular-nums">{formatPrice(row.دریافتی)} تومان</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-rose-300">کل هزینه‌ها:</span>
                          <span className="font-bold tabular-nums">{formatPrice(row.هزینه)} تومان</span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-slate-700">
                          <span className="text-amber-300 font-bold">سود خالص قرارداد:</span>
                          <span className="font-black tabular-nums">{formatPrice(row.سود)} تومان</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="قرارداد" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="دریافتی" fill="#10b981" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="سود" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> مبلغ قرارداد
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> دریافتی نقدی
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> سود خالص قرارداد
            </span>
          </div>
        </div>

        {/* Right Column: Expense Structure + Project Status Distribution */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* Expense Breakdown Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">ترکیب ساختار هزینه‌ها</h3>
                <p className="text-[11px] text-slate-500">
                  مجموع هزینه‌ها:{' '}
                  <span className="font-black text-rose-600 tabular-nums">
                    {formatPrice(financeSummary.totalExpenses)} تومان
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('finance')}
                className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                جزئیات
              </button>
            </div>

            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-5 h-[120px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={52}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {expenseBreakdownData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="col-span-7 space-y-2">
                {[
                  { label: 'تولید محصولات', value: financeSummary.productsCosts, color: 'bg-indigo-500' },
                  { label: 'پورسانت معرفی', value: financeSummary.totalCommissions, color: 'bg-purple-500' },
                  { label: 'سرور و زیرساخت', value: financeSummary.totalInfra, color: 'bg-cyan-500' },
                  { label: 'سایر هزینه‌ها', value: financeSummary.totalOtherExpenses, color: 'bg-amber-500' }
                ].map((row) => {
                  const pct =
                    financeSummary.totalExpenses > 0
                      ? Math.round((row.value / financeSummary.totalExpenses) * 100)
                      : 0;
                  return (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${row.color}`} />
                          {row.label}
                        </span>
                        <span className="font-black text-slate-800 tabular-nums">
                          {formatPrice(row.value)}{' '}
                          <span className="text-[10px] text-slate-400">({toPersianDigits(pct)}٪)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Project Status Pipeline Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex-1">
            <h3 className="text-sm font-black text-slate-900 mb-3">پایش وضعیت پروژه‌ها و میانگین پیشرفت</h3>
            <div className="space-y-2.5">
              {statusDistribution
                .filter((item) => item.count > 0)
                .map(({ status, count, avgProgress }) => {
                  const tone = STATUS_COLOR_STYLES[status.color] || STATUS_COLOR_STYLES.slate;
                  return (
                    <div key={status.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                          <span className="font-bold text-slate-700">{status.label}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold tabular-nums">
                            {toPersianDigits(count)} پروژه
                          </span>
                        </div>
                        <span className="font-bold text-slate-600 tabular-nums">
                          پیشرفت {toPersianDigits(avgProgress)}٪
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tone.dot}`}
                          style={{ width: `${Math.max(avgProgress, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Lower Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 7 cols: Pending Project Balances + Top Clients */}
        <div className="xl:col-span-7 space-y-5">
          {/* Pending Balances */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">پروژه‌های دارای مانده حساب</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">پیگیری سریع وصول اقساط باقیمانده قراردادها</p>
              </div>
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl tabular-nums">
                {toPersianDigits(pendingProjects.length)} پروژه
              </span>
            </div>

            {pendingProjects.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50/60 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-bold">
                تمامی پروژه‌ها به صورت کامل تسویه شده‌اند.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingProjects.slice(0, 4).map(({ project, stats }) => (
                  <div
                    key={project.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-200 bg-slate-50/40 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => openProject(project.id)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate hover:text-indigo-700">
                          {project.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 tabular-nums">
                          ({toPersianDigits(stats.paidPercentage)}٪ وصول)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{project.clientName}</p>
                      <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${stats.paidPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-400 block">مانده طلب</span>
                        <span className="text-xs font-black text-rose-600 tabular-nums">
                          {formatPrice(stats.remainingBalance)} تومان
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openQuickPayment(project.id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        ثبت واریز
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Clients */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                کارفرمایان کلیدی (بر اساس حجم پرداختی)
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('clients')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                همه مشتریان <ArrowLeft size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topClients.slice(0, 4).map((item, idx) => (
                <button
                  key={item.client.id}
                  type="button"
                  onClick={() => openClient(item.client.id)}
                  className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 bg-slate-50/40 hover:bg-white transition-all flex items-center gap-3 text-right cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      AVATAR_TONES[idx % AVATAR_TONES.length]
                    }`}
                  >
                    {getMonogram(item.client.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 truncate">{item.client.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{item.client.company}</div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold">
                      <span className="text-emerald-700 tabular-nums">
                        دریافتی: {formatPrice(item.totalSpent)}
                      </span>
                      <span className="text-slate-400 tabular-nums">
                        {toPersianDigits(item.projectCount)} پروژه
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Tasks + Infrastructure Renewals */}
        <div className="xl:col-span-5 space-y-5">
          {/* Active Tasks */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-indigo-600" />
                وظایف و پیگیری‌های جاری
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                تابلو کانبان
              </button>
            </div>

            {activeTasks.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                همه وظایف انجام شده‌اند.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/40 flex items-start gap-3 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        task.status === 'doing'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                          : 'bg-white border-slate-300 text-transparent hover:border-indigo-500'
                      }`}
                      title="تغییر وضعیت انجام"
                    >
                      <Check size={12} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 leading-snug">{task.title}</p>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-500 truncate">
                          {task.projectName || 'وظیفه عمومی'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 shrink-0 tabular-nums">
                          <Clock size={10} />
                          {toPersianDigits(task.dueDate || task.deadline || '—')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure Summary */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <ServerIcon size={18} className="text-cyan-600" />
                وضعیت زیرساخت و تمدیدها
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('infrastructure')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                مدیریت کامل
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <ServerIcon size={13} className="text-indigo-600" /> سرورهای فعال
                </div>
                <div className="text-lg font-black text-slate-900 mt-1 tabular-nums">
                  {toPersianDigits(servers.length)} <span className="text-[10px] font-bold text-slate-400">دستگاه</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <Globe size={13} className="text-cyan-600" /> دامنه‌های ثبت‌شده
                </div>
                <div className="text-lg font-black text-slate-900 mt-1 tabular-nums">
                  {toPersianDigits(domains.length)} <span className="text-[10px] font-bold text-slate-400">دامنه</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {servers.slice(0, 2).map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{srv.name}</div>
                    <div className="text-[10px] text-slate-500">{srv.provider}</div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg shrink-0 tabular-nums">
                    تمدید: {toPersianDigits(srv.expiration || '—')}
                  </span>
                </div>
              ))}
              {domains.slice(0, 2).map((dom) => (
                <div
                  key={dom.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate" dir="ltr">
                      {dom.url}
                    </div>
                    <div className="text-[10px] text-slate-500">{dom.registrar}</div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg shrink-0 tabular-nums">
                    انقضا: {toPersianDigits(dom.expiration || '—')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Receivables Breakdown Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div>
                <h3 className="text-base font-black text-slate-900">فهرست مطالبات و مانده قراردادها</h3>
                <p className="text-xs text-rose-700 font-bold mt-0.5 tabular-nums">
                  مجموع طلب قابل وصول: {formatPrice(financeSummary.pendingReceivables)} تومان
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDebtModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {pendingProjects.length === 0 && pendingProductSales.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-emerald-700">
                  تمامی قراردادها و فروش‌های محصولات تسویه کامل شده‌اند.
                </div>
              ) : (
                <>
                  {pendingProjects.map(({ project, stats }) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDebtModal(false);
                            openProject(project.id);
                          }}
                          className="text-sm font-black text-slate-900 hover:text-indigo-700 text-right cursor-pointer"
                        >
                          {project.title}
                        </button>
                        <p className="text-xs text-slate-500 mt-0.5">{project.clientName}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] tabular-nums">
                          <span className="text-slate-600">
                            قرارداد: <strong>{formatPrice(stats.contractValue)}</strong>
                          </span>
                          <span className="text-emerald-700">
                            دریافتی: <strong>{formatPrice(stats.totalPaid)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-rose-500 block">مانده طلب</span>
                          <span className="text-sm font-black text-rose-700 tabular-nums">
                            {formatPrice(stats.remainingBalance)} تومان
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDebtModal(false);
                            openQuickPayment(project.id);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          ثبت واریز
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingProductSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black">
                            فروش محصول
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDebtModal(false);
                              openProduct(sale.productId);
                            }}
                            className="text-sm font-black text-slate-900 hover:text-indigo-700 text-right cursor-pointer"
                          >
                            {sale.productName || 'محصول'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {sale.buyerName} {sale.buyerCompany ? `(${sale.buyerCompany})` : ''}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-rose-500 block">مانده فروش</span>
                          <span className="text-sm font-black text-rose-700 tabular-nums">
                            {formatPrice(sale.remainingAmount)} تومان
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDebtModal(false);
                            openProduct(sale.productId);
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          مشاهده و تسویه
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Project Modal */}
      <ProjectFormModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
      />

      {/* Quick Payment Modal */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        lockedProjectId={paymentModalProjectId}
      />

      {/* Quick Product Sale Modal */}
      <ProductSaleModal
        isOpen={isProductSaleOpen}
        onClose={() => setIsProductSaleOpen(false)}
      />
    </div>
  );
};

export default BIReport;
