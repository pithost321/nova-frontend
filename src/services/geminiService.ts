
import { GoogleGenAI } from "@google/genai";
import { PerformanceStats, UserRole } from "../../types";

export const getAIInsights = async (
  role: UserRole, 
  name: string, 
  stats: PerformanceStats, 
  period: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const conversion = ((stats.booked / stats.calls) * 100).toFixed(1);
    const talkPercentage = ((stats.talkTimeMinutes / (stats.talkTimeMinutes + stats.waitTimeMinutes)) * 100).toFixed(1);

    const prompt = `
      Act as a high-level Call Center Operations consultant.
      Analyze these performance metrics for ${role} ${name} over ${period}:
      - Total Calls: ${stats.calls}
      - Booked Calls: ${stats.booked}
      - Conversion Rate: ${conversion}%
      - Talk Time: ${stats.talkTimeMinutes} mins
      - Wait Time: ${stats.waitTimeMinutes} mins
      - Talk vs Wait Efficiency: ${talkPercentage}%

      Provide a concise 2-3 sentence insight. Highlight one strength and one specific area for coaching or improvement. Keep it professional, motivating, and data-driven.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "AI Insights are currently unavailable. Check your connectivity.";
  }
};
