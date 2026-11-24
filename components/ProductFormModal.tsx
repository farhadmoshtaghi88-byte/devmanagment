import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Calculator, ShieldCheck, Layers, Sparkles, Plus, Trash2, Tag } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Product, ProductSalesModel, ProductStatus, ProductSupportPolicy, ProductTier } from '../types';
import { formatPrice, toPersianDigits, getTodayPersianDate } from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';
import TechStackSelector from './TechStackSelector';
import OptionManagerModal from './OptionManagerModal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
  onSaved?: (product: Product) => void;
}

const PRODUCT_STATUS_OPTIONS: Array<{ value: ProductStatus; label: string; dotColorClass: string }> = [
  { value: 'در حال تولید', label: 'در حال تولید', dotColorClass: 'bg-amber-500' },
  { value: 'آماده فروش', label: 'آماده فروش', dotColorClass: 'bg-indigo-500' },
  { value: 'پرفروش', label: 'پرفروش', dotColorClass: 'bg-emerald-500' },
  { value: 'متوقف شده', label: 'متوقف شده', dotColorClass: 'bg-slate-400' }
];

const SUPPORT_POLICY_OPTIONS: Array<{ value: ProductSupportPolicy; label: string; sublabel: string }> = [
  { value: 'free', label: 'پشتیبانی رایگان در دوره اولیه', sublabel: 'دوره اول رایگان و تمدید بعدی با تعرفه' },
  { value: 'paid', label: 'پشتیبانی با تعرفه مجزا', sublabel: 'پشتیبانی به صورت قرارداد یا تمدید دوره‌ای' },
  { value: 'none', label: 'بدون پشتیبانی', sublabel: 'فروش محصول بدون تعهد پشتیبانی' }
];

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  onSaved
}) => {
  const {
    productDomains,
    addProductDomain,
    updateProductDomain,
    deleteProductDomain,
    techStacks,
    addTechStack,
    addProduct,
    updateProduct,
    addProductCost,
    getProductStats
  } = useData();

  const [name, setName] = useState('');
  const [domain, setDomain] = useState(productDomains[0] || '');
  const [status, setStatus] = useState<ProductStatus>('آماده فروش');
  const [salesModel, setSalesModel] = useState<ProductSalesModel>('hybrid');
  const [oneTimePrice, setOneTimePrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [annualPrice, setAnnualPrice] = useState('');
  const [variableCostPerUnit, setVariableCostPerUnit] = useState('');
  const [targetMarginPercent, setTargetMarginPercent] = useState('65');
  const [targetSalesCount, setTargetSalesCount] = useState('10');
  const [initialProductionCost, setInitialProductionCost] = useState('');
  const [supportPolicy, setSupportPolicy] = useState<ProductSupportPolicy>('free');
  const [defaultSupportMonths, setDefaultSupportMonths] = useState('6');
  const [supportRenewalPrice, setSupportRenewalPrice] = useState('');
  const [stack, setStack] = useState<string[]>([]);
  const [version, setVersion] = useState('v1.0');
  const [demoUrl, setDemoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tiers, setTiers] = useState<
    Array<{
      id: string;
      name: string;
      price: string;
      supportMonths: string;
      supportRenewalPrice: string;
      description: string;
    }>
  >([]);

  const [isDomainManagerOpen, setIsDomainManagerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setName(editingProduct.name);
      setDomain(editingProduct.domain || productDomains[0] || '');
      setStatus(editingProduct.status);
      setSalesModel(editingProduct.salesModel);
      setOneTimePrice(editingProduct.oneTimePrice ? String(editingProduct.oneTimePrice) : '');
      setMonthlyPrice(editingProduct.monthlyPrice ? String(editingProduct.monthlyPrice) : '');
      setAnnualPrice(editingProduct.annualPrice ? String(editingProduct.annualPrice) : '');
      setVariableCostPerUnit(
        editingProduct.variableCostPerUnit ? String(editingProduct.variableCostPerUnit) : ''
      );
      setTargetMarginPercent(String(editingProduct.targetMarginPercent ?? 100));
      setTargetSalesCount(String(editingProduct.targetSalesCount ?? 10));
      setInitialProductionCost('');
      setSupportPolicy(editingProduct.supportPolicy);
      setDefaultSupportMonths(String(editingProduct.defaultSupportMonths ?? 6));
      setSupportRenewalPrice(
        editingProduct.supportRenewalPrice ? String(editingProduct.supportRenewalPrice) : ''
      );
      setStack(editingProduct.stack || []);
      setVersion(editingProduct.version || '');
      setDemoUrl(editingProduct.demoUrl || '');
      setDescription(editingProduct.description || '');
      setTiers(
        (editingProduct.tiers || []).map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price ? String(t.price) : '',
          supportMonths:
            t.supportMonths !== undefined ? String(t.supportMonths) : String(editingProduct.defaultSupportMonths ?? 12),
          supportRenewalPrice: t.supportRenewalPrice ? String(t.supportRenewalPrice) : '',
          description: t.description || ''
        }))
      );
    } else {
      setName('');
      setDomain(productDomains[0] || '');
      setStatus('آماده فروش');
      setSalesModel('hybrid');
      setOneTimePrice('');
      setMonthlyPrice('');
      setAnnualPrice('');
      setVariableCostPerUnit('');
      setTargetMarginPercent('100');
      setTargetSalesCount('10');
      setInitialProductionCost('');
      setSupportPolicy('free');
      setDefaultSupportMonths('12');
      setSupportRenewalPrice('');
      setStack([]);
      setVersion('v1.0');
      setDemoUrl('');
      setDescription('');
      setTiers([]);
    }
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  const addTierRow = () => {
    setTiers((prev) => [
      ...prev,
      {
        id: `tier-${Date.now()}-${prev.length + 1}`,
        name:
          prev.length === 0
            ? 'نسخه پایه'
            : prev.length === 1
            ? 'نسخه حرفه‌ای'
            : prev.length === 2
            ? 'نسخه جامع'
            : `نسخه ${toPersianDigits(prev.length + 1)}`,
        price: '',
        supportMonths: defaultSupportMonths || '12',
        supportRenewalPrice: supportRenewalPrice || '',
        description: ''
      }
    ]);
  };

  const updateTierRow = (
    tierId: string,
    field: 'name' | 'price' | 'supportMonths' | 'supportRenewalPrice' | 'description',
    val: string
  ) => {
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, [field]: val } : t)));
  };

  const removeTierRow = (tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  };

  const numOneTime = Number(oneTimePrice) || 0;
  const numMonthly = Number(monthlyPrice) || 0;
  const numAnnual = Number(annualPrice) || 0;
  const numVarCost = Number(variableCostPerUnit) || 0;
  const numTargetRoi = Math.min(500, Math.max(0, Number(targetMarginPercent) || 0));
  const numTargetSales = Math.max(1, Number(targetSalesCount) || 10);
  const numInitialCost = Number(initialProductionCost) || 0;
  const existingFixedCost = editingProduct ? getProductStats(editingProduct.id).totalCost : 0;
  const effectiveFixedCost = editingProduct ? existingFixedCost : numInitialCost;

  const validTierPrices = tiers.map((t) => Number(t.price) || 0).filter((p) => p > 0);
  const avgTierPrice =
    validTierPrices.length > 0
      ? Math.round(validTierPrices.reduce((s, p) => s + p, 0) / validTierPrices.length)
      : 0;

  const referenceUnitPrice =
    salesModel === 'one-time'
      ? numOneTime || avgTierPrice
      : salesModel === 'subscription'
      ? numAnnual || numMonthly * 12 || avgTierPrice
      : numOneTime || avgTierPrice || numAnnual || numMonthly * 12;

  const unitContribution = referenceUnitPrice - numVarCost;
  const positiveContribution = Math.max(0, unitContribution);
  const perSaleMarginPercent =
    referenceUnitPrice > 0 ? Math.round((unitContribution / referenceUnitPrice) * 100) : 0;
  const estimatedBreakEvenUnits =
    effectiveFixedCost > 0 && positiveContribution > 0
      ? Math.ceil(effectiveFixedCost / positiveContribution)
      : 0;
  const projectedProfitAtTarget =
    referenceUnitPrice > 0
      ? referenceUnitPrice * numTargetSales - (effectiveFixedCost + numVarCost * numTargetSales)
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanedTiers: ProductTier[] = tiers
      .filter((t) => t.name.trim() && (Number(t.price) || 0) > 0)
      .map((t) => ({
        id: t.id,
        name: t.name.trim(),
        price: Number(t.price) || 0,
        supportMonths:
          t.supportMonths !== ''
            ? Math.max(0, Number(t.supportMonths) || 0)
            : Math.max(0, Number(defaultSupportMonths) || 0),
        supportRenewalPrice: t.supportRenewalPrice ? Number(t.supportRenewalPrice) || 0 : undefined,
        description: t.description.trim() || undefined
      }));

    const fallbackOneTime =
      numOneTime || (cleanedTiers.length > 0 ? cleanedTiers[0].price : undefined);

    const payload: Omit<Product, 'id' | 'createdAt'> = {
      name: name.trim(),
      domain: domain || productDomains[0] || 'سایر',
      status,
      salesModel,
      oneTimePrice: salesModel === 'subscription' ? undefined : fallbackOneTime,
      monthlyPrice: salesModel === 'one-time' ? undefined : numMonthly || undefined,
      annualPrice: salesModel === 'one-time' ? undefined : numAnnual || undefined,
      tiers: cleanedTiers.length > 0 ? cleanedTiers : undefined,
      variableCostPerUnit: numVarCost || 0,
      targetMarginPercent: numTargetRoi,
      targetSalesCount: numTargetSales,
      supportPolicy,
      defaultSupportMonths: supportPolicy === 'none' ? 0 : Math.max(0, Number(defaultSupportMonths) || 0),
      supportRenewalPrice: supportPolicy === 'none' ? 0 : Number(supportRenewalPrice) || 0,
      stack,
      version: version.trim() || undefined,
      demoUrl: demoUrl.trim() || undefined,
      description: description.trim() || undefined
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      onSaved?.({ ...editingProduct, ...payload });
    } else {
      const created = addProduct(payload);
      if (numInitialCost > 0) {
        addProductCost({
          productId: created.id,
          productName: created.name,
          costType: 'توسعه اولیه',
          categoryTitle: 'توسعه اولیه محصول',
          title: `هزینه تولید اولیه ${created.name}`,
          amount: numInitialCost,
          date: getTodayPersianDate(),
          paymentStatus: 'paid',
          notes: 'ثبت‌شده همزمان با تعریف محصول'
        });
      }
      onSaved?.(created);
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {editingProduct ? 'ویرایش مشخصات محصول' : 'تعریف محصول تولیدی جدید'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ثبت هویت محصول، مدل فروش یک‌باره/اشتراکی، مارجین هدف و سیاست پشتیبانی
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

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">نام محصول *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: سامانه مدیریت کلینیک‌یار، افزونه مودیان، ربات هوشمند..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">زمینه و حوزه محصول *</label>
                    <button
                      type="button"
                      onClick={() => setIsDomainManagerOpen(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <SlidersHorizontal size={11} /> تعریف / ویرایش
                    </button>
                  </div>
                  <CustomSelect
                    value={domain}
                    onChange={setDomain}
                    options={productDomains.map((d) => ({ value: d, label: d }))}
                    searchable
                    placeholder="انتخاب زمینه محصول..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">وضعیت محصول</label>
                    <CustomSelect
                      value={status}
                      onChange={(val) => setStatus(val as ProductStatus)}
                      options={PRODUCT_STATUS_OPTIONS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">نسخه فعلی</label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="v1.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Sales Model & Pricing */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Calculator size={15} className="text-indigo-600" />
                    مدل فروش، قیمت‌گذاری و مارجین سود
                  </span>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    {(
                      [
                        { id: 'one-time', label: 'فروش یک‌باره' },
                        { id: 'subscription', label: 'اشتراکی' },
                        { id: 'hybrid', label: 'هر دو مدل' }
                      ] as Array<{ id: ProductSalesModel; label: string }>
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSalesModel(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          salesModel === m.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(salesModel === 'one-time' || salesModel === 'hybrid') && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">قیمت فروش یک‌باره (لایسنس)</label>
                      <FormattedNumberInput
                        value={oneTimePrice}
                        onChange={setOneTimePrice}
                        placeholder="مثلاً: ۴۵,۰۰۰,۰۰۰"
                        suffix="تومان"
                        className="bg-white"
                      />
                    </div>
                  )}
                  {(salesModel === 'subscription' || salesModel === 'hybrid') && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700">تعرفه اشتراک ماهانه</label>
                        <FormattedNumberInput
                          value={monthlyPrice}
                          onChange={setMonthlyPrice}
                          placeholder="مثلاً: ۲,۵۰۰,۰۰۰"
                          suffix="تومان"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700">تعرفه اشتراک سالانه</label>
                        <FormattedNumberInput
                          value={annualPrice}
                          onChange={setAnnualPrice}
                          placeholder="مثلاً: ۲۴,۰۰۰,۰۰۰"
                          suffix="تومان"
                          className="bg-white"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Multi-Tier Pricing Editions (Optional) */}
                <div className="pt-3 border-t border-slate-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Tag size={14} className="text-indigo-600" />
                        نسخه‌ها و پلن‌های چندقیمتی (اختیاری)
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        اگر محصول چند نسخه با قیمت‌های متفاوت دارد (مثلاً پایه ۳۵م، حرفه‌ای ۳۹م، جامع ۴۵م) اینجا تعریف کنید.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addTierRow}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Plus size={13} /> افزودن نسخه جدید
                    </button>
                  </div>

                  {tiers.length > 0 && (
                    <div className="space-y-2.5">
                      {tiers.map((tier, idx) => (
                        <div
                          key={tier.id}
                          className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-black text-indigo-700">
                              نسخه {toPersianDigits(idx + 1)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeTierRow(tier.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف این نسخه"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">نام نسخه *</label>
                              <input
                                type="text"
                                placeholder="مثلاً: نسخه پایه"
                                value={tier.name}
                                onChange={(e) => updateTierRow(tier.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">قیمت فروش *</label>
                              <FormattedNumberInput
                                value={tier.price}
                                onChange={(val) => updateTierRow(tier.id, 'price', val)}
                                placeholder="۳۵,۰۰۰,۰۰۰"
                                suffix="تومان"
                                className="bg-slate-50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">پشتیبانی اولیه</label>
                              <FormattedNumberInput
                                value={tier.supportMonths}
                                onChange={(val) => updateTierRow(tier.id, 'supportMonths', val)}
                                max={60}
                                placeholder="۱۲"
                                suffix="ماه"
                                className="bg-slate-50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">تمدید سالانه (اختیاری)</label>
                              <FormattedNumberInput
                                value={tier.supportRenewalPrice}
                                onChange={(val) => updateTierRow(tier.id, 'supportRenewalPrice', val)}
                                placeholder="توافقی / اختیاری"
                                suffix="تومان"
                                className="bg-slate-50"
                              />
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="توضیح کوتاه تفاوت امکانات این نسخه (اختیاری)..."
                            value={tier.description}
                            onChange={(e) => updateTierRow(tier.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`grid grid-cols-1 ${editingProduct ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3 pt-1`}>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">تارگت فروش (پیش‌بینی)</label>
                    <FormattedNumberInput
                      value={targetSalesCount}
                      onChange={setTargetSalesCount}
                      max={10000}
                      placeholder="۱۰"
                      suffix="فروش"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">هدف سود روی سرمایه (%)</label>
                    <FormattedNumberInput
                      value={targetMarginPercent}
                      onChange={setTargetMarginPercent}
                      max={500}
                      placeholder="۱۰۰"
                      suffix="درصد"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">هزینه جانبی هر فروش</label>
                    <FormattedNumberInput
                      value={variableCostPerUnit}
                      onChange={setVariableCostPerUnit}
                      placeholder="نصب / پورسانت"
                      suffix="تومان"
                      className="bg-white"
                    />
                  </div>
                  {!editingProduct && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">هزینه تولید اولیه</label>
                      <FormattedNumberInput
                        value={initialProductionCost}
                        onChange={setInitialProductionCost}
                        placeholder="مثلاً: ۵۰,۰۰۰,۰۰۰"
                        suffix="تومان"
                        className="bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Live Profitability Preview */}
                {referenceUnitPrice > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px]">
                    <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                      <Sparkles size={14} className="text-indigo-600 shrink-0" />
                      <span>برآورد سریع:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700 font-bold tabular-nums">
                      <span>
                        آورده هر فروش:{' '}
                        <strong className={unitContribution >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {formatPrice(Math.abs(unitContribution))} تومان (٪{toPersianDigits(perSaleMarginPercent)})
                        </strong>
                      </span>
                      {estimatedBreakEvenUnits > 0 && (
                        <span>
                          نقطه سر‌به‌سر:{' '}
                          <strong className="text-amber-700">
                            {toPersianDigits(estimatedBreakEvenUnits)} فروش
                          </strong>
                        </span>
                      )}
                      <span>
                        سود کل در {toPersianDigits(numTargetSales)} فروش:{' '}
                        <strong className={projectedProfitAtTarget >= 0 ? 'text-indigo-700' : 'text-rose-600'}>
                          {projectedProfitAtTarget < 0 ? '−' : '+'}
                          {formatPrice(Math.abs(projectedProfitAtTarget))} تومان
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Support Policy */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  سیاست پشتیبانی و تمدید
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-700">نوع پشتیبانی</label>
                    <CustomSelect
                      value={supportPolicy}
                      onChange={(val) => setSupportPolicy(val as ProductSupportPolicy)}
                      options={SUPPORT_POLICY_OPTIONS}
                      buttonClassName="bg-white"
                    />
                  </div>
                  {supportPolicy !== 'none' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700">مدت پشتیبانی پیش‌فرض</label>
                        <FormattedNumberInput
                          value={defaultSupportMonths}
                          onChange={setDefaultSupportMonths}
                          max={60}
                          placeholder="۶"
                          suffix="ماه"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700">تعرفه تمدید هر دوره</label>
                        <FormattedNumberInput
                          value={supportRenewalPrice}
                          onChange={setSupportRenewalPrice}
                          placeholder="مثلاً: ۴,۵۰۰,۰۰۰"
                          suffix="تومان"
                          className="bg-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 4: Tech Stack & Details */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers size={14} className="text-slate-500" />
                    تکنولوژی‌ها و استک فنی محصول
                  </label>
                  <TechStackSelector
                    selected={stack}
                    availableTechs={techStacks}
                    onChange={setStack}
                    onAddNewTech={addTechStack}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">لینک دمو / صفحه معرفی (اختیاری)</label>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://demo.example.ir"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">توضیحات و مزایای محصول</label>
                    <input
                      type="text"
                      placeholder="شرح کوتاه کاربرد، امکانات کلیدی و مخاطبان هدف..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 cursor-pointer"
                >
                  {editingProduct ? 'ذخیره تغییرات محصول' : 'ثبت محصول جدید'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <OptionManagerModal
        mode="string"
        isOpen={isDomainManagerOpen}
        onClose={() => setIsDomainManagerOpen(false)}
        title="مدیریت زمینه‌ها و حوزه‌های محصولات"
        subtitle="افزودن، ویرایش یا حذف دسته‌بندی‌های موضوعی محصولات تولیدی"
        items={productDomains}
        onAdd={addProductDomain}
        onUpdate={updateProductDomain}
        onDelete={deleteProductDomain}
      />
    </>
  );
};

export default ProductFormModal;
