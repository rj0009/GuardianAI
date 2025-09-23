
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisReport } from './components/AnalysisReport';
import { analyzeVideoFile } from './services/geminiService';
import { type AnalysisResult, type Anomaly } from './types';
import { WelcomeSplash } from './components/WelcomeSplash';
import { YouTubeUrlInput } from './components/YouTubeUrlInput';

const App: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<Map<string, AnalysisResult>>(new Map());
  const [filesToAnalyze, setFilesToAnalyze] = useState<File[]>([]);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const resultsRef = useRef(analysisResults);
  resultsRef.current = analysisResults;

  useEffect(() => {
    // Cleanup object URLs on unmount to prevent memory leaks
    return () => {
      resultsRef.current.forEach(result => {
        if (result.videoUrl) {
          URL.revokeObjectURL(result.videoUrl);
        }
      });
    };
  }, []);

  const handleFilesSelected = (files: File[]) => {
    const newResults = new Map(analysisResults);
    const filesForAnalysis: File[] = [];
    files.forEach(file => {
      // Avoid adding duplicates to the queue
      if (!newResults.has(file.name)) {
        const videoUrl = URL.createObjectURL(file);
        newResults.set(file.name, {
          fileName: file.name,
          status: 'pending',
          anomalies: [],
          videoUrl: videoUrl,
        });
        filesForAnalysis.push(file);
      }
    });
    setAnalysisResults(newResults);
    // Add new files to the existing queue
    setFilesToAnalyze(prevFiles => [...prevFiles, ...filesForAnalysis]);
  };

  const handleYouTubeUrlSubmit = (url: string) => {
    if (analysisResults.has(url)) {
      // Avoid re-analyzing the same URL
      return;
    }

    // This feature cannot directly process the video due to browser security limitations.
    // Instead, we will guide the user to download the video and re-upload it for analysis.
    // An 'awaiting_upload' status is created for the UI to display instructions.
    setAnalysisResults(prev => new Map(prev).set(url, {
      fileName: url,
      status: 'awaiting_upload',
      anomalies: [],
    }));
  };
  
  useEffect(() => {
    // This effect manages the processing queue.
    if (!currentlyProcessing && filesToAnalyze.length > 0) {
      const fileToProcess = filesToAnalyze[0];
      setCurrentlyProcessing(fileToProcess.name);

      const processFile = async () => {
        setAnalysisResults(prev => {
          const newResults = new Map(prev);
          const currentResult = newResults.get(fileToProcess.name);
          if (currentResult) {
            newResults.set(fileToProcess.name, Object.assign({}, currentResult, { status: 'processing' }));
          }
          return newResults;
        });

        try {
          const anomalies = await analyzeVideoFile(fileToProcess);
          setAnalysisResults(prev => {
            const newResults = new Map(prev);
            const currentResult = newResults.get(fileToProcess.name);
            if (currentResult) {
              newResults.set(fileToProcess.name, Object.assign({}, currentResult, {
                status: 'completed',
                anomalies,
              }));
            }
            return newResults;
          });
        } catch (error) {
          console.error(`Analysis failed for ${fileToProcess.name}:`, error);
          setAnalysisResults(prev => {
            const newResults = new Map(prev);
            const currentResult = newResults.get(fileToProcess.name);
            if (currentResult) {
              newResults.set(fileToProcess.name, Object.assign({}, currentResult, {
                status: 'error',
                anomalies: [],
                error: error instanceof Error ? error.message : 'An unknown error occurred.',
              }));
            }
            return newResults;
          });
        } finally {
          setFilesToAnalyze(prev => prev.slice(1));
          setCurrentlyProcessing(null);
        }
      };

      processFile();
    }
  }, [filesToAnalyze, currentlyProcessing]);

  const sortedResults = Array.from(analysisResults.values()).reverse();
  const isBusy = filesToAnalyze.length > 0 || !!currentlyProcessing;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <YouTubeUrlInput onUrlSubmit={handleYouTubeUrlSubmit} isProcessing={isBusy} />
          <FileUpload onFilesSelected={handleFilesSelected} isAnalyzing={isBusy} />

          {sortedResults.length > 0 ? (
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
                Analysis Reports
              </h2>
              {sortedResults.map((result: AnalysisResult) => (
                <AnalysisReport key={result.fileName} result={result} />
              ))}
            </div>
          ) : (
            <WelcomeSplash />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
