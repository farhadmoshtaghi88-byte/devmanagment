import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Server,
  DollarSign,
  Menu,
  X,
  TrendingUp,
  AlertCircle,
  LogOut,
  Package,
  BarChart3,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { toPersianDigits, formatPrice } from '../constants';
import ConfirmModal from './ConfirmModal';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const {
    activeTab,
    navigateToMenuTab,
    financeSummary,
    projects,
    clients,
    products,
    invoices,
    currentUser
  } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'داشبورد' },
    { id: 'clients', icon: <Users size={18} />, label: 'مشتریان و کارفرمایان', count: clients.length },
    { id: 'projects', icon: <Briefcase size={18} />, label: 'پروژه‌ها و قراردادها', count: projects.length },
    { id: 'products', icon: <Package size={18} />, label: 'محصولات تولیدی', count: products.length },
    { id: 'finance', icon: <DollarSign size={18} />, label: 'تراز مالی و واریزی‌ها' },
    {
      id: 'invoices',
      icon: <FileText size={18} />,
      label: 'فاکتورها و فاکتورساز',
      count: invoices.length > 0 ? invoices.length : undefined
    },
    { id: 'bi-report', icon: <BarChart3 size={18} />, label: 'گزارش تحلیلی BI' },
    { id: 'infrastructure', icon: <Server size={18} />, label: 'سرورها، دامنه‌ها و زیرساخت' },
    { id: 'tasks', icon: <CheckSquare size={18} />, label: 'تسک‌ها و وظایف' },
    { id: 'settings', icon: <SettingsIcon size={18} />, label: 'تنظیمات و کاربران' }
  ];

  const handleConfirmLogout = () => {
    localStorage.removeItem('shaygan_auth_logged_in');
    sessionStorage.removeItem('shaygan_auth_logged_in');
    localStorage.removeItem('shaygan_auth_user_id');
    sessionStorage.removeItem('shaygan_auth_user_id');
    if (onLogout) {
      onLogout();
    }
  };

  const userInitials = (currentUser?.fullName || 'ش')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800 font-['Vazirmatn']" dir="rtl">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`no-print fixed lg:static inset-y-0 right-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-200 transform ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } border-l border-slate-800`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/30">
              <Briefcase size={19} />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight block">پنل مدیریت پروژه شایگان</span>
              <p className="text-[11px] text-slate-400">مدیریت هوشمند مالی و پروژه‌ها</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Financial Quick Summary in Sidebar */}
        <div className="p-4 mx-4 my-3 bg-slate-800/70 rounded-2xl border border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-emerald-400" /> سود خالص کل:
            </span>
            <span className="font-black text-emerald-400 tabular-nums">
              {formatPrice(financeSummary.netProfit)} تومان
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-400" /> مانده طلب:
            </span>
            <span className="font-black text-amber-400 tabular-nums">
              {formatPrice(financeSummary.pendingReceivables)} تومان
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-sidebar-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigateToMenuTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors text-xs font-bold cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[11px] font-black tabular-nums ${
                      isActive ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    {toPersianDigits(item.count)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2.5">
          <div
            onClick={() => {
              navigateToMenuTab('settings');
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between gap-2 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/90 border border-indigo-400/30 flex items-center justify-center text-white text-xs font-black shrink-0">
                {userInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                  {currentUser?.fullName || 'مدیر سیستم'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser?.title || currentUser?.role || 'مدیر ارشد'}
                </p>
              </div>
            </div>
            <SettingsIcon size={15} className="text-slate-500 group-hover:text-indigo-300 shrink-0" />
          </div>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-800/40 text-slate-400 hover:text-rose-300 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} />
            خروج از حساب کاربری
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Clean Single-Row Top Header */}
        <header className="no-print h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-base sm:text-lg font-black text-slate-800 truncate whitespace-nowrap">
              {menuItems.find((i) => i.id === activeTab)?.label || 'داشبورد'}
            </h2>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-600">
              <span>
                سود خالص:{' '}
                <strong className="text-emerald-700 font-black tabular-nums">
                  {formatPrice(financeSummary.netProfit)} تومان
                </strong>
              </span>
              <span className="text-slate-300">·</span>
              <span>
                مانده طلب:{' '}
                <strong className="text-amber-700 font-black tabular-nums">
                  {formatPrice(financeSummary.pendingReceivables)} تومان
                </strong>
              </span>
            </div>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut size={14} />
              خروج
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="خروج از پنل مدیریت شایگان"
        message="آیا مایل به خروج از حساب کاربری خود هستید؟ برای دسترسی مجدد نیاز به وارد کردن نام کاربری و رمز عبور خواهید داشت."
        confirmText="بله، خروج از سیستم"
        cancelText="انصراف"
        variant="warning"
      />
    </div>
  );
};

export default Layout;
