import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateGroupAssistantResponse = async (
  prompt: string,
  context: string = ''
): Promise<string> => {
  if (!apiKey) {
    return "API Key not configured. Please check your environment settings.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful, friendly AI assistant for a campus social group app called "Together".
      Context: ${context}
      
      User Query: ${prompt}
      
      Provide a concise, helpful response suitable for a chat message. Use emojis where appropriate.`,
    });

    return response.text || "Sorry, I couldn't generate a response at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the network right now.";
  }
};

export const generatePostEnhancement = async (originalText: string): Promise<string> => {
  if (!apiKey) return originalText;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite the following social media post to be more engaging, clear, and fun, but keep the original meaning. Return ONLY the rewritten text.
      
      Original: ${originalText}`,
    });
    return response.text || originalText;
  } catch (error) {
    return originalText;
  }
};