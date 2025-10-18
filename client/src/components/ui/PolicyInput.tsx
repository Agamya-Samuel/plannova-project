'use client';

import React from 'react';

interface PolicyData {
  cancellationPolicy: string;
  paymentTerms: string;
}

interface PolicyInputProps {
  data: PolicyData;
  onChange: (data: PolicyData) => void;
  className?: string;
}

export default function PolicyInput({
  data,
  onChange,
  className = ""
}: PolicyInputProps) {
  const handleFieldChange = (field: keyof PolicyData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies & Terms</h2>
        <p className="text-gray-600 mb-6">Set your cancellation and payment policies to manage customer expectations</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cancellation Policy
        </label>
        <textarea
          value={data.cancellationPolicy}
          onChange={(e) => handleFieldChange('cancellationPolicy', e.target.value)}
          placeholder="Describe your cancellation policy..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">Be clear about refund terms and cancellation deadlines</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Terms
        </label>
        <textarea
          value={data.paymentTerms}
          onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
          placeholder="Describe your payment terms (e.g., 50% advance, balance before event)..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">Specify advance payment requirements and payment schedules</p>
      </div>
    </div>
  );
}
