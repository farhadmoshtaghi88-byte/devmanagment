import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Copy,
  Check,
  Search,
  Building2,
  Briefcase,
  Package,
  Eye,
  Edit3,
  CopyPlus,
  Upload,
  RotateCcw,
  Save,
  X,
  SlidersHorizontal
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import {
  Invoice,
  InvoiceDocumentType,
  InvoiceItem,
  InvoiceSellerProfile,
  InvoiceStatus,
  InvoiceTheme
} from '../types';
import {
  formatPrice,
  toPersianDigits,
  formatCardNumber,
  getTodayPersianDate,
  SHAYEGAN_DEFAULT_LOGO_URL
} from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';
import ConfirmModal from './ConfirmModal';
import InvoiceDocument from './InvoiceDocument';
import InvoicePreviewModal from './InvoicePreviewModal';

const DOC_TYPE_OPTIONS: Array<{ value: InvoiceDocumentType; label: string }> = [
  { value: 'فاکتور فروش', label: 'فاکتور فروش' },
  { value: 'پیش‌فاکتور', label: 'پیش‌فاکتور' },
  { value: 'صورت‌حساب رسمی', label: 'صورت‌حساب رسمی' }
];

const THEME_OPTIONS: Array<{ value: InvoiceTheme; label: string }> = [
  { value: 'shayegan', label: 'مدرن شایگان (فیروزه‌ای و ذغالی)' },
  { value: 'classic', label: 'رسمی کلاسیک (اداری و چاپی)' },
  { value: 'minimal', label: 'مینیمال مدرن' }
];

const STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string; dotColorClass: string }> = [
  { value: 'پرداخت‌شده', label: 'تسویه کامل (پرداخت‌شده)', dotColorClass: 'bg-emerald-500' },
  { value: 'پرداخت جزئی', label: 'پرداخت جزئی', dotColorClass: 'bg-amber-500' },
  { value: 'در انتظار پرداخت', label: 'در انتظار پرداخت', dotColorClass: 'bg-rose-500' },
  { value: 'پیش‌فاکتور', label: 'پیش‌فاکتور', dotColorClass: 'bg-slate-400' }
];

const createEmptyItem = (): InvoiceItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  description: '',
  quantity: 1,
  unit: 'عدد',
  unitPrice: 0,
  discount: 0
});

const generateNextInvoiceNumber = (existingCount: number): string => {
  const num = 1001 + existingCount;
  return `SH-1404-${num}`;
};

