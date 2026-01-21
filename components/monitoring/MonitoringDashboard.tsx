
import React, { useState, useEffect, useMemo } from 'react';
import { NetworkDevice, DeviceType, ConnectionStatus, PortStatus } from '../../types/monitoring';
import { INITIAL_DEVICES } from './constants';
import StatCard from './StatCard';
import TopologyMap from './TopologyMap';
import DeviceDetails from './DeviceDetails';
import HealthCenter from './HealthCenter';
import SiteCreator from './SiteCreator';
import SiteEditor from './SiteEditor';
import DeviceCreator from './DeviceCreator';
import { NetworkSite } from '../../types/monitoring';
import { databaseService } from '../../services/databaseService';
import { db } from '../../services/firebase';

const MonitoringDashboard: React.FC = () => {
    const [devices, setDevices] = useState<NetworkDevice[]>(INITIAL_DEVICES);
    const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
    const [previewDevice, setPreviewDevice] = useState<NetworkDevice | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set(INITIAL_DEVICES.map(d => d.siteId)));
    const [expandedListSplitters, setExpandedListSplitters] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'HEALTH' | 'MAP'>('HEALTH');

    // Data sync is handled via Firestore
    useEffect(() => {
        if (!db) return;

        const unsubDevices = databaseService.listen('devices', (data) => {
            if (data.length > 0) setDevices(data);
        });

        const unsubSites = databaseService.listen('sites', (data) => {
            if (data.length > 0) setKnownSites(data);
        });

        return () => {
            unsubDevices();
            unsubSites();
        };
    }, []);

    // 2. Poll de estadísticas reales desde el servidor (mantenemos esto para integración legacy)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/monitoring/data');
                const stats = await res.json();

                if (Object.keys(stats).length > 0) {
                    setDevices(prev => prev.map(device => {
                        const deviceStat = stats[device.id];
                        if (deviceStat) {
                            return {
                                ...device,
                                status: deviceStat.status,
                                latency: deviceStat.latency,
                                cpuLoad: deviceStat.cpuLoad || device.cpuLoad,
                                memoryUsage: deviceStat.memoryUsage || device.memoryUsage,
                                uptime: deviceStat.uptime || device.uptime,
                                trafficIn: deviceStat.trafficIn || device.trafficIn,
                                trafficOut: deviceStat.trafficOut || device.trafficOut
                            };
                        }
                        return device;
                    }));
                }
            } catch (err) {
                console.error('Error cargando estadísticas:', err);
            }
        };

        const timer = setInterval(fetchStats, 5000);
        fetchStats();
        return () => clearInterval(timer);
    }, []);

    const [showSiteCreator, setShowSiteCreator] = useState(false);
    const [editingSite, setEditingSite] = useState<NetworkSite | null>(null);
    const [showDeviceCreator, setShowDeviceCreator] = useState(false);

    const [knownSites, setKnownSites] = useState<NetworkSite[]>(() => {
        const sites = new Map<string, string>();
        INITIAL_DEVICES.forEach(d => sites.set(d.siteId, d.siteName));
        return Array.from(sites.entries()).map(([id, name]) => ({ id, name }));
    });

    const resetToHome = () => {
        setSelectedDevice(null);
        setViewMode('HEALTH');
        setSearchQuery('');
    };

    const simulateRandomFailure = () => {
        const candidates = devices.filter(d =>
            d.status === ConnectionStatus.ONLINE &&
            d.type !== DeviceType.ODF
        );
        if (candidates.length === 0) return;
        const randomIdx = Math.floor(Math.random() * candidates.length);
        const target = candidates[randomIdx];
        setDevices(prev => prev.map(d => d.id === target.id ? {
            ...d,
            status: ConnectionStatus.FAULT,
            statusChangedAt: Date.now()
        } : d));
    };

    const handleCreateSite = async (name: string, parentId?: string) => {
        const newSite: NetworkSite = { id: `site-${Date.now()}`, name, parentId };
        if (db) {
            await databaseService.add('sites', newSite);
        } else {
            setKnownSites(prev => [...prev, newSite]);
        }
        setShowSiteCreator(false);
    };

    const handleUpdateSite = async (siteId: string, newName: string, parentId?: string) => {
        if (db) {
            await databaseService.update('sites', siteId, { name: newName, parentId });
        } else {
            setKnownSites(prev => prev.map(s => s.id === siteId ? { ...s, name: newName, parentId } : s));
            setDevices(prev => prev.map(d => d.siteId === siteId ? { ...d, siteName: newName } : d));
        }
        setEditingSite(null);
    };

    const handleCreateDevice = async (deviceData: Partial<NetworkDevice>) => {
        const newDevice = {
            ...deviceData,
            status: ConnectionStatus.ONLINE,
            latency: Math.floor(Math.random() * 15) + 1,
            uptime: '0m',
            statusChangedAt: Date.now(),
            trafficIn: 0,
            trafficOut: 0,
            links: [],
            ports: deviceData.ports || []
        } as NetworkDevice;

        if (newDevice.ports) {
            newDevice.links = newDevice.ports
                .filter(p => p.connectedToDeviceId)
                .map(p => p.connectedToDeviceId as string);
        }

        if (db) {
            await databaseService.add('devices', newDevice);
        } else {
            setDevices(prev => [...prev, newDevice]);
        }

        setShowDeviceCreator(false);

        if (newDevice.siteId) {
            setExpandedSites(prev => new Set(prev).add(newDevice.siteId));
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setDevices(prev => prev.map(d => {
                if (d.status !== ConnectionStatus.ONLINE && d.status !== ConnectionStatus.WARNING) return d;
                return {
                    ...d,
                    latency: Math.max(1, Math.round(d.latency + (Math.random() * 4 - 2))),
                    trafficIn: Math.max(0, d.trafficIn + (Math.random() * 100 - 50)),
                    trafficOut: Math.max(0, d.trafficOut + (Math.random() * 50 - 25))
                };
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => ({
        total: devices.filter(d => d.status !== ConnectionStatus.CANCELLED).length,
        infra: devices.filter(d => d.type !== DeviceType.TPLINK && d.type !== DeviceType.ODF && d.status !== ConnectionStatus.CANCELLED).length,
        cpes: devices.filter(d => d.type === DeviceType.TPLINK && d.status !== ConnectionStatus.CANCELLED).length,
        alerts: devices.filter(d => d.status === ConnectionStatus.OFFLINE || d.status === ConnectionStatus.FAULT).length,
    }), [devices]);

    const groupedDevices = useMemo(() => {
        const groups: Record<string, { name: string, items: NetworkDevice[], hasFault: boolean, parentId?: string }> = {};
        knownSites.forEach(s => {
            groups[s.id] = { name: s.name, items: [], hasFault: false, parentId: s.parentId };
        });
        devices.forEach(d => {
            if (d.status === ConnectionStatus.CANCELLED) return;
            if (!groups[d.siteId]) groups[d.siteId] = { name: d.siteName, items: [], hasFault: false };
            groups[d.siteId].items.push(d);
            if (d.status === ConnectionStatus.FAULT || d.status === ConnectionStatus.OFFLINE) {
                groups[d.siteId].hasFault = true;
                // Propagar falla al padre si existe
                let parentId = groups[d.siteId].parentId;
                while (parentId && groups[parentId]) {
                    groups[parentId].hasFault = true;
                    parentId = groups[parentId].parentId;
                }
            }
        });
        return groups;
    }, [devices, knownSites]);

    const filteredSites = useMemo(() => {
        const entries = Object.entries(groupedDevices) as [string, any][];
        if (!searchQuery) return entries;
        return entries.map(([id, group]) => ({
            id,
            name: group.name,
            items: group.items.filter((d: NetworkDevice) =>
                d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.ip.includes(searchQuery)
            ),
            hasFault: group.hasFault
        })).filter(g => g.items.length > 0).map(g => [g.id, g] as [string, any]);
    }, [groupedDevices, searchQuery]);

    const DeviceSummary: React.FC<{ device: NetworkDevice, onShowFull: () => void, onClose: () => void }> = ({ device, onShowFull, onClose }) => {
        return (
            <div className="absolute top-6 right-6 z-[100] w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-right-10 duration-300">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${device.status === ConnectionStatus.ONLINE ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                        <h3 className="text-white font-black text-[13px] tracking-tight uppercase truncate max-w-[150px]">{device.name}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">Ip Address</span>
                            <span className="text-xs text-white font-mono font-bold leading-none">{device.ip}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">Uptime</span>
                            <span className="text-xs text-emerald-500 font-mono font-bold leading-none">{device.uptime}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Tráfico Actual</span>
                            <span className="text-[9px] font-bold text-indigo-400 font-mono uppercase">Live</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-white font-mono">{(device.trafficIn / 1000).toFixed(1)}<span className="text-[10px] text-slate-500 ml-1">M</span></span>
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,117.66a8,8,0,0,1-11.32,11.32L128,62.63,61.66,128.98a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0Z"></path></svg>
                                    Download
                                </span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-lg font-black text-white font-mono">{(device.trafficOut / 1000).toFixed(1)}<span className="text-[10px] text-slate-500 ml-1">M</span></span>
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter flex items-center gap-1 justify-end">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L128,205.37l66.34-66.35a8,8,0,0,1,11.32,11.32Z"></path></svg>
                                    Upload
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-950/40 border-t border-slate-800">
                    <button
                        onClick={onShowFull}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 border border-indigo-400/20"
                    >
                        Ver Detalles Completo
                    </button>
                </div>
            </div>
        );
    };

    const handleDeleteDevice = (deviceId: string) => {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
        setSelectedDevice(null);
    };

    return (
        <div className="h-full flex flex-col bg-[#05080f] text-slate-400 overflow-hidden select-none text-[13px]">
            {/* HEADER GLOBAL */}
            {!selectedDevice && (
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 z-20 shadow-2xl shrink-0">
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={resetToHome}>
                        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xl shadow-indigo-900/40 group-hover:scale-105 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z"></path></svg>
                        </div>
                        <h1 className="text-base font-black tracking-tight text-white uppercase flex items-center gap-3">
                            NetVision <span className="text-indigo-400 font-mono text-[11px] tracking-normal px-2 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/20">PRO NOC v4.0</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
                            <button onClick={() => setViewMode('HEALTH')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 ${viewMode === 'HEALTH' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>CENTRO DE SALUD</button>
                            <button onClick={() => setViewMode('MAP')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 ${viewMode === 'MAP' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>TOPOLOGÍA DINÁMICA</button>
                        </div>
                        <div className="relative group">
                            <input type="text" placeholder="Buscar por Nombre / IP..." className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-[11px] text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 transition-all group-hover:border-slate-500 shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
                            </div>
                        </div>
                        <button onClick={simulateRandomFailure} className="p-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-500 border border-rose-900/30 rounded-xl transition-all shadow-lg hover:shadow-rose-900/20" title="Trigger Simulation"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M223.32,185.3,160,80.24V40h8a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16h8V80.24l-63.32,105A32,32,0,0,0,60,232H196a32,32,0,0,0,27.32-46.7ZM112,40h32V80H112ZM196,216H60a16,16,0,0,1-13.66-24.3L112,83l32,0,65.66,108.7A16,16,0,0,1,196,216Z"></path></svg></button>
                    </div>
                </header>
            )}

            <main className="flex-1 flex overflow-hidden p-4 gap-4 bg-[#020408] relative">
                {selectedDevice ? (
                    <div className="absolute inset-0 z-50 p-4 animate-in fade-in zoom-in-95 duration-300">
                        <DeviceDetails
                            device={selectedDevice}
                            allDevices={devices}
                            existingSites={knownSites}
                            onUpdateDevice={(d) => {
                                // Reconciliar links automáticamente basado en puertos
                                const updatedWithLinks = { ...d };
                                if (updatedWithLinks.ports) {
                                    updatedWithLinks.links = updatedWithLinks.ports
                                        .filter(p => p.connectedToDeviceId)
                                        .map(p => p.connectedToDeviceId as string);
                                }

                                setDevices(prev => {
                                    const next = prev.map(x => x.id === d.id ? updatedWithLinks : x);

                                    // Sincronización bidireccional simple: si A se conectó a B, B debería listar a A?
                                    // Por ahora solo aseguramos que el equipo editado tenga sus links al día.
                                    return next;
                                });
                                setSelectedDevice(updatedWithLinks);
                            }}
                            onDelete={(deviceId) => handleDeleteDevice(deviceId)}
                            onClose={() => setSelectedDevice(null)}
                        />
                    </div>
                ) : (
                    <>
                        <aside className="w-72 flex flex-col gap-3 overflow-hidden">
                            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl">
                                <div className="p-4 border-b border-slate-800 font-bold text-[10px] uppercase tracking-widest text-slate-500 flex justify-between items-center bg-slate-900/80">
                                    Inventario de Nodos
                                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20">ISP NOC</span>
                                </div>

                                <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-800/50 bg-slate-900/40">
                                    <button
                                        onClick={() => setShowSiteCreator(true)}
                                        className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-slate-800/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all group"
                                    >
                                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Nuevo Nodo</span>
                                    </button>
                                    <button
                                        onClick={() => setShowDeviceCreator(true)}
                                        className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-slate-800/60 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all group"
                                    >
                                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a8,8,0,0,1,8,8v32h32a8,8,0,0,1,0,16H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88A8,8,0,0,1,128,80Z" opacity="0.2"></path><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path></svg>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Nuevo Equipo</span>
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 p-2 custom-scrollbar space-y-2">
                                    {(() => {
                                        const renderSite = (siteId: string, depth = 0) => {
                                            const group = groupedDevices[siteId];
                                            if (!group) return null;
                                            const isExpanded = expandedSites.has(siteId);
                                            const subSites = knownSites.filter(s => s.parentId === siteId);

                                            return (
                                                <div key={siteId} className="group/site">
                                                    <div className={`flex items-center gap-1 ${depth > 0 ? 'ml-4' : ''}`}>
                                                        <button
                                                            onClick={() => { const next = new Set(expandedSites); if (next.has(siteId)) next.delete(siteId); else next.add(siteId); setExpandedSites(next); }}
                                                            className={`flex-1 flex items-center gap-3 p-3 rounded-2xl transition-all border ${isExpanded ? 'bg-slate-800/40 border-slate-700 shadow-sm' : 'border-transparent hover:bg-slate-800/20'} ${group.hasFault ? 'border-rose-900/40 bg-rose-950/15' : ''}`}
                                                        >
                                                            <svg className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-500' : ''}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
                                                            <span className={`text-[11px] font-black flex-1 text-left uppercase truncate tracking-tight ${group.hasFault ? 'text-rose-400' : 'text-slate-300'}`}>{group.name}</span>
                                                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-950/60 px-2 py-0.5 rounded-full border border-white/5">{group.items.length}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingSite({ id: siteId, name: group.name, parentId: group.parentId }); }}
                                                            className="p-2 opacity-0 group-hover/site:opacity-100 text-slate-500 hover:text-white transition-opacity"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
                                                        </button>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className={`mt-2 animate-in slide-in-from-left-1 duration-200 ${depth === 0 ? 'ml-4 border-l-2 border-slate-800/60 pl-3' : 'ml-4 border-l border-slate-800/40 pl-3'}`}>
                                                            {/* Renderizar Sub-Sitios Primero */}
                                                            {subSites.map(sub => renderSite(sub.id, depth + 1))}

                                                            {/* Renderizar Equipos con Agrupación por Splitter */}
                                                            {(() => {
                                                                // Pre-proceso para agrupar clientes bajo splitters
                                                                const rootItems: NetworkDevice[] = [];
                                                                const splitterGroups: Record<string, NetworkDevice[]> = {};

                                                                // Helper para encontrar padre
                                                                const getParentSplitterId = (device: NetworkDevice) => {
                                                                    if (device.type !== DeviceType.TPLINK) return null;
                                                                    for (const linkId of device.links) {
                                                                        const parent = group.items.find(d => d.id === linkId);
                                                                        if (parent && parent.type === DeviceType.SPLITTER) return parent.id;
                                                                    }
                                                                    return null;
                                                                };

                                                                group.items.forEach(d => {
                                                                    if (d.type === DeviceType.TPLINK) {
                                                                        const parentId = getParentSplitterId(d);
                                                                        if (parentId) {
                                                                            if (!splitterGroups[parentId]) splitterGroups[parentId] = [];
                                                                            splitterGroups[parentId].push(d);
                                                                            return;
                                                                        }
                                                                    }
                                                                    rootItems.push(d);
                                                                    if (d.type === DeviceType.SPLITTER) {
                                                                        if (!splitterGroups[d.id]) splitterGroups[d.id] = [];
                                                                    }
                                                                });

                                                                return rootItems.map((d: NetworkDevice) => {
                                                                    const isOnline = d.status === ConnectionStatus.ONLINE;
                                                                    const isSplitter = d.type === DeviceType.SPLITTER;
                                                                    const children = isSplitter ? splitterGroups[d.id] || [] : [];
                                                                    const isSplitterExpanded = expandedListSplitters.has(d.id);

                                                                    const renderDeviceRow = (device: NetworkDevice, isChild = false) => (
                                                                        <button
                                                                            key={device.id}
                                                                            onClick={() => setSelectedDevice(device)}
                                                                            className={`w-full group/item flex items-center justify-between py-2 px-3 rounded-xl text-[10px] font-bold truncate transition-all ${isChild ? 'pl-8 border-l border-slate-800/50' : ''} ${selectedDevice?.id === device.id ? 'bg-indigo-600 text-white shadow-lg' : (device.status === ConnectionStatus.FAULT || device.status === ConnectionStatus.OFFLINE ? 'text-rose-400 bg-rose-900/10' : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-200')}`}
                                                                        >
                                                                            <div className="flex items-center gap-2 truncate flex-1">
                                                                                {device.type === DeviceType.SPLITTER && (
                                                                                    <div
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setExpandedListSplitters(prev => {
                                                                                                const next = new Set(prev);
                                                                                                if (next.has(device.id)) next.delete(device.id);
                                                                                                else next.add(device.id);
                                                                                                return next;
                                                                                            });
                                                                                        }}
                                                                                        className={`p-1 rounded hover:bg-white/20 transition-transform duration-200 ${isSplitterExpanded ? 'rotate-90' : ''}`}
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
                                                                                    </div>
                                                                                )}
                                                                                <span className="truncate">{device.name}</span>
                                                                                {device.type === DeviceType.SPLITTER && children.length > 0 && !isSplitterExpanded && (
                                                                                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400">{children.length}</span>
                                                                                )}
                                                                            </div>

                                                                            {/* Mostrar latencia solo si NO es splitter y estÃ¡ online */}
                                                                            {device.type !== DeviceType.SPLITTER && device.status === ConnectionStatus.ONLINE && (
                                                                                <span className={`text-[9px] font-mono ml-3 ${selectedDevice?.id === device.id ? 'text-white/80' : 'text-indigo-400'}`}>{device.latency}ms</span>
                                                                            )}
                                                                        </button>
                                                                    );

                                                                    if (isSplitter) {
                                                                        return (
                                                                            <div key={d.id} className="flex flex-col">
                                                                                {renderDeviceRow(d)}
                                                                                {isSplitterExpanded && children.map(child => renderDeviceRow(child, true))}
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return renderDeviceRow(d);
                                                                });

                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        };

                                        // Renderizar solo nodos raíz inicialmente
                                        return knownSites
                                            .filter(s => !s.parentId)
                                            .map(s => renderSite(s.id));
                                    })()}
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                            <div className="grid grid-cols-4 gap-4">
                                <StatCard label="Nodos Infra" value={stats.infra} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"></path></svg>} color="blue" />
                                <StatCard label="Abonados Online" value={stats.cpes} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Z"></path></svg>} color="blue" />
                                <StatCard label="Alertas Críticas" value={stats.alerts} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"></path></svg>} color="red" />
                                <StatCard label="Uptime General" value="99.98%" icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M232,128a104,104,0,1,1-104-104A104.11,104.11,0,0,1,232,128Z"></path></svg>} color="green" />
                            </div>

                            <div className="flex-1 overflow-hidden relative">
                                {viewMode === 'HEALTH' ? (
                                    <HealthCenter
                                        devices={devices}
                                        onSelectDevice={setSelectedDevice}
                                        onAddNode={() => setShowSiteCreator(true)}
                                        onAddDevice={() => setShowDeviceCreator(true)}
                                    />
                                ) : (
                                    <TopologyMap
                                        devices={devices}
                                        sites={knownSites}
                                        onSelectDevice={setPreviewDevice}
                                        expandedSites={expandedSites}
                                        onToggleSite={(id) => { const next = new Set(expandedSites); if (next.has(id)) next.delete(id); else next.add(id); setExpandedSites(next); }}
                                        onUpdateDevicePosition={(id, lat, lng) => {
                                            // Check if it's a site (sites in map are prefixed with 'site-')
                                            // However, original IDs in knownSites might already start with 'site-' or not.
                                            // TopologyMap sends back the ID used in the node.
                                            // In TopologyMap: id: `site-${s.id}`.
                                            // Let's strip the prefix if it was added by TopologyMap, OR check if knownSites has the ID.

                                            // Actually, sites in knownSites have unpredictable IDs (e.g. "site-17...").
                                            // TopologyMap constructs nodes with id `site-${s.id}`.
                                            // So if s.id is "site-123", teh node id is "site-site-123".
                                            // Wait, let's check TopologyMap.tsx logic again.
                                            // nodes.push({ ... id: `site-${s.id}`, originalId: s.id ... })
                                            // So the ID passed back here is `site-${s.id}`.
                                            // We need `s.id`.

                                            if (id.startsWith('site-')) {
                                                // Try to find if this corresponds to a known site
                                                // The ID from map is `site-${REAL_ID}`
                                                const realId = id.replace(/^site-/, '');
                                                const siteExists = knownSites.find(s => s.id === realId);

                                                if (siteExists) {
                                                    setKnownSites(prev => prev.map(s => s.id === realId ? { ...s, latitude: lat, longitude: lng } : s));
                                                    return;
                                                }
                                            }

                                            // Fallback to device update
                                            setDevices(prev => prev.map(d => d.id === id ? { ...d, latitude: lat, longitude: lng } : d));
                                        }}
                                        onUpdateLinkRoute={(deviceId, targetId, route) => {
                                            setDevices(prev => prev.map(d => {
                                                if (d.id === deviceId) {
                                                    return {
                                                        ...d,
                                                        linkRoutes: {
                                                            ...(d.linkRoutes || {}),
                                                            [targetId]: route
                                                        }
                                                    };
                                                }
                                                return d;
                                            }));
                                        }}
                                    />
                                )}
                                {previewDevice && (
                                    <DeviceSummary
                                        device={previewDevice}
                                        onShowFull={() => {
                                            setSelectedDevice(previewDevice);
                                            setPreviewDevice(null);
                                        }}
                                        onClose={() => setPreviewDevice(null)}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* FOOTER GLOBAL */}
            {!selectedDevice && (
                <footer className="h-8 border-t border-slate-800 bg-slate-950 px-6 flex items-center justify-between text-[8px] text-slate-500 font-mono uppercase tracking-[0.4em] shrink-0">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div> SISTEMA: OPERATIVO</span>
                        <span>FLUJO DATOS: REAL-TIME</span>
                        <span>NODOS REGISTRADOS: {devices.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-indigo-400 font-black">● NETVISION ISP MONITORING</span>
                        <span className="opacity-40">ESTADO GLOBAL: ESTABLE</span>
                    </div>
                </footer>
            )}

            {showSiteCreator && (
                <SiteCreator existingSites={knownSites} onSave={handleCreateSite} onClose={() => setShowSiteCreator(false)} />
            )}
            {editingSite && (
                <SiteEditor
                    siteId={editingSite.id}
                    currentName={editingSite.name}
                    currentParentId={editingSite.parentId}
                    existingSites={knownSites}
                    onSave={handleUpdateSite}
                    onClose={() => setEditingSite(null)}
                />
            )}
            {showDeviceCreator && (
                <DeviceCreator
                    existingSites={knownSites}
                    allDevices={devices}
                    onSave={handleCreateDevice}
                    onClose={() => setShowDeviceCreator(false)}
                />
            )}
        </div>
    );
};

export default MonitoringDashboard;
