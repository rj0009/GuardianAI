
import React from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

export const WelcomeSplash: React.FC = () => {
  return (
    <div className="text-center mt-12 p-8 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <ShieldCheckIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Welcome to Guardian AI</h2>
      <p className="mt-2 max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
        Your proactive solution for child safety monitoring. Upload your surveillance video files to begin the automated analysis for potential behavioral anomalies.
      </p>
    </div>
  );
};
