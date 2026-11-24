import React, { useState } from 'react';
import { BankAccount, Invoice, InvoiceSellerProfile } from '../types';
import {
  formatPrice,
  toPersianDigits,
  formatCardNumber,
  numberToPersianWords,
  SHAYEGAN_DEFAULT_LOGO_URL
} from '../constants';

interface InvoiceDocumentProps {
  invoice: Invoice;
  seller: InvoiceSellerProfile;
  bankAccount?: BankAccount;
  printable?: boolean;
}

const STATUS_BADGE_MAP: Record<Invoice['status'], { text: string; className: string }> = {
  پرداخت‌شده: {
    text: 'تسویه کامل',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'پرداخت جزئی': {
    text: 'پرداخت جزئی',
    className: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  'در انتظار پرداخت': {
    text: 'در انتظار پرداخت',
    className: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  پیش‌فاکتور: {
    text: 'پیش‌فاکتور',
    className: 'bg-slate-100 text-slate-700 border-slate-300'
  }
};

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  seller,
  bankAccount,
  printable = false
}) => {
  const [logoError, setLogoError] = useState(false);

  const theme = invoice.theme || 'shayegan';
  const statusInfo = STATUS_BADGE_MAP[invoice.status] || STATUS_BADGE_MAP['در انتظار پرداخت'];

  const itemsGross = invoice.items.reduce(
    (sum, item) => sum + Math.max(0, (item.quantity || 0) * (item.unitPrice || 0)),
    0
  );
  const itemsLineDiscount = invoice.items.reduce(
    (sum, item) => sum + Math.max(0, item.discount || 0),
    0
  );
  const hasAnyLineDiscount = itemsLineDiscount > 0;
  const subtotalAfterLines = Math.max(0, itemsGross - itemsLineDiscount);

  const invoiceDiscount = Math.max(0, invoice.discountAmount || 0);
  const taxableBase = Math.max(0, subtotalAfterLines - invoiceDiscount);
  const taxAmount = Math.max(0, invoice.taxAmount || 0);
  const finalTotal = Math.max(0, invoice.totalAmount ?? taxableBase + taxAmount);
  const paidAmount = Math.max(0, invoice.paidAmount || 0);
  const remainingAmount = Math.max(0, invoice.remainingAmount ?? finalTotal - paidAmount);

  const logoSrc = seller.logoUrl || SHAYEGAN_DEFAULT_LOGO_URL;

  const isShayegan = theme === 'shayegan';
  const isClassic = theme === 'classic';
  const isMinimal = theme === 'minimal';

  return (
    <div
      dir="rtl"
      className={`${
        printable ? 'invoice-print-target' : ''
      } bg-white text-slate-900 font-['Vazirmatn'] w-full max-w-[820px] mx-auto overflow-hidden ${
        isClassic
          ? 'border-2 border-slate-900 rounded-none shadow-sm'
          : isMinimal
          ? 'border border-slate-200 rounded-2xl shadow-sm'
          : 'border border-slate-200 rounded-2xl shadow-lg'
      }`}
    >
      {/* Top Signature Brand Bar */}
      {isShayegan && (
        <div className="h-2 w-full flex">
          <div className="w-1/3 bg-[#00B8A9]" />
          <div className="w-2/3 bg-slate-900" />
        </div>
      )}

      {isClassic && (
        <div className="bg-slate-900 text-white px-7 py-3 flex items-center justify-between">
          <span className="text-xs font-black tracking-wide">{invoice.documentType}</span>
          <span className="text-xs font-bold tabular-nums">
            شماره سند: {toPersianDigits(invoice.invoiceNumber)}
          </span>
        </div>
      )}

      <div className="p-6 sm:p-9 space-y-6">
        {/* Header: Brand Logo + Document Meta */}
        <div
          className={`flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 ${
            isClassic
              ? 'border-b-2 border-slate-900'
              : isShayegan
              ? 'border-b border-slate-200'
              : 'border-b border-slate-100'
          }`}
        >
          {/* Seller Brand Identity */}
          <div className="space-y-2.5 max-w-md">
            <div className="flex items-center gap-3">
              {!logoError && logoSrc ? (
                <img
                  src={logoSrc}
                  alt={seller.companyName}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-12 sm:h-14 w-auto object-contain select-none"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#00C4B4] flex items-center justify-center font-black text-lg">
                    ش
                  </div>
                  <div className="text-lg font-black text-slate-900">{seller.companyName}</div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900">{seller.companyName}</h1>
              {seller.tagline && (
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">
                  {seller.tagline}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-500">
              {seller.phone && <span className="tabular-nums">تلفن: {toPersianDigits(seller.phone)}</span>}
              {seller.website && (
                <>
                  <span className="text-slate-300">·</span>
                  <span dir="ltr" className="font-semibold text-slate-600">
                    {seller.website}
                  </span>
                </>
              )}
              {seller.email && (
                <>
                  <span className="text-slate-300">·</span>
                  <span dir="ltr">{seller.email}</span>
                </>
              )}
            </div>
          </div>

          {/* Document Title & Metadata Box */}
          <div className="sm:text-left space-y-2.5 shrink-0">
            <div className="flex sm:flex-col sm:items-end items-center justify-between gap-2">
              <div
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  isShayegan ? 'text-slate-900' : 'text-slate-900'
                }`}
              >
                {invoice.documentType}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold border ${statusInfo.className}`}
              >
                {statusInfo.text}
              </span>
            </div>

            <div
              className={`grid grid-cols-2 gap-x-5 gap-y-1.5 text-[11px] pt-1 ${
                isShayegan
                  ? 'bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/80'
                  : isClassic
                  ? 'border border-slate-300 px-3.5 py-2.5'
                  : 'pt-2'
              }`}
            >
              <span className="text-slate-400 font-medium text-right">شماره فاکتور:</span>
              <span dir="ltr" className="font-black text-slate-900 tabular-nums text-left">
                {toPersianDigits(invoice.invoiceNumber)}
              </span>

              <span className="text-slate-400 font-medium text-right">تاریخ صدور:</span>
              <span className="font-bold text-slate-800 tabular-nums text-left">
                {toPersianDigits(invoice.issueDate)}
              </span>

              {invoice.dueDate && (
                <>
                  <span className="text-slate-400 font-medium text-right">سررسید / اعتبار:</span>
                  <span className="font-bold text-slate-800 tabular-nums text-left">
                    {toPersianDigits(invoice.dueDate)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Parties Grid: Seller Details & Buyer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Buyer */}
          <div
            className={`p-4 space-y-1.5 ${
              isClassic
                ? 'border border-slate-300'
                : isMinimal
                ? 'border-t border-slate-200 pt-3 px-0'
                : 'bg-slate-50/70 rounded-xl border border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10.5px] font-black ${
                  isShayegan ? 'text-[#009688]' : 'text-slate-500'
                }`}
              >
                مشخصات خریدار / کارفرما
              </span>
              {invoice.sourceTitle && (
                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[180px]">
                  بابت: {invoice.sourceTitle}
                </span>
              )}
            </div>
            <div className="text-sm font-black text-slate-900">{invoice.buyerName || 'خریدار محترم'}</div>
            {invoice.buyerCompany && (
              <div className="text-xs font-bold text-slate-600">{invoice.buyerCompany}</div>
            )}
            <div className="pt-1 space-y-0.5 text-[11px] text-slate-500">
              {invoice.buyerPhone && (
                <div className="tabular-nums">تلفن تماس: {toPersianDigits(invoice.buyerPhone)}</div>
              )}
              {invoice.buyerEmail && (
                <div>
                  ایمیل: <span dir="ltr">{invoice.buyerEmail}</span>
                </div>
              )}
              {invoice.buyerNationalId && (
                <div className="tabular-nums">
                  شناسه / کد ملی: {toPersianDigits(invoice.buyerNationalId)}
                </div>
              )}
              {invoice.buyerAddress && <div className="leading-relaxed">نشانی: {invoice.buyerAddress}</div>}
            </div>
          </div>

          {/* Seller Legal Details */}
          <div
            className={`p-4 space-y-1.5 ${
              isClassic
                ? 'border border-slate-300'
                : isMinimal
                ? 'border-t border-slate-200 pt-3 px-0'
                : 'bg-white rounded-xl border border-slate-200/80'
            }`}
          >
            <span className="text-[10.5px] font-black text-slate-500 block">مشخصات فروشنده / مجری</span>
            <div className="text-sm font-black text-slate-900">{seller.companyName}</div>
            <div className="pt-1 space-y-0.5 text-[11px] text-slate-500">
              {seller.nationalId && (
                <div className="tabular-nums">شناسه ملی: {toPersianDigits(seller.nationalId)}</div>
              )}
              {seller.economicCode && (
                <div className="tabular-nums">کد اقتصادی: {toPersianDigits(seller.economicCode)}</div>
              )}
              {seller.address && <div className="leading-relaxed">نشانی: {seller.address}</div>}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div
          className={`overflow-x-auto ${
            isClassic
              ? 'border border-slate-900'
              : isMinimal
              ? 'border-y border-slate-200'
              : 'rounded-xl border border-slate-200 overflow-hidden'
          }`}
        >
          <table className="w-full text-right border-collapse">
            <thead>
              <tr
                className={`text-[11px] font-black ${
                  isShayegan
                    ? 'bg-slate-900 text-white'
                    : isClassic
                    ? 'bg-slate-100 text-slate-900 border-b-2 border-slate-900'
                    : 'bg-white text-slate-500 border-b border-slate-200'
                }`}
              >
                <th className="py-3 px-3 text-center w-12">ردیف</th>
                <th className="py-3 px-3">شرح کالا / خدمات</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">تعداد / واحد</th>
                <th className="py-3 px-3 text-left whitespace-nowrap">مبلغ واحد (تومان)</th>
                {hasAnyLineDiscount && (
                  <th className="py-3 px-3 text-left whitespace-nowrap">تخفیف ردیف</th>
                )}
                <th className="py-3 px-3 text-left whitespace-nowrap">جمع کل (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoice.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={hasAnyLineDiscount ? 6 : 5}
                    className="py-8 text-center text-slate-400 text-xs"
                  >
                    ردیفی برای این فاکتور ثبت نشده است.
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, idx) => {
                  const lineGross = Math.max(0, (item.quantity || 0) * (item.unitPrice || 0));
                  const lineDisc = Math.max(0, item.discount || 0);
                  const lineNet = Math.max(0, lineGross - lineDisc);
                  return (
                    <tr
                      key={item.id || idx}
                      className={idx % 2 === 1 && !isMinimal ? 'bg-slate-50/45' : 'bg-white'}
                    >
                      <td className="py-3.5 px-3 text-center font-bold text-slate-500 tabular-nums align-top">
                        {toPersianDigits(idx + 1)}
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700 tabular-nums whitespace-nowrap align-top">
                        {toPersianDigits(item.quantity || 1)}
                        {item.unit ? ` ${item.unit}` : ''}
                      </td>
                      <td className="py-3.5 px-3 text-left font-bold text-slate-700 tabular-nums whitespace-nowrap align-top">
                        {formatPrice(item.unitPrice)}
                      </td>
                      {hasAnyLineDiscount && (
                        <td className="py-3.5 px-3 text-left font-bold text-rose-600 tabular-nums whitespace-nowrap align-top">
                          {lineDisc > 0 ? `${formatPrice(lineDisc)}-` : '—'}
                        </td>
                      )}
                      <td className="py-3.5 px-3 text-left font-black text-slate-900 tabular-nums whitespace-nowrap align-top">
                        {formatPrice(lineNet)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Split: Bank Info & Terms (Right) + Financial Totals (Left) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          {/* Bank Account & Payment Instructions */}
          <div className="sm:col-span-6 space-y-3">
            {bankAccount && (
              <div
                className={`p-4 space-y-2 ${
                  isClassic
                    ? 'border border-slate-300'
                    : isMinimal
                    ? 'border border-slate-200 rounded-xl'
                    : 'bg-slate-50 rounded-xl border border-slate-200/80'
                }`}
              >
                <div
                  className={`text-[11px] font-black ${
                    isShayegan ? 'text-[#009688]' : 'text-slate-700'
                  }`}
                >
                  مشخصات حساب جهت واریز وجه
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">بانک و صاحب حساب:</span>
                    <span className="font-bold text-slate-900">
                      {bankAccount.bankName} — {bankAccount.accountHolder}
                    </span>
                  </div>
                  {bankAccount.cardNumber && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">شماره کارت:</span>
                      <span dir="ltr" className="font-black text-slate-900 tabular-nums">
                        {formatCardNumber(bankAccount.cardNumber)}
                      </span>
                    </div>
                  )}
                  {bankAccount.iban && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">شماره شبا:</span>
                      <span dir="ltr" className="font-bold text-slate-800 tabular-nums text-[10.5px]">
                        {toPersianDigits(bankAccount.iban)}
                      </span>
                    </div>
                  )}
                  {bankAccount.accountNumber && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">شماره حساب:</span>
                      <span dir="ltr" className="font-bold text-slate-800 tabular-nums">
                        {toPersianDigits(bankAccount.accountNumber)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="text-[11px] text-slate-600 leading-relaxed bg-white border border-slate-200/70 rounded-xl p-3.5">
                <span className="font-black text-slate-800 block mb-1">یادداشت فاکتور:</span>
                {invoice.notes}
              </div>
            )}
          </div>

          {/* Financial Totals Summary */}
          <div className="sm:col-span-6">
            <div
              className={`overflow-hidden ${
                isClassic
                  ? 'border-2 border-slate-900'
                  : isMinimal
                  ? 'border border-slate-200 rounded-xl'
                  : 'rounded-xl border border-slate-200'
              }`}
            >
              <div className="p-4 space-y-2.5 text-xs bg-white">
                <div className="flex items-center justify-between text-slate-600">
                  <span>جمع کل اقلام:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatPrice(subtotalAfterLines)} تومان
                  </span>
                </div>

                {invoiceDiscount > 0 && (
                  <div className="flex items-center justify-between text-rose-700">
                    <span>
                      تخفیف کل
                      {invoice.discountType === 'percent' && invoice.discountValue > 0
                        ? ` (${toPersianDigits(invoice.discountValue)}٪)`
                        : ''}
                      :
                    </span>
                    <span className="font-bold tabular-nums">{formatPrice(invoiceDiscount)}- تومان</span>
                  </div>
                )}

                {(invoice.taxRate > 0 || taxAmount > 0) && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span>
                      مالیات بر ارزش افزوده
                      {invoice.taxRate > 0 ? ` (${toPersianDigits(invoice.taxRate)}٪)` : ''}:
                    </span>
                    <span className="font-bold tabular-nums">+{formatPrice(taxAmount)} تومان</span>
                  </div>
                )}
              </div>

              {/* Net Payable Highlight Row */}
              <div
                className={`px-4 py-3.5 flex items-center justify-between ${
                  isShayegan
                    ? 'bg-slate-900 text-white'
                    : isClassic
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-900 border-t border-slate-200'
                }`}
              >
                <span className="text-xs font-black">مبلغ کل قابل پرداخت:</span>
                <span
                  className={`text-base font-black tabular-nums ${
                    isShayegan ? 'text-[#2CE2D2]' : ''
                  }`}
                >
                  {formatPrice(finalTotal)} <span className="text-[11px] font-bold">تومان</span>
                </span>
              </div>

              {/* Amount in Persian Words */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[10.5px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">به حروف: </span>
                {numberToPersianWords(finalTotal)} تومان
              </div>

              {/* Paid & Remaining Strip (when applicable) */}
              {(paidAmount > 0 || invoice.documentType !== 'پیش‌فاکتور') && (
                <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-200 border-t border-slate-200 bg-white text-[11px]">
                  <div className="px-4 py-2.5 flex flex-col">
                    <span className="text-slate-400 text-[10px]">مبلغ پرداخت‌شده</span>
                    <span className="font-black text-emerald-700 tabular-nums mt-0.5">
                      {formatPrice(paidAmount)} تومان
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex flex-col">
                    <span className="text-slate-400 text-[10px]">مانده قابل پرداخت</span>
                    <span
                      className={`font-black tabular-nums mt-0.5 ${
                        remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {remainingAmount > 0 ? `${formatPrice(remainingAmount)} تومان` : 'تسویه کامل (۰)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terms & Signature Footer */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-5 items-end">
          <div className="sm:col-span-7 space-y-1">
            {invoice.terms && (
              <>
                <span className="text-[10.5px] font-black text-slate-700 block">
                  شرایط و توضیحات تکمیلی:
                </span>
                <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
                  {invoice.terms}
                </p>
              </>
            )}
          </div>

          <div className="sm:col-span-5 grid grid-cols-2 gap-3 text-center pt-2">
            <div className="border-t border-dashed border-slate-300 pt-2">
              <div className="text-[10.5px] font-bold text-slate-700">مهر و امضای فروشنده</div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">{seller.signerName}</div>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-2">
              <div className="text-[10.5px] font-bold text-slate-700">تایید و امضای خریدار</div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">{invoice.buyerName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Strip */}
      {isShayegan && (
        <div className="px-8 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>{seller.companyName}</span>
          <span dir="ltr">{seller.website || seller.email}</span>
        </div>
      )}
    </div>
  );
};

export default InvoiceDocument;
