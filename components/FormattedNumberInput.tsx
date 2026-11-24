import React from 'react';
import { formatInputNumber, toEnglishDigits, toPersianDigits } from '../constants';

interface FormattedNumberInputProps {
  value: string | number;
  onChange: (rawEnglishDigits: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  max?: number;
  min?: number;
  suffix?: string;
  className?: string;
  allowDecimal?: boolean;
}

const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  max,
  suffix,
  className = ''
}) => {
  const displayValue =
    value !== '' && value !== undefined && value !== null
      ? formatInputNumber(value)
      : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
    if (raw === '') {
      onChange('');
      return;
    }
    const num = Number(raw);
    if (max !== undefined && num > max) {
      onChange(String(max));
      return;
    }
    onChange(String(num));
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        required={required}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        placeholder={toPersianDigits(placeholder)}
        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 tabular-nums transition-all ${
          suffix ? 'pl-14' : ''
        } ${className}`}
      />
      {suffix && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

export default FormattedNumberInput;
