import React, { useState, useMemo } from 'react';
import {
  Server as ServerIcon,
  Globe,
  Plus,
  Copy,
  Check,
  Trash2,
  Edit2,
  Calendar,
  ShieldCheck,
  Layers,
  Cpu,
  HardDrive,
  X,
  Search,
  RefreshCw,
  Briefcase,
  CreditCard
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useData } from '../context/DataContext';
import { Server, Domain, InfrastructureItem } from '../types';
import { toPersianDigits, formatPrice, getTodayPersianDate } from '../constants';
import ConfirmModal from './ConfirmModal';
import CustomSelect from './CustomSelect';
import FormattedNumberInput from './FormattedNumberInput';

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

const Infrastructure: React.FC = () => {
  const {
    servers,
    domains,
    expenses,
    projects,
    addServer,
    updateServer,
    deleteServer,
    addDomain,
    updateDomain,
    deleteDomain,
    addExpense,
    updateExpense,
    deleteExpense,
    setActiveTab,
    setSelectedProjectIdForView
  } = useData();

  const [activeTabSub, setActiveTabSub] = useState<'all' | 'servers' | 'domains' | 'other'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [serverModal, setServerModal] = useState<{ open: boolean; editing: Server | null }>({
    open: false,
    editing: null
  });
  const [domainModal, setDomainModal] = useState<{ open: boolean; editing: Domain | null }>({
    open: false,
    editing: null
  });
  const [serviceModal, setServiceModal] = useState<{ open: boolean; editing: InfrastructureItem | null }>({
    open: false,
    editing: null
  });
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'server' | 'domain' | 'service';
    id: string;
    name: string;
  } | null>(null);

  // Forms
  const [serverForm, setServerForm] = useState({
    name: '',
    provider: 'آروان‌کلود',
    ip: '',
    os: 'Ubuntu 22.04 LTS',
    cpu: '4 vCPU',
    ram: '8 GB',
    storage: '100 GB NVMe',
    purchaseCost: '',
    purchaseDate: getTodayPersianDate(),
    expiration: '',
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'annual',
    projectId: projects[0]?.id || '',
    sshPort: '22',
    sshUser: 'root',
    status: 'online' as 'online' | 'warning' | 'offline',
    notes: ''
  });

  const [domainForm, setDomainForm] = useState({
    url: '',
    registrar: 'ایرنیک / ایران‌سرور',
    purchaseCost: '',
    purchaseDate: getTodayPersianDate(),
    expiration: '',
    autoRenew: true,
    projectId: projects[0]?.id || '',
    sslStatus: 'active' as 'active' | 'expired' | 'none',
    notes: ''
  });

  const [serviceForm, setServiceForm] = useState({
    type: 'cloud' as 'sms' | 'ssl' | 'cloud' | 'license',
    title: '',
    provider: '',
    purchaseCost: '',
    purchaseDate: getTodayPersianDate(),
    expirationDate: '',
    billingCycle: 'annual' as 'monthly' | 'quarterly' | 'annual' | 'one-time',
    projectId: projects[0]?.id || '',
    notes: ''
  });

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1600);
  };

  const jumpToProject = (projectId: string) => {
    setSelectedProjectIdForView(projectId);
    setActiveTab('projects');
  };

  // Other infra items (excluding server, domain, commission, and generic manual 'other')
  const otherInfraServices = useMemo(
    () =>
      expenses
        .filter((e) => ['ssl', 'sms', 'cloud', 'license'].includes(e.type))
        .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)),
    [expenses]
  );

  const sortedServers = useMemo(
    () => [...servers].sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)),
    [servers]
  );

  const sortedDomains = useMemo(
    () => [...domains].sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)),
    [domains]
  );

  const q = searchTerm.trim().toLowerCase();
  const filteredServers = sortedServers.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.ip.toLowerCase().includes(q) ||
      s.provider.toLowerCase().includes(q) ||
      (s.projectName || '').toLowerCase().includes(q)
  );
  const filteredDomains = sortedDomains.filter(
    (d) =>
      !q ||
      d.url.toLowerCase().includes(q) ||
      d.registrar.toLowerCase().includes(q) ||
      (d.projectName || '').toLowerCase().includes(q)
  );
  const filteredServices = otherInfraServices.filter(
    (e) =>
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.provider.toLowerCase().includes(q) ||
      (e.projectName || '').toLowerCase().includes(q)
  );

  const totalInfraCost = useMemo(() => {
    const srvSum = servers.reduce((s, item) => s + (item.purchaseCost || 0), 0);
    const domSum = domains.reduce((s, item) => s + (item.purchaseCost || 0), 0);
    const othSum = otherInfraServices.reduce((s, item) => s + (item.purchaseCost || 0), 0);
    return srvSum + domSum + othSum;
  }, [servers, domains, otherInfraServices]);

  // Open Server Modal
  const openAddServer = () => {
    setServerForm({
      name: '',
      provider: 'آروان‌کلود',
      ip: '',
      os: 'Ubuntu 22.04 LTS',
      cpu: '4 vCPU',
      ram: '8 GB',
      storage: '100 GB NVMe',
      purchaseCost: '',
      purchaseDate: getTodayPersianDate(),
      expiration: '',
      billingCycle: 'monthly',
      projectId: projects[0]?.id || '',
      sshPort: '22',
      sshUser: 'root',
      status: 'online',
      notes: ''
    });
    setServerModal({ open: true, editing: null });
  };

  const openEditServer = (srv: Server) => {
    setServerForm({
      name: srv.name,
      provider: srv.provider,
      ip: srv.ip,
      os: srv.os || '',
      cpu: srv.cpu || '',
      ram: srv.ram || '',
      storage: srv.storage || '',
      purchaseCost: String(srv.purchaseCost || ''),
      purchaseDate: srv.purchaseDate || getTodayPersianDate(),
      expiration: srv.expiration || '',
      billingCycle: srv.billingCycle || 'monthly',
      projectId: srv.projectId || '',
      sshPort: srv.sshPort || '22',
      sshUser: srv.sshUser || 'root',
      status: (srv.status === 'expired' ? 'offline' : srv.status) || 'online',
      notes: srv.notes || ''
    });
    setServerModal({ open: true, editing: srv });
  };

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === serverForm.projectId);
    const payload = {
      name: serverForm.name,
      provider: serverForm.provider,
      ip: serverForm.ip,
      os: serverForm.os,
      cpu: serverForm.cpu,
      ram: serverForm.ram,
      storage: serverForm.storage,
      purchaseCost: Number(serverForm.purchaseCost) || 0,
      purchaseDate: serverForm.purchaseDate,
      expiration: serverForm.expiration,
      billingCycle: serverForm.billingCycle,
      projectId: serverForm.projectId || undefined,
      projectName: proj?.title,
      clientId: proj?.clientId,
      clientName: proj?.clientName,
      sshPort: serverForm.sshPort,
      sshUser: serverForm.sshUser,
      status: serverForm.status,
      notes: serverForm.notes
    };
    if (serverModal.editing) {
      updateServer(serverModal.editing.id, payload);
    } else {
      addServer(payload);
    }
    setServerModal({ open: false, editing: null });
  };

  // Open Domain Modal
  const openAddDomain = () => {
    setDomainForm({
      url: '',
      registrar: 'ایرنیک / ایران‌سرور',
      purchaseCost: '',
      purchaseDate: getTodayPersianDate(),
      expiration: '',
      autoRenew: true,
      projectId: projects[0]?.id || '',
      sslStatus: 'active',
      notes: ''
    });
    setDomainModal({ open: true, editing: null });
  };

  const openEditDomain = (dom: Domain) => {
    setDomainForm({
      url: dom.url,
      registrar: dom.registrar,
      purchaseCost: String(dom.purchaseCost || ''),
      purchaseDate: dom.purchaseDate || getTodayPersianDate(),
      expiration: dom.expiration || '',
      autoRenew: dom.autoRenew,
      projectId: dom.projectId || '',
      sslStatus: dom.sslStatus || 'active',
      notes: dom.notes || ''
    });
    setDomainModal({ open: true, editing: dom });
  };

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === domainForm.projectId);
    const payload = {
      url: domainForm.url,
      registrar: domainForm.registrar,
      purchaseCost: Number(domainForm.purchaseCost) || 0,
      purchaseDate: domainForm.purchaseDate,
      expiration: domainForm.expiration,
      autoRenew: domainForm.autoRenew,
      projectId: domainForm.projectId || undefined,
      projectName: proj?.title,
      clientId: proj?.clientId,
      clientName: proj?.clientName,
      sslStatus: domainForm.sslStatus,
      notes: domainForm.notes
    };
    if (domainModal.editing) {
      updateDomain(domainModal.editing.id, payload);
    } else {
      addDomain(payload);
    }
    setDomainModal({ open: false, editing: null });
  };

  // Open Service Modal
  const openAddService = () => {
    setServiceForm({
      type: 'cloud',
      title: '',
      provider: '',
      purchaseCost: '',
      purchaseDate: getTodayPersianDate(),
      expirationDate: '',
      billingCycle: 'annual',
      projectId: projects[0]?.id || '',
      notes: ''
    });
    setServiceModal({ open: true, editing: null });
  };

  const openEditService = (exp: InfrastructureItem) => {
    setServiceForm({
      type: (['sms', 'ssl', 'cloud', 'license'].includes(exp.type) ? exp.type : 'cloud') as any,
      title: exp.title,
      provider: exp.provider,
      purchaseCost: String(exp.purchaseCost || ''),
      purchaseDate: exp.purchaseDate || getTodayPersianDate(),
      expirationDate: exp.expirationDate || '',
      billingCycle: exp.billingCycle || 'annual',
      projectId: exp.projectId || '',
      notes: exp.credentialsNotes || ''
    });
    setServiceModal({ open: true, editing: exp });
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === serviceForm.projectId);
    const payload = {
      type: serviceForm.type,
      title: serviceForm.title,
      provider: serviceForm.provider || 'سرویس‌دهنده',
      purchaseCost: Number(serviceForm.purchaseCost) || 0,
      purchaseDate: serviceForm.purchaseDate,
      expirationDate: serviceForm.expirationDate,
      billingCycle: serviceForm.billingCycle,
      projectId: serviceForm.projectId || undefined,
      projectName: proj?.title,
      clientId: proj?.clientId,
      clientName: proj?.clientName,
      status: 'active' as const,
      paymentStatus: 'paid' as const,
      credentialsNotes: serviceForm.notes
    };
    if (serviceModal.editing) {
      updateExpense(serviceModal.editing.id, payload);
    } else {
      addExpense(payload);
    }
    setServiceModal({ open: false, editing: null });
  };

  const projectOptions = [
    { value: '', label: 'عمومی / اشتراکی' },
    ...projects.map((p) => ({ value: p.id, label: p.title, sublabel: p.clientName }))
  ];

  const serverStatusOptions = [
    { value: 'online', label: 'آنلاین و فعال', dotColorClass: 'bg-emerald-500' },
    { value: 'warning', label: 'نیاز به بررسی / تمدید', dotColorClass: 'bg-amber-500' },
    { value: 'offline', label: 'آفلاین / متوقف', dotColorClass: 'bg-rose-500' }
  ];

  const billingOptions = [
    { value: 'monthly', label: 'ماهانه' },
    { value: 'quarterly', label: 'فصلی (۳ ماهه)' },
    { value: 'annual', label: 'سالانه' }
  ];

  const sslOptions = [
    { value: 'active', label: 'SSL فعال', dotColorClass: 'bg-emerald-500' },
    { value: 'expired', label: 'SSL منقضی', dotColorClass: 'bg-rose-500' },
    { value: 'none', label: 'بدون SSL', dotColorClass: 'bg-slate-400' }
  ];

  const serviceTypeOptions = [
    { value: 'cloud', label: 'سرویس ابری / CDN' },
    { value: 'sms', label: 'پنل پیامک / ایمیل' },
    { value: 'ssl', label: 'گواهی SSL و امنیت' },
    { value: 'license', label: 'لایسنس و اشتراک نرم‌افزار' }
  ];

  const cycleLabel = (cycle?: string) =>
    cycle === 'monthly'
      ? 'ماهانه'
      : cycle === 'quarterly'
      ? 'فصلی'
      : cycle === 'annual'
      ? 'سالانه'
      : 'یک‌باره';

  return (
    <div className="space-y-6 pb-8 font-['Vazirmatn']">
      {/* Organized Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ServerIcon className="text-indigo-600" size={26} />
            مدیریت زیرساخت، سرورها و دامنه‌ها
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            کنترل متمرکز سرورها، تاریخ تمدید دامنه‌ها، لایسنس‌ها و هزینه‌های نگهداری فنی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openAddServer}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} /> ثبت سرور جدید
          </button>
          <button
            type="button"
            onClick={openAddDomain}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Globe size={15} /> ثبت دامنه جدید
          </button>
          <button
            type="button"
            onClick={openAddService}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Layers size={15} /> سرویس / لایسنس
          </button>
        </div>
      </div>

      {/* Crisp 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">سرورهای تحت مدیریت</span>
            <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">
              {toPersianDigits(servers.length)}{' '}
              <span className="text-xs font-bold text-slate-400">دستگاه</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ServerIcon size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">دامنه‌های ثبت‌شده</span>
            <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">
              {toPersianDigits(domains.length)}{' '}
              <span className="text-xs font-bold text-slate-400">دامنه</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Globe size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">سایر سرویس‌ها و لایسنس‌ها</span>
            <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">
              {toPersianDigits(otherInfraServices.length)}{' '}
              <span className="text-xs font-bold text-slate-400">سرویس</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">مجموع هزینه زیرساخت</span>
            <p className="text-xl font-black text-rose-600 mt-1 tabular-nums">
              {formatPrice(totalInfraCost)}{' '}
              <span className="text-[11px] font-bold text-rose-400">تومان</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'همه موارد' },
            { id: 'servers', label: `سرورها (${toPersianDigits(servers.length)})` },
            { id: 'domains', label: `دامنه‌ها (${toPersianDigits(domains.length)})` },
            { id: 'other', label: `سرویس و لایسنس (${toPersianDigits(otherInfraServices.length)})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabSub(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSub === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نام سرور، IP، دامنه یا پروژه..."
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* SERVERS SECTION */}
      {(activeTabSub === 'all' || activeTabSub === 'servers') && (
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <ServerIcon size={16} className="text-indigo-600" />
            سرورها و هاست‌ها ({toPersianDigits(filteredServers.length)})
          </h4>

          {filteredServers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
              سروری با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServers.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Status + Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <ServerIcon size={18} />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-black text-slate-900 truncate">{srv.name}</h5>
                          <p className="text-[11px] font-bold text-slate-500 truncate">{srv.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditServer(srv)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ kind: 'server', id: srv.id, name: srv.name })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* IP + Status Badge */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleCopy(srv.ip)}
                        className="flex items-center gap-1.5 text-xs font-black text-slate-800 hover:text-indigo-700 cursor-pointer tabular-nums"
                        dir="ltr"
                      >
                        <span>{srv.ip}</span>
                        {copiedText === srv.ip ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} className="text-slate-400" />
                        )}
                      </button>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          srv.status === 'online'
                            ? 'bg-emerald-50 text-emerald-700'
                            : srv.status === 'warning'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            srv.status === 'online'
                              ? 'bg-emerald-500'
                              : srv.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {srv.status === 'online'
                          ? 'آنلاین'
                          : srv.status === 'warning'
                          ? 'نیاز به تمدید'
                          : 'آفلاین'}
                      </span>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-1.5 text-slate-600">
                        <Cpu size={13} className="text-indigo-500 shrink-0" />
                        <span className="truncate font-bold">{toPersianDigits(srv.cpu || '—')}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-1.5 text-slate-600">
                        <HardDrive size={13} className="text-cyan-500 shrink-0" />
                        <span className="truncate font-bold">{toPersianDigits(srv.ram || srv.storage || '—')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                    {srv.projectId && srv.projectName && (
                      <button
                        type="button"
                        onClick={() => jumpToProject(srv.projectId!)}
                        className="flex items-center gap-1.5 text-indigo-700 font-bold hover:underline cursor-pointer truncate max-w-full"
                      >
                        <Briefcase size={12} /> {srv.projectName}
                      </button>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1 tabular-nums">
                        <Calendar size={12} className="text-amber-500" />
                        انقضا: <strong className="text-slate-700">{toPersianDigits(srv.expiration || '—')}</strong>
                      </span>
                      <span className="font-black text-slate-900 tabular-nums">
                        {formatPrice(srv.purchaseCost)} تومان
                        <span className="text-[10px] font-bold text-slate-400 mr-1">
                          ({cycleLabel(srv.billingCycle)})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOMAINS SECTION */}
      {(activeTabSub === 'all' || activeTabSub === 'domains') && (
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Globe size={16} className="text-cyan-600" />
            دامنه‌ها ({toPersianDigits(filteredDomains.length)})
          </h4>

          {filteredDomains.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
              دامنه‌ای ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDomains.map((dom) => (
                <div
                  key={dom.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-cyan-300 transition-all flex flex-col justify-between gap-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                        <Globe size={18} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-black text-slate-900 truncate" dir="ltr">
                          {dom.url}
                        </h5>
                        <p className="text-[11px] font-bold text-slate-500 truncate">{dom.registrar}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditDomain(dom)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="ویرایش"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ kind: 'domain', id: dom.id, name: dom.url })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                        dom.sslStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <ShieldCheck size={12} />
                      {dom.sslStatus === 'active' ? 'SSL فعال' : 'SSL غیرفعال'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                        dom.autoRenew ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <RefreshCw size={11} />
                      {dom.autoRenew ? 'تمدید خودکار' : 'تمدید دستی'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                    {dom.projectId && dom.projectName && (
                      <button
                        type="button"
                        onClick={() => jumpToProject(dom.projectId!)}
                        className="flex items-center gap-1.5 text-indigo-700 font-bold hover:underline cursor-pointer truncate max-w-full"
                      >
                        <Briefcase size={12} /> {dom.projectName}
                      </button>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 tabular-nums">
                        انقضا: <strong className="text-slate-800">{toPersianDigits(dom.expiration || '—')}</strong>
                      </span>
                      <span className="font-black text-slate-900 tabular-nums">
                        {formatPrice(dom.purchaseCost)} تومان
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OTHER INFRA SERVICES SECTION */}
      {(activeTabSub === 'all' || activeTabSub === 'other') && (
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Layers size={16} className="text-amber-600" />
            سایر سرویس‌های ابری، پیامک و لایسنس‌ها ({toPersianDigits(filteredServices.length)})
          </h4>

          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
              سرویس جانبی ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServices.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                        {serviceTypeOptions.find((o) => o.value === exp.type)?.label || exp.type}
                      </span>
                      <h5 className="text-sm font-black text-slate-900 mt-1.5 truncate">{exp.title}</h5>
                      <p className="text-[11px] font-bold text-slate-500 truncate">{exp.provider}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditService(exp)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="ویرایش"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ kind: 'service', id: exp.id, name: exp.title })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 tabular-nums">
                      تاریخ: <strong className="text-slate-700">{toPersianDigits(exp.purchaseDate)}</strong>
                    </span>
                    <span className="font-black text-rose-600 tabular-nums">
                      {formatPrice(exp.purchaseCost)} تومان
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SERVER ADD/EDIT MODAL */}
      <Modal
        isOpen={serverModal.open}
        onClose={() => setServerModal({ open: false, editing: null })}
        title={serverModal.editing ? 'ویرایش مشخصات سرور' : 'ثبت سرور جدید'}
      >
        <form className="space-y-4" onSubmit={handleSaveServer}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نام سرور *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: سرور اصلی اپ فروشگاهی"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                value={serverForm.name}
                onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">سرویس‌دهنده (Provider) *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: آروان‌کلود، هتزنر، ابرآروان"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                value={serverForm.provider}
                onChange={(e) => setServerForm({ ...serverForm, provider: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">آدرس IP *</label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="185.110.22.14"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={serverForm.ip}
                onChange={(e) => setServerForm({ ...serverForm, ip: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">سیستم‌عامل</label>
              <input
                type="text"
                dir="ltr"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={serverForm.os}
                onChange={(e) => setServerForm({ ...serverForm, os: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">وضعیت سرور</label>
              <CustomSelect
                value={serverForm.status}
                onChange={(val) => setServerForm({ ...serverForm, status: val as any })}
                options={serverStatusOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">پردازنده (CPU)</label>
              <input
                type="text"
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={serverForm.cpu}
                onChange={(e) => setServerForm({ ...serverForm, cpu: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">حافظه رم (RAM)</label>
              <input
                type="text"
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={serverForm.ram}
                onChange={(e) => setServerForm({ ...serverForm, ram: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">فضای دیسک</label>
              <input
                type="text"
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={serverForm.storage}
                onChange={(e) => setServerForm({ ...serverForm, storage: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">هزینه سرویس *</label>
              <FormattedNumberInput
                required
                value={serverForm.purchaseCost}
                onChange={(val) => setServerForm({ ...serverForm, purchaseCost: val })}
                placeholder="مثلاً: ۱,۸۵۰,۰۰۰"
                suffix="تومان"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">دوره تمدید</label>
              <CustomSelect
                value={serverForm.billingCycle}
                onChange={(val) => setServerForm({ ...serverForm, billingCycle: val as any })}
                options={billingOptions}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تاریخ انقضا</label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={serverForm.expiration}
                onChange={(d) => setServerForm({ ...serverForm, expiration: d?.format?.('YYYY/MM/DD') || '' })}
                inputClass="rmdp-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">پروژه مرتبط</label>
            <CustomSelect
              value={serverForm.projectId}
              onChange={(val) => setServerForm({ ...serverForm, projectId: val })}
              options={projectOptions}
              searchable
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setServerModal({ open: false, editing: null })}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {serverModal.editing ? 'ذخیره تغییرات سرور' : 'ثبت سرور'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DOMAIN ADD/EDIT MODAL */}
      <Modal
        isOpen={domainModal.open}
        onClose={() => setDomainModal({ open: false, editing: null })}
        title={domainModal.editing ? 'ویرایش دامنه' : 'ثبت دامنه جدید'}
        maxWidth="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSaveDomain}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">آدرس دامنه *</label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="example.ir"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-cyan-500"
                value={domainForm.url}
                onChange={(e) => setDomainForm({ ...domainForm, url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">رجیسترار / ثبت‌کننده *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={domainForm.registrar}
                onChange={(e) => setDomainForm({ ...domainForm, registrar: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">هزینه ثبت / تمدید</label>
              <FormattedNumberInput
                value={domainForm.purchaseCost}
                onChange={(val) => setDomainForm({ ...domainForm, purchaseCost: val })}
                placeholder="مثلاً: ۴۵۰,۰۰۰"
                suffix="تومان"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تاریخ انقضا</label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={domainForm.expiration}
                onChange={(d) => setDomainForm({ ...domainForm, expiration: d?.format?.('YYYY/MM/DD') || '' })}
                inputClass="rmdp-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">وضعیت گواهی SSL</label>
              <CustomSelect
                value={domainForm.sslStatus}
                onChange={(val) => setDomainForm({ ...domainForm, sslStatus: val as any })}
                options={sslOptions}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">پروژه مرتبط</label>
              <CustomSelect
                value={domainForm.projectId}
                onChange={(val) => setDomainForm({ ...domainForm, projectId: val })}
                options={projectOptions}
                searchable
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={domainForm.autoRenew}
              onChange={(e) => setDomainForm({ ...domainForm, autoRenew: e.target.checked })}
              className="accent-indigo-600 rounded cursor-pointer"
            />
            تمدید خودکار (Auto-Renew) فعال باشد
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDomainModal({ open: false, editing: null })}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {domainModal.editing ? 'ذخیره تغییرات دامنه' : 'ثبت دامنه'}
            </button>
          </div>
        </form>
      </Modal>

      {/* OTHER SERVICE ADD/EDIT MODAL */}
      <Modal
        isOpen={serviceModal.open}
        onClose={() => setServiceModal({ open: false, editing: null })}
        title={serviceModal.editing ? 'ویرایش سرویس زیرساخت' : 'ثبت سرویس ابری / لایسنس'}
        maxWidth="max-w-xl"
      >
        <form className="space-y-4" onSubmit={handleSaveService}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نوع سرویس</label>
              <CustomSelect
                value={serviceForm.type}
                onChange={(val) => setServiceForm({ ...serviceForm, type: val as any })}
                options={serviceTypeOptions}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">عنوان سرویس *</label>
              <input
                type="text"
                required
                placeholder="مثلاً: خط اختصاصی کاوه‌نگار"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={serviceForm.title}
                onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">سرویس‌دهنده</label>
              <input
                type="text"
                placeholder="مثلاً: کاوه‌نگار / کلودفلر"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                value={serviceForm.provider}
                onChange={(e) => setServiceForm({ ...serviceForm, provider: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">مبلغ هزینه *</label>
              <FormattedNumberInput
                required
                value={serviceForm.purchaseCost}
                onChange={(val) => setServiceForm({ ...serviceForm, purchaseCost: val })}
                placeholder="مثلاً: ۱,۲۰۰,۰۰۰"
                suffix="تومان"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تاریخ خرید</label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={serviceForm.purchaseDate}
                onChange={(d) =>
                  setServiceForm({ ...serviceForm, purchaseDate: d?.format?.('YYYY/MM/DD') || '' })
                }
                inputClass="rmdp-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">پروژه مرتبط</label>
              <CustomSelect
                value={serviceForm.projectId}
                onChange={(val) => setServiceForm({ ...serviceForm, projectId: val })}
                options={projectOptions}
                searchable
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setServiceModal({ open: false, editing: null })}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {serviceModal.editing ? 'ذخیره تغییرات' : 'ثبت سرویس'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.kind === 'server') deleteServer(deleteTarget.id);
          else if (deleteTarget.kind === 'domain') deleteDomain(deleteTarget.id);
          else deleteExpense(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="حذف آیتم زیرساخت"
        message={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟`}
        confirmText="بله، حذف شود"
        variant="danger"
      />
    </div>
  );
};

export default Infrastructure;
