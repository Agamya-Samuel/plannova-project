'use client';

import React from 'react';

interface PaymentMethodSelectorProps {
  value: 'CASH' | 'ONLINE_CASH';
  onChange: (value: 'CASH' | 'ONLINE_CASH') => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Methods</h2>
      <p className="text-gray-600 mb-6">
        Select the payment methods you want to offer for this service
      </p>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="ONLINE_CASH"
              checked={value === 'ONLINE_CASH'}
              onChange={() => onChange('ONLINE_CASH')}
              className="mt-1 h-5 w-5 text-pink-600 focus:ring-pink-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">Online + Cash Payment</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Customers can choose to pay online through Razorpay or in cash
              </p>
            </div>
          </label>
        </div>
        
        <div className="border border-gray-200 rounded-xl p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="CASH"
              checked={value === 'CASH'}
              onChange={() => onChange('CASH')}
              className="mt-1 h-5 w-5 text-pink-600 focus:ring-pink-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">Cash Payment Only</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Customers can only pay in cash directly to the service provider
              </p>
            </div>
          </label>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="font-medium text-blue-800 mb-2">Payment Information</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Online payments are processed through Razorpay</li>
          <li>• Cash payments are collected directly by the service provider</li>
          <li>• You can change this setting at any time</li>
        </ul>
      </div>
    </div>
  );
}