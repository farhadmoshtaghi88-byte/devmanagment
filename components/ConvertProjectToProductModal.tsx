import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { Project, ProductSalesModel, ProductSupportPolicy, ProductTier } from '../types';
import { getTodayPersianDate, formatPrice, toPersianDigits } from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';

interface ConvertProjectToProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onConverted?: (productId: string) => void;
}

const SALES_MODEL_OPTIONS: Array<{ value: ProductSalesModel; label: string }> = [
  { value: 'one-time', label: 'فروش یک‌باره (لایسنس دائمی)' },
  { value: 'subscription', label: 'اشتراکی (ماهانه / سالانه)' },
  { value: 'hybrid', label: 'ترکیبی (یک‌باره + اشتراکی)' }
];

const SUPPORT_POLICY_OPTIONS: Array<{ value: ProductSupportPolicy; label: string }> = [
  { value: 'free', label: 'پشتیبانی رایگان در سال اول + تمدید اختیاری' },
  { value: 'paid', label: 'پشتیبانی با تعرفه مجزا' },
  { value: 'none', label: 'بدون پشتیبانی' }
];

const ConvertProjectToProductModal: React.FC<ConvertProjectToProductModalProps> = ({
  isOpen,
  onClose,
  project,
  onConverted
}) => {
  const { productDomains, convertProjectToProduct } = useData();

  const [productName, setProductName] = useState('');
  const [domain, setDomain] = useState(productDomains[0] || 'نرم‌افزار ابری (SaaS)');
  const [description, setDescription] = useState('');
  const [salesModel, setSalesModel] = useState<ProductSalesModel>('one-time');
  const [oneTimePrice, setOneTimePrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [annualPrice, setAnnualPrice] = useState('');

  // Optional multi-tier editions
  const [useMultiTier, setUseMultiTier] = useState(false);
  const [tiers, setTiers] = useState<
    Array<{ id: string; name: string; price: string; supportMonths: string; supportRenewalPrice: string }>
  >([]);

  const [supportPolicy, setSupportPolicy] = useState<ProductSupportPolicy>('free');
  const [defaultSupportMonths, setDefaultSupportMonths] = useState('12');
  const [supportRenewalPrice, setSupportRenewalPrice] = useState('');
  const [productizationCost, setProductizationCost] = useState('');

  // Founder client support enrollment (0 Toman -> zero double counting!)
  const [includeFounderInSupport, setIncludeFounderInSupport] = useState(true);
  const [founderTierId, setFounderTierId] = useState('');
  const [founderSupportMonths, setFounderSupportMonths] = useState('12');
  const [founderSupportStartDate, setFounderSupportStartDate] = useState(getTodayPersianDate());

  useEffect(() => {
    if (!isOpen) return;
    setProductName(project.title);
    setDomain(productDomains[0] || 'نرم‌افزار ابری (SaaS)');
    setDescription(project.description || '');
    setSalesModel('one-time');
    setOneTimePrice('');
    setMonthlyPrice('');
    setAnnualPrice('');
    setUseMultiTier(false);
    setTiers([
      {
        id: `tier-${Date.now()}-1`,
        name: 'نسخه پایه',
        price: '',
        supportMonths: '12',
        supportRenewalPrice: ''
      },
      {
        id: `tier-${Date.now()}-2`,
        name: 'نسخه حرفه‌ای',
        price: '',
        supportMonths: '12',
        supportRenewalPrice: ''
      }
    ]);
    setSupportPolicy('free');
    setDefaultSupportMonths('12');
    setSupportRenewalPrice('');
    setProductizationCost('');
    setIncludeFounderInSupport(true);
    setFounderTierId('');
    setFounderSupportMonths('12');
    setFounderSupportStartDate(project.deadline || getTodayPersianDate());
  }, [isOpen, project.id]);

  if (!isOpen) return null;

  const domainOptions = productDomains.map((d) => ({ value: d, label: d }));

  const addTierRow = () => {
    setTiers((prev) => [
      ...prev,
      {
        id: `tier-${Date.now()}-${prev.length + 1}`,
        name: `نسخه ${toPersianDigits(prev.length + 1)}`,
        price: '',
        supportMonths: defaultSupportMonths || '12',
        supportRenewalPrice: supportRenewalPrice || ''
      }
    ]);
  };

  const removeTierRow = (id: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const parsedTiers: ProductTier[] | undefined = useMultiTier
      ? tiers
          .filter((t) => t.name.trim() && Number(t.price) > 0)
          .map((t) => ({
            id: t.id,
            name: t.name.trim(),
            price: Number(t.price) || 0,
            supportMonths: Number(t.supportMonths) || Number(defaultSupportMonths) || 12,
            supportRenewalPrice: Number(t.supportRenewalPrice) || Number(supportRenewalPrice) || 0
          }))
      : undefined;

    const created = convertProjectToProduct({
      projectId: project.id,
      productName: productName.trim(),
      domain,
      description: description.trim() || undefined,
      salesModel,
      oneTimePrice: Number(oneTimePrice) || undefined,
      monthlyPrice: Number(monthlyPrice) || undefined,
      annualPrice: Number(annualPrice) || undefined,
      tiers: parsedTiers && parsedTiers.length > 0 ? parsedTiers : undefined,
      supportPolicy,
      defaultSupportMonths: Number(defaultSupportMonths) || 12,
      supportRenewalPrice: Number(supportRenewalPrice) || 0,
      productizationCost: Number(productizationCost) || 0,
      includeFounderInSupport,
      founderTierId: parsedTiers && parsedTiers.length > 0 ? founderTierId || parsedTiers[0].id : undefined,
      founderSupportMonths: Number(founderSupportMonths) || Number(defaultSupportMonths) || 12,
      founderSupportStartDate: founderSupportStartDate || getTodayPersianDate()
    });

    onClose();
    if (created && onConverted) {
      onConverted(created.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Package size={20} className="text-indigo-600" />
              تبدیل پروژه به محصول قابل فروش
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ساخت محصول جدید از روی «{project.title}» بدون دوباره‌شماری مالی
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={19} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Zero Double-Counting Guarantee Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-2.5 text-xs text-indigo-900 leading-relaxed">
            <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-black">حسابداری دقیق بدون دوباره‌شماری:</strong> قرارداد اولیه (
              <span className="tabular-nums font-bold">{formatPrice(project.contractValue)} تومان</span>)،
              واریزی‌ها و هزینه‌های این پروژه دست‌نخورده در بخش پروژه‌ها می‌ماند. محصول جدید مستقل ساخته شده و
              مشتری اول می‌تواند با مبلغ <strong className="font-black">۰ تومان</strong> وارد لیست پشتیبانی و
              ارتقای محصول شود.
            </div>
          </div>

          {/* Basic Product Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام محصول جدید *</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="مثلاً: سامانه هوشمند کلینیک‌یار"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">زمینه فعالیت محصول *</label>
              <CustomSelect value={domain} onChange={setDomain} options={domainOptions} searchable />
            </div>
          </div>

          {/* Pricing Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">مدل فروش محصول</label>
              <CustomSelect
                value={salesModel}
                onChange={(val) => setSalesModel(val as ProductSalesModel)}
                options={SALES_MODEL_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">سیاست پشتیبانی</label>
              <CustomSelect
                value={supportPolicy}
                onChange={(val) => setSupportPolicy(val as ProductSupportPolicy)}
                options={SUPPORT_POLICY_OPTIONS}
              />
            </div>
          </div>

          {/* Pricing Inputs OR Multi-Tier Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-800">تعرفه‌های فروش به مشتریان بعدی</span>
              {salesModel !== 'subscription' && (
                <button
                  type="button"
                  onClick={() => setUseMultiTier((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                    useMultiTier
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <Sparkles size={12} />
                  {useMultiTier ? 'فروش چندنسخه‌ای فعال است' : 'تعریف چند نسخه (پایه / حرفه‌ای / جامع)'}
                </button>
              )}
            </div>

            {!useMultiTier ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {salesModel !== 'subscription' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">قیمت فروش یک‌باره</label>
                    <FormattedNumberInput
                      value={oneTimePrice}
                      onChange={setOneTimePrice}
                      placeholder="مثلاً: ۳۵,۰۰۰,۰۰۰"
                      suffix="تومان"
                      className="bg-white"
                    />
                  </div>
                )}
                {salesModel !== 'one-time' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">اشتراک ماهانه</label>
                      <FormattedNumberInput
                        value={monthlyPrice}
                        onChange={setMonthlyPrice}
                        placeholder="مثلاً: ۲,۵۰۰,۰۰۰"
                        suffix="تومان"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">اشتراک سالانه</label>
                      <FormattedNumberInput
                        value={annualPrice}
                        onChange={setAnnualPrice}
                        placeholder="مثلاً: ۲۵,۰۰۰,۰۰۰"
                        suffix="تومان"
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {tiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white p-3 rounded-xl border border-slate-200"
                  >
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">نام نسخه {toPersianDigits(idx + 1)}</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) =>
                          setTiers((prev) =>
                            prev.map((t) => (t.id === tier.id ? { ...t, name: e.target.value } : t))
                          )
                        }
                        placeholder="مثلاً: نسخه پایه"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">قیمت فروش (تومان)</label>
                      <FormattedNumberInput
                        value={tier.price}
                        onChange={(val) =>
                          setTiers((prev) =>
                            prev.map((t) => (t.id === tier.id ? { ...t, price: val } : t))
                          )
                        }
                        placeholder="۳۵,۰۰۰,۰۰۰"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">تمدید سالانه</label>
                      <FormattedNumberInput
                        value={tier.supportRenewalPrice}
                        onChange={(val) =>
                          setTiers((prev) =>
                            prev.map((t) =>
                              t.id === tier.id ? { ...t, supportRenewalPrice: val } : t
                            )
                          )
                        }
                        placeholder="۷,۰۰۰,۰۰۰"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTierRow(tier.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="حذف نسخه"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTierRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Plus size={14} /> افزودن نسخه دیگر
                </button>
              </div>
            )}

            {/* Support Defaults & Optional Productization Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">مدت پشتیبانی اولیه</label>
                <FormattedNumberInput
                  value={defaultSupportMonths}
                  max={60}
                  onChange={setDefaultSupportMonths}
                  suffix="ماه"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">تعرفه تمدید پشتیبانی</label>
                <FormattedNumberInput
                  value={supportRenewalPrice}
                  onChange={setSupportRenewalPrice}
                  placeholder="اختیاری"
                  suffix="تومان"
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  هزینه مازاد تبدیل به محصول (اختیاری)
                </label>
                <FormattedNumberInput
                  value={productizationCost}
                  onChange={setProductizationCost}
                  placeholder="۰ (فقط هزینه جدید)"
                  suffix="تومان"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Founder Customer Support Enrollment Card */}
          <div
            className={`p-4 rounded-2xl border transition-colors space-y-3 ${
              includeFounderInSupport
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeFounderInSupport}
                onChange={(e) => setIncludeFounderInSupport(e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  ثبت کارفرمای پروژه ({project.clientName}) در لیست پشتیبانی و ارتقای محصول
                </div>
                <p className="text-[11px] text-slate-600">
                  مشتری اولیه با مبلغ <strong>۰ تومان</strong> به عنوان «مشتری بنیان‌گذار» ثبت می‌شود تا
                  تاریخ انقضای پشتیبانی، تمدید سال‌های بعد و ارتقای نسخه‌اش داخل همین محصول پیگیری شود.
                </p>
              </div>
            </label>

            {includeFounderInSupport && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-200/60">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700">شروع پشتیبانی مشتری اول</label>
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={founderSupportStartDate}
                    onChange={(d) => setFounderSupportStartDate(d?.format?.('YYYY/MM/DD') || '')}
                    inputClass="rmdp-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700">مدت پشتیبانی اولیه</label>
                  <FormattedNumberInput
                    value={founderSupportMonths}
                    max={60}
                    onChange={setFounderSupportMonths}
                    suffix="ماه"
                    className="bg-white"
                  />
                </div>
                {useMultiTier && tiers.some((t) => t.name.trim()) && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700">نسخه فعلی مشتری اول</label>
                    <CustomSelect
                      value={founderTierId || tiers[0]?.id || ''}
                      onChange={setFounderTierId}
                      options={tiers
                        .filter((t) => t.name.trim())
                        .map((t) => ({ value: t.id, label: t.name }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">توضیحات محصول (اختیاری)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="شرح قابلیت‌ها و ارزش محصول برای مشتریان جدید..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              ساخت محصول و انتقال مشتری به پشتیبانی
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertProjectToProductModal;
