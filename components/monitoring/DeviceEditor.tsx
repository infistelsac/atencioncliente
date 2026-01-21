
import React, { useState } from 'react';
import { NetworkDevice, DeviceType, ConnectionStatus } from '../../types/monitoring';

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
    links: [...device.links],
    ports: device.ports ? [...device.ports.map(p => ({ ...p }))] : [],
    splitterRatio: device.splitterRatio || '1:8',
    splitterLevel: device.splitterLevel || 1
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
      ports: formData.ports,
      credentials: formData.isReal ? {
        username: formData.username,
        password: formData.password || device.credentials?.password || '',
        apiPort: formData.apiPort,
        useSsl: formData.useSsl,
        lastSync: new Date().toISOString()
      } : undefined,
      splitterRatio: formData.type === DeviceType.SPLITTER ? formData.splitterRatio : undefined,
      splitterLevel: formData.type === DeviceType.SPLITTER ? formData.splitterLevel : undefined
    };
    onSave(updated);
  };

  const addPort = () => {
    let defaultName = `eth${formData.ports.length + 1}`;

    // Naming logic for Splitters
    if (formData.type === DeviceType.SPLITTER) {
      if (formData.ports.length === 0) defaultName = "Input";
      else defaultName = `Output ${formData.ports.length}`;
    }

    const newPort = {
      id: `port-${Date.now()}`,
      name: defaultName,
      status: 'DISCONNECTED' as any
    };
    setFormData({ ...formData, ports: [...formData.ports, newPort] });
  };
  const autoConfigureSplitterPorts = () => {
    if (!window.confirm("Esta acción reemplazará todos los puertos actuales. ¿Desea continuar?")) return;

    const ratioStr = formData.splitterRatio.split(':')[1];
    const outCount = parseInt(ratioStr) || 8;

    const newPorts: typeof formData.ports = [];

    // Input Port
    newPorts.push({
      id: `port-in-${Date.now()}`,
      name: 'Input',
      status: 'DISCONNECTED' as any
    });

    // Output Ports
    for (let i = 1; i <= outCount; i++) {
      newPorts.push({
        id: `port-out-${i}-${Date.now()}`,
        name: `Output ${i}`,
        status: 'DISCONNECTED' as any
      });
    }

    setFormData({ ...formData, ports: newPorts });
  };

  const updatePort = (index: number, updates: any) => {
    const newPorts = [...formData.ports];
    newPorts[index] = { ...newPorts[index], ...updates };
    setFormData({ ...formData, ports: newPorts });
  };

  const removePort = (index: number) => {
    const newPorts = formData.ports.filter((_, i) => i !== index);
    setFormData({ ...formData, ports: newPorts });
  };

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { testMikrotikConnection } = await import('../../services/mikrotikService');
      const result = await testMikrotikConnection({
        host: formData.ip,
        port: formData.apiPort.toString(),
        user: formData.username,
        pass: formData.password || device.credentials?.password || ''
      });
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setIsTesting(false);
    }
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
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Estado Servicio</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ConnectionStatus })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
                  {Object.values(ConnectionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 bg-slate-800/30 p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M208,80H176V48a16,16,0,0,0-16-16H96A16,16,0,0,0,80,48V80H48A16,16,0,0,0,32,96v64a16,16,0,0,0,16,16H80v32a16,16,0,0,0,16,16h64a16,16,0,0,0,16-16V176h32a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80Zm-64,128H112V176h32Zm48-48H160V144a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v16H64V96H96v32a16,16,0,0,0,16,16h32a16,16,0,0,0,16-16V96h32Z"></path></svg>
                Configuración Mikrotik API
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sincronización</span>
                <button
                  onClick={() => setFormData({ ...formData, isReal: !formData.isReal })}
                  className={`w-10 h-5 rounded-full transition-all relative ${formData.isReal ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.isReal ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {formData.isReal && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Usuario API</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Contraseña API</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Puerto API</label>
                    <input
                      type="number"
                      value={formData.apiPort}
                      onChange={e => setFormData({ ...formData, apiPort: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="ssl_edit_chk"
                      checked={formData.useSsl}
                      onChange={e => setFormData({ ...formData, useSsl: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600"
                    />
                    <label htmlFor="ssl_edit_chk" className="text-xs text-slate-400 font-bold uppercase tracking-wider">Usar SSL</label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isTesting ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                      }`}
                  >
                    {isTesting ? (
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm45.17-111.41a8,8,0,0,1,0,11.31l-40,40a8,8,0,0,1-11.31,0l-16-16a8,8,0,1,1,11.31-11.31L128,140.69l34.34-34.35A8,8,0,0,1,173.17,104.59Z"></path></svg>
                    )}
                    {isTesting ? 'Probando...' : 'Probar Conexión'}
                  </button>

                  {testResult && (
                    <div className={`mt-3 p-3 rounded-xl border flex items-center gap-3 text-xs font-bold leading-relaxed animate-in fade-in slide-in-from-top-1 ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                      {testResult.success ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">Gestión de Puertos (ETH)</h4>
              <button
                onClick={addPort}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all"
              >
                + Añadir Puerto
              </button>
            </div>

            <div className="space-y-3">
              {formData.ports.map((port, index) => (
                <div key={port.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex gap-4 items-end animate-in fade-in slide-in-from-top-1">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Nombre</label>
                    <input
                      type="text"
                      value={port.name}
                      onChange={e => updatePort(index, { name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Estado</label>
                    <select
                      value={port.status}
                      onChange={e => updatePort(index, { status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="CONNECTED">CONECTADO</option>
                      <option value="DISCONNECTED">LIBRE</option>
                      <option value="FAULT">FALLA</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Conectado a</label>
                    <select
                      value={port.connectedToDeviceId || ''}
                      onChange={e => updatePort(index, { connectedToDeviceId: e.target.value || undefined })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Ninguno</option>
                      {allDevices.filter(d => d.id !== device.id).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removePort(index)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                  </button>
                </div>
              ))}
              {formData.ports.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No hay puertos configurados</p>
                </div>
              )}
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
                    onChange={e => setFormData({ ...formData, contractedIn: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 text-indigo-400">Subida (UL Mbps)</label>
                  <input
                    type="number"
                    value={formData.contractedOut}
                    onChange={e => setFormData({ ...formData, contractedOut: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>
            </section>
          )}

          {formData.type === DeviceType.SPLITTER && (
            <section className="space-y-4 bg-slate-800/30 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-2 border-slate-500 pl-3">Configuración de Splitter</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nivel Técnico</label>
                  <select value={formData.splitterLevel} onChange={e => setFormData({ ...formData, splitterLevel: parseInt(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none">
                    <option value={1}>Nivel 1 (Primario)</option>
                    <option value={2}>Nivel 2 (Secundario)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Ratio de División</label>
                  <select value={formData.splitterRatio} onChange={e => setFormData({ ...formData, splitterRatio: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none">
                    <option value="1:2">1:2</option>
                    <option value="1:4">1:4</option>
                    <option value="1:8">1:8</option>
                    <option value="1:16">1:16</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={autoConfigureSplitterPorts}
                  className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 hover:border-indigo-500/40"
                >
                  Auto-Configurar Puertos ({formData.splitterRatio})
                </button>
                <p className="text-[9px] text-slate-500 text-center mt-2">Generará 1 puerto Input y {formData.splitterRatio.split(':')[1]} puertos Output</p>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] border-l-2 border-emerald-500 pl-3">Ubicación y Jerarquía</h4>
            <div className="grid grid-cols-2 gap-6">

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tipo de Dispositivo</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as DeviceType })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
                  {Object.values(DeviceType).map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nodo / Sitio</label>
                <select value={formData.siteId} onChange={e => setFormData({ ...formData, siteId: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white">
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
