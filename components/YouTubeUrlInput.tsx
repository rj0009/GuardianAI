
import React, { useState } from 'react';
import { LinkIcon } from './icons/LinkIcon';

interface YouTubeUrlInputProps {
  onUrlSubmit: (url: string) => void;
  isProcessing: boolean;
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

export const YouTubeUrlInput: React.FC<YouTubeUrlInputProps> = ({ onUrlSubmit, isProcessing }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!YOUTUBE_REGEX.test(url)) {
      setError('Please enter a valid YouTube URL.');
      return;
    }
    setError('');
    onUrlSubmit(url);
    setUrl(''); // Clear input after submission
  };

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
       <label htmlFor="youtube-url-input" className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Analyze from YouTube</label>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-grow w-full">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
            id="youtube-url-input"
            type="text"
            value={url}
            onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
            }}
            placeholder="Paste a YouTube video URL..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isProcessing}
            aria-label="YouTube video URL"
            />
        </div>
        <button
          type="submit"
          disabled={isProcessing || !url.trim()}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          Analyze URL
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};
