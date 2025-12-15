import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to handle API errors gracefully and provide user-friendly feedback.
 */
const handleApiError = (error: any, context: string): string => {
  console.error(`Error in ${context}:`, error);

  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object') {
    // Try to stringify if it's a plain object to check for content keys like "message" or "status"
    try {
      errorMessage = JSON.stringify(error);
    } catch (e) {
      errorMessage = String(error);
    }
  }

  // Check for 429 (Too Many Requests / Quota Exceeded)
  if (
    errorMessage.includes('429') ||
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorMessage.includes('Quota') ||
    error?.status === 429 ||
    error?.code === 429 ||
    error?.error?.code === 429
  ) {
    return "⚠️ Sistema sobrecargado (Cuota de IA excedida). Intenta en unos minutos.";
  }

  // Check for 5xx Server Errors
  if (errorMessage.includes('503') || errorMessage.includes('500') || errorMessage.includes('Overloaded')) {
    return "⚠️ Servicio de IA temporalmente no disponible.";
  }

  return "⚠️ No se pudo generar la respuesta. Por favor intenta de nuevo.";
};

/**
 * Generates suggested responses for a support agent based on the conversation history.
 * Returns an array of options (Formal, Casual, Short).
 */
export const getSuggestedReply = async (customerName: string, lastMessages: Message[]): Promise<string[]> => {
  try {
    // Format history for the model
    // We limit context to the last 2 messages to conserve tokens
    const historyText = lastMessages
      .slice(-2)
      .map(m => `${m.senderId === 'customer' ? 'Cliente' : 'Agente'}: ${m.text}`)
      .join('\n');

    const prompt = `
      Actúa como soporte técnico. Cliente: ${customerName}
      Contexto reciente:
      ${historyText}
      
      Instrucción: Genera 3 opciones de respuesta distintas para el agente.
      1. Formal y empática.
      2. Breve y directa.
      3. Acción orientada a solución.
      
      IMPORTANTE: Separa las 3 opciones ÚNICAMENTE con "|||". No numeres las opciones.
      Ejemplo: Hola, lamento el problema...|||Entendido, revisaré ahora...|||Por favor dame tu ID...
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "";

    // Split by the delimiter and filter out empty strings
    const suggestions = text.split('|||').map(s => s.trim()).filter(s => s.length > 0);

    // Fallback if split fails or model ignores instruction
    if (suggestions.length === 0) return [text];

    return suggestions;

  } catch (error) {
    const errorMsg = handleApiError(error, "Gemini Suggestion");
    return [errorMsg];
  }
};

/**
 * Drafts a specific response based on user instruction and conversation history.
 */
export const draftResponse = async (
  customerName: string,
  lastMessages: Message[],
  instruction: string
): Promise<string> => {
  try {
    const historyText = lastMessages
      .slice(-3) // Slightly more context for specific drafting
      .map(m => `${m.senderId === 'customer' ? 'Cliente' : 'Agente'}: ${m.text}`)
      .join('\n');

    const prompt = `
        Actúa como un agente de soporte experto.
        Cliente: ${customerName}
        Historial reciente:
        ${historyText}
  
        TU TAREA: Redacta UNA respuesta para el cliente siguiendo esta instrucción específica del agente: "${instruction}".
        
        La respuesta debe ser profesional, lista para enviar y en el idioma de la conversación. No incluyas explicaciones, solo el texto del mensaje.
      `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "No pude generar el borrador.";
  } catch (error) {
    return handleApiError(error, "Gemini Draft");
  }
};

/**
 * Summarizes a conversation for administrative review.
 */
export const summarizeConversation = async (messages: Message[]): Promise<string> => {
  try {
    // Limit to last 5 messages for summary to save tokens
    const textContent = messages
      .slice(-5)
      .map(m => `${m.senderId === 'customer' ? 'C' : 'A'}: ${m.text}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Resume en 3 puntos breves (Problema, Acción, Estado):\n${textContent}`,
    });

    return response.text;
  } catch (error) {
    return handleApiError(error, "Gemini Summary");
  }
};