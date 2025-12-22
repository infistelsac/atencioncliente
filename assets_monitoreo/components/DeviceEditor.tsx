
import React, { useState } from 'react';
import { NetworkDevice, DeviceType, ConnectionStatus } from '../types';

interface DeviceEditorProps {
  device: NetworkDevice;
  allDevices: NetworkDevice[];
  existingSites: { id: string, name: string }[];
  onSave: (updatedDevice: NetworkDevice) => void;
  onClose: () => void;
}

const DeviceEditor: React.FC<DeviceEditorProps> = ({ device, allDevices, existingSites, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: device.name,
    model: device.model,
    ip: device.ip,
    mac: device.mac,
    type: device.type,
    siteId: device.siteId,
    status: device.status,
    contractedIn: device.contractedIn || 0,
    contractedOut: device.contractedOut || 0,
    username: device.credentials?.username || 'admin',
    password: '',
    apiPort: device.credentials?.apiPort || (device.type === DeviceType.TPLINK ? 80 : 8728),
    useSsl: device.credentials?.useSsl || false,
    isReal: device.isReal || false,
    links: [...device.links]
  });
  
  const handleSave = () => {
    const site = existingSites.find(s => s.id === formData.siteId);
    const updated: NetworkDevice = {
      ...device,
      name: formData.name,
      model: formData.model,
      ip: formData.ip,
      mac: formData.mac,
      type: formData.type,
      siteId: formData.siteId,
      status: formData.status,
      siteName: site?.name || device.siteName,
      contractedIn: formData.contractedIn,
      contractedOut: formData.contractedOut,
      isReal: formData.isReal,
      links: formData.links,
      credentials: formData.isReal ? {
        username: formData.username,
        password: formData.password || device.credentials?.password || '',
        apiPort: formData.apiPort,
        useSsl: formData.useSsl,
        lastSync: new Date().toISOString()
      } : undefined
    };
    onSave(updated);
  };

  const isClient = formData.type === DeviceType.TPLINK;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-600 shadow-xl shadow-black/40`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight">Gestión de Dispositivo</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">{device.ip}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">Identidad y Red</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nombre</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Estado Servicio</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ConnectionStatus})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
                  {Object.values(ConnectionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          {isClient && (
            <section className="space-y-4 bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/20">
              <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z"></path></svg>
                 Configuración del Plan (Megas)
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 text-emerald-500">Bajada (DL Mbps)</label>
                  <input 
                    type="number" 
                    value={formData.contractedIn} 
                    onChange={e => setFormData({...formData, contractedIn: parseInt(e.target.value) || 0})} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 text-indigo-400">Subida (UL Mbps)</label>
                  <input 
                    type="number" 
                    value={formData.contractedOut} 
                    onChange={e => setFormData({...formData, contractedOut: parseInt(e.target.value) || 0})} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] border-l-2 border-emerald-500 pl-3">Ubicación y Jerarquía</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tipo de Dispositivo</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as DeviceType})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
                  {Object.values(DeviceType).map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nodo / Sitio</label>
                <select value={formData.siteId} onChange={e => setFormData({...formData, siteId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
                  {existingSites.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-slate-800/50 border-t border-slate-800 flex gap-4">
          <button onClick={onClose} className="flex-1 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all">CANCELAR</button>
          <button onClick={handleSave} className="flex-1 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-500/20">GUARDAR CAMBIOS</button>
        </div>
      </div>
    </div>
  );
};

export default DeviceEditor;
