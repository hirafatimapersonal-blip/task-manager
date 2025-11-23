import { GoogleGenAI, Type } from "@google/genai";
import { AIPlanResponse, Category, Priority } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Uses Gemini to break down a complex goal into structured tasks.
 */
export const generateActionPlan = async (goal: string): Promise<AIPlanResponse> => {
  if (!apiKey) throw new Error("API Key is missing");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Create a detailed action plan for the following goal: "${goal}". 
    Break it down into 3-5 concrete tasks. 
    For each task, assign a priority (Low, Medium, High) and a category (Work, Personal, Health, Learning, General).
    Add 2-3 subtasks for each main task.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: [Priority.Low, Priority.Medium, Priority.High] },
                category: { type: Type.STRING, enum: [Category.Work, Category.Personal, Category.Health, Category.Learning, Category.General] },
                subtasks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "priority", "category", "subtasks"]
            }
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as AIPlanResponse;
  }
  
  throw new Error("Failed to generate plan");
};

/**
 * Uses Gemini to suggest a single breakdown for a specific task title.
 */
export const suggestSubtasks = async (taskTitle: string): Promise<string[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `I have a task: "${taskTitle}". Suggest 3 to 5 actionable substeps to complete this task. Return a simple JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as string[];
  }
  return [];
};

/**
 * Suggests a priority for a task based on its description.
 */
export const suggestPriority = async (taskTitle: string): Promise<Priority> => {
    if (!apiKey) return Priority.Medium;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the urgency and importance of this task: "${taskTitle}". Return only one word: "High", "Medium", or "Low".`,
            config: {
                responseMimeType: "text/plain",
            }
        });
        
        const text = response.text?.trim().toLowerCase();
        if (text === 'high') return Priority.High;
        if (text === 'low') return Priority.Low;
        return Priority.Medium;
    } catch (e) {
        return Priority.Medium;
    }
}
