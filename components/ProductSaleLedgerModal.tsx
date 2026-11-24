import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  History,
  PlusCircle,
  ShoppingBag,
  ArrowUpCircle,
  RefreshCw,
  ArrowDownLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Trash2,
  Wallet,
  FileText
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { ProductSale, ProductSaleEvent } from '../types';
import {
  formatPrice,
  toPersianDigits,
  formatCardNumber,
  getTodayPersianDate,
  getNormalizedSaleEvents,
  getProductSupportStatus
} from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';
import ConfirmModal from './ConfirmModal';
import InvoicePreviewModal from './InvoicePreviewModal';

interface ProductSaleLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  initialTab?: 'history' | 'payment';
  onRequestUpgrade?: (sale: ProductSale) => void;
  onRequestRenew?: (sale: ProductSale) => void;
}

const PAYMENT_METHODS: Array<{ value: ProductSale['method']; label: string }> = [
  { value: 'شبا / پایا', label: 'حواله پایا / ساتنا (شبا)' },
  { value: 'کارت به کارت', label: 'کارت به کارت' },
  { value: 'درگاه آنلاین', label: 'درگاه پرداخت آنلاین' },
  { value: 'چک', label: 'چک صیادی' },
  { value: 'نقد', label: 'وجه نقد' }
];

const EVENT_STYLES: Record<
  ProductSaleEvent['type'],
  { label: string; badge: string; iconBg: string; icon: React.ComponentType<{ size?: number }> }
> = {
  purchase: {
    label: 'خرید اولیه',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-700',
    icon: ShoppingBag
  },
  upgrade: {
    label: 'ارتقای نسخه',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    iconBg: 'bg-cyan-100 text-cyan-700',
    icon: ArrowUpCircle
  },
  renewal: {
    label: 'تمدید پشتیبانی',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-100 text-purple-700',
    icon: RefreshCw
  },
  payment: {
    label: 'دریافت وجه / قسط',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
    icon: ArrowDownLeft
  }
};

