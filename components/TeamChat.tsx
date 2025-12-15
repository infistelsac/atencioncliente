import React, { useState, useEffect, useRef } from 'react';
import { Agent, AgentStatus } from '../types';
import { Hash, Search, Send, Smile, Paperclip, MoreVertical, Phone, Video, Lock, Plus, Edit2, Trash2, X } from 'lucide-react';

interface TeamChatProps {
  agents: Agent[];
  currentAgentId: string; // Simulate "Me"
}

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private';
  unread: number;
}

interface InternalMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

const MOCK_CHANNELS: Channel[] = [
  { id: 'general', name: 'general', type: 'public', unread: 0 },
  { id: 'announcements', name: 'anuncios', type: 'public', unread: 2 },
  { id: 'support-team', name: 'equipo-soporte', type: 'private', unread: 0 },
  { id: 'random', name: 'random', type: 'public', unread: 0 },
];

const MOCK_MESSAGES: Record<string, InternalMessage[]> = {
  'general': [
    { id: '1', senderId: '2', text: '¡Buenos días equipo! ¿Listos para hoy?', timestamp: new Date(Date.now() - 10000000) },
    { id: '2', senderId: '1', text: 'Hola Laura, todo listo por aquí.', timestamp: new Date(Date.now() - 9000000) },
  ],
  'announcements': [
    { id: '3', senderId: '1', text: 'Recordatorio: Mañana hay mantenimiento de servidor a las 3 AM.', timestamp: new Date(Date.now() - 86400000) },
  ]
};

