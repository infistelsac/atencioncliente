/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Helper to get the AI client with the current key (Env or LocalStorage)
const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || "";
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

/**
 * Helper to handle API errors gracefully and provide user-friendly feedback.
 */
const handleApiError = (error: any, context: string): string => {
  console.error(`Error in ${context}:`, error);

  // Check if it's a missing key error (if we passed null client, though we usually check before)
  if (!getGenAI()) {
    return "⚠️ API Key de Gemini no configurada. Ve a Configuración > IA o revisa tu .env.local.";
  }

  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object') {
    try {
      errorMessage = JSON.stringify(error);
    } catch (e) {
      errorMessage = String(error);
    }
  }

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

  if (errorMessage.includes('503') || errorMessage.includes('500') || errorMessage.includes('Overloaded')) {
    return "⚠️ Servicio de IA temporalmente no disponible.";
  }

  return "⚠️ No se pudo generar la respuesta. Por favor intenta de nuevo.";
};

/**
 * Generates suggested responses for a support agent based on the conversation history.
 */
export const getSuggestedReply = async (customerName: string, lastMessages: Message[]): Promise<string[]> => {
  const ai = getGenAI();
  if (!ai) return ["⚠️ Configura tu API Key en Configuración > IA."];

  try {
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
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text || "";
    const suggestions = text.split('|||').map(s => s.trim()).filter(s => s.length > 0);

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
  const ai = getGenAI();
  if (!ai) return "⚠️ Configura tu API Key en Configuración > IA.";

  try {
    const historyText = lastMessages
      .slice(-3)
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
      model: 'gemini-1.5-flash',
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
  const ai = getGenAI();
  if (!ai) return "⚠️ Configura tu API Key en Configuración > IA.";

  try {
    const textContent = messages
      .slice(-5)
      .map(m => `${m.senderId === 'customer' ? 'C' : 'A'}: ${m.text}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Resume en 3 puntos breves (Problema, Acción, Estado):\n${textContent}`,
    });

    return response.text || "No se pudo generar el resumen.";
  } catch (error) {
    return handleApiError(error, "Gemini Summary");
  }
};