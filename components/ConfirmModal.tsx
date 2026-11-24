import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isAlertOnly?: boolean; // if true, only show OK/close button
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'بله، حذف شود',
  cancelText = 'انصراف',
  variant = 'danger',
  isAlertOnly = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 size={24} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Info size={24} />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {getIcon()}
            <div className="flex-1">
              <h4 className="text-base font-black text-slate-800">{title}</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{message}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            {isAlertOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100"
              >
                متوجه شدم
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                  className={`py-2.5 px-5 text-white text-xs font-bold rounded-xl transition-all shadow-md ${
                    variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'
                  }`}
                >
                  {confirmText}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
