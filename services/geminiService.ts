import { GoogleGenAI, Type } from "@google/genai";
import { type Anomaly } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      timestamp: {
        type: Type.STRING,
        description: "The timestamp of the event in MM:SS format, corresponding to one of the frames provided.",
      },
      description: {
        type: Type.STRING,
        description: "A brief, clear description of the detected anomalous behavior."
      }
    },
    required: ["timestamp", "description"]
  }
};

const FRAME_COUNT = 8;

interface FrameData {
  base64Data: string;
  timestamp: number;
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function extractFramesFromVideo(videoFile: File): Promise<FrameData[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
    };

    video.onloadedmetadata = async () => {
      // In case of a stream or unknown duration, we try to seek to the end.
      if (video.duration === Infinity) {
          video.currentTime = 1e101;
          await new Promise(r => {
            const timeout = setTimeout(() => {
              // Failsafe in case ontimeupdate never fires
              r(null);
            }, 1000);
            video.ontimeupdate = () => {
              clearTimeout(timeout);
              r(null);
            }
          });
          video.currentTime = 0;
      }
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        cleanup();
        return reject(new Error("Could not get canvas context."));
      }
      
      const maxDim = 512;
      const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const duration = video.duration;
      // Sample from 10% to 90% of the video to avoid intros/credits
      const start = duration * 0.1;
      const end = duration * 0.9;
      const range = end - start;
      const interval = range > 0 ? range / (FRAME_COUNT -1) : 0;
      const frames: FrameData[] = [];
      
      let seekResolve: (value?: unknown) => void;
      video.onseeked = () => {
        if(seekResolve) seekResolve();
      };

      try {
        for (let i = 0; i < FRAME_COUNT; i++) {
          const time = start + (i * interval);
          video.currentTime = time;
          await new Promise(res => seekResolve = res);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Use JPEG with quality setting to control base64 size
          frames.push({
            base64Data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1],
            timestamp: time,
          }); 
        }
        cleanup();
        resolve(frames);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error(`Error loading video: ${video.error?.message || 'Unknown error'}`));
    };
  });
}


export async function analyzeVideoFile(videoFile: File): Promise<Anomaly[]> {
  try {
    const framesWithData = await extractFramesFromVideo(videoFile);
    
    const imageParts = framesWithData.map(frameData => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: frameData.base64Data,
      },
    }));

    const timestamps = framesWithData.map(f => formatTimestamp(f.timestamp));
    const timestampContext = `The frames were extracted at these timestamps: ${timestamps.join(', ')}.`;

    const prompt = `
      Analyze the following sequence of frames from a surveillance video at an early childhood development center.
      The video file name is "${videoFile.name}".
      ${timestampContext}
      Your task is to identify and report any instances of violence, aggressive behavior, or child endangerment. Be extremely vigilant.
      Generate a log of detected anomalies. Focus on actions such as:
      - Hitting, slapping, or beating a child with a hand or an object.
      - Kicking a child.
      - Shoving or pushing a child to the ground.
      - Grabbing, shaking, or lifting a child by their limbs or body in a forceful or aggressive manner.
      - Throwing objects at children.
      - Any forceful physical contact that could be harmful or appears to cause distress.
      - Inappropriate or rough handling of a child.

      If no such anomalies are detected, return an empty array.
      The output must be a JSON array of objects, where each object has a "timestamp" and a "description".
      The timestamp for each anomaly MUST be one of the provided timestamps and must correspond to the frame where the event is most visible.
    `;

    const contents = {
        parts: [
            ...imageParts,
            { text: prompt },
        ]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    // Robustly handle the API response to prevent crashes on empty or blocked responses.
    const responseText = response?.text;

    if (!responseText) {
      const finishReason = response?.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error("Analysis blocked: The content may violate the AI's safety policies.");
      }
      // If there's no text and no specific block reason, assume no anomalies were found as per the prompt.
      return [];
    }

    try {
      // Attempt to parse the JSON response.
      return JSON.parse(responseText.trim());
    } catch (e) {
      console.error("Failed to parse JSON from Gemini response:", responseText, e);
      throw new Error("The AI returned a response in an unexpected format.");
    }
  } catch (error) {
    console.error(`Error analyzing video ${videoFile.name}:`, error);
    // Re-throw the error to be handled by the UI component, which will display the error message.
    throw error;
  }
}
