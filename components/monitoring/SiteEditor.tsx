
import React, { useState } from 'react';

interface SiteEditorProps {
  siteId: string;
  currentName: string;
  currentParentId?: string;
  existingSites: { id: string; name: string }[];
  onSave: (siteId: string, newName: string, parentId?: string) => void;
  onClose: () => void;
}

const SiteEditor: React.FC<SiteEditorProps> = ({ siteId, currentName, currentParentId, existingSites, onSave, onClose }) => {
  const [name, setName] = useState(currentName);
  const [parentId, setParentId] = useState<string>(currentParentId || '');

  const availableParents = existingSites.filter(s => s.id !== siteId);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"></path></svg>
            Editar Nodo de Red
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nombre del Sitio / Ubicación</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="Ej. Nodo Principal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nodo Superior (Padre)</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
            >
              <option value="">Ninguno (Nodo Raíz)</option>
              {availableParents.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Latitud</label>
              <input
                type="number"
                step="0.000001"
                placeholder="-12.0..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                disabled
                title="Edición de coordenadas de sitio en desarrollo"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Longitud</label>
              <input
                type="number"
                step="0.000001"
                placeholder="-77.0..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                disabled
                title="Edición de coordenadas de sitio en desarrollo"
              />
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            CANCELAR
          </button>
          <button
            onClick={() => onSave(siteId, name, parentId || undefined)}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            GUARDAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteEditor;
