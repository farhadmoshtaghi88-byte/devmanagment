import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { StatusConfig, StatusColorKey } from '../types';
import { STATUS_COLOR_OPTIONS, STATUS_COLOR_STYLES } from '../constants';

interface StringListManagerProps {
  mode: 'string';
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: string[];
  onAdd: (label: string) => void;
  onUpdate: (oldLabel: string, newLabel: string) => void;
  onDelete: (label: string) => void;
}

interface StatusListManagerProps {
  mode: 'status';
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: StatusConfig[];
  onAdd: (label: string, color: StatusColorKey) => void;
  onUpdate: (id: string, label: string, color: StatusColorKey) => void;
  onDelete: (id: string) => void;
}

type OptionManagerModalProps = StringListManagerProps | StatusListManagerProps;

const OptionManagerModal: React.FC<OptionManagerModalProps> = (props) => {
  const { isOpen, onClose, title, subtitle } = props;
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState<StatusColorKey>('indigo');

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState<StatusColorKey>('indigo');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (props.mode === 'string') {
      props.onAdd(trimmed);
    } else {
      props.onAdd(trimmed, newColor);
    }
    setNewLabel('');
  };

  const handleSaveEdit = () => {
    const trimmed = editLabel.trim();
    if (!trimmed || !editingKey) return;
    if (props.mode === 'string') {
      props.onUpdate(editingKey, trimmed);
    } else {
      props.onUpdate(editingKey, trimmed, editColor);
    }
    setEditingKey(null);
    setEditLabel('');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-['Vazirmatn']">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h4 className="text-base font-black text-slate-800">{title}</h4>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Add Form */}
          <form onSubmit={handleAdd} className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="عنوان جدید را وارد کنید..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} /> افزودن
              </button>
            </div>

            {props.mode === 'status' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 ml-1">رنگ برچسب:</span>
                {STATUS_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setNewColor(c.key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      newColor === c.key
                        ? 'border-slate-800 bg-white shadow-sm text-slate-900'
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

          {/* Items List */}
          <div className="space-y-2">
            {props.mode === 'string'
              ? props.items.map((item) => {
                  const isEditing = editingKey === item;
                  return (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-indigo-300 rounded-lg text-xs font-bold outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                            title="ذخیره"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                            title="انصراف"
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
                                setEditingKey(item);
                                setEditLabel(item);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="ویرایش"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={props.items.length <= 1}
                              onClick={() => props.onDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                              title="حذف"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              : props.items.map((status) => {
                  const isEditing = editingKey === status.id;
                  const style = STATUS_COLOR_STYLES[status.color] || STATUS_COLOR_STYLES.slate;
                  return (
                    <div
                      key={status.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-2"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                              className="flex-1 px-3 py-1.5 bg-slate-50 border border-indigo-300 rounded-lg text-xs font-bold outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingKey(null)}
                              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {STATUS_COLOR_OPTIONS.map((c) => (
                              <button
                                key={c.key}
                                type="button"
                                onClick={() => setEditColor(c.key)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                  editColor === c.key
                                    ? 'border-slate-800 bg-slate-50 text-slate-900'
                                    : 'border-slate-100 text-slate-500'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${STATUS_COLOR_STYLES[c.key].dot}`} />
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                            <span className="text-xs font-bold text-slate-800">{status.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKey(status.id);
                                setEditLabel(status.label);
                                setEditColor(status.color);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="ویرایش"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={props.items.length <= 1}
                              onClick={() => props.onDelete(status.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                              title="حذف"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionManagerModal;
