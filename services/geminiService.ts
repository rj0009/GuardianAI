
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
        description: "Timestamp of the event in MM:SS format.",
      },
      description: {
        type: Type.STRING,
        description: "A brief, clear description of the detected anomalous behavior."
      }
    },
    required: ["timestamp", "description"]
  }
};

export async function analyzeVideoFile(fileName: string): Promise<Anomaly[]> {
  try {
    const prompt = `
      Analyze the video file named "${fileName}" from an early childhood development center in Singapore. 
      Generate a log of detected anomalies. 
      Focus on actions that constitute violence or aggressive behavior, such as:
      - Shoving or pushing a child to the ground.
      - Grabbing, shaking, or lifting a child by their limbs or body in a forceful manner.
      - Throwing objects at children.
      - Any other forceful physical contact that could be harmful.

      If no anomalies are detected, return an empty array.
      The output must be a JSON array of objects, each with a "timestamp" and "description".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are 'Guardian AI', an advanced AI system for child safety monitoring. Your task is to analyze video surveillance footage and identify potential instances of violence or anomalous behavior. Respond ONLY with the requested JSON format.",
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        return [];
    }
    
    const result = JSON.parse(jsonText);
    return result as Anomaly[];

  } catch (error) {
    console.error("Error analyzing video with Gemini API:", error);
    throw new Error("Failed to get analysis from Guardian AI. The model may be overloaded or an internal error occurred.");
  }
}