const TeamChat: React.FC<TeamChatProps> = ({ agents, currentAgentId }) => {
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Record<string, InternalMessage[]>>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [channelFormName, setChannelFormName] = useState('');
  const [channelFormType, setChannelFormType] = useState<'public' | 'private'>('public');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activeAgentDM = !activeChannel ? agents.find(a => a.id === activeChannelId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: InternalMessage = {
      id: Date.now().toString(),
      senderId: currentAgentId,
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMessage]
    }));

    setInputText('');

    // Simulate reply if DM
    if (activeAgentDM) {
      setTimeout(() => {
        const reply: InternalMessage = {
          id: (Date.now() + 1).toString(),
          senderId: activeAgentDM.id,
          text: "Entendido, gracias por el mensaje.",
          timestamp: new Date()
        };
        setMessages(prev => ({
          ...prev,
          [activeChannelId]: [...(prev[activeChannelId] || []), reply]
        }));
      }, 3000);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setChannelFormName('');
    setChannelFormType('public');
    setEditingChannel(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (channel: Channel, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setChannelFormName(channel.name);
    setChannelFormType(channel.type);
    setEditingChannel(channel);
    setShowModal(true);
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'create') {
      const newChannel: Channel = {
        id: Date.now().toString(),
        name: channelFormName,
        type: channelFormType,
        unread: 0
      };
      setChannels(prev => [...prev, newChannel]);
    } else if (modalMode === 'edit' && editingChannel) {
      setChannels(prev => prev.map(c => c.id === editingChannel.id ? { ...c, name: channelFormName, type: channelFormType } : c));
    }
    setShowModal(false);
  };

  const handleDeleteChannel = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar este canal?')) {
      setChannels(prev => prev.filter(c => c.id !== channelId));
      if (activeChannelId === channelId) {
        setActiveChannelId('general');
      }
    }
  };

  const getSender = (id: string) => agents.find(a => a.id === id) || { name: 'Desconocido', avatar: '' };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 rounded-l-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">

      {/* Sidebar (Channels & DMs) */}
      <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Sala de Agentes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar canal o agente..."
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Canales</h3>
              <button
                onClick={handleOpenCreateModal}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-green-600 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group relative ${activeChannelId === channel.id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="shrink-0 text-gray-500">
                      {channel.type === 'private' ? <Lock size={14} /> : <Hash size={14} />}
                    </div>
                    <span className="truncate">{channel.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {channel.unread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">{channel.unread}</span>
                    )}
                    <div className="hidden group-hover:flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => handleOpenEditModal(channel, e)}
                        className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-500"
                      >
                        <Edit2 size={12} />
                      </button>
                      {/* Prevent deleting general channel */}
                      {channel.id !== 'general' && (
                        <button
                          onClick={(e) => handleDeleteChannel(channel.id, e)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-500 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DMs Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mensajes Directos</h3>
            </div>
            <div className="space-y-1">
              {agents.filter(a => a.id !== currentAgentId).map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setActiveChannelId(agent.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeChannelId === agent.id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <div className="relative">
                    <img src={agent.avatar} alt={agent.name} className="w-6 h-6 rounded-full object-cover" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${agent.status === AgentStatus.ONLINE ? 'bg-green-500' : agent.status === AgentStatus.BUSY ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
                  </div>
                  <span>{agent.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            {activeChannel ? (
              <>
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300">
                  <Hash size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">#{activeChannel.name}</h3>
                  <p className="text-xs text-gray-500">Canal {activeChannel.type === 'public' ? 'público' : 'privado'}</p>
                </div>
              </>
            ) : activeAgentDM ? (
              <>
                <img src={activeAgentDM.avatar} alt={activeAgentDM.name} className="w-10 h-10 rounded-full" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{activeAgentDM.name}</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> En línea
                  </p>
                </div>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Phone size={20} className="hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
            <Video size={20} className="hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
            <MoreVertical size={20} className="hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-900">
          {(messages[activeChannelId] || []).length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <p className="text-gray-500">No hay mensajes aún. ¡Inicia la conversación!</p>
            </div>
          ) : (
            (messages[activeChannelId] || []).map((msg, idx) => {
              const isMe = msg.senderId === currentAgentId;
              const sender = getSender(msg.senderId);
              const showHeader = idx === 0 || (messages[activeChannelId]![idx - 1].senderId !== msg.senderId);

              return (
                <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} group`}>
                  {showHeader ? (
                    <img src={sender.avatar || `https://ui-avatars.com/api/?name=${sender.name}`} alt={sender.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                  ) : (
                    <div className="w-10"></div>
                  )}
                  <div className={`max-w-[70%]`}>
                    {showHeader && (
                      <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{sender.name || 'Desconocido'}</span>
                        <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={`px-4 py-2 rounded-2xl text-[15px] leading-relaxed shadow-sm ${isMe
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                      }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end bg-gray-100 dark:bg-gray-700/50 p-2 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all">
            <div className="flex pb-2 pl-2 gap-2 text-gray-400">
              <button type="button" className="hover:text-gray-600 dark:hover:text-gray-200"><PlusIcon /></button>
              <button type="button" className="hover:text-gray-600 dark:hover:text-gray-200"><Smile size={20} /></button>
              <button type="button" className="hover:text-gray-600 dark:hover:text-gray-200"><Paperclip size={20} /></button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Mensaje a #${activeChannel ? activeChannel.name : activeAgentDM?.name}`}
              className="flex-1 bg-transparent border-none focus:ring-0 max-h-32 min-h-[40px] py-2 px-3 text-gray-900 dark:text-white resize-none"
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 rounded-lg mb-0.5 ${inputText.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-xs text-center text-gray-400 mt-2">
            <strong>Tip:</strong> Puedes usar @ para mencionar a alguien.
          </div>
        </div>
      </div>

      {/* Channel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'create' ? 'Crear Nuevo Canal' : 'Editar Canal'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Canal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
                  <input
                    type="text"
                    required
                    value={channelFormName}
                    onChange={(e) => setChannelFormName(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                    placeholder="nombre-del-canal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Canal</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChannelFormType('public')}
                    className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${channelFormType === 'public'
                      ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Hash size={16} />
                    Público
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelFormType('private')}
                    className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${channelFormType === 'private'
                      ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Lock size={16} />
                    Privado
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  {modalMode === 'create' ? 'Crear' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for the plus icon
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
)

export default TeamChat;