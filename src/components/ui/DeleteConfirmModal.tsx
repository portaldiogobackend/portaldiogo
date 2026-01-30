import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Excluir Dúvida',
  message = 'Tem certeza que deseja excluir esta dúvida? Esta ação não pode ser desfeita.',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        
        <p className="text-[#2B3674] text-lg mb-8">
          {message}
        </p>

        <div className="flex gap-4 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
            isLoading={loading}
          >
            Excluir
          </Button>
        </div>
      </div>
    </Modal>
  );
};
