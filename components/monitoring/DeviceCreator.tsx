
import React, { useState, useEffect, useMemo } from 'react';
import { NetworkDevice, DeviceType, ConnectionStatus, NetworkSite, DeviceTemplate } from '../../types/monitoring';
import { DEVICE_TEMPLATES } from './constants';

interface DeviceCreatorProps {
  existingSites: NetworkSite[];
  allDevices: NetworkDevice[];
  onSave: (device: Partial<NetworkDevice>) => void;
  onClose: () => void;
}

const DeviceCreator: React.FC<DeviceCreatorProps> = ({ existingSites, allDevices, onSave, onClose }) => {
  const [isClient, setIsClient] = useState(false);

  // New state for client type
  const [clientType, setClientType] = useState<'CORPORATE' | 'RESIDENTIAL'>('RESIDENTIAL');

  const [ports, setPorts] = useState<{ name: string; connectedToDeviceId?: string; speed?: string }[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    model: '', // This will now store the selected model name
    ip: '',
    mac: '',
    siteId: existingSites[0]?.id || '',
    type: DeviceType.CORE_ROUTER,
    isReal: false,
    username: 'admin',
    password: '',
    apiPort: 8728,
    useSsl: false,
    latitude: -12.046374,
    longitude: -77.042793
  });

  // Filter available templates based on current mode
  const availableTemplates = useMemo(() => {
    if (isClient) {
      if (clientType === 'CORPORATE') {
        // Corporate Clients: Mikrotik only (appearing as TPLINK type in UI for client logic, but vendor Mikrotik)
        return DEVICE_TEMPLATES.filter(t => t.vendor === 'Mikrotik' && t.type === DeviceType.TPLINK);
      } else {
        // Residential Clients: TP-Link only
        return DEVICE_TEMPLATES.filter(t => t.vendor === 'TP-Link');
      }
    } else {
      // Infrastructure: Filter by selected type (Router, Switch, OLT, Splitter)
      if (formData.type === DeviceType.SPLITTER) {
        return DEVICE_TEMPLATES.filter(t => t.type === DeviceType.SPLITTER);
      }
      return DEVICE_TEMPLATES.filter(t => t.type === formData.type && t.vendor === 'Mikrotik');
    }
  }, [isClient, clientType, formData.type]);

  // Auto-populate ports when model changes
  useEffect(() => {
    const template = DEVICE_TEMPLATES.find(t => t.model === formData.model);
    if (template) {
      const newPorts: { name: string; connectedToDeviceId?: string; speed?: string }[] = [];
      template.ports.forEach(p => {
        for (let i = 1; i <= p.count; i++) {
          newPorts.push({
            name: `${p.prefix}${i}`,
            speed: p.speed
          });
        }
      });
      setPorts(newPorts);
    }
  }, [formData.model]);

  // Reset model when switching types/modes
  useEffect(() => {
    setFormData(prev => ({ ...prev, model: '' }));
  }, [isClient, clientType, formData.type]);

  const handleSave = () => {
    const site = existingSites.find(s => s.id === formData.siteId);

    // Determine firmware and vendor based on selection
    const template = DEVICE_TEMPLATES.find(t => t.model === formData.model);
    const firmware = template?.vendor === 'Mikrotik' ? 'RouterOS 7.x' : 'TP-Link Firmware';

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
      firmware: firmware,
      isReal: formData.isReal,
      latitude: formData.latitude,
      longitude: formData.longitude,
      ports: ports.map((p, i) => ({
        id: `port-${Date.now()}-${i}`,
        name: p.name,
        speed: p.speed,
        status: p.connectedToDeviceId ? 'CONNECTED' : 'DISCONNECTED' as any,
        connectedToDeviceId: p.connectedToDeviceId
      })),
      credentials: formData.isReal ? {
        username: formData.username,
        password: formData.password,
        apiPort: formData.apiPort,
        useSsl: formData.useSsl,
        lastSync: new Date().toISOString()
      } : undefined
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

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
              CLIENTE
            </button>
          </div>

          {/* SUB-TIPO CLIENTE */}
          {isClient && (
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setClientType('RESIDENTIAL')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${clientType === 'RESIDENTIAL' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                RESIDENCIAL (TP-Link)
              </button>
              <button
                onClick={() => setClientType('CORPORATE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${clientType === 'CORPORATE' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                CORPORATIVO (Mikrotik)
              </button>
            </div>
          )}

          {!isClient && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rol del Equipo</label>
              <div className="grid grid-cols-3 gap-2">
                {[DeviceType.CORE_ROUTER, DeviceType.SWITCH, DeviceType.OLT, DeviceType.SPLITTER].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, type })}
                    className={`py-1.5 px-2 text-[9px] font-bold rounded border transition-all ${formData.type === type ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Modelo Hardware</label>
              <select
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                <option value="">Seleccionar Modelo...</option>
                {availableTemplates.map(t => (
                  <option key={t.model} value={t.model}>{t.model} ({t.ports.reduce((a, b) => a + b.count, 0)} puertos)</option>
                ))}
              </select>
              {/* Description hint */}
              {formData.model && (
                <p className="text-[10px] text-indigo-400 italic">
                  {DEVICE_TEMPLATES.find(t => t.model === formData.model)?.description}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nombre Equipo</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder={isClient ? "Cliente_Juan_Perez" : "Router_Core_01"}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dirección IP</label>
              <input
                type="text"
                value={formData.ip}
                onChange={e => setFormData({ ...formData, ip: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder="10.0.X.X"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ubicación (Nodo)</label>
              <select
                value={formData.siteId}
                onChange={e => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                {existingSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {/* Latitud / Longitud */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Latitud</label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude || ''}
                onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder="-12.046374"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Longitud</label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude || ''}
                onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                placeholder="-77.042793"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="real_chk_creator"
              checked={formData.isReal}
              onChange={e => setFormData({ ...formData, isReal: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600"
            />
            <label htmlFor="real_chk_creator" className="text-xs text-slate-300">¿Habilitar Sincronización Real (API)?</label>
          </div>

          {formData.isReal && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Usuario API</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Contraseña API</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Puertos / Conexiones</label>
              <span className="text-[9px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Generado automáticamente por Modelo</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {ports.map((p, i) => (
                <div key={i} className="flex gap-2 items-center bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">
                  <div className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-white">{p.name}</span>
                    {p.speed && <span className="text-[8px] text-slate-500">{p.speed}</span>}
                  </div>

                  <select
                    value={p.connectedToDeviceId || ''}
                    onChange={e => {
                      const next = [...ports];
                      next[i].connectedToDeviceId = e.target.value || undefined;
                      setPorts(next);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white"
                  >
                    <option value="">-- Disponible --</option>
                    {allDevices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>
                    ))}
                  </select>
                </div>
              ))}
              {ports.length === 0 && (
                <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase font-black">Selecciona un modelo para ver puertos</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-800/50 border-t border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            DESCARTAR
          </button>
          <button
            disabled={!formData.name || !formData.ip || !formData.model}
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            GUARDAR EQUIPO
          </button>
        </div>
      </div>
    </div >
  );
};

export default DeviceCreator;
