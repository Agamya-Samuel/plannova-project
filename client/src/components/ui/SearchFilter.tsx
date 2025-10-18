'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './button';

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export default function SearchFilter({
  searchValue,
  onSearchChange,
  onSearch,
  onClear,
  statusValue,
  onStatusChange,
  statusOptions,
  placeholder = "Search by name, location, or description...",
  className = ""
}: SearchFilterProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer min-w-[140px]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="text-gray-900">
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={onSearch}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3"
          >
            Search
          </Button>
          {(searchValue || statusValue !== 'ALL') && (
            <Button
              variant="outline"
              onClick={onClear}
              className="flex items-center space-x-2 px-4 py-3"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
