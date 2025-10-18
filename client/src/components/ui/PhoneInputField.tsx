'use client';

import React from 'react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
}

export default function PhoneInputField({
  label,
  value,
  onChange,
  placeholder = "Enter phone number",
  required = false,
  helperText,
  className = ""
}: PhoneInputFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <PhoneInput
        international
        defaultCountry="IN"
        value={value}
        onChange={(value) => onChange(value || '')}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black"
      />
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}

// Export validation function for use in forms
export { isValidPhoneNumber };
