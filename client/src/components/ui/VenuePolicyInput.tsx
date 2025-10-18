'use client';

import React from 'react';

interface VenuePolicyData {
  cancellationPolicy: string;
}

interface VenuePolicyInputProps {
  data: VenuePolicyData;
  onChange: (data: VenuePolicyData) => void;
  className?: string;
}

export default function VenuePolicyInput({
  data,
  onChange,
  className = ""
}: VenuePolicyInputProps) {
  const handleFieldChange = (field: keyof VenuePolicyData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cancellation Policy *
        </label>
        <textarea
          value={data.cancellationPolicy}
          onChange={(e) => handleFieldChange('cancellationPolicy', e.target.value)}
          placeholder="Describe your cancellation policy..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Be clear about refund terms and cancellation deadlines</p>
      </div>
    </div>
  );
}
