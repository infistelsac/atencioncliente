import React, { useState } from 'react';
import { Agent, AgentStatus } from '../types';
import { MoreVertical, Phone, Mail, Shield, ShieldAlert, Plus, Edit2, Trash2, CheckCircle, XCircle, Wrench } from 'lucide-react';

interface AgentManagerProps {
  agents: Agent[];
  onUpdateAgent: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  onAddAgent: (agent: Agent) => void;
}

const AgentManager: React.FC<AgentManagerProps> = ({ agents, onUpdateAgent, onDeleteAgent, onAddAgent }) => {
  const [showModal, setShowModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentRole, setNewAgentRole] = useState<'agent' | 'admin' | 'technician'>('agent');

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.ONLINE: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case AgentStatus.BUSY: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case AgentStatus.OFFLINE: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const newAgent: Agent = {
      id: Date.now().toString(),
      name: newAgentName,
      email: newAgentEmail,
      role: newAgentRole,
      status: AgentStatus.OFFLINE,
      avatar: `https://ui-avatars.com/api/?name=${newAgentName.replace(' ', '+')}&background=random`,
      assignedChats: 0,
      rating: 5.0
    };
    onAddAgent(newAgent);
    setShowModal(false);
    setNewAgentName('');
    setNewAgentEmail('');
    setNewAgentRole('agent');
  };

  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipo de Soporte & Técnicos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los agentes y sus permisos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={18} />
          Nuevo Agente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full">
                <Edit2 size={16} />
              </button>
              <button onClick={() => onDeleteAgent(agent.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm" />
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{agent.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                  {agent.status === AgentStatus.ONLINE && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>}
                  {agent.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <span>{agent.email}</span>
              </div>
              <div className="flex items-center gap-3">
                {agent.role === 'admin' ? <ShieldAlert size={16} className="text-purple-500" /> :
                  agent.role === 'technician' ? <Wrench size={16} className="text-orange-500" /> :
                    <Shield size={16} className="text-blue-500" />}
                <span className="capitalize">{agent.role === 'technician' ? 'Técnico' : agent.role}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase font-semibold">Chats</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{agent.assignedChats}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase font-semibold">Rating</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-1">
                  {agent.rating} <span className="text-yellow-400">★</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase font-semibold">Estado</p>
                <button
                  onClick={() => onUpdateAgent({ ...agent, status: agent.status === AgentStatus.ONLINE ? AgentStatus.BUSY : AgentStatus.ONLINE })}
                  className={`mt-1 p-1 rounded-full ${agent.status === AgentStatus.ONLINE ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 bg-gray-100 dark:bg-gray-700'}`}
                >
                  {agent.status === AgentStatus.ONLINE ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Añadir Nuevo Agente</h2>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                  placeholder="Ej. Ana García"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                  placeholder="ana@soporte.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                <div className="flex gap-2">
                  {(['agent', 'admin', 'technician'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewAgentRole(role)}
                      className={`flex-1 py-2 px-2 rounded-lg border text-sm capitalize transition-all ${newAgentRole === role
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 font-medium'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      {role === 'technician' ? 'Técnico' : role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Crear Agente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManager;