
import React, { useState } from 'react';

interface SiteCreatorProps {
  existingSites: { id: string; name: string }[];
  onSave: (name: string, parentId?: string) => void;
  onClose: () => void;
}

const SiteCreator: React.FC<SiteCreatorProps> = ({ existingSites, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" opacity="0.2"></path><path d="M128,72a8,8,0,0,1,8,8v40h40a8,8,0,0,1,0,16H136v40a8,8,0,0,1-16,0V136H80a8,8,0,0,1,0-16h40V80A8,8,0,0,1,128,72Z"></path></svg>
            Nuevo Nodo de Red
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
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="Ej. Nodo San Vicente"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nodo Superior (Padre)</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              <option value="">Ninguno (Nodo Raíz)</option>
              {existingSites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed italic">
            Al seleccionar un nodo padre, este nuevo sitio se organizará jerárquicamente debajo de él.
          </p>
        </div>
        <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            CANCELAR
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave(name, parentId || undefined)}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            CREAR NODO
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteCreator;
