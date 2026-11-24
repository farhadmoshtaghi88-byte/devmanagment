import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  BookmarkPlus,
  Edit3,
  FileText
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Invoice, InvoiceDocumentType, InvoiceTheme } from '../types';
import { formatPrice, toPersianDigits, formatCardNumber } from '../constants';
import InvoiceDocument from './InvoiceDocument';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const THEME_OPTIONS: Array<{ id: InvoiceTheme; label: string }> = [
  { id: 'shayegan', label: 'مدرن شایگان' },
  { id: 'classic', label: 'رسمی کلاسیک' },
  { id: 'minimal', label: 'مینیمال' }
];

const DOC_TYPES: InvoiceDocumentType[] = ['فاکتور فروش', 'پیش‌فاکتور', 'صورت‌حساب رسمی'];

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice }) => {
  const {
    invoiceSellerProfile,
    bankAccounts,
    invoices,
    addInvoice,
    setInvoiceDraftForBuilder,
    setActiveTab
  } = useData();

  const [theme, setTheme] = useState<InvoiceTheme>('shayegan');
  const [docType, setDocType] = useState<InvoiceDocumentType>('فاکتور فروش');
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (invoice) {
      setTheme(invoice.theme || 'shayegan');
      setDocType(invoice.documentType || 'فاکتور فروش');
      setCopied(false);
      setSavedNotice(false);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const activeInvoice: Invoice = {
    ...invoice,
    theme,
    documentType: docType
  };

  const selectedBank =
    bankAccounts.find((b) => b.id === activeInvoice.bankAccountId) ||
    bankAccounts.find((b) => b.id === invoiceSellerProfile.defaultBankAccountId) ||
    bankAccounts.find((b) => b.isDefault) ||
    bankAccounts[0];

  const isAlreadySaved = invoices.some((inv) => inv.id === invoice.id);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = async () => {
    const lines = [
      `${activeInvoice.documentType} — ${invoiceSellerProfile.companyName}`,
      `شماره سند: ${toPersianDigits(activeInvoice.invoiceNumber)}`,
      `تاریخ: ${toPersianDigits(activeInvoice.issueDate)}`,
      `خریدار: ${activeInvoice.buyerName}${activeInvoice.buyerCompany ? ` (${activeInvoice.buyerCompany})` : ''}`,
      '---',
      ...activeInvoice.items.map(
        (it, i) =>
          `${toPersianDigits(i + 1)}. ${it.title}: ${formatPrice(
            Math.max(0, it.quantity * it.unitPrice - (it.discount || 0))
          )} تومان`
      ),
      '---',
      ...(activeInvoice.discountAmount > 0
        ? [`تخفیف: ${formatPrice(activeInvoice.discountAmount)}- تومان`]
        : []),
      ...(activeInvoice.taxAmount > 0
        ? [`مالیات (${toPersianDigits(activeInvoice.taxRate)}٪): ${formatPrice(activeInvoice.taxAmount)}+ تومان`]
        : []),
      `مبلغ قابل پرداخت: ${formatPrice(activeInvoice.totalAmount)} تومان`,
      `پرداخت‌شده: ${formatPrice(activeInvoice.paidAmount)} تومان`,
      `مانده قابل پرداخت: ${formatPrice(activeInvoice.remainingAmount)} تومان`,
      ...(selectedBank
        ? [
            '---',
            `حساب واریز: ${selectedBank.bankName} (${selectedBank.accountHolder})`,
            ...(selectedBank.cardNumber ? [`کارت: ${formatCardNumber(selectedBank.cardNumber)}`] : []),
            ...(selectedBank.iban ? [`شبا: ${selectedBank.iban}`] : [])
          ]
        : [])
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked in restricted frame; fail silently
    }
  };

  const handleSaveToArchive = () => {
    const { id: _discard, ...rest } = activeInvoice;
    addInvoice({
      ...rest,
      createdTimestamp: Date.now()
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleOpenInBuilder = () => {
    setInvoiceDraftForBuilder(activeInvoice);
    onClose();
    setActiveTab('invoices');
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
      <div className="bg-slate-100 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Top Action Toolbar (Hidden during Print) */}
        <div className="no-print px-5 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-slate-900 text-[#2CE2D2] shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">
                پیش‌نمایش {activeInvoice.documentType} ({toPersianDigits(activeInvoice.invoiceNumber)})
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {activeInvoice.buyerName} · {formatPrice(activeInvoice.totalAmount)} تومان
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    theme === t.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Doc Type Selector */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDocType(dt)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    docType === dt
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'کپی شد' : 'کپی متن واتساپ'}
            </button>

            {!isAlreadySaved && (
              <button
                type="button"
                onClick={handleSaveToArchive}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {savedNotice ? <Check size={14} /> : <BookmarkPlus size={14} />}
                {savedNotice ? 'ذخیره شد' : 'ذخیره در بایگانی'}
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenInBuilder}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Edit3 size={14} />
              ویرایش در فاکتورساز
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer size={14} />
              چاپ / ذخیره PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              title="بستن"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable A4 Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <InvoiceDocument
            invoice={activeInvoice}
            seller={invoiceSellerProfile}
            bankAccount={selectedBank}
            printable
          />
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
