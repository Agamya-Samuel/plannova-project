'use client';

import { toast } from 'sonner';
import React, { useState } from 'react';

interface PromptOptions {
  title?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export const sonnerPrompt = (message: string, options: PromptOptions = {}): Promise<string | null> => {
  const {
    title = 'Prompt',
    placeholder = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  } = options;

  return new Promise((resolve) => {
    const PromptComponent = () => {
      const [value, setValue] = useState('');

      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">{message}</p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(toastId);
                resolve(null);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                toast.dismiss(toastId);
                resolve(value);
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {confirmText}
            </button>
          </div>
        </div>
      );
    };

    const toastId = toast(title, {
      duration: Infinity,
      position: 'top-center',
      classNames: {
        toast: 'w-full max-w-md'
      },
      closeButton: true
    });

    // Update the toast with our custom component
    toast.custom(() => <PromptComponent />, {
      id: toastId,
      duration: Infinity,
      position: 'top-center'
    });
  });
};