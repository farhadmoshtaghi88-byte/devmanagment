import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CreditCard, ShieldCheck, Plus, UserCheck, Users } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { ProductSale } from '../types';
import {
  formatPrice,
  toPersianDigits,
  formatCardNumber,
  getTodayPersianDate,
  addMonthsToPersianDate
} from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';

interface ProductSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockedProductId?: string;
  lockedClientId?: string;
  onSaved?: (sale: ProductSale) => void;
}

const PAYMENT_METHODS: Array<{ value: ProductSale['method']; label: string }> = [
  { value: 'شبا / پایا', label: 'حواله پایا / ساتنا (شبا)' },
  { value: 'کارت به کارت', label: 'کارت به کارت' },
  { value: 'درگاه آنلاین', label: 'درگاه پرداخت آنلاین' },
  { value: 'چک', label: 'چک صیادی' },
  { value: 'نقد', label: 'وجه نقد' }
];

const SALE_TYPE_OPTIONS: Array<{ value: ProductSale['saleType']; label: string }> = [
  { value: 'یک‌باره', label: 'فروش یک‌باره (لایسنس دائمی)' },
  { value: 'اشتراک ماهانه', label: 'اشتراک ماهانه' },
  { value: 'اشتراک فصلی', label: 'اشتراک فصلی (۳ ماهه)' },
  { value: 'اشتراک سالانه', label: 'اشتراک سالانه' }
];

