
import React from 'react';
import { type AnalysisResult, type Anomaly } from '../types';
import { Loader } from './Loader';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { FileVideoIcon } from './icons/FileVideoIcon';
import { ClockIcon } from './icons/ClockIcon';
import { VideoPlayer } from './VideoPlayer';

interface AnalysisReportProps {
  result: AnalysisResult;
}

const AnomalyItem: React.FC<{ anomaly: Anomaly }> = ({ anomaly }) => (
  <li className="flex items-start space-x-3 py-3">
    <AlertTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
    <div className="flex-1">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-semibold bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-md mr-2">
          {anomaly.timestamp}
        </span>
        {anomaly.description}
      </p>
    </div>
  </li>
);

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ result }) => {
  const getStatusIndicator = () => {
    switch (result.status) {
      case 'pending':
        return (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-5 w-5 mr-2" />
            <span className="font-semibold">Queued for Analysis</span>
          </div>
        );
      case 'processing':
        return <Loader text="Analyzing..." />;
      case 'completed':
        if (result.anomalies.length > 0) {
          return (
            <div className="flex items-center text-red-600 dark:text-red-400">
              <AlertTriangleIcon className="h-5 w-5 mr-2" />
              <span className="font-semibold">{result.anomalies.length} Anomalies Detected</span>
            </div>
          );
        }
        return (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <span className="font-semibold">No Anomalies Found</span>
          </div>
        );
      case 'error':
        return (
            <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <AlertTriangleIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Analysis Error</span>
            </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center mb-2 sm:mb-0 break-all">
          <FileVideoIcon className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" />
          {result.fileName}
        </h3>
        <div className="text-sm flex-shrink-0 ml-4">{getStatusIndicator()}</div>
      </div>
      
      {result.status === 'completed' && (
        <div className="p-4">
          {result.videoUrl && <VideoPlayer src={result.videoUrl} anomalies={result.anomalies} />}
          {result.anomalies.length > 0 ? (
            <div className="mt-4">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {result.anomalies.map((anomaly, index) => (
                  <AnomalyItem key={index} anomaly={anomaly} />
                ))}
              </ul>
            </div>
          ) : (
             <div className="pt-4 text-center text-gray-500 dark:text-gray-400">
               <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500" />
               <p className="mt-2 text-sm">The video was analyzed and no potential issues were flagged.</p>
             </div>
          )}
        </div>
      )}

      {result.status === 'error' && (
        <div className="p-6 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="max-w-full mx-auto text-center">
              <AlertTriangleIcon className="h-12 w-12 mx-auto" />
              <p className="mt-2 text-sm font-semibold">Could not complete analysis.</p>
              <p className="text-xs mt-1 break-words">{result.error}</p>
            </div>
        </div>
      )}
    </div>
  );
};