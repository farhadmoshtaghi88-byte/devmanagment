import {
  Client,
  Project,
  ProjectStatus,
  Task,
  Server,
  Domain,
  ProjectPayment,
  InfrastructureItem,
  StatusConfig,
  StatusColorKey,
  BankAccount,
  SystemUser,
  Product,
  ProductCostItem,
  ProductSale,
  ProductSaleEvent,
  InvoiceSellerProfile
} from './types';

// Convert Latin digits to Persian digits
export const toPersianDigits = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

// Convert Persian/Arabic digits to English digits for parsing
export const toEnglishDigits = (str: string | number | undefined | null): string => {
  if (str === undefined || str === null) return '';
  const persianMap: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  return str.toString().replace(/[۰-۹٠-٩]/g, (ch) => persianMap[ch] ?? ch);
};

// Parse formatted numeric string into a clean integer/number
export const parseFormattedNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = toEnglishDigits(String(value)).replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

// Format number with 3-digit comma separators and Persian digits
export const formatPrice = (n: number | undefined | null): string => {
  if (n === undefined || n === null || Number.isNaN(n)) return '۰';
  const rounded = Math.round(n);
  const absFormatted = Math.abs(rounded).toLocaleString('en-US');
  const persian = toPersianDigits(absFormatted);
  return rounded < 0 ? `${persian}-` : persian;
};

// Convert integer amount (Toman) to official Persian words for invoices
export const numberToPersianWords = (input: number | undefined | null): string => {
  if (input === undefined || input === null || Number.isNaN(input)) return 'صفر';
  const num = Math.round(Math.abs(input));
  if (num === 0) return 'صفر';

  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = [
    'ده',
    'یازده',
    'دوازده',
    'سیزده',
    'چهارده',
    'پانزده',
    'شانزده',
    'هفده',
    'هجده',
    'نوزده'
  ];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  const threeDigitsToWords = (n: number): string => {
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) parts.push(hundreds[h]);
    if (rem >= 10 && rem < 20) {
      parts.push(teens[rem - 10]);
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (t > 0) parts.push(tens[t]);
      if (o > 0) parts.push(ones[o]);
    }
    return parts.join(' و ');
  };

  const groups: string[] = [];
  let remaining = num;
  let scaleIndex = 0;
  while (remaining > 0 && scaleIndex < scales.length) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = threeDigitsToWords(chunk);
      const scale = scales[scaleIndex];
      groups.unshift(scale ? `${chunkWords} ${scale}` : chunkWords);
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return (input < 0 ? 'منفی ' : '') + groups.join(' و ');
};

// Format numeric string while typing (keeps only digits, adds 3-digit commas & Persian digits)
export const formatInputNumber = (raw: string | number | undefined | null): string => {
  if (raw === undefined || raw === null) return '';
  const digits = toEnglishDigits(String(raw)).replace(/[^0-9]/g, '');
  if (!digits) return '';
  const formatted = Number(digits).toLocaleString('en-US');
  return toPersianDigits(formatted);
};

// Format card number in 4-digit groups with Persian digits
export const formatCardNumber = (card?: string): string => {
  if (!card) return '';
  const digits = toEnglishDigits(card).replace(/\D/g, '').slice(0, 16);
  const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1-');
  return toPersianDigits(grouped);
};

// Get today's Persian date string YYYY/MM/DD in English digits for DatePicker compatibility
export const getTodayPersianDate = (): string => {
  try {
    const formatted = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    return formatted.replace(/-/g, '/');
  } catch {
    return '1403/03/01';
  }
};

