import React, { useState, useEffect } from 'react';
import { Maintenance, Contact, Agent } from '../types';
import { Truck, Calendar, Clock, MapPin, User, AlertTriangle, CheckCircle, XCircle, Plus, Search, Filter, Wrench, ChevronDown, Map as MapIcon, X, Globe, Activity, Server, Radio } from 'lucide-react';

interface MaintenanceManagerProps {
    agents: Agent[];
    onClearSelection?: () => void;
}

const MOCK_MAINTENANCE: Maintenance[] = [
    {
        id: 'm1',
        type: 'node',
        pointIdentifier: 'Nodo Norte - N12',
        address: 'Av. Insurgentes Norte 1200, CDMX',
        coordinates: { lat: 19.4786, lng: -99.1332 },
        date: new Date(Date.now() + 86400000), // Tomorrow
        technicianId: '4', // Pedro Tech
        technicianName: 'Pedro Tech',
        reason: 'Mantenimiento preventivo de baterías',
        status: 'scheduled',
        priority: 'high'
    },
    {
        id: 'm2',
        type: 'central',
        pointIdentifier: 'Central Principal',
        address: 'Calle 100 #15-20, Bogotá',
        date: new Date(Date.now() - 3600000), // 1 hour ago
        technicianId: '2',
        technicianName: 'Carlos Ruiz',
        reason: 'Falla en aire acondicionado sala de servidores',
        status: 'in-progress',
        priority: 'urgent'
    },
    {
        id: 'm3',
        type: 'fiber_trunk',
        pointIdentifier: 'Troncal T-45 (Sur)',
        address: 'Carretera Picacho Ajusco Km 5',
        date: new Date(Date.now() - 86400000 * 2), // 2 days ago
        technicianId: '4',
        technicianName: 'Pedro Tech',
        reason: 'Revisión por atenuación en fibra',
        status: 'completed',
        priority: 'normal'
    }
];

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({ agents }) => {
    const [maintenanceTasks, setMaintenanceTasks] = useState<Maintenance[]>(MOCK_MAINTENANCE);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed'>('all');

    const technicians = agents.filter(a => a.role === 'technician');

    // Form State
    const [type, setType] = useState<'node' | 'central' | 'fiber_trunk'>('node');
    const [pointIdentifier, setPointIdentifier] = useState('');
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | undefined>(undefined);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [technicianId, setTechnicianId] = useState('');
    const [reason, setReason] = useState('');
    const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

    // Map Picker State
    const [showMapPicker, setShowMapPicker] = useState(false);

    useEffect(() => {
        if (!technicianId && technicians.length > 0) {
            setTechnicianId(technicians[0].id);
        }
    }, [technicians, technicianId]);

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setType('node');
        setPointIdentifier('');
        setAddress('');
        setCoordinates(undefined);
        setDate('');
        setTime('');
        setReason('');
        setPriority('normal');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const tech = technicians.find(t => t.id === technicianId);
        const scheduledDate = new Date(`${date}T${time}`);

        const newTask: Maintenance = {
            id: Date.now().toString(),
            type,
            pointIdentifier,
            address,
            coordinates,
            date: scheduledDate,
            technicianId,
            technicianName: tech?.name || 'Desconocido',
            reason,
            status: 'scheduled',
            priority
        };

        setMaintenanceTasks([newTask, ...maintenanceTasks]);
        handleCloseModal();
    };

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Mock converting pixels to Lat/Lng
        const lat = 19.4326 + (0.5 - y / rect.height) * 0.1;
        const lng = -99.1332 + (x / rect.width - 0.5) * 0.1;

        setCoordinates({ lat, lng });
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)} (Seleccionado en mapa)`);
    };

    const openGoogleMaps = (coords: { lat: number, lng: number }) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank');
    };

    const getStatusColor = (status: Maintenance['status']) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        }
    };

    const getPriorityColor = (prio: Maintenance['priority']) => {
        switch (prio) {
            case 'urgent': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const getTypeIcon = (type: Maintenance['type']) => {
        switch (type) {
            case 'node': return <Radio size={20} className="text-purple-600" />;
            case 'central': return <Server size={20} className="text-blue-600" />;
            case 'fiber_trunk': return <Activity size={20} className="text-orange-600" />;
        }
    };

    const filteredTasks = maintenanceTasks.filter(v => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'completed') return v.status === 'completed' || v.status === 'cancelled';
        return v.status === 'scheduled' || v.status === 'in-progress';
    });

    return (
        <div className="p-6 lg:p-10 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wrench className="text-blue-600 dark:text-blue-400" />
                        Mantenimiento
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de maintenance de Nodos, Centrales y Troncales.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Programar Mantenimiento
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Pendientes</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{maintenanceTasks.filter(v => v.status === 'scheduled').length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">En Curso</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{maintenanceTasks.filter(v => v.status === 'in-progress').length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Urgentes</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{maintenanceTasks.filter(v => v.priority === 'urgent' && v.status !== 'completed').length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Completados</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{maintenanceTasks.filter(v => v.status === 'completed').length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setFilterStatus('scheduled')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'scheduled' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    Activas
                </button>
                <button
                    onClick={() => setFilterStatus('completed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'completed' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    Historial
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTasks.map(task => (
                    <div key={task.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                                    {getTypeIcon(task.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{task.pointIdentifier}</h3>
                                    <p className="text-xs text-gray-500 capitalize">{task.type.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getPriorityColor(task.priority)} uppercase`}>
                                {task.priority}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <MapPin size={16} className="text-gray-400" />
                                <span className="truncate">{task.address}</span>
                                {task.coordinates && (
                                    <button
                                        onClick={() => openGoogleMaps(task.coordinates!)}
                                        className="text-blue-500 hover:text-blue-600 ml-auto"
                                        title="Ver en Google Maps"
                                    >
                                        <Globe size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <Clock size={16} className="text-gray-400" />
                                <span>{task.date.toLocaleDateString()} - {task.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <User size={16} className="text-gray-400" />
                                <span>Téc. {task.technicianName}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mb-4">
                            <p className="text-sm text-gray-700 dark:text-gray-200 italic">"{task.reason}"</p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)} uppercase tracking-wide`}>
                                {task.status === 'in-progress' ? 'En Curso' : task.status === 'scheduled' ? 'Programada' : task.status === 'completed' ? 'Completada' : 'Cancelada'}
                            </span>
                            <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Programar Mantenimiento</h2>
                                <p className="text-sm text-gray-500">Asigna un técnico para mantenimiento de infraestructura.</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Infraestructura</label>
                                    <div className="relative">
                                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none">
                                            <option value="node">Nodo</option>
                                            <option value="central">Central</option>
                                            <option value="fiber_trunk">Troncal de Fibra</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Identificador / Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={pointIdentifier}
                                        onChange={e => setPointIdentifier(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Ej. Nodo Norte, Troncal 45..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación</label>
                                    <div className="relative flex gap-2">
                                        <div className="relative flex-1">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={address}
                                                onChange={e => setAddress(e.target.value)}
                                                placeholder="Dirección o punto de referencia"
                                                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowMapPicker(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                                            title="Seleccionar en Mapa"
                                        >
                                            <MapIcon size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora</label>
                                    <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Técnico Asignado</label>
                                    <div className="relative">
                                        <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none">
                                            <option value="">Seleccionar Técnico</option>
                                            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                                    <div className="relative">
                                        <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none">
                                            <option value="normal">Normal</option>
                                            <option value="high">Alta</option>
                                            <option value="urgent">Urgente</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalle del Mantenimiento</label>
                                    <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Describa el trabajo a realizar..."></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Programar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Map Picker Modal */}
            {showMapPicker && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col h-[600px]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <MapIcon className="text-blue-600" size={24} />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Seleccionar Ubicación</h2>
                            </div>
                            <button
                                onClick={() => setShowMapPicker(false)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Map Simulation Container */}
                        <div className="flex-1 relative bg-blue-50 cursor-crosshair overflow-hidden group" onClick={handleMapClick}>
                            {/* Static Map Image Background */}
                            <div className="absolute inset-0 opacity-80" style={{
                                backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Map_of_Mexico_City_delegaciones.svg/1200px-Map_of_Mexico_City_delegaciones.svg.png')",
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}></div>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                                <span className="text-4xl font-bold text-gray-600 uppercase -rotate-12 select-none">Simulación de Mapa</span>
                            </div>

                            {/* Pin */}
                            {coordinates && (
                                <div
                                    className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 ease-out"
                                    style={{
                                        left: '50%', // Centered for demo visual, in reality coordinates drive position
                                        top: '50%'
                                    }}
                                >
                                    <MapPin size={48} className="text-red-600 drop-shadow-lg fill-red-600" />
                                </div>
                            )}

                            <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    {coordinates
                                        ? `Coordenadas: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
                                        : "Haz clic en el mapa para colocar un marcador"}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-800 rounded-b-2xl">
                            <button
                                onClick={() => setShowMapPicker(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setShowMapPicker(false)}
                                disabled={!coordinates}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Ubicación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceManager;