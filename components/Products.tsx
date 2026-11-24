import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Receipt,
  Calculator,
  ExternalLink,
  SlidersHorizontal,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Layers,
  Wallet,
  Sparkles,
  ArrowUpCircle,
  History,
  Briefcase,
  FileText,
  X
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { Product, ProductCostItem, ProductSale, ProductSalesModel, ProductStatus } from '../types';
import {
  formatPrice,
  toPersianDigits,
  formatCardNumber,
  getTodayPersianDate,
  getProductSupportStatus,
  diffPersianDatesInDays,
  getNormalizedSaleEvents
} from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';
import OptionManagerModal from './OptionManagerModal';
import ConfirmModal from './ConfirmModal';
import ProductFormModal from './ProductFormModal';
import ProductSaleModal from './ProductSaleModal';
import ProductSaleLedgerModal from './ProductSaleLedgerModal';
import InvoicePreviewModal from './InvoicePreviewModal';

const SALES_MODEL_LABELS: Record<ProductSalesModel, string> = {
  'one-time': 'فروش یک‌باره',
  subscription: 'اشتراکی',
  hybrid: 'یک‌باره + اشتراکی'
};

const PRODUCT_STATUS_STYLES: Record<ProductStatus, { badge: string; dot: string }> = {
  'در حال تولید': { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'آماده فروش': { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  پرفروش: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'متوقف شده': { badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
};

const SUPPORT_POLICY_LABELS = {
  free: 'پشتیبانی رایگان در دوره اولیه',
  paid: 'پشتیبانی با تعرفه مجزا',
  none: 'بدون پشتیبانی'
};

const COST_TYPE_OPTIONS: Array<{ value: ProductCostItem['costType']; label: string }> = [
  { value: 'توسعه اولیه', label: 'توسعه اولیه و کدنویسی' },
  { value: 'نگهداری و زیرساخت', label: 'نگهداری، سرور و زیرساخت' },
  { value: 'بازاریابی و فروش', label: 'بازاریابی، تبلیغات و فروش' },
  { value: 'سایر', label: 'سایر هزینه‌ها' }
];

const PAYMENT_METHODS: Array<{ value: ProductSale['method']; label: string }> = [
  { value: 'شبا / پایا', label: 'حواله پایا / ساتنا (شبا)' },
  { value: 'کارت به کارت', label: 'کارت به کارت' },
  { value: 'درگاه آنلاین', label: 'درگاه پرداخت آنلاین' },
  { value: 'چک', label: 'چک صیادی' },
  { value: 'نقد', label: 'وجه نقد' }
];

const Products: React.FC = () => {
  const {
    products,
    productDomains,
    expenseCategories,
    productCostTypes,
    bankAccounts,
    financeSummary,
    selectedProductIdForView,
    setSelectedProductIdForView,
    setSelectedProjectIdForView,
    setSelectedClientIdForView,
    setActiveTab,
    navResetCount,
    getProductStats,
    updateProduct,
    deleteProduct,
    addProductCost,
    updateProductCost,
    deleteProductCost,
    deleteProductSale,
    renewProductSupport,
    upgradeProductSaleTier,
    addProductDomain,
    updateProductDomain,
    deleteProductDomain,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    addProductCostType,
    updateProductCostType,
    deleteProductCostType,
    buildInvoiceFromProductSale
  } = useData();

  // Catalog filters
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState<'all' | ProductSalesModel>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail view state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'sales' | 'costs' | 'support'>('overview');

  // Modals
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleLockedProductId, setSaleLockedProductId] = useState<string | undefined>(undefined);
  const [isDomainManagerOpen, setIsDomainManagerOpen] = useState(false);
  const [isExpenseCatManagerOpen, setIsExpenseCatManagerOpen] = useState(false);
  const [isCostTypeManagerOpen, setIsCostTypeManagerOpen] = useState(false);
  const [invoiceSaleIdForPreview, setInvoiceSaleIdForPreview] = useState<string | null>(null);

  // Cost Modal state
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<ProductCostItem | null>(null);
  const [costForm, setCostForm] = useState<{
    costType: ProductCostItem['costType'];
    categoryTitle: string;
    title: string;
    amount: string;
    date: string;
    paymentStatus: 'paid' | 'pending';
    notes: string;
  }>({
    costType: 'توسعه اولیه',
    categoryTitle: expenseCategories[0] || '',
    title: '',
    amount: '',
    date: getTodayPersianDate(),
    paymentStatus: 'paid',
    notes: ''
  });

  // Payment Manager & History Ledger Modal state
  const [ledgerModalState, setLedgerModalState] = useState<{
    isOpen: boolean;
    saleId: string | null;
    initialTab: 'history' | 'payment';
  }>({
    isOpen: false,
    saleId: null,
    initialTab: 'history'
  });

  // Support renewal modal state
  const [renewingSale, setRenewingSale] = useState<ProductSale | null>(null);
  const [renewMonths, setRenewMonths] = useState('12');
  const [renewFee, setRenewFee] = useState('');
  const [renewPaid, setRenewPaid] = useState('0');
  const [renewMethod, setRenewMethod] = useState<ProductSale['method']>('شبا / پایا');
  const [renewBankId, setRenewBankId] = useState('');
  const [renewTracking, setRenewTracking] = useState('');
  const [renewDate, setRenewDate] = useState(getTodayPersianDate());
  const [renewNotes, setRenewNotes] = useState('');

  // Tier upgrade modal state
  const [upgradingSale, setUpgradingSale] = useState<ProductSale | null>(null);
  const [upgradeTierId, setUpgradeTierId] = useState('');
  const [upgradeFee, setUpgradeFee] = useState('');
  const [upgradePaid, setUpgradePaid] = useState('0');
  const [upgradeMethod, setUpgradeMethod] = useState<ProductSale['method']>('شبا / پایا');
  const [upgradeBankId, setUpgradeBankId] = useState('');
  const [upgradeTracking, setUpgradeTracking] = useState('');
  const [upgradeDate, setUpgradeDate] = useState(getTodayPersianDate());
  const [upgradeNotes, setUpgradeNotes] = useState('');

  // Live Sales, Break-Even & Profitability Simulator state (Tab 1)
  const [simTargetSales, setSimTargetSales] = useState<string>('10');
  const [simTargetRoi, setSimTargetRoi] = useState<number>(100);
  const [simVarCost, setSimVarCost] = useState<string>('0');
  const [simUnitPrice, setSimUnitPrice] = useState<string>('0');
  const [simSavedFlash, setSimSavedFlash] = useState(false);

  // Confirm delete modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Sync deep-link from other views
  useEffect(() => {
    if (selectedProductIdForView) {
      setSelectedProductId(selectedProductIdForView);
      setDetailTab('overview');
      setSelectedProductIdForView(null);
    }
  }, [selectedProductIdForView, setSelectedProductIdForView]);

  // Reset detail view back to catalog list whenever sidebar menu is clicked
  const lastNavResetRef = useRef(navResetCount);
  useEffect(() => {
    if (navResetCount !== lastNavResetRef.current) {
      lastNavResetRef.current = navResetCount;
      setSelectedProductId(null);
    }
  }, [navResetCount]);

  const activeProduct = useMemo(
    () => (selectedProductId ? products.find((p) => p.id === selectedProductId) || null : null),
    [selectedProductId, products]
  );

  // Sync simulator inputs whenever activeProduct OR its saved pricing/settings change
  useEffect(() => {
    if (!activeProduct) return;
    const stats = getProductStats(activeProduct.id);
    setSimTargetSales(String(activeProduct.targetSalesCount || 10));
    setSimTargetRoi(activeProduct.targetMarginPercent ?? 100);
    setSimVarCost(String(activeProduct.variableCostPerUnit || 0));
    setSimUnitPrice(String(stats.referenceUnitPrice || 0));
    setSimSavedFlash(false);
  }, [
    activeProduct?.id,
    activeProduct?.oneTimePrice,
    activeProduct?.annualPrice,
    activeProduct?.monthlyPrice,
    activeProduct?.salesModel,
    activeProduct?.tiers,
    activeProduct?.variableCostPerUnit,
    activeProduct?.targetSalesCount,
    activeProduct?.targetMarginPercent
  ]);

  // Filtered products (newest-first preserved from DataContext)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q));
      const matchDomain = domainFilter === 'all' || p.domain === domainFilter;
      const matchModel = modelFilter === 'all' || p.salesModel === modelFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchQuery && matchDomain && matchModel && matchStatus;
    });
  }, [products, searchQuery, domainFilter, modelFilter, statusFilter]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const openEditProductModal = (prod: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct(prod);
    setIsProductFormOpen(true);
  };

  const openDeleteProductConfirm = (prod: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: 'حذف محصول تولیدی',
      message: `آیا از حذف محصول «${prod.name}» و تمامی هزینه‌ها و سوابق فروش مرتبط با آن مطمئن هستید؟`,
      onConfirm: () => {
        deleteProduct(prod.id);
        if (selectedProductId === prod.id) {
          setSelectedProductId(null);
        }
      }
    });
  };

  const openNewSaleModal = (prodId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSaleLockedProductId(prodId);
    setIsSaleModalOpen(true);
  };

  const openCostModal = (cost?: ProductCostItem) => {
    if (cost) {
      setEditingCost(cost);
      setCostForm({
        costType: cost.costType,
        categoryTitle: cost.categoryTitle || expenseCategories[0] || '',
        title: cost.title,
        amount: String(cost.amount),
        date: cost.date,
        paymentStatus: cost.paymentStatus,
        notes: cost.notes || ''
      });
    } else {
      setEditingCost(null);
      setCostForm({
        costType: 'توسعه اولیه',
        categoryTitle: expenseCategories[0] || '',
        title: '',
        amount: '',
        date: getTodayPersianDate(),
        paymentStatus: 'paid',
        notes: ''
      });
    }
    setIsCostModalOpen(true);
  };

  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !costForm.title.trim()) return;
    const numAmount = Number(costForm.amount) || 0;
    if (numAmount <= 0) return;

    if (editingCost) {
      updateProductCost(editingCost.id, {
        costType: costForm.costType,
        categoryTitle: costForm.categoryTitle || undefined,
        title: costForm.title.trim(),
        amount: numAmount,
        date: costForm.date,
        paymentStatus: costForm.paymentStatus,
        notes: costForm.notes.trim() || undefined
      });
    } else {
      addProductCost({
        productId: activeProduct.id,
        productName: activeProduct.name,
        costType: costForm.costType,
        categoryTitle: costForm.categoryTitle || undefined,
        title: costForm.title.trim(),
        amount: numAmount,
        date: costForm.date,
        paymentStatus: costForm.paymentStatus,
        notes: costForm.notes.trim() || undefined
      });
    }
    setIsCostModalOpen(false);
  };

  const openSaleLedgerModal = (sale: ProductSale, initialTab: 'history' | 'payment') => {
    setLedgerModalState({
      isOpen: true,
      saleId: sale.id,
      initialTab
    });
  };

  const openRenewModal = (sale: ProductSale) => {
    const defaultBank = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    const matchedTier = activeProduct?.tiers?.find((t) => t.id === sale.tierId);
    const defaultFee =
      sale.supportRenewalPrice ?? matchedTier?.supportRenewalPrice ?? activeProduct?.supportRenewalPrice ?? 0;
    const defaultMonths =
      sale.supportMonths || matchedTier?.supportMonths || activeProduct?.defaultSupportMonths || 12;
    setRenewingSale(sale);
    setRenewMonths(String(defaultMonths));
    setRenewFee(defaultFee > 0 ? String(defaultFee) : '');
    setRenewPaid('0');
    setRenewMethod(sale.method || 'شبا / پایا');
    setRenewBankId(sale.bankAccountId || defaultBank?.id || '');
    setRenewTracking('');
    setRenewDate(getTodayPersianDate());
    setRenewNotes('');
  };

  const handleConfirmRenew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingSale) return;
    const months = Math.max(1, Number(renewMonths) || 12);
    const fee = Math.max(0, Number(renewFee) || 0);
    const paid = Math.min(fee, Math.max(0, Number(renewPaid) || 0));
    renewProductSupport(
      renewingSale.id,
      months,
      fee,
      renewMethod,
      renewBankId,
      renewTracking.trim() || undefined,
      renewDate,
      paid,
      renewNotes.trim() || undefined
    );
    setRenewingSale(null);
  };

  const openUpgradeModal = (sale: ProductSale) => {
    if (!activeProduct?.tiers || activeProduct.tiers.length < 2) return;
    const currentTier = activeProduct.tiers.find((t) => t.id === sale.tierId);
    const currentPrice = currentTier?.price ?? sale.unitPrice ?? 0;
    const otherTiers = activeProduct.tiers.filter((t) => t.id !== sale.tierId);
    const higherTiers = otherTiers
      .filter((t) => t.price > currentPrice)
      .sort((a, b) => a.price - b.price);
    const suggestedNext = higherTiers[0] || otherTiers[0];
    if (!suggestedNext) return;

    const diff = Math.max(0, (suggestedNext.price - currentPrice) * (sale.quantity || 1));
    const defaultBank = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];

    setUpgradingSale(sale);
    setUpgradeTierId(suggestedNext.id);
    setUpgradeFee(String(diff));
    setUpgradePaid('0');
    setUpgradeMethod(sale.method || 'شبا / پایا');
    setUpgradeBankId(sale.bankAccountId || defaultBank?.id || '');
    setUpgradeTracking('');
    setUpgradeDate(getTodayPersianDate());
    setUpgradeNotes('');
  };

  const handleSelectUpgradeTier = (nextTierId: string) => {
    setUpgradeTierId(nextTierId);
    if (!upgradingSale || !activeProduct?.tiers) return;
    const currentTier = activeProduct.tiers.find((t) => t.id === upgradingSale.tierId);
    const nextTier = activeProduct.tiers.find((t) => t.id === nextTierId);
    if (!nextTier) return;
    const currentPrice = currentTier?.price ?? upgradingSale.unitPrice ?? 0;
    const diff = Math.max(0, (nextTier.price - currentPrice) * (upgradingSale.quantity || 1));
    setUpgradeFee(String(diff));
    setUpgradePaid('0');
  };

  const handleConfirmUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradingSale || !upgradeTierId) return;
    const fee = Math.max(0, Number(upgradeFee) || 0);
    const paid = Math.min(fee, Math.max(0, Number(upgradePaid) || 0));
    upgradeProductSaleTier(
      upgradingSale.id,
      upgradeTierId,
      fee,
      paid,
      upgradeMethod,
      upgradeBankId,
      upgradeTracking.trim() || undefined,
      upgradeDate,
      upgradeNotes.trim() || undefined
    );
    setUpgradingSale(null);
  };

  const bankOptions = bankAccounts.map((b) => ({
    value: b.id,
    label: `${b.bankName} — ${b.accountHolder}`,
    sublabel: b.cardNumber ? `کارت: ${formatCardNumber(b.cardNumber)}` : b.iban || b.type
  }));

  // ==========================================
  // PRODUCT DETAIL VIEW
  // ==========================================
  if (activeProduct) {
    const stats = getProductStats(activeProduct.id);
    const statusStyle = PRODUCT_STATUS_STYLES[activeProduct.status] || PRODUCT_STATUS_STYLES['آماده فروش'];

    // Live Simulator Calculations (Price-First Real-World Software Profitability Model)
    const simVarNum = Math.max(0, Number(simVarCost) || 0);
    const simPriceNum = Math.max(0, Number(simUnitPrice) || 0);
    const simTargetSalesNum = Math.max(1, Math.min(10000, Number(simTargetSales) || 10));
    const simSafeRoiPercent = Math.min(500, Math.max(10, simTargetRoi));

    // 1. Net contribution per sale & operating margin per sale
    const simUnitContribution = simPriceNum - simVarNum;
    const simPositiveContribution = Math.max(0, simUnitContribution);
    const simPerSaleMarginPercent =
      simPriceNum > 0 ? Math.round((simUnitContribution / simPriceNum) * 100) : 0;

    // 2. Break-Even units (recovering 100% of fixed production cost)
    const simBreakEvenUnits =
      stats.totalCost > 0 && simPositiveContribution > 0
        ? Math.ceil(stats.totalCost / simPositiveContribution)
        : 0;

    // 3. Target ROI on production investment (how many sales to earn X% net profit on total production cost)
    const simTargetRoiProfitAmount = Math.round(stats.totalCost * (simSafeRoiPercent / 100));
    const simUnitsForTargetRoi =
      stats.totalCost > 0 && simPositiveContribution > 0
        ? Math.ceil((stats.totalCost + simTargetRoiProfitAmount) / simPositiveContribution)
        : 0;

    // 4. Sales scenario forecast rows (Break-Even + 5, 10, 20 + user's chosen target)
    const scenarioCounts = Array.from(
      new Set(
        [
          simBreakEvenUnits > 0 ? simBreakEvenUnits : null,
          5,
          10,
          20,
          simTargetSalesNum
        ].filter((n): n is number => n !== null && n > 0)
      )
    ).sort((a, b) => a - b);

    const hasUnsavedSimChanges =
      simPriceNum !== (stats.referenceUnitPrice || 0) ||
      simVarNum !== (activeProduct.variableCostPerUnit || 0) ||
      simTargetSalesNum !== (activeProduct.targetSalesCount || 10) ||
      simSafeRoiPercent !== (activeProduct.targetMarginPercent ?? 100);

    // Support buyers list (primary licenses — exclude support renewals and tier upgrades so each buyer shows once)
    const supportBuyers = stats.sales.filter(
      (s) => s.saleType !== 'تمدید پشتیبانی' && s.saleType !== 'ارتقای نسخه'
    );

    const activeTiers = activeProduct.tiers && activeProduct.tiers.length > 0 ? activeProduct.tiers : [];
    const avgTierPrice =
      activeTiers.length > 0
        ? Math.round(activeTiers.reduce((sum, t) => sum + t.price, 0) / activeTiers.length)
        : 0;

    return (
      <div className="space-y-6 font-['Vazirmatn']">
        {/* Top Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedProductId(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowRight size={15} />
            بازگشت به لیست محصولات
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCostModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/60 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Receipt size={14} />
              ثبت هزینه تولید
            </button>
            <button
              type="button"
              onClick={(e) => openNewSaleModal(activeProduct.id, e)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag size={14} />
              ثبت فروش جدید
            </button>
          </div>
        </div>

        {/* Product Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{activeProduct.name}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusStyle.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {activeProduct.status}
                </span>
                {activeProduct.sourceProjectId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectIdForView(activeProduct.sourceProjectId!);
                      setActiveTab('projects');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-colors cursor-pointer"
                    title="مشاهده پروژه مبدا در بخش پروژه‌ها"
                  >
                    <Briefcase size={11} />
                    برگرفته از پروژه: {activeProduct.sourceProjectTitle || 'پروژه مبدا'}
                  </button>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-bold text-indigo-700">{activeProduct.domain}</span>
                <span className="text-slate-300">·</span>
                <span>{SALES_MODEL_LABELS[activeProduct.salesModel]}</span>
                {activeProduct.version && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span dir="ltr" className="font-semibold text-slate-600">
                      {activeProduct.version}
                    </span>
                  </>
                )}
                <span className="text-slate-300">·</span>
                <span>{SUPPORT_POLICY_LABELS[activeProduct.supportPolicy]}</span>
              </p>
            </div>

            {/* Compact corner Edit & Delete icons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => openEditProductModal(activeProduct, e)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                title="ویرایش محصول"
              >
                <Edit2 size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => openDeleteProductConfirm(activeProduct, e)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="حذف محصول"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Single-Row 4-Metric Financial Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 block">کل هزینه تولید و نگهداری</span>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-1 tabular-nums">
                {formatPrice(stats.totalCost)} <span className="text-[11px] font-bold text-slate-400">تومان</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">
                {toPersianDigits(stats.costs.length)} ردیف هزینه ثبت‌شده
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-700 block">مجموع درآمد فروش</span>
              <div className="text-base sm:text-lg font-black text-indigo-950 mt-1 tabular-nums">
                {formatPrice(stats.totalSalesValue)} <span className="text-[11px] font-bold text-indigo-400">تومان</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-0.5 block tabular-nums">
                دریافتی نقد: {formatPrice(stats.totalPaid)} تومان
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 block">تعداد فروش و پشتیبانی</span>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-1 tabular-nums">
                {toPersianDigits(stats.salesCount)} فروش{' '}
                <span className="text-xs font-bold text-slate-500">
                  ({toPersianDigits(stats.totalUnitsSold)} واحد)
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block tabular-nums">
                {toPersianDigits(stats.activeSupportCount)} پشتیبانی فعال
                {stats.expiringSupportCount > 0 && (
                  <span className="text-amber-600">
                    {' '}
                    • {toPersianDigits(stats.expiringSupportCount)} در آستانه انقضا
                  </span>
                )}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                stats.isProfitable
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <span
                className={`text-[11px] font-bold block ${
                  stats.isProfitable ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {stats.isProfitable ? 'سود خالص محصول (سودده)' : 'تراز فعلی (بازگشت سرمایه)'}
              </span>
              <div
                className={`text-base sm:text-lg font-black mt-1 tabular-nums ${
                  stats.isProfitable ? 'text-emerald-800' : 'text-amber-900'
                }`}
              >
                {formatPrice(stats.netProfit)}{' '}
                <span className="text-[11px] font-bold opacity-70">تومان</span>
              </div>
              <span
                className={`text-[10px] font-bold mt-0.5 block tabular-nums ${
                  stats.isProfitable ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {stats.isProfitable
                  ? `بازده سرمایه (ROI): ٪${toPersianDigits(stats.roiPercent)}`
                  : stats.remainingUnitsToBreakEven > 0
                  ? `${toPersianDigits(stats.remainingUnitsToBreakEven)} فروش تا نقطه سر‌به‌سر`
                  : `پیشرفت بازگشت سرمایه: ٪${toPersianDigits(stats.breakEvenProgressPercent)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'شناسنامه و شبیه‌ساز سودآوری', icon: Calculator },
              {
                id: 'sales',
                label: `فروش‌ها و مالی (${toPersianDigits(stats.sales.length)})`,
                icon: ShoppingBag
              },
              {
                id: 'costs',
                label: `ریز هزینه‌های تولید (${toPersianDigits(stats.costs.length)})`,
                icon: Receipt
              },
              {
                id: 'support',
                label: `پشتیبانی و تمدید (${toPersianDigits(stats.activeSupportCount)})`,
                icon: ShieldCheck
              }
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = detailTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDetailTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Overview & Interactive Margin/Break-Even Simulator */}
        {detailTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left / Identity & Pricing Card */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-2">درباره محصول و تعرفه‌ها</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeProduct.description || 'توضیحاتی برای این محصول ثبت نشده است.'}
                </p>
              </div>

              {/* Pricing Schedule */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-500 block">
                  {activeTiers.length > 0 ? 'نسخه‌ها و تعرفه‌های فروش تعریف‌شده' : 'تعرفه‌های فروش تعریف‌شده'}
                </span>

                {activeTiers.length > 0 ? (
                  <div className="space-y-2">
                    {activeTiers.map((tier) => {
                      const tierSoldCount = supportBuyers.filter((s) => s.tierId === tier.id).length;
                      return (
                        <div
                          key={tier.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-black text-slate-900 truncate">{tier.name}</span>
                              {tierSoldCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold tabular-nums shrink-0">
                                  {toPersianDigits(tierSoldCount)} فروش
                                </span>
                              )}
                            </div>
                            <span className="font-black text-indigo-700 tabular-nums whitespace-nowrap">
                              {formatPrice(tier.price)} تومان
                            </span>
                          </div>
                          {tier.description && (
                            <p className="text-[11px] text-slate-500">{tier.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-medium text-slate-500 tabular-nums pt-0.5">
                            <span>
                              پشتیبانی اولیه:{' '}
                              <strong className="text-slate-700">
                                {tier.supportMonths ? `${toPersianDigits(tier.supportMonths)} ماه` : 'ندارد'}
                              </strong>
                            </span>
                            <span>·</span>
                            <span>
                              تمدید سالانه (اختیاری):{' '}
                              <strong className="text-emerald-700">
                                {tier.supportRenewalPrice
                                  ? `${formatPrice(tier.supportRenewalPrice)} تومان`
                                  : 'توافقی'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div className="space-y-2">
                  {activeTiers.length === 0 && activeProduct.oneTimePrice ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs">
                      <span className="font-bold text-slate-600">فروش یک‌باره (لایسنس دائمی)</span>
                      <span className="font-black text-slate-900 tabular-nums">
                        {formatPrice(activeProduct.oneTimePrice)} تومان
                      </span>
                    </div>
                  ) : null}
                  {activeProduct.monthlyPrice ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs">
                      <span className="font-bold text-slate-600">اشتراک ماهانه</span>
                      <span className="font-black text-indigo-700 tabular-nums">
                        {formatPrice(activeProduct.monthlyPrice)} تومان / ماه
                      </span>
                    </div>
                  ) : null}
                  {activeProduct.annualPrice ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs">
                      <span className="font-bold text-slate-600">اشتراک سالانه</span>
                      <span className="font-black text-emerald-700 tabular-nums">
                        {formatPrice(activeProduct.annualPrice)} تومان / سال
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Support Policy */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-500 block">قوانین پشتیبانی محصول</span>
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-bold">سیاست:</span>
                    <span className="font-black text-emerald-800">
                      {SUPPORT_POLICY_LABELS[activeProduct.supportPolicy]}
                    </span>
                  </div>
                  {activeProduct.supportPolicy !== 'none' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-bold">مدت دوره پیش‌فرض:</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {toPersianDigits(activeProduct.defaultSupportMonths)} ماه
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-bold">تعرفه تمدید هر دوره:</span>
                        <span className="font-black text-slate-900 tabular-nums">
                          {formatPrice(activeProduct.supportRenewalPrice || 0)} تومان
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-500 flex items-center gap-1.5">
                  <Layers size={13} /> استک فنی و تکنولوژی‌ها
                </span>
                {activeProduct.stack.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeProduct.stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">تکنولوژی ثبت نشده است.</p>
                )}
              </div>

              {activeProduct.demoUrl && (
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={activeProduct.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <ExternalLink size={14} />
                    مشاهده دمو / صفحه محصول
                  </a>
                </div>
              )}
            </div>

            {/* Right / Price-First Sales, Break-Even & Profitability Simulator */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    شبیه‌ساز فروش، نقطه سر‌به‌سر و سودآوری
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    بر اساس کل هزینه تولید ثبت‌شده (
                    <strong className="text-slate-700">{formatPrice(stats.totalCost)} تومان</strong>) ببینید با قیمت فعلی چه زمانی به سود می‌رسید
                  </p>
                </div>
                {simSavedFlash && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                    <CheckCircle2 size={13} /> روی محصول ذخیره شد
                  </span>
                )}
              </div>

              {/* Simulator Inputs */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                {/* Quick Tier Selector Strip (Only if product has multiple tiers) */}
                {activeTiers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200/70">
                    <span className="text-[11px] font-bold text-slate-500 ml-1">تست سریع با قیمت نسخه‌ها:</span>
                    {activeTiers.map((tier) => {
                      const isActivePrice = simPriceNum === tier.price;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSimUnitPrice(String(tier.price))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer tabular-nums ${
                            isActivePrice
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                          }`}
                        >
                          {tier.name}: {formatPrice(tier.price)}
                        </button>
                      );
                    })}
                    {activeTiers.length > 1 && avgTierPrice > 0 && (
                      <button
                        type="button"
                        onClick={() => setSimUnitPrice(String(avgTierPrice))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer tabular-nums ${
                          simPriceNum === avgTierPrice
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        میانگین: {formatPrice(avgTierPrice)}
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      قیمت فروش هر نسخه
                    </label>
                    <FormattedNumberInput
                      value={simUnitPrice}
                      onChange={setSimUnitPrice}
                      suffix="تومان"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      هزینه جانبی هر فروش (اختیاری)
                    </label>
                    <FormattedNumberInput
                      value={simVarCost}
                      onChange={setSimVarCost}
                      placeholder="نصب / پورسانت"
                      suffix="تومان"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      تارگت فروش (فقط پیش‌بینی)
                    </label>
                    <FormattedNumberInput
                      value={simTargetSales}
                      onChange={setSimTargetSales}
                      max={10000}
                      placeholder="۱۰"
                      suffix="فروش"
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Target ROI on Investment Slider (Section 4) */}
                <div className="space-y-2 pt-3 border-t border-slate-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <label className="font-bold text-slate-700">
                      هدف سود روی سرمایه تولید (برای محاسبه تعداد فروش لازم):
                    </label>
                    <span className="font-black text-indigo-700 tabular-nums text-xs">
                      ٪{toPersianDigits(simSafeRoiPercent)}{' '}
                      {stats.totalCost > 0 && (
                        <span className="text-[11px] font-bold text-slate-500">
                          (معادل {formatPrice(simTargetRoiProfitAmount)} تومان سود خالص)
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={10}
                    value={Math.min(300, simSafeRoiPercent)}
                    onChange={(e) => setSimTargetRoi(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold tabular-nums">
                    <span>٪۲۰ سود</span>
                    <span>٪۱۰۰ (دوبرابر شدن سرمایه)</span>
                    <span>٪۲۰۰</span>
                    <span>٪۳۰۰</span>
                  </div>
                </div>
              </div>

              {/* 3 Clear Core Result Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Net Contribution per Sale */}
                <div
                  className={`p-4 rounded-2xl border space-y-1 ${
                    simUnitContribution >= 0
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold block ${
                      simUnitContribution >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    آورده خالص هر فروش
                  </span>
                  <div
                    className={`text-lg font-black tabular-nums ${
                      simUnitContribution >= 0 ? 'text-emerald-950' : 'text-rose-900'
                    }`}
                  >
                    {simUnitContribution < 0 ? '−' : ''}
                    {formatPrice(Math.abs(simUnitContribution))}{' '}
                    <span className="text-[11px] font-bold opacity-70">تومان</span>
                  </div>
                  <p
                    className={`text-[10px] font-bold tabular-nums ${
                      simUnitContribution >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {simPriceNum > 0
                      ? `حاشیه سود هر فروش: ٪${toPersianDigits(simPerSaleMarginPercent)}`
                      : 'قیمت فروش را وارد کنید'}
                  </p>
                </div>

                {/* 2. Break-Even Point */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 block">
                    نقطه سر‌به‌سر (برگشت سرمایه)
                  </span>
                  <div className="text-lg font-black text-amber-950 tabular-nums">
                    {stats.totalCost === 0 ? (
                      <span className="text-xs font-bold text-amber-700">هزینه تولید ثبت نشده</span>
                    ) : simUnitContribution <= 0 ? (
                      <span className="text-xs font-bold text-rose-700">قیمت کمتر از هزینه جانبی!</span>
                    ) : (
                      <>
                        {toPersianDigits(simBreakEvenUnits)}{' '}
                        <span className="text-xs font-bold">فروش</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium tabular-nums">
                    {simBreakEvenUnits > 0
                      ? `از فروش ${toPersianDigits(simBreakEvenUnits + 1)} به بعد سود خالص کامل است`
                      : 'برای محاسبه سر‌به‌سر، هزینه تولید ثبت کنید'}
                  </p>
                </div>

                {/* 3. Required Sales for Target ROI on Investment */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-700 block tabular-nums">
                    برای ٪{toPersianDigits(simSafeRoiPercent)} سود روی سرمایه
                  </span>
                  <div className="text-lg font-black text-indigo-950 tabular-nums">
                    {stats.totalCost === 0 ? (
                      <span className="text-xs font-bold text-indigo-600">هزینه تولید ثبت نشده</span>
                    ) : simUnitContribution <= 0 ? (
                      <span className="text-xs font-bold text-rose-700">قابل محاسبه نیست</span>
                    ) : (
                      <>
                        {toPersianDigits(simUnitsForTargetRoi)}{' '}
                        <span className="text-xs font-bold">فروش لازم است</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-indigo-700 font-medium tabular-nums">
                    {stats.totalCost > 0
                      ? `سود هدف: ${formatPrice(simTargetRoiProfitAmount)} تومان`
                      : 'ابتدا هزینه تولید ثبت کنید'}
                  </p>
                </div>
              </div>

              {/* Sales Scenarios Forecast Table */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800">
                    جدول سناریوهای فروش (با قیمت {formatPrice(simPriceNum)} تومان)
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    پیش‌بینی درآمد و سود خالص واقعی
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-500">
                        <th className="py-2.5 px-3.5">تعداد فروش</th>
                        <th className="py-2.5 px-3.5">کل درآمد</th>
                        <th className="py-2.5 px-3.5">کل هزینه</th>
                        <th className="py-2.5 px-3.5">سود / زیان خالص</th>
                        <th className="py-2.5 px-3.5 text-left">بازده کل (ROI)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] tabular-nums">
                      {scenarioCounts.map((count) => {
                        const rev = simPriceNum * count;
                        const cost = stats.totalCost + simVarNum * count;
                        const profit = rev - cost;
                        const roi = cost > 0 ? Math.round((profit / cost) * 100) : 0;
                        const isTarget = count === simTargetSalesNum;
                        const isBreakEven = simBreakEvenUnits > 0 && count === simBreakEvenUnits;

                        return (
                          <tr
                            key={count}
                            className={
                              isTarget
                                ? 'bg-indigo-50/60 font-bold'
                                : 'bg-white hover:bg-slate-50/70 transition-colors'
                            }
                          >
                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900">
                                  {toPersianDigits(count)} فروش
                                </span>
                                {isTarget && (
                                  <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-bold">
                                    تارگت شما
                                  </span>
                                )}
                                {isBreakEven && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                                    سر‌به‌سر
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-700 whitespace-nowrap">
                              {formatPrice(rev)}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                              {formatPrice(cost)}
                            </td>
                            <td
                              className={`py-2.5 px-3.5 font-black whitespace-nowrap ${
                                profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {profit >= 0 ? '+' : '−'}
                              {formatPrice(Math.abs(profit))} تومان
                            </td>
                            <td className="py-2.5 px-3.5 text-left whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  profit >= 0
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {cost > 0
                                  ? `${roi >= 0 ? '+' : '−'}٪${toPersianDigits(Math.abs(roi))}`
                                  : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real Break-Even Progress Bar (Actual Sales So Far) */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                  <span className="text-slate-600">
                    پیشرفت واقعی بازگشت سرمایه (تا الان: {toPersianDigits(stats.totalUnitsSold)} واحد فروخته‌شده)
                  </span>
                  <span
                    className={`tabular-nums ${
                      stats.isProfitable ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {stats.isProfitable
                      ? `۱۰۰٪ تکمیل (سود خالص ${formatPrice(stats.netProfit)} تومان)`
                      : `٪${toPersianDigits(stats.breakEvenProgressPercent)} از هزینه تولید پوشش داده شده`}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.isProfitable ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(4, stats.breakEvenProgressPercent))}%` }}
                  />
                </div>
              </div>

              {/* Save / Reset Simulator Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                {hasUnsavedSimChanges && (
                  <button
                    type="button"
                    onClick={() => {
                      setSimUnitPrice(String(stats.referenceUnitPrice || 0));
                      setSimVarCost(String(activeProduct.variableCostPerUnit || 0));
                      setSimTargetSales(String(activeProduct.targetSalesCount || 10));
                      setSimTargetRoi(activeProduct.targetMarginPercent ?? 100);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    بازنشانی به مقادیر ذخیره‌شده
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const priceUpdates: Partial<Product> = {
                      targetMarginPercent: simSafeRoiPercent,
                      targetSalesCount: simTargetSalesNum,
                      variableCostPerUnit: simVarNum
                    };
                    if (simPriceNum > 0) {
                      if (activeProduct.salesModel === 'subscription') {
                        priceUpdates.annualPrice = simPriceNum;
                      } else {
                        priceUpdates.oneTimePrice = simPriceNum;
                      }
                    }
                    updateProduct(activeProduct.id, priceUpdates);
                    setSimSavedFlash(true);
                    setTimeout(() => setSimSavedFlash(false), 3000);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  ذخیره قیمت و تارگت‌ها روی محصول
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Sales & Product Finance */}
        {detailTab === 'sales' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">دفتر فروش‌ها و دریافتی‌های این محصول</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                  جمع فروش: {formatPrice(stats.totalSalesValue)} تومان · دریافتی نقد: {formatPrice(stats.totalPaid)} تومان · مانده طلب: {formatPrice(stats.remainingReceivables)} تومان
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => openNewSaleModal(activeProduct.id, e)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus size={14} /> ثبت فروش جدید
              </button>
            </div>

            {stats.sales.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <ShoppingBag size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">هنوز فروشی برای این محصول ثبت نشده است.</p>
                <button
                  type="button"
                  onClick={(e) => openNewSaleModal(activeProduct.id, e)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus size={14} /> ثبت اولین فروش
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500">
                      <th className="py-3 px-4">خریدار / شرکت</th>
                      <th className="py-3 px-4">نوع فروش</th>
                      <th className="py-3 px-4">مبلغ کل</th>
                      <th className="py-3 px-4">دریافتی / مانده</th>
                      <th className="py-3 px-4">روش و حساب مقصد</th>
                      <th className="py-3 px-4">تاریخ</th>
                      <th className="py-3 px-4 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {stats.sales.map((sale) => {
                      const saleEvents = getNormalizedSaleEvents(sale);
                      const upgradeCount = saleEvents.filter((e) => e.type === 'upgrade').length;
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            {sale.clientId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClientIdForView(sale.clientId!);
                                  setActiveTab('clients');
                                }}
                                className="text-right group cursor-pointer"
                              >
                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {sale.buyerName}
                                </div>
                                {sale.buyerCompany && (
                                  <div className="text-[11px] text-slate-400">{sale.buyerCompany}</div>
                                )}
                              </button>
                            ) : (
                              <div>
                                <div className="font-bold text-slate-900">{sale.buyerName}</div>
                                {sale.buyerCompany && (
                                  <div className="text-[11px] text-slate-400">{sale.buyerCompany}</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sale.isFounderLicense ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  مشتری بنیان‌گذار (پروژه اولیه)
                                </span>
                              ) : (
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                    sale.saleType === 'تمدید پشتیبانی'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : sale.saleType === 'ارتقای نسخه'
                                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                      : sale.saleType === 'یک‌باره'
                                      ? 'bg-indigo-50 text-indigo-700'
                                      : 'bg-purple-50 text-purple-700'
                                  }`}
                                >
                                  {sale.saleType}
                                </span>
                              )}
                              {sale.tierName && (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                  {sale.tierName}
                                </span>
                              )}
                              {sale.quantity > 1 && (
                                <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                  ×{toPersianDigits(sale.quantity)}
                                </span>
                              )}
                            </div>
                            {sale.upgradedFromTierName && (
                              <div className="text-[10px] text-cyan-700 font-bold mt-1">
                                ارتقایافته از «{sale.upgradedFromTierName}»
                                {upgradeCount > 1 && ` (${toPersianDigits(upgradeCount)} ارتقا)`}
                              </div>
                            )}
                            {saleEvents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => openSaleLedgerModal(sale, 'history')}
                                className="text-[10px] text-indigo-600 hover:underline font-bold mt-0.5 block cursor-pointer tabular-nums"
                              >
                                {toPersianDigits(saleEvents.length)} رویداد ثبت‌شده در پرونده
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums whitespace-nowrap">
                            {sale.isFounderLicense && sale.totalAmount === 0 ? (
                              <div>
                                <div className="text-slate-600">۰ تومان</div>
                                <div className="text-[10px] font-bold text-amber-700">
                                  ثبت‌شده در پروژه اولیه
                                </div>
                              </div>
                            ) : (
                              `${formatPrice(sale.totalAmount)} تومان`
                            )}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums whitespace-nowrap">
                            <div className="font-bold text-emerald-700">
                              دریافتی: {formatPrice(sale.paidAmount)}
                            </div>
                            {sale.remainingAmount > 0 ? (
                              <div className="text-[11px] font-bold text-rose-600">
                                بدهکار: {formatPrice(sale.remainingAmount)}
                              </div>
                            ) : sale.isFounderLicense && sale.totalAmount === 0 ? (
                              <div className="text-[10px] font-bold text-slate-500">
                                بدون دوباره‌شماری مالی
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold text-emerald-600">تسویه کامل</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-700">{sale.method}</div>
                            {sale.bankAccountLabel && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[190px]">
                                {toPersianDigits(sale.bankAccountLabel)}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-600 tabular-nums whitespace-nowrap">
                            {toPersianDigits(sale.date)}
                          </td>
                          <td className="py-3.5 px-4 text-left whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openSaleLedgerModal(
                                    sale,
                                    sale.remainingAmount > 0 ? 'payment' : 'history'
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  sale.remainingAmount > 0
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                }`}
                                title="ثبت پرداخت جدید و مدیریت مالی پرونده"
                              >
                                <Wallet size={13} />
                                مدیریت پرداخت
                              </button>
                              <button
                                type="button"
                                onClick={() => setInvoiceSaleIdForPreview(sale.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="مشاهده و چاپ فاکتور فروش"
                              >
                                <FileText size={12} />
                                فاکتور
                              </button>
                              <button
                                type="button"
                                onClick={() => openSaleLedgerModal(sale, 'history')}
                                className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="مشاهده تاریخچه خرید، ارتقا و واریزی‌ها"
                              >
                                <History size={13} />
                                تاریخچه
                              </button>
                              {activeTiers.length > 1 &&
                                sale.saleType !== 'تمدید پشتیبانی' &&
                                sale.saleType !== 'ارتقای نسخه' && (
                                  <button
                                    type="button"
                                    onClick={() => openUpgradeModal(sale)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                    title="ارتقای نسخه خریدار و ثبت مابه‌التفاوت در همین پرونده"
                                  >
                                    <ArrowUpCircle size={13} />
                                    ارتقا
                                  </button>
                                )}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmState({
                                    isOpen: true,
                                    title: 'حذف پرونده فروش',
                                    message: `آیا از حذف کامل پرونده فروش «${sale.buyerName}» به مبلغ ${formatPrice(sale.totalAmount)} تومان مطمئن هستید؟`,
                                    onConfirm: () => deleteProductSale(sale.id)
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف پرونده فروش"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Detailed Production & Maintenance Costs */}
        {detailTab === 'costs' && (
          <div className="space-y-5">
            {/* Breakdown Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500">جمع کل هزینه‌ها</span>
                <div className="text-base font-black text-slate-900 mt-1 tabular-nums">
                  {formatPrice(stats.totalCost)} تومان
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-indigo-600">توسعه اولیه</span>
                <div className="text-base font-black text-slate-900 mt-1 tabular-nums">
                  {formatPrice(stats.devCost)} تومان
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-amber-600">نگهداری و زیرساخت</span>
                <div className="text-base font-black text-slate-900 mt-1 tabular-nums">
                  {formatPrice(stats.infraCost)} تومان
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-rose-600">بازاریابی و سایر</span>
                <div className="text-base font-black text-slate-900 mt-1 tabular-nums">
                  {formatPrice(stats.marketingCost + stats.otherCost)} تومان
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">ریز هزینه‌های تولید، زیرساخت و بازاریابی</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تمامی این هزینه‌ها به صورت خودکار در نقطه سر‌به‌سر محصول و دفتر مالی کل لحاظ می‌شوند.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCostModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus size={14} /> ثبت ردیف هزینه جدید
                </button>
              </div>

              {stats.costs.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  هنوز هزینه‌ای برای تولید یا نگهداری این محصول ثبت نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {stats.costs.map((cost) => (
                    <div
                      key={cost.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                              {cost.costType}
                            </span>
                            {cost.categoryTitle && (
                              <span className="text-[10px] font-bold text-slate-500">
                                · {cost.categoryTitle}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900">{cost.title}</h4>
                          {cost.notes && (
                            <p className="text-[11px] text-slate-500 leading-relaxed">{cost.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openCostModal(cost)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="ویرایش هزینه"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({
                                isOpen: true,
                                title: 'حذف ردیف هزینه',
                                message: `آیا از حذف هزینه «${cost.title}» مطمئن هستید؟`,
                                onConfirm: () => deleteProductCost(cost.id)
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="حذف هزینه"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                            {toPersianDigits(cost.date)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              cost.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {cost.paymentStatus === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                          </span>
                        </div>
                        <span className="font-black text-rose-700 tabular-nums">
                          {formatPrice(cost.amount)} تومان
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Support & Renewals */}
        {detailTab === 'support' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 block">پشتیبانی فعال</span>
                  <span className="text-xl font-black text-emerald-800 tabular-nums">
                    {toPersianDigits(stats.activeSupportCount)} خریدار
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-700 block">نزدیک به انقضا</span>
                  <span className="text-xl font-black text-amber-800 tabular-nums">
                    {toPersianDigits(stats.expiringSupportCount)} خریدار
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <ShieldAlert size={20} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-700 block">منقضی‌شده</span>
                  <span className="text-xl font-black text-rose-800 tabular-nums">
                    {toPersianDigits(stats.expiredSupportCount)} خریدار
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <ShieldOff size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">وضعیت پشتیبانی و تاریخ انقضای خریداران</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  با ثبت تمدید پشتیبانی، تاریخ انقضا به‌روز شده و درآمد تمدید به صورت خودکار در مالی محصول و دفتر کل ثبت می‌شود.
                </p>
              </div>

              {supportBuyers.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  خریدار فعالی برای نمایش وضعیت پشتیبانی وجود ندارد.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500">
                        <th className="py-3 px-4">خریدار / شرکت</th>
                        <th className="py-3 px-4">وضعیت پشتیبانی</th>
                        <th className="py-3 px-4">شروع / انقضا</th>
                        <th className="py-3 px-4">تعرفه تمدید</th>
                        <th className="py-3 px-4 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {supportBuyers.map((sale) => {
                        const supStatus = getProductSupportStatus(sale.hasSupport, sale.supportEndDate);
                        const daysLeft = sale.supportEndDate
                          ? diffPersianDatesInDays(sale.supportEndDate, getTodayPersianDate())
                          : null;

                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-900">{sale.buyerName}</span>
                                {sale.isFounderLicense && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold">
                                    مشتری بنیان‌گذار
                                  </span>
                                )}
                                {sale.tierName && (
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                                    {sale.tierName}
                                  </span>
                                )}
                              </div>
                              {sale.buyerCompany && (
                                <div className="text-[11px] text-slate-400">{sale.buyerCompany}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {supStatus === 'active' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                                  <ShieldCheck size={13} /> فعال
                                  {daysLeft !== null && ` (${toPersianDigits(daysLeft)} روز)`}
                                </span>
                              )}
                              {supStatus === 'expiring' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold">
                                  <ShieldAlert size={13} /> نزدیک انقضا ({toPersianDigits(daysLeft || 0)} روز)
                                </span>
                              )}
                              {supStatus === 'expired' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-bold">
                                  <ShieldOff size={13} /> پایان دوره (تمدید اختیاری)
                                </span>
                              )}
                              {supStatus === 'none' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold">
                                  بدون پشتیبانی
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 tabular-nums">
                              {sale.hasSupport && sale.supportEndDate ? (
                                <div>
                                  <div className="font-bold text-slate-800">
                                    تا {toPersianDigits(sale.supportEndDate)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    شروع: {toPersianDigits(sale.supportStartDate || sale.date)} ({toPersianDigits(sale.supportMonths || 0)} ماه)
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 tabular-nums whitespace-nowrap">
                              {sale.supportRenewalPrice
                                ? `${formatPrice(sale.supportRenewalPrice)} تومان`
                                : activeProduct.supportRenewalPrice
                                ? `${formatPrice(activeProduct.supportRenewalPrice)} تومان`
                                : 'اختیاری / توافقی'}
                            </td>
                            <td className="py-3.5 px-4 text-left whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {activeTiers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => openUpgradeModal(sale)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    <ArrowUpCircle size={12} />
                                    ارتقای نسخه
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openRenewModal(sale)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <RefreshCw size={12} />
                                  {sale.hasSupport ? 'ثبت تمدید' : 'فعال‌سازی پشتیبانی'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD / EDIT COST MODAL */}
        {isCostModalOpen && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {editingCost ? 'ویرایش ردیف هزینه محصول' : 'ثبت هزینه جدید تولید / نگهداری'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">محصول: {activeProduct.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCostModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveCost} className="p-5 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">عنوان هزینه *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: طراحی رابط کاربری، سرور اختصاصی، کمپین تبلیغات..."
                    value={costForm.title}
                    onChange={(e) => setCostForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">نوع / بخش هزینه *</label>
                      <button
                        type="button"
                        onClick={() => setIsCostTypeManagerOpen(true)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        تعریف / ویرایش
                      </button>
                    </div>
                    <CustomSelect
                      value={costForm.costType}
                      onChange={(val) => setCostForm((f) => ({ ...f, costType: val }))}
                      options={productCostTypes.map((ct) => ({ value: ct, label: ct }))}
                      searchable
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">سرفصل موضوعی</label>
                      <button
                        type="button"
                        onClick={() => setIsExpenseCatManagerOpen(true)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        تعریف / ویرایش
                      </button>
                    </div>
                    <CustomSelect
                      value={costForm.categoryTitle}
                      onChange={(val) => setCostForm((f) => ({ ...f, categoryTitle: val }))}
                      options={expenseCategories.map((c) => ({ value: c, label: c }))}
                      searchable
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">مبلغ هزینه *</label>
                    <FormattedNumberInput
                      required
                      value={costForm.amount}
                      onChange={(val) => setCostForm((f) => ({ ...f, amount: val }))}
                      suffix="تومان"
                      placeholder="مثلاً: ۱۵,۰۰۰,۰۰۰"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">تاریخ هزینه (شمسی)</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={costForm.date}
                      onChange={(d) => setCostForm((f) => ({ ...f, date: d?.format?.('YYYY/MM/DD') || '' }))}
                      inputClass="rmdp-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">وضعیت پرداخت</label>
                  <CustomSelect
                    value={costForm.paymentStatus}
                    onChange={(val) =>
                      setCostForm((f) => ({ ...f, paymentStatus: val as 'paid' | 'pending' }))
                    }
                    options={[
                      { value: 'paid', label: 'پرداخت شده', dotColorClass: 'bg-emerald-500' },
                      { value: 'pending', label: 'در انتظار پرداخت (معوق)', dotColorClass: 'bg-amber-500' }
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">یادداشت (اختیاری)</label>
                  <textarea
                    rows={2}
                    value={costForm.notes}
                    onChange={(e) => setCostForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="جزئیات فاکتور یا شرح هزینه..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCostModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {editingCost ? 'ذخیره تغییرات' : 'ثبت هزینه'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PAYMENT MANAGER & FULL HISTORY MODAL */}
        <ProductSaleLedgerModal
          isOpen={ledgerModalState.isOpen}
          onClose={() => setLedgerModalState((s) => ({ ...s, isOpen: false }))}
          saleId={ledgerModalState.saleId}
          initialTab={ledgerModalState.initialTab}
          onRequestUpgrade={activeTiers.length > 1 ? openUpgradeModal : undefined}
          onRequestRenew={openRenewModal}
        />

        {/* PRODUCT SALE INVOICE PREVIEW MODAL */}
        <InvoicePreviewModal
          isOpen={Boolean(invoiceSaleIdForPreview)}
          onClose={() => setInvoiceSaleIdForPreview(null)}
          invoice={
            invoiceSaleIdForPreview ? buildInvoiceFromProductSale(invoiceSaleIdForPreview) : null
          }
        />

        {/* PRODUCT COST TYPES MANAGER */}
        <OptionManagerModal
          mode="string"
          isOpen={isCostTypeManagerOpen}
          onClose={() => setIsCostTypeManagerOpen(false)}
          title="مدیریت انواع و بخش‌های هزینه محصول"
          subtitle="افزودن، ویرایش یا حذف بخش‌های هزینه برای تمامی محصولات"
          items={productCostTypes}
          onAdd={addProductCostType}
          onUpdate={updateProductCostType}
          onDelete={deleteProductCostType}
        />

        {/* SUPPORT RENEWAL MODAL (Updates same single account!) */}
        {renewingSale && (() => {
          const feeNum = Math.max(0, Number(renewFee) || 0);
          const paidNum = Math.min(feeNum, Math.max(0, Number(renewPaid) || 0));
          const nextTotal = renewingSale.totalAmount + feeNum;
          const nextRemaining = renewingSale.remainingAmount + (feeNum - paidNum);

          return (
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div>
                    <h4 className="text-base font-black text-slate-900">ثبت تمدید پشتیبانی</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      خریدار: {renewingSale.buyerName}
                      {renewingSale.supportEndDate
                        ? ` · انقضای فعلی: ${toPersianDigits(renewingSale.supportEndDate)}`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenewingSale(null)}
                    className="p-2 hover:bg-slate-200 rounded-full text-slate-400 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleConfirmRenew} className="p-5 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">مدت تمدید</label>
                        <div className="flex gap-1">
                          {[3, 6, 12].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setRenewMonths(String(m))}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                Number(renewMonths) === m
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {toPersianDigits(m)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <FormattedNumberInput
                        required
                        value={renewMonths}
                        max={60}
                        onChange={setRenewMonths}
                        suffix="ماه"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">تعرفه تمدید</label>
                      <FormattedNumberInput
                        value={renewFee}
                        onChange={(val) => {
                          setRenewFee(val);
                          if (Number(renewPaid) > Number(val)) setRenewPaid(val);
                        }}
                        suffix="تومان"
                      />
                    </div>
                  </div>

                  {/* Received Now with Quick Chips */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700">دریافتی نقد در این لحظه</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setRenewPaid('0')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                            paidNum === 0
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ۰ (ثبت بدهی)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewPaid(String(Math.round(feeNum * 0.5)))}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          ۵۰٪
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewPaid(String(feeNum))}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                            feeNum > 0 && paidNum === feeNum
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          پرداخت کامل
                        </button>
                      </div>
                    </div>
                    <FormattedNumberInput
                      value={renewPaid}
                      max={feeNum}
                      onChange={setRenewPaid}
                      placeholder="۰"
                      suffix="تومان"
                    />
                  </div>

                  {/* Live Account Impact Preview */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs tabular-nums">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>مبلغ کل فعلی پرونده + تعرفه تمدید:</span>
                      <span className="font-black text-slate-900">{formatPrice(nextTotal)} تومان</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">مانده بدهی جدید پرونده:</span>
                      <span className={`font-black ${nextRemaining > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {nextRemaining > 0 ? `${formatPrice(nextRemaining)} تومان` : '۰ تومان (تسویه)'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">روش پرداخت</label>
                      <CustomSelect
                        value={renewMethod}
                        onChange={(v) => setRenewMethod(v as ProductSale['method'])}
                        options={PAYMENT_METHODS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">تاریخ ثبت</label>
                      <DatePicker
                        calendar={persian}
                        locale={persian_fa}
                        value={renewDate}
                        onChange={(d) => setRenewDate(d?.format?.('YYYY/MM/DD') || '')}
                        inputClass="rmdp-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">حساب مقصد واریز</label>
                    <CustomSelect value={renewBankId} onChange={setRenewBankId} options={bankOptions} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">کد رهگیری (اختیاری)</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={renewTracking}
                        onChange={(e) => setRenewTracking(e.target.value)}
                        placeholder="TRX-..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">یادداشت (اختیاری)</label>
                      <input
                        type="text"
                        value={renewNotes}
                        onChange={(e) => setRenewNotes(e.target.value)}
                        placeholder="مثلاً: تمدید سال دوم..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRenewingSale(null)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ثبت تمدید در پرونده خریدار
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* TIER UPGRADE MODAL (Updates same single buyer account — NO duplicate row!) */}
        {upgradingSale && activeTiers.length > 1 && (() => {
          const feeNum = Math.max(0, Number(upgradeFee) || 0);
          const paidNum = Math.min(feeNum, Math.max(0, Number(upgradePaid) || 0));
          const nextTotal = upgradingSale.totalAmount + feeNum;
          const nextRemaining = upgradingSale.remainingAmount + (feeNum - paidNum);

          return (
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                      <ArrowUpCircle size={17} className="text-cyan-600" />
                      ارتقای نسخه در پرونده خریدار
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {upgradingSale.buyerName} · نسخه فعلی:{' '}
                      <strong className="text-slate-700">{upgradingSale.tierName || 'ثبت‌نشده'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpgradingSale(null)}
                    className="p-2 hover:bg-slate-200 rounded-full text-slate-400 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleConfirmUpgrade} className="p-5 space-y-4 overflow-y-auto">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">نسخه جدید (مقصد ارتقا) *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeTiers
                        .filter((t) => t.id !== upgradingSale.tierId)
                        .map((tier) => {
                          const isSelected = upgradeTierId === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => handleSelectUpgradeTier(tier.id)}
                              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer space-y-0.5 ${
                                isSelected
                                  ? 'bg-cyan-50/80 border-cyan-500 ring-2 ring-cyan-200/60'
                                  : 'bg-white border-slate-200 hover:border-cyan-300'
                              }`}
                            >
                              <div className="text-xs font-black text-slate-900">{tier.name}</div>
                              <div className="text-xs font-black text-cyan-700 tabular-nums">
                                {formatPrice(tier.price)} تومان
                              </div>
                              {tier.supportRenewalPrice ? (
                                <div className="text-[10px] text-slate-500 tabular-nums">
                                  تمدید سالانه: {formatPrice(tier.supportRenewalPrice)}
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">مبلغ مابه‌التفاوت ارتقا *</label>
                    <FormattedNumberInput
                      required
                      value={upgradeFee}
                      onChange={(val) => {
                        setUpgradeFee(val);
                        if (Number(upgradePaid) > Number(val)) {
                          setUpgradePaid(val);
                        }
                      }}
                      suffix="تومان"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700">
                        مبلغ پرداخت‌شده در همین لحظه
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setUpgradePaid('0')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                            paidNum === 0
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ۰ (ثبت به عنوان بدهی)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpgradePaid(String(Math.round(feeNum * 0.5)))}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          ۵۰٪
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpgradePaid(String(feeNum))}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                            feeNum > 0 && paidNum === feeNum
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          پرداخت کامل
                        </button>
                      </div>
                    </div>
                    <FormattedNumberInput
                      value={upgradePaid}
                      max={feeNum}
                      onChange={setUpgradePaid}
                      placeholder="۰"
                      suffix="تومان"
                    />
                  </div>

                  {/* Live Single-Account Accounting Summary */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs tabular-nums">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>مبلغ کل قبلی پرونده:</span>
                      <span className="font-bold text-slate-700">
                        {formatPrice(upgradingSale.totalAmount)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>+ مابه‌التفاوت ارتقا:</span>
                      <span className="font-bold text-cyan-700">+{formatPrice(feeNum)} تومان</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                      <span className="font-bold text-slate-700">مبلغ کل جدید پرونده:</span>
                      <span className="font-black text-slate-900">{formatPrice(nextTotal)} تومان</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">مانده بدهی جدید خریدار:</span>
                      <span
                        className={`font-black ${
                          nextRemaining > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {nextRemaining > 0
                          ? `${formatPrice(nextRemaining)} تومان (بدهکار)`
                          : '۰ تومان (تسویه کامل)'}
                      </span>
                    </div>
                  </div>

                  {paidNum > 0 && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">روش پرداخت</label>
                          <CustomSelect
                            value={upgradeMethod}
                            onChange={(val) => setUpgradeMethod(val as ProductSale['method'])}
                            options={PAYMENT_METHODS}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">کارت / حساب مقصد</label>
                          <CustomSelect
                            value={upgradeBankId}
                            onChange={setUpgradeBankId}
                            options={bankOptions}
                            placeholder="انتخاب حساب..."
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">تاریخ ارتقا</label>
                      <DatePicker
                        calendar={persian}
                        locale={persian_fa}
                        value={upgradeDate}
                        onChange={(d) => setUpgradeDate(d?.format?.('YYYY/MM/DD') || '')}
                        inputClass="rmdp-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">کد رهگیری (اختیاری)</label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="UPG-..."
                        value={upgradeTracking}
                        onChange={(e) => setUpgradeTracking(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">یادداشت (اختیاری)</label>
                    <input
                      type="text"
                      placeholder="مثلاً: فعال‌سازی ماژول چندشعبه..."
                      value={upgradeNotes}
                      onChange={(e) => setUpgradeNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setUpgradingSale(null)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ذخیره ارتقا در پرونده
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Shared Modals */}
        <ProductFormModal
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          editingProduct={editingProduct}
        />
        <ProductSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          lockedProductId={saleLockedProductId}
        />
        <OptionManagerModal
          mode="string"
          isOpen={isExpenseCatManagerOpen}
          onClose={() => setIsExpenseCatManagerOpen(false)}
          title="مدیریت سرفصل‌های موضوعی هزینه"
          subtitle="افزودن، ویرایش یا حذف سرفصل‌های هزینه تولید و عملیاتی"
          items={expenseCategories}
          onAdd={addExpenseCategory}
          onUpdate={updateExpenseCategory}
          onDelete={deleteExpenseCategory}
        />
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
          onConfirm={confirmState.onConfirm}
          title={confirmState.title}
          message={confirmState.message}
        />
      </div>
    );
  }

  // ==========================================
  // PRODUCTS CATALOG VIEW
  // ==========================================
  return (
    <div className="space-y-6 font-['Vazirmatn']">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">محصولات تولیدی و فروش</h2>
          <p className="text-xs text-slate-500 mt-1">
            مدیریت هزینه‌های تولید، مارجین سود، نقطه سر‌به‌سر، فروش‌های یک‌باره/اشتراکی و پشتیبانی خریداران
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDomainManagerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal size={14} />
            مدیریت زمینه‌ها
          </button>
          <button
            type="button"
            onClick={(e) => openNewSaleModal(undefined, e)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingBag size={14} />
            ثبت فروش جدید
          </button>
          <button
            type="button"
            onClick={openNewProductModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus size={15} />
            تعریف محصول جدید
          </button>
        </div>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500">کل هزینه تولید محصولات</span>
            <div className="text-lg font-black text-slate-900 mt-1.5 tabular-nums">
              {formatPrice(financeSummary.productsCosts)}{' '}
              <span className="text-[11px] font-bold text-slate-400">تومان</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block tabular-nums">
              {toPersianDigits(products.length)} محصول ثبت‌شده
            </span>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl shrink-0">
            <Receipt size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500">مجموع درآمد فروش محصولات</span>
            <div className="text-lg font-black text-indigo-700 mt-1.5 tabular-nums">
              {formatPrice(financeSummary.productsRevenue)}{' '}
              <span className="text-[11px] font-bold text-indigo-400">تومان</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 block tabular-nums">
              نقد دریافتی: {formatPrice(financeSummary.productsPaid)} تومان
            </span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
            <Wallet size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500">سود خالص بخش محصولات</span>
            <div
              className={`text-lg font-black mt-1.5 tabular-nums ${
                financeSummary.productsNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatPrice(financeSummary.productsNetProfit)}{' '}
              <span className="text-[11px] font-bold opacity-70">تومان</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block tabular-nums">
              مانده طلب فروش: {formatPrice(financeSummary.productsPendingReceivables)} تومان
            </span>
          </div>
          <div
            className={`p-2.5 rounded-2xl shrink-0 ${
              financeSummary.productsNetProfit >= 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {financeSummary.productsNetProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500">فروش‌ها و پشتیبانی فعال</span>
            <div className="text-lg font-black text-slate-900 mt-1.5 tabular-nums">
              {toPersianDigits(financeSummary.productsSalesCount)}{' '}
              <span className="text-xs font-bold text-slate-500">فروش ثبت‌شده</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 block tabular-nums">
              {toPersianDigits(financeSummary.activeProductSupports)} خریدار دارای پشتیبانی فعال
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام محصول، زمینه یا تکنولوژی..."
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5">
          <div className="sm:w-44">
            <CustomSelect
              value={domainFilter}
              onChange={setDomainFilter}
              options={[
                { value: 'all', label: 'همه زمینه‌ها' },
                ...productDomains.map((d) => ({ value: d, label: d }))
              ]}
            />
          </div>

          <div className="sm:w-40">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'همه وضعیت‌ها' },
                { value: 'در حال تولید', label: 'در حال تولید', dotColorClass: 'bg-amber-500' },
                { value: 'آماده فروش', label: 'آماده فروش', dotColorClass: 'bg-indigo-500' },
                { value: 'پرفروش', label: 'پرفروش', dotColorClass: 'bg-emerald-500' },
                { value: 'متوقف شده', label: 'متوقف شده', dotColorClass: 'bg-slate-400' }
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {(
            [
              { id: 'all', label: 'همه مدل‌ها' },
              { id: 'one-time', label: 'یک‌باره' },
              { id: 'subscription', label: 'اشتراکی' },
              { id: 'hybrid', label: 'ترکیبی' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setModelFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                modelFilter === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact 3-Column Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center space-y-3">
          <Package size={40} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-600">محصولی با این فیلتر یافت نشد.</p>
          <button
            type="button"
            onClick={openNewProductModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            <Plus size={14} /> تعریف اولین محصول
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const st = getProductStats(product.id);
            const statusStyle =
              PRODUCT_STATUS_STYLES[product.status] || PRODUCT_STATUS_STYLES['آماده فروش'];

            return (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProductId(product.id);
                  setDetailTab('overview');
                }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                {/* Card Top: Identity + Corner Edit/Delete */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                        <span className="text-indigo-600 font-bold">{product.domain}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span>{SALES_MODEL_LABELS[product.salesModel]}</span>
                        {product.version && (
                          <>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span dir="ltr">{product.version}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => openEditProductModal(product, e)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="ویرایش"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDeleteProductConfirm(product, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Status + Price Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {product.status}
                    </span>

                    <div className="text-left text-[11px] font-black text-slate-800 tabular-nums">
                      {product.tiers && product.tiers.length > 0 ? (
                        (() => {
                          const prices = product.tiers.map((t) => t.price).filter((p) => p > 0);
                          const minP = prices.length > 0 ? Math.min(...prices) : 0;
                          const maxP = prices.length > 0 ? Math.max(...prices) : 0;
                          return (
                            <>
                              <span>
                                {minP === maxP
                                  ? `${formatPrice(minP)} تومان`
                                  : `${formatPrice(minP)} تا ${formatPrice(maxP)}`}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-600 block">
                                {toPersianDigits(product.tiers.length)} نسخه فروش
                              </span>
                            </>
                          );
                        })()
                      ) : product.oneTimePrice ? (
                        <span>{formatPrice(product.oneTimePrice)} تومان</span>
                      ) : product.monthlyPrice ? (
                        <span>{formatPrice(product.monthlyPrice)} تومان / ماه</span>
                      ) : (
                        <span className="text-slate-400 font-medium">قیمت توافقی</span>
                      )}
                      {(!product.tiers || product.tiers.length === 0) &&
                      product.oneTimePrice &&
                      product.monthlyPrice ? (
                        <span className="text-[10px] font-medium text-slate-400 block">
                          اشتراک: {formatPrice(product.monthlyPrice)} / ماه
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Financial 3-Col Strip */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50/90 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">هزینه تولید</span>
                    <span className="text-[11px] font-black text-slate-700 tabular-nums">
                      {formatPrice(st.totalCost)}
                    </span>
                  </div>
                  <div className="border-r border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      فروش ({toPersianDigits(st.salesCount)})
                    </span>
                    <span className="text-[11px] font-black text-indigo-700 tabular-nums">
                      {formatPrice(st.totalSalesValue)}
                    </span>
                  </div>
                  <div className="border-r border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block">سود خالص</span>
                    <span
                      className={`text-[11px] font-black tabular-nums ${
                        st.isProfitable ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {formatPrice(st.netProfit)}
                    </span>
                  </div>
                </div>

                {/* Break-Even Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-500">
                      هدف سود سرمایه: ٪{toPersianDigits(product.targetMarginPercent)}
                    </span>
                    <span
                      className={`tabular-nums ${
                        st.isProfitable ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {st.isProfitable
                        ? `سودده · ROI ٪${toPersianDigits(st.roiPercent)}`
                        : st.breakEvenUnits > 0
                        ? `${toPersianDigits(st.totalUnitsSold)} از ${toPersianDigits(st.breakEvenUnits)} فروش تا سر‌به‌سر`
                        : `بازگشت سرمایه: ٪${toPersianDigits(st.breakEvenProgressPercent)}`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        st.isProfitable ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, st.breakEvenProgressPercent))}%` }}
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 tabular-nums">
                    <ShieldCheck
                      size={13}
                      className={st.activeSupportCount > 0 ? 'text-emerald-600' : 'text-slate-300'}
                    />
                    {toPersianDigits(st.activeSupportCount)} پشتیبانی فعال
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => openNewSaleModal(product.id, e)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      ثبت فروش
                    </button>
                    <span className="px-2.5 py-1.5 bg-slate-100 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white rounded-lg text-[11px] font-bold transition-colors">
                      پرونده محصول
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        editingProduct={editingProduct}
      />
      <ProductSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        lockedProductId={saleLockedProductId}
      />
      <OptionManagerModal
        mode="string"
        isOpen={isDomainManagerOpen}
        onClose={() => setIsDomainManagerOpen(false)}
        title="مدیریت زمینه‌ها و حوزه‌های محصولات"
        subtitle="افزودن، ویرایش یا حذف زمینه‌های موضوعی محصولات تولیدی"
        items={productDomains}
        onAdd={addProductDomain}
        onUpdate={updateProductDomain}
        onDelete={deleteProductDomain}
      />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
      />
    </div>
  );
};

export default Products;
