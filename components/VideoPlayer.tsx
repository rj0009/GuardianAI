
import React, { useRef, useEffect } from 'react';
import { type Anomaly } from '../types';

interface VideoPlayerProps {
  src: string;
  anomalies: Anomaly[];
}

// Helper function to parse MM:SS timestamp to seconds
const parseTimestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(':').map(part => parseInt(part, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
    }
    return 0; // fallback
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, anomalies }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firstAnomalyTimestamp = anomalies.length > 0 ? anomalies[0].timestamp : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !firstAnomalyTimestamp) return;

    const handleLoadedMetadata = () => {
      const startTime = parseTimestampToSeconds(firstAnomalyTimestamp);
      if (video.duration && startTime < video.duration) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [src, firstAnomalyTimestamp]);

  return (
    <div className="mb-4">
      <video ref={videoRef} controls className="w-full rounded-md" src={src} />
      {firstAnomalyTimestamp && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Playback will start at the first detected anomaly ({firstAnomalyTimestamp}).
        </p>
      )}
    </div>
  );
};