const Invoices: React.FC = () => {
  const {
    invoices,
    clients,
    projects,
    products,
    productSales,
    bankAccounts,
    invoiceSellerProfile,
    invoiceDraftForBuilder,
    setInvoiceDraftForBuilder,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceSellerProfile,
    buildInvoiceFromProject,
    buildInvoiceFromProductSale,
    getProjectStats
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'builder' | 'archive' | 'projects' | 'products'>(
    'builder'
  );

  // Archive / Lists search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<string>('all');

  // Preview Modal target (for Archive, Projects, Products tabs)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Delete confirmation
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Brand / Seller Settings Modal
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [sellerForm, setSellerForm] = useState<InvoiceSellerProfile>(invoiceSellerProfile);

  // Builder state
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(() => generateNextInvoiceNumber(invoices.length));
  const [documentType, setDocumentType] = useState<InvoiceDocumentType>('فاکتور فروش');
  const [theme, setTheme] = useState<InvoiceTheme>('shayegan');
  const [status, setStatus] = useState<InvoiceStatus>('در انتظار پرداخت');
  const [sourceType, setSourceType] = useState<Invoice['sourceType']>('custom');
  const [sourceId, setSourceId] = useState<string | undefined>(undefined);
  const [sourceTitle, setSourceTitle] = useState<string | undefined>(undefined);
  const [issueDate, setIssueDate] = useState(getTodayPersianDate());
  const [dueDate, setDueDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerNationalId, setBuyerNationalId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-init-1',
      title: 'طراحی و پیاده‌سازی سامانه اختصاصی',
      description: 'تحلیل، طراحی رابط کاربری، پیاده‌سازی و راه‌اندازی نسخه نهایی',
      quantity: 1,
      unit: 'پروژه',
      unitPrice: 0,
      discount: 0
    }
  ]);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [taxRate, setTaxRate] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>(
    invoiceSellerProfile.defaultBankAccountId ||
      bankAccounts.find((b) => b.isDefault)?.id ||
      bankAccounts[0]?.id ||
      ''
  );
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(invoiceSellerProfile.defaultTerms);

  const [builderFeedback, setBuilderFeedback] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const loadInvoiceIntoBuilder = (inv: Invoice, asSavedRecord: boolean) => {
    setEditingSavedId(asSavedRecord ? inv.id : null);
    setInvoiceNumber(inv.invoiceNumber);
    setDocumentType(inv.documentType);
    setTheme(inv.theme || 'shayegan');
    setStatus(inv.status);
    setSourceType(inv.sourceType);
    setSourceId(inv.sourceId);
    setSourceTitle(inv.sourceTitle);
    setIssueDate(inv.issueDate || getTodayPersianDate());
    setDueDate(inv.dueDate || '');
    setSelectedClientId(inv.clientId || '');
    setBuyerName(inv.buyerName || '');
    setBuyerCompany(inv.buyerCompany || '');
    setBuyerPhone(inv.buyerPhone || '');
    setBuyerEmail(inv.buyerEmail || '');
    setBuyerAddress(inv.buyerAddress || '');
    setBuyerNationalId(inv.buyerNationalId || '');
    setItems(inv.items.length > 0 ? inv.items.map((it) => ({ ...it })) : [createEmptyItem()]);
    setDiscountType(inv.discountType || 'amount');
    setDiscountValue(inv.discountValue ? String(inv.discountValue) : '');
    setTaxRate(inv.taxRate ? String(inv.taxRate) : '0');
    setPaidAmount(inv.paidAmount ? String(inv.paidAmount) : '');
    setBankAccountId(
      inv.bankAccountId ||
        invoiceSellerProfile.defaultBankAccountId ||
        bankAccounts.find((b) => b.isDefault)?.id ||
        bankAccounts[0]?.id ||
        ''
    );
    setNotes(inv.notes || '');
    setTerms(inv.terms || invoiceSellerProfile.defaultTerms);
    setActiveSubTab('builder');
  };

  // Pick up incoming draft when navigating from a Project or Product Sale
  useEffect(() => {
    if (invoiceDraftForBuilder) {
      const existsInArchive = invoices.some((i) => i.id === invoiceDraftForBuilder.id);
      loadInvoiceIntoBuilder(invoiceDraftForBuilder, existsInArchive);
      setInvoiceDraftForBuilder(null);
    }
  }, [invoiceDraftForBuilder]);

  const resetBuilderToNew = () => {
    setEditingSavedId(null);
    setInvoiceNumber(generateNextInvoiceNumber(invoices.length));
    setDocumentType('فاکتور فروش');
    setTheme('shayegan');
    setStatus('در انتظار پرداخت');
    setSourceType('custom');
    setSourceId(undefined);
    setSourceTitle(undefined);
    setIssueDate(getTodayPersianDate());
    setDueDate('');
    setSelectedClientId('');
    setBuyerName('');
    setBuyerCompany('');
    setBuyerPhone('');
    setBuyerEmail('');
    setBuyerAddress('');
    setBuyerNationalId('');
    setItems([createEmptyItem()]);
    setDiscountType('amount');
    setDiscountValue('');
    setTaxRate('0');
    setPaidAmount('');
    setBankAccountId(
      invoiceSellerProfile.defaultBankAccountId ||
        bankAccounts.find((b) => b.isDefault)?.id ||
        bankAccounts[0]?.id ||
        ''
    );
    setNotes('');
    setTerms(invoiceSellerProfile.defaultTerms);
  };

  // Live financial math for builder
  const computedTotals = useMemo(() => {
    const subtotalAfterLineDiscounts = items.reduce((sum, it) => {
      const gross = Math.max(0, (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0));
      const disc = Math.max(0, Number(it.discount) || 0);
      return sum + Math.max(0, gross - disc);
    }, 0);

    const rawDisc = Math.max(0, Number(discountValue) || 0);
    const discountAmount =
      discountType === 'percent'
        ? Math.round((subtotalAfterLineDiscounts * Math.min(100, rawDisc)) / 100)
        : Math.min(subtotalAfterLineDiscounts, rawDisc);

    const afterDiscount = Math.max(0, subtotalAfterLineDiscounts - discountAmount);
    const taxRateNum = Math.max(0, Math.min(100, Number(taxRate) || 0));
    const taxAmount = Math.round((afterDiscount * taxRateNum) / 100);
    const totalAmount = afterDiscount + taxAmount;
    const paidNum = Math.max(0, Number(paidAmount) || 0);
    const remainingAmount = Math.max(0, totalAmount - paidNum);

    return {
      subtotal: subtotalAfterLineDiscounts,
      discountAmount,
      taxRateNum,
      taxAmount,
      totalAmount,
      paidNum,
      remainingAmount
    };
  }, [items, discountType, discountValue, taxRate, paidAmount]);

  const liveDraftInvoice: Invoice = useMemo(
    () => ({
      id: editingSavedId || 'live-draft',
      invoiceNumber: invoiceNumber || generateNextInvoiceNumber(invoices.length),
      documentType,
      theme,
      status,
      sourceType,
      sourceId,
      sourceTitle,
      issueDate: issueDate || getTodayPersianDate(),
      dueDate: dueDate || undefined,
      clientId: selectedClientId || undefined,
      buyerName: buyerName || 'خریدار / کارفرمای محترم',
      buyerCompany: buyerCompany || undefined,
      buyerPhone: buyerPhone || undefined,
      buyerEmail: buyerEmail || undefined,
      buyerAddress: buyerAddress || undefined,
      buyerNationalId: buyerNationalId || undefined,
      items,
      discountType,
      discountValue: Number(discountValue) || 0,
      discountAmount: computedTotals.discountAmount,
      taxRate: computedTotals.taxRateNum,
      taxAmount: computedTotals.taxAmount,
      subtotal: computedTotals.subtotal,
      totalAmount: computedTotals.totalAmount,
      paidAmount: computedTotals.paidNum,
      remainingAmount: computedTotals.remainingAmount,
      bankAccountId: bankAccountId || undefined,
      notes: notes || undefined,
      terms: terms || undefined,
      createdTimestamp: Date.now()
    }),
    [
      editingSavedId,
      invoiceNumber,
      invoices.length,
      documentType,
      theme,
      status,
      sourceType,
      sourceId,
      sourceTitle,
      issueDate,
      dueDate,
      selectedClientId,
      buyerName,
      buyerCompany,
      buyerPhone,
      buyerEmail,
      buyerAddress,
      buyerNationalId,
      items,
      discountType,
      discountValue,
      computedTotals,
      bankAccountId,
      notes,
      terms
    ]
  );

  const selectedBank =
    bankAccounts.find((b) => b.id === bankAccountId) ||
    bankAccounts.find((b) => b.isDefault) ||
    bankAccounts[0];

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setBuyerName(client.name);
      setBuyerCompany(client.company || '');
      setBuyerPhone(client.phone || '');
      setBuyerEmail(client.email || '');
      setBuyerAddress(client.address || '');
    }
  };

  const handleImportFromProject = (projectId: string) => {
    if (!projectId) return;
    const built = buildInvoiceFromProject(projectId);
    if (built) {
      loadInvoiceIntoBuilder(built, false);
      setBuilderFeedback(`اطلاعات پروژه «${built.sourceTitle}» با تخفیف و مالیات فراخوانی شد.`);
      setTimeout(() => setBuilderFeedback(null), 3000);
    }
  };

  const handleImportFromProductSale = (saleId: string) => {
    if (!saleId) return;
    const built = buildInvoiceFromProductSale(saleId);
    if (built) {
      loadInvoiceIntoBuilder(built, false);
      setBuilderFeedback(`اطلاعات فروش «${built.sourceTitle}» با تمام ردیف‌ها فراخوانی شد.`);
      setTimeout(() => setBuilderFeedback(null), 3000);
    }
  };

  const handleSaveBuilderInvoice = () => {
    const { id: _ignoreId, ...payload } = liveDraftInvoice;
    if (editingSavedId) {
      updateInvoice(editingSavedId, payload);
      setBuilderFeedback('تغییرات فاکتور در بایگانی ذخیره شد.');
    } else {
      const created = addInvoice(payload);
      setEditingSavedId(created.id);
      setBuilderFeedback(`فاکتور شماره ${toPersianDigits(created.invoiceNumber)} در بایگانی ثبت شد.`);
    }
    setTimeout(() => setBuilderFeedback(null), 3000);
  };

  const handleCopyBuilderSummary = async () => {
    const inv = liveDraftInvoice;
    const lines = [
      `${inv.documentType} — ${invoiceSellerProfile.companyName}`,
      `شماره سند: ${toPersianDigits(inv.invoiceNumber)}`,
      `تاریخ: ${toPersianDigits(inv.issueDate)}`,
      `خریدار: ${inv.buyerName}${inv.buyerCompany ? ` (${inv.buyerCompany})` : ''}`,
      '---',
      ...inv.items
        .filter((it) => it.title.trim())
        .map(
          (it, idx) =>
            `${toPersianDigits(idx + 1)}. ${it.title}: ${formatPrice(
              Math.max(0, it.quantity * it.unitPrice - (it.discount || 0))
            )} تومان`
        ),
      '---',
      ...(inv.discountAmount > 0 ? [`تخفیف: ${formatPrice(inv.discountAmount)}- تومان`] : []),
      ...(inv.taxAmount > 0
        ? [`مالیات (${toPersianDigits(inv.taxRate)}٪): ${formatPrice(inv.taxAmount)}+ تومان`]
        : []),
      `مبلغ کل قابل پرداخت: ${formatPrice(inv.totalAmount)} تومان`,
      ...(inv.paidAmount > 0
        ? [
            `پرداخت‌شده: ${formatPrice(inv.paidAmount)} تومان`,
            `مانده قابل پرداخت: ${formatPrice(inv.remainingAmount)} تومان`
          ]
        : []),
      ...(selectedBank
        ? [
            '---',
            `حساب واریز: ${selectedBank.bankName} (${selectedBank.accountHolder})`,
            ...(selectedBank.cardNumber ? [`کارت: ${formatCardNumber(selectedBank.cardNumber)}`] : []),
            ...(selectedBank.iban ? [`شبا: ${selectedBank.iban}`] : [])
          ]
        : [])
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      // ignore clipboard restriction
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSellerForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSellerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceSellerProfile(sellerForm);
    setIsSellerModalOpen(false);
  };

  // Filtered lists for tabs
  const filteredArchive = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesStatus = archiveStatusFilter === 'all' || inv.status === archiveStatusFilter;
      const matchesQuery =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.buyerName.toLowerCase().includes(q) ||
        (inv.buyerCompany || '').toLowerCase().includes(q) ||
        (inv.sourceTitle || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [invoices, searchQuery, archiveStatusFilter]);

  const filteredProjectsList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          (p.clientName || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
      )
      .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
  }, [projects, searchQuery]);

  const filteredProductSalesList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return productSales
      .filter((s) => {
        const prod = products.find((p) => p.id === s.productId);
        return (
          !q ||
          s.buyerName.toLowerCase().includes(q) ||
          (s.buyerCompany || '').toLowerCase().includes(q) ||
          (prod?.name || s.productName || '').toLowerCase().includes(q) ||
          (s.tierName || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
  }, [productSales, products, searchQuery]);

  const clientSelectOptions = [
    { value: '', label: 'ورود دستی مشخصات خریدار' },
    ...clients.map((c) => ({ value: c.id, label: `${c.name} (${c.company})` }))
  ];

  const projectImportOptions = [
    { value: '', label: 'انتخاب پروژه برای صدور فاکتور...' },
    ...projects.map((p) => ({
      value: p.id,
      label: `${p.title} — ${p.clientName || 'کارفرما'}`
    }))
  ];

  const productSaleImportOptions = [
    { value: '', label: 'انتخاب فروش محصول برای صدور فاکتور...' },
    ...productSales.map((s) => {
      const prod = products.find((p) => p.id === s.productId);
      return {
        value: s.id,
        label: `${s.buyerName} — ${prod?.name || s.productName || 'محصول'}${s.tierName ? ` (${s.tierName})` : ''}`
      };
    })
  ];

  const bankSelectOptions = bankAccounts.map((b) => ({
    value: b.id,
    label: `${b.bankName} — ${b.accountHolder}`
  }));

  return (
    <div className="space-y-6 pb-10 font-['Vazirmatn']">
      {/* Clean Top Workspace Header */}
      <div className="no-print bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              سیستم فاکتور ساز و مدیریت صورت‌حساب‌ها
            </h2>
            <p className="text-xs text-slate-500">
              صدور فاکتور رسمی و پیش‌فاکتور با برند {invoiceSellerProfile.companyName}، خروجی چاپ و PDF و
              دسترسی مستقیم به فاکتور تمامی پروژه‌ها و فروش محصولات
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSellerForm(invoiceSellerProfile);
                setIsSellerModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal size={14} />
              تنظیمات برند و لوگو
            </button>
            <button
              type="button"
              onClick={() => {
                resetBuilderToNew();
                setActiveSubTab('builder');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} />
              فاکتور جدید
            </button>
          </div>
        </div>

        {/* Sub-Navigation Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {[
            { id: 'builder', label: 'فاکتور ساز زنده', icon: Edit3 },
            {
              id: 'archive',
              label: `بایگانی فاکتورها (${toPersianDigits(invoices.length)})`,
              icon: FileText
            },
            {
              id: 'projects',
              label: `فاکتور پروژه‌ها (${toPersianDigits(projects.length)})`,
              icon: Briefcase
            },
            {
              id: 'products',
              label: `فاکتور فروش محصولات (${toPersianDigits(productSales.length)})`,
              icon: Package
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setSearchQuery('');
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: LIVE INVOICE BUILDER + REAL-TIME A4 BRANDED PREVIEW          */}
      {/* =================================================================== */}
      {activeSubTab === 'builder' && (
        <div className="space-y-4">
          {/* Quick Import Strip */}
          <div className="no-print bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <span className="text-xs font-black text-slate-700 whitespace-nowrap shrink-0">
              فراخوانی خودکار از سیستم:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <CustomSelect
                value=""
                onChange={handleImportFromProject}
                options={projectImportOptions}
                searchable
                placeholder="انتخاب پروژه..."
              />
              <CustomSelect
                value=""
                onChange={handleImportFromProductSale}
                options={productSaleImportOptions}
                searchable
                placeholder="انتخاب فروش محصول..."
              />
            </div>
            {builderFeedback && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl whitespace-nowrap">
                {builderFeedback}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* RIGHT COLUMN: Structured Editor (Hidden on Print) */}
            <div className="no-print xl:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-5">
              {/* Document Meta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">مشخصات سند و قالب نمایش</h3>
                  {editingSavedId && (
                    <span className="text-[11px] font-bold text-amber-700">
                      در حال ویرایش فاکتور ذخیره‌شده
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">نوع سند</label>
                    <CustomSelect
                      value={documentType}
                      onChange={(v) => setDocumentType(v as InvoiceDocumentType)}
                      options={DOC_TYPE_OPTIONS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">قالب طراحی فاکتور</label>
                    <CustomSelect
                      value={theme}
                      onChange={(v) => setTheme(v as InvoiceTheme)}
                      options={THEME_OPTIONS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">شماره فاکتور</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">تاریخ صدور</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={issueDate}
                      onChange={(d) => setIssueDate(d?.format?.('YYYY/MM/DD') || '')}
                      inputClass="rmdp-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">سررسید / اعتبار</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={dueDate}
                      onChange={(d) => setDueDate(d?.format?.('YYYY/MM/DD') || '')}
                      inputClass="rmdp-input"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">وضعیت تسویه سند</label>
                  <CustomSelect
                    value={status}
                    onChange={(v) => setStatus(v as InvoiceStatus)}
                    options={STATUS_OPTIONS}
                  />
                </div>
              </div>

              {/* Buyer Info */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-900">مشخصات خریدار / کارفرما</h3>
                <CustomSelect
                  value={selectedClientId}
                  onChange={handleSelectClient}
                  options={clientSelectOptions}
                  searchable
                  placeholder="انتخاب از مشتریان ثبت‌شده یا ورود دستی..."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="نام خریدار / نماینده *"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="نام شرکت / سازمان"
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="شماره تماس"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="شناسه ملی / کد ملی (اختیاری)"
                    value={buyerNationalId}
                    onChange={(e) => setBuyerNationalId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="نشانی خریدار (اختیاری)"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Line Items Editor */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">
                    اقلام و خدمات فاکتور ({toPersianDigits(items.length)})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => [...prev, createEmptyItem()])}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    <Plus size={13} /> افزودن ردیف
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-slate-500">
                          ردیف {toPersianDigits(idx + 1)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItems((prev) => prev.filter((it) => it.id !== item.id))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="حذف ردیف"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="شرح کالا یا خدمت *"
                        value={item.title}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((it) =>
                              it.id === item.id ? { ...it, title: e.target.value } : it
                            )
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="توضیحات تکمیلی ردیف (اختیاری)"
                        value={item.description || ''}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((it) =>
                              it.id === item.id ? { ...it, description: e.target.value } : it
                            )
                          )
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-indigo-500"
                      />

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">تعداد</label>
                          <FormattedNumberInput
                            value={String(item.quantity)}
                            onChange={(val) =>
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? { ...it, quantity: Math.max(1, Number(val) || 1) }
                                    : it
                                )
                              )
                            }
                            className="bg-white"
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">واحد</label>
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, unit: e.target.value } : it
                                )
                              )
                            }
                            placeholder="عدد"
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="col-span-6 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">
                            مبلغ واحد (تومان)
                          </label>
                          <FormattedNumberInput
                            value={item.unitPrice ? String(item.unitPrice) : ''}
                            onChange={(val) =>
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, unitPrice: Number(val) || 0 } : it
                                )
                              )
                            }
                            placeholder="۰"
                            className="bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">
                          تخفیف ردیف (اختیاری - تومان)
                        </label>
                        <FormattedNumberInput
                          value={item.discount ? String(item.discount) : ''}
                          onChange={(val) =>
                            setItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id ? { ...it, discount: Number(val) || 0 } : it
                              )
                            )
                          }
                          placeholder="۰"
                          suffix="تومان"
                          className="bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount, Tax, Paid, Bank */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-900">تخفیف کل، مالیات و پرداخت</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600">تخفیف کل (کسر می‌شود)</label>
                      <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('amount')}
                          className={`px-2 py-0.5 rounded-md cursor-pointer ${
                            discountType === 'amount'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          تومان
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percent')}
                          className={`px-2 py-0.5 rounded-md cursor-pointer ${
                            discountType === 'percent'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          درصد
                        </button>
                      </div>
                    </div>
                    <FormattedNumberInput
                      value={discountValue}
                      max={discountType === 'percent' ? 100 : undefined}
                      onChange={setDiscountValue}
                      placeholder="۰"
                      suffix={discountType === 'percent' ? '٪' : 'تومان'}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600">
                        مالیات بر ارزش افزوده (اضافه می‌شود)
                      </label>
                      <div className="flex items-center gap-1">
                        {['0', '9', '10'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setTaxRate(preset)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              taxRate === preset
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {toPersianDigits(preset)}٪
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormattedNumberInput
                      value={taxRate}
                      max={100}
                      onChange={setTaxRate}
                      placeholder="۰"
                      suffix="٪"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">مبلغ پرداخت‌شده تاکنون</label>
                    <FormattedNumberInput
                      value={paidAmount}
                      onChange={(val) => {
                        setPaidAmount(val);
                        const num = Number(val) || 0;
                        if (num >= computedTotals.totalAmount && computedTotals.totalAmount > 0) {
                          setStatus('پرداخت‌شده');
                        } else if (num > 0) {
                          setStatus('پرداخت جزئی');
                        }
                      }}
                      placeholder="۰"
                      suffix="تومان"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">حساب بانکی درج‌شده در فاکتور</label>
                    <CustomSelect
                      value={bankAccountId}
                      onChange={setBankAccountId}
                      options={bankSelectOptions}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">یادداشت اختصاصی فاکتور</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="توضیحات اختیاری برای این مشتری..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">شرایط و ضوابط پایین فاکتور</label>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] leading-relaxed outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Save / Print / Copy Controls */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveBuilderInvoice}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Save size={14} />
                  {editingSavedId ? 'ذخیره تغییرات فاکتور' : 'ذخیره در بایگانی'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Printer size={14} />
                  چاپ / دانلود PDF
                </button>
                <button
                  type="button"
                  onClick={handleCopyBuilderSummary}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {copiedSummary ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedSummary ? 'متن فاکتور برای واتساپ کپی شد' : 'کپی متن خلاصه فاکتور برای واتساپ / تلگرام'}
                </button>
              </div>
            </div>

            {/* LEFT COLUMN: Live Branded A4 Preview (Printable Target!) */}
            <div className="xl:col-span-7 space-y-3">
              <div className="no-print flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-700">
                  پیش‌نمایش زنده قالب چاپی A4
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  خروجی دقیقاً مشابه همین صفحه چاپ یا PDF می‌شود
                </span>
              </div>
              <InvoiceDocument
                invoice={liveDraftInvoice}
                seller={invoiceSellerProfile}
                bankAccount={selectedBank}
                printable={!previewInvoice}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: SAVED INVOICES ARCHIVE                                       */}
      {/* =================================================================== */}
      {activeSubTab === 'archive' && (
        <div className="no-print bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس شماره فاکتور، نام مشتری یا شرکت..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'پرداخت‌شده', 'پرداخت جزئی', 'در انتظار پرداخت', 'پیش‌فاکتور'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setArchiveStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    archiveStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'همه وضعیت‌ها' : st}
                </button>
              ))}
            </div>
          </div>

          {filteredArchive.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <FileText size={22} />
              </div>
              <div className="text-sm font-black text-slate-700">هنوز فاکتوری در بایگانی ذخیره نشده است</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                می‌توانید در تب «فاکتور ساز زنده» یک فاکتور جدید بسازید یا از تب‌های «فاکتور پروژه‌ها» و «فاکتور
                فروش محصولات» فاکتور هر قرارداد را مشاهده و در بایگانی ذخیره کنید.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetBuilderToNew();
                  setActiveSubTab('builder');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus size={14} /> ساخت اولین فاکتور
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500">
                    <th className="py-3.5 px-4">شماره / نوع سند</th>
                    <th className="py-3.5 px-4">خریدار / شرکت</th>
                    <th className="py-3.5 px-4">تاریخ صدور</th>
                    <th className="py-3.5 px-4">مبلغ کل</th>
                    <th className="py-3.5 px-4">وضعیت تسویه</th>
                    <th className="py-3.5 px-4 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredArchive.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div dir="ltr" className="font-black text-slate-900 tabular-nums text-right">
                          {toPersianDigits(inv.invoiceNumber)}
                        </div>
                        <div className="text-[11px] text-slate-500">{inv.documentType}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.buyerName}</div>
                        {inv.buyerCompany && (
                          <div className="text-[11px] text-slate-400">{inv.buyerCompany}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-600 tabular-nums whitespace-nowrap">
                        {toPersianDigits(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums whitespace-nowrap">
                        <div className="font-black text-slate-900">{formatPrice(inv.totalAmount)} تومان</div>
                        {inv.remainingAmount > 0 && (
                          <div className="text-[10.5px] font-bold text-rose-600">
                            مانده: {formatPrice(inv.remainingAmount)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            inv.status === 'پرداخت‌شده'
                              ? 'bg-emerald-50 text-emerald-700'
                              : inv.status === 'پرداخت جزئی'
                              ? 'bg-amber-50 text-amber-800'
                              : inv.status === 'پیش‌فاکتور'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <Eye size={13} /> مشاهده و چاپ
                          </button>
                          <button
                            type="button"
                            onClick={() => loadInvoiceIntoBuilder(inv, true)}
                            className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              loadInvoiceIntoBuilder(
                                {
                                  ...inv,
                                  invoiceNumber: generateNextInvoiceNumber(invoices.length),
                                  issueDate: getTodayPersianDate()
                                },
                                false
                              )
                            }
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-lg cursor-pointer"
                            title="کپی به عنوان فاکتور جدید"
                          >
                            <CopyPlus size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: AUTO INVOICES FOR ALL PROJECTS                               */}
      {/* =================================================================== */}
      {activeSubTab === 'projects' && (
        <div className="no-print bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">فاکتور خودکار تمامی پروژه‌ها و قراردادها</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مبلغ پایه، تخفیف، مالیات، واریزی‌ها و مانده هر پروژه به صورت خودکار در فاکتور رسمی درج می‌شود.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی پروژه یا کارفرما..."
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500">
                  <th className="py-3.5 px-4">عنوان پروژه / کارفرما</th>
                  <th className="py-3.5 px-4">تخفیف / مالیات</th>
                  <th className="py-3.5 px-4">مبلغ نهایی قرارداد</th>
                  <th className="py-3.5 px-4">دریافتی / مانده</th>
                  <th className="py-3.5 px-4 text-left">عملیات فاکتور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjectsList.map((proj) => {
                  const st = getProjectStats(proj.id);
                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{proj.title}</div>
                        <div className="text-[11px] text-slate-500">{proj.clientName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] tabular-nums">
                        {(proj.discountAmount || 0) > 0 || (proj.taxAmount || 0) > 0 ? (
                          <div className="space-y-0.5">
                            {(proj.discountAmount || 0) > 0 && (
                              <div className="font-bold text-rose-600">
                                تخفیف: {formatPrice(proj.discountAmount)}-
                              </div>
                            )}
                            {(proj.taxAmount || 0) > 0 && (
                              <div className="font-bold text-slate-700">
                                مالیات ({toPersianDigits(proj.taxRate || 0)}٪): +{formatPrice(proj.taxAmount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">بدون تخفیف و مالیات</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums whitespace-nowrap">
                        {formatPrice(proj.contractValue)} تومان
                      </td>
                      <td className="py-3.5 px-4 tabular-nums whitespace-nowrap">
                        <div className="font-bold text-emerald-700">
                          دریافتی: {formatPrice(st.totalPaid)}
                        </div>
                        {st.remainingBalance > 0 ? (
                          <div className="text-[11px] font-bold text-rose-600">
                            مانده: {formatPrice(st.remainingBalance)}
                          </div>
                        ) : (
                          <div className="text-[10.5px] font-bold text-emerald-600">تسویه کامل</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const built = buildInvoiceFromProject(proj.id);
                              if (built) setPreviewInvoice(built);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <Eye size={13} /> مشاهده و چاپ فاکتور
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImportFromProject(proj.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <Edit3 size={12} /> سفارشی‌سازی
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: AUTO INVOICES FOR ALL PRODUCT SALES                          */}
      {/* =================================================================== */}
      {activeSubTab === 'products' && (
        <div className="no-print bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">فاکتور خودکار تمامی فروش‌های محصولات</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                شامل خرید اولیه، ارتقای نسخه و تمدید پشتیبانی هر خریدار به صورت ردیف‌های تفکیک‌شده در فاکتور.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی خریدار یا نام محصول..."
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-500">
                  <th className="py-3.5 px-4">خریدار / شرکت</th>
                  <th className="py-3.5 px-4">محصول و نسخه</th>
                  <th className="py-3.5 px-4">تاریخ</th>
                  <th className="py-3.5 px-4">مبلغ کل پرونده</th>
                  <th className="py-3.5 px-4">دریافتی / مانده</th>
                  <th className="py-3.5 px-4 text-left">عملیات فاکتور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProductSalesList.map((sale) => {
                  const prod = products.find((p) => p.id === sale.productId);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sale.buyerName}</div>
                        {sale.buyerCompany && (
                          <div className="text-[11px] text-slate-400">{sale.buyerCompany}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{prod?.name || sale.productName}</div>
                        <div className="text-[11px] text-slate-500">
                          {sale.saleType}
                          {sale.tierName ? ` · ${sale.tierName}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-600 tabular-nums whitespace-nowrap">
                        {toPersianDigits(sale.date)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums whitespace-nowrap">
                        {formatPrice(sale.totalAmount)} تومان
                      </td>
                      <td className="py-3.5 px-4 tabular-nums whitespace-nowrap">
                        <div className="font-bold text-emerald-700">
                          دریافتی: {formatPrice(sale.paidAmount)}
                        </div>
                        {sale.remainingAmount > 0 ? (
                          <div className="text-[11px] font-bold text-rose-600">
                            مانده: {formatPrice(sale.remainingAmount)}
                          </div>
                        ) : (
                          <div className="text-[10.5px] font-bold text-emerald-600">تسویه کامل</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const built = buildInvoiceFromProductSale(sale.id);
                              if (built) setPreviewInvoice(built);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <Eye size={13} /> مشاهده و چاپ فاکتور
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImportFromProductSale(sale.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <Edit3 size={12} /> سفارشی‌سازی
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SELLER BRAND & LOGO SETTINGS MODAL */}
      {isSellerModalOpen && (
        <div className="no-print fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  تنظیمات برند، لوگو و مشخصات فروشنده در فاکتورها
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  این اطلاعات به‌صورت خودکار در سربرگ تمامی فاکتورهای شما نمایش داده می‌شود.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSellerModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSellerProfile} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Logo Preview & Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 h-16 flex items-center justify-center min-w-[140px]">
                    <img
                      src={sellerForm.logoUrl || SHAYEGAN_DEFAULT_LOGO_URL}
                      alt={sellerForm.companyName}
                      className="max-h-11 w-auto object-contain"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="font-black text-slate-800">لوگوی رسمی فاکتور</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      فرمت PNG یا SVG با پس‌زمینه شفاف یا سفید
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold cursor-pointer">
                    <Upload size={13} />
                    تغییر لوگو
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSellerForm((prev) => ({ ...prev, logoUrl: SHAYEGAN_DEFAULT_LOGO_URL }))
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-2 bg-slate-200/70 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    title="بازگردانی لوگوی اصلی شایگان"
                  >
                    <RotateCcw size={13} /> پیش‌فرض شایگان
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام شرکت / برند *</label>
                  <input
                    type="text"
                    required
                    value={sellerForm.companyName}
                    onChange={(e) => setSellerForm({ ...sellerForm, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">زیرعنوان تخصصی</label>
                  <input
                    type="text"
                    value={sellerForm.tagline}
                    onChange={(e) => setSellerForm({ ...sellerForm, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تلفن تماس</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ایمیل</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={sellerForm.email}
                    onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">وب‌سایت</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={sellerForm.website}
                    onChange={(e) => setSellerForm({ ...sellerForm, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">شناسه ملی</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={sellerForm.nationalId || ''}
                    onChange={(e) => setSellerForm({ ...sellerForm, nationalId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">کد اقتصادی</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={sellerForm.economicCode || ''}
                    onChange={(e) => setSellerForm({ ...sellerForm, economicCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نشانی دفتر</label>
                <input
                  type="text"
                  value={sellerForm.address}
                  onChange={(e) => setSellerForm({ ...sellerForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام امضاکننده / واحد مالی</label>
                  <input
                    type="text"
                    value={sellerForm.signerName}
                    onChange={(e) => setSellerForm({ ...sellerForm, signerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">حساب بانکی پیش‌فرض فاکتورها</label>
                  <CustomSelect
                    value={sellerForm.defaultBankAccountId || bankAccounts[0]?.id || ''}
                    onChange={(v) => setSellerForm({ ...sellerForm, defaultBankAccountId: v })}
                    options={bankSelectOptions}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">متن پیش‌فرض شرایط و توضیحات</label>
                <textarea
                  rows={3}
                  value={sellerForm.defaultTerms}
                  onChange={(e) => setSellerForm({ ...sellerForm, defaultTerms: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSellerModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  ذخیره تنظیمات برند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Invoice Preview Modal (for Archive, Projects, Products tabs) */}
      <InvoicePreviewModal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />

      {/* Delete Saved Invoice Confirmation */}
      <ConfirmModal
        isOpen={Boolean(invoiceToDelete)}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            if (editingSavedId === invoiceToDelete.id) {
              setEditingSavedId(null);
            }
            setInvoiceToDelete(null);
          }
        }}
        title="حذف فاکتور از بایگانی"
        message={
          invoiceToDelete
            ? `آیا از حذف فاکتور شماره «${toPersianDigits(invoiceToDelete.invoiceNumber)}» برای «${invoiceToDelete.buyerName}» مطمئن هستید؟`
            : ''
        }
        confirmText="بله، حذف شود"
        variant="danger"
      />
    </div>
  );
};

export default Invoices;
