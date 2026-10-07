import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  loading = false,
}) => {
  const iconColors = {
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[variant]}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed pt-2">{message}</p>
      </div>
    </Modal>
  );
};
