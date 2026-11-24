import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  X,
  MapPin,
  Calendar,
  Briefcase,
  Send,
  Star,
  ArrowUpRight,
  Plus,
  CreditCard,
  Server,
  Globe,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  PhoneCall,
  Settings2,
  ArrowRight,
  Wallet,
  Package,
  ShieldCheck,
  ShieldAlert,
  ShieldOff
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { Client } from '../types';
import {
  toPersianDigits,
  formatPrice,
  STATUS_COLOR_STYLES,
  getTodayPersianDate,
  getProductSupportStatus
} from '../constants';
import ConfirmModal from './ConfirmModal';
import CustomSelect from './CustomSelect';
import OptionManagerModal from './OptionManagerModal';
import ProjectFormModal from './ProjectFormModal';
import PaymentFormModal from './PaymentFormModal';
import ProductSaleModal from './ProductSaleModal';

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

const AVATAR_TONES = [
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-rose-100 text-rose-700 border-rose-200'
];

const getMonogram = (name: string) => {
  const parts = (name || 'ش').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return parts[0].slice(0, 2);
};

const getAvatarTone = (seed: string) => {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
};

const Clients: React.FC = () => {
  const {
    clients,
    servers,
    domains,
    clientStatuses,
    projectStatuses,
    addClient,
    updateClient,
    deleteClient,
    addClientInteraction,
    addClientStatus,
    updateClientStatus,
    deleteClientStatus,
    getClientStats,
    getProjectStats,
    setActiveTab,
    navResetCount,
    setSelectedProjectIdForView,
    setSelectedProductIdForView,
    selectedClientIdForView,
    setSelectedClientIdForView
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'spent' | 'debt' | 'projects' | 'name'>('newest');

  const [selectedClientId, setSelectedClientId] = useState<string | null>(selectedClientIdForView);
  const [activeProfileTab, setActiveProfileTab] = useState<
    'overview' | 'projects' | 'products' | 'finance' | 'interactions' | 'infrastructure'
  >('overview');

  useEffect(() => {
    if (selectedClientIdForView) {
      setSelectedClientId(selectedClientIdForView);
      setSelectedClientIdForView(null);
    }
  }, [selectedClientIdForView, setSelectedClientIdForView]);

  const lastNavResetRef = useRef(navResetCount);
  useEffect(() => {
    if (navResetCount !== lastNavResetRef.current) {
      lastNavResetRef.current = navResetCount;
      setSelectedClientId(null);
    }
  }, [navResetCount]);

  const selectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId) || null
    : null;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewProductSaleModalOpen, setIsNewProductSaleModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [paymentLockedProjectId, setPaymentLockedProjectId] = useState<string | undefined>(undefined);
  const [isAddInteractionModalOpen, setIsAddInteractionModalOpen] = useState(false);

  // Edit Client Form
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [editClientForm, setEditClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    telegramOrWhatsapp: '',
    status: clientStatuses[0]?.id || 'active',
    tags: '',
    address: '',
    notes: '',
    rating: 5
  });

  // Delete Client Modals
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [cannotDeleteInfo, setCannotDeleteInfo] = useState<{
    isOpen: boolean;
    clientName: string;
    projectCount: number;
  }>({
    isOpen: false,
    clientName: '',
    projectCount: 0
  });

  // Add Client Form
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    telegramOrWhatsapp: '',
    status: clientStatuses.find((s) => s.id === 'active')?.id || clientStatuses[0]?.id || 'active',
    tags: '',
    address: '',
    notes: '',
    rating: 5
  });

  // Interaction Form
  const [newInteraction, setNewInteraction] = useState({
    type: 'call' as 'call' | 'meeting' | 'message' | 'email' | 'contract',
    date: getTodayPersianDate(),
    description: '',
    outcome: ''
  });

  const getStatusMeta = (statusId: string) => {
    const found = clientStatuses.find((s) => s.id === statusId || s.label === statusId);
    if (!found) {
      return {
        label: statusId || 'نامشخص',
        style: STATUS_COLOR_STYLES.slate
      };
    }
    return {
      label: found.label,
      style: STATUS_COLOR_STYLES[found.color] || STATUS_COLOR_STYLES.slate
    };
  };

  const getProjectStatusBadge = (statusId: string) => {
    const found = projectStatuses.find((s) => s.id === statusId || s.label === statusId);
    const tone = found ? STATUS_COLOR_STYLES[found.color] || STATUS_COLOR_STYLES.slate : STATUS_COLOR_STYLES.slate;
    return {
      label: found?.label || statusId,
      className: tone.badge
    };
  };

  const openClientProfile = (client: Client) => {
    setSelectedClientId(client.id);
    setSelectedClientIdForView(client.id);
    setActiveProfileTab('overview');
  };

  const closeClientProfile = () => {
    setSelectedClientId(null);
    setSelectedClientIdForView(null);
  };

  const handleJumpToProject = (projectId: string) => {
    closeClientProfile();
    setSelectedProjectIdForView(projectId);
    setActiveTab('projects');
  };

  const handleJumpToProduct = (productId: string) => {
    closeClientProfile();
    setSelectedProductIdForView(productId);
    setActiveTab('products');
  };

  const handleOpenEditClient = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setClientToEdit(client);
    setEditClientForm({
      name: client.name,
      company: client.company,
      email: client.email || '',
      phone: client.phone || '',
      secondaryPhone: client.secondaryPhone || '',
      telegramOrWhatsapp: client.telegramOrWhatsapp || '',
      status: client.status || clientStatuses[0]?.id || 'active',
      tags: (client.tags || []).join(', '),
      address: client.address || '',
      notes: client.notes || '',
      rating: client.rating || 5
    });
    setIsEditModalOpen(true);
  };

  const handleEditClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;
    const tagArray = editClientForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    updateClient(clientToEdit.id, {
      name: editClientForm.name,
      company: editClientForm.company,
      email: editClientForm.email,
      phone: editClientForm.phone,
      secondaryPhone: editClientForm.secondaryPhone,
      telegramOrWhatsapp: editClientForm.telegramOrWhatsapp,
      status: editClientForm.status,
      tags: tagArray,
      address: editClientForm.address,
      notes: editClientForm.notes,
      rating: Number(editClientForm.rating) || 5
    });
    setIsEditModalOpen(false);
    setClientToEdit(null);
  };

  const handleRequestDeleteClient = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const stats = getClientStats(client.id);
    if (stats.projectCount > 0) {
      setCannotDeleteInfo({
        isOpen: true,
        clientName: `${client.name} (${client.company})`,
        projectCount: stats.projectCount
      });
      return;
    }
    setClientToDelete(client);
    setIsDeleteConfirmOpen(true);
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = newClient.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    addClient({
      name: newClient.name,
      company: newClient.company,
      email: newClient.email,
      phone: newClient.phone,
      secondaryPhone: newClient.secondaryPhone,
      telegramOrWhatsapp: newClient.telegramOrWhatsapp,
      status: newClient.status,
      tags: tagArray.length > 0 ? tagArray : ['مشتری جدید'],
      address: newClient.address,
      notes: newClient.notes,
      rating: Number(newClient.rating) || 5,
      interactions: []
    });

    setIsAddModalOpen(false);
    setNewClient({
      name: '',
      company: '',
      email: '',
      phone: '',
      secondaryPhone: '',
      telegramOrWhatsapp: '',
      status: clientStatuses.find((s) => s.id === 'active')?.id || clientStatuses[0]?.id || 'active',
      tags: '',
      address: '',
      notes: '',
      rating: 5
    });
  };

  const handleAddInteractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newInteraction.description.trim()) return;
    addClientInteraction(selectedClient.id, {
      type: newInteraction.type,
      date: newInteraction.date || getTodayPersianDate(),
      description: newInteraction.description.trim(),
      outcome: newInteraction.outcome.trim() || undefined
    });
    setIsAddInteractionModalOpen(false);
    setNewInteraction({
      type: 'call',
      date: getTodayPersianDate(),
      description: '',
      outcome: ''
    });
  };

  // Filtered and Sorted Clients (default: newest first!)
  const filteredClients = clients
    .filter((client) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        client.name.toLowerCase().includes(q) ||
        client.company.toLowerCase().includes(q) ||
        (client.phone || '').includes(q);
      const matchesStatus =
        filterStatus === 'all' || client.status === filterStatus || client.tags.includes(filterStatus);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.createdTimestamp || 0) - (a.createdTimestamp || 0);
      }
      const statsA = getClientStats(a.id);
      const statsB = getClientStats(b.id);
      if (sortBy === 'spent') return statsB.totalPaid - statsA.totalPaid;
      if (sortBy === 'debt') return statsB.remainingDebt - statsA.remainingDebt;
      if (sortBy === 'projects') return statsB.projectCount - statsA.projectCount;
      return a.name.localeCompare(b.name, 'fa');
    });

  const statusSelectOptions = clientStatuses.map((s) => ({
    value: s.id,
    label: s.label,
    dotColorClass: (STATUS_COLOR_STYLES[s.color] || STATUS_COLOR_STYLES.slate).dot
  }));

  const sortSelectOptions = [
    { value: 'newest', label: 'جدیدترین ثبت‌شده' },
    { value: 'spent', label: 'بیشترین پرداختی' },
    { value: 'debt', label: 'بیشترین مانده حساب' },
    { value: 'projects', label: 'بیشترین تعداد پروژه' },
    { value: 'name', label: 'ترتیب حروف الفبا' }
  ];

  const interactionTypeOptions = [
    { value: 'call', label: 'تماس تلفنی' },
    { value: 'meeting', label: 'جلسه حضوری / آنلاین' },
    { value: 'message', label: 'پیام تلگرام / واتساپ' },
    { value: 'email', label: 'ایمیل رسمی' },
    { value: 'contract', label: 'عقد یا تمدید قرارداد' }
  ];

  const ratingOptions = [
    { value: '5', label: '۵ ستاره (عالی)' },
    { value: '4', label: '۴ ستاره (خوب)' },
    { value: '3', label: '۳ ستاره (متوسط)' },
    { value: '2', label: '۲ ستاره (ضعیف)' },
    { value: '1', label: '۱ ستاره (پرنوسان)' }
  ];

  // =========================================================================
  // CLIENT PROFILE VIEW
  // =========================================================================
  if (selectedClient) {
    const stats = getClientStats(selectedClient.id);
    const statusMeta = getStatusMeta(selectedClient.status);
    const clientServers = servers.filter(
      (s) => s.clientId === selectedClient.id || stats.projects.some((p) => p.id === s.projectId)
    );
    const clientDomains = domains.filter(
      (d) => d.clientId === selectedClient.id || stats.projects.some((p) => p.id === d.projectId)
    );
    const collectionPct =
      stats.totalContractValue > 0
        ? Math.min(100, Math.round((stats.totalPaid / stats.totalContractValue) * 100))
        : 0;

    return (
      <div className="space-y-5 font-['Vazirmatn'] pb-8">
        {/* Top Attractive Redesigned Client Profile Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Top Utility Strip: Back on right, Compact Edit & Delete in top-left corner */}
          <div className="px-5 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeClientProfile}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <ArrowRight size={15} />
              بازگشت به لیست مشتریان
            </button>

            {/* Small compact Edit & Delete tucked neatly in corner */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenEditClient(selectedClient)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-200 text-[11px] font-bold transition-colors cursor-pointer"
                title="ویرایش مشخصات مشتری"
              >
                <Edit2 size={12} /> ویرایش
              </button>
              <button
                type="button"
                onClick={() => handleRequestDeleteClient(selectedClient)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
                title="حذف مشتری"
              >
                <Trash2 size={12} /> حذف
              </button>
            </div>
          </div>

          {/* Main Identity + Quick Actions + Single-Row 3 Financial Cards */}
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center font-black text-xl shrink-0 ${getAvatarTone(
                    selectedClient.id
                  )}`}
                >
                  {getMonogram(selectedClient.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                      {selectedClient.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${statusMeta.style.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.style.dot}`} />
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                      <Building2 size={13} className="text-indigo-500" /> {selectedClient.company}
                    </span>
                    {selectedClient.phone && (
                      <span className="inline-flex items-center gap-1 tabular-nums" dir="ltr">
                        <Phone size={12} className="text-slate-400" /> {toPersianDigits(selectedClient.phone)}
                      </span>
                    )}
                    {selectedClient.email && (
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        <Mail size={12} className="text-slate-400" /> {selectedClient.email}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: selectedClient.rating || 5 }).map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus size={15} /> ایجاد پروژه جدید برای این مشتری
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentLockedProjectId(undefined);
                    setIsAddPaymentModalOpen(true);
                  }}
                  disabled={stats.projects.length === 0}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Wallet size={15} /> ثبت دریافتی
                </button>
              </div>
            </div>

            {/* Sleek Single-Line 3-Card Financial Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Total Contracts */}
              <div className="rounded-2xl p-4 bg-gradient-to-l from-slate-50 to-indigo-50/40 border border-indigo-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">کل مبلغ قراردادها</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-1 tabular-nums">
                    {formatPrice(stats.totalContractValue)}
                    <span className="text-[11px] font-bold text-slate-400 mr-1">تومان</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
                    <Briefcase size={17} />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 mt-1 tabular-nums">
                    {toPersianDigits(stats.projectCount)} پروژه
                  </span>
                </div>
              </div>

              {/* Card 2: Total Received */}
              <div className="rounded-2xl p-4 bg-gradient-to-l from-slate-50 to-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 block">کل دریافتی</span>
                  <div className="text-base sm:text-lg font-black text-emerald-700 mt-1 tabular-nums">
                    {formatPrice(stats.totalPaid)}
                    <span className="text-[11px] font-bold text-emerald-500 mr-1">تومان</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 size={17} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 mt-1 tabular-nums">
                    {toPersianDigits(collectionPct)}٪ وصولی
                  </span>
                </div>
              </div>

              {/* Card 3: Remaining Balance */}
              <div
                className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${
                  stats.remainingDebt > 0
                    ? 'bg-gradient-to-l from-slate-50 to-rose-50/50 border-rose-100'
                    : 'bg-gradient-to-l from-slate-50 to-emerald-50/30 border-emerald-100'
                }`}
              >
                <div>
                  <span
                    className={`text-[11px] font-bold block ${
                      stats.remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    مانده حساب (طلب)
                  </span>
                  <div
                    className={`text-base sm:text-lg font-black mt-1 tabular-nums ${
                      stats.remainingDebt > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatPrice(stats.remainingDebt)}
                    <span className="text-[11px] font-bold opacity-70 mr-1">تومان</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      stats.remainingDebt > 0
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <AlertCircle size={17} />
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 ${
                      stats.remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {stats.remainingDebt > 0 ? 'قابل وصول' : 'تسویه کامل'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Navigation Tabs */}
          <div className="px-5 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'اطلاعات و مشخصات', icon: FileText },
              { id: 'projects', label: `پروژه‌ها (${toPersianDigits(stats.projectCount)})`, icon: Briefcase },
              {
                id: 'products',
                label: `محصولات خریداری‌شده (${toPersianDigits(stats.productSales.length)})`,
                icon: Package
              },
              { id: 'finance', label: `گردش مالی (${toPersianDigits(stats.payments.length)})`, icon: CreditCard },
              {
                id: 'interactions',
                label: `تعاملات و تماس‌ها (${toPersianDigits(selectedClient.interactions?.length || 0)})`,
                icon: MessageSquare
              },
              {
                id: 'infrastructure',
                label: `زیرساخت (${toPersianDigits(clientServers.length + clientDomains.length)})`,
                icon: Server
              }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeProfileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveProfileTab(tab.id as any)}
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

        {/* Profile Tab Content */}
        {activeProfileTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900">اطلاعات تماس و پرونده کارفرما</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">شماره تماس اصلی</span>
                  <span className="font-black text-slate-800 mt-1 block tabular-nums" dir="ltr">
                    {toPersianDigits(selectedClient.phone || '—')}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">شماره تماس دوم</span>
                  <span className="font-black text-slate-800 mt-1 block tabular-nums" dir="ltr">
                    {toPersianDigits(selectedClient.secondaryPhone || '—')}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">تلگرام / واتساپ</span>
                  <span className="font-black text-indigo-700 mt-1 block" dir="ltr">
                    {selectedClient.telegramOrWhatsapp || '—'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block">تاریخ ثبت در سیستم</span>
                  <span className="font-black text-slate-800 mt-1 block tabular-nums">
                    {toPersianDigits(selectedClient.createdAt)}
                  </span>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <MapPin size={12} /> آدرس دفتر / شرکت
                  </span>
                  <span className="font-bold text-slate-700 mt-1 block leading-relaxed">
                    {selectedClient.address || 'آدرسی ثبت نشده است.'}
                  </span>
                </div>
              </div>

              {selectedClient.notes && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                  <span className="text-[11px] font-black text-amber-800 block mb-1">یادداشت‌های مدیریتی</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedClient.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900">خلاصه سودآوری این کارفرما</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 font-bold">پروژه‌های فعال</span>
                  <span className="font-black text-indigo-700 tabular-nums">
                    {toPersianDigits(stats.activeProjectCount)} از {toPersianDigits(stats.projectCount)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 font-bold">کل هزینه‌های پروژه‌ها</span>
                  <span className="font-black text-rose-600 tabular-nums">
                    {formatPrice(stats.totalExpenses)} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-emerald-800 font-bold">سود خالص قراردادها</span>
                  <span className="font-black text-emerald-700 tabular-nums">
                    {formatPrice(stats.netProfit)} تومان
                  </span>
                </div>
              </div>

              {selectedClient.tags.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">برچسب‌ها</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClient.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeProfileTab === 'projects' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">پروژه‌ها و قراردادهای این کارفرما</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  نمایش به ترتیب جدیدترین پروژه ثبت‌شده
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus size={15} /> ایجاد پروژه جدید برای این مشتری
              </button>
            </div>

            {stats.projects.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-500">
                  هنوز هیچ پروژه‌ای برای این کارفرما ثبت نشده است.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + ثبت اولین پروژه همین‌جا
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.projects.map((proj) => {
                  const pStats = getProjectStats(proj.id);
                  const stBadge = getProjectStatusBadge(proj.status);
                  return (
                    <div
                      key={proj.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/40 hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-indigo-600">{proj.category}</span>
                          <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">{proj.title}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${stBadge.className}`}
                        >
                          {stBadge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-slate-100 tabular-nums">
                        <div>
                          <span className="text-[10px] text-slate-400 block">قرارداد</span>
                          <span className="text-xs font-black text-slate-800">
                            {formatPrice(pStats.contractValue)}
                          </span>
                        </div>
                        <div className="border-r border-slate-100">
                          <span className="text-[10px] text-emerald-600 block">دریافتی</span>
                          <span className="text-xs font-black text-emerald-700">
                            {formatPrice(pStats.totalPaid)}
                          </span>
                        </div>
                        <div className="border-r border-slate-100">
                          <span className="text-[10px] text-rose-500 block">مانده</span>
                          <span className="text-xs font-black text-rose-600">
                            {formatPrice(pStats.remainingBalance)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          پیشرفت: <strong className="text-slate-800">{toPersianDigits(proj.progress)}٪</strong> • تحویل:{' '}
                          {toPersianDigits(proj.deadline)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {pStats.remainingBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentLockedProjectId(proj.id);
                                setIsAddPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              ثبت واریز
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleJumpToProject(proj.id)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            مشاهده <ArrowUpRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeProfileTab === 'products' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">محصولات خریداری‌شده و وضعیت پشتیبانی</h3>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  مجموع خرید محصولات: {formatPrice(stats.totalProductSpend)} تومان
                  {stats.productRemainingDebt > 0
                    ? ` · مانده تسویه‌نشده: ${formatPrice(stats.productRemainingDebt)} تومان`
                    : ' · بدون مانده بدهی محصول'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductSaleModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus size={15} /> ثبت خرید محصول برای این مشتری
              </button>
            </div>

            {stats.productSales.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Package size={32} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">
                  این مشتری هنوز محصولی خریداری نکرده است.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewProductSaleModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + ثبت اولین خرید محصول
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.productSales.map((sale) => {
                  const supStatus = getProductSupportStatus(sale.hasSupport, sale.supportEndDate);
                  return (
                    <div
                      key={sale.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/40 hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-indigo-600">{sale.saleType}</span>
                            {sale.tierName && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {sale.tierName}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">
                            {sale.productName || 'محصول'}
                          </h4>
                        </div>
                        {supStatus === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                            <ShieldCheck size={12} /> پشتیبانی فعال
                          </span>
                        )}
                        {supStatus === 'expiring' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0">
                            <ShieldAlert size={12} /> نزدیک انقضا
                          </span>
                        )}
                        {supStatus === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold shrink-0">
                            <ShieldOff size={12} /> منقضی‌شده
                          </span>
                        )}
                        {supStatus === 'none' && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold shrink-0">
                            بدون پشتیبانی
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-xl border border-slate-100 tabular-nums">
                        <div>
                          <span className="text-[10px] text-slate-400 block">مبلغ کل</span>
                          <span className="text-xs font-black text-slate-800">
                            {formatPrice(sale.totalAmount)}
                          </span>
                        </div>
                        <div className="border-r border-slate-100">
                          <span className="text-[10px] text-emerald-600 block">پرداختی</span>
                          <span className="text-xs font-black text-emerald-700">
                            {formatPrice(sale.paidAmount)}
                          </span>
                        </div>
                        <div className="border-r border-slate-100">
                          <span className="text-[10px] text-rose-500 block">مانده</span>
                          <span className="text-xs font-black text-rose-600">
                            {formatPrice(sale.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                        <span className="text-slate-500 tabular-nums">
                          تاریخ خرید: {toPersianDigits(sale.date)}
                          {sale.supportEndDate && ` • انقضا: ${toPersianDigits(sale.supportEndDate)}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleJumpToProduct(sale.productId)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          پرونده محصول <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeProfileTab === 'finance' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">تاریخچه دریافتی‌های مالی کارفرما</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  شامل جزئیات روش پرداخت و کارت/حساب مقصد واریز
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentLockedProjectId(undefined);
                  setIsAddPaymentModalOpen(true);
                }}
                disabled={stats.projects.length === 0}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> ثبت دریافت وجه جدید
              </button>
            </div>

            {stats.payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                هنوز واریزی برای این کارفرما ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 px-3 font-bold">عنوان واریز</th>
                      <th className="py-3 px-3 font-bold">پروژه</th>
                      <th className="py-3 px-3 font-bold">تاریخ</th>
                      <th className="py-3 px-3 font-bold">روش پرداخت</th>
                      <th className="py-3 px-3 font-bold">حساب / کارت مقصد</th>
                      <th className="py-3 px-3 font-bold">مبلغ (تومان)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-slate-800">{pay.title}</td>
                        <td className="py-3 px-3 text-slate-600">{pay.projectName || '—'}</td>
                        <td className="py-3 px-3 text-slate-500 tabular-nums">{toPersianDigits(pay.date)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {pay.method}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-indigo-700 font-bold text-[11px]">
                          {pay.bankAccountLabel || 'ثبت نشده'}
                        </td>
                        <td className="py-3 px-3 font-black text-emerald-700 tabular-nums">
                          {formatPrice(pay.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeProfileTab === 'interactions' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-900">تاریخچه تماس‌ها، جلسات و پیگیری‌ها</h3>
              <button
                type="button"
                onClick={() => setIsAddInteractionModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> ثبت تعامل جدید
              </button>
            </div>

            {!selectedClient.interactions || selectedClient.interactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                هنوز تعاملی برای این مشتری ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedClient.interactions.map((inter) => (
                  <div
                    key={inter.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      {inter.type === 'call' ? (
                        <PhoneCall size={16} />
                      ) : inter.type === 'email' ? (
                        <Mail size={16} />
                      ) : inter.type === 'contract' ? (
                        <FileText size={16} />
                      ) : (
                        <Send size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-800">
                          {interactionTypeOptions.find((o) => o.value === inter.type)?.label || inter.type}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                          {toPersianDigits(inter.date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{inter.description}</p>
                      {inter.outcome && (
                        <p className="text-[11px] font-bold text-emerald-700 mt-1.5">
                          نتیجه: {inter.outcome}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeProfileTab === 'infrastructure' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Server size={16} className="text-indigo-600" /> سرورهای مرتبط ({toPersianDigits(clientServers.length)})
              </h4>
              {clientServers.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">سروری ثبت نشده است.</p>
              ) : (
                clientServers.map((srv) => (
                  <div key={srv.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="font-black text-slate-800">{srv.name}</div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{srv.provider}</span>
                      <span dir="ltr" className="tabular-nums font-bold">
                        {srv.ip}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-amber-700 font-bold tabular-nums">
                        انقضا: {toPersianDigits(srv.expiration)}
                      </span>
                      <span className="font-black text-slate-800 tabular-nums">
                        {formatPrice(srv.purchaseCost)} تومان
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Globe size={16} className="text-cyan-600" /> دامنه‌های مرتبط ({toPersianDigits(clientDomains.length)})
              </h4>
              {clientDomains.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">دامنه‌ای ثبت نشده است.</p>
              ) : (
                clientDomains.map((dom) => (
                  <div key={dom.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="font-black text-slate-800" dir="ltr">
                      {dom.url}
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{dom.registrar}</span>
                      <span className="text-indigo-700 font-bold tabular-nums">
                        انقضا: {toPersianDigits(dom.expiration)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Inline Create Project Modal (stays inside Client Profile!) */}
        <ProjectFormModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          lockedClientId={selectedClient.id}
          onSaved={() => setActiveProfileTab('projects')}
        />

        {/* Smart Payment Modal for this Client */}
        <PaymentFormModal
          isOpen={isAddPaymentModalOpen}
          onClose={() => setIsAddPaymentModalOpen(false)}
          filterClientId={selectedClient.id}
          lockedProjectId={paymentLockedProjectId}
        />

        {/* Inline Record Product Sale Modal for this Client */}
        <ProductSaleModal
          isOpen={isNewProductSaleModalOpen}
          onClose={() => setIsNewProductSaleModalOpen(false)}
          lockedClientId={selectedClient.id}
          onSaved={() => setActiveProfileTab('products')}
        />

        {/* Add Interaction Modal */}
        <Modal
          isOpen={isAddInteractionModalOpen}
          onClose={() => setIsAddInteractionModalOpen(false)}
          title="ثبت تعامل یا تماس جدید"
          maxWidth="max-w-lg"
        >
          <form className="space-y-4" onSubmit={handleAddInteractionSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نوع تعامل</label>
                <CustomSelect
                  value={newInteraction.type}
                  onChange={(val) => setNewInteraction({ ...newInteraction, type: val as any })}
                  options={interactionTypeOptions}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تاریخ</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={newInteraction.date}
                  onChange={(d) => setNewInteraction({ ...newInteraction, date: d?.format?.('YYYY/MM/DD') || '' })}
                  inputClass="rmdp-input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">شرح مکالمه / جلسه *</label>
              <textarea
                rows={3}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                value={newInteraction.description}
                onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نتیجه و اقدام بعدی</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                value={newInteraction.outcome}
                onChange={(e) => setNewInteraction({ ...newInteraction, outcome: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddInteractionModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                ثبت تعامل
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Client Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="ویرایش مشخصات مشتری"
        >
          <form className="space-y-4" onSubmit={handleEditClientSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  value={editClientForm.name}
                  onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نام شرکت / برند *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  value={editClientForm.company}
                  onChange={(e) => setEditClientForm({ ...editClientForm, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">وضعیت مشتری</label>
                  <button
                    type="button"
                    onClick={() => setIsStatusManagerOpen(true)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Settings2 size={11} /> تعریف / ویرایش
                  </button>
                </div>
                <CustomSelect
                  value={editClientForm.status}
                  onChange={(val) => setEditClientForm({ ...editClientForm, status: val })}
                  options={statusSelectOptions}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">امتیاز خوش‌حسابی</label>
                <CustomSelect
                  value={String(editClientForm.rating)}
                  onChange={(val) => setEditClientForm({ ...editClientForm, rating: Number(val) })}
                  options={ratingOptions}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تلفن همراه *</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  value={editClientForm.phone}
                  onChange={(e) => setEditClientForm({ ...editClientForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ایمیل</label>
                <input
                  type="email"
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  value={editClientForm.email}
                  onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">تلگرام / واتساپ</label>
                <input
                  type="text"
                  dir="ltr"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  value={editClientForm.telegramOrWhatsapp}
                  onChange={(e) =>
                    setEditClientForm({ ...editClientForm, telegramOrWhatsapp: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">برچسب‌ها (با کاما جدا کنید)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  value={editClientForm.tags}
                  onChange={(e) => setEditClientForm({ ...editClientForm, tags: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">آدرس</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={editClientForm.address}
                onChange={(e) => setEditClientForm({ ...editClientForm, address: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">یادداشت‌ها</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={editClientForm.notes}
                onChange={(e) => setEditClientForm({ ...editClientForm, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                ذخیره تغییرات
              </button>
            </div>
          </form>
        </Modal>

        {/* Client Status Manager Modal */}
        <OptionManagerModal
          mode="status"
          isOpen={isStatusManagerOpen}
          onClose={() => setIsStatusManagerOpen(false)}
          title="مدیریت وضعیت‌های مشتری"
          subtitle="تعریف، تغییر عنوان یا رنگ وضعیت‌های کارفرمایان"
          items={clientStatuses}
          onAdd={addClientStatus}
          onUpdate={updateClientStatus}
          onDelete={deleteClientStatus}
        />

        {/* Delete Confirmation Modals */}
        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => {
            if (clientToDelete) {
              deleteClient(clientToDelete.id);
              closeClientProfile();
              setClientToDelete(null);
            }
          }}
          title="حذف مشتری از سیستم"
          message={`آیا از حذف «${clientToDelete?.name} (${clientToDelete?.company})» مطمئن هستید؟`}
          confirmText="بله، حذف شود"
          variant="danger"
        />

        <ConfirmModal
          isOpen={cannotDeleteInfo.isOpen}
          onClose={() => setCannotDeleteInfo({ isOpen: false, clientName: '', projectCount: 0 })}
          title="امکان حذف کارفرما وجود ندارد"
          message={`برای کارفرمای «${cannotDeleteInfo.clientName}» تعداد ${toPersianDigits(
            cannotDeleteInfo.projectCount
          )} پروژه ثبت شده است. ابتدا پروژه‌های مرتبط را حذف یا منتقل کنید.`}
          variant="warning"
          isAlertOnly
        />
      </div>
    );
  }

  // =========================================================================
  // MAIN CLIENTS DIRECTORY VIEW (Compact 3-Per-Row Grid, Newest First)
  // =========================================================================
  return (
    <div className="space-y-5 font-['Vazirmatn'] pb-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Building2 className="text-indigo-600" size={24} />
            مشتریان و کارفرمایان
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مدیریت پرونده {toPersianDigits(clients.length)} شرکت و کارفرما • مرتب‌سازی پیش‌فرض از جدیدترین به قدیمی‌ترین
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsStatusManagerOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Settings2 size={15} /> مدیریت وضعیت‌ها
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <UserPlus size={16} /> ثبت شرکت / مشتری جدید
          </button>
        </div>
      </div>

      {/* Search, Dynamic Status Filters & Rounded Sort Select */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس نام کارفرما، نام شرکت یا شماره تماس..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <div className="w-full md:w-56 shrink-0">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={sortSelectOptions}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            همه ({toPersianDigits(clients.length)})
          </button>
          {clientStatuses.map((st) => {
            const count = clients.filter((c) => c.status === st.id).length;
            const tone = STATUS_COLOR_STYLES[st.color] || STATUS_COLOR_STYLES.slate;
            const active = filterStatus === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
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

      {/* Compact 3-Column Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-sm font-bold text-slate-400">
          مشتری یا شرکتی با این مشخصات یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const stats = getClientStats(client.id);
            const statusMeta = getStatusMeta(client.status);

            return (
              <div
                key={client.id}
                onClick={() => openClientProfile(client)}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3.5 group"
              >
                {/* Top Row: Avatar + Name/Company + Corner Actions */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 ${getAvatarTone(
                        client.id
                      )}`}
                    >
                      {getMonogram(client.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <Building2 size={11} className="shrink-0 text-slate-400" />
                        {client.company}
                      </p>
                    </div>
                  </div>

                  {/* Compact Corner Edit/Delete */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditClient(client, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRequestDeleteClient(client, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Status Badge & Phone Row */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border ${statusMeta.style.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.style.dot}`} />
                    {statusMeta.label}
                  </span>
                  <span className="text-slate-500 font-bold tabular-nums" dir="ltr">
                    {toPersianDigits(client.phone)}
                  </span>
                </div>

                {/* Compact 3-Metric Financial Strip */}
                <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">قراردادها</span>
                    <span className="text-[11px] font-black text-slate-800 block truncate">
                      {formatPrice(stats.totalContractValue)}
                    </span>
                  </div>
                  <div className="border-r border-slate-200/80">
                    <span className="text-[10px] text-emerald-600 font-bold block">دریافتی</span>
                    <span className="text-[11px] font-black text-emerald-700 block truncate">
                      {formatPrice(stats.totalPaid)}
                    </span>
                  </div>
                  <div className="border-r border-slate-200/80">
                    <span className="text-[10px] text-rose-500 font-bold block">مانده</span>
                    <span
                      className={`text-[11px] font-black block truncate ${
                        stats.remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatPrice(stats.remainingDebt)}
                    </span>
                  </div>
                </div>

                {/* Compact Footer */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-bold tabular-nums">
                    {toPersianDigits(stats.projectCount)} پروژه • ثبت {toPersianDigits(client.createdAt)}
                  </span>
                  <span className="text-indigo-600 font-black flex items-center gap-0.5 group-hover:translate-x-[-2px] transition-transform">
                    پرونده کامل <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ثبت شرکت یا کارفرمای جدید"
      >
        <form className="space-y-4" onSubmit={handleAddClientSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی نماینده / کارفرما *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: مهندس علیرضا محمدی"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام شرکت / سازمان *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: گروه صنعتی سپهر"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">وضعیت مشتری</label>
                <button
                  type="button"
                  onClick={() => setIsStatusManagerOpen(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Settings2 size={11} /> تعریف / ویرایش
                </button>
              </div>
              <CustomSelect
                value={newClient.status}
                onChange={(val) => setNewClient({ ...newClient, status: val })}
                options={statusSelectOptions}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">امتیاز اعتبارسنجی</label>
              <CustomSelect
                value={String(newClient.rating)}
                onChange={(val) => setNewClient({ ...newClient, rating: Number(val) })}
                options={ratingOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">شماره تماس اصلی *</label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="0912..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ایمیل</label>
              <input
                type="email"
                dir="ltr"
                placeholder="info@company.ir"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تلگرام / واتساپ</label>
              <input
                type="text"
                dir="ltr"
                placeholder="@username"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={newClient.telegramOrWhatsapp}
                onChange={(e) => setNewClient({ ...newClient, telegramOrWhatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">برچسب‌ها (با کاما جدا کنید)</label>
              <input
                type="text"
                placeholder="VIP, سازمانی, پشتیبانی"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={newClient.tags}
                onChange={(e) => setNewClient({ ...newClient, tags: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">آدرس شرکت / دفتر</label>
            <input
              type="text"
              placeholder="تهران، ..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              value={newClient.address}
              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">یادداشت اولیه</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              value={newClient.notes}
              onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              ثبت شرکت و نمایش در ابتدای لیست
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CLIENT MODAL (from Directory Card) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="ویرایش مشخصات مشتری"
      >
        <form className="space-y-4" onSubmit={handleEditClientSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                value={editClientForm.name}
                onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام شرکت / برند *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                value={editClientForm.company}
                onChange={(e) => setEditClientForm({ ...editClientForm, company: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">وضعیت مشتری</label>
                <button
                  type="button"
                  onClick={() => setIsStatusManagerOpen(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Settings2 size={11} /> تعریف / ویرایش
                </button>
              </div>
              <CustomSelect
                value={editClientForm.status}
                onChange={(val) => setEditClientForm({ ...editClientForm, status: val })}
                options={statusSelectOptions}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">امتیاز خوش‌حسابی</label>
              <CustomSelect
                value={String(editClientForm.rating)}
                onChange={(val) => setEditClientForm({ ...editClientForm, rating: Number(val) })}
                options={ratingOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تلفن همراه *</label>
              <input
                type="text"
                required
                dir="ltr"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={editClientForm.phone}
                onChange={(e) => setEditClientForm({ ...editClientForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ایمیل</label>
              <input
                type="email"
                dir="ltr"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={editClientForm.email}
                onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">آدرس</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              value={editClientForm.address}
              onChange={(e) => setEditClientForm({ ...editClientForm, address: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Status Manager Modal */}
      <OptionManagerModal
        mode="status"
        isOpen={isStatusManagerOpen}
        onClose={() => setIsStatusManagerOpen(false)}
        title="مدیریت وضعیت‌های مشتری"
        subtitle="تعریف، تغییر نام یا رنگ‌بندی وضعیت‌های کارفرمایان"
        items={clientStatuses}
        onAdd={addClientStatus}
        onUpdate={updateClientStatus}
        onDelete={deleteClientStatus}
      />

      {/* Delete Confirmation Modals */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (clientToDelete) {
            deleteClient(clientToDelete.id);
            setClientToDelete(null);
          }
        }}
        title="حذف مشتری از سیستم"
        message={`آیا از حذف «${clientToDelete?.name} (${clientToDelete?.company})» مطمئن هستید؟`}
        confirmText="بله، حذف شود"
        variant="danger"
      />

      <ConfirmModal
        isOpen={cannotDeleteInfo.isOpen}
        onClose={() => setCannotDeleteInfo({ isOpen: false, clientName: '', projectCount: 0 })}
        title="امکان حذف کارفرما وجود ندارد"
        message={`برای کارفرمای «${cannotDeleteInfo.clientName}» تعداد ${toPersianDigits(
          cannotDeleteInfo.projectCount
        )} پروژه ثبت شده است. ابتدا پروژه‌های مرتبط را حذف یا منتقل کنید.`}
        variant="warning"
        isAlertOnly
      />
    </div>
  );
};

export default Clients;
