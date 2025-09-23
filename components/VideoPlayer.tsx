import React, { useRef, useEffect, useState } from 'react';
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
  const [visibleAnomalies, setVisibleAnomalies] = useState<Anomaly[]>([]);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      // Show box ~0.5s before and 1.5s after the anomaly timestamp
      const visible = anomalies.filter(anomaly => {
        if (!anomaly.boundingBox) return false;
        const anomalyTime = parseTimestampToSeconds(anomaly.timestamp);
        return currentTime >= anomalyTime - 0.5 && currentTime <= anomalyTime + 1.5;
      });
      // Avoid re-rendering if the visible set hasn't changed
      setVisibleAnomalies(currentVisible => {
        if (JSON.stringify(currentVisible) === JSON.stringify(visible)) {
          return currentVisible;
        }
        return visible;
      });
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleTimeUpdate); // Also update on seek

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleTimeUpdate);
    };
  }, [anomalies]);

  const renderBoundingBoxes = () => {
    const video = videoRef.current;
    if (!video || visibleAnomalies.length === 0) return null;

    const videoWidth = video.clientWidth;
    const videoHeight = video.clientHeight;

    return visibleAnomalies.map((anomaly, index) => {
        if (!anomaly.boundingBox) return null;

        const [x_min, y_min, x_max, y_max] = anomaly.boundingBox;
        
        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${x_min * videoWidth}px`,
            top: `${y_min * videoHeight}px`,
            width: `${(x_max - x_min) * videoWidth}px`,
            height: `${(y_max - y_min) * videoHeight}px`,
        };

        return (
            <div key={`${anomaly.timestamp}-${index}`} style={style} className="border-2 border-red-500 rounded-md shadow-lg flex items-end justify-center p-1 bg-red-500/20">
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap opacity-90">
                    Anomaly Detected
                </span>
            </div>
        );
    });
  };

  return (
    <div className="mb-4">
      <div className="relative w-full bg-black rounded-md overflow-hidden">
        <video ref={videoRef} controls className="w-full h-full block" src={src} />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300">
          {renderBoundingBoxes()}
        </div>
      </div>
      {firstAnomalyTimestamp && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Playback will start at the first detected anomaly ({firstAnomalyTimestamp}).
        </p>
      )}
    </div>
  );
};
