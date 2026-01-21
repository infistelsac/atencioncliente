
import React, { useState, useEffect, useMemo } from 'react';
import { NetworkDevice, ConnectionStatus, DeviceType, PortStatus, NetworkPort } from '../../types/monitoring';
import { analyzeNetworkIssue } from '../../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import DeviceEditor from './DeviceEditor';
import DeviceTerminal from './DeviceTerminal';

interface DeviceDetailsProps {
  device: NetworkDevice;
  allDevices: NetworkDevice[];
  existingSites: { id: string; name: string }[];
  onUpdateDevice: (device: NetworkDevice) => void;
  onDelete?: (deviceId: string) => void;
  onClose: () => void;
}

type TimeRange = 'LIVE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';
type GraphView = 'TRAFFIC' | 'LATENCY';

interface HistoryPoint {
  time: string;
  fullDate: string;
  in: number;
  out: number;
  latency: number;
}

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0ZM85.66,101.66,120,136V40a8,8,0,0,1,16,0v96l34.34-34.34a8,8,0,0,1,11.32,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32Z"></path></svg>
);

const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0ZM133.66,34.34a8,8,0,0,0-11.32,0l-48,48a8,8,0,0,0,11.32,11.32L120,59.31V152a8,8,0,0,0,16,0V59.31l34.34,34.35a8,8,0,0,0,11.32-11.32Z"></path></svg>
);

const formatTraffic = (kbps: number) => {
  if (kbps < 1000) return `${Math.round(kbps)} Kbps`;
  return `${((kbps || 0) / 1000).toFixed(2)} Mbps`;
};

const formatConsumption = (mb: number) => {
  if (mb < 1000) return `${mb.toFixed(1)} MB`;
  if (mb < 1000000) return `${(mb / 1000).toFixed(2)} GB`;
  return `${(mb / 1000000).toFixed(2)} TB`;
};

const formatTimeElapsed = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
};

