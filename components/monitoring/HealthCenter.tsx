
import React, { useMemo, useState, useEffect } from 'react';
import { NetworkDevice, ConnectionStatus, DeviceType } from '../../types/monitoring';

interface HealthCenterProps {
  devices: NetworkDevice[];
  onSelectDevice: (device: NetworkDevice) => void;
  onAddNode: () => void;
  onAddDevice: () => void;
}

type SortOrder = 'desc' | 'asc' | 'none';

const formatTimeElapsed = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const HealthCenter: React.FC<HealthCenterProps> = ({ devices, onSelectDevice, onAddNode, onAddDevice }) => {
  const [infraSort, setInfraSort] = useState<SortOrder>('desc');
  const [clientSort, setClientSort] = useState<SortOrder>('desc');
  const [, setTick] = useState(0);

  // Efecto para refrescar los contadores de tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const { infraFaults, clientFaults } = useMemo(() => {
    const infra = devices.filter(d => 
      (d.status === ConnectionStatus.FAULT || d.status === ConnectionStatus.OFFLINE) && 
      (d.type !== DeviceType.TPLINK && d.type !== DeviceType.ODF)
    );
    const clients = devices.filter(d => 
      (d.status === ConnectionStatus.FAULT || d.status === ConnectionStatus.OFFLINE) && 
      d.type === DeviceType.TPLINK
    );
    return { infraFaults: infra, clientFaults: clients };
  }, [devices]);

  const sortDevices = (list: NetworkDevice[], order: SortOrder) => {
    if (order === 'none') return list;
    return [...list].sort((a, b) => {
      if (order === 'desc') return b.latency - a.latency;
      return a.latency - b.latency;
    });
  };

  const infraDevices = useMemo(() => {
    const base = devices.filter(d => d.type !== DeviceType.TPLINK && d.type !== DeviceType.ODF && d.status !== ConnectionStatus.CANCELLED);
    return sortDevices(base, infraSort);
  }, [devices, infraSort]);

  const clientDevices = useMemo(() => {
    const base = devices.filter(d => d.type === DeviceType.TPLINK && d.status !== ConnectionStatus.CANCELLED);
    return sortDevices(base, clientSort);
  }, [devices, clientSort]);

  const renderDeviceList = (deviceList: NetworkDevice[]) => (
    <div className="flex flex-col w-full">
      <div className="grid grid-cols-12 px-5 py-3 bg-slate-900/60 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
        <div className="col-span-4">Equipo / Dirección IP</div>
        <div className="col-span-2 text-center">Nodo</div>
        <div className="col-span-2 text-center">T. Estado</div>
        <div className="col-span-2 text-right">Latencia</div>
        <div className="col-span-2 text-right">Estado</div>
      </div>
      
      <div className="divide-y divide-slate-800/40">
        {deviceList.map(d => {
          const isOnline = d.status === ConnectionStatus.ONLINE;
          const isFault = d.status === ConnectionStatus.FAULT || d.status === ConnectionStatus.OFFLINE;
          const isAdmin = d.status === ConnectionStatus.NON_PAYMENT || d.status === ConnectionStatus.SUSPENDED;

          return (
            <button 
              key={d.id} 
              onClick={() => onSelectDevice(d)}
              className={`grid grid-cols-12 w-full px-5 py-4 items-center hover:bg-indigo-500/10 transition-colors text-left border-l-4 border-transparent hover:border-indigo-500 group ${
                isFault ? 'bg-rose-950/10' : ''
              }`}
            >
              <div className="col-span-4 flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full shrink-0 shadow-sm ${
                  isOnline ? (d.latency < 25 ? 'bg-emerald-500' : 'bg-amber-500') : 
                  isFault ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-indigo-400'
                }`}></div>
                <div className="truncate">
                  <p className={`text-[13px] font-bold truncate leading-none mb-1 ${isFault ? 'text-rose-400' : 'text-slate-100'}`}>
                    {d.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono tracking-tight">{d.ip}</p>
                </div>
              </div>

              <div className="col-span-2 text-center px-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase truncate block">{d.siteName}</span>
              </div>

              <div className="col-span-2 text-center">
                <span className={`text-[10px] font-mono font-bold ${isFault ? 'text-rose-500' : 'text-emerald-500/80'}`}>
                  {formatTimeElapsed(d.statusChangedAt)}
                </span>
              </div>

              <div className="col-span-2 text-right">
                <span className={`text-[12px] font-mono font-black ${
                  d.latency < 25 ? 'text-emerald-500' : 
                  d.latency < 50 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {isOnline ? `${d.latency} ms` : '--'}
                </span>
              </div>

              <div className="col-span-2 flex justify-end">
                 <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-md border ${
                   isFault ? 'border-rose-500/40 text-rose-500 bg-rose-500/10' :
                   isAdmin ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' :
                   'border-emerald-500/30 text-emerald-500/90 bg-emerald-500/5'
                 }`}>
                   {d.status === ConnectionStatus.ONLINE ? 'ACTIVO' : d.status.split('_')[0]}
                 </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-5 animate-in fade-in duration-500 overflow-hidden">
      
      <div className="grid grid-cols-2 gap-5 h-[260px] min-h-[260px]">
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl overflow-hidden flex flex-col shadow-xl">
          <div className="px-5 py-4 bg-rose-500/10 border-b border-rose-500/20 flex justify-between items-center">
            <span className="text-[12px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
              Infraestructura & Nodos Críticos
            </span>
            <span className="text-[11px] font-mono font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">{infraFaults.length} FALLOS NOC</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {infraFaults.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-emerald-500 mb-3" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path></svg>
                <p className="text-[11px] text-emerald-500 font-black uppercase tracking-widest">Todos los nodos operativos</p>
              </div>
            ) : (
              infraFaults.map(d => (
                <button key={d.id} onClick={() => onSelectDevice(d)} className="w-full flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl hover:bg-rose-500/15 transition-all group">
                  <div className="text-left truncate">
                    <p className="text-sm font-black text-rose-400 group-hover:text-rose-300 truncate">{d.name}</p>
                    <p className="text-[11px] text-rose-500 font-mono mt-1 font-bold">CAÍDO HACE: {formatTimeElapsed(d.statusChangedAt)}</p>
                  </div>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-600/10 px-3 py-1.5 rounded-lg border border-rose-600/20">DOWN</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-amber-950/10 border border-amber-500/20 rounded-3xl overflow-hidden flex flex-col shadow-lg">
          <div className="px-5 py-4 bg-amber-500/5 border-b border-amber-500/10 flex justify-between items-center">
            <span className="text-[12px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
              Averías de Clientes CPE
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-500/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">{clientFaults.length} TICKETS</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {clientFaults.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <p className="text-[11px] text-slate-500 font-black uppercase italic tracking-widest">Sin reportes activos en planta</p>
              </div>
            ) : (
              clientFaults.map(d => (
                <button key={d.id} onClick={() => onSelectDevice(d)} className="w-full flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl hover:bg-slate-800/60 transition-all group">
                  <div className="text-left truncate flex-1">
                    <p className="text-[13px] font-bold text-slate-300 group-hover:text-white truncate uppercase tracking-tight">{d.name}</p>
                    <p className="text-[10px] text-rose-500 font-mono italic mt-1 font-bold">OFFLINE: {formatTimeElapsed(d.statusChangedAt)}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] ml-4"></div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-5 min-h-0 overflow-hidden mb-2">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/80">
            <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-32-80a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Z"></path></svg>
              Nodos MikroTik & Core
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={onAddNode} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 group"><svg className="w-4 h-4 group-hover:rotate-90 transition-transform" xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg></button>
              <button onClick={() => setInfraSort(prev => prev === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700/50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Latencia</span><svg className={`w-4 h-4 text-indigo-400 transition-transform ${infraSort === 'asc' ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80a8,8,0,0,1,11.32-11.32L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path></svg></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">{renderDeviceList(infraDevices)}</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/80">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V144H40ZM216,200H40V160H216v40Z"></path></svg>
              CPEs TP-LINK Monitoreados
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={onAddDevice} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 group"><svg className="w-4 h-4 group-hover:rotate-90 transition-transform" xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg></button>
              <button onClick={() => setClientSort(prev => prev === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700/50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Latencia</span><svg className={`w-4 h-4 text-slate-400 transition-transform ${clientSort === 'asc' ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80a8,8,0,0,1,11.32-11.32L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path></svg></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">{renderDeviceList(clientDevices)}</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-10 py-3 border-t border-slate-800/50 bg-slate-950/40 rounded-b-3xl">
         <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Óptimo</span></div>
         <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inestable</span></div>
         <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fallo Técnico</span></div>
         <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.3)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suspendido</span></div>
      </div>
    </div>
  );
};

export default HealthCenter;