const ProductSaleLedgerModal: React.FC<ProductSaleLedgerModalProps> = ({
  isOpen,
  onClose,
  saleId,
  initialTab = 'history',
  onRequestUpgrade,
  onRequestRenew
}) => {
  const {
    productSales,
    products,
    bankAccounts,
    recordProductSalePayment,
    deleteProductSaleEvent,
    buildInvoiceFromProductSale
  } = useData();

  const sale = saleId ? productSales.find((s) => s.id === saleId) || null : null;
  const product = sale ? products.find((p) => p.id === sale.productId) || null : null;

  const [activeTab, setActiveTab] = useState<'history' | 'payment'>(initialTab);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<ProductSale['method']>('شبا / پایا');
  const [bankAccountId, setBankAccountId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [date, setDate] = useState(getTodayPersianDate());
  const [notes, setNotes] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [deleteEventTarget, setDeleteEventTarget] = useState<ProductSaleEvent | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !sale) return;
    setActiveTab(initialTab);
    setAmount(sale.remainingAmount > 0 ? String(sale.remainingAmount) : '');
    setMethod(sale.method || 'شبا / پایا');
    const defaultBank = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    setBankAccountId(sale.bankAccountId || defaultBank?.id || '');
    setTrackingCode('');
    setDate(getTodayPersianDate());
    setNotes('');
    setSavedToast(false);
  }, [isOpen, sale?.id, initialTab]);

  // Keep payment input synced after recording a payment if balance changes
  useEffect(() => {
    if (!isOpen || !sale) return;
    if (Number(amount) > sale.remainingAmount) {
      setAmount(sale.remainingAmount > 0 ? String(sale.remainingAmount) : '');
    }
  }, [sale?.remainingAmount]);

  if (!isOpen || !sale) return null;

  const events = [...getNormalizedSaleEvents(sale)].sort(
    (a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)
  );
  const paidPercent =
    sale.totalAmount > 0 ? Math.min(100, Math.round((sale.paidAmount / sale.totalAmount) * 100)) : 100;
  const supStatus = getProductSupportStatus(sale.hasSupport, sale.supportEndDate);
  const hasMultipleTiers = Boolean(product?.tiers && product.tiers.length > 1);

  const bankOptions = bankAccounts.map((b) => ({
    value: b.id,
    label: `${b.bankName} — ${b.accountHolder}`,
    sublabel: b.cardNumber ? `کارت: ${formatCardNumber(b.cardNumber)}` : b.iban || b.type
  }));

  const numericAmount = Math.max(0, Number(amount) || 0);
  const isOverLimit = numericAmount > sale.remainingAmount;

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sale.remainingAmount <= 0) return;
    const safeAmt = Math.min(sale.remainingAmount, numericAmount);
    if (safeAmt <= 0) return;

    recordProductSalePayment(
      sale.id,
      safeAmt,
      method,
      bankAccountId,
      trackingCode.trim() || undefined,
      date || getTodayPersianDate(),
      notes.trim() || undefined
    );

    const nextRem = Math.max(0, sale.remainingAmount - safeAmt);
    setAmount(nextRem > 0 ? String(nextRem) : '');
    setTrackingCode('');
    setNotes('');
    setSavedToast(true);
    setActiveTab('history');
    setTimeout(() => setSavedToast(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Wallet size={19} className="text-indigo-600 shrink-0" />
                پرونده مالی و مدیریت پرداخت
              </h3>
              {sale.tierName && (
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold">
                  {sale.tierName}
                </span>
              )}
              {sale.remainingAmount === 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold">
                  <CheckCircle2 size={11} /> تسویه کامل
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold tabular-nums">
                  بدهکار: {formatPrice(sale.remainingAmount)} تومان
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong className="text-slate-900">{sale.buyerName}</strong>
              {sale.buyerCompany && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{sale.buyerCompany}</span>
                </>
              )}
              <span className="text-slate-300">·</span>
              <span className="font-bold text-indigo-700">{sale.productName || product?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText size={13} />
              مشاهده فاکتور
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 4-KPI Financial Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 block">مبلغ کل پرونده</span>
              <div className="text-sm font-black text-slate-900 mt-1 tabular-nums">
                {formatPrice(sale.totalAmount)}{' '}
                <span className="text-[10px] font-bold text-slate-400">تومان</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[10px] font-bold text-emerald-700 block">جمع دریافتی نقد</span>
              <div className="text-sm font-black text-emerald-800 mt-1 tabular-nums">
                {formatPrice(sale.paidAmount)}{' '}
                <span className="text-[10px] font-bold text-emerald-500">تومان</span>
              </div>
            </div>
            <div
              className={`p-3 rounded-2xl border ${
                sale.remainingAmount > 0
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <span
                className={`text-[10px] font-bold block ${
                  sale.remainingAmount > 0 ? 'text-rose-700' : 'text-slate-500'
                }`}
              >
                مانده بدهی (طلب)
              </span>
              <div
                className={`text-sm font-black mt-1 tabular-nums ${
                  sale.remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {sale.remainingAmount > 0 ? `${formatPrice(sale.remainingAmount)} تومان` : '۰ (تسویه)'}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 block">وضعیت پشتیبانی</span>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-black">
                {supStatus === 'active' && (
                  <span className="text-emerald-700 inline-flex items-center gap-1">
                    <ShieldCheck size={13} /> تا {toPersianDigits(sale.supportEndDate)}
                  </span>
                )}
                {supStatus === 'expiring' && (
                  <span className="text-amber-700 inline-flex items-center gap-1">
                    <ShieldAlert size={13} /> تا {toPersianDigits(sale.supportEndDate)}
                  </span>
                )}
                {supStatus === 'expired' && (
                  <span className="text-slate-500 inline-flex items-center gap-1">
                    <ShieldOff size={13} /> پایان دوره
                  </span>
                )}
                {supStatus === 'none' && <span className="text-slate-400">ندارد</span>}
              </div>
            </div>
          </div>

          {/* Collection Progress + Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600">درصد وصول کل پرونده</span>
                <span className="text-indigo-700 tabular-nums">٪{toPersianDigits(paidPercent)}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    paidPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>

            {(onRequestUpgrade || onRequestRenew) && (
              <div className="flex items-center gap-1.5 shrink-0">
                {onRequestUpgrade &&
                  hasMultipleTiers &&
                  sale.saleType !== 'تمدید پشتیبانی' &&
                  sale.saleType !== 'ارتقای نسخه' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRequestUpgrade(sale);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <ArrowUpCircle size={13} />
                      ارتقای نسخه
                    </button>
                  )}
                {onRequestRenew &&
                  sale.saleType !== 'تمدید پشتیبانی' &&
                  sale.saleType !== 'ارتقای نسخه' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRequestRenew(sale);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      تمدید پشتیبانی
                    </button>
                  )}
              </div>
            )}
          </div>

          {savedToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              پرداخت جدید با موفقیت در پرونده خریدار و دفتر مالی کل ثبت شد.
            </div>
          )}

          {/* Tabs Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={15} />
              تاریخچه اتفاقات و پرداخت‌ها ({toPersianDigits(events.length)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'payment'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle size={15} />
              ثبت پرداخت جدید
              {sale.remainingAmount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black">
                  بدهکار
                </span>
              )}
            </button>
          </div>

          {/* TAB A: Full Activity & Payments Timeline */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {events.map((evt) => {
                const style = EVENT_STYLES[evt.type] || EVENT_STYLES.purchase;
                const Icon = style.icon;
                const unpaidOnEvent = Math.max(0, (evt.amountDelta || 0) - (evt.paidAmount || 0));

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}
                        >
                          <Icon size={17} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.badge}`}
                            >
                              {style.label}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                              {toPersianDigits(evt.date)}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">{evt.title}</h4>
                        </div>
                      </div>

                      {evt.type === 'payment' && (
                        <button
                          type="button"
                          onClick={() => setDeleteEventTarget(evt)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="حذف این واریزی"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Financial Numbers Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] tabular-nums">
                      {evt.amountDelta > 0 && (
                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700">
                          افزایش مبلغ فاکتور: +{formatPrice(evt.amountDelta)} تومان
                        </span>
                      )}
                      {evt.paidAmount > 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg font-black text-emerald-700">
                          واریزی نقد: +{formatPrice(evt.paidAmount)} تومان
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg font-bold text-amber-800">
                          بدون واریز نقد در این تاریخ (ثبت به عنوان بدهی)
                        </span>
                      )}
                      {unpaidOnEvent > 0 && evt.paidAmount > 0 && (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg font-bold text-rose-700">
                          باقی‌مانده این مرحله: {formatPrice(unpaidOnEvent)} تومان
                        </span>
                      )}
                    </div>

                    {/* Bank / Method / Tracking / Notes */}
                    {(evt.method || evt.bankAccountLabel || evt.trackingCode || evt.notes) && (
                      <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {evt.paidAmount > 0 && evt.method && (
                            <span>
                              روش: <strong className="text-slate-700">{evt.method}</strong>
                            </span>
                          )}
                          {evt.paidAmount > 0 && evt.bankAccountLabel && (
                            <span>
                              حساب مقصد:{' '}
                              <strong className="text-slate-700">
                                {toPersianDigits(evt.bankAccountLabel)}
                              </strong>
                            </span>
                          )}
                          {evt.trackingCode && (
                            <span className="tabular-nums">
                              کد رهگیری:{' '}
                              <strong dir="ltr" className="text-slate-700">
                                {toPersianDigits(evt.trackingCode)}
                              </strong>
                            </span>
                          )}
                        </div>
                        {evt.notes && <p className="text-slate-600 leading-relaxed">{evt.notes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB B: Record New Payment */}
          {activeTab === 'payment' && (
            <>
              {sale.remainingAmount <= 0 ? (
                <div className="p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2.5">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                  <h4 className="text-sm font-black text-emerald-900">
                    این پرونده به صورت کامل تسویه شده است
                  </h4>
                  <p className="text-xs text-emerald-700">
                    مبلغ کل پرونده ({formatPrice(sale.totalAmount)} تومان) به طور کامل دریافت شده و هیچ
                    مانده بدهی وجود ندارد.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100/60 cursor-pointer"
                  >
                    <History size={14} /> مشاهده ریز تاریخچه پرداخت‌ها
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700">مبلغ واریزی جدید *</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAmount(String(Math.round(sale.remainingAmount * 0.25)))}
                          className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                        >
                          ۲۵٪
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount(String(Math.round(sale.remainingAmount * 0.5)))}
                          className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                        >
                          ۵۰٪
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount(String(sale.remainingAmount))}
                          className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md cursor-pointer"
                        >
                          تسویه کامل ({formatPrice(sale.remainingAmount)})
                        </button>
                      </div>
                    </div>
                    <FormattedNumberInput
                      required
                      value={amount}
                      max={sale.remainingAmount}
                      onChange={setAmount}
                      placeholder="مبلغ دریافتی را وارد کنید"
                      suffix="تومان"
                    />
                    {isOverLimit && (
                      <p className="text-[11px] font-bold text-rose-600">
                        مبلغ وارد شده نمی‌تواند از مانده بدهی ({formatPrice(sale.remainingAmount)} تومان)
                        بیشتر باشد.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">روش پرداخت</label>
                      <CustomSelect
                        value={method}
                        onChange={(v) => setMethod(v as ProductSale['method'])}
                        options={PAYMENT_METHODS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">تاریخ واریز (شمسی)</label>
                      <DatePicker
                        calendar={persian}
                        locale={persian_fa}
                        value={date}
                        onChange={(d) => setDate(d?.format?.('YYYY/MM/DD') || '')}
                        inputClass="rmdp-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <CreditCard size={13} className="text-indigo-600" /> کارت / حساب بانکی مقصد
                    </label>
                    <CustomSelect value={bankAccountId} onChange={setBankAccountId} options={bankOptions} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">کد رهگیری (اختیاری)</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        placeholder="TRX-..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">توضیحات (اختیاری)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="مثلاً: تسویه مابه‌التفاوت ارتقا..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Live Balance Preview */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                    <span className="font-bold text-slate-600">مانده بدهی پس از ثبت این پرداخت:</span>
                    <span
                      className={`font-black ${
                        Math.max(0, sale.remainingAmount - Math.min(sale.remainingAmount, numericAmount)) === 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {Math.max(0, sale.remainingAmount - Math.min(sale.remainingAmount, numericAmount)) === 0
                        ? '۰ تومان (تسویه کامل)'
                        : `${formatPrice(
                            Math.max(0, sale.remainingAmount - Math.min(sale.remainingAmount, numericAmount))
                          )} تومان`}
                    </span>
                  </div>

                  <div className="pt-1 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      بازگشت به تاریخچه
                    </button>
                    <button
                      type="submit"
                      disabled={numericAmount <= 0 || isOverLimit}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      ثبت پرداخت در پرونده
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm delete a single payment event */}
      <ConfirmModal
        isOpen={Boolean(deleteEventTarget)}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={() => {
          if (deleteEventTarget) {
            deleteProductSaleEvent(sale.id, deleteEventTarget.id);
          }
          setDeleteEventTarget(null);
        }}
        title="حذف واریزی ثبت‌شده"
        message={`آیا از حذف واریزی به مبلغ ${formatPrice(deleteEventTarget?.paidAmount || 0)} تومان مطمئن هستید؟ این مبلغ دوباره به مانده بدهی خریدار اضافه خواهد شد.`}
        confirmText="بله، حذف شود"
        variant="danger"
      />

      {/* Instant Invoice Preview for this Product Sale */}
      <InvoicePreviewModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={isInvoiceOpen ? buildInvoiceFromProductSale(sale.id) : null}
      />
    </div>
  );
};

export default ProductSaleLedgerModal;
