'use client';

import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  isFirstTab: boolean;
  isLastTab: boolean;
  className?: string;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  onPrevious,
  onNext,
  isFirstTab,
  isLastTab,
  className = ""
}: TabNavigationProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="flex space-x-2">
        {!isFirstTab && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
        )}
        
        {!isLastTab && (
          <Button
            type="button"
            onClick={onNext}
            className="flex items-center space-x-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
