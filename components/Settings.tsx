import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Users,
  Lock,
  CreditCard,
  ListChecks,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Download,
  Upload
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { BankAccount, SystemUser, StatusColorKey } from '../types';
import {
  toPersianDigits,
  formatCardNumber,
  STATUS_COLOR_STYLES,
  STATUS_COLOR_OPTIONS
} from '../constants';
import CustomSelect from './CustomSelect';
import ConfirmModal from './ConfirmModal';

const Settings: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    changeCurrentUserPassword,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    clientStatuses,
    addClientStatus,
    updateClientStatus,
    deleteClientStatus,
    projectStatuses,
    addProjectStatus,
    updateProjectStatus,
    deleteProjectStatus,
    projectCategories,
    addProjectCategory,
    updateProjectCategory,
    deleteProjectCategory,
    expenseCategories,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    expenseTypes,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
    productCostTypes,
    addProductCostType,
    updateProductCostType,
    deleteProductCostType,
    techStacks,
    addTechStack,
    updateTechStack,
    deleteTechStack,
    productDomains,
    addProductDomain,
    updateProductDomain,
    deleteProductDomain,
    exportBackup,
    importBackup
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'security' | 'users' | 'banks' | 'lists' | 'backup'>('security');


  // --- Profile & Password Change State ---
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName || '',
    title: currentUser?.title || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || ''
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // --- Users Management State ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'توسعه‌دهنده' as SystemUser['role'],
    title: '',
    email: '',
    phone: '',
    isActive: true
  });
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

  // --- Bank Accounts State ---
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolder: '',
    cardNumber: '',
    iban: '',
    accountNumber: '',
    type: 'کارت بانکی' as BankAccount['type'],
    isDefault: false
  });

  // --- Configurable Lists State ---
  const [activeListType, setActiveListType] = useState<
    | 'clientStatuses'
    | 'projectStatuses'
    | 'expenseTypes'
    | 'projectCategories'
    | 'productDomains'
    | 'expenseCategories'
    | 'productCostTypes'
    | 'techStacks'
  >('clientStatuses');
  const [newListItem, setNewListItem] = useState('');
  const [newListColor, setNewListColor] = useState<StatusColorKey>('indigo');
  const [editingListKey, setEditingListKey] = useState<string | null>(null);
  const [editingListVal, setEditingListVal] = useState('');
  const [editingListColor, setEditingListColor] = useState<StatusColorKey>('indigo');

  // Profile Submit
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    updateUser(currentUser.id, {
      fullName: profileForm.fullName.trim(),
      title: profileForm.title.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim()
    });
    setProfileSavedMsg('اطلاعات پروفایل با موفقیت ذخیره شد.');
    setTimeout(() => setProfileSavedMsg(''), 3000);
  };

  // Password Change Submit
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdFeedback({ ok: false, message: 'تکرار رمز عبور جدید با رمز عبور جدید مطابقت ندارد.' });
      return;
    }
    const res = changeCurrentUserPassword(pwdForm.currentPassword, pwdForm.newPassword);
    setPwdFeedback(res);
    if (res.ok) {
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  // User Modal Handlers
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({
      fullName: '',
      username: '',
      password: '',
      role: 'توسعه‌دهنده',
      title: '',
      email: '',
      phone: '',
      isActive: true
    });
    setIsUserModalOpen(true);
  };

  const openEditUser = (u: SystemUser) => {
    setEditingUser(u);
    setUserForm({
      fullName: u.fullName,
      username: u.username,
      password: u.password,
      role: u.role,
      title: u.title || '',
      email: u.email || '',
      phone: u.phone || '',
      isActive: u.isActive
    });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, {
        fullName: userForm.fullName.trim(),
        username: userForm.username.trim(),
        password: userForm.password.trim() || editingUser.password,
        role: userForm.role,
        title: userForm.title.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        isActive: userForm.isActive
      });
    } else {
      addUser({
        fullName: userForm.fullName.trim(),
        username: userForm.username.trim(),
        password: userForm.password.trim() || '123456',
        role: userForm.role,
        title: userForm.title.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        isActive: userForm.isActive
      });
    }
    setIsUserModalOpen(false);
  };

  // Bank Modal Handlers
  const openAddBank = () => {
    setEditingBank(null);
    setBankForm({
      bankName: '',
      accountHolder: '',
      cardNumber: '',
      iban: '',
      accountNumber: '',
      type: 'کارت بانکی',
      isDefault: false
    });
    setIsBankModalOpen(true);
  };

  const openEditBank = (b: BankAccount) => {
    setEditingBank(b);
    setBankForm({
      bankName: b.bankName,
      accountHolder: b.accountHolder,
      cardNumber: b.cardNumber || '',
      iban: b.iban || '',
      accountNumber: b.accountNumber || '',
      type: b.type,
      isDefault: Boolean(b.isDefault)
    });
    setIsBankModalOpen(true);
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBank) {
      updateBankAccount(editingBank.id, {
        bankName: bankForm.bankName.trim(),
        accountHolder: bankForm.accountHolder.trim(),
        cardNumber: bankForm.cardNumber.trim() || undefined,
        iban: bankForm.iban.trim() || undefined,
        accountNumber: bankForm.accountNumber.trim() || undefined,
        type: bankForm.type,
        isDefault: bankForm.isDefault
      });
    } else {
      addBankAccount({
        bankName: bankForm.bankName.trim(),
        accountHolder: bankForm.accountHolder.trim(),
        cardNumber: bankForm.cardNumber.trim() || undefined,
        iban: bankForm.iban.trim() || undefined,
        accountNumber: bankForm.accountNumber.trim() || undefined,
        type: bankForm.type,
        isDefault: bankForm.isDefault
      });
    }
    setIsBankModalOpen(false);
  };

  // Configurable List Handlers
  const handleAddListItem = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newListItem.trim();
    if (!val) return;
    if (activeListType === 'clientStatuses') addClientStatus(val, newListColor);
    else if (activeListType === 'projectStatuses') addProjectStatus(val, newListColor);
    else if (activeListType === 'expenseTypes') addExpenseType(val, newListColor);
    else if (activeListType === 'projectCategories') addProjectCategory(val);
    else if (activeListType === 'productDomains') addProductDomain(val);
    else if (activeListType === 'expenseCategories') addExpenseCategory(val);
    else if (activeListType === 'productCostTypes') addProductCostType(val);
    else if (activeListType === 'techStacks') addTechStack(val);
    setNewListItem('');
  };

  const handleSaveListEdit = () => {
    const val = editingListVal.trim();
    if (!val || !editingListKey) return;
    if (activeListType === 'clientStatuses') updateClientStatus(editingListKey, val, editingListColor);
    else if (activeListType === 'projectStatuses') updateProjectStatus(editingListKey, val, editingListColor);
    else if (activeListType === 'expenseTypes') updateExpenseType(editingListKey, val, editingListColor);
    else if (activeListType === 'projectCategories') updateProjectCategory(editingListKey, val);
    else if (activeListType === 'productDomains') updateProductDomain(editingListKey, val);
    else if (activeListType === 'expenseCategories') updateExpenseCategory(editingListKey, val);
    else if (activeListType === 'productCostTypes') updateProductCostType(editingListKey, val);
    else if (activeListType === 'techStacks') updateTechStack(editingListKey, val);
    setEditingListKey(null);
  };

  const isStatusList =
    activeListType === 'clientStatuses' ||
    activeListType === 'projectStatuses' ||
    activeListType === 'expenseTypes';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <SettingsIcon className="text-indigo-600" size={26} />
            تنظیمات سیستم و مدیریت کاربران
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            مدیریت حساب کاربری، تغییر رمز عبور، کاربران سیستم، کارت‌ها و حساب‌های بانکی و دسته‌بندی‌های قابل تعریف
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200">
        {[
          { id: 'security', label: 'پروفایل من و تغییر رمز عبور', icon: <Lock size={15} /> },
          { id: 'users', label: `مدیریت کاربران (${toPersianDigits(users.length)})`, icon: <Users size={15} /> },
          { id: 'banks', label: `حساب‌ها و کارت‌های بانکی (${toPersianDigits(bankAccounts.length)})`, icon: <CreditCard size={15} /> },
          { id: 'lists', label: 'مدیریت وضعیت‌ها و دسته‌بندی‌ها', icon: <ListChecks size={15} /> },
          { id: 'backup', label: 'پشتیبان‌گیری و بازیابی اطلاعات', icon: <Download size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Download size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-lg">پشتیبان‌گیری کامل و بازیابی اطلاعات</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                شما می‌توانید در هر لحظه از تمامی داده‌های سیستم (پروژه‌ها، مشتریان، محصولات، فاکتورها، تراکنش‌ها و تنظیمات) پشتیبان بگیرید یا اطلاعات را بازیابی کنید.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Download size={16} className="text-indigo-600" /> دانلود فایل پشتیبان (JSON)
                </h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  فایل پشتیبان شامل تمامی سوابق مالی، پروژه‌ها، فاکتورها و تنظیمات است و روی سیستم شما ذخیره می‌شود.
                </p>
              </div>
              <button
                type="button"
                onClick={exportBackup}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Download size={16} /> دانلود پشتیبان سیستم
              </button>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Upload size={16} className="text-emerald-600" /> بازیابی اطلاعات از فایل پشتیبان
                </h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  با انتخاب یک فایل پشتیبان قبلی (JSON)، تمامی داده‌های سیستم جایگزین یا به‌روزرسانی می‌شوند.
                </p>
              </div>
              <div>
                <label className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                  <Upload size={16} /> انتخاب فایل پشتیبان و بازیابی
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) {
                          const success = importBackup(content);
                          if (success) {
                            alert('اطلاعات با موفقیت بازیابی شد. صفحه مجدداً بارگذاری می‌شود.');
                            window.location.reload();
                          } else {
                            alert('خطا در خواندن فایل پشتیبان. لطفاً فایل معتبر JSON انتخاب کنید.');
                          }
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 1: PROFILE & PASSWORD */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Profile */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserCheck size={22} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-base">مشخصات حساب کاربری فعال</h4>
                <p className="text-xs text-slate-400">
                  نام کاربری: <span className="font-bold text-slate-700">{currentUser?.username}</span> · نقش: {currentUser?.role}
                </p>
              </div>
            </div>

            {profileSavedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {profileSavedMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">سمت / عنوان شغلی</label>
                  <input
                    type="text"
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ایمیل</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">شماره تماس</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ذخیره اطلاعات پروفایل
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-base">تغییر رمز عبور حساب</h4>
                  <p className="text-xs text-slate-400">رمز عبور جدید بلافاصله برای ورودهای بعدی اعمال می‌شود</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                title={showPwd ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {pwdFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  pwdFeedback.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {pwdFeedback.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {pwdFeedback.message}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">رمز عبور فعلی *</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  placeholder="رمز عبور فعلی را وارد کنید"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رمز عبور جدید *</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    placeholder="حداقل ۴ کاراکتر"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تکرار رمز عبور جدید *</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    placeholder="تکرار رمز جدید"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                بروزرسانی رمز عبور
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-slate-800 text-base">کاربران و دسترسی‌های سیستم</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                تعریف کاربران جدید، تعیین نقش و تغییر رمز عبور هر کاربر
              </p>
            </div>
            <button
              type="button"
              onClick={openAddUser}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} /> افزودن کاربر جدید
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">نام و سمت</th>
                  <th className="p-3.5">نام کاربری</th>
                  <th className="p-3.5">نقش دسترسی</th>
                  <th className="p-3.5">تماس و ایمیل</th>
                  <th className="p-3.5">وضعیت</th>
                  <th className="p-3.5">تاریخ عضویت</th>
                  <th className="p-3.5">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isMe = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {isMe && <span className="text-[10px] text-indigo-600 font-black">(حساب فعلی)</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.title || '—'}</div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">{u.username}</td>
                      <td className="p-3.5">
                        <span className="text-xs font-bold text-indigo-700">{u.role}</span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        <div>{u.email || '—'}</div>
                        <div className="text-[11px] tabular-nums">{toPersianDigits(u.phone || '')}</div>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          disabled={isMe}
                          onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {u.isActive ? 'فعال' : 'غیرفعال'}
                        </button>
                      </td>
                      <td className="p-3.5 text-slate-500 tabular-nums">{toPersianDigits(u.createdAt)}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditUser(u)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                            title="ویرایش کاربر و رمز عبور"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={isMe || users.length <= 1}
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-30"
                            title="حذف کاربر"
                          >
                            <Trash2 size={14} />
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

      {/* TAB 3: BANK ACCOUNTS & CARDS */}
      {activeSubTab === 'banks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h4 className="font-black text-slate-800 text-base">حساب‌ها، کارت‌های بانکی و صندوق‌ها</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                هنگام ثبت دریافتی از کارفرمایان، کارت یا حساب مقصد از این لیست انتخاب می‌شود
              </p>
            </div>
            <button
              type="button"
              onClick={openAddBank}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} /> افزودن حساب / کارت بانکی
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between gap-4 hover:border-indigo-300 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-800 text-sm">{acc.bankName}</h5>
                        <p className="text-[11px] text-slate-500">
                          {acc.type} {acc.isDefault ? '· پیش‌فرض' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditBank(acc)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="ویرایش"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={bankAccounts.length <= 1}
                        onClick={() => deleteBankAccount(acc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-30"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">صاحب حساب:</span>
                      <span className="font-bold text-slate-800">{acc.accountHolder}</span>
                    </div>
                    {acc.cardNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">شماره کارت:</span>
                        <span dir="ltr" className="font-black text-indigo-700 tabular-nums">
                          {formatCardNumber(acc.cardNumber)}
                        </span>
                      </div>
                    )}
                    {acc.iban && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 shrink-0">شماره شبا:</span>
                        <span dir="ltr" className="font-bold text-slate-700 text-[11px] truncate tabular-nums">
                          {toPersianDigits(acc.iban)}
                        </span>
                      </div>
                    )}
                    {acc.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">شماره حساب:</span>
                        <span dir="ltr" className="font-bold text-slate-700 tabular-nums">
                          {toPersianDigits(acc.accountNumber)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURABLE LISTS */}
      {activeSubTab === 'lists' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-1.5 h-fit">
            {[
              { id: 'clientStatuses', label: 'وضعیت‌های مشتری', count: clientStatuses.length },
              { id: 'projectStatuses', label: 'وضعیت‌های پروژه', count: projectStatuses.length },
              { id: 'expenseTypes', label: 'انواع هزینه (پروژه و مالی)', count: expenseTypes.length },
              { id: 'projectCategories', label: 'دسته‌بندی‌های پروژه', count: projectCategories.length },
              { id: 'productDomains', label: 'زمینه‌های محصولات', count: productDomains.length },
              { id: 'expenseCategories', label: 'سرفصل‌های موضوعی هزینه', count: expenseCategories.length },
              { id: 'productCostTypes', label: 'انواع و بخش‌های هزینه محصول', count: productCostTypes.length },
              { id: 'techStacks', label: 'لیست تکنولوژی‌ها و استک', count: techStacks.length }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveListType(item.id as any);
                  setEditingListKey(null);
                  setNewListItem('');
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeListType === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                <span className="tabular-nums opacity-80">{toPersianDigits(item.count)}</span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <form onSubmit={handleAddListItem} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newListItem}
                  onChange={(e) => setNewListItem(e.target.value)}
                  placeholder="عنوان آیتم جدید را وارد کنید..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus size={15} /> افزودن
                </button>
              </div>

              {isStatusList && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 ml-1">رنگ برچسب:</span>
                  {STATUS_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setNewListColor(c.key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        newListColor === c.key
                          ? 'border-slate-900 bg-white text-slate-900 shadow-sm'
                          : 'border-transparent bg-white/60 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLOR_STYLES[c.key].dot}`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pl-1">
              {isStatusList
                ? (activeListType === 'clientStatuses'
                    ? clientStatuses
                    : activeListType === 'projectStatuses'
                    ? projectStatuses
                    : expenseTypes
                  ).map((st) => {
                    const isEditing = editingListKey === st.id;
                    const style = STATUS_COLOR_STYLES[st.color] || STATUS_COLOR_STYLES.slate;
                    return (
                      <div
                        key={st.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col gap-2"
                      >
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingListVal}
                                onChange={(e) => setEditingListVal(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-indigo-400 rounded-lg text-xs font-bold outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleSaveListEdit}
                                className="p-1.5 bg-emerald-600 text-white rounded-lg cursor-pointer"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingListKey(null)}
                                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {STATUS_COLOR_OPTIONS.map((c) => (
                                <button
                                  key={c.key}
                                  type="button"
                                  onClick={() => setEditingListColor(c.key)}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                    editingListColor === c.key ? 'border-slate-900 bg-slate-50' : 'border-slate-100'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${STATUS_COLOR_STYLES[c.key].dot}`} />
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                              <span className="text-xs font-bold text-slate-800">{st.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingListKey(st.id);
                                  setEditingListVal(st.label);
                                  setEditingListColor(st.color);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  activeListType === 'clientStatuses'
                                    ? deleteClientStatus(st.id)
                                    : activeListType === 'projectStatuses'
                                    ? deleteProjectStatus(st.id)
                                    : deleteExpenseType(st.id)
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                : (activeListType === 'projectCategories'
                    ? projectCategories
                    : activeListType === 'productDomains'
                    ? productDomains
                    : activeListType === 'expenseCategories'
                    ? expenseCategories
                    : activeListType === 'productCostTypes'
                    ? productCostTypes
                    : techStacks
                  ).map((item) => {
                    const isEditing = editingListKey === item;
                    return (
                      <div
                        key={item}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingListVal}
                              onChange={(e) => setEditingListVal(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-slate-50 border border-indigo-400 rounded-lg text-xs font-bold outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveListEdit}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingListKey(null)}
                              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-slate-800">{item}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingListKey(item);
                                  setEditingListVal(item);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeListType === 'projectCategories') deleteProjectCategory(item);
                                  else if (activeListType === 'productDomains') deleteProductDomain(item);
                                  else if (activeListType === 'expenseCategories') deleteExpenseCategory(item);
                                  else if (activeListType === 'productCostTypes') deleteProductCostType(item);
                                  else deleteTechStack(item);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" />
                {editingUser ? `ویرایش کاربر: ${editingUser.fullName}` : 'تعریف کاربر جدید'}
              </h4>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام کاربری (ورود) *</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    رمز عبور {editingUser ? '(در صورت تغییر وارد کنید)' : '*'}
                  </label>
                  <input
                    type="text"
                    required={!editingUser}
                    dir="ltr"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نقش کاربری</label>
                  <CustomSelect
                    value={userForm.role}
                    onChange={(val) => setUserForm({ ...userForm, role: val as any })}
                    options={[
                      { value: 'مدیر کل', label: 'مدیر کل (دسترسی کامل)' },
                      { value: 'مدیر پروژه', label: 'مدیر پروژه' },
                      { value: 'حسابدار', label: 'حسابدار و امور مالی' },
                      { value: 'توسعه‌دهنده', label: 'توسعه‌دهنده' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">سمت / عنوان</label>
                  <input
                    type="text"
                    value={userForm.title}
                    onChange={(e) => setUserForm({ ...userForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">شماره تماس</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ایمیل</label>
                <input
                  type="email"
                  dir="ltr"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editingUser ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT BANK ACCOUNT MODAL */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-600" />
                {editingBank ? 'ویرایش حساب بانکی' : 'افزودن حساب / کارت بانکی'}
              </h4>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBankSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام بانک یا صندوق *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: بانک ملت"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نوع حساب</label>
                  <CustomSelect
                    value={bankForm.type}
                    onChange={(val) => setBankForm({ ...bankForm, type: val as any })}
                    options={[
                      { value: 'کارت بانکی', label: 'کارت بانکی' },
                      { value: 'حساب شبا', label: 'حساب شبا / پایا' },
                      { value: 'درگاه پرداخت', label: 'درگاه پرداخت آنلاین' },
                      { value: 'حساب چک', label: 'حساب چک صیادی' },
                      { value: 'صندوق نقدی', label: 'صندوق نقدی' }
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نام صاحب حساب / عنوان *</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: شرکت فناوری شایگان"
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">شماره کارت (۱۶ رقم)</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="61043378..."
                    value={bankForm.cardNumber}
                    onChange={(e) => setBankForm({ ...bankForm, cardNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">شماره حساب</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="8452193001"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">شماره شبا (IBAN)</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="IR..."
                  value={bankForm.iban}
                  onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankForm.isDefault}
                  onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                  className="rounded accent-indigo-600 cursor-pointer"
                />
                انتخاب به عنوان حساب پیش‌فرض دریافتی‌ها
              </label>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editingBank ? 'ذخیره تغییرات' : 'ثبت حساب بانکی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) deleteUser(userToDelete.id);
          setUserToDelete(null);
        }}
        title="تایید حذف کاربر"
        message={userToDelete ? `آیا از حذف کاربر «${userToDelete.fullName}» (${userToDelete.username}) اطمینان دارید؟` : ''}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        variant="danger"
      />
    </div>
  );
};

export default Settings;
