import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { FileVideoIcon } from './icons/FileVideoIcon';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // FIX: Add explicit File type to `file` parameter in filter to resolve 'unknown' type error.
    const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('video/'));
    if (files.length > 0) {
      // FIX: Add explicit File type to `f` parameter in map to resolve 'unknown' type error.
      setSelectedFileNames(files.map((f: File) => f.name));
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Add explicit File type to `file` parameter in filter to resolve 'unknown' type error.
    const files = Array.from(e.target.files || []).filter((file: File) => file.type.startsWith('video/'));
    if (files.length > 0) {
      // FIX: Add explicit File type to `f` parameter in map to resolve 'unknown' type error.
      setSelectedFileNames(files.map((f: File) => f.name));
      onFilesSelected(files);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept="video/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
            <UploadCloudIcon className="w-12 h-12 text-gray-400" />
            <div className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Supports single or batch upload (MP4, MOV, AVI, etc.)</p>
        </label>
      </div>
      {selectedFileNames.length > 0 && (
         <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
           <h3 className="font-semibold">Last selection:</h3>
           <ul className="list-disc list-inside">
             {selectedFileNames.map(name => <li key={name} className="break-words"><FileVideoIcon className="inline w-4 h-4 mr-2" />{name}</li>)}
           </ul>
         </div>
      )}
       {isAnalyzing && (
        <div className="mt-4 flex items-center justify-center text-sm text-blue-600 dark:text-blue-400">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Analyzing videos... Please wait.
        </div>
      )}
    </div>
  );
};