// Add N months to a Persian date YYYY/MM/DD (safe Persian calendar arithmetic)
export const addMonthsToPersianDate = (persianDate: string, months: number): string => {
  if (!persianDate || !months) return persianDate;
  const eng = toEnglishDigits(persianDate).trim();
  const parts = eng.split(/[\/\-]/).map((p) => parseInt(p, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return persianDate;
  let [year, month, day] = parts;
  const totalMonths = (month - 1) + months;
  year += Math.floor(totalMonths / 12);
  month = (totalMonths % 12) + 1;
  const maxDay = month <= 6 ? 31 : month <= 11 ? 30 : 29;
  day = Math.min(day, maxDay);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}/${pad(month)}/${pad(day)}`;
};

// Compare two Persian dates YYYY/MM/DD roughly in days (positive = dateA > dateB)
export const diffPersianDatesInDays = (dateA?: string, dateB?: string): number | null => {
  if (!dateA || !dateB) return null;
  const parse = (d: string) => {
    const parts = toEnglishDigits(d).split(/[\/\-]/).map((x) => parseInt(x, 10));
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return parts[0] * 365 + (parts[1] - 1) * 30.4 + parts[2];
  };
  const a = parse(dateA);
  const b = parse(dateB);
  if (a === null || b === null) return null;
  return Math.round(a - b);
};

// Evaluate product support status relative to today's Persian date
export const getProductSupportStatus = (
  hasSupport: boolean,
  endDate?: string
): 'active' | 'expiring' | 'expired' | 'none' => {
  if (!hasSupport) return 'none';
  if (!endDate) return 'active';
  const today = getTodayPersianDate();
  const daysLeft = diffPersianDatesInDays(endDate, today);
  if (daysLeft === null) return 'active';
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 35) return 'expiring';
  return 'active';
};

// Always return a normalized chronological event ledger for any ProductSale (backward-compatible with legacy records)
export const getNormalizedSaleEvents = (sale: ProductSale): ProductSaleEvent[] => {
  if (sale.events && sale.events.length > 0) {
    return sale.events;
  }
  const type: ProductSaleEvent['type'] =
    sale.saleType === 'ارتقای نسخه'
      ? 'upgrade'
      : sale.saleType === 'تمدید پشتیبانی'
      ? 'renewal'
      : 'purchase';
  const title =
    type === 'upgrade'
      ? `ارتقای نسخه${sale.upgradedFromTierName && sale.tierName ? ` از ${sale.upgradedFromTierName} به ${sale.tierName}` : ''}`
      : type === 'renewal'
      ? `تمدید پشتیبانی${sale.supportMonths ? ` (${toPersianDigits(sale.supportMonths)} ماهه)` : ''}`
      : `خرید اولیه (${sale.saleType}${sale.tierName ? ` — ${sale.tierName}` : ''})`;

  return [
    {
      id: `evt-init-${sale.id}`,
      type,
      date: sale.date,
      title,
      amountDelta: sale.totalAmount,
      paidAmount: sale.paidAmount,
      method: sale.method,
      bankAccountId: sale.bankAccountId,
      bankAccountLabel: sale.bankAccountLabel,
      trackingCode: sale.trackingCode,
      fromTierName: sale.upgradedFromTierName,
      toTierName: sale.tierName,
      supportMonthsAdded: sale.hasSupport ? sale.supportMonths : undefined,
      notes: sale.notes,
      createdTimestamp: sale.createdTimestamp || 0
    }
  ];
};

// Color utility map for dynamic client & project statuses
export const STATUS_COLOR_STYLES: Record<StatusColorKey, { badge: string; dot: string; activeBtn: string; softBg: string; text: string }> = {
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    activeBtn: 'bg-amber-500 text-white border-amber-500',
    softBg: 'bg-amber-50',
    text: 'text-amber-700'
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    activeBtn: 'bg-emerald-600 text-white border-emerald-600',
    softBg: 'bg-emerald-50',
    text: 'text-emerald-700'
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    activeBtn: 'bg-indigo-600 text-white border-indigo-600',
    softBg: 'bg-indigo-50',
    text: 'text-indigo-700'
  },
  blue: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    activeBtn: 'bg-blue-600 text-white border-blue-600',
    softBg: 'bg-blue-50',
    text: 'text-blue-700'
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    activeBtn: 'bg-purple-600 text-white border-purple-600',
    softBg: 'bg-purple-50',
    text: 'text-purple-700'
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    activeBtn: 'bg-rose-600 text-white border-rose-600',
    softBg: 'bg-rose-50',
    text: 'text-rose-700'
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-500',
    activeBtn: 'bg-cyan-600 text-white border-cyan-600',
    softBg: 'bg-cyan-50',
    text: 'text-cyan-700'
  },
  slate: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    activeBtn: 'bg-slate-700 text-white border-slate-700',
    softBg: 'bg-slate-100',
    text: 'text-slate-700'
  }
};

export const STATUS_COLOR_OPTIONS: Array<{ key: StatusColorKey; label: string }> = [
  { key: 'indigo', label: 'نیلی' },
  { key: 'emerald', label: 'سبز زمردی' },
  { key: 'amber', label: 'طلایی / کهربایی' },
  { key: 'blue', label: 'آبی' },
  { key: 'purple', label: 'بنفش' },
  { key: 'rose', label: 'قرمز / رز' },
  { key: 'cyan', label: 'فیروزه‌ای' },
  { key: 'slate', label: 'خاکستری' },
];

export const DEFAULT_CLIENT_STATUSES: StatusConfig[] = [
  { id: 'vip', label: 'مشتری ویژه (VIP)', color: 'amber' },
  { id: 'active', label: 'فعال و خوش‌حساب', color: 'emerald' },
  { id: 'lead', label: 'لید / در حال مذاکره', color: 'blue' },
  { id: 'inactive', label: 'غیرفعال / بایگانی', color: 'slate' }
];

export const DEFAULT_EXPENSE_TYPES: StatusConfig[] = [
  { id: 'other', label: 'هزینه‌های موضوعی و تیمی', color: 'amber' },
  { id: 'commission', label: 'پورسانت معرفی و بازاریابی', color: 'purple' },
  { id: 'server', label: 'سرور و میزبانی', color: 'cyan' },
  { id: 'domain', label: 'دامنه', color: 'blue' },
  { id: 'ssl', label: 'گواهی SSL و امنیت', color: 'emerald' },
  { id: 'sms', label: 'پنل پیامک / ایمیل', color: 'indigo' },
  { id: 'cloud', label: 'سرویس ابری / CDN', color: 'cyan' },
  { id: 'license', label: 'لایسنس و ابزار نرم‌افزاری', color: 'slate' }
];

export const DEFAULT_PRODUCT_COST_TYPES: string[] = [
  'توسعه اولیه',
  'نگهداری و زیرساخت',
  'بازاریابی و فروش',
  'پشتیبانی و تیم فنی',
  'سایر'
];

export const SHAYEGAN_DEFAULT_LOGO_URL =
  '/assets/aistudio/Shayegan_Logotype_Final_-_2016-01__2__4ae3f67b.png';

export const DEFAULT_INVOICE_SELLER_PROFILE: InvoiceSellerProfile = {
  companyName: 'راهکارهای هوشمند شایگان',
  tagline: 'طراحی و توسعه نرم‌افزار، سامانه‌های ابری و راهکارهای دیجیتال',
  logoUrl: SHAYEGAN_DEFAULT_LOGO_URL,
  phone: '۰۲۱-۸۸۷۷۶۶۵۵',
  email: 'billing@shayegan-smart.ir',
  website: 'shayegan-smart.ir',
  address: 'تهران، خیابان ولیعصر، برج فناوری شایگان، واحد ۴۰۲',
  nationalId: '۱۴۰۰۹۸۷۶۵۴۳',
  economicCode: '۴۱۱۵۶۷۸۹۱۲۳۴',
  defaultBankAccountId: 'bank-1',
  signerName: 'مدیریت مالی راهکارهای هوشمند شایگان',
  signerRole: 'واحد فروش و مالی',
  defaultTerms:
    '۱. اعتبار این پیش‌فاکتور / صورت‌حساب ۷ روز کاری از تاریخ صدور است.\n۲. پس از واریز وجه، لطفاً تصویر فیش یا شماره پیگیری را برای تایید و صدور رسید نهایی ارسال فرمایید.\n۳. خدمات پشتیبانی طبق تعهدات درج‌شده در قرارداد و شرح اقلام ارائه می‌گردد.'
};

export const DEFAULT_PROJECT_STATUSES: StatusConfig[] = [
  { id: ProjectStatus.Proposal, label: ProjectStatus.Proposal, color: 'amber' },
  { id: ProjectStatus.Active, label: ProjectStatus.Active, color: 'indigo' },
  { id: ProjectStatus.Testing, label: ProjectStatus.Testing, color: 'purple' },
  { id: ProjectStatus.Delivered, label: ProjectStatus.Delivered, color: 'emerald' },
  { id: ProjectStatus.Support, label: ProjectStatus.Support, color: 'blue' },
  { id: ProjectStatus.Paused, label: ProjectStatus.Paused, color: 'rose' }
];

export const DEFAULT_PROJECT_CATEGORIES: string[] = [
  'وب‌اپلیکیشن',
  'سایت شرکتی',
  'فروشگاه آنلاین',
  'اپ موبایل',
  'بات و اتوماسیون',
  'طراحی UI/UX',
  'سایر'
];

export const DEFAULT_TECH_STACKS: string[] = [
  'React',
  'React 19',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'NestJS',
  'Express',
  'PostgreSQL',
  'MongoDB',
  'MySQL',
  'Redis',
  'Docker',
  'Tailwind CSS',
  'Python',
  'Django',
  'FastAPI',
  'Go',
  'PHP',
  'Laravel',
  'Flutter',
  'React Native',
  'Vue.js',
  'GraphQL',
  'Socket.io',
  'Strapi CMS',
  'MinIO',
  'Prometheus',
  'Telegram API',
  'Nginx'
];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'طراحی گرافیک و UI',
  'مشاوره فنی و معماری',
  'تست و ارزیابی امنیتی',
  'تولید محتوا و ترجمه',
  'ایاب ذهاب و جلسات حضوری',
  'خرید تجهیزات و سخت‌افزار',
  'پاداش و کارانه تیم'
];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'بانک ملت',
    accountHolder: 'فرهاد شایگان (حساب اصلی)',
    cardNumber: '6104337812345678',
    iban: 'IR820120000000008452193001',
    accountNumber: '8452193001',
    type: 'حساب شبا',
    isDefault: true
  },
  {
    id: 'bank-2',
    bankName: 'بانک پاسارگاد',
    accountHolder: 'شرکت فناوری شایگان',
    cardNumber: '5022291098765432',
    iban: 'IR450570020180012345678901',
    accountNumber: '201-800-123456-1',
    type: 'کارت بانکی'
  },
  {
    id: 'bank-3',
    bankName: 'درگاه زرین‌پال / بانک سامان',
    accountHolder: 'درگاه پرداخت آنلاین شایگان',
    cardNumber: '6219861045678901',
    iban: 'IR190560080180009876543201',
    type: 'درگاه پرداخت'
  },
  {
    id: 'bank-4',
    bankName: 'صندوق نقدی دفتر',
    accountHolder: 'تنخواه و دریافتی نقدی',
    type: 'صندوق نقدی'
  }
];

export const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'u-1',
    fullName: 'مدیر ارشد سیستم',
    username: 'admin',
    password: '123456',
    role: 'مدیر کل',
    title: 'مدیر ارشد پروژه و امور مالی',
    email: 'admin@shaygan.ir',
    phone: '09123456789',
    isActive: true,
    createdAt: '1402/01/15',
    lastLogin: '1403/03/10'
  },
  {
    id: 'u-2',
    fullName: 'مهندس مریم راد',
    username: 'finance',
    password: '123456',
    role: 'حسابدار',
    title: 'مسئول امور مالی و وصول مطالبات',
    email: 'finance@shaygan.ir',
    phone: '09128887766',
    isActive: true,
    createdAt: '1402/06/20',
    lastLogin: '1403/03/08'
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c4',
    name: 'مهندس بابک فرهمند',
    company: 'استارتاپ لجستیک باربین',
    email: 'babak@barbin.co',
    phone: '09355556677',
    telegramOrWhatsapp: '@babak_farahmand',
    status: 'lead',
    tags: ['استارتاپ', 'موبایل اپ', 'در حال مذاکره'],
    address: 'شیراز، بلوار ارم، برج فناوری',
    rating: 4,
    createdAt: '1403/02/10',
    createdTimestamp: 1714400000000,
    notes: 'در مرحله ارزیابی پروپوزال برای اپلیکیشن رانندگان و پنل دیسپچ بار.',
    interactions: [
      { id: 'i7', type: 'meeting', date: '1403/02/12', description: 'ارائه دمو و پروپوزال فنی', outcome: 'منتظر تایید بودجه هیئت مدیره', createdTimestamp: 1714600000000 }
    ]
  },
  {
    id: 'c3',
    name: 'دکتر محمدرضا صادقی',
    company: 'سامانه سلامت پارس (MedParsi)',
    email: 'm.sadeghi@medparsi.com',
    phone: '09131112233',
    secondaryPhone: '02122334455',
    telegramOrWhatsapp: '@drsadeghi_med',
    status: 'vip',
    tags: ['حوزه سلامت', 'پلتفرم', 'پروژه بزرگ'],
    address: 'تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲',
    rating: 5,
    createdAt: '1402/12/01',
    createdTimestamp: 1708400000000,
    notes: 'پروژه پلتفرم جامع نوبت‌دهی آنلاین پزشکان و پرونده الکترونیک سلامت. قرارداد بلندمدت نگهداری و سرور.',
    interactions: [
      { id: 'i6', type: 'call', date: '1403/03/05', description: 'هماهنگی تست‌های امنیتی و اتصال به وب‌سرویس بیمه سلامت', outcome: 'مجوز استقرار سرور اختصاصی صادر شد', createdTimestamp: 1716600000000 }
    ]
  },
  {
    id: 'c2',
    name: 'سرکار خانم سارا کریمی',
    company: 'آژانس برندینگ و تبلیغات آریا',
    email: 'sara.karimi@ariaweb.agency',
    phone: '09129876543',
    secondaryPhone: '03136654321',
    telegramOrWhatsapp: '@sara_aria_agency',
    status: 'active',
    tags: ['طراحی وب', 'UI/UX', 'سئو'],
    address: 'اصفهان، خیابان چهارباغ بالا، مجتمع تجاری پارک',
    rating: 4,
    createdAt: '1402/10/15',
    createdTimestamp: 1704400000000,
    notes: 'حساسیت بالا روی طراحی بصری و انیمیشن‌های فرانت‌اند. پاسخ‌گویی سریع در ساعات اداری.',
    interactions: [
      { id: 'i5', type: 'contract', date: '1403/01/22', description: 'امضای قرارداد توسعه پورتال فروش دوره‌های آموزشی', outcome: 'واریز پیش‌پرداخت ۴۰ میلیون تومان', createdTimestamp: 1712800000000 },
      { id: 'i4', type: 'meeting', date: '1403/01/20', description: 'جلسه بازطراحی لندینگ پیج و بهینه‌سازی سرعت لود', outcome: 'طراحی جدید تایید شد', createdTimestamp: 1712600000000 }
    ]
  },
  {
    id: 'c1',
    name: 'مهندس علیرضا احمدی',
    company: 'شرکت فناوری تکنو سافت',
    email: 'ali.ahmadi@technosoft.ir',
    phone: '09123456789',
    secondaryPhone: '02188776655',
    telegramOrWhatsapp: '@ali_technosoft',
    status: 'vip',
    tags: ['VIP', 'مشتری قدیمی', 'بک‌اند', 'خوش‌حساب'],
    address: 'تهران، سعادت‌آباد، میدان کاج، برج تجاری ابریشم، طبقه ۶',
    rating: 5,
    createdAt: '1402/08/10',
    createdTimestamp: 1698800000000,
    notes: 'مشتری بسیار خوش‌حساب و با پرستیژ بالا. ترجیح می‌دهد گزارشات مالی ماهانه به صورت فایل اکسل یا رسید واتساپ شود.',
    interactions: [
      { id: 'i3', type: 'call', date: '1403/02/28', description: 'بررسی باگ‌های گزارش‌گیری هفتگی', outcome: 'رفع موارد ظرف ۴۸ ساعت', createdTimestamp: 1716000000000 },
      { id: 'i2', type: 'message', date: '1403/02/15', description: 'ارسال پیش‌فاکتور سرور جدید هتزنر', outcome: 'تایید و پرداخت فوری هزینه سرور', createdTimestamp: 1714800000000 },
      { id: 'i1', type: 'meeting', date: '1403/02/10', description: 'جلسه حضوری هماهنگی فاز دوم و توسعه ماژول حسابداری', outcome: 'توافق بر قرارداد الحاقی ۳۰ میلیونی', createdTimestamp: 1714400000000 }
    ]
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p3',
    clientId: 'c3',
    clientName: 'دکتر محمدرضا صادقی (MedParsi)',
    title: 'پلتفرم جامع نوبت‌دهی آنلاین و پرونده پزشکی MedParsi',
    category: 'وب‌اپلیکیشن',
    description: 'سامانه یکپارچه ارتباط پزشکان با بیماران، نوبت‌دهی هوشمند بر اساس تقویم پزشک، پرداخت آنلاین حق ویزیت، و بایگانی سوابق آزمایشگاهی با رمزنگاری پیشرفته داده‌های پزشکی.',
    stack: ['React', 'Node.js', 'NestJS', 'PostgreSQL', 'Socket.io', 'MinIO'],
    status: ProjectStatus.Active,
    progress: 45,
    contractValue: 240000000,
    paidAmount: 110000000,
    startDate: '1403/02/01',
    deadline: '1403/08/15',
    liveUrl: 'https://staging.medparsi.com',
    repoUrl: 'https://github.com/myteam/medparsi-platform',
    figmaUrl: 'https://figma.com/file/medparsi-app-v2',
    notes: 'پروژه پرچم‌دار با ارزش قرارداد بالا. سرور اختصاصی و دو دامنه com و ir فعال شده است.',
    createdTimestamp: 1713600000000,
    milestones: [
      { id: 'm9', title: 'طراحی ساختار دیتابیس و ماژول احراز هویت پیامکی', date: '1403/02/20', isCompleted: true },
      { id: 'm10', title: 'سیستم نوبت‌دهی هوشمند و جلوگیری از تداخل تایم‌ها', date: '1403/03/25', isCompleted: true },
      { id: 'm11', title: 'سیستم ویزیت متنی/تصویری و ذخیره‌سازی فایل‌های پرونده', date: '1403/05/15', isCompleted: false },
      { id: 'm12', title: 'تست‌های بار سنگین، امنیت و لانچ رسمی', date: '1403/08/15', isCompleted: false },
    ]
  },
  {
    id: 'p1',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (شرکت فناوری تکنو سافت)',
    title: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    category: 'وب‌اپلیکیشن',
    description: 'یک سامانه جامع تحت وب برای مدیریت جریان نقدینگی، صدور فاکتور رسمی با فرمت دارایی، اتصال به سامانه مودیان و گزارشات سود و زیان که با معماری میکرو سرویس و دیتابیس توزیع شده پیاده‌سازی شده است.',
    stack: ['React 19', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Tailwind CSS'],
    status: ProjectStatus.Active,
    progress: 75,
    contractValue: 180000000,
    paidAmount: 120000000,
    startDate: '1403/01/15',
    deadline: '1403/06/30',
    liveUrl: 'https://finance.technosoft.ir',
    repoUrl: 'https://github.com/myteam/technosoft-finance-app',
    figmaUrl: 'https://figma.com/file/technosoft-ui-design',
    notes: 'پروژه طبق برنامه زمانی در حال پیشرفت است. سرورهای عملیاتی در هتزنر با گواهی SSL و فایروال کانفیگ شده‌اند.',
    referrerName: 'مهندس کیوان نوری',
    commissionRate: 8,
    commissionAmount: 14400000,
    createdTimestamp: 1712200000000,
    milestones: [
      { id: 'm1', title: 'تحلیل نیازمندی‌ها و طراحی دیاگرام ER دیتابیس', date: '1403/01/25', isCompleted: true, description: 'تایید مدل داده و قوانین تجاری' },
      { id: 'm2', title: 'پیاده‌سازی ماژول‌های حسابداری پایه و اسناد دوبل', date: '1403/02/30', isCompleted: true, description: 'تست ماژول صدور سند و ثبت دفتر کل' },
      { id: 'm3', title: 'اتصال به وب‌سرویس سامانه مودیان و درگاه شاپرک', date: '1403/04/15', isCompleted: true, description: 'ارسال تست با کلید خصوصی شرکت' },
      { id: 'm4', title: 'گزارش‌گیری داینامیک، تست بار و تحویل نهایی', date: '1403/06/30', isCompleted: false, description: 'تست عملکرد با ۱۰۰ کاربر همزمان' },
    ]
  },
  {
    id: 'p2',
    clientId: 'c2',
    clientName: 'سرکار خانم سارا کریمی (آژانس برندینگ و تبلیغات آریا)',
    title: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    category: 'سایت شرکتی',
    description: 'طراحی وب‌سایت مدرن شرکتی چندزبانه (فارسی، انگلیسی، عربی) با سیستم رزرو آنلاین جلسات مشاوره، وبلاگ سئو شده و پنل مدیریت داینامیک محتوا.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Strapi CMS', 'PostgreSQL'],
    status: ProjectStatus.Delivered,
    progress: 100,
    contractValue: 95000000,
    paidAmount: 95000000,
    startDate: '1402/11/01',
    deadline: '1403/01/15',
    liveUrl: 'https://ariaweb.agency',
    repoUrl: 'https://gitlab.com/ariaweb/portal-frontend',
    figmaUrl: 'https://figma.com/file/ariaweb-design-system',
    notes: 'پروژه با رضایت ۱۰۰٪ مشتری تحویل داده شد و تسویه حساب کامل انجام گردید. وارد فاز پشتیبانی دوره‌ای شده است.',
    createdTimestamp: 1705800000000,
    milestones: [
      { id: 'm5', title: 'طراحی هویت بصری و تایید UI/UX وایرفریم‌ها', date: '1402/11/15', isCompleted: true },
      { id: 'm6', title: 'پیاده‌سازی فرانت‌اند Next.js و بهینه‌سازی سرعت Lighthouse', date: '1402/12/10', isCompleted: true },
      { id: 'm7', title: 'راه‌اندازی Strapi CMS و انتقال محتوا', date: '1402/12/28', isCompleted: true },
      { id: 'm8', title: 'استقرار نهایی روی سرور و تسویه حساب', date: '1403/01/15', isCompleted: true },
    ]
  },
  {
    id: 'p4',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (شرکت فناوری تکنو سافت)',
    title: 'ربات هوشمند مانیتورینگ سرورها و اطلاع‌رسانی تلگرام',
    category: 'بات و اتوماسیون',
    description: 'سرویس مانیتورینگ سلامت سرویس‌ها، بررسی پینگ، فضای دیسک و لاگ خطاها و ارسال آلرت‌های فوری به ربات تلگرام تیم فنی.',
    stack: ['Go', 'Docker', 'Prometheus', 'Telegram API'],
    status: ProjectStatus.Support,
    progress: 100,
    contractValue: 35000000,
    paidAmount: 35000000,
    startDate: '1402/09/01',
    deadline: '1402/10/01',
    repoUrl: 'https://github.com/myteam/server-telegram-alert-bot',
    notes: 'سرویس پایدار و سبک، هزینه نگهداری ماهانه جداگانه دریافت می‌شود.',
    createdTimestamp: 1700600000000,
    milestones: [
      { id: 'm13', title: 'پیاده‌سازی Agent سبک در Go', date: '1402/09/15', isCompleted: true },
      { id: 'm14', title: 'اتصال به بات تلگرام و تست شرایط قطعی', date: '1402/10/01', isCompleted: true },
    ]
  }
];

export const MOCK_PAYMENTS: ProjectPayment[] = [
  {
    id: 'pay-2',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (شرکت فناوری تکنو سافت)',
    title: 'قسط دوم پس از تایید ماژول‌های حسابداری پایه',
    amount: 60000000,
    date: '1403/03/02',
    time: '14:15',
    method: 'شبا / پایا',
    bankAccountId: 'bank-1',
    bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
    trackingCode: 'TRX-14030302-33421',
    status: 'completed',
    notes: 'تایید جلسه حضوری و واریز فوری',
    createdTimestamp: 1716300000000
  },
  {
    id: 'pay-5',
    projectId: 'p3',
    projectName: 'پلتفرم جامع نوبت‌دهی آنلاین و پرونده پزشکی MedParsi',
    clientId: 'c3',
    clientName: 'دکتر محمدرضا صادقی (سامانه سلامت پارس)',
    title: 'پیش‌پرداخت فاز اول پلتفرم سلامت',
    amount: 110000000,
    date: '1403/02/03',
    time: '12:00',
    method: 'شبا / پایا',
    bankAccountId: 'bank-1',
    bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
    trackingCode: 'MED-1403-PAY1',
    status: 'completed',
    notes: 'واریز مستقیم از حساب حقوقی شرکت سلامت پارس',
    createdTimestamp: 1713800000000
  },
  {
    id: 'pay-4',
    projectId: 'p2',
    projectName: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    clientId: 'c2',
    clientName: 'سرکار خانم سارا کریمی (آژانس برندینگ و تبلیغات آریا)',
    title: 'تسویه نهایی پس از لانچ و تحویل پروژه',
    amount: 50000000,
    date: '1403/01/18',
    time: '16:45',
    method: 'شبا / پایا',
    bankAccountId: 'bank-2',
    bankAccountLabel: 'بانک پاسارگاد - شرکت فناوری شایگان',
    trackingCode: 'TRX-14030118-77112',
    status: 'completed',
    notes: 'تسویه کامل صورتحساب پروژه آریا',
    createdTimestamp: 1712500000000
  },
  {
    id: 'pay-1',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (شرکت فناوری تکنو سافت)',
    title: 'پیش‌پرداخت اولیه قرارداد (فاز ۱)',
    amount: 60000000,
    date: '1403/01/16',
    time: '11:30',
    method: 'شبا / پایا',
    bankAccountId: 'bank-1',
    bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
    trackingCode: 'TRX-14030116-88912',
    status: 'completed',
    notes: 'واریز طبق بند ۴ قرارداد پس از امضا',
    createdTimestamp: 1712300000000
  },
  {
    id: 'pay-3',
    projectId: 'p2',
    projectName: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    clientId: 'c2',
    clientName: 'سرکار خانم سارا کریمی (آژانس برندینگ و تبلیغات آریا)',
    title: 'پیش‌پرداخت شروع پروژه پرتال',
    amount: 45000000,
    date: '1402/11/02',
    time: '10:00',
    method: 'کارت به کارت',
    bankAccountId: 'bank-2',
    bankAccountLabel: 'بانک پاسارگاد - شرکت فناوری شایگان',
    trackingCode: 'BANK-CARD-9921',
    status: 'completed',
    notes: 'واریز به شماره کارت پاسارگاد',
    createdTimestamp: 1705900000000
  },
  {
    id: 'pay-6',
    projectId: 'p4',
    projectName: 'ربات هوشمند مانیتورینگ سرورها و اطلاع‌رسانی تلگرام',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (شرکت فناوری تکنو سافت)',
    title: 'تسویه کامل پروژه ربات مانیتورینگ',
    amount: 35000000,
    date: '1402/10/05',
    time: '13:20',
    method: 'کارت به کارت',
    bankAccountId: 'bank-1',
    bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
    trackingCode: 'CARD-BOT-5512',
    status: 'completed',
    notes: 'واریز کامل پاداش تحویل زودتر از موعد',
    createdTimestamp: 1703500000000
  }
];

export const MOCK_EXPENSES: InfrastructureItem[] = [
  {
    id: 'exp-5',
    projectId: 'p3',
    projectName: 'پلتفرم جامع نوبت‌دهی آنلاین و پرونده پزشکی MedParsi',
    clientId: 'c3',
    clientName: 'دکتر محمدرضا صادقی (MedParsi)',
    type: 'sms',
    title: 'شارژ پنل پیامک خدماتی و احراز هویت OTP کاوه‌نگار',
    provider: 'Kavenegar SMS',
    purchaseCost: 4000000,
    purchaseDate: '1403/02/10',
    expirationDate: '1404/02/10',
    billingCycle: 'one-time',
    autoRenew: false,
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'خط خدماتی بدون بلک‌لیست برای کد تایید پیامکی بیماران',
    createdTimestamp: 1714500000000
  },
  {
    id: 'exp-9',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (تکنو سافت)',
    type: 'other',
    title: 'طراحی بسته آیکون‌های سفارشی و تصویرسازی وکتور',
    provider: 'استودیو دیزاین هنر / فریلنسر',
    categoryTitle: 'طراحی گرافیک و UI',
    purchaseCost: 3500000,
    purchaseDate: '1403/02/08',
    purchaseTime: '17:00',
    expirationDate: '',
    billingCycle: 'one-time',
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'هزینه دستی طراحی ۴۵ آیکون فلت با فرمت SVG و تست در فیگما',
    createdTimestamp: 1714300000000
  },
  {
    id: 'exp-4',
    projectId: 'p3',
    projectName: 'پلتفرم جامع نوبت‌دهی آنلاین و پرونده پزشکی MedParsi',
    clientId: 'c3',
    clientName: 'دکتر محمدرضا صادقی (MedParsi)',
    type: 'server',
    title: 'سرور اختصاصی دیتاسنتر پارس‌آنلاین (ایران)',
    provider: 'پارس آنلاین / ابر آروان',
    purchaseCost: 14500000,
    purchaseDate: '1403/02/05',
    purchaseTime: '11:00',
    expirationDate: '1403/08/05',
    billingCycle: 'monthly',
    ip: '185.143.234.12',
    specs: '8 Cores Intel Xeon, 32 GB RAM, 1 TB SSD Enterprise',
    autoRenew: true,
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'PostgreSQL Cluster + MinIO S3 Object Storage',
    createdTimestamp: 1714000000000
  },
  {
    id: 'exp-8',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (تکنو سافت)',
    type: 'commission',
    title: 'پورسانت معرفی و بازاریابی پروژه حسابداری ابری',
    provider: 'مهندس کیوان نوری (معرف)',
    recipientName: 'مهندس کیوان نوری',
    commissionRate: 8,
    purchaseCost: 14400000,
    purchaseDate: '1403/01/22',
    purchaseTime: '11:45',
    expirationDate: '',
    billingCycle: 'one-time',
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'واریز ۸٪ از مبلغ کل قرارداد پروژه (۱۸۰ میلیون تومان) به شماره شبا بانک ملت معرف',
    createdTimestamp: 1712800000000
  },
  {
    id: 'exp-3',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (تکنو سافت)',
    type: 'ssl',
    title: 'گواهی امنیتی SSL Wildcard تجاری',
    provider: 'Certum',
    purchaseCost: 3200000,
    purchaseDate: '1403/01/20',
    expirationDate: '1404/01/20',
    billingCycle: 'annual',
    autoRenew: false,
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: '*.technosoft.ir SSL Certificate',
    createdTimestamp: 1712600000000
  },
  {
    id: 'exp-1',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (تکنو سافت)',
    type: 'server',
    title: 'سرور کلود هتزنر CX31 (آلمان)',
    provider: 'Hetzner Cloud',
    purchaseCost: 6500000,
    purchaseDate: '1403/01/18',
    purchaseTime: '15:30',
    expirationDate: '1403/07/18',
    billingCycle: 'monthly',
    ip: '159.69.142.88',
    specs: '4 Cores AMD, 8 GB RAM, 160 GB NVMe',
    autoRenew: true,
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'SSH Port: 2222, Root Key Configured, Docker Swarm Installed',
    createdTimestamp: 1712400000000
  },
  {
    id: 'exp-7',
    projectId: 'p2',
    projectName: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    clientId: 'c2',
    clientName: 'سرکار خانم سارا کریمی (آریا وب)',
    type: 'server',
    title: 'سرور مجازی DigitalOcean Droplet',
    provider: 'DigitalOcean (Frankfurt)',
    purchaseCost: 2800000,
    purchaseDate: '1402/11/10',
    expirationDate: '1403/05/10',
    billingCycle: 'monthly',
    ip: '138.68.89.44',
    specs: '2 Cores, 4 GB RAM, 80 GB SSD',
    autoRenew: true,
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'Ubuntu 22.04 LTS, Nginx Reverse Proxy',
    createdTimestamp: 1706600000000
  },
  {
    id: 'exp-6',
    projectId: 'p2',
    projectName: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    clientId: 'c2',
    clientName: 'سرکار خانم سارا کریمی (آریا وب)',
    type: 'domain',
    title: 'دامنه بین‌المللی ariaweb.agency',
    provider: 'Namecheap',
    purchaseCost: 1800000,
    purchaseDate: '1402/11/05',
    expirationDate: '1403/11/05',
    billingCycle: 'annual',
    autoRenew: true,
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'Nameservers: ns1.digitalocean.com',
    createdTimestamp: 1706200000000
  },
  {
    id: 'exp-2',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (تکنو سافت)',
    type: 'domain',
    title: 'دامنه اختصاصی technosoft.ir',
    provider: 'ایرنیک (Nic.ir)',
    purchaseCost: 450000,
    purchaseDate: '1402/11/01',
    purchaseTime: '09:00',
    expirationDate: '1407/11/01',
    billingCycle: 'annual',
    autoRenew: true,
    status: 'active',
    paymentStatus: 'paid',
    credentialsNotes: 'DNS روی کلودفلر ست شده است',
    createdTimestamp: 1705800000000
  }
];

export const MOCK_SERVERS: Server[] = [
  {
    id: 's2',
    name: 'سرور دیتابیس اختصاصی پارس آنلاین',
    provider: 'پارس آنلاین / دیتاسنتر داخلی',
    ip: '185.143.234.12',
    os: 'Debian 12 Bookworm',
    purchaseCost: 14500000,
    purchaseDate: '1403/02/05',
    expiration: '1403/08/05',
    billingCycle: 'monthly',
    projectId: 'p3',
    projectName: 'پلتفرم جامع نوبت‌دهی آنلاین و پرونده پزشکی MedParsi',
    clientId: 'c3',
    clientName: 'دکتر محمدرضا صادقی (MedParsi)',
    cpu: '8 Cores Intel Xeon',
    ram: '32 GB ECC',
    storage: '1 TB Enterprise NVMe (RAID 1)',
    status: 'online',
    sshPort: '22',
    sshUser: 'admin_sys',
    notes: 'سرور داخلی برای ذخیره اطلاعات محرمانه پزشکی با پشتیبان‌گیری روزانه خودکار',
    createdTimestamp: 1714000000000
  },
  {
    id: 's1',
    name: 'سرور اصلی Hetzner (CX31)',
    provider: 'Hetzner Cloud',
    ip: '159.69.142.88',
    os: 'Ubuntu 22.04 LTS',
    purchaseCost: 6500000,
    purchaseDate: '1403/01/18',
    expiration: '1403/07/18',
    billingCycle: 'monthly',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (تکنو سافت)',
    cpu: '4 vCPU (AMD EPYC)',
    ram: '8 GB DDR4 ECC',
    storage: '160 GB NVMe SSD',
    status: 'online',
    sshPort: '2222',
    sshUser: 'deploy',
    notes: 'میزبان فرانت‌اند و بک‌اند سامانه مالی تکنو سافت. فایروال UFW و Fail2ban فعال است.',
    createdTimestamp: 1712400000000
  },
  {
    id: 's3',
    name: 'دراپلت دیجیتال اوشن فرانکفورت',
    provider: 'DigitalOcean',
    ip: '138.68.89.44',
    os: 'Ubuntu 22.04 LTS',
    purchaseCost: 2800000,
    purchaseDate: '1402/11/10',
    expiration: '1403/05/10',
    billingCycle: 'monthly',
    projectId: 'p2',
    projectName: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    clientId: 'c2',
    clientName: 'سرکار خانم سارا کریمی (آریا وب)',
    cpu: '2 vCPU',
    ram: '4 GB RAM',
    storage: '80 GB SSD',
    status: 'warning',
    sshPort: '22',
    sshUser: 'root',
    notes: 'موعد تمدید نزدیک است (کمتر از چند روز باقی مانده)',
    createdTimestamp: 1706600000000
  }
];

export const MOCK_DOMAINS: Domain[] = [
  {
    id: 'd3',
    url: 'medparsi.com',
    registrar: 'Resello / Namecheap',
    purchaseCost: 1650000,
    purchaseDate: '1403/02/01',
    expiration: '1404/02/01',
    autoRenew: true,
    projectId: 'p3',
    projectName: 'پلتفرم جامع نوبت‌دهی آنلاین و پرونده پزشکی MedParsi',
    clientId: 'c3',
    clientName: 'دکتر محمدرضا صادقی (MedParsi)',
    sslStatus: 'active',
    createdTimestamp: 1713600000000,
    dnsRecords: [
      { type: 'A', host: '@', value: '185.143.234.12', ttl: '3600' },
      { type: 'A', host: 'staging', value: '185.143.234.12', ttl: '3600' }
    ]
  },
  {
    id: 'd2',
    url: 'ariaweb.agency',
    registrar: 'Namecheap',
    purchaseCost: 1800000,
    purchaseDate: '1402/11/05',
    expiration: '1403/11/05',
    autoRenew: true,
    projectId: 'p2',
    projectName: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    clientId: 'c2',
    clientName: 'سرکار خانم سارا کریمی (آریا وب)',
    sslStatus: 'active',
    createdTimestamp: 1706200000000,
    dnsRecords: [
      { type: 'A', host: '@', value: '138.68.89.44', ttl: '3600' },
      { type: 'CNAME', host: 'www', value: 'ariaweb.agency', ttl: '3600' }
    ]
  },
  {
    id: 'd1',
    url: 'technosoft.ir',
    registrar: 'ایرنیک (Nic.ir)',
    purchaseCost: 450000,
    purchaseDate: '1402/11/01',
    expiration: '1407/11/01',
    autoRenew: true,
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    clientId: 'c1',
    clientName: 'مهندس علیرضا احمدی (تکنو سافت)',
    sslStatus: 'active',
    createdTimestamp: 1705800000000,
    dnsRecords: [
      { type: 'A', host: '@', value: '159.69.142.88', ttl: '3600' },
      { type: 'CNAME', host: 'finance', value: 'technosoft.ir', ttl: '3600' },
      { type: 'MX', host: '@', value: 'mail.technosoft.ir', ttl: '14400' }
    ]
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't2',
    projectId: 'p3',
    projectName: 'پلتفرم جامع نوبت‌دهی آنلاین و پرونده پزشکی MedParsi',
    title: 'پیاده‌سازی درگاه پرداخت سداد و سامان برای رزرو ویزیت',
    status: 'todo',
    priority: 'high',
    dueDate: '1403/04/20',
    description: 'پشتیبانی از تسهیم آنی درآمد پزشک و کارمزد سامانه',
    createdTimestamp: 1716500000000
  },
  {
    id: 't1',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    title: 'اتصال وب‌سرویس صدور فاکتور الکترونیک به سامانه مودیان',
    status: 'doing',
    priority: 'high',
    dueDate: '1403/04/10',
    description: 'رمزنگاری بسته‌های مالیاتی با الگوریتم RSA و توکن امضای دیجیتال',
    createdTimestamp: 1716200000000
  },
  {
    id: 't4',
    projectId: 'p2',
    projectName: 'پرتال جامع چندزبانه و فروشگاه خدمات آریا',
    title: 'پشتیبان‌گیری هفتگی از دیتابیس Strapi',
    status: 'done',
    priority: 'low',
    dueDate: '1403/03/30',
    createdTimestamp: 1715500000000
  },
  {
    id: 't3',
    projectId: 'p1',
    projectName: 'سامانه یکپارچه مدیریت مالی و حسابداری ابری',
    title: 'تست مانیتورینگ لاگ‌های دیتابیس PostgreSQL',
    status: 'done',
    priority: 'medium',
    dueDate: '1403/03/15',
    createdTimestamp: 1715000000000
  }
];

export const PERSIAN_MONTHS = [
  { code: '01', name: 'فروردین' },
  { code: '02', name: 'اردیبهشت' },
  { code: '03', name: 'خرداد' },
  { code: '04', name: 'تیر' },
  { code: '05', name: 'مرداد' },
  { code: '06', name: 'شهریور' },
  { code: '07', name: 'مهر' },
  { code: '08', name: 'آبان' },
  { code: '09', name: 'آذر' },
  { code: '10', name: 'دی' },
  { code: '11', name: 'بهمن' },
  { code: '12', name: 'اسفند' },
];

export const MONTHLY_FINANCE_DATA = [
  { month: 'آذر', income: 35, expense: 4.2, profit: 30.8 },
  { month: 'دی', income: 48, expense: 6.5, profit: 41.5 },
  { month: 'بهمن', income: 62, expense: 8.8, profit: 53.2 },
  { month: 'اسفند', income: 74, expense: 11.4, profit: 62.6 },
  { month: 'فروردین', income: 110, expense: 24.1, profit: 85.9 },
  { month: 'اردیبهشت', income: 125, expense: 22.0, profit: 103.0 },
  { month: 'خرداد', income: 95, expense: 14.5, profit: 80.5 }
];

export const DEFAULT_PRODUCT_DOMAINS: string[] = [
  'نرم‌افزار ابری (SaaS)',
  'سامانه سازمانی و CRM',
  'ابزار مالی و حسابداری',
  'قالب و افزونه آماده',
  'اپلیکیشن موبایل',
  'بات و اتوماسیون هوشمند',
  'دوره و محصول دیجیتال'
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-3',
    name: 'سامانه هوشمند نوبت‌دهی و مطب کلینیک‌یار',
    domain: 'نرم‌افزار ابری (SaaS)',
    description:
      'پلتفرم اشتراکی و نصبی مدیریت مطب، ارسال پیامک یادآوری خودکار، پرونده الکترونیک بیمار و گزارش مالی پزشک.',
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Tailwind CSS'],
    status: 'پرفروش',
    salesModel: 'hybrid',
    oneTimePrice: 39000000,
    monthlyPrice: 2800000,
    annualPrice: 28000000,
    tiers: [
      {
        id: 'tier-clinic-basic',
        name: 'نسخه پایه',
        price: 35000000,
        supportMonths: 12,
        supportRenewalPrice: 7000000,
        description: 'مناسب مطب تک‌پزشک با نوبت‌دهی و پرونده الکترونیک'
      },
      {
        id: 'tier-clinic-pro',
        name: 'نسخه حرفه‌ای',
        price: 39000000,
        supportMonths: 12,
        supportRenewalPrice: 8500000,
        description: 'تا ۵ پزشک + پیامک یادآوری خودکار و گزارش مالی'
      },
      {
        id: 'tier-clinic-enterprise',
        name: 'نسخه جامع',
        price: 45000000,
        supportMonths: 12,
        supportRenewalPrice: 10000000,
        description: 'چندشعبه نامحدود + اتصال بیمه، انبار دارو و پنل مدیریت پیشرفته'
      }
    ],
    variableCostPerUnit: 1500000,
    targetMarginPercent: 100,
    targetSalesCount: 10,
    supportPolicy: 'free',
    defaultSupportMonths: 12,
    supportRenewalPrice: 8500000,
    demoUrl: 'https://clinicyar.ir',
    version: '2.4',
    createdAt: '1403/02/10',
    createdTimestamp: 1716800000000
  },
  {
    id: 'prod-2',
    name: 'افزونه جامع فاکتور رسمی و اتصال سامانه مودیان',
    domain: 'ابزار مالی و حسابداری',
    description:
      'ماژول آماده و قابل نصب روی فروشگاه‌ها و سیستم‌های حسابداری با پشتیبانی کامل از امضای دیجیتال و ارسال مستقیم صورتحساب الکترونیکی.',
    stack: ['Node.js', 'TypeScript', 'Docker', 'PostgreSQL'],
    status: 'آماده فروش',
    salesModel: 'one-time',
    oneTimePrice: 18500000,
    monthlyPrice: 0,
    annualPrice: 0,
    variableCostPerUnit: 500000,
    targetMarginPercent: 75,
    supportPolicy: 'free',
    defaultSupportMonths: 6,
    supportRenewalPrice: 4500000,
    demoUrl: 'https://moadian-kit.ir',
    version: '1.8',
    createdAt: '1403/01/18',
    createdTimestamp: 1715800000000
  },
  {
    id: 'prod-1',
    name: 'دستیار اتوماسیون فروش و پیام‌رسان هوشمند شایگان‌بات',
    domain: 'بات و اتوماسیون هوشمند',
    description:
      'سیستم پاسخ‌گویی خودکار مشتریان در تلگرام و وب‌سایت، ثبت خودکار سرنخ‌ها و پیگیری فاکتورهای معوق.',
    stack: ['Python', 'FastAPI', 'Telegram API', 'Redis', 'React'],
    status: 'در حال تولید',
    salesModel: 'subscription',
    oneTimePrice: 0,
    monthlyPrice: 1900000,
    annualPrice: 19000000,
    variableCostPerUnit: 350000,
    targetMarginPercent: 60,
    supportPolicy: 'paid',
    defaultSupportMonths: 6,
    supportRenewalPrice: 3600000,
    version: '0.9',
    createdAt: '1402/12/20',
    createdTimestamp: 1714800000000
  }
];

export const MOCK_PRODUCT_COSTS: ProductCostItem[] = [
  {
    id: 'pc-6',
    productId: 'prod-3',
    productName: 'سامانه هوشمند نوبت‌دهی و مطب کلینیک‌یار',
    costType: 'بازاریابی و فروش',
    categoryTitle: 'تولید محتوا و ترجمه',
    title: 'کمپین معرفی و ویدیو دمو کلینیک‌یار',
    amount: 14000000,
    date: '1403/02/20',
    paymentStatus: 'paid',
    notes: 'تولید موشن‌گرافیک و تبلیغات هدفمند در انجمن‌های پزشکی',
    createdTimestamp: 1716900000000
  },
  {
    id: 'pc-5',
    productId: 'prod-3',
    productName: 'سامانه هوشمند نوبت‌دهی و مطب کلینیک‌یار',
    costType: 'توسعه اولیه',
    categoryTitle: 'طراحی گرافیک و UI',
    title: 'طراحی رابط کاربری و توسعه نسخه ۱ و ۲ سامانه',
    amount: 78000000,
    date: '1403/01/25',
    paymentStatus: 'paid',
    notes: 'شامل طراحی فیگما، پنل پزشک، پنل منشی و سیستم پیامک',
    createdTimestamp: 1716700000000
  },
  {
    id: 'pc-4',
    productId: 'prod-3',
    productName: 'سامانه هوشمند نوبت‌دهی و مطب کلینیک‌یار',
    costType: 'نگهداری و زیرساخت',
    categoryTitle: 'مشاوره فنی و معماری',
    title: 'سرور ابری دمو و خط خدماتی پیامک سالانه',
    amount: 8500000,
    date: '1403/02/05',
    paymentStatus: 'paid',
    createdTimestamp: 1716600000000
  },
  {
    id: 'pc-3',
    productId: 'prod-2',
    productName: 'افزونه جامع فاکتور رسمی و اتصال سامانه مودیان',
    costType: 'توسعه اولیه',
    categoryTitle: 'تست و ارزیابی امنیتی',
    title: 'توسعه هسته رمزنگاری CSR/RSA و تست کامل مودیان',
    amount: 42000000,
    date: '1403/01/15',
    paymentStatus: 'paid',
    createdTimestamp: 1715900000000
  },
  {
    id: 'pc-2',
    productId: 'prod-2',
    productName: 'افزونه جامع فاکتور رسمی و اتصال سامانه مودیان',
    costType: 'بازاریابی و فروش',
    categoryTitle: 'تولید محتوا و ترجمه',
    title: 'مستندسازی API و لندینگ‌پیج فروش افزونه',
    amount: 6500000,
    date: '1403/01/28',
    paymentStatus: 'paid',
    createdTimestamp: 1715700000000
  },
  {
    id: 'pc-1',
    productId: 'prod-1',
    productName: 'دستیار اتوماسیون فروش و پیام‌رسان هوشمند شایگان‌بات',
    costType: 'توسعه اولیه',
    categoryTitle: 'مشاوره فنی و معماری',
    title: 'پیاده‌سازی هسته پردازش پیام و وب‌هوک تلگرام',
    amount: 34000000,
    date: '1402/12/25',
    paymentStatus: 'paid',
    createdTimestamp: 1714900000000
  }
];

export const MOCK_PRODUCT_SALES: ProductSale[] = [
  {
    id: 'ps-5',
    productId: 'prod-3',
    productName: 'سامانه هوشمند نوبت‌دهی و مطب کلینیک‌یار',
    clientId: 'c3',
    buyerName: 'دکتر محمدرضا حسینی',
    buyerCompany: 'کلینیک تخصصی مدپارسی',
    saleType: 'یک‌باره',
    tierId: 'tier-clinic-enterprise',
    tierName: 'نسخه جامع',
    quantity: 1,
    unitPrice: 45000000,
    discount: 2000000,
    totalAmount: 43000000,
    paidAmount: 43000000,
    remainingAmount: 0,
    date: '1403/03/05',
    method: 'شبا / پایا',
    bankAccountId: 'bank-1',
    bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
    trackingCode: 'PRD-88412',
    hasSupport: true,
    supportMonths: 12,
    supportStartDate: '1403/03/05',
    supportEndDate: '1406/03/05',
    supportRenewalPrice: 10000000,
    notes: 'نصب اختصاصی روی سرور کلینیک + آموزش منشی‌ها',
    events: [
      {
        id: 'evt-ps5-1',
        type: 'purchase',
        date: '1403/03/05',
        title: 'خرید اولیه (یک‌باره — نسخه جامع)',
        amountDelta: 43000000,
        paidAmount: 43000000,
        method: 'شبا / پایا',
        bankAccountId: 'bank-1',
        bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
        trackingCode: 'PRD-88412',
        toTierName: 'نسخه جامع',
        supportMonthsAdded: 12,
        notes: 'نصب اختصاصی روی سرور کلینیک + آموزش منشی‌ها',
        createdTimestamp: 1717300000000
      }
    ],
    createdTimestamp: 1717300000000
  },
  {
    id: 'ps-4',
    productId: 'prod-3',
    productName: 'سامانه هوشمند نوبت‌دهی و مطب کلینیک‌یار',
    buyerName: 'دکتر نیما شریفی',
    buyerCompany: 'درمانگاه دندانپزشکی لبخند',
    saleType: 'اشتراک سالانه',
    quantity: 2,
    unitPrice: 28000000,
    discount: 0,
    totalAmount: 56000000,
    paidAmount: 46000000,
    remainingAmount: 10000000,
    date: '1403/02/28',
    subscriptionEndDate: '1406/02/28',
    method: 'کارت به کارت',
    bankAccountId: 'bank-2',
    bankAccountLabel: 'بانک پاسارگاد - شرکت فناوری شایگان',
    trackingCode: 'PRD-88109',
    hasSupport: true,
    supportMonths: 12,
    supportStartDate: '1403/02/28',
    supportEndDate: '1406/02/28',
    supportRenewalPrice: 8500000,
    notes: '۲ شعبه فعال — قسط آخر طی ۱۵ روز آینده تسویه می‌شود',
    events: [
      {
        id: 'evt-ps4-2',
        type: 'payment',
        date: '1403/03/08',
        title: 'دریافت قسط دوم',
        amountDelta: 0,
        paidAmount: 16000000,
        method: 'کارت به کارت',
        bankAccountId: 'bank-2',
        bankAccountLabel: 'بانک پاسارگاد - شرکت فناوری شایگان',
        trackingCode: 'PRD-88590',
        notes: 'واریز قسط دوم پس از راه‌اندازی شعبه دوم',
        createdTimestamp: 1717350000000
      },
      {
        id: 'evt-ps4-1',
        type: 'purchase',
        date: '1403/02/28',
        title: 'خرید اولیه (اشتراک سالانه × ۲ واحد)',
        amountDelta: 56000000,
        paidAmount: 30000000,
        method: 'کارت به کارت',
        bankAccountId: 'bank-2',
        bankAccountLabel: 'بانک پاسارگاد - شرکت فناوری شایگان',
        trackingCode: 'PRD-88109',
        supportMonthsAdded: 12,
        notes: 'پیش‌پرداخت خرید اشتراک ۲ شعبه',
        createdTimestamp: 1717100000000
      }
    ],
    createdTimestamp: 1717100000000
  },
  {
    id: 'ps-3',
    productId: 'prod-3',
    productName: 'سامانه هوشمند نوبت‌دهی و مطب کلینیک‌یار',
    buyerName: 'دکتر مریم کاظمی',
    buyerCompany: 'مطب پوست و زیبایی کاظمی',
    saleType: 'یک‌باره',
    tierId: 'tier-clinic-basic',
    tierName: 'نسخه پایه',
    quantity: 1,
    unitPrice: 35000000,
    discount: 0,
    totalAmount: 35000000,
    paidAmount: 35000000,
    remainingAmount: 0,
    date: '1403/02/15',
    method: 'درگاه آنلاین',
    bankAccountId: 'bank-1',
    bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
    trackingCode: 'PRD-87504',
    hasSupport: true,
    supportMonths: 12,
    supportStartDate: '1403/02/15',
    supportEndDate: '1404/02/15',
    supportRenewalPrice: 7000000,
    notes: 'پشتیبانی سال اول منقضی‌شده — تمدید سال دوم اختیاری یا امکان ارتقا به نسخه حرفه‌ای/جامع',
    events: [
      {
        id: 'evt-ps3-1',
        type: 'purchase',
        date: '1403/02/15',
        title: 'خرید اولیه (یک‌باره — نسخه پایه)',
        amountDelta: 35000000,
        paidAmount: 35000000,
        method: 'درگاه آنلاین',
        bankAccountId: 'bank-1',
        bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
        trackingCode: 'PRD-87504',
        toTierName: 'نسخه پایه',
        supportMonthsAdded: 12,
        notes: 'تسویه کامل هنگام خرید',
        createdTimestamp: 1716950000000
      }
    ],
    createdTimestamp: 1716950000000
  },
  {
    id: 'ps-2',
    productId: 'prod-2',
    productName: 'افزونه جامع فاکتور رسمی و اتصال سامانه مودیان',
    clientId: 'c1',
    buyerName: 'مهندس علیرضا احمدی',
    buyerCompany: 'تکنو سافت',
    saleType: 'یک‌باره',
    quantity: 2,
    unitPrice: 18500000,
    discount: 1000000,
    totalAmount: 36000000,
    paidAmount: 36000000,
    remainingAmount: 0,
    date: '1403/02/22',
    method: 'شبا / پایا',
    bankAccountId: 'bank-1',
    bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
    trackingCode: 'PRD-87990',
    hasSupport: true,
    supportMonths: 6,
    supportStartDate: '1403/02/22',
    supportEndDate: '1405/11/22',
    supportRenewalPrice: 4500000,
    events: [
      {
        id: 'evt-ps2-1',
        type: 'purchase',
        date: '1403/02/22',
        title: 'خرید اولیه (یک‌باره × ۲ واحد)',
        amountDelta: 36000000,
        paidAmount: 36000000,
        method: 'شبا / پایا',
        bankAccountId: 'bank-1',
        bankAccountLabel: 'بانک ملت - فرهاد شایگان (حساب اصلی)',
        trackingCode: 'PRD-87990',
        supportMonthsAdded: 6,
        createdTimestamp: 1716880000000
      }
    ],
    createdTimestamp: 1716880000000
  },
  {
    id: 'ps-1',
    productId: 'prod-2',
    productName: 'افزونه جامع فاکتور رسمی و اتصال سامانه مودیان',
    clientId: 'c2',
    buyerName: 'سرکار خانم سارا کریمی',
    buyerCompany: 'آریا وب',
    saleType: 'یک‌باره',
    quantity: 1,
    unitPrice: 18500000,
    discount: 0,
    totalAmount: 18500000,
    paidAmount: 18500000,
    remainingAmount: 0,
    date: '1403/02/04',
    method: 'شبا / پایا',
    bankAccountId: 'bank-2',
    bankAccountLabel: 'بانک پاسارگاد - شرکت فناوری شایگان',
    trackingCode: 'PRD-86401',
    hasSupport: true,
    supportMonths: 6,
    supportStartDate: '1403/02/04',
    supportEndDate: '1405/09/04',
    supportRenewalPrice: 4500000,
    events: [
      {
        id: 'evt-ps1-1',
        type: 'purchase',
        date: '1403/02/04',
        title: 'خرید اولیه (یک‌باره)',
        amountDelta: 18500000,
        paidAmount: 18500000,
        method: 'شبا / پایا',
        bankAccountId: 'bank-2',
        bankAccountLabel: 'بانک پاسارگاد - شرکت فناوری شایگان',
        trackingCode: 'PRD-86401',
        supportMonthsAdded: 6,
        createdTimestamp: 1716500000000
      }
    ],
    createdTimestamp: 1716500000000
  }
];

export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join(
      '\n'
    );
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

