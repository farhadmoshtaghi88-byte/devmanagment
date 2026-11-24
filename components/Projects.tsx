import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Briefcase,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  AlertCircle,
  ExternalLink,
  Github,
  Figma,
  Globe,
  Server,
  CreditCard,
  TrendingUp,
  Trash2,
  Edit2,
  Layers,
  CheckSquare,
  Receipt,
  UserCheck,
  FileText,
  ArrowRight,
  Settings2,
  Wallet,
  Calculator,
  Building2,
  Check,
  Package
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { Project, ProjectPayment, InfrastructureItem } from '../types';
import {
  toPersianDigits,
  formatPrice,
  STATUS_COLOR_STYLES,
  getTodayPersianDate
} from '../constants';
import ConfirmModal from './ConfirmModal';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';
import OptionManagerModal from './OptionManagerModal';
import ProjectFormModal from './ProjectFormModal';
import PaymentFormModal from './PaymentFormModal';
import ConvertProjectToProductModal from './ConvertProjectToProductModal';
import InvoicePreviewModal from './InvoicePreviewModal';

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
      <div
        className={`bg-white rounded-3xl w-full ${maxWidth} max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100`}
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

const Projects: React.FC = () => {
  const {
    projects,
    products,
    projectStatuses,
    expenseCategories,
    expenseTypes,
    deleteProject,
    toggleMilestone,
    addMilestone,
    deletePayment,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleTaskStatus,
    addProjectStatus,
    updateProjectStatus,
    deleteProjectStatus,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
    buildInvoiceFromProject,
    getProjectStats,
    selectedProjectIdForView,
    setSelectedProjectIdForView,
    setSelectedProductIdForView,
    setActiveTab,
    navResetCount,
    setSelectedClientIdForView
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(selectedProjectIdForView);
  const [activeDetailTab, setActiveDetailTab] = useState<
    'overview' | 'finance' | 'infrastructure' | 'milestones' | 'tasks'
  >('overview');
  const [expenseTabFilter, setExpenseTabFilter] = useState<'all' | 'commission' | 'infra' | 'other'>('all');

  useEffect(() => {
    if (selectedProjectIdForView) {
      setSelectedProjectId(selectedProjectIdForView);
      setSelectedProjectIdForView(null);
    }
  }, [selectedProjectIdForView, setSelectedProjectIdForView]);

  const lastNavResetRef = useRef(navResetCount);
  useEffect(() => {
    if (navResetCount !== lastNavResetRef.current) {
      lastNavResetRef.current = navResetCount;
      setSelectedProjectId(null);
    }
  }, [navResetCount]);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  // Modals
  const [projectFormModal, setProjectFormModal] = useState<{ open: boolean; editing: Project | null }>({
    open: false,
    editing: null
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);
  const [isExpenseCatManagerOpen, setIsExpenseCatManagerOpen] = useState(false);
  const [isExpenseTypeManagerOpen, setIsExpenseTypeManagerOpen] = useState(false);
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [isConvertToProductOpen, setIsConvertToProductOpen] = useState(false);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);

  // Add / Edit Expense Modal
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; editing: InfrastructureItem | null }>({
    open: false,
    editing: null
  });
  const [expenseForm, setExpenseForm] = useState({
    type: 'other' as string,
    categoryTitle: expenseCategories[0] || 'طراحی گرافیک و UI',
    title: '',
    provider: '',
    recipientName: '',
    commissionRate: '',
    purchaseCost: '',
    purchaseDate: getTodayPersianDate(),
    expirationDate: '',
    billingCycle: 'one-time' as 'monthly' | 'quarterly' | 'annual' | 'one-time',
    paymentStatus: 'paid' as 'paid' | 'pending',
    ip: '',
    specs: '',
    credentialsNotes: ''
  });

  // Add Milestone form
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    date: getTodayPersianDate(),
    description: ''
  });

  // Delete targets
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<ProjectPayment | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<InfrastructureItem | null>(null);

  const getStatusMeta = (statusId: string) => {
    const found = projectStatuses.find((s) => s.id === statusId || s.label === statusId);
    const tone = found ? STATUS_COLOR_STYLES[found.color] || STATUS_COLOR_STYLES.slate : STATUS_COLOR_STYLES.slate;
    return {
      label: found?.label || statusId,
      style: tone
    };
  };

  const openProjectDetail = (project: Project) => {
    setSelectedProjectId(project.id);
    setSelectedProjectIdForView(project.id);
    setActiveDetailTab('overview');
  };

  const closeProjectDetail = () => {
    setSelectedProjectId(null);
    setSelectedProjectIdForView(null);
  };

  const jumpToClient = (clientId: string) => {
    closeProjectDetail();
    setSelectedClientIdForView(clientId);
    setActiveTab('clients');
  };

  const openExpenseModalForNew = (
    presetType: 'other' | 'commission' | 'server' = 'other'
  ) => {
    setExpenseForm({
      type: presetType,
      categoryTitle: expenseCategories[0] || 'طراحی گرافیک و UI',
      title: presetType === 'commission' ? 'پورسانت معرفی پروژه' : '',
      provider: presetType === 'server' ? 'آروان‌کلود' : '',
      recipientName: selectedProject?.referrerName || '',
      commissionRate: selectedProject?.commissionRate ? String(selectedProject.commissionRate) : '',
      purchaseCost:
        presetType === 'commission' && selectedProject?.commissionAmount
          ? String(selectedProject.commissionAmount)
          : '',
      purchaseDate: getTodayPersianDate(),
      expirationDate: '',
      billingCycle: presetType === 'server' ? 'monthly' : 'one-time',
      paymentStatus: 'paid',
      ip: '',
      specs: '',
      credentialsNotes: ''
    });
    setExpenseModal({ open: true, editing: null });
  };

  const openExpenseModalForEdit = (exp: InfrastructureItem) => {
    setExpenseForm({
      type: exp.type,
      categoryTitle: exp.categoryTitle || expenseCategories[0] || 'طراحی گرافیک و UI',
      title: exp.title,
      provider: exp.provider || '',
      recipientName: exp.recipientName || '',
      commissionRate: exp.commissionRate ? String(exp.commissionRate) : '',
      purchaseCost: String(exp.purchaseCost || ''),
      purchaseDate: exp.purchaseDate || getTodayPersianDate(),
      expirationDate: exp.expirationDate || '',
      billingCycle: exp.billingCycle || 'one-time',
      paymentStatus: exp.paymentStatus || 'paid',
      ip: exp.ip || '',
      specs: exp.specs || '',
      credentialsNotes: exp.credentialsNotes || ''
    });
    setExpenseModal({ open: true, editing: exp });
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const payload = {
      projectId: selectedProject.id,
      projectName: selectedProject.title,
      clientId: selectedProject.clientId,
      clientName: selectedProject.clientName,
      type: expenseForm.type,
      categoryTitle: expenseForm.type === 'other' ? expenseForm.categoryTitle : undefined,
      title: expenseForm.title,
      provider:
        expenseForm.provider ||
        (expenseForm.type === 'commission'
          ? `${expenseForm.recipientName || 'معرف'} (پورسانت)`
          : expenseForm.type === 'other'
          ? expenseForm.categoryTitle
          : 'تامین‌کننده'),
      recipientName: expenseForm.type === 'commission' ? expenseForm.recipientName : undefined,
      commissionRate:
        expenseForm.type === 'commission' && expenseForm.commissionRate
          ? Number(expenseForm.commissionRate)
          : undefined,
      purchaseCost: Number(expenseForm.purchaseCost) || 0,
      purchaseDate: expenseForm.purchaseDate || getTodayPersianDate(),
      expirationDate: expenseForm.expirationDate || '',
      billingCycle: expenseForm.billingCycle,
      paymentStatus: expenseForm.paymentStatus,
      ip: expenseForm.type === 'server' ? expenseForm.ip : undefined,
      specs: expenseForm.type === 'server' ? expenseForm.specs : undefined,
      status: 'active' as const,
      credentialsNotes: expenseForm.credentialsNotes
    };

    if (expenseModal.editing) {
      updateExpense(expenseModal.editing.id, payload);
    } else {
      addExpense(payload);
    }
    setExpenseModal({ open: false, editing: null });
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !milestoneForm.title.trim()) return;
    addMilestone(selectedProject.id, {
      title: milestoneForm.title.trim(),
      date: milestoneForm.date || getTodayPersianDate(),
      description: milestoneForm.description.trim() || undefined
    });
    setIsAddMilestoneModalOpen(false);
    setMilestoneForm({ title: '', date: getTodayPersianDate(), description: '' });
  };

  // Filtered projects sorted newest first!
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          p.title.toLowerCase().includes(q) ||
          (p.clientName || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.stack || []).some((st) => st.toLowerCase().includes(q));
        const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
  }, [projects, searchTerm, activeFilter]);

  const expenseTypeOptions = expenseTypes.map((et) => ({
    value: et.id,
    label: et.label,
    dotColorClass: (STATUS_COLOR_STYLES[et.color] || STATUS_COLOR_STYLES.slate).dot
  }));

  const expenseCategoryOptions = expenseCategories.map((c) => ({ value: c, label: c }));

  const billingCycleOptions = [
    { value: 'one-time', label: 'یک‌باره' },
    { value: 'monthly', label: 'ماهانه' },
    { value: 'quarterly', label: 'فصلی (۳ ماهه)' },
    { value: 'annual', label: 'سالانه' }
  ];

  const paymentStatusOptions = [
    { value: 'paid', label: 'پرداخت و تسویه شده', dotColorClass: 'bg-emerald-500' },
    { value: 'pending', label: 'در انتظار پرداخت (تعهدی)', dotColorClass: 'bg-amber-500' }
  ];

  const getExpenseTypeBadge = (exp: InfrastructureItem) => {
    if (exp.type === 'other' && exp.categoryTitle) {
      return {
        label: exp.categoryTitle,
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    const configured = expenseTypes.find((et) => et.id === exp.type || et.label === exp.type);
    if (configured) {
      const style = STATUS_COLOR_STYLES[configured.color] || STATUS_COLOR_STYLES.slate;
      return {
        label: configured.label,
        className: style.badge
      };
    }
    return {
      label: exp.categoryTitle || exp.type || 'سایر هزینه‌ها',
      className: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    };
  };

  // =========================================================================
  // PROJECT DETAIL VIEW
  // =========================================================================
  if (selectedProject) {
    const stats = getProjectStats(selectedProject.id);
    const statusMeta = getStatusMeta(selectedProject.status);
    const linkedProduct = selectedProject.convertedProductId
      ? products.find((p) => p.id === selectedProject.convertedProductId) || null
      : null;

    const jumpToProduct = (productId: string) => {
      setSelectedProductIdForView(productId);
      setActiveTab('products');
    };

    const projectExpensesSorted = [...stats.expenses].sort(
      (a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)
    );
    const filteredProjectExpenses = projectExpensesSorted.filter((e) => {
      if (expenseTabFilter === 'commission') return e.type === 'commission';
      if (expenseTabFilter === 'infra') return e.type !== 'commission' && e.type !== 'other';
      if (expenseTabFilter === 'other') return e.type === 'other';
      return true;
    });

    const projectPaymentsSorted = [...stats.payments].sort(
      (a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)
    );

    return (
      <div className="space-y-5 pb-8 font-['Vazirmatn']">
        {/* Top Project Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeProjectDetail}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-700 cursor-pointer"
            >
              <ArrowRight size={15} />
              بازگشت به لیست پروژه‌ها
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setProjectFormModal({ open: true, editing: selectedProject })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-200 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Edit2 size={12} /> ویرایش
              </button>
              <button
                type="button"
                onClick={() => setProjectToDelete(selectedProject)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Trash2 size={12} /> حذف
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                    {selectedProject.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${statusMeta.style.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.style.dot}`} />
                    {statusMeta.label}
                  </span>
                  {linkedProduct && (
                    <button
                      type="button"
                      onClick={() => jumpToProduct(linkedProduct.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Package size={12} />
                      تبدیل‌شده به محصول: {linkedProduct.name}
                    </button>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                  {selectedProject.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => jumpToClient(selectedProject.clientId)}
                    className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline cursor-pointer"
                  >
                    <Building2 size={13} /> {selectedProject.clientName}
                  </button>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Calendar size={12} /> شروع: {toPersianDigits(selectedProject.startDate)}
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock size={12} /> تحویل: {toPersianDigits(selectedProject.deadline)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Wallet size={15} /> ثبت دریافت وجه جدید
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDetailTab('infrastructure');
                    openExpenseModalForNew('other');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Receipt size={15} /> ثبت هزینه پروژه
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoicePreviewOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap transition-colors"
                >
                  <FileText size={15} /> مشاهده فاکتور
                </button>
                {linkedProduct ? (
                  <button
                    type="button"
                    onClick={() => jumpToProduct(linkedProduct.id)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Package size={15} /> مشاهده محصول مرتبط
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConvertToProductOpen(true)}
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Package size={15} /> تبدیل به محصول
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">میزان پیشرفت اجرایی پروژه</span>
                <span className="text-indigo-700 tabular-nums">
                  {toPersianDigits(selectedProject.progress)}٪
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${selectedProject.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="px-5 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'نمای کلی و تکنولوژی‌ها', icon: FileText },
              { id: 'finance', label: `امور مالی و سود (${toPersianDigits(stats.payments.length)})`, icon: CreditCard },
              {
                id: 'infrastructure',
                label: `هزینه‌ها، پورسانت و زیرساخت (${toPersianDigits(stats.expenses.length)})`,
                icon: Layers
              },
              {
                id: 'milestones',
                label: `فازها و مایلستون‌ها (${toPersianDigits(selectedProject.milestones?.length || 0)})`,
                icon: CheckCircle2
              },
              { id: 'tasks', label: `تسک‌ها (${toPersianDigits(stats.tasks.length)})`, icon: CheckSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeDetailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeDetailTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-2">شرح پروژه و اهداف فنی</h3>
                <p className="text-xs text-slate-600 leading-7">
                  {selectedProject.description || 'توضیحی برای این پروژه ثبت نشده است.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-700 mb-2.5">تکنولوژی‌ها و استک فنی</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProject.stack || []).map((tech) => (
                    <span
                      key={tech}
                      dir="ltr"
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {(selectedProject.liveUrl || selectedProject.repoUrl || selectedProject.figmaUrl) && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2.5">
                  {selectedProject.liveUrl && (
                    <a
                      href={selectedProject.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-700 inline-flex items-center gap-1.5"
                    >
                      <Globe size={14} /> مشاهده نسخه آنلاین <ExternalLink size={12} />
                    </a>
                  )}
                  {selectedProject.repoUrl && (
                    <a
                      href={selectedProject.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
                    >
                      <Github size={14} /> ریپازیتوری کد <ExternalLink size={12} />
                    </a>
                  )}
                  {selectedProject.figmaUrl && (
                    <a
                      href={selectedProject.figmaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-purple-700 inline-flex items-center gap-1.5"
                    >
                      <Figma size={14} /> طرح رابط کاربری <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900">خلاصه مالی سریع</h3>
              <div className="space-y-2.5 text-xs tabular-nums">
                {((selectedProject.discountAmount || 0) > 0 || (selectedProject.taxAmount || 0) > 0) && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>مبلغ پایه قرارداد:</span>
                      <span className="font-bold text-slate-800">
                        {formatPrice(selectedProject.baseContractValue || stats.contractValue)} تومان
                      </span>
                    </div>
                    {(selectedProject.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>
                          تخفیف
                          {selectedProject.discountType === 'percent' && selectedProject.discountValue
                            ? ` (${toPersianDigits(selectedProject.discountValue)}٪)`
                            : ''}
                          :
                        </span>
                        <span className="font-bold">
                          {formatPrice(selectedProject.discountAmount)}- تومان
                        </span>
                      </div>
                    )}
                    {(selectedProject.taxAmount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>مالیات ({toPersianDigits(selectedProject.taxRate || 0)}٪):</span>
                        <span className="font-bold">+{formatPrice(selectedProject.taxAmount)} تومان</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 font-bold">مبلغ نهایی قرارداد</span>
                  <span className="font-black text-slate-900">{formatPrice(stats.contractValue)} تومان</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-emerald-50/70">
                  <span className="text-emerald-700 font-bold">دریافتی نقد</span>
                  <span className="font-black text-emerald-700">{formatPrice(stats.totalPaid)} تومان</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-rose-50/70">
                  <span className="text-rose-600 font-bold">مانده طلب</span>
                  <span className="font-black text-rose-700">{formatPrice(stats.remainingBalance)} تومان</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-amber-50/70">
                  <span className="text-amber-700 font-bold">کل هزینه‌ها</span>
                  <span className="font-black text-amber-800">{formatPrice(stats.totalExpenses)} تومان</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-indigo-600 text-white">
                  <span className="font-bold">سود خالص قرارداد</span>
                  <span className="font-black">{formatPrice(stats.netProfit)} تومان</span>
                </div>
              </div>
              {selectedProject.referrerName && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs">
                  <span className="text-purple-700 font-bold flex items-center gap-1">
                    <UserCheck size={13} /> معرف پروژه: {selectedProject.referrerName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACCURATE PROJECT FINANCE & PROFIT */}
        {activeDetailTab === 'finance' && (
          <div className="space-y-5">
            {/* 5 Transparent Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500">مبلغ کل قرارداد</span>
                <p className="text-lg font-black text-slate-900 mt-1.5 tabular-nums">
                  {formatPrice(stats.contractValue)}
                  <span className="text-[10px] font-bold text-slate-400 mr-1">تومان</span>
                </p>
                <span className="text-[10px] font-bold text-slate-400">ارزش مصوب قرارداد</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-emerald-700">دریافتی نقد</span>
                <p className="text-lg font-black text-emerald-700 mt-1.5 tabular-nums">
                  {formatPrice(stats.totalPaid)}
                  <span className="text-[10px] font-bold text-emerald-500 mr-1">تومان</span>
                </p>
                <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
                  {toPersianDigits(stats.paidPercentage)}٪ از کل قرارداد
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-rose-600">مانده حساب (طلب)</span>
                <p className="text-lg font-black text-rose-700 mt-1.5 tabular-nums">
                  {formatPrice(stats.remainingBalance)}
                  <span className="text-[10px] font-bold text-rose-400 mr-1">تومان</span>
                </p>
                <span className="text-[10px] font-bold text-slate-400">
                  قرارداد منهای دریافتی نقد
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-amber-700">کل هزینه‌های پروژه</span>
                <p className="text-lg font-black text-amber-800 mt-1.5 tabular-nums">
                  {formatPrice(stats.totalExpenses)}
                  <span className="text-[10px] font-bold text-amber-500 mr-1">تومان</span>
                </p>
                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                  پرداخت‌شده: {formatPrice(stats.paidExpenses)}
                </span>
              </div>

              <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-sm">
                <span className="text-[11px] font-bold text-indigo-100">سود خالص قرارداد</span>
                <p className="text-lg font-black mt-1.5 tabular-nums">
                  {formatPrice(stats.netProfit)}
                  <span className="text-[10px] font-bold text-indigo-200 mr-1">تومان</span>
                </p>
                <span className="text-[10px] font-bold text-indigo-100 tabular-nums">
                  تراز نقدی فعلی: {formatPrice(stats.cashNetProfit)}
                </span>
              </div>
            </div>

            {/* Transparent Formula Verification Strip */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Calculator size={16} className="text-indigo-600 shrink-0" />
                <span>شفافیت محاسبه سود:</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-bold text-slate-600 tabular-nums">
                <span>
                  سود خالص قرارداد:{' '}
                  <strong className="text-slate-900">
                    {formatPrice(stats.contractValue)} − {formatPrice(stats.totalExpenses)} ={' '}
                    {formatPrice(stats.netProfit)} تومان
                  </strong>
                </span>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <span>
                  تراز نقدی فعلی (دریافتی − هزینه پرداخت‌شده):{' '}
                  <strong className="text-emerald-700">
                    {formatPrice(stats.totalPaid)} − {formatPrice(stats.paidExpenses)} ={' '}
                    {formatPrice(stats.cashNetProfit)} تومان
                  </strong>
                </span>
              </div>
            </div>

            {/* Payments History Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    فهرست دریافتی‌های ثبت‌شده این پروژه
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ثبت دریافتی با محاسبه خودکار مانده و انتخاب کارت/حساب مقصد واریز
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus size={15} /> ثبت دریافت وجه جدید بابت این پروژه
                </button>
              </div>

              {projectPaymentsSorted.length === 0 ? (
                <div className="p-10 text-center text-xs font-bold text-slate-400">
                  هنوز هیچ واریزی برای این پروژه ثبت نشده است.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500">
                        <th className="py-3.5 px-4 font-bold">عنوان قسط / واریز</th>
                        <th className="py-3.5 px-4 font-bold">تاریخ</th>
                        <th className="py-3.5 px-4 font-bold">روش پرداخت</th>
                        <th className="py-3.5 px-4 font-bold">کارت / حساب مقصد</th>
                        <th className="py-3.5 px-4 font-bold">کد رهگیری</th>
                        <th className="py-3.5 px-4 font-bold">مبلغ (تومان)</th>
                        <th className="py-3.5 px-4 font-bold text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectPaymentsSorted.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{pay.title}</td>
                          <td className="py-3.5 px-4 text-slate-600 tabular-nums font-bold">
                            {toPersianDigits(pay.date)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {pay.method}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-700 text-[11px]">
                            {pay.bankAccountLabel || 'ثبت نشده'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 tabular-nums" dir="ltr">
                            {pay.trackingCode ? toPersianDigits(pay.trackingCode) : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-700 tabular-nums">
                            {formatPrice(pay.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setPaymentToDelete(pay)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORGANIZED EXPENSES, COMMISSIONS & INFRASTRUCTURE */}
        {activeDetailTab === 'infrastructure' && (
          <div className="space-y-5">
            {/* Clean Organized Header */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  هزینه‌ها، پورسانت و زیرساخت پروژه
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ثبت و دسته‌بندی تمام هزینه‌های مستقیم، حق معرفی و سرورهای این پروژه برای محاسبه دقیق سود خالص
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openExpenseModalForNew('other')}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus size={14} /> هزینه موضوعی جدید
                </button>
                <button
                  type="button"
                  onClick={() => openExpenseModalForNew('commission')}
                  className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <UserCheck size={14} /> ثبت پورسانت
                </button>
                <button
                  type="button"
                  onClick={() => openExpenseModalForNew('server')}
                  className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Server size={14} /> سرور / زیرساخت
                </button>
              </div>
            </div>

            {/* Clean 4-Card Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500">مجموع کل هزینه‌ها</span>
                <p className="text-lg font-black text-rose-600 mt-1 tabular-nums">
                  {formatPrice(stats.totalExpenses)}{' '}
                  <span className="text-[10px] font-bold text-rose-400">تومان</span>
                </p>
                <span className="text-[10px] text-slate-400 font-bold tabular-nums">
                  {toPersianDigits(stats.expenses.length)} ردیف ثبت‌شده
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                <span className="text-[11px] font-bold text-purple-700">پورسانت معرفی</span>
                <p className="text-lg font-black text-purple-800 mt-1 tabular-nums">
                  {formatPrice(stats.commissionExpenses)}{' '}
                  <span className="text-[10px] font-bold text-purple-400">تومان</span>
                </p>
                <span className="text-[10px] text-slate-400 font-bold">بازاریابی و معرفی</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-cyan-100 shadow-sm">
                <span className="text-[11px] font-bold text-cyan-700">سرور و زیرساخت</span>
                <p className="text-lg font-black text-cyan-800 mt-1 tabular-nums">
                  {formatPrice(stats.infraExpenses)}{' '}
                  <span className="text-[10px] font-bold text-cyan-400">تومان</span>
                </p>
                <span className="text-[10px] text-slate-400 font-bold">سرور، دامنه و سرویس‌ها</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                <span className="text-[11px] font-bold text-amber-700">سایر هزینه‌های موضوعی</span>
                <p className="text-lg font-black text-amber-800 mt-1 tabular-nums">
                  {formatPrice(stats.otherExpenses)}{' '}
                  <span className="text-[10px] font-bold text-amber-500">تومان</span>
                </p>
                <span className="text-[10px] text-slate-400 font-bold">طراحی، مشاوره و تیم</span>
              </div>
            </div>

            {/* Filter Bar + Manage Categories */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'all', label: `همه (${toPersianDigits(stats.expenses.length)})` },
                  { id: 'commission', label: 'پورسانت معرفی' },
                  { id: 'infra', label: 'زیرساخت و سرور' },
                  { id: 'other', label: 'هزینه‌های موضوعی' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setExpenseTabFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expenseTabFilter === f.id
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsExpenseCatManagerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Settings2 size={14} /> مدیریت سرفصل‌های هزینه
              </button>
            </div>

            {/* Uniform Clean Expense Cards Grid */}
            {filteredProjectExpenses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-xs font-bold text-slate-400">
                هزینه‌ای در این دسته ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredProjectExpenses.map((exp) => {
                  const badge = getExpenseTypeBadge(exp);
                  return (
                    <div
                      key={exp.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between gap-3.5"
                    >
                      {/* Top Header Row: Category + Payment Status + Compact Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              exp.paymentStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {exp.paymentStatus === 'pending' ? 'در انتظار تسویه' : 'پرداخت‌شده'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openExpenseModalForEdit(exp)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Title + Price Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h5 className="text-sm font-black text-slate-900 leading-snug">{exp.title}</h5>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {exp.recipientName ? `ذی‌نفع: ${exp.recipientName}` : exp.provider}
                          </p>
                        </div>
                        <div className="text-left shrink-0 tabular-nums">
                          <div className="text-base font-black text-rose-600">
                            {formatPrice(exp.purchaseCost)}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">تومان</div>
                        </div>
                      </div>

                      {/* Structured Footer Metadata */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="tabular-nums font-bold">
                          تاریخ ثبت: {toPersianDigits(exp.purchaseDate)}
                        </span>
                        <div className="flex items-center gap-3 tabular-nums">
                          {exp.commissionRate && (
                            <span className="text-purple-700 font-bold">
                              نرخ: {toPersianDigits(exp.commissionRate)}٪
                            </span>
                          )}
                          {exp.ip && (
                            <span dir="ltr" className="text-slate-700 font-bold">
                              IP: {exp.ip}
                            </span>
                          )}
                          {exp.expirationDate && (
                            <span className="text-amber-700 font-bold">
                              انقضا: {toPersianDigits(exp.expirationDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {exp.credentialsNotes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 leading-relaxed">
                          {exp.credentialsNotes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MILESTONES */}
        {activeDetailTab === 'milestones' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-slate-900">فازها و مایلستون‌های تحویل</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  تیک زدن هر مرحله به صورت خودکار درصد پیشرفت پروژه را به‌روزرسانی می‌کند
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMilestoneModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus size={15} /> افزودن فاز جدید
              </button>
            </div>

            {!selectedProject.milestones || selectedProject.milestones.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                فازی برای این پروژه ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedProject.milestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMilestone(selectedProject.id, m.id)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      m.isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50/60 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          m.isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {m.isCompleted && <Check size={14} />}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-black ${
                            m.isCompleted ? 'text-emerald-900 line-through' : 'text-slate-900'
                          }`}
                        >
                          {m.title}
                        </div>
                        {m.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{m.description}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums shrink-0">
                      {toPersianDigits(m.date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TASKS */}
        {activeDetailTab === 'tasks' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900">تسک‌های مرتبط با این پروژه</h4>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                باز کردن بورد کامل کانبان
              </button>
            </div>
            {stats.tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                تسکی برای این پروژه ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(t.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer ${
                          t.status === 'done'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {t.status === 'done' && <Check size={12} />}
                      </button>
                      <span
                        className={`text-xs font-bold ${
                          t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                      {toPersianDigits(t.dueDate || t.deadline || '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modals inside Project Detail */}
        <ProjectFormModal
          isOpen={projectFormModal.open}
          onClose={() => setProjectFormModal({ open: false, editing: null })}
          editingProject={projectFormModal.editing}
        />

        <PaymentFormModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          lockedProjectId={selectedProject.id}
        />

        {/* Add / Edit Expense Modal (with Editable Expense Categories) */}
        <Modal
          isOpen={expenseModal.open}
          onClose={() => setExpenseModal({ open: false, editing: null })}
          title={expenseModal.editing ? 'ویرایش هزینه پروژه' : 'ثبت هزینه جدید برای پروژه'}
        >
          <form className="space-y-4" onSubmit={handleSaveExpense}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">نوع هزینه *</label>
                  <button
                    type="button"
                    onClick={() => setIsExpenseTypeManagerOpen(true)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Settings2 size={11} /> تعریف / ویرایش
                  </button>
                </div>
                <CustomSelect
                  value={expenseForm.type}
                  onChange={(val) => setExpenseForm({ ...expenseForm, type: val })}
                  options={expenseTypeOptions}
                />
              </div>

              {expenseForm.type === 'other' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">سرفصل موضوعی هزینه</label>
                    <button
                      type="button"
                      onClick={() => setIsExpenseCatManagerOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Settings2 size={11} /> تعریف / ویرایش
                    </button>
                  </div>
                  <CustomSelect
                    value={expenseForm.categoryTitle}
                    onChange={(val) => setExpenseForm({ ...expenseForm, categoryTitle: val })}
                    options={expenseCategoryOptions}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">وضعیت تسویه هزینه</label>
                  <CustomSelect
                    value={expenseForm.paymentStatus}
                    onChange={(val) => setExpenseForm({ ...expenseForm, paymentStatus: val as any })}
                    options={paymentStatusOptions}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">عنوان هزینه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: طراحی UI صفحات داخلی یا خرید سرور"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </div>

              {expenseForm.type === 'commission' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">نام معرف / دریافت‌کننده پورسانت *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: مهندس رضایی"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    value={expenseForm.recipientName}
                    onChange={(e) => setExpenseForm({ ...expenseForm, recipientName: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تامین‌کننده / شخص ذی‌نفع</label>
                  <input
                    type="text"
                    placeholder="مثلاً: هتزنر، آروان‌کلود یا نام همکار"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    value={expenseForm.provider}
                    onChange={(e) => setExpenseForm({ ...expenseForm, provider: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {expenseForm.type === 'commission' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">درصد پورسانت</label>
                  <FormattedNumberInput
                    value={expenseForm.commissionRate}
                    max={100}
                    suffix="٪"
                    placeholder="مثلاً: ۱۰"
                    onChange={(rate) => {
                      const autoCost =
                        rate && selectedProject.contractValue
                          ? String(Math.round((selectedProject.contractValue * Number(rate)) / 100))
                          : expenseForm.purchaseCost;
                      setExpenseForm({ ...expenseForm, commissionRate: rate, purchaseCost: autoCost });
                    }}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">مبلغ هزینه *</label>
                <FormattedNumberInput
                  required
                  value={expenseForm.purchaseCost}
                  onChange={(val) => setExpenseForm({ ...expenseForm, purchaseCost: val })}
                  placeholder="مثلاً: ۴,۵۰۰,۰۰۰"
                  suffix="تومان"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تاریخ هزینه</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={expenseForm.purchaseDate}
                  onChange={(d) =>
                    setExpenseForm({ ...expenseForm, purchaseDate: d?.format?.('YYYY/MM/DD') || '' })
                  }
                  inputClass="rmdp-input"
                />
              </div>

              {expenseForm.type !== 'commission' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">دوره پرداخت</label>
                  <CustomSelect
                    value={expenseForm.billingCycle}
                    onChange={(val) => setExpenseForm({ ...expenseForm, billingCycle: val as any })}
                    options={billingCycleOptions}
                  />
                </div>
              )}
            </div>

            {expenseForm.type === 'other' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">وضعیت تسویه هزینه</label>
                <CustomSelect
                  value={expenseForm.paymentStatus}
                  onChange={(val) => setExpenseForm({ ...expenseForm, paymentStatus: val as any })}
                  options={paymentStatusOptions}
                />
              </div>
            )}

            {expenseForm.type === 'server' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">آدرس IP سرور</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="185.110.22.14"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    value={expenseForm.ip}
                    onChange={(e) => setExpenseForm({ ...expenseForm, ip: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تاریخ انقضا / تمدید</label>
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={expenseForm.expirationDate}
                    onChange={(d) =>
                      setExpenseForm({ ...expenseForm, expirationDate: d?.format?.('YYYY/MM/DD') || '' })
                    }
                    inputClass="rmdp-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">توضیحات / جزئیات فاکتور</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={expenseForm.credentialsNotes}
                onChange={(e) => setExpenseForm({ ...expenseForm, credentialsNotes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExpenseModal({ open: false, editing: null })}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {expenseModal.editing ? 'ذخیره تغییرات هزینه' : 'ثبت هزینه در پروژه'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Milestone Modal */}
        <Modal
          isOpen={isAddMilestoneModalOpen}
          onClose={() => setIsAddMilestoneModalOpen(false)}
          title="افزودن فاز / مایلستون جدید"
          maxWidth="max-w-lg"
        >
          <form className="space-y-4" onSubmit={handleSaveMilestone}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">عنوان فاز *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: پیاده‌سازی درگاه بانکی و تست نهایی"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تاریخ هدف</label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={milestoneForm.date}
                onChange={(d) => setMilestoneForm({ ...milestoneForm, date: d?.format?.('YYYY/MM/DD') || '' })}
                inputClass="rmdp-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">توضیحات</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddMilestoneModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                افزودن فاز
              </button>
            </div>
          </form>
        </Modal>

        {/* Convert Project to Product Modal */}
        <ConvertProjectToProductModal
          isOpen={isConvertToProductOpen}
          onClose={() => setIsConvertToProductOpen(false)}
          project={selectedProject}
          onConverted={(productId) => jumpToProduct(productId)}
        />

        {/* Project Invoice Preview Modal */}
        <InvoicePreviewModal
          isOpen={isInvoicePreviewOpen}
          onClose={() => setIsInvoicePreviewOpen(false)}
          invoice={isInvoicePreviewOpen ? buildInvoiceFromProject(selectedProject.id) : null}
        />

        {/* Expense Types Manager */}
        <OptionManagerModal
          mode="status"
          isOpen={isExpenseTypeManagerOpen}
          onClose={() => setIsExpenseTypeManagerOpen(false)}
          title="مدیریت انواع هزینه"
          subtitle="افزودن، تغییر نام، رنگ‌بندی یا حذف انواع هزینه در کل سیستم"
          items={expenseTypes}
          onAdd={addExpenseType}
          onUpdate={updateExpenseType}
          onDelete={deleteExpenseType}
        />

        {/* Expense Categories Manager */}
        <OptionManagerModal
          mode="string"
          isOpen={isExpenseCatManagerOpen}
          onClose={() => setIsExpenseCatManagerOpen(false)}
          title="مدیریت سرفصل‌های موضوعی هزینه"
          subtitle="تعریف، تغییر نام یا حذف سرفصل‌های هزینه برای کل سیستم"
          items={expenseCategories}
          onAdd={addExpenseCategory}
          onUpdate={updateExpenseCategory}
          onDelete={deleteExpenseCategory}
        />

        {/* Delete Confirmations */}
        <ConfirmModal
          isOpen={Boolean(projectToDelete)}
          onClose={() => setProjectToDelete(null)}
          onConfirm={() => {
            if (projectToDelete) {
              deleteProject(projectToDelete.id);
              closeProjectDetail();
              setProjectToDelete(null);
            }
          }}
          title="حذف کامل پروژه"
          message={`آیا از حذف پروژه «${projectToDelete?.title}» و تمامی واریزی‌ها و هزینه‌های مرتبط با آن مطمئن هستید؟`}
          confirmText="بله، حذف شود"
          variant="danger"
        />

        <ConfirmModal
          isOpen={Boolean(paymentToDelete)}
          onClose={() => setPaymentToDelete(null)}
          onConfirm={() => {
            if (paymentToDelete) {
              deletePayment(paymentToDelete.id);
              setPaymentToDelete(null);
            }
          }}
          title="حذف واریزی"
          message={`آیا از حذف واریزی «${paymentToDelete?.title}» به مبلغ ${formatPrice(
            paymentToDelete?.amount || 0
          )} تومان مطمئن هستید؟`}
          confirmText="بله، حذف شود"
          variant="danger"
        />

        <ConfirmModal
          isOpen={Boolean(expenseToDelete)}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={() => {
            if (expenseToDelete) {
              deleteExpense(expenseToDelete.id);
              setExpenseToDelete(null);
            }
          }}
          title="حذف هزینه پروژه"
          message={`آیا از حذف هزینه «${expenseToDelete?.title}» به مبلغ ${formatPrice(
            expenseToDelete?.purchaseCost || 0
          )} تومان مطمئن هستید؟`}
          confirmText="بله، حذف شود"
          variant="danger"
        />
      </div>
    );
  }

  // =========================================================================
  // MAIN PROJECTS LIST VIEW (Newest First!)
  // =========================================================================
  return (
    <div className="space-y-5 pb-8 font-['Vazirmatn']">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Briefcase className="text-indigo-600" size={24} />
            پروژه‌ها و قراردادها
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مدیریت {toPersianDigits(projects.length)} پروژه و قرارداد • نمایش از جدیدترین به قدیمی‌ترین
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsStatusManagerOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Settings2 size={15} /> مدیریت وضعیت‌ها
          </button>
          <button
            type="button"
            onClick={() => setProjectFormModal({ open: true, editing: null })}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} /> تعریف پروژه جدید
          </button>
        </div>
      </div>

      {/* Search + Dynamic Project Status Filter Pills */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="relative">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس عنوان پروژه، کارفرما، دسته‌بندی یا تکنولوژی..."
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            همه پروژه‌ها ({toPersianDigits(projects.length)})
          </button>
          {projectStatuses.map((st) => {
            const count = projects.filter((p) => p.status === st.id || p.status === st.label).length;
            const tone = STATUS_COLOR_STYLES[st.color] || STATUS_COLOR_STYLES.slate;
            const active = activeFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  active ? tone.activeBtn : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : tone.dot}`} />
                {st.label} ({toPersianDigits(count)})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-sm font-bold text-slate-400">
          پروژه‌ای با این مشخصات یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const stats = getProjectStats(project.id);
            const stMeta = getStatusMeta(project.status);

            return (
              <div
                key={project.id}
                onClick={() => openProjectDetail(project)}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  {/* Top Row: Category + Status + Compact Corner Edit/Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold truncate">
                        {project.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${stMeta.style.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${stMeta.style.dot}`} />
                        {stMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setProjectFormModal({ open: true, editing: project })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                        title="ویرایش"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Client */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">
                      {project.clientName}
                    </p>
                  </div>

                  {/* Tech Stack Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {(project.stack || []).slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        dir="ltr"
                        className="px-2 py-0.5 rounded-md bg-indigo-50/70 text-indigo-700 text-[10px] font-bold"
                      >
                        {tech}
                      </span>
                    ))}
                    {(project.stack || []).length > 4 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold tabular-nums">
                        +{toPersianDigits(project.stack.length - 4)}
                      </span>
                    )}
                  </div>

                  {/* Accurate Compact Financial Strip */}
                  <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center tabular-nums">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">قرارداد</span>
                      <span className="text-[11px] font-black text-slate-800 block truncate">
                        {formatPrice(stats.contractValue)}
                      </span>
                    </div>
                    <div className="border-r border-slate-200">
                      <span className="text-[10px] text-emerald-600 font-bold block">دریافتی</span>
                      <span className="text-[11px] font-black text-emerald-700 block truncate">
                        {formatPrice(stats.totalPaid)}
                      </span>
                    </div>
                    <div className="border-r border-slate-200">
                      <span className="text-[10px] text-indigo-600 font-bold block">سود خالص</span>
                      <span className="text-[11px] font-black text-indigo-700 block truncate">
                        {formatPrice(stats.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress & Deadline Footer */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold tabular-nums">
                    <span className="text-slate-500">پیشرفت: {toPersianDigits(project.progress)}٪</span>
                    <span className="text-slate-500">تحویل: {toPersianDigits(project.deadline)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <ProjectFormModal
        isOpen={projectFormModal.open}
        onClose={() => setProjectFormModal({ open: false, editing: null })}
        editingProject={projectFormModal.editing}
      />

      {/* Manage Project Statuses Modal */}
      <OptionManagerModal
        mode="status"
        isOpen={isStatusManagerOpen}
        onClose={() => setIsStatusManagerOpen(false)}
        title="مدیریت وضعیت‌های پروژه"
        subtitle="تعریف، تغییر نام یا رنگ‌بندی وضعیت‌های پروژه‌ها"
        items={projectStatuses}
        onAdd={addProjectStatus}
        onUpdate={updateProjectStatus}
        onDelete={deleteProjectStatus}
      />

      {/* Confirm Delete Project */}
      <ConfirmModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            deleteProject(projectToDelete.id);
            setProjectToDelete(null);
          }
        }}
        title="حذف پروژه"
        message={`آیا از حذف پروژه «${projectToDelete?.title}» و تمامی اطلاعات مالی مرتبط با آن مطمئن هستید؟`}
        confirmText="بله، حذف شود"
        variant="danger"
      />
    </div>
  );
};

export default Projects;
