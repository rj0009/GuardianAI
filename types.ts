
export interface Anomaly {
  timestamp: string;
  description: string;
}

export interface AnalysisResult {
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  anomalies: Anomaly[];
  error?: string;
  videoUrl?: string;
}
