'use client';

import { toast } from 'sonner';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export const sonnerConfirm = (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
  const {
    title = 'Confirm',
    description = message,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  } = options;

  return new Promise((resolve) => {
    const toastId = toast(
      title,
      {
        description,
        duration: Infinity,
        action: {
          label: confirmText,
          onClick: () => {
            toast.dismiss(toastId);
            resolve(true);
          }
        },
        cancel: {
          label: cancelText,
          onClick: () => {
            toast.dismiss(toastId);
            resolve(false);
          }
        }
      }
    );
  });
};