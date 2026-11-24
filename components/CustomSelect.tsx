import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { toPersianDigits } from '../constants';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  group?: string;
  dotColorClass?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  searchable?: boolean;
  disabled?: boolean;
  dir?: 'rtl' | 'ltr';
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید...',
  className = '',
  buttonClassName = '',
  searchable = false,
  disabled = false,
  dir = 'rtl'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    openUpward: boolean;
    borderRadius: string;
  }>({
    top: 0,
    left: 0,
    width: 200,
    maxHeight: 240,
    openUpward: false,
    borderRadius: '12px'
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(triggerRef.current);
    const borderRadius = computedStyle.borderRadius || '12px';

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 12;
    const gap = 6;
    const spaceBelow = viewportHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;

    const preferredMax = 256;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableSpace = openUpward ? spaceAbove - gap : spaceBelow - gap;
    const maxHeight = Math.max(120, Math.min(preferredMax, availableSpace));

    // Keep dropdown strictly matching parent width & clamped within viewport
    const width = Math.min(rect.width, viewportWidth - padding * 2);
    let left = rect.left;
    if (left + width > viewportWidth - padding) {
      left = viewportWidth - width - padding;
    }
    if (left < padding) {
      left = padding;
    }

    setCoords({
      top: openUpward ? rect.top - gap : rect.bottom + gap,
      left,
      width,
      maxHeight,
      openUpward,
      borderRadius
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    if (searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, searchable]);

  const filteredOptions = searchQuery.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (o.group && o.group.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  // Group options preserving order
  const groups: Array<{ name: string | null; items: SelectOption[] }> = [];
  filteredOptions.forEach((opt) => {
    const groupName = opt.group || null;
    const existing = groups.find((g) => g.name === groupName);
    if (existing) {
      existing.items.push(opt);
    } else {
      groups.push({ name: groupName, items: [opt] });
    }
  });

  return (
    <div className={`relative ${className}`} dir={dir}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-60 disabled:cursor-not-allowed text-right ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/15 bg-white' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.dotColorClass && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOption.dotColorClass}`} />
          )}
          <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400 font-medium'}`}>
            {selectedOption ? toPersianDigits(selectedOption.label) : placeholder}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            dir={dir}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              transform: coords.openUpward ? 'translateY(-100%)' : 'none',
              borderRadius: coords.borderRadius,
              zIndex: 9999
            }}
            className="bg-white border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden font-['Vazirmatn']"
          >
            {searchable && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                  <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو..."
                    className="w-full pr-8 pl-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            )}

            <div
              style={{ maxHeight: coords.maxHeight }}
              className="overflow-y-auto p-1.5 space-y-0.5"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-4 px-3 text-center text-[11px] text-slate-400">
                  موردی یافت نشد
                </div>
              ) : (
                groups.map((grp, gIdx) => (
                  <div key={grp.name ?? `group-${gIdx}`} className="space-y-0.5">
                    {grp.name && (
                      <div className="px-2.5 pt-2 pb-1 text-[10px] font-black text-slate-400 select-none">
                        {grp.name}
                      </div>
                    )}
                    {grp.items.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={opt.disabled}
                          onClick={() => {
                            if (opt.disabled) return;
                            onChange(opt.value);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-right transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {opt.dotColorClass && (
                              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColorClass}`} />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate">{toPersianDigits(opt.label)}</div>
                              {opt.sublabel && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                                  {toPersianDigits(opt.sublabel)}
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomSelect;
