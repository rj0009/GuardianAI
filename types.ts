
export interface Anomaly {
  timestamp: string;
  description: string;
  boundingBox?: [number, number, number, number];
}

export interface AnalysisResult {
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'awaiting_upload';
  anomalies: Anomaly[];
  error?: string;
  videoUrl?: string;
}
