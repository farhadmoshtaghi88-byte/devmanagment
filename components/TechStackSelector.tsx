import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus, X, ChevronDown, Code2 } from 'lucide-react';
import { toPersianDigits } from '../constants';

interface TechStackSelectorProps {
  selected: string[];
  availableTechs: string[];
  onChange: (nextSelected: string[]) => void;
  onAddNewTech?: (newTech: string) => void;
  placeholder?: string;
}

const TechStackSelector: React.FC<TechStackSelectorProps> = ({
  selected,
  availableTechs,
  onChange,
  onAddNewTech,
  placeholder = 'انتخاب از لیست یا تایپ تکنولوژی جدید...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 300,
    maxHeight: 220,
    openUpward: false
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 12;
    const gap = 6;
    const spaceBelow = viewportHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(240, (openUpward ? spaceAbove : spaceBelow) - gap));
    const width = Math.min(rect.width, viewportWidth - padding * 2);
    let left = rect.left;
    if (left + width > viewportWidth - padding) left = viewportWidth - width - padding;
    if (left < padding) left = padding;

    setCoords({
      top: openUpward ? rect.top - gap : rect.bottom + gap,
      left,
      width,
      maxHeight,
      openUpward
    });
  };

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, selected.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
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
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const toggleTech = (tech: string) => {
    if (selected.includes(tech)) {
      onChange(selected.filter((item) => item !== tech));
    } else {
      onChange([...selected, tech]);
    }
  };

  const handleAddCustom = (customValue: string) => {
    const cleaned = customValue.trim();
    if (!cleaned) return;
    const existingExact = availableTechs.find((t) => t.toLowerCase() === cleaned.toLowerCase());
    const finalName = existingExact || cleaned;
    if (!existingExact && onAddNewTech) {
      onAddNewTech(finalName);
    }
    if (!selected.includes(finalName)) {
      onChange([...selected, finalName]);
    }
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && query.trim()) {
      e.preventDefault();
      handleAddCustom(query.replace(/,/g, ''));
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      onChange(selected.slice(0, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const filteredTechs = availableTechs.filter((t) =>
    t.toLowerCase().includes(query.trim().toLowerCase())
  );

  const exactMatchExists = availableTechs.some(
    (t) => t.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`w-full min-h-[44px] px-3 py-2 bg-slate-50 border rounded-xl transition-all cursor-text flex flex-wrap items-center gap-1.5 ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/15 bg-white'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selected.map((tech) => (
          <span
            key={tech}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg text-[11px] font-bold"
          >
            <span>{tech}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleTech(tech);
              }}
              className="hover:text-rose-600 transition-colors cursor-pointer"
              title="حذف"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            if (val.includes(',')) {
              const parts = val.split(',');
              parts.slice(0, -1).forEach((p) => handleAddCustom(p));
              setQuery(parts[parts.length - 1]);
            } else {
              setQuery(val);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : 'افزودن مورد دیگر...'}
          className="flex-1 min-w-[140px] bg-transparent text-xs outline-none text-slate-800 placeholder:text-slate-400 py-0.5"
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer shrink-0"
        >
          <ChevronDown size={15} className={`transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            dir="rtl"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              transform: coords.openUpward ? 'translateY(-100%)' : 'none',
              zIndex: 9999
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden font-['Vazirmatn']"
          >
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Code2 size={12} className="text-indigo-600" />
                انتخاب از لیست یا تایپ تکنولوژی دلخواه + Enter
              </span>
              <span>{toPersianDigits(selected.length)} انتخاب شده</span>
            </div>

            <div style={{ maxHeight: coords.maxHeight }} className="overflow-y-auto p-1.5 space-y-1">
              {query.trim() && !exactMatchExists && (
                <button
                  type="button"
                  onClick={() => handleAddCustom(query)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Plus size={14} />
                    افزودن «{query.trim()}» به لیست و انتخاب
                  </span>
                  <span className="text-[10px] text-indigo-500 shrink-0">Enter</span>
                </button>
              )}

              {filteredTechs.length === 0 && !query.trim() ? (
                <div className="py-4 text-center text-xs text-slate-400">لیست خالی است</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {filteredTechs.map((tech) => {
                    const isSelected = selected.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTech(tech)}
                        className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg text-xs text-right transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <span className="truncate">{tech}</span>
                        {isSelected && <Check size={13} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TechStackSelector;
