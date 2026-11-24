import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Wallet,
  Plus,
  ShoppingBag,
  BarChart3,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Check,
  Clock,
  Package,
  ShieldCheck,
  ShieldAlert,
  Server as ServerIcon,
  Globe,
  Users,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  formatPrice,
  toPersianDigits,
  STATUS_COLOR_STYLES,
  getTodayPersianDate,
  getProductSupportStatus
} from '../constants';
import ProjectFormModal from './ProjectFormModal';
import PaymentFormModal from './PaymentFormModal';
import ProductSaleModal from './ProductSaleModal';

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

const Dashboard: React.FC = () => {
  const {
    currentUser,
    clients,
    projects,
    payments,
    products,
    productSales,
    servers,
    domains,
    tasks,
    projectStatuses,
    financeSummary,
    getProjectStats,
    getProductStats,
    toggleTaskStatus,
    setActiveTab,
    setSelectedProjectIdForView,
    setSelectedClientIdForView,
    setSelectedProductIdForView
  } = useData();

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isProductSaleOpen, setIsProductSaleOpen] = useState(false);
  const [paymentModalProjectId, setPaymentModalProjectId] = useState<string | undefined>(undefined);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const collectionRate =
    financeSummary.totalRevenue > 0
      ? Math.min(100, Math.round((financeSummary.totalPaid / financeSummary.totalRevenue) * 100))
      : 0;

  const profitMargin =
    financeSummary.totalRevenue > 0
      ? Math.round((financeSummary.netProfit / financeSummary.totalRevenue) * 100)
      : 0;

  const projectsWithStats = useMemo(
    () => projects.map((p) => ({ project: p, stats: getProjectStats(p.id) })),
    [projects, payments]
  );

  const activeProjects = useMemo(
    () =>
      projectsWithStats
        .filter(({ project }) => project.status !== 'تحویل شده' && project.status !== 'متوقف شده')
        .slice(0, 5),
    [projectsWithStats]
  );

  const displayProjects = activeProjects.length > 0 ? activeProjects : projectsWithStats.slice(0, 5);

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

  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'done').slice(0, 5), [tasks]);

  const expiringSupports = useMemo(
    () =>
      productSales
        .filter((s) => {
          if (s.saleType === 'تمدید پشتیبانی' || s.saleType === 'ارتقای نسخه') return false;
          const st = getProductSupportStatus(s.hasSupport, s.supportEndDate);
          return st === 'expiring' || st === 'expired';
        })
        .slice(0, 3),
    [productSales]
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

  const getStatusMeta = (statusId: string) => {
    const found = projectStatuses.find((s) => s.id === statusId || s.label === statusId);
    return {
      label: found?.label || statusId,
      tone: STATUS_COLOR_STYLES[found?.color || 'slate'] || STATUS_COLOR_STYLES.slate
    };
  };

  return (
    <div className="space-y-6 pb-8 font-['Vazirmatn']">
      {/* Top Executive Operational Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 block mb-1">
            خوش آمدید، {currentUser?.fullName || 'مدیر سیستم'} · {toPersianDigits(getTodayPersianDate())}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">داشبورد مدیریت روزانه</h2>
          <p className="text-xs text-slate-500 mt-1">
            مرور سریع وضعیت درآمدها، پروژه‌های جاری، مطالبات، وظایف و محصولات تولیدی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openQuickPayment(undefined)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Wallet size={14} /> ثبت دریافتی
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
          <button
            type="button"
            onClick={() => setActiveTab('bi-report')}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <BarChart3 size={14} /> گزارش تحلیلی BI
          </button>
        </div>
      </div>

      {/* Primary 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Combined Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-500">کل درآمد (پروژه + محصول)</p>
              <p className="text-xl font-black text-slate-900 mt-2 tabular-nums">
                {formatPrice(financeSummary.totalRevenue)}
                <span className="text-[11px] font-bold text-slate-400 mr-1">تومان</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Briefcase size={19} />
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
              <CreditCard size={19} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium tabular-nums">
              {toPersianDigits(payments.filter((p) => p.status === 'completed').length + productSales.length)} تراکنش ورودی
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              تراز مالی <ArrowLeft size={12} />
            </button>
          </div>
        </div>

        {/* KPI 3: Net Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-500">سود خالص کل</p>
              <p className="text-xl font-black text-slate-900 mt-2 tabular-nums">
                {formatPrice(financeSummary.netProfit)}
                <span className="text-[11px] font-bold text-slate-400 mr-1">تومان</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <TrendingUp size={19} />
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

        {/* KPI 4: Pending Receivables */}
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
              <AlertCircle size={19} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] w-full">
            <span className="text-slate-600 font-medium tabular-nums">
              {toPersianDigits(pendingProjects.length)} پروژه · {toPersianDigits(pendingProductSales.length)} فروش محصول
            </span>
            <span className="text-rose-600 font-bold flex items-center gap-0.5">
              پیگیری <ArrowUpRight size={13} />
            </span>
          </div>
        </button>
      </div>

      {/* Compact Quick-Access Business Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className="bg-white hover:border-indigo-300 p-4 rounded-2xl border border-slate-200/80 transition-all text-right flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">پروژه‌ها و قراردادها</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block tabular-nums">
              {toPersianDigits(projects.length)} پروژه
            </span>
            <span className="text-[10px] font-bold text-indigo-600 tabular-nums">
              {toPersianDigits(activeProjects.length)} در جریان
            </span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Briefcase size={17} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className="bg-white hover:border-emerald-300 p-4 rounded-2xl border border-slate-200/80 transition-all text-right flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">محصولات تولیدی</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block tabular-nums">
              {toPersianDigits(products.length)} محصول
            </span>
            <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
              {toPersianDigits(financeSummary.productsSalesCount)} فروش ·{' '}
              {toPersianDigits(financeSummary.activeProductSupports)} پشتیبانی
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Package size={17} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className="bg-white hover:border-amber-300 p-4 rounded-2xl border border-slate-200/80 transition-all text-right flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">مشتریان و کارفرمایان</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block tabular-nums">
              {toPersianDigits(clients.length)} مشتری
            </span>
            <span className="text-[10px] font-bold text-amber-700">مشاهده پرونده‌ها</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Users size={17} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('infrastructure')}
          className="bg-white hover:border-cyan-300 p-4 rounded-2xl border border-slate-200/80 transition-all text-right flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">زیرساخت فعال</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block tabular-nums">
              {toPersianDigits(servers.length)} سرور · {toPersianDigits(domains.length)} دامنه
            </span>
            <span className="text-[10px] font-bold text-cyan-700">کنترل تمدیدها</span>
          </div>
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl shrink-0">
            <ServerIcon size={17} />
          </div>
        </button>
      </div>

      {/* Operational Main 2-Column Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Right Column (7 cols): Active Projects + Pending Receivables */}
        <div className="xl:col-span-7 space-y-5">
          {/* Active Projects Snapshot */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <Briefcase size={17} className="text-indigo-600" />
                  پروژه‌های جاری و وضعیت پیشرفت
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  دسترسی سریع به پروژه‌های فعال، موعد تحویل و میزان پیشرفت
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                همه پروژه‌ها <ArrowLeft size={13} />
              </button>
            </div>

            {displayProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                پروژه‌ای ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {displayProjects.map(({ project, stats }) => {
                  const stMeta = getStatusMeta(project.status);
                  return (
                    <div
                      key={project.id}
                      onClick={() => openProject(project.id)}
                      className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 bg-slate-50/40 hover:bg-white transition-all cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                              {project.title}
                            </h4>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${stMeta.tone.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${stMeta.tone.dot}`} />
                              {stMeta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {project.clientName} · تحویل: {toPersianDigits(project.deadline || '—')}
                          </p>
                        </div>

                        <div className="text-left shrink-0 tabular-nums">
                          <div className="text-xs font-black text-slate-800">
                            {formatPrice(stats.contractValue)} تومان
                          </div>
                          {stats.remainingBalance > 0 ? (
                            <div className="text-[10px] font-bold text-rose-600">
                              مانده: {formatPrice(stats.remainingBalance)}
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-emerald-600">تسویه کامل</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${Math.max(4, project.progress || 0)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-slate-600 tabular-nums shrink-0">
                          {toPersianDigits(project.progress || 0)}٪
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Receivables Action List */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <Wallet size={17} className="text-emerald-600" />
                  مطالبات و پیگیری وصولی‌ها
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  پروژه‌ها و فروش‌های محصولاتی که هنوز تسویه کامل نشده‌اند
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDebtModal(true)}
                className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-xl tabular-nums cursor-pointer"
              >
                {toPersianDigits(pendingProjects.length + pendingProductSales.length)} مورد
              </button>
            </div>

            {pendingProjects.length === 0 && pendingProductSales.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50/60 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-bold">
                تمامی قراردادها و فروش‌ها به صورت کامل تسویه شده‌اند.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingProjects.slice(0, 3).map(({ project, stats }) => (
                  <div
                    key={project.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-200 bg-slate-50/40 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div onClick={() => openProject(project.id)} className="min-w-0 flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate hover:text-indigo-700">
                          {project.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 tabular-nums">
                          ({toPersianDigits(stats.paidPercentage)}٪ وصول)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{project.clientName}</p>
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

                {pendingProductSales.slice(0, 2).map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3.5 rounded-2xl border border-indigo-200/80 bg-indigo-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div onClick={() => openProduct(sale.productId)} className="min-w-0 flex-1 cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-black">
                          محصول
                        </span>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {sale.productName || 'محصول'}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {sale.buyerName} {sale.buyerCompany ? `(${sale.buyerCompany})` : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-400 block">مانده فروش</span>
                        <span className="text-xs font-black text-rose-600 tabular-nums">
                          {formatPrice(sale.remainingAmount)} تومان
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProduct(sale.productId)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        تسویه
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Left Column (5 cols): Tasks + Products Snapshot + Infrastructure & Recent Clients */}
        <div className="xl:col-span-5 space-y-5">
          {/* Active Tasks */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={17} className="text-indigo-600" />
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

          {/* Products & Support Quick Status */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Package size={17} className="text-emerald-600" />
                وضعیت محصولات و پشتیبانی‌ها
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                همه محصولات
              </button>
            </div>

            <div className="space-y-2">
              {products.slice(0, 3).map((prod) => {
                const st = getProductStats(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => openProduct(prod.id)}
                    className="p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-200/70 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{prod.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                        {toPersianDigits(st.salesCount)} فروش · {toPersianDigits(st.activeSupportCount)} پشتیبانی فعال
                      </div>
                    </div>
                    <div className="text-left shrink-0 tabular-nums">
                      <div
                        className={`text-xs font-black ${
                          st.isProfitable ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {formatPrice(st.netProfit)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {st.isProfitable ? 'سود خالص' : 'تراز تولید'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {expiringSupports.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-black text-amber-700 flex items-center gap-1">
                  <ShieldAlert size={13} /> پشتیبانی‌های نیازمند تمدید
                </span>
                {expiringSupports.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openProduct(s.productId)}
                    className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-amber-50/70 border border-amber-200/70 rounded-xl cursor-pointer"
                  >
                    <span className="font-bold text-slate-800 truncate">
                      {s.buyerName} — {s.productName}
                    </span>
                    <span className="text-amber-800 font-black shrink-0 tabular-nums">
                      {toPersianDigits(s.supportEndDate || '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure & Latest Clients */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Globe size={16} className="text-cyan-600" />
                تمدیدهای زیرساخت و مشتریان اخیر
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('infrastructure')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                زیرساخت
              </button>
            </div>

            <div className="space-y-2">
              {servers.slice(0, 1).map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
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
              {domains.slice(0, 1).map((dom) => (
                <div
                  key={dom.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
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

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-slate-500">جدیدترین کارفرمایان</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('clients')}
                  className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  همه مشتریان
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clients.slice(0, 2).map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openClient(c.id)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/70 flex items-center gap-2.5 text-right transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                        AVATAR_TONES[idx % AVATAR_TONES.length]
                      }`}
                    >
                      {getMonogram(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{c.company}</div>
                    </div>
                  </button>
                ))}
              </div>
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
                <h3 className="text-base font-black text-slate-900">فهرست مطالبات و مانده حساب‌ها</h3>
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

      {/* Quick Modals */}
      <ProjectFormModal isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} />
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        lockedProjectId={paymentModalProjectId}
      />
      <ProductSaleModal isOpen={isProductSaleOpen} onClose={() => setIsProductSaleOpen(false)} />
    </div>
  );
};

export default Dashboard;
