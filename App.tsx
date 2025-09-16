
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisReport } from './components/AnalysisReport';
import { analyzeVideoFile } from './services/geminiService';
import { type AnalysisResult } from './types';
import { WelcomeSplash } from './components/WelcomeSplash';

const App: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<Map<string, AnalysisResult>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [filesToAnalyze, setFilesToAnalyze] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    const newResults = new Map(analysisResults);
    const filesForAnalysis: File[] = [];
    files.forEach(file => {
      if (!newResults.has(file.name)) {
        newResults.set(file.name, {
          fileName: file.name,
          status: 'pending',
          anomalies: [],
        });
        filesForAnalysis.push(file);
      }
    });
    setAnalysisResults(newResults);
    setFilesToAnalyze(prevFiles => [...prevFiles, ...filesForAnalysis]);
  };
  
  const processFiles = useCallback(async () => {
    if (filesToAnalyze.length === 0) {
        setIsAnalyzing(false);
        return;
    }
    
    setIsAnalyzing(true);
    const fileToProcess = filesToAnalyze[0];

    try {
        const anomalies = await analyzeVideoFile(fileToProcess.name);
        setAnalysisResults(prev => new Map(prev).set(fileToProcess.name, {
            fileName: fileToProcess.name,
            status: 'completed',
            anomalies: anomalies,
        }));
    } catch (error) {
        console.error(`Analysis failed for ${fileToProcess.name}:`, error);
        setAnalysisResults(prev => new Map(prev).set(fileToProcess.name, {
            fileName: fileToProcess.name,
            status: 'error',
            anomalies: [],
            error: error instanceof Error ? error.message : 'An unknown error occurred.',
        }));
    } finally {
        setFilesToAnalyze(prev => prev.slice(1));
    }
  }, [filesToAnalyze]);


  useEffect(() => {
    if (filesToAnalyze.length > 0) {
      processFiles();
    } else {
      setIsAnalyzing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesToAnalyze, processFiles]);

  const sortedResults = Array.from(analysisResults.values()).reverse();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <FileUpload onFilesSelected={handleFilesSelected} isAnalyzing={isAnalyzing} />

          {sortedResults.length > 0 ? (
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
                Analysis Reports
              </h2>
              {sortedResults.map((result) => (
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
