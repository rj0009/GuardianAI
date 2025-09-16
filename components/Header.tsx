
import React from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Guardian AI
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
          Child Safety Monitoring for ECDA Centers
        </p>
      </div>
    </header>
  );
};
