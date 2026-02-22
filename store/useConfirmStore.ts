import { create } from 'zustand';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirm: (options: { title: string; message: string; confirmText?: string; cancelText?: string }) => Promise<boolean>;
  close: () => void;
}

export const useConfirmStore = create<ConfirmDialogState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: () => { },
  onCancel: () => { },

  confirm: ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          set({ isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          set({ isOpen: false });
          resolve(false);
        },
      });
    });
  },

  close: () => set({ isOpen: false }),
}));