const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, allDevices, existingSites, onUpdateDevice, onDelete, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showWinbox, setShowWinbox] = useState(false);
  const [showWinboxConfig, setShowWinboxConfig] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('LIVE');
  const [graphView, setGraphView] = useState<GraphView>('TRAFFIC');

  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const isTechnicalDown = device.status === ConnectionStatus.FAULT || device.status === ConnectionStatus.OFFLINE;
  const isAdministrativeDown = device.status === ConnectionStatus.NON_PAYMENT || device.status === ConnectionStatus.SUSPENDED;
  const isCancelled = device.status === ConnectionStatus.CANCELLED;
  const isClient = device.type === DeviceType.TPLINK;
  const isSplitter = device.type === DeviceType.SPLITTER;
  const isMikrotik = !isClient && !isSplitter && (device.firmware && device.firmware.includes('RouterOS'));

  const currentStats = useMemo(() => {
    if (history.length === 0) return { in: 0, out: 0, avgLat: 0 };
    let multiplier = 1;
    if (timeRange === 'YEAR') multiplier = 365 * 24;
    else if (timeRange === 'MONTH') multiplier = 30 * 24;
    else if (timeRange === 'WEEK') multiplier = 7 * 24;
    else if (timeRange === 'DAY') multiplier = 24;
    else if (timeRange === 'CUSTOM') {
      const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
      multiplier = Math.max(1, diff / 3600000);
    }
    const avgLat = history.reduce((acc, curr) => acc + (curr.latency || 0), 0) / history.length;
    return {
      in: (device.trafficIn / 1000) * multiplier * 0.45,
      out: (device.trafficOut / 1000) * multiplier * 0.15,
      avgLat
    };
  }, [history, device.trafficIn, device.trafficOut, timeRange, startDate, endDate]);

  useEffect(() => {
    const points: HistoryPoint[] = [];
    const now = new Date();
    const isActive = !isTechnicalDown && !isAdministrativeDown && !isCancelled;

    let pointsToGenerate = 40;
    let intervalMs = 3000;
    let formatOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

    if (timeRange === 'CUSTOM') {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000;
      const diff = end - start;
      pointsToGenerate = diff > 86400000 * 30 ? 60 : 40;
      intervalMs = diff / pointsToGenerate;
      if (diff > 86400000 * 180) formatOptions = { year: 'numeric', month: 'short' };
      else if (diff > 86400000 * 2) formatOptions = { month: 'short', day: 'numeric' };
      else formatOptions = { hour: '2-digit', minute: '2-digit' };
      for (let i = 0; i < pointsToGenerate; i++) {
        const timestamp = new Date(start + i * intervalMs);
        points.push({
          time: timestamp.toLocaleDateString('es-ES', formatOptions),
          fullDate: timestamp.toLocaleString(),
          in: Math.max(0, (device.trafficIn + (Math.random() * 2 - 1) * device.trafficIn * 0.3) / 1000),
          out: Math.max(0, (device.trafficOut + (Math.random() * 2 - 1) * device.trafficOut * 0.3) / 1000),
          latency: Math.max(1, (isActive ? device.latency : 0) + (Math.random() * 15 - 7))
        });
      }
    } else {
      switch (timeRange) {
        case 'DAY': pointsToGenerate = 24; intervalMs = 3600000; break;
        case 'WEEK': pointsToGenerate = 14; intervalMs = 43200000; formatOptions = { weekday: 'short', day: 'numeric' }; break;
        case 'MONTH': pointsToGenerate = 30; intervalMs = 86400000; formatOptions = { day: 'numeric' }; break;
        case 'YEAR': pointsToGenerate = 12; intervalMs = 2592000000; formatOptions = { month: 'short', year: '2-digit' }; break;
        default: pointsToGenerate = 40; intervalMs = 2000; formatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
      }
      for (let i = pointsToGenerate; i >= 1; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMs);
        const varFactor = timeRange === 'LIVE' ? 0.2 : 0.5;
        points.push({
          time: timeRange === 'YEAR' ? timestamp.toLocaleDateString('es-ES', formatOptions) : timestamp.toLocaleTimeString('es-ES', formatOptions),
          fullDate: timestamp.toLocaleString(),
          in: Math.max(0, (device.trafficIn + (Math.random() * 2 - 1) * device.trafficIn * varFactor) / 1000),
          out: Math.max(0, (device.trafficOut + (Math.random() * 2 - 1) * device.trafficOut * varFactor) / 1000),
          latency: Math.max(1, (isActive ? device.latency : 0) + (Math.random() * 8 - 4))
        });
      }
    }
    setHistory(points);
  }, [device.id, device.status, timeRange, device.trafficIn, device.trafficOut, device.latency, startDate, endDate]);

  const handleAIAnalysis = async () => {
    setLoading(true);
    const result = await analyzeNetworkIssue(device, allDevices);
    setAnalysis(result);
    setLoading(false);
  };

  // Genera datos simulados específicos para el reporte mensual
  const generateReportData = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data: HistoryPoint[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      data.push({
        time: i.toString(),
        fullDate: date.toLocaleDateString(),
        in: Math.max(1, (device.trafficIn + (Math.random() * 0.6 - 0.3) * device.trafficIn) / 1000),
        out: Math.max(0.5, (device.trafficOut + (Math.random() * 0.6 - 0.3) * device.trafficOut) / 1000),
        latency: Math.max(1, device.latency + (Math.random() * 10 - 5))
      });
    }
    return data;
  };

  const generateReportSVG = (reportHistory: HistoryPoint[], startD: string, endD: string) => {
    const width = 800;
    const height = 300;
    const paddingLeft = 70;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 60;

    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = height - paddingTop - paddingBottom;

    const maxValMbps = Math.max(...reportHistory.map(p => Math.max(p.in, p.out)), device.contractedIn || 10, 5) * 1.2;
    const stepX = usableWidth / (reportHistory.length - 1);

    const getX = (i: number) => paddingLeft + i * stepX;
    const getY = (val: number) => height - paddingBottom - (val / maxValMbps) * usableHeight;

    const pointsIn = reportHistory.map((p, i) => `${getX(i)},${getY(p.in)}`).join(' ');
    const pointsOut = reportHistory.map((p, i) => `${getX(i)},${getY(p.out)}`).join(' ');

    // Escala Vertical
    const marks = 5;
    const ruleLines = [];
    for (let i = 0; i <= marks; i++) {
      const val = (maxValMbps / marks) * i;
      const y = getY(val);
      ruleLines.push(`
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#f1f5f9" stroke-width="1" ${i === 0 ? '' : 'stroke-dasharray="4"'} />
        <text x="${paddingLeft - 15}" y="${y + 4}" font-size="10" font-family="Inter, sans-serif" font-weight="900" fill="#64748b" text-anchor="end">${val.toFixed(1)}M</text>
      `);
    }

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff" />
        
        <!-- Escala Vertical y Grid -->
        ${ruleLines.join('')}
        
        <!-- Ejes -->
        <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${paddingLeft}" y2="${paddingTop - 10}" stroke="#94a3b8" stroke-width="2" />
        <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight + 10}" y2="${height - paddingBottom}" stroke="#94a3b8" stroke-width="2" />
        
        <!-- Area In (Download) -->
        <polyline points="${paddingLeft},${height - paddingBottom} ${pointsIn} ${width - paddingRight},${height - paddingBottom}" fill="rgba(16, 185, 129, 0.12)" />
        <polyline points="${pointsIn}" fill="none" stroke="#10b981" stroke-width="3" stroke-linejoin="round" />
        
        <!-- Area Out (Upload) -->
        <polyline points="${paddingLeft},${height - paddingBottom} ${pointsOut} ${width - paddingRight},${height - paddingBottom}" fill="rgba(99, 102, 241, 0.12)" />
        <polyline points="${pointsOut}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linejoin="round" />

        <!-- Etiquetas X -->
        <text x="${paddingLeft}" y="${height - 20}" font-size="11" font-family="JetBrains Mono, monospace" font-weight="900" fill="#0f172a">INICIO CICLO: ${startD}</text>
        <text x="${width - paddingRight}" y="${height - 20}" font-size="11" font-family="JetBrains Mono, monospace" font-weight="900" fill="#0f172a" text-anchor="end">CIERRE CICLO: ${endD}</text>
        
        <!-- Título eje vertical -->
        <text transform="rotate(-90, 20, ${height / 2})" x="20" y="${height / 2}" font-size="10" font-family="Inter" font-weight="900" fill="#94a3b8" text-anchor="middle" letter-spacing="0.1em">MEGAS DE TRÁFICO (Mbps)</text>
      </svg>
    `;
  };

  const handleOpenReportWindow = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = `${selectedMonth}-01`;
    const lastDateObj = new Date(year, month, 0);
    const lastDay = `${selectedMonth}-${lastDateObj.getDate()}`;

    const reportHistory = generateReportData(year, month);
    const svgString = generateReportSVG(reportHistory, firstDay, lastDay);

    // Estadísticas calculadas para el reporte mensual
    const avgLatReport = reportHistory.reduce((acc, curr) => acc + curr.latency, 0) / reportHistory.length;
    const totalHoursInMonth = reportHistory.length * 24;
    const reportIn = (device.trafficIn / 1000) * totalHoursInMonth * 0.45;
    const reportOut = (device.trafficOut / 1000) * totalHoursInMonth * 0.15;

    const reportWindow = window.open('', '_blank', 'width=1100,height=950');
    if (!reportWindow) {
      alert("Por favor, permite las ventanas emergentes para ver el reporte.");
      return;
    }

    const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Auditoría Mensual NOC - ${device.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap');
          @media print { .no-print { display: none; } body { background: white; padding: 0; margin: 0; } .print-area { box-shadow: none; border: none; } }
          body { font-family: 'Inter', sans-serif; background: #f1f5f9; color: #0f172a; padding: 40px; }
          .stat-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; background: white; }
          .label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
          .value { font-size: 24px; font-weight: 900; color: #0f172a; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
          .chart-container { border: 2px solid #f8fafc; padding: 30px; border-radius: 32px; background: white; margin-top: 20px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        </style>
      </head>
      <body>
        <div class="no-print bg-slate-900 text-white p-6 mb-10 flex justify-between items-center rounded-3xl shadow-2xl border border-white/5">
          <div class="flex items-center gap-5">
            <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg">NV</div>
            <div>
               <p class="font-black uppercase text-sm tracking-[0.2em] leading-none">NetVision Pro NOC</p>
               <p class="text-[10px] text-slate-400 font-mono mt-1 uppercase">Sistema de Auditoría de Red Certificada</p>
            </div>
          </div>
          <button onclick="window.print()" class="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-500 transition-all border border-indigo-400/20">Imprimir Reporte Certificado</button>
        </div>

        <div class="print-area bg-white p-16 rounded-[48px] shadow-2xl border border-slate-100 max-w-[1000px] mx-auto">
          <div class="flex justify-between items-start border-b-[8px] border-slate-900 pb-10 mb-12">
            <div>
              <h1 class="text-5xl font-black uppercase tracking-tighter text-slate-900">Auditoría Mensual</h1>
              <p class="text-lg text-slate-500 font-mono mt-3 uppercase tracking-wider">Certificado de Telemetría e Indicadores de Servicio</p>
            </div>
            <div class="text-right">
              <p class="text-[11px] font-black uppercase text-slate-400 tracking-widest">Periodo del Ciclo</p>
              <p class="text-3xl font-black uppercase text-indigo-600 mt-2">${monthName}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-16 mb-16">
            <div class="space-y-8">
              <h2 class="text-base font-black uppercase text-indigo-600 tracking-[0.2em] border-l-4 border-indigo-600 pl-4">Identificación Técnica</h2>
              <div class="grid grid-cols-1 gap-5 text-sm">
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">DISPOSITIVO</span> <span class="font-black text-slate-900 uppercase">${device.name}</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">MODELO HARDWARE</span> <span class="font-bold text-slate-900 uppercase">${device.model}</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">DIRECCIÓN IP</span> <span class="font-mono font-bold text-slate-900">${device.ip}</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">MAC ADDRESS</span> <span class="font-mono font-bold text-slate-900">${device.mac}</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">NODO / SITIO</span> <span class="font-black text-slate-900 uppercase">${device.siteName}</span></div>
              </div>
            </div>
            <div class="space-y-8">
              <h2 class="text-base font-black uppercase text-indigo-600 tracking-[0.2em] border-l-4 border-indigo-600 pl-4">Parámetros SLA</h2>
              <div class="grid grid-cols-1 gap-5 text-sm">
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">VELOCIDAD DOWN</span> <span class="font-black text-emerald-600">${device.contractedIn || 0} Mbps</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">VELOCIDAD UP</span> <span class="font-black text-indigo-600">${device.contractedOut || 0} Mbps</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">RANGO AUDITORÍA</span> <span class="font-black text-slate-900 uppercase">${firstDay} - ${lastDay}</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">ESTADO GLOBAL</span> <span class="font-black text-indigo-500 uppercase">OPERATIVO / ESTABLE</span></div>
                <div class="flex justify-between border-b border-slate-100 pb-3"><span class="font-bold text-slate-400">FECHA GENERACIÓN</span> <span class="font-black text-slate-400 uppercase">${new Date().toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div class="mb-16">
            <h2 class="text-base font-black uppercase text-indigo-600 mb-8 tracking-[0.2em] border-l-4 border-indigo-600 pl-4">Resumen de Consumo y Calidad</h2>
            <div class="grid grid-cols-3 gap-8">
              <div class="stat-box shadow-md">
                <p class="label">Tráfico Bajada (DL)</p>
                <p class="value text-emerald-600">${formatConsumption(reportIn)}</p>
                <div class="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div class="bg-emerald-500 h-full w-[70%]"></div></div>
              </div>
              <div class="stat-box shadow-md">
                <p class="label">Tráfico Subida (UL)</p>
                <p class="value text-indigo-600">${formatConsumption(reportOut)}</p>
                <div class="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div class="bg-indigo-500 h-full w-[30%]"></div></div>
              </div>
              <div class="stat-box shadow-md">
                <p class="label">Latencia ICMP Avg</p>
                <p class="value text-amber-500">${avgLatReport.toFixed(2)} ms</p>
                <div class="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[45%]"></div></div>
              </div>
            </div>
          </div>

          <div class="mb-20">
            <h2 class="text-base font-black uppercase text-indigo-600 mb-8 tracking-[0.2em] border-l-4 border-indigo-600 pl-4">Histograma de Telemetría (Flujo Mbps)</h2>
            <div class="chart-container">
              ${svgString}
              <div class="flex gap-16 mt-10 justify-center border-t border-slate-100 pt-8">
                <div class="flex items-center gap-4">
                   <div class="w-5 h-5 bg-emerald-500 rounded-md shadow-lg shadow-emerald-500/20"></div>
                   <span class="text-xs font-black uppercase text-slate-600 tracking-widest">Tráfico Bajada</span>
                </div>
                <div class="flex items-center gap-4">
                   <div class="w-5 h-5 bg-indigo-500 rounded-md shadow-lg shadow-indigo-500/20"></div>
                   <span class="text-xs font-black uppercase text-slate-600 tracking-widest">Tráfico Subida</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-32 grid grid-cols-2 gap-40">
            <div class="text-center">
              <div class="border-t-4 border-slate-900 pt-8">
                <p class="text-sm font-black uppercase text-slate-900 tracking-widest">Ingeniería NOC / Auditoría</p>
                <p class="text-[10px] text-slate-400 font-mono mt-2 uppercase">Certificación de Infraestructura</p>
              </div>
            </div>
            <div class="text-center">
              <div class="border-t-4 border-slate-900 pt-8">
                <p class="text-sm font-black uppercase text-slate-900 tracking-widest">Sello ISP / Legal NOC</p>
                <p class="text-[10px] text-slate-400 font-mono mt-2 uppercase">Validación de Telemetría</p>
              </div>
            </div>
          </div>

          <div class="mt-32 text-center border-t border-slate-50 pt-10">
             <p class="text-[10px] text-slate-300 font-mono uppercase tracking-[0.6em]">NetVision Pro ISP Monitoring • Doc ID: CERT-${device.id.slice(0, 6)}-${selectedMonth} • Ver. 4.2.0</p>
          </div>
        </div>
      </body>
      </html>
    `;
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    setShowPrintModal(false);
  };

  const getStatusBadge = () => {
    switch (device.status) {
      case ConnectionStatus.FAULT: return 'bg-rose-500/10 text-rose-500 border-rose-500/40 animate-pulse';
      case ConnectionStatus.NON_PAYMENT: return 'bg-orange-500/10 text-orange-500 border-orange-500/40';
      case ConnectionStatus.SUSPENDED: return 'bg-purple-500/10 text-purple-500 border-purple-500/40';
      case ConnectionStatus.CANCELLED: return 'bg-slate-800 text-slate-500 border-slate-700';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40';
    }
  };

  const DevicePorts: React.FC<{ ports: NetworkPort[] }> = ({ ports }) => {
    if (isSplitter) {
      // Asumimos que el primer puerto es Input, el resto Output
      const inputPort = ports.length > 0 ? ports[0] : null;
      const outputPorts = ports.length > 1 ? ports.slice(1) : [];

      const renderPort = (port: NetworkPort, label: string) => (
        <div
          key={port.id}
          className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 group relative cursor-help transition-all duration-300 ${port.status === PortStatus.CONNECTED
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/20'
            : port.status === PortStatus.FAULT
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-500 translate-y-0 hover:-translate-y-1'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M208,64V192a24,24,0,0,1-24,24H72a24,24,0,0,1-24-24V64A24,24,0,0,1,72,40H184A24,24,0,0,1,208,64Zm-16,0a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8V192a8,8,0,0,0,8,8H184a8,8,0,0,0,8-8ZM160,80v32a8,8,0,0,1-8,8H104a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8h48A8,8,0,0,1,160,80Z"></path></svg>
          <span className="text-[8px] font-black uppercase text-center leading-tight">{port.name || label}</span>

          {/* Tooltip simple */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none min-w-[120px]">
            <p className="text-[9px] font-black text-white uppercase border-b border-slate-800 pb-1 mb-1">{label}: {port.name}</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase">Estado: <span className={port.status === PortStatus.CONNECTED ? 'text-emerald-500' : 'text-slate-500'}>{port.status}</span></p>
            {port.connectedToDeviceId && (
              <>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Conectado a:</p>
                <p className="text-[9px] text-indigo-400 font-black">{allDevices.find(d => d.id === port.connectedToDeviceId)?.name || port.connectedToDeviceId}</p>
              </>
            )}
          </div>
        </div>
      );

      return (
        <div className="space-y-8">
          {/* UPSTREAM / INPUT SECTION */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"></path></svg>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] block mb-6 relative z-10">Puerto de Entrada (Upstream)</span>
            <div className="flex gap-4 relative z-10">
              {inputPort ? (
                <div className="w-24">
                  {renderPort(inputPort, "INPUT")}
                </div>
              ) : (
                <div className="text-slate-500 text-xs font-mono p-4 border border-dashed border-slate-700 rounded-xl">Sin Input</div>
              )}
              <div className="flex-1 flex flex-col justify-center gap-1 ml-4 border-l border-slate-800 pl-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Información de Fibra</span>
                <span className="text-xs text-slate-300 font-mono">Splitter Pasivo 1:{outputPorts.length || 'N'}</span>
              </div>
            </div>
          </div>

          {/* DOWNSTREAM / OUTPUT SECTION */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-6 shadow-xl">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] block mb-6">Puertos de Salida (Downstream)</span>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {outputPorts.map((port, idx) => renderPort(port, `OUT ${idx + 1}`))}
              {outputPorts.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-600 text-[10px] uppercase font-bold border-2 border-dashed border-slate-800 rounded-xl">
                  No hay puertos de salida configurados
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-6 shadow-xl">
        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] block mb-6">Estado de Puertos (ETH)</span>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {ports.map((port) => (
            <div
              key={port.id}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 group relative cursor-help transition-all duration-300 ${port.status === PortStatus.CONNECTED
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/20'
                : port.status === PortStatus.FAULT
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-500 translate-y-0 hover:-translate-y-1'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M208,64V192a24,24,0,0,1-24,24H72a24,24,0,0,1-24-24V64A24,24,0,0,1,72,40H184A24,24,0,0,1,208,64Zm-16,0a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8V192a8,8,0,0,0,8,8H184a8,8,0,0,0,8-8ZM160,80v32a8,8,0,0,1-8,8H104a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8h48A8,8,0,0,1,160,80Z"></path></svg>
              <span className="text-[8px] font-black uppercase">{port.name}</span>

              {/* Tooltip simple */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none min-w-[120px]">
                <p className="text-[9px] font-black text-white uppercase border-b border-slate-800 pb-1 mb-1">{port.name}</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase">Estado: <span className={port.status === PortStatus.CONNECTED ? 'text-emerald-500' : 'text-slate-500'}>{port.status}</span></p>
                {port.connectedToDeviceId && (
                  <>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Conectado a:</p>
                    <p className="text-[9px] text-indigo-400 font-black">{allDevices.find(d => d.id === port.connectedToDeviceId)?.name || port.connectedToDeviceId}</p>
                  </>
                )}
                {port.speed && <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Velocidad: <span className="text-white">{port.speed}</span></p>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase">Conectado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase">Libre</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full h-full bg-[#030712] border border-slate-800/60 rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative print:hidden`}>

      {showPrintModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#818cf8" viewBox="0 0 256 256"><path d="M224,96h-8V48a16,16,0,0,0-16-16H56A16,16,0,0,0,40,48V96H32a16,16,0,0,0-16,16v64a16,16,0,0,0,16,16h8v16a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V192h8a16,16,0,0,0,16-16V112A16,16,0,0,0,224,96ZM56,48H200V96H56Zm144,160H56V144H200v64Zm24-32h-8V144a16,16,0,0,0-16-16H56a16,16,0,0,0-16,16v32H32V112H224v64Z"></path></svg>
                </div>
                <h3 className="text-white font-black text-lg tracking-tight uppercase">Generar Auditoría</h3>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-500 hover:text-white transition-colors p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.1em] leading-relaxed">
                  El sistema generará un reporte PDF oficial basado en el ciclo mensual seleccionado, incluyendo histogramas de tráfico y parámetros SLA.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Ciclo de Auditoría (Mensual)</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="p-8 bg-slate-950/40 border-t border-slate-800 flex gap-4">
              <button onClick={() => setShowPrintModal(false)} className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all">Descartar</button>
              <button onClick={handleOpenReportWindow} className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 border border-indigo-400/20">Generar Reporte</button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* TOP BAR */}
      <div className="h-20 shrink-0 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-8 relative z-10">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="group flex items-center gap-3 bg-slate-800 hover:bg-indigo-600 px-4 py-2 rounded-2xl transition-all duration-300 text-slate-300 hover:text-white border border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" className="group-hover:-translate-x-1 transition-transform"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path></svg>
            <span className="text-[11px] font-black uppercase tracking-widest">Panel</span>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">{device.name}</h2>
              <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-widest border ${getStatusBadge()}`}>
                {device.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono tracking-wider mt-0.5">{device.ip} • {device.mac}</p>
            {(device.latitude !== undefined && device.longitude !== undefined) && (
              <p className="text-[10px] text-indigo-400 font-mono tracking-wider mt-0.5 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.52,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206.56C109.76,206.08,56,155.65,56,104a72,72,0,0,1,144,0C200,155.65,146.24,206.08,128,222.56Z"></path></svg>
                {device.latitude?.toFixed(6)}, {device.longitude?.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isMikrotik && (
            <button onClick={() => setShowWinbox(true)} className="flex items-center gap-2 bg-[#2d3436] hover:bg-[#636e72] px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase text-white border border-slate-600 transition-all shadow-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Winbox
            </button>
          )}
          <button onClick={() => setShowTerminal(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase text-emerald-500 border border-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V200H40V56ZM120,128a8,8,0,0,1-8,8H88v24a8,8,0,0,1-16,0V120a8,8,0,0,1,8-8h32A8,8,0,0,1,120,128Zm64,0a8,8,0,0,1-8,8H152v24a8,8,0,0,1-16,0V120a8,8,0,0,1,8-8h32A8,8,0,0,1,184,128Z"></path></svg>
            Terminal IO
          </button>
          <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase text-slate-300 border border-slate-700 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,96h-8V48a16,16,0,0,0-16-16H56A16,16,0,0,0,40,48V96H32a16,16,0,0,0-16,16v64a16,16,0,0,0,16,16h8v16a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V192h8a16,16,0,0,0,16-16V112A16,16,0,0,0,224,96ZM56,48H200V96H56Zm144,160H56V144H200v64Zm24-32h-8V144a16,16,0,0,0-16-16H56a16,16,0,0,0-16,16v32H32V112H224v64Z"></path></svg>
            Reporte PDF
          </button>
          <button onClick={() => setShowEditor(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase text-white shadow-xl shadow-indigo-600/20 border border-indigo-400/20">
            Ajustes
          </button>

          {onDelete && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-500 border border-rose-900/30 px-3 py-2.5 rounded-2xl transition-all shadow-lg hover:shadow-rose-900/20" title="Eliminar Dispositivo">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
        <div className="grid grid-cols-12 gap-8 max-w-[1400px] mx-auto">
          {isSplitter ? (
            /* Layout exclusivo para Splitters */
            <div className="col-span-12 space-y-6">
              {/* Info Card for Splitters */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-6 shadow-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Configuración de Splitter</span>
                  <div className="flex gap-8 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Nivel Técnico</span>
                      <span className="text-sm font-black text-white uppercase">Nivel {device.splitterLevel || 1}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Ratio de División</span>
                      <span className="text-sm font-black text-white font-mono">{device.splitterRatio || '1:8'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowEditor(true)} className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
                  Editar Configuración
                </button>
              </div>

              {/* Mostrar solo puertos en ancho completo */}
              {device.ports && device.ports.length > 0 ? (
                <DevicePorts ports={device.ports} />
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-8 text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No hay puertos configurados en este Splitter</p>
                  <button onClick={() => setShowEditor(true)} className="mt-4 text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase underline">Configurar Puertos</button>
                </div>
              )}
            </div>
          ) : (
            /* Layout Estándar para otros dispositivos */
            <>
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {timeRange === 'LIVE' && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.2em]">Monitoreo en Tiempo Real</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-5 rounded-[24px] border flex flex-col gap-3 transition-all ${graphView === 'TRAFFIC' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-emerald-500">
                      <span className="text-[9px] font-black uppercase tracking-widest">Descarga (DL)</span>
                      <IconDownload />
                    </div>
                    <span className="text-2xl font-black text-white font-mono">{formatTraffic(device.trafficIn)}</span>
                  </div>
                  <div className={`p-5 rounded-[24px] border flex flex-col gap-3 transition-all ${graphView === 'TRAFFIC' ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-indigo-400">
                      <span className="text-[9px] font-black uppercase tracking-widest">Carga (UL)</span>
                      <IconUpload />
                    </div>
                    <span className="text-2xl font-black text-white font-mono">{formatTraffic(device.trafficOut)}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-xl">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block mb-6">Resumen del Periodo Vista</span>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-500/80"><IconDownload /><p className="text-[9px] font-black uppercase">Bajada</p></div>
                      <p className="text-2xl font-black text-white font-mono">{formatConsumption(currentStats.in)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-indigo-400"><p className="text-[9px] font-black uppercase">Subida</p><IconUpload /></div>
                      <p className="text-2xl font-black text-white font-mono">{formatConsumption(currentStats.out)}</p>
                    </div>
                  </div>
                </div>

                {isClient && (
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[24px] p-6 shadow-xl">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] block mb-4">Velocidad de Plan</span>
                    <div className="flex justify-between items-center text-white font-mono font-black">
                      <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase">Nominal Down</span><span className="text-xl">{device.contractedIn || 0} Mbps</span></div>
                      <div className="w-px h-8 bg-slate-800"></div>
                      <div className="flex flex-col text-right"><span className="text-[8px] text-slate-500 uppercase">Nominal Up</span><span className="text-xl">{device.contractedOut || 0} Mbps</span></div>
                    </div>
                  </div>
                )}

                {device.ports && device.ports.length > 0 && (
                  <div className="col-span-12">
                    <DevicePorts ports={device.ports} />
                  </div>
                )}
              </div>

              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Configurar Intervalo Temporal</span>
                      <div className="flex gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                        {['LIVE', 'DAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'].map((range) => (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range as TimeRange)}
                            className={`px-4 py-1.5 text-[9px] font-black rounded-xl transition-all ${timeRange === range ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-300'}`}
                          >
                            {range === 'LIVE' ? 'VIVO' : range === 'DAY' ? '24H' : range === 'WEEK' ? '7D' : range === 'MONTH' ? '30D' : range === 'YEAR' ? '365D' : 'PERS.'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(timeRange === 'CUSTOM' || timeRange === 'YEAR') && (
                      <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Inicio</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none" /></div>
                        <div className="flex-1 space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Fin</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none" /></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden chart-container">
                  <div className="flex justify-between items-center mb-10 relative z-10">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${graphView === 'TRAFFIC' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        {graphView === 'TRAFFIC' ? 'Telemetría de Tráfico' : 'Análisis de Respuesta'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setGraphView('TRAFFIC')} className={`px-4 py-2 text-[9px] font-black rounded-xl border transition-all ${graphView === 'TRAFFIC' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>DATOS</button>
                      <button onClick={() => setGraphView('LATENCY')} className={`px-4 py-2 text-[9px] font-black rounded-xl border transition-all ${graphView === 'LATENCY' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>ICMP</button>
                    </div>
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                          <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                        <XAxis dataKey="time" axisLine={{ stroke: '#334155' }} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} dy={10} minTickGap={40} />
                        <YAxis axisLine={{ stroke: '#334155' }} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} dx={-10} tickFormatter={(val) => graphView === 'TRAFFIC' ? `${val}M` : `${val}ms`} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }} />
                        {graphView === 'TRAFFIC' ? (
                          <>
                            <Area type="monotone" dataKey="in" name="Download" stroke="#10b981" strokeWidth={3} fill="url(#colorIn)" isAnimationActive={false} />
                            <Area type="monotone" dataKey="out" name="Upload" stroke="#6366f1" strokeWidth={3} fill="url(#colorOut)" isAnimationActive={false} />
                          </>
                        ) : (
                          <Area type="monotone" dataKey="latency" name="Latencia" stroke="#f59e0b" strokeWidth={3} fill="url(#colorLat)" isAnimationActive={false} />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0f111a] border border-indigo-500/20 rounded-[32px] p-8 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#818cf8" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-88a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z"></path></svg>
                      </div>
                      <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">IA Predictive Diagnostics</h3>
                    </div>
                    <button onClick={handleAIAnalysis} disabled={loading} className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[10px] font-black text-white uppercase tracking-widest rounded-2xl transition-all shadow-xl`}>
                      {loading ? 'Consultando...' : 'Analizar Estado'}
                    </button>
                  </div>
                  {analysis && <div className="text-[13px] text-slate-300 leading-relaxed font-mono bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 whitespace-pre-wrap">{analysis}</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showEditor && (
        <DeviceEditor
          device={device}
          allDevices={allDevices}
          existingSites={existingSites}
          onSave={(updated) => { onUpdateDevice(updated); setShowEditor(false); }}
          onClose={() => setShowEditor(false)}
        />
      )}

      {showTerminal && (
        <DeviceTerminal
          device={device}
          onClose={() => setShowTerminal(false)}
        />
      )}
      {showWinbox && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-white font-bold text-lg">Acceso Winbox / WebFig</h3>
              <button onClick={() => { setShowWinbox(false); setShowWinboxConfig(false); }} className="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
              </button>
            </div>

            {!showWinboxConfig ? (
              <div className="p-6 space-y-6">
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                  <p className="text-xs text-blue-200 mb-2 font-bold uppercase tracking-wider">Detalles de Conexión</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold">IP Address</span>
                      <span className="text-white text-xs font-mono bg-slate-950 px-2 py-1 rounded select-all">{device.ip}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold">Usuario</span>
                      <span className="text-white text-xs font-mono bg-slate-950 px-2 py-1 rounded select-all">{device.credentials?.username || 'admin'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold">Password</span>
                      <span className="text-white text-xs font-mono bg-slate-950 px-2 py-1 rounded select-all">{device.credentials?.password || '••••••'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={`winbox://${device.credentials?.username || 'admin'}:${device.credentials?.password || ''}@${device.ip}`}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-xl transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-2 group-hover:bg-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M224,48H32a8,8,0,0,0-8,8V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V56A8,8,0,0,0,224,48ZM216,192a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V64H216ZM120,112H72a8,8,0,0,1,0-16h48a8,8,0,0,1,0,16Zm48,32H72a8,8,0,0,1,0-16h96a8,8,0,0,1,0,16Zm0-32h-8a8,8,0,0,1,0-16h8a8,8,0,0,1,0,16Z"></path></svg>
                    </div>
                    <span className="text-xs font-black uppercase text-white">Abrir Winbox</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-blue-200 mt-1">App Nativa</span>
                  </a>

                  <a
                    href={`http://${device.ip}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 rounded-xl transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-2 group-hover:bg-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M240,112a16,16,0,0,1-16,16H168V32h56A16,16,0,0,1,240,48Zm-88,16V32H96V128Zm0,16V240h56a16,16,0,0,0,16-16V144Zm-72,96V144H32v80a16,16,0,0,0,16,16ZM32,48V112H80V32H48A16,16,0,0,0,32,48Z"></path></svg>
                    </div>
                    <span className="text-xs font-black uppercase text-white">WebFig</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-purple-200 mt-1">Navegador</span>
                  </a>
                </div>

                <div className="border-t border-slate-800 pt-4 text-center">
                  <p className="text-[10px] text-slate-500 mb-2">¿Problemas al abrir Winbox?</p>
                  <button
                    onClick={() => setShowWinboxConfig(true)}
                    className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Configurar Protocolo Winbox://
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <p className="text-[10px] text-amber-200 mb-2 font-black uppercase tracking-wider">⚠ Configuración de Protocolo</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Para que los enlaces funcionen, Windows necesita saber cómo manejar el protocolo <code>winbox://</code>.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0">1</div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Descargar Winbox</p>
                      <p className="text-[11px] text-slate-400">
                        Descarga y mueve el ejecutable <code className="text-slate-300">winbox64.exe</code> a la carpeta <code className="text-emerald-400 bg-emerald-950/30 px-1 rounded">C:\Winbox\</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0">2</div>
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Registrar Protocolo</p>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Descarga y ejecuta este archivo de registro para asociar el protocolo.
                      </p>
                      <a
                        href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Windows Registry Editor Version 5.00\n\n[HKEY_CLASSES_ROOT\\winbox]\n@="URL:Winbox Protocol"\n"URL Protocol"=""\n\n[HKEY_CLASSES_ROOT\\winbox\\DefaultIcon]\n@="C:\\\\Winbox\\\\winbox64.exe,1"\n\n[HKEY_CLASSES_ROOT\\winbox\\shell]\n\n[HKEY_CLASSES_ROOT\\winbox\\shell\\open]\n\n[HKEY_CLASSES_ROOT\\winbox\\shell\\open\\command]\n@="\\"C:\\\\Winbox\\\\winbox64.exe\\" \\"%1\\""`)}`}
                        download="winbox-protocol.reg"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-white transition-all shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,144v64a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V144a8,8,0,0,1,16,0v64H200V144a8,8,0,0,1,16,0Zm-85.66,8.34a8,8,0,0,0,11.32,0l48-48a8,8,0,0,0-11.32-11.32L136,136.69V32a8,8,0,0,0-16,0V136.69L77.66,93.02a8,8,0,0,0-11.32,11.32Z"></path></svg>
                        Descargar winbox-protocol.reg
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowWinboxConfig(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-[10px] font-black uppercase text-slate-300 transition-all border border-slate-700"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-800 flex items-center gap-4 bg-rose-950/10">
                <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"></path></svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">¿Eliminar Dispositivo?</h3>
                  <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Estás a punto de eliminar el dispositivo <strong className="text-white">{device.name}</strong> ({device.ip}).
                  <br /><br />
                  Se perderá todo el historial de tráfico y configuraciones asociadas.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all">CANCELAR</button>
                  <button
                    onClick={() => {
                      if (onDelete) onDelete(device.id);
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-900/20"
                  >
                    SÍ, ELIMINAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default DeviceDetails;
