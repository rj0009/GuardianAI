
export interface Anomaly {
  timestamp: string;
  description: string;
}

export interface AnalysisResult {
  fileName: string;
  status: 'pending' | 'completed' | 'error';
  anomalies: Anomaly[];
  error?: string;
}