const ProductSaleModal: React.FC<ProductSaleModalProps> = ({
  isOpen,
  onClose,
  lockedProductId,
  lockedClientId,
  onSaved
}) => {
  const { products, clients, bankAccounts, addProductSale, addBankAccount } = useData();

  const [productId, setProductId] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [buyerMode, setBuyerMode] = useState<'client' | 'custom'>('client');
  const [clientId, setClientId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [saleType, setSaleType] = useState<ProductSale['saleType']>('یک‌باره');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [date, setDate] = useState(getTodayPersianDate());
  const [method, setMethod] = useState<ProductSale['method']>('شبا / پایا');
  const [bankAccountId, setBankAccountId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [hasSupport, setHasSupport] = useState(true);
  const [supportMonths, setSupportMonths] = useState('6');
  const [supportRenewalPrice, setSupportRenewalPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Quick inline bank creation
  const [showQuickBankForm, setShowQuickBankForm] = useState(false);
  const [quickBankName, setQuickBankName] = useState('');
  const [quickAccountHolder, setQuickAccountHolder] = useState('');
  const [quickCardNumber, setQuickCardNumber] = useState('');
  const [quickIban, setQuickIban] = useState('');

  const applyProductDefaults = (prodId: string, preferredType?: ProductSale['saleType']) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const tiers = prod.tiers && prod.tiers.length > 0 ? prod.tiers : [];
    const firstTier = tiers[0];
    setSelectedTierId(firstTier ? firstTier.id : '');

    const nextType: ProductSale['saleType'] =
      preferredType ||
      (firstTier
        ? 'یک‌باره'
        : prod.salesModel === 'subscription'
        ? prod.annualPrice
          ? 'اشتراک سالانه'
          : 'اشتراک ماهانه'
        : 'یک‌باره');
    setSaleType(nextType);

    let price = 0;
    if (firstTier && nextType === 'یک‌باره') {
      price = firstTier.price;
    } else if (nextType === 'یک‌باره') {
      price = prod.oneTimePrice || prod.annualPrice || prod.monthlyPrice || 0;
    } else if (nextType === 'اشتراک ماهانه') {
      price = prod.monthlyPrice || 0;
    } else if (nextType === 'اشتراک فصلی') {
      price = (prod.monthlyPrice || 0) * 3;
    } else if (nextType === 'اشتراک سالانه') {
      price = prod.annualPrice || (prod.monthlyPrice || 0) * 12;
    }

    setUnitPrice(price > 0 ? String(price) : '');
    setQuantity('1');
    setDiscount('');
    setPaidAmount(price > 0 ? String(price) : '');

    const tierSupportMonths = firstTier?.supportMonths ?? prod.defaultSupportMonths ?? 6;
    const tierRenewalPrice = firstTier?.supportRenewalPrice ?? prod.supportRenewalPrice ?? 0;
    const supportsEnabled = prod.supportPolicy !== 'none' && tierSupportMonths > 0;
    setHasSupport(supportsEnabled);
    setSupportMonths(supportsEnabled ? String(tierSupportMonths) : '0');
    setSupportRenewalPrice(tierRenewalPrice > 0 ? String(tierRenewalPrice) : '');
  };

  const handleSelectTier = (tierId: string) => {
    setSelectedTierId(tierId);
    const prod = products.find((p) => p.id === productId);
    const tier = prod?.tiers?.find((t) => t.id === tierId);
    if (!prod || !tier) return;

    setSaleType('یک‌باره');
    setUnitPrice(String(tier.price));
    const nextTotal = Math.max(0, (Math.max(1, Number(quantity) || 1) * tier.price) - (Number(discount) || 0));
    setPaidAmount(String(nextTotal));

    const months = tier.supportMonths ?? prod.defaultSupportMonths ?? 12;
    const renewal = tier.supportRenewalPrice ?? prod.supportRenewalPrice ?? 0;
    const supportsEnabled = prod.supportPolicy !== 'none' && months > 0;
    setHasSupport(supportsEnabled);
    setSupportMonths(supportsEnabled ? String(months) : '0');
    setSupportRenewalPrice(renewal > 0 ? String(renewal) : '');
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setShowQuickBankForm(false);
    setDate(getTodayPersianDate());
    setMethod('شبا / پایا');
    setTrackingCode('');
    setNotes('');

    const defaultBank = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    setBankAccountId(defaultBank?.id || '');

    if (lockedClientId) {
      setBuyerMode('client');
      setClientId(lockedClientId);
      setBuyerName('');
      setBuyerCompany('');
    } else {
      setBuyerMode(clients.length > 0 ? 'client' : 'custom');
      setClientId(clients[0]?.id || '');
      setBuyerName('');
      setBuyerCompany('');
    }

    const initialProdId = lockedProductId || products[0]?.id || '';
    setProductId(initialProdId);
    if (initialProdId) {
      applyProductDefaults(initialProdId);
    }
  }, [isOpen, lockedProductId, lockedClientId]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === productId);
  const lockedClient = lockedClientId ? clients.find((c) => c.id === lockedClientId) : undefined;
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);

  const numQty = Math.max(1, Number(quantity) || 1);
  const numUnitPrice = Number(unitPrice) || 0;
  const numDiscount = Math.min(numQty * numUnitPrice, Number(discount) || 0);
  const totalAmount = Math.max(0, numQty * numUnitPrice - numDiscount);
  const numPaid = Number(paidAmount) || 0;
  const remainingAmount = Math.max(0, totalAmount - numPaid);
  const isOverLimit = numPaid > totalAmount;

  const numSupportMonths = Math.max(0, Number(supportMonths) || 0);
  const computedSupportEndDate =
    hasSupport && numSupportMonths > 0 ? addMonthsToPersianDate(date, numSupportMonths) : undefined;

  const computedSubEndDate =
    saleType === 'اشتراک ماهانه'
      ? addMonthsToPersianDate(date, 1)
      : saleType === 'اشتراک فصلی'
      ? addMonthsToPersianDate(date, 3)
      : saleType === 'اشتراک سالانه'
      ? addMonthsToPersianDate(date, 12)
      : undefined;

  const handleProductChange = (nextId: string) => {
    setProductId(nextId);
    applyProductDefaults(nextId);
  };

  const handleSaleTypeChange = (nextType: ProductSale['saleType']) => {
    setSaleType(nextType);
    if (!selectedProduct) return;
    let price = 0;
    if (nextType === 'یک‌باره') price = selectedProduct.oneTimePrice || 0;
    else if (nextType === 'اشتراک ماهانه') price = selectedProduct.monthlyPrice || 0;
    else if (nextType === 'اشتراک فصلی') price = (selectedProduct.monthlyPrice || 0) * 3;
    else if (nextType === 'اشتراک سالانه')
      price = selectedProduct.annualPrice || (selectedProduct.monthlyPrice || 0) * 12;

    if (price > 0) {
      setUnitPrice(String(price));
      const nextTotal = Math.max(0, numQty * price - numDiscount);
      setPaidAmount(String(nextTotal));
    }
  };

  const handleQuickAddBank = () => {
    if (!quickBankName.trim() || !quickAccountHolder.trim()) return;
    const created = addBankAccount({
      bankName: quickBankName.trim(),
      accountHolder: quickAccountHolder.trim(),
      cardNumber: quickCardNumber.trim() || undefined,
      iban: quickIban.trim() || undefined,
      type: method === 'نقد' ? 'صندوق نقدی' : method === 'درگاه آنلاین' ? 'درگاه پرداخت' : 'کارت بانکی'
    });
    setBankAccountId(created.id);
    setQuickBankName('');
    setQuickAccountHolder('');
    setQuickCardNumber('');
    setQuickIban('');
    setShowQuickBankForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!productId) {
      setErrorMsg('لطفاً محصول مورد نظر را انتخاب کنید.');
      return;
    }
    if (buyerMode === 'client' && !clientId) {
      setErrorMsg('لطفاً مشتری خریدار را انتخاب کنید.');
      return;
    }
    if (buyerMode === 'custom' && !buyerName.trim()) {
      setErrorMsg('لطفاً نام خریدار را وارد کنید.');
      return;
    }
    if (totalAmount <= 0) {
      setErrorMsg('مبلغ کل فاکتور فروش باید بیشتر از صفر باشد.');
      return;
    }
    if (numPaid > totalAmount) {
      setErrorMsg(`مبلغ دریافتی نمی‌تواند بیشتر از مبلغ کل فروش (${formatPrice(totalAmount)} تومان) باشد.`);
      return;
    }
    if (numPaid > 0 && !bankAccountId) {
      setErrorMsg('لطفاً کارت یا حساب بانکی مقصد واریز را انتخاب کنید.');
      return;
    }

    const chosenClient = buyerMode === 'client' ? clients.find((c) => c.id === clientId) : undefined;
    const bankLabel = selectedBank
      ? `${selectedBank.bankName} - ${selectedBank.accountHolder}${
          selectedBank.cardNumber ? ` (${formatCardNumber(selectedBank.cardNumber)})` : ''
        }`
      : undefined;

    const chosenTier = selectedProduct?.tiers?.find((t) => t.id === selectedTierId);

    const createdSale = addProductSale({
      productId,
      productName: selectedProduct?.name,
      clientId: chosenClient?.id,
      buyerName: chosenClient ? chosenClient.name : buyerName.trim(),
      buyerCompany: chosenClient ? chosenClient.company : buyerCompany.trim() || undefined,
      saleType,
      tierId: chosenTier?.id,
      tierName: chosenTier?.name,
      quantity: numQty,
      unitPrice: numUnitPrice,
      discount: numDiscount || 0,
      totalAmount,
      paidAmount: numPaid,
      date,
      subscriptionEndDate: computedSubEndDate,
      method,
      bankAccountId: bankAccountId || undefined,
      bankAccountLabel: bankLabel,
      trackingCode: trackingCode.trim() || undefined,
      hasSupport,
      supportMonths: hasSupport ? numSupportMonths : 0,
      supportStartDate: hasSupport ? date : undefined,
      supportEndDate: computedSupportEndDate,
      supportRenewalPrice: hasSupport ? Number(supportRenewalPrice) || 0 : 0,
      notes: notes.trim() || undefined
    });

    onSaved?.(createdSale);
    onClose();
  };

  const productOptions = products.map((p) => {
    let priceLabel = 'قیمت‌گذاری سفارشی';
    if (p.tiers && p.tiers.length > 0) {
      const prices = p.tiers.map((t) => t.price).filter((n) => n > 0);
      const minP = prices.length > 0 ? Math.min(...prices) : 0;
      const maxP = prices.length > 0 ? Math.max(...prices) : 0;
      priceLabel = `${toPersianDigits(p.tiers.length)} نسخه (${formatPrice(minP)} تا ${formatPrice(maxP)} تومان)`;
    } else if (p.oneTimePrice) {
      priceLabel = `${formatPrice(p.oneTimePrice)} تومان`;
    } else if (p.monthlyPrice) {
      priceLabel = `ماهانه ${formatPrice(p.monthlyPrice)} تومان`;
    }
    return {
      value: p.id,
      label: p.name,
      sublabel: `${p.domain} • ${priceLabel}`
    };
  });

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `${c.company} • ${toPersianDigits(c.phone)}`
  }));

  const bankOptions = bankAccounts.map((b) => ({
    value: b.id,
    label: `${b.bankName} — ${b.accountHolder}`,
    sublabel: b.cardNumber
      ? `کارت: ${formatCardNumber(b.cardNumber)}`
      : b.iban
      ? `شبا: ${b.iban}`
      : b.type
  }));

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-black text-slate-900">ثبت فروش جدید محصول</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ثبت فاکتور فروش، وضعیت دریافتی و تاریخ انقضای پشتیبانی خریدار
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Product selector */}
            {!lockedProductId ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">محصول مورد نظر *</label>
                <CustomSelect
                  value={productId}
                  onChange={handleProductChange}
                  options={productOptions}
                  searchable
                  placeholder="انتخاب محصول..."
                />
              </div>
            ) : (
              selectedProduct && (
                <div className="px-4 py-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900">محصول: {selectedProduct.name}</span>
                  <span className="text-[11px] font-medium text-indigo-600">{selectedProduct.domain}</span>
                </div>
              )
            )}

            {/* Tier Selector Cards (Only if product has pricing tiers) */}
            {selectedProduct?.tiers && selectedProduct.tiers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">انتخاب نسخه / پلن محصول *</label>
                  <span className="text-[10px] font-medium text-slate-500">
                    قیمت و مدت پشتیبانی خودکار تنظیم می‌شود
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {selectedProduct.tiers.map((tier) => {
                    const isSelected = selectedTierId === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => handleSelectTier(tier.id)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200/70 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-black ${
                              isSelected ? 'text-indigo-900' : 'text-slate-800'
                            }`}
                          >
                            {tier.name}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs font-black text-indigo-700 tabular-nums">
                          {formatPrice(tier.price)} <span className="text-[10px] font-bold">تومان</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium tabular-nums">
                          {tier.supportMonths
                            ? `${toPersianDigits(tier.supportMonths)} ماه پشتیبانی اولیه`
                            : 'بدون پشتیبانی اولیه'}
                          {tier.supportRenewalPrice
                            ? ` · تمدید: ${formatPrice(tier.supportRenewalPrice)}`
                            : ''}
                        </div>
                        {tier.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 pt-0.5">
                            {tier.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buyer Selector */}
            {lockedClient ? (
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck size={15} className="text-emerald-600" />
                  خریدار: {lockedClient.name}
                </span>
                <span className="text-[11px] text-slate-500">{lockedClient.company}</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">مشخصات خریدار *</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setBuyerMode('client')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        buyerMode === 'client' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Users size={12} /> مشتریان پنل
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyerMode('custom')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        buyerMode === 'custom' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      خریدار آزاد / جدید
                    </button>
                  </div>
                </div>

                {buyerMode === 'client' ? (
                  <CustomSelect
                    value={clientId}
                    onChange={setClientId}
                    options={clientOptions}
                    searchable
                    placeholder="جستجو و انتخاب مشتری..."
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="نام و نام خانوادگی خریدار *"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="نام شرکت / کسب‌وکار (اختیاری)"
                      value={buyerCompany}
                      onChange={(e) => setBuyerCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Sale Type + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نوع فروش / اشتراک *</label>
                <CustomSelect
                  value={saleType}
                  onChange={(val) => handleSaleTypeChange(val as ProductSale['saleType'])}
                  options={SALE_TYPE_OPTIONS}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تاریخ فروش (شمسی) *</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={date}
                  onChange={(d) => setDate(d?.format?.('YYYY/MM/DD') || '')}
                  inputClass="rmdp-input"
                />
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">قیمت واحد *</label>
                <FormattedNumberInput
                  required
                  value={unitPrice}
                  onChange={(val) => {
                    setUnitPrice(val);
                    const nextTotal = Math.max(0, numQty * (Number(val) || 0) - numDiscount);
                    setPaidAmount(String(nextTotal));
                  }}
                  placeholder="مبلغ واحد"
                  suffix="تومان"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تعداد لایسنس / اکانت</label>
                <FormattedNumberInput
                  value={quantity}
                  onChange={(val) => {
                    const q = Math.max(1, Number(val) || 1);
                    setQuantity(val);
                    const nextTotal = Math.max(0, q * numUnitPrice - numDiscount);
                    setPaidAmount(String(nextTotal));
                  }}
                  placeholder="۱"
                  suffix="عدد"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تخفیف (اختیاری)</label>
                <FormattedNumberInput
                  value={discount}
                  onChange={(val) => {
                    setDiscount(val);
                    const nextDisc = Math.min(numQty * numUnitPrice, Number(val) || 0);
                    const nextTotal = Math.max(0, numQty * numUnitPrice - nextDisc);
                    setPaidAmount(String(nextTotal));
                  }}
                  max={numQty * numUnitPrice}
                  placeholder="۰"
                  suffix="تومان"
                />
              </div>
            </div>

            {/* Live Invoice Strip */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">مبلغ نهایی فاکتور</span>
                <span className="text-xs font-black text-slate-900 tabular-nums">
                  {formatPrice(totalAmount)} تومان
                </span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-[10px] font-bold text-emerald-600 block">دریافتی نقد</span>
                <span className="text-xs font-black text-emerald-700 tabular-nums">
                  {formatPrice(Math.min(totalAmount, numPaid))} تومان
                </span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-[10px] font-bold text-rose-600 block">مانده (طلب)</span>
                <span className="text-xs font-black text-rose-700 tabular-nums">
                  {formatPrice(remainingAmount)} تومان
                </span>
              </div>
            </div>

            {/* Paid Amount + Method + Tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">مبلغ دریافتی فعلی</label>
                  {totalAmount > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPaidAmount(String(Math.round(totalAmount * 0.5)))}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer"
                      >
                        ۵۰٪
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaidAmount(String(totalAmount))}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md cursor-pointer"
                      >
                        کامل
                      </button>
                    </div>
                  )}
                </div>
                <FormattedNumberInput
                  value={paidAmount}
                  max={totalAmount}
                  onChange={setPaidAmount}
                  placeholder="مبلغ واریزی"
                  suffix="تومان"
                  className={isOverLimit ? 'border-rose-400 focus:border-rose-500' : ''}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">روش پرداخت</label>
                <CustomSelect
                  value={method}
                  onChange={(val) => setMethod(val as ProductSale['method'])}
                  options={PAYMENT_METHODS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">کد رهگیری (اختیاری)</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="TRX-..."
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Destination Bank Account */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-indigo-600" />
                  کارت / حساب مقصد واریز ({method})
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickBankForm((prev) => !prev)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> {showQuickBankForm ? 'بستن' : 'حساب جدید'}
                </button>
              </div>
              <CustomSelect
                value={bankAccountId}
                onChange={setBankAccountId}
                options={bankOptions}
                buttonClassName="bg-white border-indigo-200"
                placeholder="انتخاب کارت یا حساب مقصد..."
              />
              {showQuickBankForm && (
                <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="نام بانک / صندوق *"
                      value={quickBankName}
                      onChange={(e) => setQuickBankName(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="نام صاحب حساب *"
                      value={quickAccountHolder}
                      onChange={(e) => setQuickAccountHolder(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="شماره کارت ۱۶ رقمی"
                      value={quickCardNumber}
                      onChange={(e) => setQuickCardNumber(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="شماره شبا IR..."
                      value={quickIban}
                      onChange={(e) => setQuickIban(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddBank}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ذخیره و انتخاب این حساب
                  </button>
                </div>
              )}
            </div>

            {/* Support Configuration */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-black text-emerald-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSupport}
                    onChange={(e) => setHasSupport(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <ShieldCheck size={15} className="text-emerald-600" />
                  این فروش شامل پشتیبانی است
                </label>
                {hasSupport && computedSupportEndDate && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 tabular-nums">
                    انقضا: {toPersianDigits(computedSupportEndDate)}
                  </span>
                )}
              </div>

              {hasSupport && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">مدت پشتیبانی (ماه)</label>
                      <div className="flex items-center gap-1">
                        {[3, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSupportMonths(String(m))}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              Number(supportMonths) === m
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {toPersianDigits(m)} ماه
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormattedNumberInput
                      value={supportMonths}
                      onChange={setSupportMonths}
                      max={60}
                      placeholder="۶"
                      suffix="ماه"
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">تعرفه تمدید دوره بعدی</label>
                    <FormattedNumberInput
                      value={supportRenewalPrice}
                      onChange={setSupportRenewalPrice}
                      placeholder="مثلاً: ۴,۵۰۰,۰۰۰"
                      suffix="تومان"
                      className="bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">توضیحات تکمیلی فروش</label>
              <textarea
                rows={2}
                placeholder="جزئیات لایسنس، دامنه نصب یا شرایط توافق..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Footer */}
            <div className="pt-3 flex gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={totalAmount <= 0 || isOverLimit}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
              >
                ثبت فروش ({formatPrice(totalAmount)} تومان)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductSaleModal;
