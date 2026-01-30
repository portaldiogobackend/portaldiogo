import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === 'success' ? 'bg-[#05CD99]' : 'bg-[#EE5D50]';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:bottom-10 md:right-10 md:left-auto md:w-max z-[100] flex items-center justify-between md:justify-start gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${bgColor}`}>
      <div className="flex items-center gap-3">
        <Icon size={24} />
        <span className="font-bold">{message}</span>
      </div>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};
