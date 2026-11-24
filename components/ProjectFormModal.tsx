import React, { useState, useEffect } from 'react';
import { X, UserCheck, Settings2 } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { Project, ProjectStatus } from '../types';
import {
  toPersianDigits,
  formatPrice,
  getTodayPersianDate,
  STATUS_COLOR_STYLES
} from '../constants';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';
import TechStackSelector from './TechStackSelector';
import OptionManagerModal from './OptionManagerModal';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject?: Project | null;
  lockedClientId?: string;
  onSaved?: (project: Project) => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  editingProject = null,
  lockedClientId,
  onSaved
}) => {
  const {
    clients,
    projectCategories,
    projectStatuses,
    techStacks,
    addProject,
    updateProject,
    addExpense,
    addProjectCategory,
    updateProjectCategory,
    deleteProjectCategory,
    addProjectStatus,
    updateProjectStatus,
    deleteProjectStatus,
    addTechStack
  } = useData();

  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [manageStatusesOpen, setManageStatusesOpen] = useState(false);

  const [form, setForm] = useState({
    clientId: lockedClientId || clients[0]?.id || '',
    title: '',
    category: projectCategories[0] || 'وب‌اپلیکیشن',
    description: '',
    stack: [] as string[],
    status: projectStatuses[1]?.id || ProjectStatus.Active,
    progress: 10,
    baseContractValue: '',
    discountType: 'amount' as 'amount' | 'percent',
    discountValue: '',
    taxRate: '0',
    startDate: getTodayPersianDate(),
    deadline: '1403/08/30',
    liveUrl: '',
    repoUrl: '',
    figmaUrl: '',
    notes: '',
    referrerName: '',
    commissionRate: '',
    commissionAmount: '',
    autoRegisterCommission: true
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingProject) {
      const baseVal =
        editingProject.baseContractValue && editingProject.baseContractValue > 0
          ? editingProject.baseContractValue
          : editingProject.contractValue;
      setForm({
        clientId: editingProject.clientId,
        title: editingProject.title,
        category: editingProject.category || projectCategories[0] || 'وب‌اپلیکیشن',
        description: editingProject.description || '',
        stack: editingProject.stack || [],
        status: editingProject.status || projectStatuses[0]?.id || ProjectStatus.Active,
        progress: editingProject.progress || 0,
        baseContractValue: String(baseVal || ''),
        discountType: editingProject.discountType || 'amount',
        discountValue: editingProject.discountValue
          ? String(editingProject.discountValue)
          : editingProject.discountAmount
          ? String(editingProject.discountAmount)
          : '',
        taxRate: editingProject.taxRate ? String(editingProject.taxRate) : '0',
        startDate: editingProject.startDate || getTodayPersianDate(),
        deadline: editingProject.deadline || getTodayPersianDate(),
        liveUrl: editingProject.liveUrl || '',
        repoUrl: editingProject.repoUrl || '',
        figmaUrl: editingProject.figmaUrl || '',
        notes: editingProject.notes || '',
        referrerName: editingProject.referrerName || '',
        commissionRate: editingProject.commissionRate ? String(editingProject.commissionRate) : '',
        commissionAmount: editingProject.commissionAmount ? String(editingProject.commissionAmount) : '',
        autoRegisterCommission: false
      });
    } else {
      setForm({
        clientId: lockedClientId || clients[0]?.id || '',
        title: '',
        category: projectCategories[0] || 'وب‌اپلیکیشن',
        description: '',
        stack: [],
        status: projectStatuses.find((s) => s.id === ProjectStatus.Active)?.id || projectStatuses[0]?.id || ProjectStatus.Active,
        progress: 10,
        baseContractValue: '',
        discountType: 'amount',
        discountValue: '',
        taxRate: '0',
        startDate: getTodayPersianDate(),
        deadline: '1403/09/30',
        liveUrl: '',
        repoUrl: '',
        figmaUrl: '',
        notes: '',
        referrerName: '',
        commissionRate: '',
        commissionAmount: '',
        autoRegisterCommission: true
      });
    }
  }, [isOpen, editingProject, lockedClientId]);

  if (!isOpen) return null;

  // Live financial calculation: Base - Discount + Tax = Final Contract Value
  const baseContractNum = Math.max(0, Number(form.baseContractValue) || 0);
  const rawDiscountNum = Math.max(0, Number(form.discountValue) || 0);
  const computedDiscountAmount =
    form.discountType === 'percent'
      ? Math.round((baseContractNum * Math.min(100, rawDiscountNum)) / 100)
      : Math.min(baseContractNum, rawDiscountNum);
  const taxableSubtotal = Math.max(0, baseContractNum - computedDiscountAmount);
  const taxRateNum = Math.max(0, Math.min(100, Number(form.taxRate) || 0));
  const computedTaxAmount = Math.round((taxableSubtotal * taxRateNum) / 100);
  const finalContractValue = taxableSubtotal + computedTaxAmount;

  const recalcCommissionFor = (nextFinal: number, rateStr: string, prevAmt: string) => {
    const r = Number(rateStr) || 0;
    return r > 0 && nextFinal > 0 ? String(Math.round((nextFinal * r) / 100)) : prevAmt;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === form.clientId);
    const contractVal = finalContractValue;
    const commRate = form.commissionRate ? Number(form.commissionRate) : undefined;
    const commAmt = form.commissionAmount
      ? Number(form.commissionAmount)
      : commRate && contractVal
      ? Math.round((contractVal * commRate) / 100)
      : undefined;

    if (editingProject) {
      const updates: Partial<Project> = {
        clientId: form.clientId,
        clientName: client ? `${client.name} (${client.company})` : editingProject.clientName,
        title: form.title,
        category: form.category,
        description: form.description,
        stack: form.stack.length > 0 ? form.stack : editingProject.stack,
        status: form.status,
        progress: Number(form.progress),
        baseContractValue: baseContractNum,
        discountType: form.discountType,
        discountValue: rawDiscountNum,
        discountAmount: computedDiscountAmount,
        taxRate: taxRateNum,
        taxAmount: computedTaxAmount,
        contractValue: contractVal,
        startDate: form.startDate,
        deadline: form.deadline,
        liveUrl: form.liveUrl,
        repoUrl: form.repoUrl,
        figmaUrl: form.figmaUrl,
        notes: form.notes,
        referrerName: form.referrerName || undefined,
        commissionRate: commRate,
        commissionAmount: commAmt
      };
      updateProject(editingProject.id, updates);
      if (onSaved) onSaved({ ...editingProject, ...updates });
    } else {
      const created = addProject({
        clientId: form.clientId,
        clientName: client ? `${client.name} (${client.company})` : '',
        title: form.title,
        category: form.category,
        description: form.description,
        stack: form.stack.length > 0 ? form.stack : ['React', 'Node.js'],
        status: form.status,
        progress: form.status === ProjectStatus.Delivered ? 100 : Number(form.progress),
        baseContractValue: baseContractNum,
        discountType: form.discountType,
        discountValue: rawDiscountNum,
        discountAmount: computedDiscountAmount,
        taxRate: taxRateNum,
        taxAmount: computedTaxAmount,
        contractValue: contractVal,
        startDate: form.startDate,
        deadline: form.deadline,
        liveUrl: form.liveUrl,
        repoUrl: form.repoUrl,
        figmaUrl: form.figmaUrl,
        notes: form.notes,
        referrerName: form.referrerName || undefined,
        commissionRate: commRate,
        commissionAmount: commAmt,
        milestones: [
          {
            id: `m-${Date.now()}-1`,
            title: 'تحلیل نیازمندی‌ها و تایید طراحی UI/UX',
            date: form.startDate,
            isCompleted: true
          },
          {
            id: `m-${Date.now()}-2`,
            title: 'پیاده‌سازی هسته اصلی و تحویل نسخه نهایی',
            date: form.deadline,
            isCompleted: false
          }
        ]
      });

      if (form.autoRegisterCommission && form.referrerName && commAmt && commAmt > 0) {
        addExpense({
          projectId: created.id,
          projectName: created.title,
          clientId: created.clientId,
          clientName: created.clientName,
          type: 'commission',
          title: `پورسانت معرفی پروژه (${form.referrerName})`,
          provider: `${form.referrerName} (معرف)`,
          recipientName: form.referrerName,
          commissionRate: commRate,
          paymentStatus: 'paid',
          purchaseCost: commAmt,
          purchaseDate: form.startDate,
          purchaseTime: '12:00',
          expirationDate: '',
          billingCycle: 'one-time',
          status: 'active',
          credentialsNotes: `پورسانت معرفی ثبت شده هنگام تعریف پروژه - معرف: ${form.referrerName}${
            commRate ? ` (${toPersianDigits(commRate)}٪)` : ''
          }`
        });
      }

      if (onSaved) onSaved(created);
    }
    onClose();
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.company})`
  }));

  const categoryOptions = projectCategories.map((cat) => ({
    value: cat,
    label: cat
  }));

  const statusOptions = projectStatuses.map((st) => ({
    value: st.id,
    label: st.label,
    dotColorClass: (STATUS_COLOR_STYLES[st.color] || STATUS_COLOR_STYLES.slate).dot
  }));

  const lockedClient = lockedClientId ? clients.find((c) => c.id === lockedClientId) : null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {editingProject ? `ویرایش پروژه: ${editingProject.title}` : 'تعریف پروژه جدید'}
              </h3>
              {lockedClient && !editingProject && (
                <p className="text-xs text-indigo-600 font-bold mt-0.5">
                  اختصاص مستقیم به کارفرما: {lockedClient.name} ({lockedClient.company})
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">عنوان پروژه *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: سامانه پورتال آموزشی آنلاین"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">انتخاب کارفرما / مشتری *</label>
                  <CustomSelect
                    value={form.clientId}
                    onChange={(val) => setForm({ ...form, clientId: val })}
                    options={clientOptions}
                    searchable
                    disabled={Boolean(lockedClientId)}
                    placeholder="انتخاب کارفرما..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Editable Project Category */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">دسته‌بندی پروژه</label>
                    <button
                      type="button"
                      onClick={() => setManageCategoriesOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Settings2 size={11} /> تعریف / ویرایش
                    </button>
                  </div>
                  <CustomSelect
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    options={categoryOptions}
                  />
                </div>

                {/* Editable Project Status */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">وضعیت پروژه</label>
                    <button
                      type="button"
                      onClick={() => setManageStatusesOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Settings2 size={11} /> تعریف / ویرایش
                    </button>
                  </div>
                  <CustomSelect
                    value={form.status}
                    onChange={(val) => setForm({ ...form, status: val })}
                    options={statusOptions}
                  />
                </div>
              </div>

              {/* Contract Pricing: Base - Discount + VAT Tax = Final Value */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800">
                    محاسبه مالی قرارداد (مبلغ پایه، تخفیف و مالیات)
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    تخفیف کسر و مالیات به مبلغ نهایی اضافه می‌شود
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Base Contract Value */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">مبلغ پایه قرارداد *</label>
                    <FormattedNumberInput
                      required
                      value={form.baseContractValue}
                      onChange={(val) => {
                        const nextBase = Math.max(0, Number(val) || 0);
                        const rawDisc = Math.max(0, Number(form.discountValue) || 0);
                        const nextDisc =
                          form.discountType === 'percent'
                            ? Math.round((nextBase * Math.min(100, rawDisc)) / 100)
                            : Math.min(nextBase, rawDisc);
                        const nextTax = Math.round(
                          (Math.max(0, nextBase - nextDisc) * (Number(form.taxRate) || 0)) / 100
                        );
                        const nextFinal = Math.max(0, nextBase - nextDisc) + nextTax;
                        setForm({
                          ...form,
                          baseContractValue: val,
                          commissionAmount: recalcCommissionFor(
                            nextFinal,
                            form.commissionRate,
                            form.commissionAmount
                          )
                        });
                      }}
                      placeholder="مثلاً: ۱۲۰,۰۰۰,۰۰۰"
                      suffix="تومان"
                      className="bg-white"
                    />
                  </div>

                  {/* Discount (Subtracted) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-rose-700">تخفیف (کسر می‌شود)</label>
                      <div className="flex items-center gap-0.5 bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, discountType: 'amount', discountValue: '' })}
                          className={`px-2 py-0.5 rounded-md cursor-pointer ${
                            form.discountType === 'amount'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600'
                          }`}
                        >
                          تومان
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, discountType: 'percent', discountValue: '' })}
                          className={`px-2 py-0.5 rounded-md cursor-pointer ${
                            form.discountType === 'percent'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600'
                          }`}
                        >
                          درصد
                        </button>
                      </div>
                    </div>
                    <FormattedNumberInput
                      value={form.discountValue}
                      max={form.discountType === 'percent' ? 100 : undefined}
                      onChange={(val) => setForm({ ...form, discountValue: val })}
                      placeholder="۰"
                      suffix={form.discountType === 'percent' ? '٪' : 'تومان'}
                      className="bg-white"
                    />
                  </div>

                  {/* VAT / Tax (Added) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-800">مالیات (اضافه می‌شود)</label>
                      <div className="flex items-center gap-1">
                        {['0', '9', '10'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setForm({ ...form, taxRate: preset })}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              form.taxRate === preset
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {toPersianDigits(preset)}٪
                          </button>
                        ))}
                      </div>
                    </div>
                    <FormattedNumberInput
                      value={form.taxRate}
                      max={100}
                      onChange={(val) => setForm({ ...form, taxRate: val })}
                      placeholder="۰"
                      suffix="٪"
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Live Calculation Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-slate-200/70 text-[11px] tabular-nums">
                  <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/70">
                    <span className="text-slate-400 block">مبلغ پایه</span>
                    <strong className="font-black text-slate-800">{formatPrice(baseContractNum)}</strong>
                  </div>
                  <div className="bg-rose-50/70 px-3 py-2 rounded-xl border border-rose-200/70">
                    <span className="text-rose-600 block">کسر تخفیف</span>
                    <strong className="font-black text-rose-700">
                      {computedDiscountAmount > 0 ? `${formatPrice(computedDiscountAmount)}-` : '۰'}
                    </strong>
                  </div>
                  <div className="bg-emerald-50/70 px-3 py-2 rounded-xl border border-emerald-200/70">
                    <span className="text-emerald-700 block">
                      افزودن مالیات ({toPersianDigits(taxRateNum)}٪)
                    </span>
                    <strong className="font-black text-emerald-800">
                      {computedTaxAmount > 0 ? `+${formatPrice(computedTaxAmount)}` : '۰'}
                    </strong>
                  </div>
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-xl">
                    <span className="text-slate-300 block">مبلغ نهایی قرارداد</span>
                    <strong className="font-black text-[#2CE2D2]">
                      {formatPrice(finalContractValue)} تومان
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dates & Progress */}
              <div className={`grid grid-cols-1 ${editingProject ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تاریخ شروع (شمسی)</label>
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={form.startDate}
                    onChange={(d) => setForm({ ...form, startDate: d?.format?.('YYYY/MM/DD') || '' })}
                    inputClass="rmdp-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">موعد تحویل نهایی (شمسی)</label>
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={form.deadline}
                    onChange={(d) => setForm({ ...form, deadline: d?.format?.('YYYY/MM/DD') || '' })}
                    inputClass="rmdp-input"
                  />
                </div>

                {editingProject && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      درصد پیشرفت ({toPersianDigits(form.progress)}٪)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600 mt-3"
                      value={form.progress}
                      onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              {/* Tech Stack Picker + Custom Add */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  تکنولوژی‌ها و استک فنی (از لیست انتخاب کنید یا مورد جدید بنویسید)
                </label>
                <TechStackSelector
                  selected={form.stack}
                  availableTechs={techStacks}
                  onChange={(next) => setForm({ ...form, stack: next })}
                  onAddNewTech={(tech) => addTechStack(tech)}
                />
              </div>

              {/* Optional External Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">لینک سایت آنلاین</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    value={form.liveUrl}
                    onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">لینک ریپازیتوری</label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    dir="ltr"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    value={form.repoUrl}
                    onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">لینک طرح فیگما</label>
                  <input
                    type="text"
                    placeholder="https://figma.com/..."
                    dir="ltr"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    value={form.figmaUrl}
                    onChange={(e) => setForm({ ...form, figmaUrl: e.target.value })}
                  />
                </div>
              </div>

              {/* Marketing & Referrer Commission */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-purple-700" />
                  <span className="text-xs font-bold text-purple-900">اطلاعات معرف و پورسانت بازاریابی (اختیاری)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">نام معرف پروژه</label>
                    <input
                      type="text"
                      placeholder="مثلاً: مهندس رضایی"
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs outline-none focus:border-purple-500"
                      value={form.referrerName}
                      onChange={(e) => setForm({ ...form, referrerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">درصد پورسانت</label>
                    <FormattedNumberInput
                      value={form.commissionRate}
                      max={100}
                      suffix="٪"
                      placeholder="مثلاً: ۱۰"
                      className="bg-white border-purple-200"
                      onChange={(rate) => {
                        const contractVal = finalContractValue;
                        const autoAmt =
                          rate && contractVal
                            ? String(Math.round((contractVal * Number(rate)) / 100))
                            : form.commissionAmount;
                        setForm({ ...form, commissionRate: rate, commissionAmount: autoAmt });
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">مبلغ پورسانت</label>
                    <FormattedNumberInput
                      value={form.commissionAmount}
                      suffix="تومان"
                      placeholder="محاسبه خودکار"
                      className="bg-white border-purple-200 text-purple-700"
                      onChange={(val) => setForm({ ...form, commissionAmount: val })}
                    />
                  </div>
                </div>

                {!editingProject && form.referrerName && (
                  <label className="flex items-center gap-2 pt-1 text-[11px] text-purple-900 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.autoRegisterCommission}
                      onChange={(e) => setForm({ ...form, autoRegisterCommission: e.target.checked })}
                      className="rounded text-purple-600 accent-purple-600 cursor-pointer"
                    />
                    ثبت خودکار پورسانت ({formatPrice(Number(form.commissionAmount) || 0)} تومان) در هزینه‌های پروژه
                  </label>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">شرح مختصر و اهداف پروژه</label>
                <textarea
                  rows={3}
                  placeholder="توضیحاتی در مورد معماری، ماژول‌ها و نیازمندی‌های کارفرما..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 cursor-pointer"
                >
                  {editingProject ? 'ذخیره تغییرات پروژه' : 'ثبت و ایجاد پروژه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Inline Manage Categories Modal */}
      <OptionManagerModal
        mode="string"
        isOpen={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
        title="مدیریت دسته‌بندی‌های پروژه"
        subtitle="افزودن، ویرایش یا حذف دسته‌بندی‌ها برای تمامی پروژه‌ها"
        items={projectCategories}
        onAdd={addProjectCategory}
        onUpdate={updateProjectCategory}
        onDelete={deleteProjectCategory}
      />

      {/* Inline Manage Project Statuses Modal */}
      <OptionManagerModal
        mode="status"
        isOpen={manageStatusesOpen}
        onClose={() => setManageStatusesOpen(false)}
        title="مدیریت وضعیت‌های پروژه"
        subtitle="تعریف، تغییر نام یا رنگ‌بندی وضعیت‌های چرخه پروژه"
        items={projectStatuses}
        onAdd={addProjectStatus}
        onUpdate={updateProjectStatus}
        onDelete={deleteProjectStatus}
      />
    </>
  );
};

export default ProjectFormModal;
