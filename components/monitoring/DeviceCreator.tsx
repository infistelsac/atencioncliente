
import React, { useState } from 'react';
import { NetworkDevice, DeviceType, ConnectionStatus } from '../../types/monitoring';

interface DeviceCreatorProps {
  existingSites: { id: string, name: string }[];
  onSave: (device: Partial<NetworkDevice>) => void;
  onClose: () => void;
}

const DeviceCreator: React.FC<DeviceCreatorProps> = ({ existingSites, onSave, onClose }) => {
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    ip: '',
    mac: '',
    siteId: existingSites[0]?.id || '',
    type: DeviceType.CORE_ROUTER,
    isReal: false
  });

  const handleSave = () => {
    const site = existingSites.find(s => s.id === formData.siteId);
    const newDevice: Partial<NetworkDevice> = {
      id: `dev-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      model: formData.model,
      ip: formData.ip,
      mac: formData.mac,
      type: isClient ? DeviceType.TPLINK : formData.type,
      siteId: formData.siteId,
      siteName: site?.name || 'Sin Sitio',
      status: ConnectionStatus.ONLINE,
      latency: Math.floor(Math.random() * 20) + 1,
      uptime: '0m',
      trafficIn: 0,
      trafficOut: 0,
      links: [],
      firmware: isClient ? 'TP-Link Firmware' : 'RouterOS',
      isReal: formData.isReal
    };
    onSave(newDevice);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" opacity="0.2"></path><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z"></path></svg>
               Añadir Nuevo Equipo
            </h3>
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">Configuración de Hardware</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* TIPO DE EQUIPO */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => setIsClient(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${!isClient ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              INFRAESTRUCTURA
            </button>
            <button 
              onClick={() => setIsClient(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${isClient ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              CLIENTE (TP-LINK)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nombre Equipo</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder={isClient ? "Cliente_Juan_Perez" : "Router_Core_01"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Modelo Hardware</label>
              <input 
                type="text" 
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder={isClient ? "Archer C6" : "CCR2216"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dirección IP</label>
              <input 
                type="text" 
                value={formData.ip}
                onChange={e => setFormData({...formData, ip: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder="10.0.X.X"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ubicación (Nodo)</label>
              <select 
                value={formData.siteId}
                onChange={e => setFormData({...formData, siteId: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                {existingSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {!isClient && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rol del Equipo</label>
              <div className="grid grid-cols-3 gap-2">
                {[DeviceType.CORE_ROUTER, DeviceType.SWITCH, DeviceType.OLT, DeviceType.GATEWAY].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({...formData, type})}
                    className={`py-1.5 px-2 text-[9px] font-bold rounded border transition-all ${formData.type === type ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="real_chk"
              checked={formData.isReal}
              onChange={e => setFormData({...formData, isReal: e.target.checked})}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600"
            />
            <label htmlFor="real_chk" className="text-xs text-slate-300">¿Habilitar Sincronización Real (API)?</label>
          </div>
        </div>

        <div className="p-6 bg-slate-800/50 border-t border-slate-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
          >
            DESCARTAR
          </button>
          <button 
            disabled={!formData.name || !formData.ip}
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
          >
            GUARDAR EQUIPO
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceCreator;
