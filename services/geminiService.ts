/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "../types";

// Helper to get the AI client with the current key (Env or LocalStorage)
const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || "";
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
};

/**
 * Helper to try multiple models in case of 404 (Model Not Found) or other transient errors.
 */
const generateWithFallback = async (prompt: string): Promise<string> => {
  const genAI = getGenAI();
  if (!genAI) throw new Error("API Key no configurada");

  // List of models to try. Prioritize latest experimental (Gemini 2.0), then stable 1.5.
  const models = ['gemini-2.5-flash'];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      console.log(`Intentando generar con modelo: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "";
    } catch (error: any) {
      console.warn(`Fallo con modelo ${modelName}:`, error.message || error);
      lastError = error;

      const errorStr = String(error.message || JSON.stringify(error));

      // Stop checking if it's an API Key or Auth error (400/403)
      if (errorStr.includes('API key') || errorStr.includes('403') || errorStr.includes('invalid')) {
        throw error;
      }
    }
  }

  throw lastError || new Error("No se pudo generar contenido con ningún modelo disponible.");
};

/**
 * Helper to handle API errors gracefully and provide user-friendly feedback.
 */
const handleApiError = (error: any, context: string): string => {
  console.error(`Error in ${context}:`, error);

  if (!getGenAI()) {
    return "⚠️ API Key de Gemini no configurada. Ve a Configuración > IA.";
  }

  let errorMessage = '';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    try {
      errorMessage = JSON.stringify(error);
      if (errorMessage === '{}') errorMessage = String(error);
    } catch (e) {
      errorMessage = String(error);
    }
  }

  if (errorMessage.includes('400') || errorMessage.includes('API key not valid')) {
    return "⚠️ API Key inválida. Verifica tu configuración en Ajustes.";
  }

  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return "⚠️ Modelo de IA no disponible. Verifica que tu API Key tenga permisos en Google AI Studio.";
  }

  if (
    errorMessage.includes('429') ||
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorMessage.includes('Quota')
  ) {
    return "⚠️ Cuota de IA excedida. Intenta más tarde.";
  }

  if (errorMessage.includes('503') || errorMessage.includes('Overloaded')) {
    return "⚠️ Servicio de IA saturado. Intenta de nuevo.";
  }

  if (errorMessage.includes('fetch failed')) {
    return "⚠️ Error de conexión. Revisa tu internet.";
  }

  return `⚠️ Error: ${errorMessage.substring(0, 100)}...`;
};

/**
 * Generates suggested responses for a support agent based on the conversation history.
 */
export const getSuggestedReply = async (customerName: string, lastMessages: Message[]): Promise<string[]> => {
  if (!getGenAI()) return ["⚠️ Configura tu API Key en Configuración > IA."];

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

    // Use fallback helper
    const text = await generateWithFallback(prompt);

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
  if (!getGenAI()) return "⚠️ Configura tu API Key en Configuración > IA.";

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

    // Use fallback helper
    const text = await generateWithFallback(prompt);
    return text.trim() || "No pude generar el borrador.";
  } catch (error) {
    return handleApiError(error, "Gemini Draft");
  }
};

/**
 * Summarizes a conversation for administrative review.
 */
export const summarizeConversation = async (messages: Message[]): Promise<string> => {
  if (!getGenAI()) return "⚠️ Configura tu API Key en Configuración > IA.";

  try {
    const textContent = messages
      .slice(-5)
      .map(m => `${m.senderId === 'customer' ? 'C' : 'A'}: ${m.text}`)
      .join('\n');

    // Use fallback helper
    const text = await generateWithFallback(`Resume en 3 puntos breves (Problema, Acción, Estado):\n${textContent}`);
    return text || "No se pudo generar el resumen.";
  } catch (error) {
    return handleApiError(error, "Gemini Summary");
  }
};

/**
 * Simple test to verify if the API Key and Model are working.
 */
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  const genAI = getGenAI();
  if (!genAI) return { success: false, message: "API Key no configurada." };

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent("Hello check");
    const response = await result.response;
    const text = response.text();
    return { success: true, message: "¡Conexión exitosa! Gemini está respondiendo." };
  } catch (error: any) {
    console.error("Test Connection Error:", error);
    return {
      success: false,
      message: handleApiError(error, "Test Connection")
    };
  }
};

export async function analyzeNetworkIssue(device: any, allDevices: any[]) {
  const genAI = getGenAI();
  if (!genAI) return "⚠️ API Key no configurada.";

  const modelName = 'gemini-2.0-flash'; // Using a stable model available in the project context or consistent with others

  const isInfra = device.type !== 'CPE_TPLINK' && device.type !== 'PASSIVE_ODF'; // Adapted types, checking string literals or importing enum if possible. But better to keep it generic or import types.
  // Actually, I should import types or just use loose typing 'any' to avoid circular dependency if types are in another file. 
  // But wait, services/geminiService.ts imports `Message` from `../types`.
  // I should update `../types` (root types.ts) to include `NetworkDevice` etc if I want strictly typed.
  // For now, let's cast or use any to be safe and quick, matching the logic.

  const isFault = device.status === 'FAULT' || device.status === 'OFFLINE';

  const systemInstruction = `Eres un Arquitecto de Redes Senior ISP experto en MikroTik y topologías FTTH.
  Tu prioridad absoluta es diferenciar fallos de sector (infraestructura) de incidencias locales (CPE cliente).
  
  Lógica de Análisis:
  1. Si falla un CORE, SWITCH o OLT, es un CORTE DE SECTOR. Debes advertir sobre el impacto masivo de usuarios offline.
  2. Si falla un CPE TP-LINK, es una AVERÍA LOCAL. Analiza la señal (si es posible) o el estado administrativo.
  3. Proporciona comandos específicos de RouterOS (/interface, /ip, /system) para diagnóstico rápido.
  
  Responde siempre en español técnico, directo y orientado a la resolución rápida del NOC.`;

  const context = `Dispositivo: ${device.name} (${device.type})
  Modelo: ${device.model} | IP: ${device.ip}
  Estado actual: ${device.status}
  Impacto detectado: ${isInfra && isFault ? "ALTO - CORTE DE SECTOR MASIVO" : "NORMAL - INCIDENCIA INDIVIDUAL"}`;

  const prompt = `${context}
  
  Analiza este escenario y proporciona:
  1. Diagnóstico de Capa Física/Lógica.
  2. Comandos MikroTik sugeridos para validar conectividad.
  3. Plan de acción inmediato para el técnico en campo.`;

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return handleApiError(error, "Monitoring Analysis");
  }
}
