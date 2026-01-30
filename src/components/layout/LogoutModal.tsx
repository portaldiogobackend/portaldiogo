import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B2559]/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogOut size={32} />
        </div>
        <h3 className="text-xl font-bold text-[#1B2559] text-center mb-2">Tem certeza?</h3>
        <p className="text-[#A3AED0] text-center mb-8">
          Você será desconectado da sua conta e precisará fazer login novamente para acessar.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-[#F4F7FE] text-[#1B2559] font-bold rounded-xl hover:bg-[#E9EDF7] transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
