import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CreditCard, CheckCircle2, Plus } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { formatPrice, toPersianDigits, formatCardNumber, getTodayPersianDate } from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockedProjectId?: string;
  filterClientId?: string;
}

const PAYMENT_METHODS: Array<{ value: 'شبا / پایا' | 'کارت به کارت' | 'درگاه آنلاین' | 'چک' | 'نقد'; label: string }> = [
  { value: 'شبا / پایا', label: 'حواله پایا / ساتنا (شبا)' },
  { value: 'کارت به کارت', label: 'کارت به کارت' },
  { value: 'درگاه آنلاین', label: 'درگاه پرداخت آنلاین' },
  { value: 'چک', label: 'چک صیادی' },
  { value: 'نقد', label: 'وجه نقد' }
];

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  lockedProjectId,
  filterClientId
}) => {
  const { projects, bankAccounts, addPayment, addBankAccount, getProjectStats } = useData();

  const eligibleProjects = filterClientId
    ? projects.filter((p) => p.clientId === filterClientId)
    : projects;

  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayPersianDate());
  const [method, setMethod] = useState<'کارت به کارت' | 'شبا / پایا' | 'درگاه آنلاین' | 'نقد' | 'چک'>('شبا / پایا');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Quick inline bank account creation
  const [showQuickBankForm, setShowQuickBankForm] = useState(false);
  const [quickBankName, setQuickBankName] = useState('');
  const [quickAccountHolder, setQuickAccountHolder] = useState('');
  const [quickCardNumber, setQuickCardNumber] = useState('');
  const [quickIban, setQuickIban] = useState('');

  const selectedProjectStats = projectId ? getProjectStats(projectId) : null;
  const remainingBalance = selectedProjectStats ? selectedProjectStats.remainingBalance : 0;

  // Initialize when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setShowQuickBankForm(false);

    const initialProjId =
      lockedProjectId ||
      eligibleProjects.find((p) => getProjectStats(p.id).remainingBalance > 0)?.id ||
      eligibleProjects[0]?.id ||
      '';
    setProjectId(initialProjId);

    const stats = initialProjId ? getProjectStats(initialProjId) : null;
    const rem = stats ? stats.remainingBalance : 0;
    setAmount(rem > 0 ? String(rem) : '');
    setTitle(rem > 0 ? 'تسویه مانده قرارداد' : '');
    setDate(getTodayPersianDate());
    setMethod('شبا / پایا');

    const defaultBank = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    setBankAccountId(defaultBank?.id || '');
    setTrackingCode('');
    setNotes('');
  }, [isOpen, lockedProjectId, filterClientId]);

  // When project changes, auto-fill remaining balance!
  const handleProjectChange = (nextProjectId: string) => {
    setProjectId(nextProjectId);
    setErrorMsg('');
    const stats = nextProjectId ? getProjectStats(nextProjectId) : null;
    const rem = stats ? stats.remainingBalance : 0;
    setAmount(rem > 0 ? String(rem) : '');
  };

  if (!isOpen) return null;

  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);
  const numericAmount = Number(amount) || 0;
  const isOverLimit = numericAmount > remainingBalance;

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

    if (!projectId) {
      setErrorMsg('لطفاً پروژه مربوطه را انتخاب کنید.');
      return;
    }
    if (remainingBalance <= 0) {
      setErrorMsg('این پروژه به صورت کامل تسویه شده است و امکان ثبت دریافتی جدید وجود ندارد.');
      return;
    }
    if (numericAmount <= 0) {
      setErrorMsg('مبلغ دریافتی باید بیشتر از صفر باشد.');
      return;
    }
    if (numericAmount > remainingBalance) {
      setErrorMsg(`مبلغ واردشده نمی‌تواند بیشتر از مانده طلب (${formatPrice(remainingBalance)} تومان) باشد.`);
      return;
    }
    if (!bankAccountId) {
      setErrorMsg('لطفاً کارت یا حساب بانکی مقصد واریز را انتخاب کنید.');
      return;
    }

    const proj = projects.find((p) => p.id === projectId);
    const bankLabel = selectedBank
      ? `${selectedBank.bankName} - ${selectedBank.accountHolder}${
          selectedBank.cardNumber ? ` (${formatCardNumber(selectedBank.cardNumber)})` : ''
        }`
      : '';

    addPayment({
      projectId,
      projectName: proj?.title,
      clientId: proj?.clientId,
      clientName: proj?.clientName,
      title: title.trim() || 'دریافتی جدید',
      amount: numericAmount,
      date,
      method,
      bankAccountId,
      bankAccountLabel: bankLabel,
      trackingCode: trackingCode.trim() || undefined,
      status: 'completed',
      notes: notes.trim() || undefined
    });

    onClose();
  };

  const projectOptions = eligibleProjects.map((p) => {
    const st = getProjectStats(p.id);
    return {
      value: p.id,
      label: p.title,
      sublabel: `${p.clientName || ''} • مانده: ${formatPrice(st.remainingBalance)} تومان`
    };
  });

  const bankOptions = bankAccounts.map((b) => ({
    value: b.id,
    label: `${b.bankName} — ${b.accountHolder}`,
    sublabel: b.cardNumber
      ? `کارت: ${formatCardNumber(b.cardNumber)}${b.iban ? ` | شبا: ${b.iban}` : ''}`
      : b.iban
      ? `شبا: ${b.iban}`
      : b.type
  }));

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-black text-slate-800">ثبت دریافت وجه جدید بابت پروژه</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              محاسبه خودکار مانده طلب و ثبت دقیق حساب / کارت مقصد واریز
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

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Project Selector */}
            {!lockedProjectId && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">پروژه مربوطه *</label>
                <CustomSelect
                  value={projectId}
                  onChange={handleProjectChange}
                  options={projectOptions}
                  searchable
                  placeholder="انتخاب پروژه..."
                />
              </div>
            )}

            {/* Live Financial Summary Strip for Selected Project */}
            {selectedProjectStats && (
              <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">مبلغ قرارداد</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {formatPrice(selectedProjectStats.contractValue)} تومان
                  </span>
                </div>
                <div className="border-r border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-600 block">دریافتی تا کنون</span>
                  <span className="text-xs font-black text-emerald-700 tabular-nums">
                    {formatPrice(selectedProjectStats.totalPaid)} تومان
                  </span>
                </div>
                <div className="border-r border-slate-200">
                  <span className="text-[10px] font-bold text-rose-600 block">سقف مجاز (مانده طلب)</span>
                  <span className="text-xs font-black text-rose-700 tabular-nums">
                    {formatPrice(remainingBalance)} تومان
                  </span>
                </div>
              </div>
            )}

            {remainingBalance <= 0 && projectId && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>این پروژه به صورت کامل تسویه شده است و هیچ مانده طلبی ندارد.</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">عنوان واریزی / بابت چه مرحله‌ای *</label>
              <input
                type="text"
                required
                disabled={remainingBalance <= 0}
                placeholder="مثلاً: قسط دوم پس از تایید نسخه دمو"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 disabled:opacity-60"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">مبلغ دریافتی *</label>
                  {remainingBalance > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAmount(String(Math.round(remainingBalance * 0.5)))}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer"
                      >
                        ۵۰٪
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmount(String(remainingBalance))}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md cursor-pointer"
                      >
                        کل مانده
                      </button>
                    </div>
                  )}
                </div>
                <FormattedNumberInput
                  required
                  disabled={remainingBalance <= 0}
                  value={amount}
                  max={remainingBalance}
                  onChange={(val) => {
                    setAmount(val);
                    setErrorMsg('');
                  }}
                  placeholder={`حداکثر ${formatPrice(remainingBalance)}`}
                  suffix="تومان"
                  className={isOverLimit ? 'border-rose-400 focus:border-rose-500' : ''}
                />
                {remainingBalance > 0 && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    مانده پس از این واریز:{' '}
                    <span className="text-slate-700 tabular-nums">
                      {formatPrice(Math.max(0, remainingBalance - numericAmount))} تومان
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تاریخ دریافت (شمسی) *</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={date}
                  onChange={(d) => setDate(d?.format?.('YYYY/MM/DD') || '')}
                  inputClass="rmdp-input"
                />
              </div>
            </div>

            {/* Payment Method + Tracking Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">روش پرداخت *</label>
                <CustomSelect
                  value={method}
                  onChange={(val) => setMethod(val as any)}
                  options={PAYMENT_METHODS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">کد رهگیری / شماره پیگیری</label>
                <input
                  type="text"
                  placeholder="TRX-1403..."
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                />
              </div>
            </div>

            {/* Destination Bank Card / Account (Always Shown Regardless of Payment Method) */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-indigo-600" />
                  کارت / حساب مقصد واریز ({method}) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickBankForm((prev) => !prev)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> {showQuickBankForm ? 'بستن فرم حساب جدید' : 'افزودن کارت / حساب جدید'}
                </button>
              </div>

              <CustomSelect
                value={bankAccountId}
                onChange={setBankAccountId}
                options={bankOptions}
                buttonClassName="bg-white border-indigo-200"
                placeholder="انتخاب کارت یا حساب مقصد..."
              />

              {selectedBank && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 bg-white px-3 py-2 rounded-xl border border-indigo-100/80">
                  <span className="font-bold text-slate-800">{selectedBank.bankName}</span>
                  <span>صاحب حساب: {selectedBank.accountHolder}</span>
                  {selectedBank.cardNumber && (
                    <span dir="ltr" className="font-bold text-indigo-700 tabular-nums">
                      {formatCardNumber(selectedBank.cardNumber)}
                    </span>
                  )}
                  {selectedBank.iban && (
                    <span dir="ltr" className="text-slate-500 tabular-nums">
                      {toPersianDigits(selectedBank.iban)}
                    </span>
                  )}
                </div>
              )}

              {showQuickBankForm && (
                <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="نام بانک / صندوق (مثلاً: بانک سامان)"
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
                      placeholder="شماره کارت ۱۶ رقمی (اختیاری)"
                      value={quickCardNumber}
                      onChange={(e) => setQuickCardNumber(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="شماره شبا IR... (اختیاری)"
                      value={quickIban}
                      onChange={(e) => setQuickIban(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddBank}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ذخیره و انتخاب این حساب
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">یادداشت تکمیلی</label>
              <textarea
                rows={2}
                placeholder="توضیحات فاکتور یا جزئیات واریز..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={remainingBalance <= 0 || numericAmount <= 0 || isOverLimit}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
              >
                ثبت دریافتی ({formatPrice(numericAmount)} تومان)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentFormModal;
