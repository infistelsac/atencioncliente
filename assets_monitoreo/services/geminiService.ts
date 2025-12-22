import { GoogleGenAI } from "@google/genai";
import { NetworkDevice, DeviceType, ConnectionStatus } from "../types";

export async function analyzeNetworkIssue(device: NetworkDevice, allDevices: NetworkDevice[]) {
  // Always use the latest API key by instantiating GoogleGenAI right before making a call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Networking analysis is a complex reasoning task, using gemini-3-pro-preview.
  const model = 'gemini-3-pro-preview';
  
  const isInfra = device.type !== DeviceType.TPLINK && device.type !== DeviceType.ODF;
  const isFault = device.status === ConnectionStatus.FAULT || device.status === ConnectionStatus.OFFLINE;

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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction }
    });
    // Use the .text property directly as per @google/genai guidelines.
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Error en motor de diagnóstico IA. Verifique conectividad con NetVision API.";
  }
}